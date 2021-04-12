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
  START_GAME: async ({ rootState, dispatch }, { _selectedCoin, _referalAddress, _seedPhrase, _bet }) => {
    Vue.$log.debug('Coinflip/START_GAME', _selectedCoin, _referalAddress, _seedPhrase, _bet)

    let coinSide = "0";
    if (_selectedCoin === constants.coinSide_BTC) {
      coinSide = "1";
    } else if (_selectedCoin === constants.coinSide_ETH) {
      coinSide = "2";
    } else {
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
    

    const seedPhraseBytesHash = ethers.utils.solidityKeccak256([ "string", ], [ _seedPhrase ]);
    // Vue.$log.debug('seedPhraseBytesHash', seedPhraseBytesHash);
    const coinSideHash = ethers.utils.solidityKeccak256([ "uint", "bytes", ], [ coinSide, seedPhraseBytesHash ])
    Vue.$log.debug('coinSideHash', coinSideHash);


    let referral = ethers.constants.AddressZero;
    if (_referalAddress) {
      if (!ethers.utils.isAddress(_referalAddress)) {
        dispatch('notification/OPEN', {
          id: 'ERROR',
          data: "Error: invalid referral address.",
          delay: 5
        }, {
          root: true
        });
        return;
      } else {
        referral = _referalAddress;
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

return
    const curGameIdx = rootState.games.currentIndex;
    const gameContract = rootState.games.list[curGameIdx].contract;

    try {
      // function startGame(address _token, uint256 _tokens, bytes32 _coinSideHash, address _referral) external payable {
      const tx = await gameContract.startGame(ethers.constants.AddressZero, 0, coinSideHash, referral, {
        value: 111111111111111111
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