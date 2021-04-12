import Vue from "vue";
import { ethers, BigNumber } from "ethers";

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
  START_GAME: async ({ rootState, dispatch }, { _selectedCoin, _referalAddress, _seedPhrase, _bet }) => {
    Vue.$log.debug('Coinflip/START_GAME')

    // function startGame(address _token, uint256 _tokens, bytes32 _coinSideHash, address _referral) external payable {
    
    const curGameIdx = rootState.games.currentIndex;
    const gameContract = rootState.games.list[curGameIdx].contract;
    
    const coinSideHash = "";
    const referral = (_referalAddress && ethers.utils.isAddress(_referalAddress)) ? _referalAddress : ethers.AddressZero;
    Vue.$log.debug('referral', referral)


    // console.log(_selectedCoin, _referalAddress, _seedPhrase, _bet);


    return;


    try {
      const tx = await gameContract.startGame(ethers.constants.AddressZero, 0, );
      Vue.$log.debug('Coinflip/START_GAME - tx', tx);

      dispatch('notification/OPEN', {
        id: 'TRANSACTION_PENDING',
        data: {
          tx: tx.hash
        }
      }, {
        root: true
      })

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