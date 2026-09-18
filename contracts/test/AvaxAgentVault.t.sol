// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AvaxAgentVault.sol";

contract AvaxAgentVaultTest is Test {
    AvaxAgentVault public vault;
    address public client = address(0x1111);
    address public agent = address(0x2222);

    function setUp() public {
        vault = new AvaxAgentVault();
        vm.deal(client, 10 ether);
        vm.deal(agent, 1 ether);
    }

    function test_DepositAndCreateTask() public {
        vm.startPrank(client);
        vault.deposit{value: 1 ether}();
        assertEq(vault.clientDeposits(client), 1 ether);

        bytes32 taskId = keccak256("task-1");
        vault.createTask(taskId, agent, 0.1 ether, "Generate Web3 Market Sentiment");
        assertEq(vault.clientDeposits(client), 0.9 ether);
        vm.stopPrank();

        // Complete task by agent
        uint256 agentBalBefore = agent.balance;
        vm.prank(agent);
        vault.completeTask(taskId, "ipfs://QmSummarySentimentHash", 650);

        assertEq(agent.balance, agentBalBefore + 0.1 ether);
        assertEq(vault.totalTasksCompleted(), 1);
        assertEq(vault.totalSettledAmount(), 0.1 ether);
    }

    function test_DirectMicroPay() public {
        vm.startPrank(client);
        uint256 agentBalBefore = agent.balance;

        vault.directMicroPay{value: 0.05 ether}(
            agent,
            "Realtime Token Price Analysis",
            "ipfs://QmPriceResultHash",
            420
        );

        assertEq(agent.balance, agentBalBefore + 0.05 ether);
        assertEq(vault.totalTasksCompleted(), 1);
        assertEq(vault.totalSettledAmount(), 0.05 ether);
        vm.stopPrank();
    }

    function test_WithdrawDeposit() public {
        vm.startPrank(client);
        vault.deposit{value: 2 ether}();
        vault.withdrawDeposit(1.5 ether);
        assertEq(vault.clientDeposits(client), 0.5 ether);
        vm.stopPrank();
    }
}
