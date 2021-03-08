const BlockchainManager = {

  MetaMaskCodes: {
    userDenied: 4001
  },

  isInitted: false,

  isEthereum: function () {
    return (ethereum != null && typeof ethereum !== 'undefined');
  },

  isMetaMask: function () {
    return ethereum.isMetaMask;
  },

  init: async function () {
    if (window.BlockchainManager.isEthereum()) {
      ethereum.autoRefreshOnNetworkChange = false;
      window.BlockchainManager.isInitted = true;
      //console.log("BlockchainManager - OK");            
    } else {
      console.log("BlockchainManager - ERROR");
    }
  },
  close: function () {
    window.BlockchainManager.isInitted = false;
    console.log("BlockchainManager - CLOSE");
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


window.BlockchainManager = BlockchainManager;

export default BlockchainManager;