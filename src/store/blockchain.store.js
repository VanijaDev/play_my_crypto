const state = { 
  chainId: null,   
  network: null,
  networks: [
    { 
      id: 'ETH', 
      name: 'ETHEREUM', 
      icon: '/img/ethereum_icon.svg', 
      availableChainId: '0x3', //'Ox1'
    },
    { 
      id: 'BSC', 
      name: 'BINANCE', 
      icon: '/img/binance_icon.svg',
      availableChainId: '0x38'
  },
  ]
};

state.network = state.networks[0]

const getters = {
  blockchain: (state) => { return state },  
};

const actions = {
  SET_CHAIN_ID: ({ commit }, chainId) => {    
    commit('SET_CHAIN_ID', chainId); 
  },
  SET_NETWORK: ({ commit }, network) => {    
    commit('SET_NETWORK', network); 
  },
};

const mutations = {  
  SET_CHAIN_ID: (state, chainId) => {
    state.chainId = chainId;  
  },
  SET_NETWORK: (state, network) => {
    state.network = network;  
  }, 
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};