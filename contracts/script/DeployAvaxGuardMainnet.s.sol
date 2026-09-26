// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AvaxGuard.sol";

/**
 * @title DeployAvaxGuardMainnet
 * @notice Dedicated Avalanche C-Chain Mainnet (Chain ID 43114) deployment script.
 * @dev Enforces a strict Chain ID hard stop (block.chainid == 43114) to prevent accidental testnet deployment.
 *      Uses Foundry's encrypted keystore / interactive signing without plaintext private keys.
 */
contract DeployAvaxGuardMainnet is Script {
    error InvalidChainId(uint256 expected, uint256 actual);

    uint256 public constant MAINNET_CHAIN_ID = 43114;

    function run() external returns (AvaxGuard guard) {
        // Strict Hard Stop: Fail-closed if not on Avalanche C-Chain Mainnet
        if (block.chainid != MAINNET_CHAIN_ID) {
            revert InvalidChainId(MAINNET_CHAIN_ID, block.chainid);
        }

        vm.startBroadcast();

        guard = new AvaxGuard();

        console.log("==================================================");
        console.log("  [+] AvaxGuard Deployed Successfully on Mainnet");
        console.log("==================================================");
        console.log("  Contract Address :", address(guard));
        console.log("  Deployer Account :", msg.sender);
        console.log("  Chain ID         :", block.chainid);
        console.log("  Block Number     :", block.number);
        console.log("==================================================");

        vm.stopBroadcast();
    }
}
