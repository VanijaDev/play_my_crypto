import Vue from "vue";
import { ethers } from "ethers";

const getters = {
  list: (state) => {
    return state.list
  },
  started: (state) => {
    return state.started
  },
  listOfGames: (state) => {
    return state.list.filter(g => g.id !== null)
  },
  currentGame: state => state.currentIndex !== null ? state.list[state.currentIndex] : {},
  getGameById: state => gameId => state.list.find(game => game.id === gameId),
};

const actions = {
  LISTEN_FOR_EVENTS: async ({
    //commit,
    dispatch,
    //rootState
  }) => {
    Vue.$log.debug('games.store/LISTEN_FOR_EVENTS - init')

    state.list.forEach((game, index) => {
      if (game.id) {
        const gameContract = state.list[index].contract;
        const gameId = state.list[index].id;

        //  gameplay
        gameContract.on(gameId + "_GameStarted", async (token, id) => {
          Vue.$log.debug('games.store/LISTEN_FOR_EVENTS', gameId + "_GameStarted", token, id);

          dispatch('user/GET_BALANCE', null, {
            root: true
          });
          dispatch('GET_GAMES');
        });

        gameContract.on(gameId + "_GameJoined", async (token, id, opponent) => {
          Vue.$log.debug('games.store/LISTEN_FOR_EVENTS', gameId + "_GameJoined", token, id, opponent);

          dispatch('user/GET_BALANCE', null, {
            root: true
          });
          dispatch('GET_GAMES');
        });

        gameContract.on(gameId + "_GameFinished", async (token, id, timeout) => {
          Vue.$log.debug('games.store/LISTEN_FOR_EVENTS', gameId + "_GameFinished", token, id, timeout);

          dispatch('user/GET_BALANCE', null, {
            root: true
          });
          dispatch('GET_GAMES');
        });

        gameContract.on(gameId + "_PrizeWithdrawn", async (token, player, prize, pmc) => {
          Vue.$log.debug('games.store/LISTEN_FOR_EVENTS', gameId + "_PrizeWithdrawn", token, player, prize, pmc);

          dispatch('user/GET_BALANCE', null, {
            root: true
          });
          dispatch('GET_GAMES');
        });

        //  raffle

        //  commented because _GameFinished event will update entire data
        // gameContract.on(gameId + "_RafflePlayed", async (token, winner, prize) => {
        //   Vue.$log.debug('games.store/LISTEN_FOR_EVENTS', gameId + "_RafflePlayed", token, winner, prize);
        //   dispatch('user/GET_BALANCE', null, {
        //     root: true
        //   });
        //   dispatch('GET_GAMES');
        // });

        gameContract.on(gameId + "_RaffleJackpotWithdrawn", async (token, amount, winner) => {
          Vue.$log.debug('games.store/LISTEN_FOR_EVENTS', gameId + "_RaffleJackpotWithdrawn", token, amount, winner);

          dispatch('user/GET_BALANCE', null, {
            root: true
          });
          dispatch('GET_GAMES');
        });
      }
    })
  },

  INIT: async ({
    dispatch
  }) => {
    Vue.$log.debug('games/INIT')
    dispatch('BUILD_CONTRACTS');
    dispatch('GET_GAMES');
    dispatch('LISTEN_FOR_EVENTS');
  },

  SET_CURRENT_GAME: async ({
    commit
  }, gameId) => {
    Vue.$log.debug('games/SET_CURRENT_GAME')
    commit('SET_CURRENT_GAME', gameId);
  },

  BUILD_CONTRACTS: ({
    commit,
    rootState
  }) => {
    Vue.$log.debug('games/BUILD_CONTRACTS')
    commit('BUILD_CONTRACTS', rootState.blockchain);
  },

  GET_GAMES: async ({
    commit,
    dispatch,
    state
  }) => {
    Vue.$log.debug('games/GET_GAMES')

    let userGamesStarted = []
    for (const game of state.list) {
      if (game.id) {
        try {
          const gamesStarted = await game.contract.gamesStarted(ethers.constants.AddressZero);
          const gamesFinished = await game.contract.gamesFinished(ethers.constants.AddressZero);
          
          commit('SET_GAMEPLAY', { game, gameplay: { gamesStarted, gamesFinished } });

          if (gamesStarted.gt(0)) {
            // GAME INFO
            const gameInfo = await game.contract.gameInfo(ethers.constants.AddressZero, gamesStarted - 1);
            // Vue.$log.debug('GET_GAMES_INFO', gameInfo)
            commit('SET_GAME_INFO', {
              game,
              gameInfo
            });

            commit('DESTROY_GAME_STATISTICS', {
              game
            })
            if (gameInfo.running) {
              dispatch('GET_GAME_STATISTICS', {
                game,
                gameInfo
              });
              const gamesParticipatedToCheckPrize = await game.contract.getGamesParticipatedToCheckPrize(ethers.constants.AddressZero);
              commit('SET_GAMEPLAY', { game, gameplay: { gamesParticipatedToCheckPrize } });
              if (gamesParticipatedToCheckPrize.length > 0) {
                const lastGameToCheckPrize = gamesParticipatedToCheckPrize[gamesParticipatedToCheckPrize.length - 1];
                if (game.info.idx.eq(lastGameToCheckPrize)) {
                  // GAMES STARTED
                  userGamesStarted.push(game.id)
                }
              }
            }
            dispatch('GET_GAME_DATA', game);
            dispatch('GET_GAME_RAFFLE', game);
          }
        } catch (error) {
          Vue.$log.error('GET_GAMES_INFO', error)
        }
      }
    }
    commit('SET_GAMES_STARTED', userGamesStarted)
  },

  GET_GAME_STATISTICS: ({
    commit
  }, {
    game,
    gameInfo
  }) => {
    Vue.$log.debug('games/GET_GAME_STATISTICS')
    const participants = gameInfo.heads.add(gameInfo.tails).add(1)
    const gameStatistics = {
      participants: participants,
      stakes: participants.mul(gameInfo.stake)
    }
    commit('SET_GAME_STATISTICS', {
      game,
      gameStatistics
    });
  },

  GET_GAME_DATA: async ({
    commit,
    rootState
  }, game) => {
    Vue.$log.debug('games/GET_GAME_DATA')
    try {
      const gameData = {
        playerStakeTotal: await game.contract.getPlayerStakeTotal(ethers.constants.AddressZero), // User Profile - Total in / My stats - My in
        playerWithdrawedTotal: await game.contract.getPlayerWithdrawedTotal(ethers.constants.AddressZero), // User Profile - Total out / My stats - My out
        referralFeeWithdrawn: await game.contract.getReferralFeeWithdrawn(ethers.constants.AddressZero), // User Profile - Referral 
        partnerFeeWithdrawn: await game.contract.getPartnerFeeWithdrawn(ethers.constants.AddressZero), // User Profile - Partnership
        referralFeePending: await game.contract.getReferralFeePending(ethers.constants.AddressZero), // My Stats - Referral
        partnerFeePending: await game.contract.getPartnerFeePending(ethers.constants.AddressZero),
        betsTotal: await game.contract.betsTotal(ethers.constants.AddressZero), // Platform Stats - Total in
        pendingGameplayPmcTokens: await game.contract.playerPendingWithdrawalPMC(rootState.user.accountAddress),
        referralFeeWithdrawnTotal: await game.contract.getReferralFeeWithdrawnTotal(ethers.constants.AddressZero),
        partnerFeeWithdrawnTotal: await game.contract.getPartnerFeeWithdrawnTotal(ethers.constants.AddressZero),
        referralInGame: await game.contract.getReferralInGame(ethers.constants.AddressZero, game.info.idx),
        coinSideForOpponent: await game.contract.opponentCoinSideForOpponent(ethers.constants.AddressZero, game.info.idx),
      }

      const prizeObj = (await game.contract.pendingPrizeToWithdraw(ethers.constants.AddressZero, 0));
      gameData.pendingPrizeToWithdrawPrize = prizeObj.prize; // My Stats - Gameplay
      gameData.pendingPrizeToWithdrawPMCBonus = prizeObj.pmc_tokens;  // My Stats - Gameplay PMC bonus

      commit('SET_GAME_DATA', {
        game,
        gameData
      })
    } catch (error) {
      Vue.$log.error('GET_GAME_DATA', error);
    }
  },

  GET_GAME_RAFFLE: async ({
    commit,
    rootState
  }, game) => {
    Vue.$log.debug('games/GET_GAME_RAFFLE')
    try {
      const raffleData = {
        raffleJackpotPending: await game.contract.getRaffleJackpotPending(ethers.constants.AddressZero, rootState.user.accountAddress), // Pending withdrawal -> Raffle
        raffleJackpot: await game.contract.getRaffleJackpot(ethers.constants.AddressZero), // Ongoing raffle -> Jackpot
        raffleParticipants: 0, // Ongoing raffle -  Participants .length
        raffleJackpotsWonTotal: await game.contract.getRaffleJackpotsWonTotal(ethers.constants.AddressZero), // Platform Stats - Jackpots won
      }
      const raffleParticipants = await game.contract.getRaffleParticipants(ethers.constants.AddressZero)
      if (raffleParticipants && raffleParticipants.length) raffleData.raffleParticipants = raffleParticipants.length
      commit('SET_GAME_RAFFLE', {
        game,
        raffleData
      })
    } catch (error) {
      Vue.$log.error('GET_GAME_RAFFLE', error);
    }
  },

  DESTROY: async ({
    commit
  }) => {
    Vue.$log.debug('games/DESTROY')
    commit('DESTROY')
  },

};

