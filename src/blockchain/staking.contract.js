
import { networks } from "./networks";

let Staking = {
  // address_eth: "0x0E14AEe58cf4A0c8311Eb5728463e658025f49b8", //    Ganache
  [networks.ETH.chains.kovan]: "0xaD6E52A5C06b2dBD86D51DAC43b1e2b9A77712dc", 
  [networks.ETH.chains.ropsten]: "0xD0cC9bc3799CBf5fA5744f686b3b1cbd45924e28",
  abi: [{
      "inputs": [{
          "internalType": "address",
          "name": "_pmc",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_gameplay",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "_gameplay",
        "type": "address"
      }],
      "name": "addGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_maxLoop",
        "type": "uint256"
      }],
      "name": "calculateRewardAndStartIncomeIdx",
      "outputs": [{
          "internalType": "uint256",
          "name": "reward",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_incomeIdxToStartCalculatingRewardOf",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "gameplaySupported",
      "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getIncomeCount",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_idx",
        "type": "uint256"
      }],
      "name": "getIncomeInfo",
      "outputs": [{
          "internalType": "uint256",
          "name": "income",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "tokensStakedAmount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "incomeIdxToStartCalculatingRewardIfNoStakes",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "incomeIdxToStartCalculatingRewardOf",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "pendingRewardOf",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pmcAddr",
      "outputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "_gameplay",
        "type": "address"
      }],
      "name": "removeGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "replenishRewardPool",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_tokens",
        "type": "uint256"
      }],
      "name": "stake",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "stakeOf",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "stakingRewardWithdrawnOf",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokensStaked",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unstake",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_maxLoop",
        "type": "uint256"
      }],
      "name": "withdrawReward",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
}


export {
  Staking
};