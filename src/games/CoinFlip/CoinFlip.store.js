import Vue from "vue";
import { ethers, BigNumber } from "ethers";
import constants from "../../utils/constants"

const state = {
  title: 'CoinFlip',
  instance: null,
  info: null,
};

const getters = {
  game: (state) => {
    return state
  },
};

const actions = {
  START_GAME: async ({ commit, rootState, dispatch }, { _selectedCoin, _referralAddress, _seedPhrase, _bet }) => {
    Vue.$log.debug('Coinflip/START_GAME', _selectedCoin, _referralAddress, _seedPhrase, _bet);

    commit('user/SET_TX_GAMEPLAY_IN_PROGRESS', true, { root: true });

    let coinSide = _selectedCoin;
    //  TODO: move to separate method
    if (coinSide !== constants.COIN_SIDE_HEADS && coinSide !== constants.COIN_SIDE_TAILS) {
      dispatch('notification/OPEN', {
        id: 'ERROR',
        data: "Internal Error: wrong coin side.",
        delay: 5
      }, {
        root: true
      })
      return;
    }
    Vue.$log.debug('coinSide', coinSide);

    const seedPhraseBytesHash = ethers.utils.solidityKeccak256(["string",], [_seedPhrase]);
    // Vue.$log.debug('seedPhraseBytesHash', seedPhraseBytesHash);
    const coinSideHash = ethers.utils.solidityKeccak256(["uint", "bytes",], [coinSide, seedPhraseBytesHash])
    Vue.$log.debug('coinSideHash', coinSideHash);


    let referral = ethers.constants.AddressZero;
    if (_referralAddress) {
      if (!ethers.utils.isAddress(_referralAddress)) {
        dispatch('notification/OPEN', {
          id: 'ERROR',
          data: "Error: invalid referral address.",
          delay: 5
        }, {
          root: true
        });
        return;
      } else {
        referral = _referralAddress;
      }
    }
    Vue.$log.debug('referral', referral);
    
    if (referral.toLowerCase() == rootState.user.accountAddress.toLowerCase()) {
      dispatch('notification/OPEN', {
        id: 'ERROR',
        data: "Error: please use different referral address.",
        delay: 5
      }, {
        root: true
      });
      return;
    }


    const curGameIdx = rootState.games.currentIndex;
    const gameContract = rootState.games.list[curGameIdx].contract;

    try {
      // function startGame(address _token, uint256 _tokens, bytes32 _coinSideHash, address _referral) external payable {
      const tx = await gameContract.startGame(ethers.constants.AddressZero, 0, coinSideHash, referral, {
        value: ethers.utils.parseEther(_bet)
      });
      Vue.$log.debug('Coinflip/START_GAME - tx', tx);

      dispatch('notification/OPEN', {
        id: 'TRANSACTION_PENDING',
        data: {
          tx: tx.hash
        }
      }, {
        root: true
      })
      this.$emit("eventName");

      const receipt = await tx.wait();
      Vue.$log.debug('Coinflip/START_GAME - receipt', receipt)

      if (receipt.status) {
        dispatch('notification/OPEN', {
          id: 'TRANSACTION_MINED',
          data: {
            tx: receipt.transactionHash
          },
          delay: 10
        }, {
          root: true
        })
      } else {
        dispatch('notification/OPEN', {
          id: 'TRANSACTION_ERROR',
          data: {
            tx: receipt.transactionHash
          },
          delay: 10
        }, {
          root: true
        })
      }

    } catch (error) {
      Vue.$log.error(error)
      dispatch('notification/OPEN', {
        id: 'ERROR',
        data: `ERROR: ${error.message}`,
        delay: 5
      }, {
        root: true
      })
    }

    commit('user/SET_TX_GAMEPLAY_IN_PROGRESS', false, { root: true });
    
    dispatch('GET_BALANCE');
    dispatch('games/GET_GAMES', null, {
      root: true
    });
  },

  JOIN_GAME: async ({ commit, rootState, dispatch }, { _selectedCoin, _referralAddress, _bet }) => {
    Vue.$log.debug('Coinflip/JOIN_GAME', _selectedCoin, _referralAddress, parseFloat(ethers.utils.formatEther(_bet)));
  
    commit('user/SET_TX_GAMEPLAY_IN_PROGRESS', true, { root: true });

    let coinSide = _selectedCoin;
    //  TODO: move to separate method
    if (coinSide !== constants.COIN_SIDE_HEADS || coinSide !== constants.COIN_SIDE_TAILS) {
      dispatch('notification/OPEN', {
        id: 'ERROR',
        data: "Internal Error: wrong coin side.",
        delay: 5
      }, {
        root: true
      })
      return;
    }
    Vue.$log.debug('coinSide', coinSide);


    let referral = ethers.constants.AddressZero;
    if (_referralAddress) {
      if (!ethers.utils.isAddress(_referralAddress)) {
        dispatch('notification/OPEN', {
          id: 'ERROR',
          data: "Error: invalid referral address.",
          delay: 5
        }, {
          root: true
        });
        return;
      } else {
        referral = _referralAddress;
      }
    }
    Vue.$log.debug('referral', referral);







    commit('user/SET_TX_GAMEPLAY_IN_PROGRESS', false, { root: true });
    
    dispatch('GET_BALANCE');
    dispatch('games/GET_GAMES', null, {
      root: true
    });
  },

  // GET_PLAYER_STAKE_TOTAL: async ({
  //   commit,
  //   state
  // }, {
  //   token
  // }) => {
  //   try {
  //     commit('SET_INFO', await state.instance.getPlayerStakeTotal(token))
  //   } catch (error) {
  //     commit('SET_INFO', null)
  //   }
  // },
};

const mutations = {
  SET_INFO: (state, info) => {
    state.info = info;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};