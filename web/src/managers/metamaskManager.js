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
    BSC: "0x38",
    TEST_Ganache: "0x539",
    TEST_Ropsten: "0x3"
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

  isChainIDValid: function (_chainId) {
    console.log('isChainIDValid: ', _chainId);

    switch (_chainId) {
      // case this.ChainIDs.ETH:
      //   return true;
      // case this.ChainIDs.BSC:
      //   return true;
      case this.ChainIDs.TEST_Ganache:
        return true;

      case this.ChainIDs.TEST_Ropsten:
        return true;

      default:
        return false;
    }
  },

  //  MetaMask does not handle log out properly. So, need to check if logged in before each request.
  isMetaMaskUsable: async function () {
    if (!this.isChainIDValid(this.chainId)) {
      console.error("MetaMaskManager: isMetaMaskUsable - !isChainIDValid");
      return false;
    }

    if (this.provider == null) {
      console.error("MetaMaskManager: isMetaMaskUsable - !provider");
      return false;
    }

    try {
      await this.getAccount();
      return true;
    } catch (error) {
      console.error("isMetaMaskUsable: not isMetaMaskUsable");
      return false;
    }
  },

  init: function (_chainId) {
    console.log("MetaMaskManager - init");

    ethereum.autoRefreshOnNetworkChange = false;

    if (!this.isChainIDValid(_chainId)) {
      console.error("MetaMaskManager - !isChainIDValid");

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

  getAccountBalance: async function () {
    const balance = await web3.eth.getBalance(await this.getAccount());
    return balance;
  },
};

window.MetaMaskManager = MetaMaskManager;
export default MetaMaskManager;