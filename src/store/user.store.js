import Vue from "vue";
import { ethers, BigNumber } from "ethers";

const state = {   
  accountAddress: null,  
  balanceETH: null,
  balancePMC: null,
  gamesStarted: [],
  pmcAllowance: null,
  stakingData: {},
};

const getters = {
  user: (state) => { return state },  
};

const actions = {
  INIT: async ({ commit, dispatch }, accountAddress) => {  
    console.log('user/INIT')
    commit('SET_ACCOUNT_ADDRESS', accountAddress);
    dispatch('GET_BALANCE');
    dispatch('GET_STAKING_DATA')
    dispatch('CHECK_PMC_ALLOWANCE');
  },

  GET_BALANCE: async ({ commit, state, rootState }) => {   
    console.log('user/GET_BALANCE')
    try {
      const balance = {
        balanceETH: await window.pmc.provider.getBalance(state.accountAddress),
        balancePMC: await rootState.blockchain.pmcContract.balanceOf(state.accountAddress)        
      } 
      commit('SET_BALANCE', balance)
    } catch (error) {
      console.error('GET_BALANCE', error)
    }
  },

  GET_STAKING_DATA: async ({ commit, state, rootState }) => {
    console.log('user/GET_STAKING_DATA')
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
      console.error('GET_STAKING_DATA', error);
    }   
  },
    
  CHECK_PMC_ALLOWANCE: async ({ commit, state, rootState }) => {     
    console.log('user/CHECK_PMC_ALLOWANCE')
    try {      
      const pmcAllowance = await rootState.blockchain.pmcContract.allowance(state.accountAddress, rootState.blockchain.stakingContract.address)
      commit('SET_PMC_ALLOWANCE', pmcAllowance) 
    } catch (error) {
      console.error('CHECK_PMC_ALLOWANCE', error);
    }   
  }, 
  
  APPROVE_PCM_STAKE: async ({ dispatch, rootState }) => {
    console.log('user/APPROVE_PCM_STAKE')
    const tx = await rootState.blockchain.pmcContract.approve(rootState.blockchain.stakingContract.address, ethers.constants.MaxUint256)
    console.log("tx:", tx);
    dispatch('notification/OPEN', { id: 'PENDING_TRANSACTION', data: { tx: tx.hash } }, { root: true })
    
    const receipt = await tx.wait(); 
    console.log("receipt:", receipt); 
    if (receipt.status) {
      dispatch('notification/OPEN', { id: 'MINED_TRANSACTION', data: { tx: receipt.transactionHash }, delay: 10 }, { root: true })      
    } else {
      dispatch('notification/OPEN', { id: 'TRANSACTION_ERROR', data: { tx: receipt.transactionHash }, delay: 10 }, { root: true })  
    }
    
    dispatch('CHECK_PMC_ALLOWANCE');  
  },

  ADD_STAKE: async ({ rootState }, addStakeAmount) => {
    const tx = await rootState.blockchain.stakingContract.stake(addStakeAmount);
    console.log("tx:", tx);
    console.log("mining...");
    const receipt = await tx.wait();
    console.log("success:", receipt);   
  },

  WITHDRAW_STAKING_REWARD: async ({ rootState }) => {
    const tx = await rootState.blockchain.stakingContract.withdrawReward(0);
    console.log("tx:", tx);
    console.log("mining...");
    const receipt = await tx.wait();
    console.log("success:", receipt); 
  },

  UNSTAKE: async ({ rootState }) => {
    const tx = await rootState.blockchain.stakingContract.unstake();
    console.log("tx:", tx);
    console.log("mining...");
    const receipt = await tx.wait();
    console.log("success:", receipt);
  }, 

  DESTROY: async ({ commit }) => {
    console.log('user/DESTROY')
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