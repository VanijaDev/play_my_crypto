
import BlockchainManager from '@/managers/blockchainManager.js';

const state = {   
  accountAddress: null,
  balance: {
    PMC: {},
    ETH: {}
  },
  gamesStarted: [],
};

const getters = {
  user: (state) => { return state },   
};

const actions = {
  SET_ACCOUNT_ADDRESS: async ({ commit,dispatch, rootState }, accountAddress) => {   //
    commit('SET_ACCOUNT_ADDRESS', accountAddress);  
    
    

    const ethBalance = await window.MetaMaskManager.getAccountBalance()    
    commit('SET_ETH_BALANCE', ethBalance);
    
    BlockchainManager.init(rootState.blockchain.chainId, 'cf', accountAddress)
    dispatch('GET_GAMES_STARTED'); 
  },
  GET_GAMES_STARTED: async ({ commit }) => {  
    const gamesStarted = await window.BlockchainManager.api_game_gamesStarted(window.BlockchainManager.ZERO_ADDRESS);
    gamesStarted > 0 ? commit('SET_GAMES_STARTED', ['COIN_FLIP']) : commit('SET_GAMES_STARTED', [])
               
  },  
};

const mutations = {  
  SET_ACCOUNT_ADDRESS: (state, accountAddress) => {
    console.log(accountAddress)
    state.accountAddress = accountAddress;  
  },
  SET_ETH_BALANCE: (state, ethBalance) => {
    console.log(ethBalance)
    state.balance.ETH = ethBalance;  
  },
  SET_GAMES_STARTED: (state, gamesStarted) => {
    state.gamesStarted = gamesStarted;  
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};