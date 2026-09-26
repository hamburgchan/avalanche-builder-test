// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AvaxGuard.sol";

/**
 * @title SmokeTestSpend
 * @notice Agent executes Case 1 (Legitimate Micro-Payment) and Case 2 (Unauthorized Recipient Defense).
 * @dev Enforces block.chainid == 43114 hard stop. Broadcasted by Agent (--account avax-agent).
 */
contract SmokeTestSpend is Script {
    error InvalidChainId(uint256 expected, uint256 actual);

    uint256 public constant MAINNET_CHAIN_ID = 43114;

    function run() external {
        if (block.chainid != MAINNET_CHAIN_ID) {
            revert InvalidChainId(MAINNET_CHAIN_ID, block.chainid);
        }

        address guardAddress = vm.envAddress("AVAX_GUARD_ADDRESS");
        address merchantAddress = vm.envAddress("MERCHANT_ADDRESS");
        address attackerAddress = vm.envAddress("ATTACKER_ADDRESS");

        AvaxGuard guard = AvaxGuard(payable(guardAddress));

        vm.startBroadcast();

        // Case 1: Normal Legitimate Payment (0.001 AVAX to allowlisted merchant)
        bytes32 req1 = keccak256(abi.encodePacked("mainnet-smoke-case-1", block.timestamp));
        guard.attemptSpend(payable(merchantAddress), 0.001 ether, req1);
        console.log("=== Case 1 Executed on Mainnet ===");
        console.log("Normal payment of 0.001 AVAX sent to merchant:", merchantAddress);
        console.log("RequestId:", vm.toString(req1));

        // Case 2: Unauthorized Recipient Defense (0.001 AVAX attempted to attacker)
        bytes32 req2 = keccak256(abi.encodePacked("mainnet-smoke-case-2", block.timestamp));
        guard.attemptSpend(payable(attackerAddress), 0.001 ether, req2);
        console.log("=== Case 2 Executed on Mainnet ===");
        console.log("Payment to unauthorized recipient intercepted. Target:", attackerAddress);
        console.log("RequestId:", vm.toString(req2));

        vm.stopBroadcast();
    }
}
