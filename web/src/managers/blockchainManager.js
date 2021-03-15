import {
  CoinFlipData,
  PMCtData
} from "../contracts/contracts";

const BlockchainManager = {
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",

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

  init: function (_chainID, _gameType) {
    console.log("BlockchainManager: _chainID:", _chainID, ", _gameType:", _gameType);

    if (!this.isGameTypeValid(_gameType)) {
      console.error("BlockchainManager - init - !isGameTypeValid");
      this.deinit();
      return;
    }

    this.gameType = _gameType;
    this.pmctInst = PMCtData.build(_chainID);
    this.gameInst = this.gameInstForTypeAndChainID(_gameType, _chainID);
  },

  deinit: function () {
    this.gameType = "";
    this.gameInst = null;
    this.pmctInst = null;
  },

  isGameTypeValid: function (_gameType) {
    switch (_gameType) {
      case this.Game.cf:
        return true;

      default:
        return false;
    }
  },

  gameInstForTypeAndChainID: function (_gameType, _chainID) {
    switch (_gameType) {
      case this.Game.cf:
        return CoinFlipData.build(_chainID);

      default:
        return false;
    }
  },


  /**
   * API - PMCT
   */
  api_pmct_balanceOf: async function (_address) {
    return pmctInst.balanceOf(_address);
  },

  api_pmct_allowanceOf: async function (_address) {
    return pmctInst.allowance(_address);
  },


  /**
   * API - CF
   */
  api_game_partnerFeePending: async function (_token) {
    return this.gameInst.getPartnerFeePending(_token);
  },

  api_game_partnerFeeWithdrawn: async function (_token) {
    return this.gameInst.getPartnerFeeWithdrawn(_token);
  },

  api_game_partnerFeeWithdrawnTotal: async function (_token) {
    return this.gameInst.getPartnerFeeWithdrawnTotal(_token);
  },

  api_game_referralFeePending: async function (_token) {
    return this.gameInst.getReferralFeePending(_token);
  },

  api_game_referralFeeWithdrawn: async function (_token) {
    return this.gameInst.getReferralFeeWithdrawn(_token);
  },

  api_game_referralFeeWithdrawnTotal: async function (_token) {
    return this.gameInst.getReferralFeeWithdrawnTotal(_token);
  },

  api_game_devFeePending: async function (_token) {
    return this.gameInst.getDevFeePending(_token);
  },

  api_game_devFeeWithdrawn: async function (_token) {
    return this.gameInst.getDevFeeWithdrawn(_token);
  },

  api_game_devFeeWithdrawnTotal: async function (_token) {
    return this.gameInst.getRaffleJackpotPending(_token);
  },

  api_game_raffleJackpotPending: async function (_token, _address) {
    return this.gameInst.getRaffleJackpotPending(_token, _address);
  },

  api_game_raffleJackpotWithdrawn: async function (_token, _address) {
    return this.gameInst.getRaffleJackpotWithdrawn(_token, _address);
  },

  api_game_raffleJackpot: async function (_token) {
    return this.gameInst.getRaffleJackpot(_token);
  },

  api_game_raffleJackpotsWonTotal: async function (_token) {
    return this.gameInst.getRaffleJackpotsWonTotal(_token);
  },

  api_game_raffleParticipantsNumber: async function (_token) {
    return this.gameInst.getRaffleParticipantsNumber(_token);
  },

  api_game_raffleParticipantsNumber: async function (_token) {
    return this.gameInst.getRaffleParticipantsNumber(_token);
  }
};

window.BlockchainManager = BlockchainManager;
export default BlockchainManager;