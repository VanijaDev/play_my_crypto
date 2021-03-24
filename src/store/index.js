import Vue from "vue";
import Vuex from "vuex";

import user from "./user.store";
import uiBreakPoint from "./uiBreakPoint.store";
import uiHeaderHeight from "./uiHeaderHeight.store";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    uiBreakPoint,
    uiHeaderHeight,
    user, 
  },
  strict: process.env.NODE_ENV !== "production"
});
export default store; 