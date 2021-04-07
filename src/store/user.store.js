import Vue from "vue";
import {
  ethers,
  BigNumber
} from "ethers";

const state = {
  accountAddress: null,
  balanceETH: null,
  balancePMC: null,
  gamesStarted: [],
  pmcAllowance: null,
  stakingData: {},
};

const getters = {
  user: (state) => {
    return state
  },
};

const actions = {
  LISTEN_FOR_EVENTS: async ({
    dispatch,
    rootState
  }) => {
    Vue.$log.debug('user.store/LISTEN_FOR_EVENTS - init');

    //  staking
    const stakingContract = rootState.blockchain.stakingContract;
    stakingContract.on("Stake", (addr, tokens) => {
      Vue.$log.debug('user.store/LISTEN_FOR_EVENTS', "Stake", addr, tokens);

      dispatch('GET_STAKING_DATA')
    });

    stakingContract.on("Unstake", (addr) => {
      Vue.$log.debug('user.store/LISTEN_FOR_EVENTS', "Unstake", addr);

      dispatch('GET_STAKING_DATA')
    });
  },

  INIT: async ({
    commit,
    dispatch
  }, accountAddress) => {
    Vue.$log.debug('user/INIT')
    commit('SET_ACCOUNT_ADDRESS', accountAddress);
    dispatch('GET_BALANCE');
    dispatch('GET_STAKING_DATA')
    dispatch('CHECK_PMC_ALLOWANCE');
    dispatch('LISTEN_FOR_EVENTS');
  },

  GET_BALANCE: async ({
    commit,
    state,
    rootState
  }) => {
    Vue.$log.debug('user/GET_BALANCE')
    try {
      const balance = {
        balanceETH: await window.pmc.provider.getBalance(state.accountAddress),
        balancePMC: await rootState.blockchain.pmcContract.balanceOf(state.accountAddress)
      }
      commit('SET_BALANCE', balance)
    } catch (error) {
      Vue.$log.error('GET_BALANCE', error)
    }
  },

  GET_STAKING_DATA: async ({
    commit,
    state,
    rootState
  }) => {
    Vue.$log.debug('user/GET_STAKING_DATA')
    const stakingContract = rootState.blockchain.stakingContract
    try {
      const calculateRewardAndStartIncomeIdx = await stakingContract.calculateRewardAndStartIncomeIdx(state.accountAddress)
      const pendingRewardOf = await stakingContract.pendingRewardOf(state.accountAddress) // Staking - Available to withdraw
      const tokensStaked = await stakingContract.tokensStaked()
      const stake = await stakingContract.stakeOf(state.accountAddress)
      let stakePercent = 0
      if (stake.gt(0)) stakePercent = stake.mul(BigNumber.from('1000000000000000000')).div(tokensStaked)

      const stakingData = {
        calculateRewardAndStartIncomeIdxReward: calculateRewardAndStartIncomeIdx.reward, // Staking - Available to withdraw
        pendingRewardOf: pendingRewardOf,
        availableToWithdraw: calculateRewardAndStartIncomeIdx.reward.add(pendingRewardOf), // ?????????????????
        tokensStaked: tokensStaked, // Stats - Total staken
        stakingRewardWithdrawn: await stakingContract.stakingRewardWithdrawnOf(state.accountAddress), // User Profile - Staking
        stake: stake, // Stats - Your stake
        stakePercent: stakePercent, // Stats - Your stake Percent
        stakePercentShort: (parseFloat(stakePercent) / 1000000000000000000).toFixed(2),
      }
      commit('SET_STAKING_DATA', stakingData)
    } catch (error) {
      Vue.$log.error('GET_STAKING_DATA', error);
    }
  },

  CHECK_PMC_ALLOWANCE: async ({
    commit,
    state,
    rootState
  }) => {
    Vue.$log.debug('user/CHECK_PMC_ALLOWANCE')
    try {
      const pmcAllowance = await rootState.blockchain.pmcContract.allowance(state.accountAddress, rootState.blockchain.stakingContract.address)
      commit('SET_PMC_ALLOWANCE', pmcAllowance)
    } catch (error) {
      Vue.$log.error('CHECK_PMC_ALLOWANCE', error);
    }
  },

  APPROVE_PCM_STAKE: async ({
    dispatch,
    rootState
  }) => {
    Vue.$log.debug('user/APPROVE_PCM_STAKE')
    //dispatch('notification/OPEN', { id: 'TRANSACTION_PENDING', data: { tx: '0x8a7caa0e7587262e1d2aa87ac44b6396e30623059e45f5daec22bb3e5e6f665a' } }, { root: true })
    try {
      const tx = await rootState.blockchain.pmcContract.approve(rootState.blockchain.stakingContract.address, 21515) //ethers.constants.MaxUint256
      Vue.$log.debug('user/APPROVE_PCM_STAKE - tx', tx);
      dispatch('notification/OPEN', {
        id: 'TRANSACTION_PENDING',
        data: {
          tx: tx.hash
        }
      }, {
        root: true
      })
      const receipt = await tx.wait();
      Vue.$log.debug('user/APPROVE_PCM_STAKE - receipt', receipt)
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
    dispatch('CHECK_PMC_ALLOWANCE');
  },

  ADD_STAKE: async ({
    dispatch,
    rootState
  }, addStakeAmount) => {
    Vue.$log.debug('user/ADD_STAKE')
    try {
      const tx = await rootState.blockchain.stakingContract.stake(addStakeAmount)
      Vue.$log.debug('user/ADD_STAKE - tx', tx);
      dispatch('notification/OPEN', {
        id: 'TRANSACTION_PENDING',
        data: {
          tx: tx.hash
        }
      }, {
        root: true
      })
      const receipt = await tx.wait();
      Vue.$log.debug('user/ADD_STAKE - receipt', receipt)
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
    dispatch('GET_STAKING_DATA');
  },

  WITHDRAW_STAKING_REWARD: async ({
    dispatch,
    rootState
  }) => {
    Vue.$log.debug('user/WITHDRAW_STAKING_REWARD')
    try {
      const tx = await rootState.blockchain.stakingContract.withdrawReward(0)
      Vue.$log.debug('user/WITHDRAW_STAKING_REWARD - tx', tx);
      dispatch('notification/OPEN', {
        id: 'TRANSACTION_PENDING',
        data: {
          tx: tx.hash
        }
      }, {
        root: true
      })
      const receipt = await tx.wait();
      Vue.$log.debug('user/WITHDRAW_STAKING_REWARD - receipt', receipt)
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
    dispatch('GET_STAKING_DATA');
  },

  UNSTAKE: async ({
    dispatch,
    rootState
  }) => {
    Vue.$log.debug('user/UNSTAKE')
    try {
      const tx = await rootState.blockchain.stakingContract.unstake()
      Vue.$log.debug('user/UNSTAKE - tx', tx);
      dispatch('notification/OPEN', {
        id: 'TRANSACTION_PENDING',
        data: {
          tx: tx.hash
        }
      }, {
        root: true
      })
      const receipt = await tx.wait();
      Vue.$log.debug('user/UNSTAKE - receipt', receipt)
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
    dispatch('GET_STAKING_DATA');
  },

  DESTROY: async ({
    commit
  }) => {
    Vue.$log.debug('user/DESTROY')
    commit('DESTROY')
  },
};

const mutations = {
  SET_ACCOUNT_ADDRESS: (state, accountAddress) => {
    state.accountAddress = accountAddress;
  },

  SET_BALANCE: (state, balance) => {
    Object.keys(balance).forEach(key => Vue.set(state, key, balance[key]))
  },
  SET_PMC_ALLOWANCE: (state, pmcAllowance) => {
    state.pmcAllowance = pmcAllowance;
  },

  SET_STAKING_DATA: (state, stakingData) => {
    Object.keys(stakingData).forEach(key => Vue.set(state.stakingData, key, stakingData[key]))
  },

  DESTROY: (state) => {
    //  TODO
    // if (stakingContract) {
    //   stakingContract.removeAllListeners();
    // }

    state.accountAddress = null
    state.balanceETH = null
    state.balancePMC = null
    state.gamesStarted = []
    state.pmcAllowance = null
    state.stakingData = {}
  }
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};