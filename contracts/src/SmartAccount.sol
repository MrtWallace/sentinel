// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SmartAccount {
    address public owner;
    address public agent;
    uint256 public dailyLimit;
    uint256 public dailySpent;
    uint256 lastResetDay;

    event Deposited(address indexed sender, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    modifier onlyAgent() {
        require(msg.sender == agent, "Only agent can call this function");
        _;
    }

    constructor(address _agent, uint256 _dailyLimit) {
        owner = msg.sender;
        agent = _agent;
        dailyLimit = _dailyLimit;
    }

    function deposit() public payable {
        emit Deposited(msg.sender, msg.value);
    }

    function setDailyLimit(uint256 newLimit) public onlyOwner {
        require(newLimit > 0, "Limit must be greater than 0");
        dailyLimit = newLimit;
    }

    function withdraw(uint256 amount) public onlyOwner{
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function execute(address to, uint256 amount, bytes memory data)public onlyAgent {
        if(block.timestamp / 86400 > lastResetDay) {
            dailySpent = 0;
            lastResetDay = block.timestamp / 86400;
        }
        if(dailySpent + amount <= dailyLimit) {
            dailySpent += amount;
            (bool success, ) = to.call{value: amount}(data);
            require(success, "Transfer failed");
        }else {
            revert("Daily limit exceeded");
        }
    }
}