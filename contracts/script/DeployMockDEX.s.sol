// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {MockDEX} from "../src/MockDEX.sol";

contract DeployMockDEX is Script {
    function run() external returns (MockDEX) {
        vm.startBroadcast();
        MockDEX mockDEX = new MockDEX();
        vm.stopBroadcast();
        return mockDEX;
    }
}
