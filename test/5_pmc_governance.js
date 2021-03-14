const PMCCoinFlipContract = artifacts.require("PMCCoinFlipContract");
const PMCStaking = artifacts.require("PMCStaking");
const PMCGovernance = artifacts.require("PMCGovernance");
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
const {
  assertion
} = require('@openzeppelin/test-helpers/src/expectRevert');


contract("PMCGovernance", function (accounts) {
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
  let governance;

  let creatorHash;

  beforeEach("setup", async function () {
    pmct = await PMCt.new();
    game = await PMCCoinFlipContract.new(pmct.address);
    await pmct.addMinter(game.address);

    governance = await PMCGovernance.new(pmct.address, game.address);

    creatorHash = web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH);

    await time.advanceBlock();
  });

  describe("Constructor", function () {
    it("should fail if Wrong _pmct", async function () {
      await expectRevert(PMCGovernance.new(constants.ZERO_ADDRESS, game.address), "Wrong _pmct");
    });

    it("should fail if Wrong _game", async function () {
      await expectRevert(PMCGovernance.new(pmct.address, constants.ZERO_ADDRESS), "Wrong _game");
    });

    it("should set correct pmctAddr", async function () {
      let gov = await PMCGovernance.new(OTHER, game.address);
      assert.equal(await gov.pmctAddr.call(), OTHER, "Wrong pmctAddr");
    });

    it("should push game into games", async function () {
      let gov = await PMCGovernance.new(pmct.address, OTHER);
      assert.deepEqual(await gov.gamesGoverned.call(), [OTHER], "Wrong games after push");
    });
  });

  describe("addGame", function () {
    it("should fail if Wrong _game", async function () {
      await expectRevert(governance.addGame(constants.ZERO_ADDRESS), "Wrong _game");
    });

    it("should fail if not owner", async function () {
      await expectRevert(governance.addGame(OTHER, {
        from: CREATOR_0
      }), "Ownable: caller is not the owner");
    });

    it("should push game into games", async function () {
      await governance.addGame(OTHER);
      assert.deepEqual(await governance.gamesGoverned.call(), [game.address, OTHER], "Wrong games after push 0");

      await governance.addGame(CREATOR_0);
      assert.deepEqual(await governance.gamesGoverned.call(), [game.address, OTHER, CREATOR_0], "Wrong games after push 1");
    });
  });

  describe("removeGame", function () {
    it("should fail if not owner", async function () {
      await expectRevert(governance.removeGame(OTHER, {
        from: CREATOR_0
      }), "Ownable: caller is not the owner");
    });

    it("should fail if Wrong _game", async function () {
      await expectRevert(governance.removeGame(constants.ZERO_ADDRESS), "Wrong _game");
    });

    it("should remove game from games", async function () {
      await governance.addGame(OTHER);
      await governance.addGame(CREATOR_0);
      await governance.addGame(CREATOR_1);

      //  0
      await governance.removeGame(CREATOR_0);
      assert.deepEqual(await governance.gamesGoverned.call(), [game.address, OTHER, CREATOR_1], "Wrong games after remove 0");

      //  1
      await governance.removeGame(CREATOR_1);
      assert.deepEqual(await governance.gamesGoverned.call(), [game.address, OTHER], "Wrong games after remove 1");

      //  2
      await governance.removeGame(CREATOR_1);
      assert.deepEqual(await governance.gamesGoverned.call(), [game.address, OTHER], "Wrong games after remove 2");
    });
  });

});