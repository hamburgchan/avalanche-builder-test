// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AvaxGuard.sol";

/**
 * @title DeployAvaxGuard
 * @notice Production-grade deployment script for AvaxGuard on Avalanche networks.
 * @dev Supports secure signing via Foundry keystore (--account <name>) or interactive prompt (--interactive).
 *      No private keys are embedded or read from plaintext files.
 */
contract DeployAvaxGuard is Script {
    function run() external returns (AvaxGuard guard) {
        vm.startBroadcast();

        guard = new AvaxGuard();

        console.log("==================================================");
        console.log("  [+] AvaxGuard Deployed Successfully");
        console.log("==================================================");
        console.log("  Contract Address :", address(guard));
        console.log("  Deployer Account :", msg.sender);
        console.log("  Chain ID         :", block.chainid);
        console.log("  Block Number     :", block.number);
        console.log("==================================================");

        vm.stopBroadcast();
    }
}
