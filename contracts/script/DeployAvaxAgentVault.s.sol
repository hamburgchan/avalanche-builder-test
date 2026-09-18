// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AvaxAgentVault.sol";

contract DeployAvaxAgentVault is Script {
    function run() external returns (AvaxAgentVault vault) {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        
        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        vault = new AvaxAgentVault();
        console.log("AvaxAgentVault deployed at:", address(vault));

        vm.stopBroadcast();
    }
}
