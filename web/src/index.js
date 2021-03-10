import MetaMaskManager from "./managers/metamaskManager";
import BlockchainManager from "./managers/blockchainManager";
import Types from "./types";

const Index = {

  setup: function () {
    switch (MetaMaskManager.chainId) {
      case MetaMaskManager.ChainIDs.ETH:
        // console.log("setup ETH");
        window.BlockchainManager.init(MetaMaskManager.chainId, Types.Game.cf);
        break;

      case MetaMaskManager.ChainIDs.BSC:
        // console.log("setup BSC");
        window.BlockchainManager.init(MetaMaskManager.chainId, Types.Game.cf);
        break;

      default:
        console.error("setup - disable page");
        MetaMaskManager.deinit();
        alert("setup - Wrong Network");
        return;
    }
  },


  buttonClick: async function () {
    if (await MetaMaskManager.isMetaMaskLogged()) {
      console.log("Index - buttonClick");
    } else {
      // alert("buttonClick - MetaMask not logged in");
      let feeEthNumber = await BlockchainManager.feeNumberETHPromise();
    }
  }
};

window.addEventListener('load', async (event) => {
  console.log('page is fully loaded');

  if (!MetaMaskManager.isEthereum()) {
    alert("load - isEthereum");
    return;
  }

  if (!(await MetaMaskManager.getAccount()).length) {
    alert("load - getAccount");
    return;
  }

  if (!MetaMaskManager.isNetworkValid(ethereum.chainId)) {
    alert("load - Wrong Network");
    return;
  }

  if (!MetaMaskManager.init(ethereum.chainId)) {
    alert("load - MetaMaskManager.init");
    return;
  }

  window.Index.setup();
});

ethereum.on('message', function (message) {
  console.log('message: ', message);
});

ethereum.on('accountsChanged', function (accounts) {
  console.log('accountsChanged: ', accounts);

  if (accounts.length == 0) {
    console.error("accountsChanged - disable page");
    MetaMaskManager.deinit();
    return;
  }

  if (!MetaMaskManager.isNetworkValid(ethereum.chainId)) {
    MetaMaskManager.deinit();
    alert("accountsChanged - Wrong Network");
    return;
  }

  if (!MetaMaskManager.init(ethereum.chainId)) {
    alert("accountsChanged - MetaMaskManager.init");
    return;
  }

  window.Index.setup();
});

ethereum.on('chainChanged', function (chainId) {
  console.log('chainChanged: ', chainId);

  if (!MetaMaskManager.isNetworkValid(chainId)) {
    MetaMaskManager.deinit();
    alert("chainChanged - Wrong Network");
    return;
  }

  if (!MetaMaskManager.init(ethereum.chainId)) {
    alert("chainChanged - MetaMaskManager.init");
    return;
  }

  window.Index.setup();
});

ethereum.on('disconnect', function (chainId) {
  console.log('disconnect: ', chainId);
});


window.Index = Index;
export default Index;