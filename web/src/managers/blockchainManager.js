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

  gameInst: function () {
    // console.log("gameInst e: ", _gameType);

    switch (this.gameType) {
      case Types.Game.cf:
        return this.contractInst_cf;

        // case Types.Game.rps:
        //   return this.contract_inst_rps;

      default:
        console.error("BlockchainManager - gameInst:", this.gameType);
        break;
    };
  },

  //  API read
  feeNumberETHPromise: async function () {
    return new Promise(resolve => {
      window.BlockchainManager.gameInst(window.BlockchainManager.gameType).methods.FEE_NUMBER_ETH().call()
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          throw new Error(err);
        });
    });
  },
};

window.BlockchainManager = BlockchainManager;
export default BlockchainManager;