
const state = {
  currentBreakPoint: '',
  previousBreakPoint: '',
  breakPointList: [ 'xs', 'sm', 'md', 'lg', 'xl' ],  
};

const getters = {
  breakPoint: state => (bp, condition) => {
    if (!bp) {
      return state.currentBreakPoint
    } else {
      if (!condition) return bp === state.currentBreakPoint
      const bpIndex = state.breakPointList.findIndex(el => el === bp)
      const currentBpIndex = state.breakPointList.findIndex(el => el === state.currentBreakPoint)
      if (condition === 'gt') return currentBpIndex > bpIndex 
      if (condition === 'gte') return currentBpIndex >= bpIndex
      if (condition === 'lt') return currentBpIndex < bpIndex 
      if (condition === 'lte') return currentBpIndex <= bpIndex
    } 
  },
};

const actions = {
  UI_BREAKPOINT_SET: ({ commit }, breakPoint) => {
    commit('UI_BREAKPOINT_SET', breakPoint); 
  }  
};

const mutations = {
  UI_BREAKPOINT_SET: (state, breakPoint) => {
    state.previousBreakPoint = state.currentBreakPoint;  
    state.currentBreakPoint = breakPoint;
  },    
};

export default {
  state,
  getters,
  actions,
  mutations,
  //namespaced: true,
};
