const BlockchainManager = {
  BALANCES_DECIMALS: 5,
  BALANCES_LENGTH: 8,
  
  /**
   * API - CF
   */
  api_game_gamesStarted: async function (_token) {
    return this.gameInst.gamesStarted(_token);
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

  api_staking_tokensStaked: async function () {
    return this.stakingInst.tokensStaked();
  },

  api_staking_stakeOf: async function (_acc) {
    return this.stakingInst.stakeOf(_acc);
  },

};
