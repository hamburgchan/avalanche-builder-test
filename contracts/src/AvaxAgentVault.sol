// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AvaxAgentVault
 * @notice High-speed Autonomous AI Agent Micro-Payment & Task Verification Hub on Avalanche.
 * @dev Leverages Avalanche's sub-second finality and low transaction fees for real-time agent settlements.
 */
contract AvaxAgentVault {
    struct Task {
        bytes32 taskId;
        address client;
        address agent;
        uint256 reward;
        string taskPrompt;
        string resultHash;
        uint256 createdAt;
        uint256 completedAt;
        bool isCompleted;
    }

    address public owner;
    uint256 public totalTasksCompleted;
    uint256 public totalSettledAmount;

    mapping(bytes32 => Task) public tasks;
    mapping(address => uint256) public clientDeposits;
    mapping(address => uint256) public agentEarnings;

    event Deposit(address indexed client, uint256 amount);
    event TaskCreated(bytes32 indexed taskId, address indexed client, address indexed agent, uint256 reward, string taskPrompt);
    event TaskCompleted(bytes32 indexed taskId, address indexed agent, uint256 reward, string resultHash, uint256 latencyMs);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Clients deposit AVAX into the vault to fund agent tasks
    function deposit() external payable {
        require(msg.value > 0, "Must deposit positive amount");
        clientDeposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Create a task delegated to a specific AI Agent
    function createTask(bytes32 taskId, address agent, uint256 reward, string calldata taskPrompt) external {
        require(tasks[taskId].createdAt == 0, "Task already exists");
        require(reward > 0, "Reward must be > 0");
        require(clientDeposits[msg.sender] >= reward, "Insufficient deposit balance");
        require(agent != address(0), "Invalid agent address");

        clientDeposits[msg.sender] -= reward;
        tasks[taskId] = Task({
            taskId: taskId,
            client: msg.sender,
            agent: agent,
            reward: reward,
            taskPrompt: taskPrompt,
            resultHash: "",
            createdAt: block.timestamp,
            completedAt: 0,
            isCompleted: false
        });

        emit TaskCreated(taskId, msg.sender, agent, reward, taskPrompt);
    }

    /// @notice Fast settlement: Agent submits completion proof and claims micro-payment
    function completeTask(bytes32 taskId, string calldata resultHash, uint256 latencyMs) external {
        Task storage task = tasks[taskId];
        require(task.createdAt > 0, "Task does not exist");
        require(!task.isCompleted, "Task already settled");
        require(msg.sender == task.agent || msg.sender == task.client, "Unauthorized completion");

        task.isCompleted = true;
        task.completedAt = block.timestamp;
        task.resultHash = resultHash;

        agentEarnings[task.agent] += task.reward;
        totalTasksCompleted += 1;
        totalSettledAmount += task.reward;

        // Instant payout to agent
        (bool sent, ) = payable(task.agent).call{value: task.reward}("");
        require(sent, "AVAX transfer failed");

        emit TaskCompleted(taskId, task.agent, task.reward, resultHash, latencyMs);
    }

    /// @notice One-step Direct Micro-Payment for instant agent query settlement
    function directMicroPay(address agent, string calldata taskPrompt, string calldata resultHash, uint256 latencyMs) external payable {
        require(msg.value > 0, "Micro-payment required");
        require(agent != address(0), "Invalid agent");

        bytes32 taskId = keccak256(abi.encodePacked(msg.sender, agent, block.timestamp, taskPrompt));
        tasks[taskId] = Task({
            taskId: taskId,
            client: msg.sender,
            agent: agent,
            reward: msg.value,
            taskPrompt: taskPrompt,
            resultHash: resultHash,
            createdAt: block.timestamp,
            completedAt: block.timestamp,
            isCompleted: true
        });

        agentEarnings[agent] += msg.value;
        totalTasksCompleted += 1;
        totalSettledAmount += msg.value;

        (bool sent, ) = payable(agent).call{value: msg.value}("");
        require(sent, "AVAX transfer failed");

        emit TaskCreated(taskId, msg.sender, agent, msg.value, taskPrompt);
        emit TaskCompleted(taskId, agent, msg.value, resultHash, latencyMs);
    }

    /// @notice Withdraw client unspent deposits
    function withdrawDeposit(uint256 amount) external {
        require(clientDeposits[msg.sender] >= amount, "Exceeds deposit balance");
        clientDeposits[msg.sender] -= amount;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");
        emit FundsWithdrawn(msg.sender, amount);
    }

    receive() external payable {
        clientDeposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
}
