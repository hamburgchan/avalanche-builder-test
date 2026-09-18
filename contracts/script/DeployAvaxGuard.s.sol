// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AvaxGuard.sol";

contract DeployAvaxGuard is Script {
    function run() external returns (AvaxGuard guard) {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        guard = new AvaxGuard();
        console.log("AvaxGuard deployed at:", address(guard));

        vm.stopBroadcast();
    }
}
