import { ethers } from "ethers";

const state = { 
  list: [
    { 
      id: 'CF', 
      name: 'Coin Flip', 
      routeName: 'coin-flip', 
      filesFolder: 'CoinFlip', 
      image: 'game_coin_flip.svg',
      networks: {
        ETH: {
          '0x2a': "0xCaCA0a013F1aD48ed14b06e440d15C33df2D8631", //kovan
          '0x3' : "0x1C0B2fdf6A8836CE3210Eb8B57F5cF90706fC807", //ropsten
        }  
      },
      contract: null,
      abi: [{
          "inputs": [{
            "internalType": "address",
            "name": "_pmc",
            "type": "address"
          }],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "bool",
              "name": "timeout",
              "type": "bool"
            }
          ],
          "name": "CF_GameFinished",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "opponent",
              "type": "address"
            }
          ],
          "name": "CF_GameJoined",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            }
          ],
          "name": "CF_GameStarted",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "prize",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "pmc",
              "type": "uint256"
            }
          ],
          "name": "CF_PrizeWithdrawn",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "winner",
              "type": "address"
            }
          ],
          "name": "CF_RaffleJackpotWithdrawn",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "winner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "prize",
              "type": "uint256"
            }
          ],
          "name": "CF_RafflePlayed",
          "type": "event"
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
            "name": "",
            "type": "address"
          }],
          "name": "betsTotal",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "_coinSideHash",
              "type": "bytes32"
            },
            {
              "internalType": "address",
              "name": "_referral",
              "type": "address"
            }
          ],
          "name": "finishTimeoutGame",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_idx",
              "type": "uint256"
            }
          ],
          "name": "gameInfo",
          "outputs": [{
              "internalType": "bool",
              "name": "running",
              "type": "bool"
            },
            {
              "internalType": "bytes32",
              "name": "creatorCoinSide",
              "type": "bytes32"
            },
            {
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "idx",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "stake",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "startTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "heads",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "tails",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "creatorPrize",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "opponentPrize",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "gameMaxDuration",
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
          "name": "gameMaxDurationToUpdate",
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
          "name": "gameMinStakeETH",
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
          "name": "gameMinStakeETHToUpdate",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "gamesFinished",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "gamesStarted",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getDevFeePending",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getDevFeeWithdrawn",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getDevFeeWithdrawnTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getGamesParticipatedToCheckPrize",
          "outputs": [{
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "getPartnerFeePending",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getPartnerFeeWithdrawn",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getPartnerFeeWithdrawnTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getPlayerStakeTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getPlayerWithdrawedTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleJackpot",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_address",
              "type": "address"
            }
          ],
          "name": "getRaffleJackpotPending",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_address",
              "type": "address"
            }
          ],
          "name": "getRaffleJackpotWithdrawn",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleJackpotsWonTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleParticipants",
          "outputs": [{
            "internalType": "address[]",
            "name": "",
            "type": "address[]"
          }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleParticipantsNumber",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_idx",
              "type": "uint256"
            }
          ],
          "name": "getRaffleResultInfo",
          "outputs": [{
              "internalType": "address",
              "name": "winner",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "prize",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleResultNumber",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getReferralFeePending",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getReferralFeeWithdrawn",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getReferralFeeWithdrawnTotal",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_idx",
              "type": "uint256"
            }
          ],
          "name": "getReferralInGame",
          "outputs": [{
            "internalType": "address",
            "name": "",
            "type": "address"
          }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "governance",
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
          "name": "isTokenSupported",
          "outputs": [{
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "_coinSide",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "_referral",
              "type": "address"
            }
          ],
          "name": "joinGame",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_idx",
              "type": "uint256"
            }
          ],
          "name": "opponentCoinSideForOpponent",
          "outputs": [{
            "internalType": "enum PMCCoinFlipContract.CoinSide",
            "name": "opponentCoinSide",
            "type": "uint8"
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
          "inputs": [],
          "name": "partner",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_maxLoop",
              "type": "uint256"
            }
          ],
          "name": "pendingPrizeToWithdraw",
          "outputs": [{
              "internalType": "uint256",
              "name": "prize",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "pmc_tokens",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint8",
              "name": "_coinSide",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "_seedHash",
              "type": "bytes32"
            }
          ],
          "name": "playGame",
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
          "name": "playerWithdrawedPMCTotal",
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
          "inputs": [],
          "name": "renounceOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "stakeRewardPoolPending_ETH",
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
          "name": "stakingAddr",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "_coinSideHash",
              "type": "bytes32"
            },
            {
              "internalType": "address",
              "name": "_referral",
              "type": "address"
            }
          ],
          "name": "startGame",
          "outputs": [],
          "stateMutability": "payable",
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
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "updateGameAddTokenSupported",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "uint256",
            "name": "_gameMaxDuration",
            "type": "uint256"
          }],
          "name": "updateGameMaxDuration",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "uint256",
            "name": "_gameMinStakeETH",
            "type": "uint256"
          }],
          "name": "updateGameMinStakeETH",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_address",
            "type": "address"
          }],
          "name": "updateGovernanceContract",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_partner",
            "type": "address"
          }],
          "name": "updatePartner",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_address",
            "type": "address"
          }],
          "name": "updateStakingAddr",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "withdrawDevFee",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "withdrawPartnerFee",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_maxLoop",
              "type": "uint256"
            }
          ],
          "name": "withdrawPendingPrizes",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "withdrawRaffleJackpots",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "withdrawReferralFee",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
    },
    { 
      id: 'RPS', 
      name: 'Rock Paper Scissors', 
      routeName: 'rock-paper-scissors', 
      filesFolder: 'RockPaperScissors', 
      image: 'game_coin_flip.svg',
      networks: {
        ETH: {
          '0x2a': "0xCaCA0a013F1aD48ed14b06e440d15C33df2D8631", //kovan
          '0x3' : "0x1C0B2fdf6A8836CE3210Eb8B57F5cF90706fC807", //ropsten
        }  
      },
      contract: null,
      abi: [{
          "inputs": [{
            "internalType": "address",
            "name": "_pmc",
            "type": "address"
          }],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "bool",
              "name": "timeout",
              "type": "bool"
            }
          ],
          "name": "CF_GameFinished",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "opponent",
              "type": "address"
            }
          ],
          "name": "CF_GameJoined",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            }
          ],
          "name": "CF_GameStarted",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "prize",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "pmc",
              "type": "uint256"
            }
          ],
          "name": "CF_PrizeWithdrawn",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "winner",
              "type": "address"
            }
          ],
          "name": "CF_RaffleJackpotWithdrawn",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [{
              "indexed": true,
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "winner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "prize",
              "type": "uint256"
            }
          ],
          "name": "CF_RafflePlayed",
          "type": "event"
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
            "name": "",
            "type": "address"
          }],
          "name": "betsTotal",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "_coinSideHash",
              "type": "bytes32"
            },
            {
              "internalType": "address",
              "name": "_referral",
              "type": "address"
            }
          ],
          "name": "finishTimeoutGame",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_idx",
              "type": "uint256"
            }
          ],
          "name": "gameInfo",
          "outputs": [{
              "internalType": "bool",
              "name": "running",
              "type": "bool"
            },
            {
              "internalType": "bytes32",
              "name": "creatorCoinSide",
              "type": "bytes32"
            },
            {
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "idx",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "stake",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "startTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "heads",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "tails",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "creatorPrize",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "opponentPrize",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "gameMaxDuration",
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
          "name": "gameMaxDurationToUpdate",
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
          "name": "gameMinStakeETH",
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
          "name": "gameMinStakeETHToUpdate",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "gamesFinished",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "gamesStarted",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getDevFeePending",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getDevFeeWithdrawn",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getDevFeeWithdrawnTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getGamesParticipatedToCheckPrize",
          "outputs": [{
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "getPartnerFeePending",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getPartnerFeeWithdrawn",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getPartnerFeeWithdrawnTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getPlayerStakeTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getPlayerWithdrawedTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleJackpot",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_address",
              "type": "address"
            }
          ],
          "name": "getRaffleJackpotPending",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_address",
              "type": "address"
            }
          ],
          "name": "getRaffleJackpotWithdrawn",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleJackpotsWonTotal",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleParticipants",
          "outputs": [{
            "internalType": "address[]",
            "name": "",
            "type": "address[]"
          }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleParticipantsNumber",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_idx",
              "type": "uint256"
            }
          ],
          "name": "getRaffleResultInfo",
          "outputs": [{
              "internalType": "address",
              "name": "winner",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "prize",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "getRaffleResultNumber",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getReferralFeePending",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getReferralFeeWithdrawn",
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
            "name": "_token",
            "type": "address"
          }],
          "name": "getReferralFeeWithdrawnTotal",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_idx",
              "type": "uint256"
            }
          ],
          "name": "getReferralInGame",
          "outputs": [{
            "internalType": "address",
            "name": "",
            "type": "address"
          }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "governance",
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
          "name": "isTokenSupported",
          "outputs": [{
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "_coinSide",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "_referral",
              "type": "address"
            }
          ],
          "name": "joinGame",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_idx",
              "type": "uint256"
            }
          ],
          "name": "opponentCoinSideForOpponent",
          "outputs": [{
            "internalType": "enum PMCCoinFlipContract.CoinSide",
            "name": "opponentCoinSide",
            "type": "uint8"
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
          "inputs": [],
          "name": "partner",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_maxLoop",
              "type": "uint256"
            }
          ],
          "name": "pendingPrizeToWithdraw",
          "outputs": [{
              "internalType": "uint256",
              "name": "prize",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "pmc_tokens",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint8",
              "name": "_coinSide",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "_seedHash",
              "type": "bytes32"
            }
          ],
          "name": "playGame",
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
          "name": "playerWithdrawedPMCTotal",
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
          "inputs": [],
          "name": "renounceOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "stakeRewardPoolPending_ETH",
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
          "name": "stakingAddr",
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
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "_coinSideHash",
              "type": "bytes32"
            },
            {
              "internalType": "address",
              "name": "_referral",
              "type": "address"
            }
          ],
          "name": "startGame",
          "outputs": [],
          "stateMutability": "payable",
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
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "updateGameAddTokenSupported",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "uint256",
            "name": "_gameMaxDuration",
            "type": "uint256"
          }],
          "name": "updateGameMaxDuration",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "uint256",
            "name": "_gameMinStakeETH",
            "type": "uint256"
          }],
          "name": "updateGameMinStakeETH",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_address",
            "type": "address"
          }],
          "name": "updateGovernanceContract",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_partner",
            "type": "address"
          }],
          "name": "updatePartner",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_address",
            "type": "address"
          }],
          "name": "updateStakingAddr",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "withdrawDevFee",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "withdrawPartnerFee",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
              "internalType": "address",
              "name": "_token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_maxLoop",
              "type": "uint256"
            }
          ],
          "name": "withdrawPendingPrizes",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "withdrawRaffleJackpots",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{
            "internalType": "address",
            "name": "_token",
            "type": "address"
          }],
          "name": "withdrawReferralFee",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
    },
    { id: null, name: 'NEW GAME', routePath: null, image: 'no_game.png' },
    { id: null, name: 'NEW GAME', routePath: null, image: 'no_game.png' },    
  ],
  currentGame: {},   
};

const getters = {
  list: (state) => { return state.list },  
  currentGame: (state) => { return state.currentGame }, 
  getGameById: state => gameId => state.list.find(game => game.id === gameId),  
};

const actions = {
  SET_CURRENT_GAME: async ({ commit, state }, gameId) => {
    let game = {}
    if (gameId) game = state.list.find(g => g.id === gameId)    
    commit('SET_CURRENT_GAME', game);     
  },
  BUILD_CONTRACTS: ({commit}, network) => {    
    commit('BUILD_CONTRACTS', {network});     
  },
  GET_GAMES_DATA: ({commit}, network) => {    
    commit('SET_GAMES_DATA', {network});     
  },

};

const mutations = {  
  SET_CURRENT_GAME: (state, game) => {
    state.currentGame = game;  
  },
  BUILD_CONTRACTS: (state, { network }) => {
    state.list.forEach((game, index) => {
      if (game.id) state.list[index].contract = new ethers.Contract(game.networks[network.id][network.chainId], game.abi, window.pmc.signer)
    })    
  },  
  
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};