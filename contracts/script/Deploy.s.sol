// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {SmartAccount} from "../src/SmartAccount.sol";

contract DeploySmartAccount is Script {
    function run() external returns (SmartAccount) {
        // TODO 1: 从环境变量读取 agent 地址和 daily limit
        // 用 vm.envAddress("AGENT_ADDRESS") 和 vm.envUint("DAILY_LIMIT_WEI")
        address agentAddress = vm.envAddress("AGENT_ADDRESS");
        uint256 dailyLimit = vm.envUint("DAILY_LIMIT_WEI");
        // TODO 2: vm.startBroadcast() ... vm.stopBroadcast()
        // 中间 new SmartAccount(agentAddress, dailyLimit)
        vm.startBroadcast();
        SmartAccount smartAccount = new SmartAccount(agentAddress, dailyLimit);
        vm.stopBroadcast();
        // TODO 3: return 合约实例
        return smartAccount;
    }
}
