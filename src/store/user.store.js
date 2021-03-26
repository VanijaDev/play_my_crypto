import { BigNumber } from "ethers";

const state = {   
  accountAddress: null,
  balance: {
    ETH: null,
    PMC: null,    
  },
  gamesStarted: [],
  totalIn: null,
  totalOut: null,
  referral: null,
  partnership: null,

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
    commit('DESTROY');
    if (network) {
      //console.log('USER_INIT')
      const accountAddress = await getAccountAddress()
      commit('SET_ACCOUNT_ADDRESS', accountAddress);
      if (!accountAddress) return commit('DESTROY')

      dispatch('blockchain/INIT', accountAddress, { root: true })
      dispatch('GET_BALANCE');
      
    } else {
      console.log('USER_DESTROY')
      commit('DESTROY');
    }      
  },

  GET_BALANCE: async ({ commit, dispatch, state, rootState }) => {    
    const pmcContract = rootState.blockchain.pmcContract
    try {
      const balance = {
        ETH: await getAccountBalance(state.accountAddress),
        PMC: await pmcContract.balanceOf(state.accountAddress)        
      } 
      commit('SET_BALANCE', balance)
    } catch (error) {
      console.error('GET_BALANCE', error)
    }
  },

  GET_GAMES_STARTED: async ({ commit, dispatch, rootState }) => {
    //console.log('GET_GAMES_STARTED', rootState.games.list)
    let gamesStarted = []
    for (const game of rootState.games.list) { 
      if (game.id && game.info && game.info.running) {
        try {
          const checkPrizeForGames = await game.contract.getGamesParticipatedToCheckPrize(rootState.blockchain.ZERO_ADDRESS);
          //console.log('checkPrizeForGames', checkPrizeForGames);
          if (checkPrizeForGames.length > 0) {
            const lastGameToCheckPrize = checkPrizeForGames[checkPrizeForGames.length - 1];
            //console.log('lastGameToCheckPrize', lastGameToCheckPrize);
            if (game.info.idx.eq(lastGameToCheckPrize) ) {
              gamesStarted.push(game.id)
              
              // if current game
              console.log('rootState.games.currentId === game.id', rootState.games.currentId, game.id);
              if (rootState.games.currentId === game.id) {
                dispatch('GET_PROFILE_GAME_DATA', game);
              }
            
            }
          }          
        } catch (error) {
          console.error('GET_GAMES_STARTED', error);
        }                      
      } 
    } 
    commit('SET_GAMES_STARTED', gamesStarted)     
  },

  GET_PROFILE_GAME_DATA: async ({ commit, state, rootState }, game) => {
    try {
      const data = {
        totalIn: await game.contract.getPlayerStakeTotal(rootState.blockchain.ZERO_ADDRESS),
        totalOut: await game.contract.getPlayerWithdrawedTotal(rootState.blockchain.ZERO_ADDRESS),
        referral: await game.contract.getReferralFeeWithdrawn(rootState.blockchain.ZERO_ADDRESS),
        partnership: await game.contract.getPartnerFeeWithdrawn(rootState.blockchain.ZERO_ADDRESS),

        pendingGameplay: await game.contract.pendingPrizeToWithdraw(rootState.blockchain.ZERO_ADDRESS, 0),        
        pendingReferral: await game.contract.getReferralFeePending(rootState.blockchain.ZERO_ADDRESS),
        
        pendingRaffle: await game.contract.getRaffleJackpotPending(rootState.blockchain.ZERO_ADDRESS, state.accountAddress),
        pendingPartner: await game.contract.getPartnerFeePending(rootState.blockchain.ZERO_ADDRESS),
      }
      commit('SET_PROFILE_GAME_DATA', data) 
    } catch (error) {
      console.error('GET_PROFILE_GAME_DATA', error);
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
  SET_BALANCE: (state, balance) => {
    state.balance = balance
  },
  SET_PROFILE_GAME_DATA: (state, data) => {    
    state.totalIn = data.totalIn
    state.totalOut = data.totalOut
    state.referral = data.referral
    state.partnership = data.partnership
    state.pendingGameplay = data.pendingGameplay
    state.pendingReferral = data.pendingReferral
    state.pendingRaffle = data.pendingRaffle
    state.pendingPartner = data.pendingPartner
    console.info('SET_PROFILE_GAME_DATA', data);
  },
  DESTROY: (state) => {
    state.accountAddress = null
    state.balance.ETH = null
    state.balance.PMC = null
    state.gamesStarted = []
    state.totalIn = null
    state.totalOut = null
    state.referral = null
    state.partnership = null
    state.pendingGameplay = null
    state.pendingReferral = null
    state.pendingRaffle = null
    state.pendingPartner = null

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