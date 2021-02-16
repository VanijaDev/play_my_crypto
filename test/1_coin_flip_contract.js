const {
  assertion
} = require('@openzeppelin/test-helpers/src/expectRevert');

const PMCCoinFlipContract = artifacts.require("PMCCoinFlipContract");
const PMCt = artifacts.require("PMCt");
const TestToken = artifacts.require("TestToken");


contract("PMCCoinFlipContract", function (accounts) {

  const {
    BN,
    ether,
    balance,
    constants,
    expectEvent,
    expectRevert,
    time,
  } = require('@openzeppelin/test-helpers');

  contract("CoinFlipContract", function (accounts) {
    const OWNER = accounts[0];
    const OTHER = accounts[1];

    const CREATOR_0 = accounts[2];
    const CREATOR_REFERRAL_0 = accounts[3];
    const CREATOR_1 = accounts[4];
    const CREATOR_1_REFERRAL = accounts[5];
    const OPPONENT_0 = accounts[6];
    const OPPONENT_REFERRAL_0 = accounts[7];
    const OPPONENT_1 = accounts[8];
    const OPPONENT_1_REFERRAL = accounts[9];

    const BET_TOKEN_0 = new BN("111");
    const BET_TOKEN_1 = new BN("222");
    const BET_TOKEN_2 = new BN("333");

    const BET_ETH_MIN = ether("0.01");
    const BET_ETH_0 = ether("0.11");
    const BET_ETH_1 = ether("0.12");
    const BET_ETH_2 = ether("0.13");

    const CREATOR_COIN_SIDE = 1;
    const CREATOR_SEED = "Hello World";

    let pmct;
    let game;
    let creatorHash;
    let testToken;

    beforeEach("setup", async function () {
      pmct = await PMCt.new();
      game = await PMCCoinFlipContract.new(pmct.address);
      await pmct.addMinter(game.address);

      creatorHash = web3.utils.soliditySha3(CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED));

      await time.advanceBlock();
    });

    describe.only("constructor", function () {
      it("should fail if Wrong token", async function () {
        await expectRevert(PMCCoinFlipContract.new(constants.ZERO_ADDRESS), "Wrong token");
      });

      it("should set correct pmct", async function () {
        assert.equal(await game.pmctAddr.call(), pmct.address, "Wrong PMCt");
      });
    });

  });
});