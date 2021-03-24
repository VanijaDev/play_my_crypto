
const state = {
  uiHeaderHeight: 0,  
};

const getters = {
  uiHeaderHeight: state => state.uiHeaderHeight,  
};

const actions = {
  UI_HEADER_HEIGHT_SET: ({ commit }, uiHeaderHeight) => {
    commit('UI_HEADER_HEIGHT_SET', uiHeaderHeight); 
  }  
};

const mutations = {
  UI_HEADER_HEIGHT_SET: (state, uiHeaderHeight) => {
    state.uiHeaderHeight = uiHeaderHeight;  
  },    
};

export default {
  state,
  getters,
  actions,
  mutations,
  //namespaced: true,
};
