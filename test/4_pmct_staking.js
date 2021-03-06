const PMCCoinFlipContract = artifacts.require("PMCCoinFlipContract");
const PMCStaking = artifacts.require("PMCStaking");
const PMCt = artifacts.require("PMCt");
const TestToken = artifacts.require("TestToken");

const {
  BN,
  ether,
  balance,
  constants,
  expectEvent,
  expectRevert,
  time,
} = require('@openzeppelin/test-helpers');


contract("PMCStaking", function (accounts) {
  const OWNER = accounts[0];
  const OTHER = accounts[1];

  const CREATOR_0 = accounts[2];
  const CREATOR_REFERRAL_0 = accounts[3];
  const CREATOR_1 = accounts[4];
  const CREATOR_REFERRAL_1 = accounts[5];
  const OPPONENT_0 = accounts[6];
  const OPPONENT_REFERRAL_0 = accounts[7];
  const OPPONENT_1 = accounts[8];
  const OPPONENT_REFERRAL_1 = accounts[9];
  const OPPONENT_2 = accounts[10];
  const OPPONENT_REFERRAL_2 = accounts[11];
  const OPPONENT_3 = accounts[12];
  const OPPONENT_REFERRAL_3 = accounts[13];

  const BET_TOKEN_0 = new BN("111");
  const BET_TOKEN_1 = new BN("222");
  const BET_TOKEN_2 = new BN("333");

  const BET_ETH_MIN = ether("0.01");
  const BET_ETH_LESS_MIN = ether("0.001");
  const BET_ETH_0 = ether("0.11");
  const BET_ETH_1 = ether("0.12");
  const BET_ETH_2 = ether("0.13");

  const DEFAULT_BALANCE = ether("500");

  const CREATOR_COIN_SIDE = 1;
  const CREATOR_SEED_HASH = web3.utils.soliditySha3("Hello World");

  let pmct;
  let game;
  let staking;
  let creatorHash;

  beforeEach("setup", async function () {
    pmct = await PMCt.new();

    game = await PMCCoinFlipContract.new(pmct.address);
    await pmct.addMinter(game.address);

    staking = await PMCStaking.new(pmct.address, game.address);
    await staking.addGame(game.address);
    await game.updateStakingAddr(staking.address);

    creatorHash = web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH);

    await time.advanceBlock();
  });

  describe("constructor", function () {
    it("should fail if Wrong _pmct", async function () {
      await expectRevert(PMCStaking.new(constants.ZERO_ADDRESS, game.address), " Wrong _pmct");
    });

    it("should fail if Wrong _gameplay", async function () {
      await expectRevert(PMCStaking.new(pmct.address, constants.ZERO_ADDRESS), " Wrong _gameplay");
    });

    it("should set correct pmctAddr & gameplay", async function () {
      assert.equal(await staking.pmctAddr.call(), pmct.address, "Wrong pmct address");
      assert.isTrue(await staking.gameplaySupported.call(game.address), "Should be true");
    });
  });

  describe("addGame", function () {
    it("should fail if Wrong _gameplay", async function () {
      await expectRevert(staking.addGame(constants.ZERO_ADDRESS), " Wrong _gameplay");
    });

    it("should set gameplaySupported to true", async function () {
      await staking.addGame(OTHER);
      assert.isTrue(await staking.gameplaySupported.call(OTHER), "Should be added");
    });
  });

  describe("removeGame", function () {
    it("should fail if Wrong _gameplay", async function () {
      await expectRevert(staking.removeGame(constants.ZERO_ADDRESS), " Wrong _gameplay");
    });

    it("should set gameplaySupported to false", async function () {
      await staking.addGame(OTHER);
      assert.isTrue(await staking.gameplaySupported.call(OTHER), "Should be added");

      await staking.removeGame(OTHER);
      assert.isFalse(await staking.gameplaySupported.call(OTHER), "Should be false");
    });
  });

  describe("replenishRewardPool", function () {
    let testToken;

    beforeEach("setup", async function () {
      testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 3000);
      testToken.transfer(CREATOR_1, 3000);
      testToken.transfer(OPPONENT_0, 3000);
      testToken.transfer(OPPONENT_1, 3000);
      testToken.transfer(OPPONENT_2, 3000);
      testToken.transfer(OPPONENT_3, 3000);

      await testToken.approve(game.address, 3000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 3000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 3000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 3000, {
        from: OPPONENT_1
      });
      await testToken.approve(game.address, 3000, {
        from: OPPONENT_2
      });
      await testToken.approve(game.address, 3000, {
        from: OPPONENT_3
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);
    });

    it("should fail if Wrong sender", async function () {
      await expectRevert(staking.replenishRewardPool({
        from: OTHER,
        value: ether("1")
      }), "Wrong sender");
    });

    it("should fail if Wrong value", async function () {
      await expectRevert(staking.replenishRewardPool({
        from: game.address,
        value: ether("0")
      }), "Wrong value");
    });

    it("should push StateForIncome with correct params for 0 pmct", async function () {
      //  0 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      });

      //  1 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  check 0
      assert.equal(0, (await staking.getIncomeCount.call()).cmp(new BN("1")), "Wrong amount, 0");
      assert.equal(0, (await staking.getIncomeInfo.call(0)).income.cmp(ether("0.0033")), "Wrong amount, 0");
      assert.equal(0, (await staking.getIncomeInfo.call(0)).tokensStakedAmount.cmp(ether("0")), "Wrong tokensStakedAmount, 0");

      //  2 - Token, should not modify
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });

      //  check, should be the same
      assert.equal(0, (await staking.getIncomeCount.call()).cmp(new BN("1")), "Wrong amount 1");
      assert.equal(0, (await staking.getIncomeInfo.call(0)).income.cmp(ether("0.0033")), "Wrong amount 0, 1");
      assert.equal(0, (await staking.getIncomeInfo.call(0)).tokensStakedAmount.cmp(ether("0")), "Wrong tokensStakedAmount 0, 1");
    });

    it("should push StateForIncome with correct params for 0 pmct", async function () {
      //  0 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      });

      //  check 0
      assert.equal(0, (await staking.getIncomeCount.call()).cmp(new BN("0")), "Wrong amount, 0");

      //  make stake
      // console.log((await pmct.balanceOf(CREATOR_0)).toString());
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(ether("0.00165"), {
        from: CREATOR_0
      });

      //  1 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });

      //  check 1
      assert.equal(0, (await staking.getIncomeCount.call()).cmp(new BN("1")), "Wrong amount, 1");
      assert.equal(0, (await staking.getIncomeInfo.call(0)).income.cmp(ether("0.0033")), "Wrong amount, 1");
      assert.equal(0, (await staking.getIncomeInfo.call(0)).tokensStakedAmount.cmp(ether("0.00165")), "Wrong tokensStakedAmount, 1");


      //  2 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: ether("0.222")
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: ether("0.222")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: ether("0.222")
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      });

      //  check 1
      assert.equal(0, (await staking.getIncomeCount.call()).cmp(new BN("2")), "Wrong amount, 2");

      assert.equal(0, (await staking.getIncomeInfo.call(0)).income.cmp(ether("0.0033")), "Wrong amount for 0, 2");
      assert.equal(0, (await staking.getIncomeInfo.call(0)).tokensStakedAmount.cmp(ether("0.00165")), "Wrong tokensStakedAmount for 0, 2");

      assert.equal(0, (await staking.getIncomeInfo.call(1)).income.cmp(ether("0.0018")), "Wrong amount for 1, 2");
      assert.equal(0, (await staking.getIncomeInfo.call(1)).tokensStakedAmount.cmp(ether("0.00165")), "Wrong tokensStakedAmount for 1, 2");


      //  3 - ETH

      // //  make stake
      // console.log((await pmct.balanceOf(CREATOR_1)).toString());
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_1
      });
      await staking.stake(ether("0.003"), {
        from: CREATOR_1
      });

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: ether("0.111")
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: ether("0.111")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: ether("0.111")
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      });

      //  check 3
      assert.equal(0, (await staking.getIncomeCount.call()).cmp(new BN("3")), "Wrong amount, 3");

      assert.equal(0, (await staking.getIncomeInfo.call(0)).income.cmp(ether("0.0033")), "Wrong amount for 0, 3");
      assert.equal(0, (await staking.getIncomeInfo.call(0)).tokensStakedAmount.cmp(ether("0.00165")), "Wrong tokensStakedAmount for 0, 3");

      assert.equal(0, (await staking.getIncomeInfo.call(1)).income.cmp(ether("0.0018")), "Wrong amount for 1, 3");
      assert.equal(0, (await staking.getIncomeInfo.call(1)).tokensStakedAmount.cmp(ether("0.00165")), "Wrong tokensStakedAmount for 1, 3");

      assert.equal(0, (await staking.getIncomeInfo.call(2)).income.cmp(ether("0.00333")), "Wrong amount for 1, 3");
      assert.equal(0, (await staking.getIncomeInfo.call(2)).tokensStakedAmount.cmp(ether("0.00465")), "Wrong tokensStakedAmount for 1, 3");
    });
  });

  describe("calculateRewardAndStartIncomeIdx", function () {
    it("should return 0,0 if not stake", async function () {
      //  0
      let res = await staking.calculateRewardAndStartIncomeIdx.call(0, {
        from: CREATOR_1
      });
      assert.equal(0, (new BN("0")).cmp(res.reward), "reward should be 0 on 0");
      assert.equal(0, (new BN("0")).cmp(res._incomeIdxToStartCalculatingRewardOf), "_incomeIdxToStartCalculatingRewardOf should be 0 on 0");

      //  replenish - 0
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      });

      //  replenish - 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  stake CREATOR_0
      const pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });

      //  1
      res = await staking.calculateRewardAndStartIncomeIdx.call(0, {
        from: CREATOR_1
      });
      assert.equal(0, (new BN("0")).cmp(res.reward), "reward should be 0 on 1");
      assert.equal(0, (new BN("0")).cmp(res._incomeIdxToStartCalculatingRewardOf), "_incomeIdxToStartCalculatingRewardOf should be 0 on 1");
    });

    it("should return correct reward & idx to start on, for maxLoop 0", async function () {
      //  play game 0
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 0:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH

      //  stake CREATOR_0
      const pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00165")), "wrong pmct_tokens_CREATOR_0");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });


      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0.0033")), "wrong staking balance 1"); //  0.0033 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.18 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.18 ETH


      //  play game 2
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_2
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_2
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_2
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_2
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0.0069")), "wrong staking balance 2"); //  0.0033 + 0.0036 = 0.0069 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }); //  0.26 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.26 ETH

      //  calculate
      //  CREATOR_0
      let CREATOR_0_res_0 = await staking.calculateRewardAndStartIncomeIdx(0, {
        from: CREATOR_0
      });
      assert.equal(0, (CREATOR_0_res_0.reward).cmp(ether("0.0069")), "wrong for CREATOR_0 0, should be 0.0069 eth");
      assert.equal(0, (CREATOR_0_res_0._incomeIdxToStartCalculatingRewardOf).cmp(new BN("2")), "wrong for CREATOR 0");

      //  stake CREATOR_1
      const pmct_tokens_CREATOR_1 = await pmct.balanceOf.call(CREATOR_1);
      assert.equal(0, pmct_tokens_CREATOR_1.cmp(ether("0.0026")), "wrong pmct_tokens_CREATOR_1");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_1
      });
      await staking.stake(pmct_tokens_CREATOR_1, {
        from: CREATOR_1
      });


      //  play game 3
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_2
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_2
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_2
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_2
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0.0121")), "wrong staking balance 3"); //  0.0069 + 0.0052 = 0.0121 ETH

      //  calculate
      //  CREATOR_0
      let CREATOR_0_res_1 = await staking.calculateRewardAndStartIncomeIdx(0, {
        from: CREATOR_0
      });
      assert.equal(0, (CREATOR_0_res_1.reward).cmp(ether("0.008918823529411764")), "wrong for CREATOR_0 1");
      assert.equal(0, (CREATOR_0_res_1._incomeIdxToStartCalculatingRewardOf).cmp(new BN("3")), "wrong for CREATOR_0 1");

      //  CREATOR_1
      let CREATOR_1_res_1 = await staking.calculateRewardAndStartIncomeIdx(0, {
        from: CREATOR_1
      });
      assert.equal(0, (CREATOR_1_res_1.reward).cmp(ether("0.003181176470588235")), "wrong for CREATOR_1 1");
      assert.equal(0, (CREATOR_1_res_1._incomeIdxToStartCalculatingRewardOf).cmp(new BN("3")), "wrong for CREATOR_1_res_1 1");


      //  play game 4
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_2
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_2
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_2
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_2
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0.0121")), "wrong staking balance 4"); //  0.0121 ETH, no withdraw after prev game

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      }); //  0.173333333333333 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.173333333333333 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.26 ETH


      //  calculate
      //  CREATOR_0
      let CREATOR_0_res_2 = await staking.calculateRewardAndStartIncomeIdx(0, {
        from: CREATOR_0
      });
      assert.equal(0, (CREATOR_0_res_2.reward).cmp(ether("0.008918823529411764")), "wrong for CREATOR_0_res_2");
      assert.equal(0, (CREATOR_0_res_2._incomeIdxToStartCalculatingRewardOf).cmp(new BN("3")), "wrong for CREATOR_0_res_2");

      //  CREATOR_1
      let CREATOR_1_res_2 = await staking.calculateRewardAndStartIncomeIdx(0, {
        from: CREATOR_1
      });
      assert.equal(0, (CREATOR_1_res_2.reward).cmp(ether("0.003181176470588235")), "wrong for CREATOR_1_res_2");
      assert.equal(0, (CREATOR_1_res_2._incomeIdxToStartCalculatingRewardOf).cmp(new BN("3")), "wrong for CREATOR_1_res_2");


      //  play game 5
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_2
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_2
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_2
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_2
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0.018166666666666666")), "wrong staking balance 5"); //  0.0121 + 0.006066666666666666 = 0.018166666666666666 ETH

      //  staking balance diff: 0.006066666666666666


      //  calculate
      //  CREATOR_0
      let CREATOR_0_res_3 = await staking.calculateRewardAndStartIncomeIdx(0, {
        from: CREATOR_0
      });
      assert.equal(0, (CREATOR_0_res_3.reward).cmp(ether("0.011274117647058822")), "wrong for CREATOR_0_res_3");
      assert.equal(0, (CREATOR_0_res_3._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong for CREATOR_0_res_3");

      //  CREATOR_1
      let CREATOR_1_res_3 = await staking.calculateRewardAndStartIncomeIdx(0, {
        from: CREATOR_1
      });
      assert.equal(0, (CREATOR_1_res_3.reward).cmp(ether("0.006892549019607842")), "wrong reward for CREATOR_1_res_3");
      assert.equal(0, (CREATOR_1_res_3._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong ixd for CREATOR_1_res_3");

      // console.log(CREATOR_1_res_3.reward.toString()); //   0.006066666666666666 / (0.00165 + 0.0026) * 0.0026 = 0.003711372549 + 0.003181176470588235 = 0.00689254902




      // maxLoop = 1
      let CREATOR_0_maxloop_1 = await staking.calculateRewardAndStartIncomeIdx.call(1, {
        from: CREATOR_0
      });
      // console.log(CREATOR_0_maxloop_1.reward.toString());
      assert.equal(0, (CREATOR_0_maxloop_1.reward).cmp(ether("0.0033")), "wrong reward for CREATOR_0_maxloop_1");
      assert.equal(0, (CREATOR_0_maxloop_1._incomeIdxToStartCalculatingRewardOf).cmp(new BN("1")), "wrong idx for CREATOR_0_maxloop_1");

      let CREATOR_1_maxloop_1 = await staking.calculateRewardAndStartIncomeIdx.call(1, {
        from: CREATOR_1
      });
      // console.log(CREATOR_1_maxloop_1.reward.toString());
      assert.equal(0, (CREATOR_1_maxloop_1.reward).cmp(ether("0.003181176470588235")), "wrong reward for CREATOR_1_maxloop_1");
      assert.equal(0, (CREATOR_1_maxloop_1._incomeIdxToStartCalculatingRewardOf).cmp(new BN("3")), "wrong idx for CREATOR_1_maxloop_1");


      // maxLoop = 2
      let CREATOR_0_maxloop_2 = await staking.calculateRewardAndStartIncomeIdx.call(2, {
        from: CREATOR_0
      });
      // console.log(CREATOR_0_maxloop_2.reward.toString());
      assert.equal(0, (CREATOR_0_maxloop_2.reward).cmp(ether("0.0069")), "wrong reward for CREATOR_0_maxloop_2");
      assert.equal(0, (CREATOR_0_maxloop_2._incomeIdxToStartCalculatingRewardOf).cmp(new BN("2")), "wrong idx for CREATOR_0_maxloop_2");

      let CREATOR_1_maxloop_2 = await staking.calculateRewardAndStartIncomeIdx.call(2, {
        from: CREATOR_1
      });
      // console.log(CREATOR_1_maxloop_2.reward.toString());
      assert.equal(0, (CREATOR_1_maxloop_2.reward).cmp(ether("0.006892549019607842")), "wrong reward for CREATOR_1_maxloop_2");
      assert.equal(0, (CREATOR_1_maxloop_2._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong idx for CREATOR_1_maxloop_2");


      // maxLoop = 3
      let CREATOR_0_maxloop_3 = await staking.calculateRewardAndStartIncomeIdx.call(3, {
        from: CREATOR_0
      });
      // console.log(CREATOR_0_maxloop_3.reward.toString());
      assert.equal(0, (CREATOR_0_maxloop_3.reward).cmp(ether("0.008918823529411764")), "wrong reward for CREATOR_0_maxloop_3");
      assert.equal(0, (CREATOR_0_maxloop_3._incomeIdxToStartCalculatingRewardOf).cmp(new BN("3")), "wrong idx for CREATOR_0_maxloop_3");

      let CREATOR_1_maxloop_3 = await staking.calculateRewardAndStartIncomeIdx.call(3, {
        from: CREATOR_1
      });
      // console.log(CREATOR_1_maxloop_3.reward.toString());
      assert.equal(0, (CREATOR_1_maxloop_3.reward).cmp(ether("0.006892549019607842")), "wrong reward for CREATOR_1_maxloop_3");
      assert.equal(0, (CREATOR_1_maxloop_3._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong idx for CREATOR_1_maxloop_3");


      // maxLoop = 4
      let CREATOR_0_maxloop_4 = await staking.calculateRewardAndStartIncomeIdx.call(4, {
        from: CREATOR_0
      });
      // console.log(CREATOR_0_maxloop_4.reward.toString());
      assert.equal(0, (CREATOR_0_maxloop_4.reward).cmp(ether("0.011274117647058822")), "wrong reward for CREATOR_0_maxloop_4");
      assert.equal(0, (CREATOR_0_maxloop_4._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong idx for CREATOR_0_maxloop_4");

      let CREATOR_1_maxloop_4 = await staking.calculateRewardAndStartIncomeIdx.call(4, {
        from: CREATOR_1
      });
      // console.log(CREATOR_1_maxloop_4.reward.toString());
      assert.equal(0, (CREATOR_1_maxloop_4.reward).cmp(ether("0.006892549019607842")), "wrong reward for CREATOR_1_maxloop_4");
      assert.equal(0, (CREATOR_1_maxloop_4._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong idx for CREATOR_1_maxloop_4");


      // maxLoop = 5
      let CREATOR_0_maxloop_5 = await staking.calculateRewardAndStartIncomeIdx.call(5, {
        from: CREATOR_0
      });
      // console.log(CREATOR_0_maxloop_5.reward.toString());
      assert.equal(0, (CREATOR_0_maxloop_5.reward).cmp(ether("0.011274117647058822")), "wrong reward for CREATOR_0_maxloop_5");
      assert.equal(0, (CREATOR_0_maxloop_5._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong idx for CREATOR_0_maxloop_5");

      let CREATOR_1_maxloop_5 = await staking.calculateRewardAndStartIncomeIdx.call(5, {
        from: CREATOR_1
      });
      // console.log(CREATOR_1_maxloop_5.reward.toString());
      assert.equal(0, (CREATOR_1_maxloop_5.reward).cmp(ether("0.006892549019607842")), "wrong reward for CREATOR_1_maxloop_5");
      assert.equal(0, (CREATOR_1_maxloop_5._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong idx for CREATOR_1_maxloop_5");


      // maxLoop = 9
      let CREATOR_0_maxloop_9 = await staking.calculateRewardAndStartIncomeIdx.call(9, {
        from: CREATOR_0
      });
      // console.log(CREATOR_0_maxloop_9.reward.toString());
      assert.equal(0, (CREATOR_0_maxloop_9.reward).cmp(ether("0.011274117647058822")), "wrong reward for CREATOR_0_maxloop_9");
      assert.equal(0, (CREATOR_0_maxloop_9._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong idx for CREATOR_0_maxloop_9");

      let CREATOR_1_maxloop_9 = await staking.calculateRewardAndStartIncomeIdx.call(9, {
        from: CREATOR_1
      });
      // console.log(CREATOR_1_maxloop_9.reward.toString());
      assert.equal(0, (CREATOR_1_maxloop_9.reward).cmp(ether("0.006892549019607842")), "wrong reward for CREATOR_1_maxloop_9");
      assert.equal(0, (CREATOR_1_maxloop_9._incomeIdxToStartCalculatingRewardOf).cmp(new BN("4")), "wrong idx for CREATOR_1_maxloop_9");
    });
  });

  describe("stake", function () {
    beforeEach("setup", async function () {
      //  play game 0
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 0:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH

      assert.equal(0, (await pmct.balanceOf.call(CREATOR_0)).cmp(ether("0.00165")), "wrong pmct for CREATOR_0");
    });

    it("should fail if 0 tokens", async function () {
      await expectRevert(staking.stake(0), "0 tokens");
    });

    it("should transfer tokens to staking contract", async function () {
      const pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00165")), "wrong pmct_tokens_CREATOR_0");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });

      assert.equal(0, (await pmct.balanceOf(CREATOR_0)).cmp(ether("0")), "wrong for CREATOR_0");
      assert.equal(0, (await pmct.balanceOf(staking.address)).cmp(pmct_tokens_CREATOR_0), "wrong for CREATOR_0");
    });

    it("should set incomeIdxToStartCalculatingRewardOf[msg.sender] = incomeIdxToStartCalculatingRewardIfNoStakes if user is first staker, but were multiple replenishments", async function () {
      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.18 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.18 ETH


      //  play game 3
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  play game 2
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  stake CREATOR_0
      const pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00675")), "wrong pmct_tokens_CREATOR_0");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });

      assert.equal(0, (await staking.incomeIdxToStartCalculatingRewardOf.call(CREATOR_0)).cmp(new BN("0")), "wrong incomeIdxToStartCalculatingRewardOf for CREATOR_0");


      //  stake OWNER
      const pmct_tokens_OWNER = await pmct.balanceOf.call(OWNER);
      assert.equal(0, pmct_tokens_OWNER.cmp(ether("0.0000675")), "wrong pmct for OWNER");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: OWNER
      });
      await staking.stake(pmct_tokens_OWNER, {
        from: OWNER
      });

      assert.equal(0, (await staking.incomeIdxToStartCalculatingRewardOf.call(OWNER)).cmp(new BN("3")), "wrong incomeIdxToStartCalculatingRewardOf for OWNER");
    });

    it("should set correct incomeIdxToStartCalculatingRewardOf[msg.sender]", async function () {
      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }); //  0.18 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.18 ETH


      //  play game 3
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  play game 2
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  stake CREATOR_0
      const pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00495")), "wrong pmct_tokens_CREATOR_0");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });

      assert.equal(0, (await staking.incomeIdxToStartCalculatingRewardOf.call(CREATOR_0)).cmp(new BN("0")), "wrong incomeIdxToStartCalculatingRewardOf for CREATOR_0");


      //  stake OWNER
      const pmct_tokens_OWNER = await pmct.balanceOf.call(OWNER);
      assert.equal(0, pmct_tokens_OWNER.cmp(ether("0.0000675")), "wrong pmct for OWNER");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: OWNER
      });
      await staking.stake(pmct_tokens_OWNER, {
        from: OWNER
      });

      assert.equal(0, (await staking.incomeIdxToStartCalculatingRewardOf.call(OWNER)).cmp(new BN("3")), "wrong incomeIdxToStartCalculatingRewardOf for OWNER");


      //  play game 3
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  stake CREATOR_1
      const pmct_tokens_CREATOR_1 = await pmct.balanceOf.call(CREATOR_1);
      assert.equal(0, pmct_tokens_CREATOR_1.cmp(ether("0.0018")), "wrong pmct for CREATOR_1");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_1
      });
      await staking.stake(pmct_tokens_CREATOR_1, {
        from: CREATOR_1
      });
      assert.equal(0, (await staking.incomeIdxToStartCalculatingRewardOf.call(CREATOR_1)).cmp(new BN("4")), "wrong incomeIdxToStartCalculatingRewardOf for CREATOR_1");
    });

    it("should update pendingRewardOf[msg.sender] if pending stakes present", async function () {
      //  stake CREATOR_0
      assert.equal(0, (await staking.pendingRewardOf.call(CREATOR_0)).cmp(ether("0")), "should be 0 before 0");
      let pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00165")), "wrong pmct_tokens_CREATOR_0");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await staking.pendingRewardOf.call(CREATOR_0)).cmp(ether("0")), "should be 0 after 0");


      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }); //  0.18 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.18 ETH


      //  play game 2
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  uncomment for valid intermediary test
      // pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      // assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00165")), "wrong pmct_tokens_CREATOR_0 1");
      // await pmct.approve(staking.address, constants.MAX_UINT256, {
      //   from: CREATOR_0
      // });
      // await staking.stake(pmct_tokens_CREATOR_0, {
      //   from: CREATOR_0
      // });
      // assert.equal(0, ((await staking.pendingRewardOf.call(CREATOR_0)).cmp(ether("0.0069"))));


      //  play game 3
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  uncomment for valid intermediary test
      // pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      // assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.0033")), "wrong pmct_tokens_CREATOR_0 2");
      // await pmct.approve(staking.address, constants.MAX_UINT256, {
      //   from: CREATOR_0
      // });
      // await staking.stake(pmct_tokens_CREATOR_0, {
      //   from: CREATOR_0
      // });
      // console.log((await staking.pendingRewardOf.call(CREATOR_0)).toString());
      // assert.equal(0, ((await staking.pendingRewardOf.call(CREATOR_0)).cmp(ether("0.0102"))));


      //  stake CREATOR_1
      let pmct_tokens_CREATOR_1 = await pmct.balanceOf.call(CREATOR_1);
      assert.equal(0, pmct_tokens_CREATOR_1.cmp(ether("0.0018")), "wrong pmct_tokens_CREATOR_1");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_1
      });
      await staking.stake(pmct_tokens_CREATOR_1, {
        from: CREATOR_1
      });


      //  play game 4
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00495")), "wrong pmct_tokens_CREATOR_0 3");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });
      // console.log((await staking.pendingRewardOf.call(CREATOR_0)).toString());
      assert.equal(0, ((await staking.pendingRewardOf.call(CREATOR_0)).cmp(ether("0.011778260869565217")))); //  0.0102 + 0.0033 / (0.00165+0.0018) * 0.00165 = 0.01177826087
    });

    it("should set correct incomeIdxToStartCalculatingRewardOf[msg.sender] if pending stakes present", async function () {
      //  stake CREATOR_0
      assert.equal(0, (await staking.pendingRewardOf.call(CREATOR_0)).cmp(ether("0")), "should be 0 before 0");
      let pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00165")), "wrong pmct_tokens_CREATOR_0");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await staking.pendingRewardOf.call(CREATOR_0)).cmp(ether("0")), "should be 0 after 0");


      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }); //  0.18 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.18 ETH


      //  play game 2
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  uncomment for valid intermediary test
      // pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      // assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00165")), "wrong pmct_tokens_CREATOR_0 1");
      // await pmct.approve(staking.address, constants.MAX_UINT256, {
      //   from: CREATOR_0
      // });
      // await staking.stake(pmct_tokens_CREATOR_0, {
      //   from: CREATOR_0
      // });
      // assert.equal(0, (await staking.incomeIdxToStartCalculatingRewardOf.call(CREATOR_0)).cmp(new BN("2")), "wrong incomeIdxToStartCalculatingRewardOf for CREATOR_0 0");
      // return;


      //  play game 3
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  test
      pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.0033")), "wrong pmct_tokens_CREATOR_0 2");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(ether("0.00165"), {
        from: CREATOR_0
      });
      // console.log((await staking.pendingRewardOf.call(CREATOR_0)).toString());
      assert.equal(0, (await staking.incomeIdxToStartCalculatingRewardOf.call(CREATOR_0)).cmp(new BN("3")), "wrong incomeIdxToStartCalculatingRewardOf for CREATOR_0 1");


      //  stake CREATOR_1
      let pmct_tokens_CREATOR_1 = await pmct.balanceOf.call(CREATOR_1);
      assert.equal(0, pmct_tokens_CREATOR_1.cmp(ether("0.0018")), "wrong pmct_tokens_CREATOR_1");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_1
      });
      await staking.stake(pmct_tokens_CREATOR_1, {
        from: CREATOR_1
      });


      //  play game 4
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  test
      pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.0033")), "wrong pmct_tokens_CREATOR_0 3");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });
      // console.log((await staking.pendingRewardOf.call(CREATOR_0)).toString());
      assert.equal(0, (await staking.incomeIdxToStartCalculatingRewardOf.call(CREATOR_0)).cmp(new BN("4")), "wrong incomeIdxToStartCalculatingRewardOf for CREATOR_0 2");
    });

    it("should update stakeOf[msg.sender]", async function () {
      //  stake CREATOR_0
      assert.equal(0, (await staking.pendingRewardOf.call(CREATOR_0)).cmp(ether("0")), "should be 0 before 0");
      let pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00165")), "wrong pmct_tokens_CREATOR_0");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await staking.stakeOf.call(CREATOR_0)).cmp(ether("0.00165")), "wrong stakeOf for CREATOR_0 0");


      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }); //  0.18 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.18 ETH


      //  play game 2
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  play game 3
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  test
      pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.0033")), "wrong pmct_tokens_CREATOR_0 2");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(ether("0.00165"), {
        from: CREATOR_0
      });
      // console.log((await staking.pendingRewardOf.call(CREATOR_0)).toString());
      assert.equal(0, (await staking.stakeOf.call(CREATOR_0)).cmp(ether("0.0033")), "wrong stakeOf for CREATOR_0 1");


      //  stake CREATOR_1
      let pmct_tokens_CREATOR_1 = await pmct.balanceOf.call(CREATOR_1);
      assert.equal(0, pmct_tokens_CREATOR_1.cmp(ether("0.0018")), "wrong pmct_tokens_CREATOR_1");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_1
      });
      await staking.stake(pmct_tokens_CREATOR_1, {
        from: CREATOR_1
      });
      assert.equal(0, (await staking.stakeOf.call(CREATOR_1)).cmp(ether("0.0018")), "wrong stakeOf for CREATOR_1 0");


      //  play game 4
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  test
      pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.0033")), "wrong pmct_tokens_CREATOR_0 3");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await staking.stakeOf.call(CREATOR_0)).cmp(ether("0.0066")), "wrong stakeOf for CREATOR_1 2");
    });

    it("should update tokensStaked", async function () {
      //  stake CREATOR_0
      let pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.00165")), "wrong pmct_tokens_CREATOR_0");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await staking.tokensStaked.call()).cmp(ether("0.00165")), "wrong tokensStaked for 0");


      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }); //  0.18 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.18 ETH


      //  play game 2
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  play game 3
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      // console.log("staking balance 1:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  test
      pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.0033")), "wrong pmct_tokens_CREATOR_0 2");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(ether("0.00165"), {
        from: CREATOR_0
      });
      assert.equal(0, (await staking.tokensStaked.call()).cmp(ether("0.0033")), "wrong tokensStaked for 1");


      //  stake CREATOR_1
      let pmct_tokens_CREATOR_1 = await pmct.balanceOf.call(CREATOR_1);
      assert.equal(0, pmct_tokens_CREATOR_1.cmp(ether("0.0018")), "wrong pmct_tokens_CREATOR_1");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_1
      });
      await staking.stake(pmct_tokens_CREATOR_1, {
        from: CREATOR_1
      });
      assert.equal(0, (await staking.tokensStaked.call()).cmp(ether("0.0051")), "wrong tokensStaked for 2");


      //  play game 4
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      }); //  0.165 ETH


      //  test
      pmct_tokens_CREATOR_0 = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_tokens_CREATOR_0.cmp(ether("0.0033")), "wrong pmct_tokens_CREATOR_0 3");
      await pmct.approve(staking.address, constants.MAX_UINT256, {
        from: CREATOR_0
      });
      await staking.stake(pmct_tokens_CREATOR_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await staking.tokensStaked.call()).cmp(ether("0.0084")), "wrong tokensStaked for 4");
    });
  });

});