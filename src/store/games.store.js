import Vue from "vue";
import { ethers } from "ethers";

const state = { 
  list: [
    { 
      id: 'CF', 
      name: 'Coin Flip', 
      routeName: 'coin-flip', 
      filesFolder: 'CoinFlip', 
      image: '/img/game_coin_flip.svg',
      networks: {
        ETH: {
          '0x2a': "0xCaCA0a013F1aD48ed14b06e440d15C33df2D8631", //kovan
          '0x3' : "0x1C0B2fdf6A8836CE3210Eb8B57F5cF90706fC807", //ropsten
        }  
      },
      contract: null,      
      statistics: {},
      data: {},
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
    { id: null, name: 'NEW GAME', routePath: null, image: '/img/no_game.png' },
    { id: null, name: 'NEW GAME', routePath: null, image: '/img/no_game.png' },
    { id: null, name: 'NEW GAME', routePath: null, image: '/img/no_game.png' },    
  ],
  currentId: null, 
  currentIndex: null, 
  started: [],
};

const getters = {
  list: (state) => { return state.list },  
  currentGame: state => state.currentIndex !== null ? state.list[state.currentIndex] : {},   
  getGameById: state => gameId => state.list.find(game => game.id === gameId),  
};

const actions = {
  SET_CURRENT_GAME: async ({ commit }, gameId) => {    
    commit('SET_CURRENT_GAME', gameId);     
  },
  BUILD_CONTRACTS: ({ commit, dispatch }, network) => {    
    commit('BUILD_CONTRACTS', { network }); 
    dispatch('GET_GAMES_INFO'); 
  },
  GET_GAMES_INFO: async ({commit, dispatch, state, rootState}) => {    
    let gamesStarted = []
    for (const game of state.list) { 
      if (game.id) {
        try {
          const gamesStartedCount = await game.contract.gamesStarted(rootState.blockchain.ZERO_ADDRESS);
          if (gamesStartedCount.gt(0)) {          
            // GAME INFO
            const gameInfo = await game.contract.gameInfo(rootState.blockchain.ZERO_ADDRESS, gamesStartedCount - 1);
            commit('SET_GAME_INFO', { game, gameInfo });  
            
            if (gameInfo.running) {
              // GAME STATISTICS
              const participants = gameInfo.heads.add(gameInfo.tails).add(1)
              const gameStatistics = {
                participants: participants,
                stakes: participants.mul(gameInfo.stake)
              }
              commit('SET_GAME_STATISTICS', { game, gameStatistics }); 
              
              const checkPrizeForGames = await game.contract.getGamesParticipatedToCheckPrize(rootState.blockchain.ZERO_ADDRESS);
              if (checkPrizeForGames.length > 0) {
                const lastGameToCheckPrize = checkPrizeForGames[checkPrizeForGames.length - 1];
                if (game.info.idx.eq(lastGameToCheckPrize) ) {
                  // GAMES STARTED
                  gamesStarted.push(game.id)                   
                  // GAME DATA                 
                  //if (state.currentId === game.id)                    
                }
              }
              dispatch('GET_GAME_DATA', game);
              dispatch('GET_RAFFLE_DATA', game);
            }
          }  
        } catch (error) {
          console.error('GET_GAMES_INFO', error) 
        }                  
      } 
    } 
    commit('SET_GAMES_STARTED', gamesStarted)  
  },
  GET_GAME_DATA: async ({ commit, state, rootState }, game) => {
    console.log('GET_GAME_DATA');
    const blockchain = rootState.blockchain
    try {
      const gameData = {
        playerStakeTotal: await game.contract.getPlayerStakeTotal(blockchain.ZERO_ADDRESS), // User Profile - Total in / My stats - My in
        playerWithdrawedTotal: await game.contract.getPlayerWithdrawedTotal(blockchain.ZERO_ADDRESS), // User Profile - Total out / My stats - My out
        referralFeeWithdrawn: await game.contract.getReferralFeeWithdrawn(blockchain.ZERO_ADDRESS),  // User Profile - Referral 
        partnerFeeWithdrawn: await game.contract.getPartnerFeeWithdrawn(blockchain.ZERO_ADDRESS), // User Profile - Partnership
        referralFeePending: await game.contract.getReferralFeePending(blockchain.ZERO_ADDRESS), // My Stats - Referral
        partnerFeePending: await game.contract.getPartnerFeePending(blockchain.ZERO_ADDRESS),
      }      
      const pendingPrizeToWithdraw = await game.contract.pendingPrizeToWithdraw(blockchain.ZERO_ADDRESS, 0)
      if (pendingPrizeToWithdraw) {
        gameData.pendingPrizeToWithdrawPrize = pendingPrizeToWithdraw.prize // My Stats - Gameplay
        gameData.pendingGameplayPmcTokens = pendingPrizeToWithdraw.pmc_tokens // My Stats - Gameplay PMC
      }
      commit('SET_GAME_DATA', { game, gameData }) 
    } catch (error) {
      console.error('GET_GAME_DATA', error);
    }   
  },
  GET_RAFFLE_DATA: async ({ commit, state, rootState }, game) => {
    console.log('GET_RAFFLE_DATA');
    const blockchain = rootState.blockchain    
    try {
      const raffleData = {        
        raffleJackpotPending: await game.contract.getRaffleJackpotPending(blockchain.ZERO_ADDRESS, rootState.user.accountAddress),  // My Stats - Raffle /  User Profile - Raffle
        raffleJackpot: await game.contract.getRaffleJackpot(blockchain.ZERO_ADDRESS), // My Stats - Jackpot
        raffleParticipants: 0, // My Stats -  Participants .length
        betsTotal: await game.contract.betsTotal(blockchain.ZERO_ADDRESS), // Platform Stats - Total in
        raffleJackpotsWonTotal: await game.contract.getRaffleJackpotsWonTotal(blockchain.ZERO_ADDRESS), // Platform Stats - Jackpots won
      }    
      const raffleParticipants = await game.contract.getRaffleParticipants(blockchain.ZERO_ADDRESS)
      if (raffleParticipants && raffleParticipants.length) raffleData.raffleParticipants = raffleParticipants.length     
      commit('SET_RAFFLE_DATA', { game, raffleData }) 
    } catch (error) {
      console.error('GET_RAFFLE_DATA', error);
    }   
  },
  
};

const mutations = {  
  SET_CURRENT_GAME: (state, gameId) => {
    state.currentId = gameId;  
    state.currentIndex = state.list.findIndex(_game => _game.id === gameId)    
    //console.log('games/SET_CURRENT_GAME', state.currentId, state.currentIndex)
  },
  BUILD_CONTRACTS: (state, { network }) => {
    state.list.forEach((game, index) => {
      if (game.id) state.list[index].contract = new ethers.Contract(game.networks[network.id][network.chainId], game.abi, window.pmc.signer)
    })  
    
  },
  SET_GAME_INFO: (state, { game, gameInfo }) => {
    const index = state.list.findIndex(_game => _game.id === game.id)
    Vue.set(state.list[index], 'info', gameInfo)              
  }, 
  SET_GAMES_STARTED: (state, gamesStarted) => {
    state.started = gamesStarted;  
    console.log('games/SET_GAMES_STARTED', gamesStarted)
  },
  SET_GAME_DATA: (state, { game, gameData }) => {  
    console.log('games/SET_GAME_DATA', gameData)
    const index = state.list.findIndex(_game => _game.id === game.id)  
    Object.keys(gameData).forEach(key => Vue.set(state.list[index].data, key, gameData[key]))    
  },
  SET_RAFFLE_DATA: (state, { game, raffleData }) => {  
    console.log('games/SET_RAFFLE_DATA', raffleData)
    const index = state.list.findIndex(_game => _game.id === game.id)  
    Object.keys(raffleData).forEach(key => Vue.set(state.list[index].data, key, raffleData[key]))    
  },
  SET_GAME_STATISTICS: (state, { game, gameStatistics }) => {  
    const index = state.list.findIndex(_game => _game.id === game.id)  
    Object.keys(gameStatistics).forEach(key => Vue.set(state.list[index].statistics, key, gameStatistics[key]))    
  },
  
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};