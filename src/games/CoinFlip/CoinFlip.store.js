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
  GET_INFO: async ({
    commit,
    state
  }, {
    token,
    idx
  }) => {
    try {
      commit('SET_INFO', await state.instance.gameInfo(token, idx))
    } catch (error) {
      commit('SET_INFO', null)
    }
  },
  GET_PLAYER_STAKE_TOTAL: async ({
    commit,
    state
  }, {
    token
  }) => {
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

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};