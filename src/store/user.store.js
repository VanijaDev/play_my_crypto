import { BigNumber } from "ethers";

const state = {   
  accountAddress: null,
  balance: {
    ETH: 0,
    PMC: 0,    
  },
  gamesStarted: [],
};

const userDefaults = Object.assign({}, state);

async function getAccountAddress() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error) {
   return null;
  }
}
async function getAccountBalance(accountAddress) {
  try {
    return await window.pmc.provider.getBalance(accountAddress);
  } catch (error) {
    return 0;
  }
}

const getters = {
  user: (state) => { return state },   
};

const actions = {
  INIT: async ({ commit, dispatch }, network) => {
    if (network) {
      //console.log('USER_INIT')
      const accountAddress = await getAccountAddress()
      commit('SET_ACCOUNT_ADDRESS', accountAddress);
      if (!accountAddress) return commit('DESTROY')

      dispatch('blockchain/INIT', accountAddress, { root: true })
      dispatch('GET_DATA');
    } else {
      console.log('USER_DESTROY')
      commit('DESTROY');
    }      
  },

  GET_DATA: async ({ commit, dispatch, state, rootState }) => {    
    const pmcContract = rootState.blockchain.pmcContract
    console.log('GET_DATA')
    try {
      const data = { 
        balance:{
          ETH: await getAccountBalance(state.accountAddress),
          PMC: await pmcContract.balanceOf(state.accountAddress)
        }
      }
      
      //  playing now
      data.gamesStarted = []
      for (const game of rootState.games.list) { 
        if (game.id) {
          const gamesStartedCount = await game.contract.gamesStarted(rootState.blockchain.ZERO_ADDRESS);
          console.log(gamesStartedCount.toString())          
          if (gamesStartedCount.gt(0)) {
            data.gamesStarted.push(game.id)
            const gameInfo = await game.contract.gameInfo(rootState.blockchain.ZERO_ADDRESS, gamesStartedCount - 1); 
            console.log(gameInfo) 
            //if (gameInfo.running) {
            //  const checkPrizeForGames = await window.BlockchainManager.api_game_getGamesParticipatedToCheckPrize(window.BlockchainManager.ZERO_ADDRESS);
            //  if (checkPrizeForGames.length > 0) {
            //    const lastGameToCheckPrize = checkPrizeForGames[checkPrizeForGames.length - 1];
            //    // console.log(lastGameToCheckPrize.toString());
            //    if ((new BN(gameInfo.idx.toString())).cmp(new BN(lastGameToCheckPrize.toString())) == 0) {
            //      document.getElementById("playing_now_cf").innerText = "CF";
            //    }
            //  }
            //}
          } 
          //data.gamesStarted.push(game.id)        
        } 
      } 
      commit('SET_DATA', data)
    } catch (error) {
      console.log(error)
    }
  },
  
  GET_PMC_ALLOWANCE: async ({ state, rootState }) => {
    return await rootState.blockchain.pmcContract.allowance(state.accountAddress);     
  },  

};

const mutations = {  
  SET_ACCOUNT_ADDRESS: (state, accountAddress) => {    
    state.accountAddress = accountAddress;  
    window.pmc.signer = window.pmc.provider.getSigner();
  },
  SET_ETH_BALANCE: (state, ethBalance) => {
    state.balance.ETH = ethBalance;  
  },
  SET_GAMES_STARTED: (state, gamesStarted) => {
    state.gamesStarted = gamesStarted;  
  },
  SET_DATA: (state, data) => {
    console.log('SET_DATA', data)
    state.balance = data.balance
    state.gamesStarted = data.gamesStarted
  },
  DESTROY: (state) => {
    state.accountAddress = null
    state.balance.ETH = 0
    state.balance.PMC = 0
    state.gamesStarted = []
    window.pmc.signer = null;
  }
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};