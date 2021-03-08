const MetaMaskManager = {

  MetaMaskCodes: {
    userDenied: 4001
  },

  isInitted: false,

  isEthereum: function () {
    return (ethereum != null && typeof ethereum !== 'undefined');
  },

  // isMetaMask: function () {
  //   return ethereum.isMetaMask;
  // },

  init: async function () {
    if (this.isEthereum()) {
      ethereum.autoRefreshOnNetworkChange = false;

      return true;
    } else {
      console.log("MetaMaskManager - ERROR");
    }
  },

  isNetworkValid: async function (chainId) {
    if (!chainId) chainId = await ethereum.request({
      method: 'eth_chainId'
    })
    return (chainId === process.env.VUE_APP_CHAIN_ID);
  },

  getAccount: async function () {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts[0];
  },
};


// window.MetaMaskManager = MetaMaskManager;

export default MetaMaskManager;