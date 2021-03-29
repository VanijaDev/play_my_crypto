import MetaMaskManager from "./managers/metamaskManager";
import BlockchainManager from "./managers/blockchainManager";
import BN from "bn.js";
import {
  ethers
} from "ethers";

const Index = {

  updateData: async function () {
    //  clear
    
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
    document.getElementById("available_to_stake").innerText = "...";
    document.getElementById("available_to_withdraw").innerText = "...";
    document.getElementById("total_staken").innerText = "...";
    document.getElementById("your_stake").innerText = "...";
    document.getElementById("your_stake_perc").innerText = "...";


    //  total out  - user
    //  gameplay
    //const gameplayOut = await window.BlockchainManager.api_game_getPlayerWithdrawedTotal(window.BlockchainManager.ZERO_ADDRESS);
    //document.getElementById("out_gameplay").innerText = ethers.utils.formatEther(gameplayOut.toString());

    //  referralFeeWithdrawn  - user
    //const referralOut = await window.BlockchainManager.api_game_getReferralFeeWithdrawn(window.BlockchainManager.ZERO_ADDRESS);
    //document.getElementById("out_referral").innerText = ethers.utils.formatEther(referralOut.toString());

    //  raffle  - user
    //const raffleOut = await window.BlockchainManager.api_game_getRaffleJackpotWithdrawn(window.BlockchainManager.ZERO_ADDRESS, acc);
    //document.getElementById("out_raffle").innerText = ethers.utils.formatEther(raffleOut.toString());

    //  staking  - user
    //const stakingOut = await window.BlockchainManager.api_staking_stakingRewardWithdrawnOf(acc);
    //document.getElementById("out_staking").innerText = ethers.utils.formatEther(stakingOut.toString());

    //  partnerFeeWithdrawn  - user
    //const partnershipOut = await window.BlockchainManager.api_game_getPartnerFeeWithdrawn(window.BlockchainManager.ZERO_ADDRESS);
    //document.getElementById("out_partnership").innerText = ethers.utils.formatEther(partnershipOut.toString());

    //  total out  - user -  if < total in (red)  > total in (green) 
    //document.getElementById("acc_total_out").innerText = ethers.utils.formatEther(gameplayOut.add(referralOut).add(raffleOut).add(stakingOut).add(partnershipOut).toString());


    //  pending withdraw - user +  My stats block (Pending withdrawal)
      //  gameplay
        //const pendingGameplay = await window.BlockchainManager.api_game_pendingPrizeToWithdraw(window.BlockchainManager.ZERO_ADDRESS, 0);
        console.log("pendingGameplay.prize: ", pendingGameplay.prize.toString()); //-> Gameplay
        //console.log("pendingGameplay.pmc_tokens: ", pendingGameplay.pmc_tokens.toString());

        //  referralFeeWithdrawn
        //const pendingReferral = await window.BlockchainManager.api_game_getReferralFeePending(window.BlockchainManager.ZERO_ADDRESS);
        // console.log("pendingReferral: ", pendingReferral.toString());

        //  raffle
        //const pendingRaffle = await window.BlockchainManager.api_game_getRaffleJackpotPending(window.BlockchainManager.ZERO_ADDRESS, acc);
        // console.log("pendingRaffle: ", pendingRaffle.toString());

      //  gameplay
        if ((new BN(pendingGameplay.prize.toString())).cmp(new BN("0")) > 0) {
          document.getElementById("pending_withdraw_cf").innerText = "CF";
        } else if ((new BN(pendingReferral.toString())).cmp(new BN("0")) > 0) {
          document.getElementById("pending_withdraw_cf").innerText = "CF";
        } else if ((new BN(pendingRaffle.toString())).cmp(new BN("0")) > 0) {
          document.getElementById("pending_withdraw_cf").innerText = "CF";
        }
        

      //  partner
        //const pendingPartner = await window.BlockchainManager.api_game_getPartnerFeePending(window.BlockchainManager.ZERO_ADDRESS);
        // console.log("pendingPartner: ", pendingPartner.toString());
        if ((new BN(pendingPartner.toString())).cmp(new BN("0")) > 0) {
          document.getElementById("pending_withdraw_partner").innerText = "CF";
        }


    //  Each Game icon info (under image info) ---------------
      // const gamesStarted = await window.BlockchainManager.api_game_gamesStarted(window.BlockchainManager.ZERO_ADDRESS);
      // const gameInfo = await window.BlockchainManager.api_game_gameInfo(window.BlockchainManager.ZERO_ADDRESS, gamesStarted - 1);
      // console.log(gameInfo.idx.toString());
      //if (gameInfo.running) {
      //  const participants = (new BN(gameInfo.heads.toString())).add(new BN(gameInfo.tails.toString())).add(new BN("1"));
      //  const stakes = participants.mul(new BN(gameInfo.stake.toString()));
      //  document.getElementById("participants_cf").innerText = participants.toString();
      //  document.getElementById("in_cf").innerText = ethers.utils.formatEther(stakes.toString()).slice(0, window.BlockchainManager.BALANCES_LENGTH);
      //} else {
      //  document.getElementById("participants_cf").innerText = "0";
      //  document.getElementById("in_cf").innerText = "0";
      //}
    // ------------------------------------------------


    //  staking --------------------------------
    //  available to stake
    //document.getElementById("available_to_stake").innerText = balance_pmc.slice(0, window.BlockchainManager.BALANCES_LENGTH);

    //  available to withdraw
    //const stakingToWithdraw = (await window.BlockchainManager.api_staking_calculateRewardAndStartIncomeIdx(0, acc)).reward;
    //const pendingWithdraw = (await window.BlockchainManager.api_staking_pendingRewardOf(acc));
    //document.getElementById("available_to_withdraw").innerText = ethers.utils.formatEther(stakingToWithdraw.add(pendingWithdraw).toString());

    //  Total staken
    //const totalStaken = (await window.BlockchainManager.api_staking_tokensStaked());
    //document.getElementById("total_staken").innerText = ethers.utils.formatEther(totalStaken.toString()).slice(0, window.BlockchainManager.BALANCES_LENGTH);

    //  Your stake
    //const yourStake = await window.BlockchainManager.api_staking_stakeOf(acc);
    //document.getElementById("your_stake").innerText = ethers.utils.formatEther(yourStake.toString()).slice(0, window.BlockchainManager.BALANCES_LENGTH);
    //if ((new BN(yourStake.toString())).cmp(new BN("0")) == 0) {
    //  document.getElementById("your_stake_perc").innerText = "0";
    //} else {
    //  const dec_18 = 1000000000000000000;
    //  const perc = (new BN(yourStake.toString())).mul(new BN(dec_18.toString())).div(new BN(totalStaken.toString()));
    //  document.getElementById("your_stake_perc").innerText = (parseFloat(perc) / dec_18).toFixed(2);
    //  console.log("full  perc:", ethers.utils.formatEther(perc.toString()));
    //}

  },

  //approvePMCStakeClick: async function () {
    //const pmcAmount = document.getElementById("approve_stake").value;
    //const tx = await window.BlockchainManager.pmctInst.approve(window.BlockchainManager.stakingInst.address, ethers.utils.parseEther(pmcAmount));
    //console.log("tx:", tx);
    //console.log("mining...");
    //const receipt = await tx.wait();
    //// console.log("receipt:", receipt);
    //console.log("success:", receipt.status == 1);
  //},

  //addStakeClick: async function () {
  //  const pmcAmount = document.getElementById("add_stake").value;
  //  // console.log(pmcAmount);
  //  const tx = await window.BlockchainManager.stakingInst.stake(pmcAmount);
  //  console.log("tx:", tx);
  //  console.log("mining...");
  //  const receipt = await tx.wait();
  //  // console.log("receipt:", receipt);
  //  console.log("success:", receipt.status == 1);
  //  await this.updateData();
  //},

  //withdrawStakingRewardClick: async function () {
  //  const tx = await window.BlockchainManager.stakingInst.withdrawReward(0);
  //  console.log("tx:", tx);
  //  console.log("mining...");
  //  const receipt = await tx.wait();
  //  // console.log("receipt:", receipt);
  //  console.log("success:", receipt.status == 1);
  //  await this.updateData();
  //},

  //unstakeClick: async function () {
  //  const tx = await window.BlockchainManager.stakingInst.unstake();
  //  console.log("tx:", tx);
  //  console.log("mining...");
  //  const receipt = await tx.wait();
  //  // console.log("receipt:", receipt);
  //  console.log("success:", receipt.status == 1);
  //  await this.updateData();
  //},


  // buttonClick: async function () {
  //   if (!(await window.MetaMaskManager.isMetaMaskUsable())) {
  //     console.error("Index: buttonClick - !isMetaMaskUsable - disable page");
  //     return;
  //   }

  //   // alert("buttonClick - MetaMask not logged in");
  //   let res = await window.BlockchainManager.api_game_partnerFeePending("0x0000000000000000000000000000000000000000");
  //   console.log(res);
  // }
};



//ethereum.on('message', function (message) {
//  console.log('message: ', message);
//});
//
//ethereum.on('disconnect', function (chainId) {
//  console.log('disconnect: ', chainId);
//});


window.Index = Index;
export default Index;