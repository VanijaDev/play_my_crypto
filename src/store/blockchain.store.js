import Vue from "vue";
//import { cleanObject } from "@/utils/globalMixins";
import {
  ethers
} from "ethers";
import PMC from '@/blockchain/pmc.contract.js';
import Staking from '@/blockchain/staking.contract.js';


const state = {
  networks: [{
      id: 'ETH',
      name: 'ETHEREUM',
      icon: '/img/ethereum_icon.svg',
      explorerBaseURL: 'https://etherscan.io/tx/',
      chains: [
        //{ id: '0x1', name: 'Mainnet' },
        {
          id: '0x3',
          name: 'Ropsten'
        }, {
          id: '0x2a',
          name: 'Kovan'
        }, {
          id: '0x539',
          name: 'Ganache'
        },
      ]
    },
    {
      id: 'BSC',
      name: 'BINANCE',
      icon: '/img/binance_icon.svg',
      explorerBaseURL: 'https://bscscan.com/tx/',
      chains: [{
          id: '0x56',
          name: 'Mainnet'
        },
        {
          id: '0x97',
          name: 'Chapel'
        },
      ]
    }
  ],
  networkIndex: null,
  chainId: null,
  signer: null,
  provider: null,
  pmcContract: null,
  stakingContract: null,
};

const getters = {
  blockchain: (state) => {
    return state
  },
  network: (state) => {
    return state.networkIndex !== null ? state.networks[state.networkIndex] : {}
  },
};

const actions = {
  ON_LOAD: async ({
    dispatch,
    state
  }) => {
    Vue.$log.debug('blockchain/ON_LOAD')

    if (window.ethereum !== null && typeof window.ethereum !== 'undefined') {
      window.ethereum.autoRefreshOnNetworkChange = false
      window.ethereum.on('connect', function () {
        dispatch('ON_CONNECT')
      })

      window.ethereum.on('chainChanged', function () {
        dispatch('ON_CHAIN_CHANGED')
      })

      window.ethereum.on('accountsChanged', function () {
        dispatch('ON_ACCOUNTS_CHANGED')
      })

      window.ethereum.on('message', function () {
        dispatch('ON_MESSAGE')
      })

      window.ethereum.on('disconnect', function () {
        dispatch('ON_DISCONNECT')
      })

      dispatch('INIT')
    } else {
      dispatch('notification/OPEN', {
        id: 'METAMASK_CONNECT_ERROR'
      }, {
        root: true
      })
      dispatch('DESTROY')
    }
  },

  ON_CONNECT: ({
    dispatch
  }) => {
    Vue.$log.debug('blockchain/ON_CONNECT')
    dispatch('DESTROY')
    dispatch('INIT')
  },

  ON_CHAIN_CHANGED: ({
    dispatch
  }) => {
    Vue.$log.debug('blockchain/ON_CHAIN_CHANGED')
    dispatch('DESTROY')
    dispatch('INIT')
  },

  ON_ACCOUNTS_CHANGED: ({
    dispatch
  }) => {
    Vue.$log.debug('blockchain/ON_ACCOUNTS_CHANGED')
    dispatch('DESTROY')
    dispatch('INIT')
  },

  ON_MESSAGE: (message) => {
    Vue.$log.debug('blockchain/ON_MESSAGE', message)
  },

  ON_DISCONNECT: ({
    dispatch
  }) => {
    Vue.$log.debug('blockchain/ON_DISCONNECT')
    dispatch('DESTROY')
  },

  INIT: async ({
    commit,
    dispatch
  }) => {
    //console.clear()
    Vue.$log.debug('blockchain/INIT')
    const networkIndex = state.networks.findIndex(network => network.chains.find(chain => chain.id === window.ethereum.chainId))
    if (networkIndex > -1) {
      commit('SET_NETWORK', networkIndex)
      let accountAddress = null
      try {
        window.pmc.provider = new ethers.providers.Web3Provider(window.ethereum)
        window.pmc.signer = window.pmc.provider.getSigner()
        accountAddress = await window.pmc.signer.getAddress()
      } catch (error) {
        Vue.$log.error('blockchain/INIT - ERROR', error)
        dispatch('notification/OPEN', {
          id: 'METAMASK_CONNECT_ERROR'
        }, {
          root: true
        })
        dispatch('DESTROY')
      }

      if (!accountAddress) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          });
          if (accounts && accounts[0]) accountAddress = accounts[0]
        } catch (error) {
          Vue.$log.error('blockchain/INIT - ERROR', error)
          dispatch('notification/OPEN', {
            id: 'METAMASK_CONNECT_ERROR'
          }, {
            root: true
          })
          dispatch('DESTROY')
        }
      }

      if (!accountAddress) return dispatch('DESTROY')

      dispatch('notification/CLOSE', null, {
        root: true
      })
      dispatch('BUILD_CONTRACTS')
      dispatch('games/INIT', null, {
        root: true
      })
      dispatch('user/INIT', accountAddress, {
        root: true
      })
    } else {
      dispatch('notification/OPEN', {
        id: 'METAMASK_CONNECT_ERROR'
      }, {
        root: true
      })
      dispatch('DESTROY')
    }
  },

  BUILD_CONTRACTS: ({
    commit
  }) => {
    Vue.$log.debug('blockchain/BUILD_CONTRACTS')
    commit('BUILD_CONTRACTS')
  },

  DESTROY: ({
    commit,
    dispatch
  }) => {
    Vue.$log.debug('blockchain/DESTROY')
    dispatch('user/DESTROY', null, {
      root: true
    })
    dispatch('games/DESTROY', null, {
      root: true
    })
    commit('DESTROY')
    window.pmc.signer = null
    window.pmc.provider = null
  },

};

const mutations = {
  SET_NETWORK: (state, networkIndex) => {
    state.networkIndex = networkIndex
    state.chainId = window.ethereum.chainId
  },

  BUILD_CONTRACTS: (state) => {
    state.pmcContract = new ethers.Contract(PMC.networks[state.networks[state.networkIndex].id][state.chainId], PMC.abi, window.pmc.signer)
    state.stakingContract = new ethers.Contract(Staking.networks[state.networks[state.networkIndex].id][state.chainId], Staking.abi, window.pmc.signer)
  },

  DESTROY: (state) => {
    state.networkIndex = null
    state.chainId = null
    state.pmcContract = null
    state.stakingContract = null
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
  namespaced: true,
};