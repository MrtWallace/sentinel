import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  11155111: {
    SmartAccount: {
      address: "0x3350A693619209193B01399e78d5897766c44074",
      abi: [
        {
          "type": "constructor",
          "inputs": [
            { "name": "_agent", "type": "address", "internalType": "address" },
            { "name": "_dailyLimit", "type": "uint256", "internalType": "uint256" }
          ],
          "stateMutability": "nonpayable"
        },
        {
          "type": "receive",
          "stateMutability": "payable"
        },
        {
          "type": "function",
          "name": "agent",
          "inputs": [],
          "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "dailyLimit",
          "inputs": [],
          "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "dailySpent",
          "inputs": [],
          "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "deposit",
          "inputs": [],
          "outputs": [],
          "stateMutability": "payable"
        },
        {
          "type": "function",
          "name": "execute",
          "inputs": [
            { "name": "to", "type": "address", "internalType": "address" },
            { "name": "amount", "type": "uint256", "internalType": "uint256" },
            { "name": "data", "type": "bytes", "internalType": "bytes" }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "owner",
          "inputs": [],
          "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "setAgent",
          "inputs": [{ "name": "_newAgent", "type": "address", "internalType": "address" }],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "setDailyLimit",
          "inputs": [{ "name": "newLimit", "type": "uint256", "internalType": "uint256" }],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "withdraw",
          "inputs": [{ "name": "amount", "type": "uint256", "internalType": "uint256" }],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "event",
          "name": "Deposited",
          "inputs": [
            { "name": "sender", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "Executed",
          "inputs": [
            { "name": "to", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
            { "name": "isSwap", "type": "bool", "indexed": false, "internalType": "bool" },
            { "name": "data", "type": "bytes", "indexed": false, "internalType": "bytes" }
          ],
          "anonymous": false
        }
      ],
    },
  },
} as const satisfies GenericContractsDeclaration;

export default deployedContracts;
