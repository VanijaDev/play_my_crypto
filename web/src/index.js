import MetaMaskManager from "./metamaskManager";
import BlockchainManager from "./blockchainManager";

const Index = {

  setup: function () {
    if (ethereum.chainId == MetaMaskManager.ChainIDs.ETH) {
      console.log("setup ETH");
    } else if (ethereum.chainId == MetaMaskManager.ChainIDs.BSC) {
      console.log("setup BSC");
    } else {
      console.error("setup - disable page");
      MetaMaskManager.deinit();
      alert("Wrong Network");
      return;
    }
  },


  buttonClick: async function () {
    if (await MetaMaskManager.isMetaMaskLogged()) {
      console.log("buttonClick");
    } else {
      alert("buttonClick - MetaMask not logged in");
    }
  }

};

window.addEventListener('load', async (event) => {
  console.log('page is fully loaded');

  if (!MetaMaskManager.isEthereum()) {
    alert("Please login to MetaMask - isEthereum");
    return;
  }

  if (!(await MetaMaskManager.getAccount()).length) {
    alert("Please login to MetaMask - getAccount");
    return;
  }

  if (MetaMaskManager.isNetworkValid(ethereum.chainId)) {
    MetaMaskManager.init();
    window.Index.setup();
  } else {
    alert("Wrong Network");
    return;
  }
});

ethereum.on('message', function (message) {
  console.log('message: ', message);
});

ethereum.on('accountsChanged', function (accounts) {
  console.log('accountsChanged: ', accounts);

  if (accounts.length == 0) {
    console.log("accountsChanged - disable page");
    MetaMaskManager.deinit();
    return;
  }

  if (MetaMaskManager.isNetworkValid(ethereum.chainId)) {
    window.Index.setup();
  } else {
    MetaMaskManager.deinit();
    alert("Wrong Network");
    return;
  }
});

ethereum.on('chainChanged', function (chainId) {
  console.log('chainChanged: ', chainId);

  if (MetaMaskManager.isNetworkValid(chainId)) {
    window.Index.setup();
  } else {
    MetaMaskManager.deinit();
    alert("Wrong Network");
    return;
  }
});

ethereum.on('disconnect', function (chainId) {
  console.log('disconnect: ', chainId);
});


window.Index = Index;

export default Index;