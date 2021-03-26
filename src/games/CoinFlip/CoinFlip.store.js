const state = {   
  title: 'CoinFlip',
  instance: null, 
  info: null,
};

const getters = {
  game: (state) => { return state },   
};

const actions = {
  GET_INFO: async ({ commit, state }, {token, idx}) => {     
    try {
      commit('SET_INFO', await state.instance.gameInfo(token, idx))       
    } catch (error) {
      commit('SET_INFO', null) 
    }     
  }, 
   GET_PLAYER_STAKE_TOTAL:  async ({ commit, state }, {token}) => {     
    try {
      commit('SET_INFO', await state.instance.getPlayerStakeTotal(token))       
    } catch (error) {
      commit('SET_INFO', null) 
    }     
  },
};

const mutations = {  
  SET_INFO: (state, info) => {
    state.info = info;  
  },
};

const api = {
  


  api_game_getReferralFeePending: async function (_token) {
    return this.gameInst.getReferralFeePending(_token);
  },

  api_game_getRaffleJackpotWithdrawn: async function (_token, _acc) {
    return this.gameInst.getRaffleJackpotWithdrawn(_token, _acc);
  },

  api_game_getRaffleJackpotPending: async function (_token, _acc) {
    return this.gameInst.getRaffleJackpotPending(_token, _acc);
  },

  

  api_game_getPartnerFeePending: async function (_token) {
    return this.gameInst.getPartnerFeePending(_token);
  },

  api_game_pendingPrizeToWithdraw: async function (_token, _maxLoop) {
    return this.gameInst.pendingPrizeToWithdraw(_token, _maxLoop);
  },
}


export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};