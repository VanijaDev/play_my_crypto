import Vue from "vue";
import { ethers } from "ethers";
import  PMC  from '@/blockchain/pmc.contract.js';
import  Staking  from '@/blockchain/staking.contract.js';

const state = { 
  networks: [
    {
      id: 'ETH',
      name: 'ETHEREUM',
      icon: '/img/ethereum_icon.svg', 
      chainId: null,
      chains: [
        //{ id: '0x1', name: 'Mainnet' },
        { id: '0x3', name: 'Ropsten' },
        { id: '0x2a', name: 'Kovan' }, 
      ]   
    },
    {
      id: 'BSC',
      name: 'BINANCE',
      icon: '/img/binance_icon.svg', 
      chainId: null,
      chains: [
        { id: '0x56', name: 'Mainnet' },
        { id: '0x97', name: 'Chapel' },
      ]       
    }
  ],  
  network: null,
  signer: null,
  pmcContract: null,
  stakingContract: null,
  gamesContracts: {},
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
};

state.network = state.networks[0]

const getters = {
  blockchain: (state) => { return state },  
};

const actions = {
  ON_LOAD: ({ dispatch, state }) => {  
    if (window.ethereum !== null && typeof window.ethereum !== 'undefined') {      
      window.ethereum.autoRefreshOnNetworkChange = false  
      window.pmc.provider = new ethers.providers.Web3Provider(window.ethereum)
      dispatch('SET_NETWORK')
      dispatch('user/INIT', state.network, { root: true })
    }
  },
  ON_CHAIN_CANGE: ({ dispatch }) => {     
    dispatch('ON_LOAD')      
  },
  INIT: ({ commit, dispatch, state }) => {
    commit('BUILD_CONTRACTS') 
    dispatch('games/BUILD_CONTRACTS', state.network, { root: true })
    
  },
  SET_CHAIN_ID: ({ commit }, chainId) => { 
    commit('SET_CHAIN_ID', chainId) 
  },
  SET_NETWORK: ({ commit }) => {
    const network = state.networks.find(network => network.chains.find(chain => chain.id === window.ethereum.chainId))
    console.log('network', network)  
    commit('SET_NETWORK', network);    
  },
};

const mutations = {  
  SET_CHAIN_ID: (state, chainId) => {
    state.chainId = chainId;  
  },
  SET_NETWORK: (state, network) => {
    state.network = network; 
    if(state.network) {
      Vue.set(state.network, 'chainId', window.ethereum.chainId)
    }    
  }, 
  BUILD_CONTRACTS: (state) => {    
    state.pmcContract = new ethers.Contract(PMC.networks[state.network.id][state.network.chainId], PMC.abi, window.pmc.signer)
    state.stakingContract = new ethers.Contract(Staking.networks[state.network.id][state.network.chainId], Staking.abi, window.pmc.signer)    
  }, 
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};