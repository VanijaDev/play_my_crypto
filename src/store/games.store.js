const state = { 
  list: [
    { 
      id: 'CFP', 
      name: 'Coin Flip', 
      routeName: 'coin-flip', 
      filesFolder: 'CoinFlip', 
      image: 'game_coin_flip.svg' 
    },
    { 
      id: 'SPS', 
      name: 'Stone Paper Scissors', 
      routeName: 'stone-paper-scissors', 
      filesFolder: 'StonePaperScissors', 
      image: 'game_coin_flip.svg' 
    },
    { id: null, name: 'NEW GAME', routePath: null, image: 'no_game.png' },
    { id: null, name: 'NEW GAME', routePath: null, image: 'no_game.png' },    
  ],
  currentGame: {},   
};

const getters = {
  gamesList: (state) => { return state.list },  
  currentGame: (state) => { return state.currentGame },  
};

const actions = {
  SET_CURRENT_GAME: async ({ commit, state }, gameId) => {
    let game = {}
    if (gameId) game = state.list.find(g => g.id === gameId)    
    commit('SET_CURRENT_GAME', game);     
  } 
};

const mutations = {  
  SET_CURRENT_GAME: (state, game) => {
    state.currentGame = game;  
  },  
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};