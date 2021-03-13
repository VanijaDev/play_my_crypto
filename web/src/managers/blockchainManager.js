import {
  CoinFlipData,
  PMCtData
} from "../contracts/contracts";

const BlockchainManager = {
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
   * API
   */

  //  PMCT
  api_pmct_balanceOf: async function (_address) {
    return pmctInst.balanceOf(_address);
  },

  api_pmct_allowanceOf: async function (_address) {
    return pmctInst.allowance(_address);
  },


  //  CF
  api_game_partnerFeePending: async function (_token) {
    return this.gameInst.getPartnerFeePending(_token);
  },

};

window.BlockchainManager = BlockchainManager;
export default BlockchainManager;