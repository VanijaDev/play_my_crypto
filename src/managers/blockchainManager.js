import {
  CoinFlipData,
  PMCtData,
  StakingData
}
from "../blockchain/contracts";
import MetaMaskManager from "./metamaskManager";

const BlockchainManager = {
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  BALANCES_DECIMALS: 5,
  BALANCES_LENGTH: 8,

  Blockchain: {
    eth: "eth",
    bsc: "bsc"
  },

  Game: {
    cf: "cf"
  },

  gameType: "",
  gameInst: null,
  pmctInst: null,
  stakingInst: null,

  init: function (_chainID, _gameType, _account) {
    console.log("BlockchainManager: _chainID:", _chainID, ", _gameType:", _gameType, "_account:", _account);

    if (!this.isGameTypeValid(_gameType)) {
      console.error("BlockchainManager - init - !isGameTypeValid");
      this.deinit();
      return;
    }

    const _signer = window.MetaMaskManager.provider.getSigner();

    this.gameType = _gameType;
    this.pmctInst = PMCtData.build(_chainID, _signer);
    this.gameInst = this.gameInstForTypeAndChainID(_gameType, _chainID, _signer);
    this.stakingInst = StakingData.build(_chainID, _signer);
  },

  deinit: function () {
    this.gameType = "";
    this.gameInst = null;
    this.pmctInst = null;
    this.stakingInst = null;
  },

  isGameTypeValid: function (_gameType) {
    switch (_gameType) {
      case this.Game.cf:
        return true;

      default:
        return false;
    }
  },

  gameInstForTypeAndChainID: function (_gameType, _chainID, _signer) {
    switch (_gameType) {
      case this.Game.cf:
        return CoinFlipData.build(_chainID, _signer);

      default:
        return false;
    }
  },


  /**
   * API - PMCT
   */
  api_pmct_balanceOf: async function (_address) {
    return this.pmctInst.balanceOf(_address);
  },

  api_pmct_allowanceOf: async function (_address) {
    return this.pmctInst.allowance(_address);
  },


  /**
   * API - CF
   */
  api_game_gamesStarted: async function (_token) {
    return this.gameInst.gamesStarted(_token);
  },

  api_game_gameInfo: async function (_token, _idx) {
    return this.gameInst.gameInfo(_token, _idx);
  },

  api_game_getGamesParticipatedToCheckPrize: async function (_token) {
    return this.gameInst.getGamesParticipatedToCheckPrize(_token);
  },

  api_game_getPlayerStakeTotal: async function (_token) {
    return this.gameInst.getPlayerStakeTotal(_token);
  },

  api_game_getPlayerWithdrawedTotal: async function (_token) {
    return this.gameInst.getPlayerWithdrawedTotal(_token);
  },

  api_game_getReferralFeeWithdrawn: async function (_token) {
    return this.gameInst.getReferralFeeWithdrawn(_token);
  },

  api_game_getReferralFeePending: async function (_token) {
    return this.gameInst.getReferralFeePending(_token);
  },

  api_game_getRaffleJackpotWithdrawn: async function (_token, _acc) {
    return this.gameInst.getRaffleJackpotWithdrawn(_token, _acc);
  },

  api_game_getRaffleJackpotPending: async function (_token, _acc) {
    return this.gameInst.getRaffleJackpotPending(_token, _acc);
  },

  api_game_getPartnerFeeWithdrawn: async function (_token) {
    return this.gameInst.getPartnerFeeWithdrawn(_token);
  },

  api_game_getPartnerFeePending: async function (_token) {
    return this.gameInst.getPartnerFeePending(_token);
  },

  api_game_pendingPrizeToWithdraw: async function (_token, _maxLoop) {
    return this.gameInst.pendingPrizeToWithdraw(_token, _maxLoop);
  },



  /**
   * API - Staking
   */
  api_staking_stakingRewardWithdrawnOf: async function (_acc) {
    return this.stakingInst.stakingRewardWithdrawnOf(_acc);
  },

  api_staking_calculateRewardAndStartIncomeIdx: async function (_maxLoop, _acc) {
    return this.stakingInst.calculateRewardAndStartIncomeIdx(_acc);
  },

  api_staking_pendingRewardOf: async function (_acc) {
    return this.stakingInst.pendingRewardOf(_acc);
  },

  api_staking_tokensStaked: async function (_acc) {
    return this.stakingInst.tokensStaked();
  },

  api_staking_stakeOf: async function (_acc) {
    return this.stakingInst.stakeOf(_acc);
  },

};

window.BlockchainManager = BlockchainManager;
export default BlockchainManager;