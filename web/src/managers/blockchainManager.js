import {
  CoinFlipData,
  PMCtData,
  StakingData
} from "../contracts/contracts";

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
    this.stakingInst = StakingData.build(_chainID);
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

  api_game_getGamesParticipatedToCheckPrize: async function (_token, _acc) {
    return this.gameInst.getGamesParticipatedToCheckPrize(_token, {
      from: _acc
    });
  },

  api_game_getPlayerStakeTotal: async function (_token, _acc) {
    return this.gameInst.getPlayerStakeTotal(_token, {
      from: _acc
    });
  },

  api_game_getPlayerWithdrawedTotal: async function (_token, _acc) {
    return this.gameInst.getPlayerWithdrawedTotal(_token, {
      from: _acc
    });
  },

  api_game_getReferralFeeWithdrawn: async function (_token, _acc) {
    return this.gameInst.getReferralFeeWithdrawn(_token, {
      from: _acc
    });
  },

  api_game_getReferralFeePending: async function (_token, _acc) {
    return this.gameInst.getReferralFeePending(_token, {
      from: _acc
    });
  },

  api_game_getRaffleJackpotWithdrawn: async function (_token, _acc) {
    return this.gameInst.getRaffleJackpotWithdrawn(_token, _acc);
  },

  api_game_getRaffleJackpotPending: async function (_token, _acc) {
    return this.gameInst.getRaffleJackpotPending(_token, _acc);
  },

  api_game_getPartnerFeeWithdrawn: async function (_token, _acc) {
    return this.gameInst.getPartnerFeeWithdrawn(_token, {
      from: _acc
    });
  },

  api_game_getPartnerFeePending: async function (_token, _acc) {
    return this.gameInst.getPartnerFeePending(_token, {
      from: _acc
    });
  },

  api_game_pendingPrizeToWithdraw: async function (_token, _maxLoop, _acc) {
    return this.gameInst.pendingPrizeToWithdraw(_token, _maxLoop, {
      from: _acc
    });
  },



  /**
   * API - Staking
   */
  api_staking_stakingRewardWithdrawnOf: async function (_acc) {
    return this.stakingInst.stakingRewardWithdrawnOf(_acc);
  },
};

window.BlockchainManager = BlockchainManager;
export default BlockchainManager;