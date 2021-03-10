const MetaMaskManager = {

  MetaMaskErrorCodes: {
    userDenied: 4001,
    invalidParams: -32602,
    internalError: 32603
  },

  ChainIDs: {
    ETH: 0x1,
    BSC: 0x38
  },

  isReady: false,

  isEthereum: function () {
    try {
      return (ethereum != null && typeof ethereum !== 'undefined');
    } catch (error) {
      return false;
    }
  },

  isNetworkValid: async function (chainId) {
    return (chainId === this.ChainIDs.ETH || chainId == this.ChainIDs.BSC);
  },

  //  MetaMask does not handle log out properly. So, need to check if logged in before each request.
  isMetaMaskLogged: async function () {
    try {
      await this.getAccount();
      return true;
    } catch (error) {
      alert("MetaMask - not Logged in");
    }
  },

  init: function () {
    console.log("MetaMaskManager - init");

    ethereum.autoRefreshOnNetworkChange = false;
    this.isReady = true;
  },

  deinit: function () {
    console.log("MetaMaskManager - deinit");

    this.isReady = false;
  },

  getAccount: async function () {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts[0];
  },
};

export default MetaMaskManager;