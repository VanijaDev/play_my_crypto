import {
  ethers
} from "ethers";
import Types from "../types";
import {
  CoinFlipData,
  PMCtData
} from "../contracts/contracts";

const BlockchainManager = {
  gameType: "",
  gameInst: null,
  pmctInst: null,

  init: function (_chainID, _gameType) {
    console.log("BlockchainManager: _chainID:", _chainID, ", _gameType:", _gameType);
    if (!this.isGameTypeValid(_gameType)) {
      console.error("BlockchainManager - init - !isGameTypeValid");
      return;
    }

    this.updateBlockchainInstances(_gameType, _chainID);
  },

  deinit: function () {
    this.contractInst_cf = null;
    this.gameType = "";
  },

  updateBlockchainInstances: function (_gameType, _chainID) {
    if (this.isGameTypeValid(_gameType)) {
      this.gameType = _gameType;
      this.gameInst = this.gameInstForTypeAndChainID(_gameType, _chainID);
      this.pmctInst = PMCtData.build(_chainID);
    } else {
      this.gameType = "";
      this.gameInst = null;
      this.pmctInst = null;

      console.error("BlockchainManager - updateBlockchainInstances: ", _gameType);
    }
  },

  isGameTypeValid: function (_gameType) {
    switch (_gameType) {
      case Types.Game.cf:
        return true;

      default:
        return false;
    }
  },

  gameInstForTypeAndChainID: function (_gameType, _chainID) {
    switch (_gameType) {
      case Types.Game.cf:
        return CoinFlipData.build(_chainID);

      default:
        return false;
    }
  },

  //  PMCt
  pmct_allowance_promise: function (_spender) {
    return window.BlockchainManager.pmctInst.allowance(window.BlockchainManager.gameInst.address, _spender);
  },

  // CF
  cf_betsTotal_promise: function (_address) {
    return window.BlockchainManager.gameInst.betsTotal(_address);
  },

  cf_playerStakeTotal_promise: function (_token) {
    return window.BlockchainManager.gameInst.getPlayerStakeTotal(_token);
  },

  cf_playerWithdrawedTotal_promise: function (_token) {
    return window.BlockchainManager.gameInst.getPlayerWithdrawedTotal(_token);
  },

  cf_playerWithdrawedPMCtTotal_promise: function (_address) {
    return window.BlockchainManager.gameInst.playerWithdrawedPMCtTotal(_address);
  },

  cf_gamesParticipatedToCheckPrize_promise: function (_token) {
    return window.BlockchainManager.gameInst.getGamesParticipatedToCheckPrize(_token);
  },

  cf_opponentCoinSideForOpponent_promise: function (_address, _gameIdx) {
    return window.BlockchainManager.gameInst.opponentCoinSideForOpponent(_address, _gameIdx);
  },

  cf_referralInGame_promise: function (_token, _gameIdx) {
    return window.BlockchainManager.gameInst.getReferralInGame(_token, _gameIdx);
  },

  cf_gameInfo_promise: function (_token, _gameIdx) {
    return window.BlockchainManager.gameInst.gameInfo(_token, _gameIdx);
  },

  cf_pendingPrizeToWithdraw_promise: function (_token, _maxLoop) {
    return window.BlockchainManager.gameInst.pendingPrizeToWithdraw(_token, _maxLoop);
  },

  cf_gamesStarted_promise: function (_token) {
    return window.BlockchainManager.gameInst.gamesStarted(_token);
  },

  cf_gamesFinished_promise: function (_token) {
    return window.BlockchainManager.gameInst.gamesFinished(_token);
  },


};

window.BlockchainManager = BlockchainManager;
export default BlockchainManager;