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

  describe.only("stake", function () {
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

    it("should ", async function () {

    });
  });

});