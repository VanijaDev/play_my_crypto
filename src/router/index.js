import Vue from "vue";
import VueRouter from "vue-router";
Vue.use(VueRouter);
import store from "../store";

const routes = [
  {
    path: "/",
    redirect: '/coin-flip',    
  },
];

const list = () => store.getters['games/list'];
list().forEach(game => {
  if (game.id) routes.push({ 
    path: `/${game.routeName}`,
    name: game.routeName,
    component: () => import( /* webpackChunkName: "[request]" */ `../games/${game.filesFolder}/${game.filesFolder}.vue`), 
    meta: {
      game: true,
      //store: require(`@/games/${game.filesFolder}/game.store.js`)
    }    
  })  
});

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
  scrollBehavior() { return { x: 0, y: 0 } },
});

//router.beforeEach((to, from, next) => {
//
//  // unregister modules
//  if (from.meta.game) {
//    store.unregisterModule('game');    
//  }
//  // register modules
//  if (to.meta.game) {    
//    if (!Object.prototype.hasOwnProperty.call(store.state, 'game')) {
//      
//      store.registerModule('game', to.meta.store);
//      Vue.$log.debug(store)
//    }    
//  }
//  next()
//});

export default router;