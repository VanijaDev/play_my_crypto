import Vue from "vue";
//import { cleanObject } from "@/utils/globalMixins";

const state = {
  id: null,
  show: false, //
  type: 'text',
  delay: false,
  closable: false,
  data: 'Notification!',
};

const getters = {
  notification: (state) => {
    return state
  },
};

const actions = {
  OPEN: ({
    commit,
    dispatch
  }, {
    id,
    type,
    closable,
    delay,
    data
  }) => {
    Vue.$log.debug('notification/OPEN', {
      id,
      type,
      closable,
      delay,
      data
    })
    commit('OPEN', {
      id,
      type,
      closable,
      delay,
      data
    })
    if (delay) {
      const timer = setTimeout(() => {
        dispatch('CLOSE')
      }, delay * 1000)
      commit('SET_DELAY_TIMER', timer)
    }
  },
  CLOSE: ({
    commit
  }) => {
    Vue.$log.debug('notification/CLOSE')
    commit('CLOSE')
  },
};

const mutations = {
  OPEN: (state, {
    id,
    type,
    closable,
    delay,
    data
  }) => {
    state.show = true
    state.id = id
    state.type = type ? type : 'text'
    state.closable = closable ? closable : true
    state.data = data ? data : 'Notification!'
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 10)
  },
  SET_DELAY_TIMER: (state, timer) => {
    state.delay = timer
  },
  CLOSE: (state) => {
    state.show = false
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 10)
    if (state.delay) {
      clearTimeout(state.delay)
      state.delay = false
    }
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};