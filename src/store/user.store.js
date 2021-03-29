import Vue from "vue";
import { ethers, BigNumber } from "ethers";

const state = {   
  accountAddress: null,  
  balanceETH: null,
  balancePMC: null,

  gamesStarted: [],

  pmcAllowance: null,  

  
  totalIn: null, //
  playerWithdrawedTotal: null,
  referralFeeWithdrawn: null,
  partnerFeeWithdrawn: null,
  pendingPrizeToWithdrawPrize: null,
  pendingGameplayPmcTokens: null,
  referralFeePending: null,
  raffleJackpotPending: null,
  partnerFeePending: null,
  raffleParticipants: [],
  raffleJackpot: null,
  
  calculateRewardAndStartIncomeIdxReward: null,  
  pendingRewardOf: null,
  availableToWithdraw: null,
  tokensStaked: null,
  stakingRewardWithdrawn: null,
  stake: null,
  stakePercent: null,
  stakePercentShort: null,

  stakingData: {},
};

const stateDefaults = JSON.parse(JSON.stringify(state));

async function getAccountAddress() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error) {
   return null;
  }
}
async function getAccountBalance(accountAddress) {
  try {
    return await window.pmc.provider.getBalance(accountAddress);
  } catch (error) {
    return 0;
  }
}

const getters = {
  user: (state) => { return state },  
};

const actions = {
  INIT: async ({ commit, dispatch }, network) => {
    commit('DESTROY');
    if (network) {
      //console.log('USER_INIT')
      const accountAddress = await getAccountAddress()
      commit('SET_ACCOUNT_ADDRESS', accountAddress);
      if (!accountAddress) return commit('DESTROY')

      dispatch('blockchain/INIT', accountAddress, { root: true })
      dispatch('GET_BALANCE');
      dispatch('GET_STAKING_DATA')
      dispatch('CHECK_PMC_ALLOWANCE');
      
    } else {
      console.log('USER_DESTROY')
      commit('DESTROY');
    }      
  },

  GET_BALANCE: async ({ commit, state, rootState }) => {    
    try {
      const balance = {
        balanceETH: await getAccountBalance(state.accountAddress),
        balancePMC: await rootState.blockchain.pmcContract.balanceOf(state.accountAddress)        
      } 
      commit('SET_BALANCE', balance)
    } catch (error) {
      console.error('GET_BALANCE', error)
    }
  },

  GET_STAKING_DATA: async ({ commit, state, rootState }) => {
    const stakingContract = rootState.blockchain.stakingContract
    console.log('GET_STAKING_DATA');
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
    try {      
      const pmcAllowance = await rootState.blockchain.pmcContract.allowance(state.accountAddress, rootState.blockchain.stakingContract.address)
      console.log('games/CHECK_PMC_ALLOWANCE', pmcAllowance)
      commit('SET_PMC_ALLOWANCE', pmcAllowance) 
    } catch (error) {
      console.error('CHECK_PMC_ALLOWANCE', error);
    }   
  }, 
  
  APPROVE_PCM_STAKE: async ({ dispatch, state, rootState }) => {
    const tx = await rootState.blockchain.pmcContract.approve(rootState.blockchain.stakingContract.address, ethers.constants.MaxUint256); //ethers.utils.parseEther(Number.MAX_SAFE_INTEGER.toString())
    console.log("tx:", tx);
    console.log("mining...");
    const receipt = await tx.wait(); 
    console.log("receipt:", receipt); 
    dispatch('CHECK_PMC_ALLOWANCE');  
  },
  ADD_STAKE: async ({ state, rootState }, addStakeAmount) => {
    const tx = await rootState.blockchain.stakingContract.stake(addStakeAmount);
    console.log("tx:", tx);
    console.log("mining...");
    const receipt = await tx.wait();
    console.log("success:", receipt);   
  },
  WITHDRAW_STAKING_REWARD: async ({ state, rootState }) => {
    const tx = await rootState.blockchain.stakingContract.withdrawReward(0);
    console.log("tx:", tx);
    console.log("mining...");
    const receipt = await tx.wait();
    console.log("success:", receipt); 
  },
  UNSTAKE: async ({ state, rootState }) => {
    const tx = await rootState.blockchain.stakingContract.unstake();
    console.log("tx:", tx);
    console.log("mining...");
    const receipt = await tx.wait();
    console.log("success:", receipt);
  },
  

};

const mutations = {  
  SET_ACCOUNT_ADDRESS: (state, accountAddress) => {    
    state.accountAddress = accountAddress;  
    window.pmc.signer = window.pmc.provider.getSigner();
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
    Object.keys(stateDefaults).forEach(key => Vue.set(state, key, stateDefaults[key]))
    window.pmc.signer = null;
  }
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};