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
};


window.BlockchainManager = BlockchainManager;

export default BlockchainManager;