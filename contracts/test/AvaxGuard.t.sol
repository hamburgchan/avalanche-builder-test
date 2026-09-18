// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AvaxGuard.sol";

contract AvaxGuardTest is Test {
    AvaxGuard public guard;

    address public ownerA = address(0x1111);
    address public ownerB = address(0x2222);
    address public agent1 = address(0x3333);
    address public agent2 = address(0x4444);
    address payable public merchant = payable(address(0x5555));
    address payable public attacker = payable(address(0x6666));

    uint256 public constant INITIAL_BUDGET = 0.02 ether;
    uint256 public constant MAX_PER_TX = 0.003 ether;
    uint256 public constant DAILY_LIMIT = 0.01 ether;
    uint256 public constant DURATION = 30 minutes;

    function setUp() public {
        guard = new AvaxGuard();
        vm.deal(ownerA, 10 ether);
        vm.deal(ownerB, 10 ether);
        vm.deal(agent1, 0.05 ether);
        vm.deal(agent2, 0.05 ether);
    }

    function _setupDefaultPolicy() internal {
        vm.prank(ownerA);
        guard.createPolicy{value: INITIAL_BUDGET}(
            agent1,
            merchant,
            MAX_PER_TX,
            DAILY_LIMIT,
            DURATION
        );
    }

    function test_CreatePolicy_Success() public {
        _setupDefaultPolicy();

        (
            address owner,
            address agent,
            uint256 totalBudget,
            uint256 remainingBudget,
            uint256 maxPerTx,
            uint256 dailyLimit,
            uint256 dailySpent,
            uint256 dayIndex,
            uint256 expiry,
            bool active
        ) = guard.policies(ownerA, agent1);

        assertEq(owner, ownerA);
        assertEq(agent, agent1);
        assertEq(totalBudget, INITIAL_BUDGET);
        assertEq(remainingBudget, INITIAL_BUDGET);
        assertEq(maxPerTx, MAX_PER_TX);
        assertEq(dailyLimit, DAILY_LIMIT);
        assertEq(dailySpent, 0);
        assertEq(dayIndex, block.timestamp / 1 days);
        assertEq(expiry, block.timestamp + DURATION);
        assertTrue(active);

        assertTrue(guard.allowedMerchants(ownerA, agent1, merchant));
        assertEq(guard.activeOwnerOfAgent(agent1), ownerA);
        assertTrue(guard.agentEverBound(agent1));
    }

    function test_CreatePolicy_AgentAlreadyBound() public {
        _setupDefaultPolicy();

        // Owner B attempts to bind agent1 which is already bound to Owner A
        vm.prank(ownerB);
        vm.expectRevert(AvaxGuard.AgentAlreadyUsed.selector);
        guard.createPolicy{value: 1 ether}(agent1, merchant, 0.1 ether, 0.5 ether, 1 hours);
    }

    function test_CreatePolicy_AgentCannotBeReusedAfterRevoke() public {
        _setupDefaultPolicy();

        // Owner A revokes agent1
        vm.prank(ownerA);
        guard.revokePolicy(agent1);

        // Attempting to create a new policy with the same agent1 must fail
        vm.prank(ownerA);
        vm.expectRevert(AvaxGuard.AgentAlreadyUsed.selector);
        guard.createPolicy{value: 1 ether}(agent1, merchant, 0.1 ether, 0.5 ether, 1 hours);
    }

    function test_AttemptSpend_Approved() public {
        _setupDefaultPolicy();
        bytes32 reqId = keccak256("req-1");
        uint256 spendAmt = 0.002 ether;

        uint256 merchantBalBefore = merchant.balance;

        vm.prank(agent1);
        guard.attemptSpend(merchant, spendAmt, reqId);

        assertEq(merchant.balance, merchantBalBefore + spendAmt);
        (, , , uint256 remainingBudget, , , uint256 dailySpent, , , ) = guard.policies(ownerA, agent1);
        assertEq(remainingBudget, INITIAL_BUDGET - spendAmt);
        assertEq(dailySpent, spendAmt);
        assertTrue(guard.executedRequests(reqId));
    }

    function test_AttemptSpend_Blocked_PerTxLimit() public {
        _setupDefaultPolicy();
        bytes32 reqId = keccak256("req-over-per-tx");
        uint256 spendAmt = 0.010 ether; // > 0.003 ether

        uint256 merchantBalBefore = merchant.balance;

        vm.prank(agent1);
        // Expect event PaymentBlocked
        vm.expectEmit(true, true, true, true);
        emit AvaxGuard.PaymentBlocked(
            agent1,
            merchant,
            reqId,
            ownerA,
            spendAmt,
            AvaxGuard.BlockReason.PER_TX_LIMIT_EXCEEDED
        );

        guard.attemptSpend(merchant, spendAmt, reqId);

        // Funds must NOT be transferred
        assertEq(merchant.balance, merchantBalBefore);
        (, , , uint256 remainingBudget, , , uint256 dailySpent, , , ) = guard.policies(ownerA, agent1);
        assertEq(remainingBudget, INITIAL_BUDGET);
        assertEq(dailySpent, 0);
        assertFalse(guard.executedRequests(reqId));
    }

    function test_AttemptSpend_Blocked_DailyLimit() public {
        _setupDefaultPolicy();

        // 3 consecutive payments of 0.003 = 0.009 <= 0.010
        vm.startPrank(agent1);
        guard.attemptSpend(merchant, 0.003 ether, keccak256("tx-1"));
        guard.attemptSpend(merchant, 0.003 ether, keccak256("tx-2"));
        guard.attemptSpend(merchant, 0.003 ether, keccak256("tx-3"));

        // 4th payment of 0.002 would result in 0.011 > 0.010 dailyLimit
        bytes32 reqId4 = keccak256("tx-4");
        vm.expectEmit(true, true, true, true);
        emit AvaxGuard.PaymentBlocked(
            agent1,
            merchant,
            reqId4,
            ownerA,
            0.002 ether,
            AvaxGuard.BlockReason.DAILY_LIMIT_EXCEEDED
        );
        guard.attemptSpend(merchant, 0.002 ether, reqId4);
        vm.stopPrank();
    }

    function test_AttemptSpend_Blocked_MerchantNotAllowed() public {
        _setupDefaultPolicy();
        bytes32 reqId = keccak256("malicious-spend");
        uint256 spendAmt = 0.001 ether; // within maxPerTx

        vm.prank(agent1);
        vm.expectEmit(true, true, true, true);
        emit AvaxGuard.PaymentBlocked(
            agent1,
            attacker,
            reqId,
            ownerA,
            spendAmt,
            AvaxGuard.BlockReason.MERCHANT_NOT_ALLOWED
        );

        guard.attemptSpend(attacker, spendAmt, reqId);

        assertEq(attacker.balance, 0);
    }

    function test_AttemptSpend_Blocked_Expired() public {
        _setupDefaultPolicy();
        bytes32 reqId = keccak256("expired-req");

        // Warp time past 30 minutes
        vm.warp(block.timestamp + 31 minutes);

        vm.prank(agent1);
        vm.expectEmit(true, true, true, true);
        emit AvaxGuard.PaymentBlocked(
            agent1,
            merchant,
            reqId,
            ownerA,
            0.002 ether,
            AvaxGuard.BlockReason.POLICY_EXPIRED
        );

        guard.attemptSpend(merchant, 0.002 ether, reqId);
    }

    function test_AttemptSpend_Blocked_InsufficientBudget() public {
        // Create smaller policy with 0.004 total and 3 days duration
        vm.prank(ownerA);
        guard.createPolicy{value: 0.004 ether}(
            agent2,
            merchant,
            0.003 ether,
            0.004 ether,
            3 days
        );



        vm.startPrank(agent2);
        guard.attemptSpend(merchant, 0.003 ether, keccak256("sub-1"));

        // Warp to next day so daily bucket resets to 0, isolating remainingBudget check
        vm.warp(block.timestamp + 1 days + 1);

        // Remaining is 0.001 ether. Next request is 0.002 ether (within daily limit, but > remainingBudget)
        bytes32 reqId2 = keccak256("sub-2");
        vm.expectEmit(true, true, true, true);
        emit AvaxGuard.PaymentBlocked(
            agent2,
            merchant,
            reqId2,
            ownerA,
            0.002 ether,
            AvaxGuard.BlockReason.INSUFFICIENT_BUDGET
        );
        guard.attemptSpend(merchant, 0.002 ether, reqId2);
        vm.stopPrank();

    }

    function test_AttemptSpend_Blocked_RequestReplay() public {
        _setupDefaultPolicy();
        bytes32 reqId = keccak256("replay-test");

        vm.startPrank(agent1);
        guard.attemptSpend(merchant, 0.002 ether, reqId);

        // Attempting to spend with the exact same reqId again
        vm.expectEmit(true, true, true, true);
        emit AvaxGuard.PaymentBlocked(
            agent1,
            merchant,
            reqId,
            ownerA,
            0.002 ether,
            AvaxGuard.BlockReason.REQUEST_ALREADY_EXECUTED
        );
        guard.attemptSpend(merchant, 0.002 ether, reqId);
        vm.stopPrank();
    }

    function test_AttemptSpend_Revert_Unauthorized() public {
        _setupDefaultPolicy();

        // An unknown address attempts to spend
        vm.prank(address(0x9999));
        vm.expectRevert(AvaxGuard.UnauthorizedAgent.selector);
        guard.attemptSpend(merchant, 0.001 ether, keccak256("hacker"));
    }

    function test_RevokePolicy_Success() public {
        _setupDefaultPolicy();
        uint256 ownerBalBefore = ownerA.balance;

        vm.prank(ownerA);
        guard.revokePolicy(agent1);

        assertEq(ownerA.balance, ownerBalBefore + INITIAL_BUDGET);
        assertEq(guard.activeOwnerOfAgent(agent1), address(0));

        // After revoke, spending must be blocked as POLICY_INACTIVE
        vm.prank(agent1);
        vm.expectRevert(AvaxGuard.UnauthorizedAgent.selector);
        guard.attemptSpend(merchant, 0.001 ether, keccak256("post-revoke"));
    }

    function test_EvaluateSpend_DecisionTraceBitmask() public {
        _setupDefaultPolicy();
        bytes32 reqId = keccak256("trace-test");

        // 1. Legitimate: All 7 bits must pass (0b1111111 = 127)
        (bool allowed, AvaxGuard.BlockReason reason, uint256 checksPassed) = guard.evaluateSpend(
            ownerA,
            agent1,
            merchant,
            0.002 ether,
            reqId
        );
        assertTrue(allowed);
        assertEq(uint256(reason), uint256(AvaxGuard.BlockReason.NONE));
        assertEq(checksPassed, 127); // 1 + 2 + 4 + 8 + 16 + 32 + 64

        // 2. Over limit: Bit 4 fails, passed = 1 + 2 + 4 + 8 = 15 (0b0001111)
        (allowed, reason, checksPassed) = guard.evaluateSpend(
            ownerA,
            agent1,
            merchant,
            0.010 ether,
            reqId
        );
        assertFalse(allowed);
        assertEq(uint256(reason), uint256(AvaxGuard.BlockReason.PER_TX_LIMIT_EXCEEDED));
        assertEq(checksPassed, 15);

        // 3. Attacker merchant: Bit 3 fails, passed = 1 + 2 + 4 = 7 (0b0000111)
        (allowed, reason, checksPassed) = guard.evaluateSpend(
            ownerA,
            agent1,
            attacker,
            0.001 ether,
            reqId
        );
        assertFalse(allowed);
        assertEq(uint256(reason), uint256(AvaxGuard.BlockReason.MERCHANT_NOT_ALLOWED));
        assertEq(checksPassed, 7);
    }

    function test_SetMerchantAllowlist_Harden() public {
        _setupDefaultPolicy();

        // Adding invalid zero merchant must revert
        vm.prank(ownerA);
        vm.expectRevert(AvaxGuard.InvalidRecipient.selector);
        guard.setMerchantAllowlist(agent1, address(0), true);

        // Whitelisting a new valid merchant works
        address newMerchant = address(0x7777);
        vm.prank(ownerA);
        guard.setMerchantAllowlist(agent1, newMerchant, true);
        assertTrue(guard.allowedMerchants(ownerA, agent1, newMerchant));

        // After revoke, cannot modify allowlist
        vm.prank(ownerA);
        guard.revokePolicy(agent1);

        vm.prank(ownerA);
        vm.expectRevert(AvaxGuard.PolicyNotActive.selector);
        guard.setMerchantAllowlist(agent1, newMerchant, false);
    }
}
