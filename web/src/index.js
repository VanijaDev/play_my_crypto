import MetaMaskManager from "./managers/metamaskManager";
import BlockchainManager from "./managers/blockchainManager";
import BN from "bn.js";
import {
  ethers
} from "ethers";

const Index = {

  setup: async function () {
    switch (MetaMaskManager.chainId) {

      // case MetaMaskManager.ChainIDs.ETH:
      //   // console.log("setup ETH");
      //   window.BlockchainManager.init(MetaMaskManager.chainId, BlockchainManager.Game.cf);
      //   break;

      // case MetaMaskManager.ChainIDs.BSC:
      //   // console.log("setup BSC");
      //   window.BlockchainManager.init(MetaMaskManager.chainId, BlockchainManager.Game.cf);
      //   break;

      case MetaMaskManager.ChainIDs.TEST_Ganache:
        // console.log("setup Ganache");
        window.BlockchainManager.init(MetaMaskManager.chainId, BlockchainManager.Game.cf);
        await this.updateData();
        break;

      case MetaMaskManager.ChainIDs.TEST_Ropsten:
        // console.log("setup Ropsten");
        window.BlockchainManager.init(MetaMaskManager.chainId, BlockchainManager.Game.cf);
        break;

      default:
        console.error("setup - disable page");
        MetaMaskManager.deinit();
        alert("setup - Wrong Network");
        return;
    }
  },

  updateData: async function () {
    //  clear
    document.getElementById("addr").innerText = "...";
    document.getElementById("balance_eth").innerText = "...";
    document.getElementById("balance_pmc").innerText = "...";
    document.getElementById("playing_now_cf").innerText = "...";


    const acc = await window.MetaMaskManager.getAccount();
    document.getElementById("addr").innerText = acc;


    //  balance eth
    const balance_eth = ethers.utils.formatEther(await window.MetaMaskManager.getAccountBalance());
    // console.log("balance_eth:", balance_eth);
    document.getElementById("balance_eth").innerText = balance_eth.slice(0, window.BlockchainManager.BALANCES_LENGTH);


    //  balance pmc
    const balance_pmc = ethers.utils.formatEther(await window.BlockchainManager.api_pmct_balanceOf(acc));
    // console.log("balance_pmc:", balance_pmc);
    document.getElementById("balance_pmc").innerText = balance_pmc.slice(0, window.BlockchainManager.BALANCES_LENGTH);


    //  playing now, playing_now_cf
    const gamesStarted = await window.BlockchainManager.api_game_gamesStarted(window.BlockchainManager.ZERO_ADDRESS);
    const gameInfo = await window.BlockchainManager.api_game_gameInfo(window.BlockchainManager.ZERO_ADDRESS, gamesStarted - 1);
    // console.log(gameInfo.idx.toString());

    if (gameInfo.running) {
      const checkPrizeForGames = await window.BlockchainManager.api_game_getGamesParticipatedToCheckPrize(window.BlockchainManager.ZERO_ADDRESS, acc);
      if (checkPrizeForGames.length > 0) {
        const lastGameToCheckPrize = checkPrizeForGames[checkPrizeForGames.length - 1];
        // console.log(lastGameToCheckPrize.toString());

        if ((new BN(gameInfo.idx.toString())).cmp(new BN(lastGameToCheckPrize.toString())) == 0) {
          document.getElementById("playing_now_cf").innerText = "true";
        }
      }
    }


    //  total in
    const accIn = ethers.utils.formatEther(await window.BlockchainManager.api_game_getPlayerStakeTotal(window.BlockchainManager.ZERO_ADDRESS, acc));
    document.getElementById("acc_total_in").innerText = accIn.slice(0, window.BlockchainManager.BALANCES_LENGTH);

  },


  buttonClick: async function () {
    if (!(await window.MetaMaskManager.isMetaMaskUsable())) {
      console.error("Index: buttonClick - !isMetaMaskUsable - disable page");
      return;
    }

    // alert("buttonClick - MetaMask not logged in");
    let res = await window.BlockchainManager.api_game_partnerFeePending("0x0000000000000000000000000000000000000000");
    console.log(res);
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

  if (!MetaMaskManager.isChainIDValid(ethereum.chainId)) {
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

  if (!MetaMaskManager.isChainIDValid(ethereum.chainId)) {
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

  if (!MetaMaskManager.isChainIDValid(chainId)) {
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