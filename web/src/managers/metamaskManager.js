import {
  ethers
} from "ethers";

const MetaMaskManager = {

  MetaMaskErrorCodes: {
    userDenied: 4001,
    invalidParams: -32602,
    internalError: 32603
  },

  ChainIDs: {
    ETH: "0x1",
    BSC: "0x38"
  },

  provider: null,
  chainId: "",

  isEthereum: function () {
    try {
      return (ethereum != null && typeof ethereum !== 'undefined');
    } catch (error) {
      return false;
    }
  },

  isNetworkValid: function (_chainId) {
    // console.log('isNetworkValid: ', _chainId);

    switch (_chainId) {
      case this.ChainIDs.ETH:
        return true;
      case this.ChainIDs.BSC:
        return true;

      default:
        return false;
    }
  },

  //  MetaMask does not handle log out properly. So, need to check if logged in before each request.
  isMetaMaskUsable: async function (_chainId) {
    if (!this.isNetworkValid(_chainId)) {
      console.error("MetaMaskManager - !isNetworkValid");
      return false;
    }

    if (this.provider == null) {
      console.error("MetaMaskManager - !provider");
      return false;
    }

    if (this.currentChainId == null) {
      console.error("MetaMaskManager - !currentChainId");
      return false;
    }

    try {
      await this.getAccount();
      return true;
    } catch (error) {
      console.error("MetaMask - not isMetaMaskUsable");
    }
  },

  init: function (_chainId) {
    console.log("MetaMaskManager - init");

    ethereum.autoRefreshOnNetworkChange = false;

    if (!this.isNetworkValid(_chainId)) {
      console.error("MetaMaskManager - !isNetworkValid");

      this.deinit();
      return false;
    }

    this.provider = new ethers.providers.Web3Provider(ethereum);
    this.chainId = _chainId;

    return true;
  },

  deinit: function () {
    console.log("MetaMaskManager - deinit");

    this.provider = null;
    this.chainId = "";
  },

  getAccount: async function () {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts[0];
  },
};

window.MetaMaskManager = MetaMaskManager;
export default MetaMaskManager;