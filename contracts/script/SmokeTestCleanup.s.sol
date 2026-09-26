// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AvaxGuard.sol";

/**
 * @title SmokeTestCleanup
 * @notice Owner revokes the policy and reclaims all unspent test funds on Mainnet.
 * @dev Enforces block.chainid == 43114 hard stop. Broadcasted by Owner (--account avax-owner).
 */
contract SmokeTestCleanup is Script {
    error InvalidChainId(uint256 expected, uint256 actual);

    uint256 public constant MAINNET_CHAIN_ID = 43114;

    function run() external {
        if (block.chainid != MAINNET_CHAIN_ID) {
            revert InvalidChainId(MAINNET_CHAIN_ID, block.chainid);
        }

        address guardAddress = vm.envAddress("AVAX_GUARD_ADDRESS");
        address agentAddress = vm.envAddress("AGENT_ADDRESS");

        AvaxGuard guard = AvaxGuard(payable(guardAddress));

        vm.startBroadcast();
        guard.revokePolicy(agentAddress);
        console.log("=== Policy Revoked & Refunded on Mainnet ===");
        console.log("Remaining test funds successfully refunded to Owner:", msg.sender);
        vm.stopBroadcast();
    }
}
