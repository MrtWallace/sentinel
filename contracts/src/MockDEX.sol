// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockDEX {
    event Swapped(address indexed sender, uint256 ethIn, address tokenOut, uint256 amountOutMin);

    function swap(address tokenOut, uint256 amountOutMin) external payable {
        // TODO 1: require msg.value > 0，错误信息 "Must send ETH"
        require(msg.value > 0, "Must send ETH");
        // TODO 2: emit Swapped(msg.sender, msg.value, tokenOut, amountOutMin)
        emit Swapped(msg.sender, msg.value, tokenOut, amountOutMin);
    }
}
