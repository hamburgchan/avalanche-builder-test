// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AvaxGuard
 * @notice On-Chain Financial Policy Engine for Autonomous AI Agents.
 * @dev Enforces programmable spending guardrails (budget, max per tx, daily limit, expiry, merchant allowlist, replay protection).
 */
contract AvaxGuard {
    enum BlockReason {
        NONE,                       // 0: All policy rules passed
        POLICY_INACTIVE,            // 1: Policy revoked or not active
        POLICY_EXPIRED,             // 2: Exceeded expiry timestamp
        REQUEST_ALREADY_EXECUTED,   // 3: RequestId already executed (Replay protection)
        MERCHANT_NOT_ALLOWED,       // 4: Recipient not in owner allowlist
        PER_TX_LIMIT_EXCEEDED,      // 5: Exceeded max amount per transaction
        DAILY_LIMIT_EXCEEDED,       // 6: Exceeded daily spending limit
        INSUFFICIENT_BUDGET         // 7: Exceeded remaining policy budget
    }

    struct SpendingPolicy {
        address owner;             // Human controller
        address agent;             // Authorized Agent Scoped Wallet
        uint256 totalBudget;       // Initial principal budget (Wei)
        uint256 remainingBudget;   // Remaining spendable budget (Wei)
        uint256 maxPerTx;          // Hard cap per transaction (Wei)
        uint256 dailyLimit;        // Daily spend limit (Wei)
        uint256 dailySpent;        // Cumulative spend for current day (Wei)
        uint256 dayIndex;          // UTC day index (block.timestamp / 1 days)
        uint256 expiry;            // Expiry timestamp (Unix timestamp)
        bool active;               // Policy active flag
    }

    // Owner -> Agent -> Policy
    mapping(address => mapping(address => SpendingPolicy)) public policies;

    // Owner -> Agent -> Merchant -> Allowed
    mapping(address => mapping(address => mapping(address => bool))) public allowedMerchants;

    // Agent -> Active Owner (1:1 active mapping)
    mapping(address => address) public activeOwnerOfAgent;

    // Strict One Agent = One Policy Lifecycle tracker
    mapping(address => bool) public agentEverBound;

    // Replay Protection for executed spend intents
    mapping(bytes32 => bool) public executedRequests;

    // Reentrancy Guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // Events (Strictly <= 3 indexed parameters)
    event PolicyCreated(
        address indexed owner,
        address indexed agent,
        uint256 totalBudget,
        uint256 maxPerTx,
        uint256 dailyLimit,
        uint256 expiry,
        address initialMerchant
    );

    event PaymentExecuted(
        address indexed agent,
        address indexed recipient,
        bytes32 indexed requestId,
        address owner,
        uint256 amount,
        uint256 remainingBudget
    );

    event PaymentBlocked(
        address indexed agent,
        address indexed recipient,
        bytes32 indexed requestId,
        address owner,
        uint256 attemptedAmount,
        BlockReason reason
    );

    event MerchantAllowlistUpdated(
        address indexed owner,
        address indexed agent,
        address indexed merchant,
        bool allowed
    );

    event PolicyRevoked(
        address indexed owner,
        address indexed agent,
        uint256 refundAmount
    );

    // Errors
    error UnauthorizedAgent();
    error UnauthorizedOwner();
    error AgentAlreadyBound();
    error AgentAlreadyUsed();
    error PolicyAlreadyExists();
    error PolicyNotActive();
    error InvalidRecipient();
    error InvalidAmount();
    error TransferFailed();

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Human creates and funds an on-chain spending policy for an agent
     */
    function createPolicy(
        address _agent,
        address _initialMerchant,
        uint256 _maxPerTx,
        uint256 _dailyLimit,
        uint256 _duration
    ) external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();
        if (_agent == address(0) || _initialMerchant == address(0)) revert InvalidRecipient();
        if (_maxPerTx == 0 || _maxPerTx > msg.value) revert InvalidAmount();
        if (_dailyLimit == 0 || _dailyLimit > msg.value) revert InvalidAmount();
        if (_duration == 0) revert InvalidAmount();

        // Enforce 1 Agent = 1 Policy Lifecycle
        if (agentEverBound[_agent]) revert AgentAlreadyUsed();
        if (activeOwnerOfAgent[_agent] != address(0)) revert AgentAlreadyBound();

        SpendingPolicy storage existing = policies[msg.sender][_agent];
        if (existing.active || existing.remainingBudget > 0) revert PolicyAlreadyExists();

        agentEverBound[_agent] = true;
        activeOwnerOfAgent[_agent] = msg.sender;

        policies[msg.sender][_agent] = SpendingPolicy({
            owner: msg.sender,
            agent: _agent,
            totalBudget: msg.value,
            remainingBudget: msg.value,
            maxPerTx: _maxPerTx,
            dailyLimit: _dailyLimit,
            dailySpent: 0,
            dayIndex: block.timestamp / 1 days,
            expiry: block.timestamp + _duration,
            active: true
        });

        allowedMerchants[msg.sender][_agent][_initialMerchant] = true;

        emit PolicyCreated(
            msg.sender,
            _agent,
            msg.value,
            _maxPerTx,
            _dailyLimit,
            block.timestamp + _duration,
            _initialMerchant
        );
        emit MerchantAllowlistUpdated(msg.sender, _agent, _initialMerchant, true);
    }

    /**
     * @notice Internal unified evaluation engine returning (allowed, reason, checksPassed bitmask)
     */
    function _evaluateSpend(
        SpendingPolicy storage policy,
        address owner,
        address agent,
        address recipient,
        uint256 amount,
        bytes32 requestId
    ) internal view returns (bool allowed, BlockReason reason, uint256 checksPassed) {
        uint256 passed = 0;

        // Bit 0: Policy Active
        if (policy.active) {
            passed |= (1 << 0);
        } else {
            return (false, BlockReason.POLICY_INACTIVE, passed);
        }

        // Bit 1: Not Expired
        if (block.timestamp <= policy.expiry) {
            passed |= (1 << 1);
        } else {
            return (false, BlockReason.POLICY_EXPIRED, passed);
        }

        // Bit 2: Request Fresh (Nonce unconsumed)
        if (!executedRequests[requestId]) {
            passed |= (1 << 2);
        } else {
            return (false, BlockReason.REQUEST_ALREADY_EXECUTED, passed);
        }

        // Bit 3: Merchant Allowed
        if (allowedMerchants[owner][agent][recipient]) {
            passed |= (1 << 3);
        } else {
            return (false, BlockReason.MERCHANT_NOT_ALLOWED, passed);
        }

        // Bit 4: Per-Tx Limit Check
        if (amount <= policy.maxPerTx) {
            passed |= (1 << 4);
        } else {
            return (false, BlockReason.PER_TX_LIMIT_EXCEEDED, passed);
        }

        // Bit 5: Daily Limit Check (UTC Day Bucket)
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentDailySpent = (currentDay == policy.dayIndex) ? policy.dailySpent : 0;
        if (currentDailySpent + amount <= policy.dailyLimit) {
            passed |= (1 << 5);
        } else {
            return (false, BlockReason.DAILY_LIMIT_EXCEEDED, passed);
        }

        // Bit 6: Remaining Budget Check
        if (amount <= policy.remainingBudget) {
            passed |= (1 << 6);
        } else {
            return (false, BlockReason.INSUFFICIENT_BUDGET, passed);
        }

        return (true, BlockReason.NONE, passed);
    }

    /**
     * @notice View function for previewing full Policy Decision Trace on-chain
     */
    function evaluateSpend(
        address owner,
        address agent,
        address recipient,
        uint256 amount,
        bytes32 requestId
    ) external view returns (bool allowed, BlockReason reason, uint256 checksPassed) {
        SpendingPolicy storage policy = policies[owner][agent];
        return _evaluateSpend(policy, owner, agent, recipient, amount, requestId);
    }

    /**
     * @notice Agent autonomously attempts to execute payment within policy boundaries
     */
    function attemptSpend(
        address payable recipient,
        uint256 amount,
        bytes32 requestId
    ) external nonReentrant {
        address owner = activeOwnerOfAgent[msg.sender];
        if (owner == address(0)) revert UnauthorizedAgent();
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();

        SpendingPolicy storage policy = policies[owner][msg.sender];

        (bool allowed, BlockReason reason, ) = _evaluateSpend(
            policy,
            owner,
            msg.sender,
            recipient,
            amount,
            requestId
        );

        // Policy Blocked branch: emit event, do NOT transfer, do NOT revert
        if (!allowed) {
            emit PaymentBlocked(msg.sender, recipient, requestId, owner, amount, reason);
            return;
        }

        // Policy Approved branch: CEI pattern
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay != policy.dayIndex) {
            policy.dayIndex = currentDay;
            policy.dailySpent = 0;
        }

        policy.dailySpent += amount;
        policy.remainingBudget -= amount;
        executedRequests[requestId] = true;

        (bool sent, ) = recipient.call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit PaymentExecuted(msg.sender, recipient, requestId, owner, amount, policy.remainingBudget);
    }

    /**
     * @notice Human owner updates merchant allowlist for active policy
     */
    function setMerchantAllowlist(address _agent, address _merchant, bool _allowed) external {
        if (_merchant == address(0)) revert InvalidRecipient();
        SpendingPolicy storage policy = policies[msg.sender][_agent];
        if (policy.owner != msg.sender) revert UnauthorizedOwner();
        if (!policy.active) revert PolicyNotActive();

        allowedMerchants[msg.sender][_agent][_merchant] = _allowed;
        emit MerchantAllowlistUpdated(msg.sender, _agent, _merchant, _allowed);
    }


    /**
     * @notice Human owner revokes policy, deactivates agent, and reclaims remaining funds
     */
    function revokePolicy(address _agent) external nonReentrant {
        SpendingPolicy storage policy = policies[msg.sender][_agent];
        if (policy.owner != msg.sender) revert UnauthorizedOwner();
        if (!policy.active && policy.remainingBudget == 0) revert PolicyNotActive();

        uint256 refundAmount = policy.remainingBudget;
        policy.active = false;
        policy.remainingBudget = 0;
        delete activeOwnerOfAgent[_agent];

        if (refundAmount > 0) {
            (bool sent, ) = payable(msg.sender).call{value: refundAmount}("");
            if (!sent) revert TransferFailed();
        }

        emit PolicyRevoked(msg.sender, _agent, refundAmount);
    }
}
