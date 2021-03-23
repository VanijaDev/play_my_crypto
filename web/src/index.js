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
    document.getElementById("acc_total_out").innerText = "...";
    document.getElementById("out_gameplay").innerText = "...";
    document.getElementById("out_referral").innerText = "...";
    document.getElementById("out_raffle").innerText = "...";
    document.getElementById("out_staking").innerText = "...";
    document.getElementById("out_partnership").innerText = "...";
    document.getElementById("acc_total_out").innerText = "...";
    document.getElementById("pending_withdraw_cf").innerText = "...";
    document.getElementById("pending_withdraw_partner").innerText = "...";
    document.getElementById("participants_cf").innerText = "...";
    document.getElementById("in_cf").innerText = "...";


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


    //  playing now
    const gamesStarted = await window.BlockchainManager.api_game_gamesStarted(window.BlockchainManager.ZERO_ADDRESS);
    const gameInfo = await window.BlockchainManager.api_game_gameInfo(window.BlockchainManager.ZERO_ADDRESS, gamesStarted - 1);
    // console.log(gameInfo.idx.toString());

    if (gameInfo.running) {
      const checkPrizeForGames = await window.BlockchainManager.api_game_getGamesParticipatedToCheckPrize(window.BlockchainManager.ZERO_ADDRESS, acc);
      if (checkPrizeForGames.length > 0) {
        const lastGameToCheckPrize = checkPrizeForGames[checkPrizeForGames.length - 1];
        // console.log(lastGameToCheckPrize.toString());

        if ((new BN(gameInfo.idx.toString())).cmp(new BN(lastGameToCheckPrize.toString())) == 0) {
          document.getElementById("playing_now_cf").innerText = "CF";
        }
      }
    }


    //  total in
    const accIn = ethers.utils.formatEther(await window.BlockchainManager.api_game_getPlayerStakeTotal(window.BlockchainManager.ZERO_ADDRESS, acc));
    document.getElementById("acc_total_in").innerText = accIn.slice(0, window.BlockchainManager.BALANCES_LENGTH);


    //  total out
    //  gameplay
    const gameplayOut = await window.BlockchainManager.api_game_getPlayerWithdrawedTotal(window.BlockchainManager.ZERO_ADDRESS, acc);
    document.getElementById("out_gameplay").innerText = ethers.utils.formatEther(gameplayOut.toString());

    //  referral
    const referralOut = await window.BlockchainManager.api_game_getReferralFeeWithdrawn(window.BlockchainManager.ZERO_ADDRESS, acc);
    document.getElementById("out_referral").innerText = ethers.utils.formatEther(referralOut.toString());

    //  raffle
    const raffleOut = await window.BlockchainManager.api_game_getRaffleJackpotWithdrawn(window.BlockchainManager.ZERO_ADDRESS, acc);
    document.getElementById("out_raffle").innerText = ethers.utils.formatEther(raffleOut.toString());

    //  staking
    const stakingOut = await window.BlockchainManager.api_staking_stakingRewardWithdrawnOf(acc);
    document.getElementById("out_staking").innerText = ethers.utils.formatEther(stakingOut.toString());

    //  partnership
    const partnershipOut = await window.BlockchainManager.api_game_getPartnerFeeWithdrawn(window.BlockchainManager.ZERO_ADDRESS, acc);
    document.getElementById("out_partnership").innerText = ethers.utils.formatEther(partnershipOut.toString());

    //  total combined
    document.getElementById("acc_total_out").innerText = ethers.utils.formatEther(gameplayOut.add(referralOut).add(raffleOut).add(stakingOut).add(partnershipOut).toString());


    //  pending withdraw
    //  gameplay
    const pendingGameplay = await window.BlockchainManager.api_game_pendingPrizeToWithdraw(window.BlockchainManager.ZERO_ADDRESS, 0, acc);
    // console.log("pendingGameplay.prize: ", pendingGameplay.prize.toString());
    // console.log("pendingGameplay.pmc_tokens: ", pendingGameplay.pmc_tokens.toString());

    //  referral
    const pendingReferral = await window.BlockchainManager.api_game_getReferralFeePending(window.BlockchainManager.ZERO_ADDRESS, acc);
    // console.log("pendingReferral: ", pendingReferral.toString());

    //  raffle
    const pendingRaffle = await window.BlockchainManager.api_game_getRaffleJackpotPending(window.BlockchainManager.ZERO_ADDRESS, acc);
    // console.log("pendingRaffle: ", pendingRaffle.toString());

    if ((new BN(pendingGameplay.prize.toString())).cmp(new BN("0")) > 0) {
      document.getElementById("pending_withdraw_cf").innerText = "CF";
    } else if ((new BN(pendingReferral.toString())).cmp(new BN("0")) > 0) {
      document.getElementById("pending_withdraw_cf").innerText = "CF";
    } else if ((new BN(pendingRaffle.toString())).cmp(new BN("0")) > 0) {
      document.getElementById("pending_withdraw_cf").innerText = "CF";
    }

    //  partner
    const pendingPartner = await window.BlockchainManager.api_game_getPartnerFeePending(window.BlockchainManager.ZERO_ADDRESS, acc);
    // console.log("pendingPartner: ", pendingPartner.toString());
    if ((new BN(pendingPartner.toString())).cmp(new BN("0")) > 0) {
      document.getElementById("pending_withdraw_partner").innerText = "CF";
    }


    //  Game icon CF
    // const gamesStarted = await window.BlockchainManager.api_game_gamesStarted(window.BlockchainManager.ZERO_ADDRESS);
    // const gameInfo = await window.BlockchainManager.api_game_gameInfo(window.BlockchainManager.ZERO_ADDRESS, gamesStarted - 1);
    // console.log(gameInfo.idx.toString());

    if (gameInfo.running) {
      const participants = (new BN(gameInfo.heads.toString())).add(new BN(gameInfo.tails.toString())).add(new BN("1"));
      const stakes = participants.mul(new BN(gameInfo.stake.toString()));

      document.getElementById("participants_cf").innerText = participants.toString();
      document.getElementById("in_cf").innerText = ethers.utils.formatEther(stakes.toString()).slice(0, window.BlockchainManager.BALANCES_LENGTH);
    } else {
      document.getElementById("participants_cf").innerText = "0";
      document.getElementById("in_cf").innerText = "0";
    }
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