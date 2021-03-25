import Vue from "vue";
import VueRouter from "vue-router";
import store from "../store";

const gamesList = () => store.getters['games/gamesList']; 

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: '/coin-flip',    
  },
    
];

gamesList().forEach(game => {
  if (game.id) routes.push({ 
    path: `/${game.routeName}`,
    name: game.routeName,
    component: () => import( /* webpackChunkName: "[request]" */  `../games/${game.filesFolder}/${game.filesFolder}.vue`), 
    meta: {
      game: true,
      //store: require(`@/games/${game.filesFolder}/game.store.js`)
    }    
  })  
});

console.log(routes)

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
//      console.log(store)
//    }    
//  }
//  next()
//});

export default router;