const mutations = {
  SET_CURRENT_GAME: (state, gameId) => {
    state.currentId = gameId;
    state.currentIndex = state.list.findIndex(_game => _game.id === gameId)
  },

  BUILD_CONTRACTS: (state, blockchain) => {
    state.list.forEach((game, index) => {
      if (game.id) state.list[index].contract = new ethers.Contract(game.networks[blockchain.networks[blockchain.networkIndex].id][blockchain.chainId], game.abi, window.pmc.signer)
    })
  },

  SET_GAME_INFO: (state, {
    game,
    gameInfo
  }) => {
    const index = state.list.findIndex(_game => _game.id === game.id)
    Vue.set(state.list[index], 'info', gameInfo)
  },

  SET_GAMES_STARTED: (state, userGamesStarted) => {
    state.started = userGamesStarted;
  },

  SET_GAMEPLAY: (state, {game, gameplay}) => {
    const index = state.list.findIndex(_game => _game.id === game.id)
    Object.keys(gameplay).forEach(key => Vue.set(state.list[index].gameplay, key, gameplay[key]))
  },

  SET_GAME_DATA: (state, {
    game,
    gameData
  }) => {
    const index = state.list.findIndex(_game => _game.id === game.id)
    Object.keys(gameData).forEach(key => Vue.set(state.list[index].data, key, gameData[key]))
  },

  SET_GAME_RAFFLE: (state, {
    game,
    raffleData
  }) => {
    const index = state.list.findIndex(_game => _game.id === game.id)
    Object.keys(raffleData).forEach(key => Vue.set(state.list[index].data, key, raffleData[key]))
  },

  SET_GAME_STATISTICS: (state, {
    game,
    gameStatistics
  }) => {
    const index = state.list.findIndex(_game => _game.id === game.id)
    Object.keys(gameStatistics).forEach(key => Vue.set(state.list[index].statistics, key, gameStatistics[key]))
  },

  DESTROY_GAME_STATISTICS: (state, {
    game,
  }) => {
    const index = state.list.findIndex(_game => _game.id === game.id)
    state.list[index].statistics = {
      participants: 0
    }
  },

  DESTROY: (state) => {
    state.list.forEach((game, index) => {
      if (game.id) {
        if (state.list[index].contract) {
          state.list[index].contract.removeAllListeners();
        }

        state.list[index].contract = null
        state.list[index].statistics = {
          participants: 0
        }
        state.list[index].data = {}
      }
    })
    state.started = []
  },

};

const state = {
  currentId: null,  //  CF, RPS
  currentIndex: null, //  idx in list
  started: [],
  list: [
    {
      id: 'CF',
      name: 'Coin Flip',
      routeName: 'coin-flip',
      filesFolder: 'CoinFlip',
      image: '/img/game_coin_flip.svg',
      imagePartner: '/img/game_coin_flip_partner.svg',
      networks: {
        ETH: {
          '0x2a': "", // kovan
          '0x3': "0x7DFF7782196749344de4fA37C5060Dd1B86A86F3", // ropsten
          '0x539': "0xFa73d3E5a091E8933EeE7E3766f827FD5974F60d", // ganache
        }
      },
      contract: null,
      statistics: {
        participants: 0
      },
      gameplay: {},
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
          "name": "playerPendingWithdrawalPMC",
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
          "inputs": [],
          "name": "withdrawPendingPMC",
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
      id: null,
      name: 'NEW GAME',
      routePath: null,
      image: '/img/no_game.png'
    },
    {
      id: null,
      name: 'NEW GAME',
      routePath: null,
      image: '/img/no_game.png'
    },
    {
      id: null,
      name: 'NEW GAME',
      routePath: null,
      image: '/img/no_game.png'
    },
  ],
  
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};