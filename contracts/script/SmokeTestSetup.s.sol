// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AvaxGuard.sol";

/**
 * @title SmokeTestSetup
 * @notice Owner creates and funds a minimal policy on Avalanche Mainnet for the Agent.
 * @dev Enforces block.chainid == 43114 hard stop. Broadcasted by Owner (--account avax-owner).
 */
contract SmokeTestSetup is Script {
    error InvalidChainId(uint256 expected, uint256 actual);

    uint256 public constant MAINNET_CHAIN_ID = 43114;

    function run() external {
        if (block.chainid != MAINNET_CHAIN_ID) {
            revert InvalidChainId(MAINNET_CHAIN_ID, block.chainid);
        }

        address guardAddress = vm.envAddress("AVAX_GUARD_ADDRESS");
        address agentAddress = vm.envAddress("AGENT_ADDRESS");
        address merchantAddress = vm.envAddress("MERCHANT_ADDRESS");
        uint256 budget = vm.envOr("TEST_BUDGET", uint256(0.005 ether));
        uint256 maxPerTx = vm.envOr("MAX_PER_TX", uint256(0.002 ether));
        uint256 dailyLimit = vm.envOr("DAILY_LIMIT", uint256(0.005 ether));
        uint256 duration = vm.envOr("DURATION", uint256(1 days));

        AvaxGuard guard = AvaxGuard(payable(guardAddress));

        vm.startBroadcast();
        guard.createPolicy{value: budget}(agentAddress, merchantAddress, maxPerTx, dailyLimit, duration);
        console.log("=== Smoke Test Policy Created on Mainnet ===");
        console.log("Contract :", guardAddress);
        console.log("Owner    :", msg.sender);
        console.log("Agent    :", agentAddress);
        console.log("Merchant :", merchantAddress);
        console.log("Budget   :", budget);
        vm.stopBroadcast();
    }
}
