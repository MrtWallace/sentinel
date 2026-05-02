// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SmartAccount} from "../src/SmartAccount.sol";

contract SmartAccountTest is Test {
    SmartAccount public smartAccount;
    address public owner;
    address public agent;
    address public stranger;
    uint256 public constant DAILY_LIMIT = 1 ether;

    function setUp() public {
        // 在这里：
        // 1. 给三个地址赋值（用 makeAddr）
        // 2. 用 vm.prank(owner) 模拟 owner 部署合约
        // 3. 给合约充一些初始 ETH（用 vm.deal）
        owner = makeAddr("owner");
        agent = makeAddr("agent");
        stranger = makeAddr("stranger");

        vm.prank(owner);
        smartAccount = new SmartAccount(agent, DAILY_LIMIT);

        vm.deal(address(smartAccount), 10 ether);
    }
    function test_deposit_increasesBalance() public {
    // 1. 记录存款前的合约余额
    // 2. 用 vm.deal 给 owner 一些 ETH，用 vm.prank 模拟 owner 调用
    // 3. 调用 deposit，用 {value: 1 ether} 传 ETH
    // 4. assertEq 验证余额增加了
        uint256 initialBalance = address(smartAccount).balance;
        vm.deal(owner, 10 ether);
        vm.prank(owner);
        smartAccount.deposit{value: 1 ether}();
        assertEq(address(smartAccount).balance, initialBalance + 1 ether);
    }
    function test_setDailyLimit_revertsIfNotOwner() public {
    // stranger 尝试设置 limit，应该 revert
        vm.prank(stranger);
        vm.expectRevert("Only owner can call this function");
        smartAccount.setDailyLimit(2 ether);

        vm.prank(owner);
        smartAccount.setDailyLimit(2 ether);
        assertEq(smartAccount.dailyLimit(), 2 ether);

        vm.prank(owner);
        vm.expectRevert("Limit must be greater than 0");
        smartAccount.setDailyLimit(0);
    }
    function test_withdraw_revertsIfNotOwner() public {
    // stranger 尝试 withdraw，应该 revert
        vm.prank(stranger);
        vm.expectRevert("Only owner can call this function");
        smartAccount.withdraw(1 ether);

    }
    function test_withdraw_revertsIfInsufficientBalance() public { 
        uint256 initialBalance = address(smartAccount).balance;
        vm.prank(owner);
        vm.expectRevert("Transfer failed");
        smartAccount.withdraw(initialBalance + 1 ether);
    }
    function test_withdraw_ownerCanWithdraw() public {
        uint256 initialBalance = address(smartAccount).balance;
        vm.prank(owner);
        smartAccount.withdraw(1 ether);
        assertEq(address(smartAccount).balance, initialBalance - 1 ether);
    }
    function test_execute_revertsIfNotAgent() public {
    // stranger 尝试 execute，应该 revert
        vm.prank(stranger);
        vm.expectRevert("Only agent can call this function");
        smartAccount.execute(stranger, 1 ether, "");
    }
    function test_execute_revertsIfExceedsDailyLimit() public {
    // agent 尝试 execute 超过 daily limit，应该 revert
        uint256 dailyLimit = smartAccount.dailyLimit();
        vm.prank(agent);
        vm.expectRevert("Daily limit exceeded");
        smartAccount.execute(stranger, dailyLimit + 1 ether, "");
    }
    function test_execute_agentCanExecute() public {
    // agent 尝试 execute，应该成功
        uint256 initialBalance = address(smartAccount).balance;
        uint256 sendAmount = 0.5 ether;
        vm.deal(stranger, 0);

        vm.prank(agent);
        smartAccount.execute(stranger, sendAmount, "");
        assertEq(address(smartAccount).balance, initialBalance - sendAmount);
        assertEq(smartAccount.dailySpent(), sendAmount);
        assertEq(stranger.balance, sendAmount);
    }
    function test_execute_dailyLimitResetsNextDay() public {
    // agent 执行一次，消耗 daily limit 的一部分
    // 然后时间前进一天，再执行一次，应该成功（因为 daily limit 已经重置了）
        uint256 sendAmount = 0.5 ether;
        vm.prank(agent);
        smartAccount.execute(stranger, sendAmount, ""   );
        assertEq(smartAccount.dailySpent(), sendAmount);
        vm.warp(block.timestamp + 1 days);
        vm.prank(agent);
        smartAccount.execute(stranger, sendAmount, "");
        assertEq(smartAccount.dailySpent(), sendAmount);
    }
    function testFuzz_execute_withinLimit(uint256 amount) public {
    // amount 由 Foundry 随机生成
    // 只测试 amount 在 daily limit 范围内的情况
        vm.assume(amount > 0 && amount <= smartAccount.dailyLimit());
        uint256 initialBalance = address(smartAccount).balance;
        vm.deal(stranger, 0);

        vm.prank(agent);
        smartAccount.execute(stranger, amount, "");
        assertEq(address(smartAccount).balance, initialBalance - amount);
        assertEq(smartAccount.dailySpent(), amount);
        assertEq(stranger.balance, amount);
    }
    function testFuzz_execute_exceedsLimit(uint256 amount) public {
        vm.assume(amount > smartAccount.dailyLimit());
        vm.prank(agent);
        vm.expectRevert("Daily limit exceeded");
        smartAccount.execute(stranger, amount, "");
    }
}
