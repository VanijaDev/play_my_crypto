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
    const CREATOR_REFERRAL_1 = accounts[5];
    const OPPONENT_0 = accounts[6];
    const OPPONENT_REFERRAL_0 = accounts[7];
    const OPPONENT_1 = accounts[8];
    const OPPONENT_REFERRAL_1 = accounts[9];

    const BET_TOKEN_0 = new BN("111");
    const BET_TOKEN_1 = new BN("222");
    const BET_TOKEN_2 = new BN("333");

    const BET_ETH_MIN = ether("0.01");
    const BET_ETH_LESS_MIN = ether("0.001");
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

    describe("constructor", function () {
      it("should fail if Wrong token", async function () {
        await expectRevert(PMCCoinFlipContract.new(constants.ZERO_ADDRESS), "Wrong token");
      });

      it("should set correct pmct", async function () {
        assert.equal(await game.pmctAddr.call(), pmct.address, "Wrong PMCt");
      });
    });

    describe.only("startGame for ETH stake", function () {
      it("should fail if Wrong ETH stake", async function () {
        await expectRevert(game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          value: BET_ETH_LESS_MIN
        }), "Wrong ETH stake");
      });

      it("should fail Empty hash", async function () {
        await expectRevert(game.startGame(constants.ZERO_ADDRESS, 0, "0x0", CREATOR_REFERRAL_0, {
          value: BET_ETH_0
        }), "Empty hash");
      });

      it("should fail if Game is running", async function () {
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          value: BET_ETH_0
        });

        await expectRevert(game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          from: CREATOR_0,
          value: BET_ETH_1
        }), "Game is running");
      });

      it("should increase stakeAmount if prev game was finished & amountToAddToNextStake[ETH] > 0", async function () {
        //  0
        assert.equal((await game.amountToAddToNextStake.call(constants.ZERO_ADDRESS)).cmp(new BN("0")), 0, "wrong amountToAddToNextStake before");
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          from: CREATOR_0,
          value: BET_ETH_0
        });
        await time.increase(time.duration.days(2));
        await game.finishTimeoutGame(constants.ZERO_ADDRESS);
        assert.equal((await game.amountToAddToNextStake.call(constants.ZERO_ADDRESS)).cmp(BET_ETH_0), 0, "wrong amountToAddToNextStake after finish timeout game");

        //  1
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          from: CREATOR_1,
          value: BET_ETH_1
        });
        assert.equal((new BN((await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).stake)).cmp(BET_ETH_0.add(BET_ETH_1)), 0, "wrong stake after game started");
      });

      it("should delete amountToAddToNextStake[ETH] if it was used", async function () {
        //  0
        assert.equal((await game.amountToAddToNextStake.call(constants.ZERO_ADDRESS)).cmp(new BN("0")), 0, "wrong amountToAddToNextStake before");
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          from: CREATOR_0,
          value: BET_ETH_0
        });
        await time.increase(time.duration.days(2));
        await game.finishTimeoutGame(constants.ZERO_ADDRESS);
        assert.equal((await game.amountToAddToNextStake.call(constants.ZERO_ADDRESS)).cmp(BET_ETH_0), 0, "wrong amountToAddToNextStake after finish timeout game");

        //  1
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          from: CREATOR_1,
          value: BET_ETH_1
        });
        assert.equal((await game.amountToAddToNextStake.call(constants.ZERO_ADDRESS)).cmp(new BN("0")), 0, "wrong amountToAddToNextStake after game started");
      });

      it("should push Game with correct params", async function () {
        /**
         bool running,
         bytes32 creatorCoinSide,
         address creator,
         uint256 idx,
         uint256 stake,
         uint256 startTime,
         uint256 heads,
         uint256 tails,
         uint256 creatorPrize,
         uint256 opponentPrize)
         */

        //  0
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          from: CREATOR_0,
          value: BET_ETH_0
        });
        let startAt_0 = await time.latest();
        await time.increase(time.duration.minutes(1));

        let gameObj_0 = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
        assert.equal(gameObj_0.running, true, "Should be true for gameObj_0");
        assert.equal(gameObj_0.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_0");
        assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
        assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
        assert.equal(gameObj_0.stake.cmp(BET_ETH_0), 0, "Wrong stake for gameObj_0");
        assert.equal(gameObj_0.startTime.cmp(startAt_0), 0, "Wrong startTime for gameObj_0");
        assert.equal(gameObj_0.heads, 0, "Wrong heads for gameObj_0");
        assert.equal(gameObj_0.tails, 0, "Wrong tails for gameObj_0");
        assert.equal(gameObj_0.creatorPrize, 0, "Wrong creatorPrize for gameObj_0");
        assert.equal(gameObj_0.opponentPrize, 0, "Wrong opponentPrize for gameObj_0");

        await time.increase(time.duration.days(2));
        await game.finishTimeoutGame(constants.ZERO_ADDRESS);

        //  1
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
          from: CREATOR_1,
          value: BET_ETH_1
        });
        let startAt_1 = await time.latest();
        await time.increase(time.duration.minutes(1));

        //  gameObj_0 after finish
        gameObj_0 = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
        assert.equal(gameObj_0.running, false, "Should be false for gameObj_0");
        assert.equal(gameObj_0.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_0");
        assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
        assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
        assert.equal(gameObj_0.stake.cmp(BET_ETH_0), 0, "Wrong stake for gameObj_0");
        assert.equal(gameObj_0.startTime.cmp(startAt_0), 0, "Wrong startTime for gameObj_0");
        assert.equal(gameObj_0.heads, 0, "Wrong heads for gameObj_0");
        assert.equal(gameObj_0.tails, 0, "Wrong tails for gameObj_0");
        assert.equal(gameObj_0.creatorPrize, 0, "Wrong creatorPrize for gameObj_0");
        assert.equal(gameObj_0.opponentPrize, 0, "Wrong opponentPrize for gameObj_0");

        //  gameObj_1
        let gameObj_1 = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
        assert.equal(gameObj_1.running, true, "Should be true for gameObj_1");
        assert.equal(gameObj_1.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_1");
        assert.equal(gameObj_1.creator, CREATOR_1, "Wrong creator for gameObj_1");
        assert.equal(gameObj_1.idx.cmp(new BN("1")), 0, "Wrong idx for gameObj_1");
        assert.equal(gameObj_1.stake.cmp(BET_ETH_1.add(BET_ETH_0)), 0, "Wrong stake for gameObj_1");
        assert.equal(gameObj_1.startTime.cmp(startAt_1), 0, "Wrong startTime for gameObj_1");
        assert.equal(gameObj_1.heads, 0, "Wrong heads for gameObj_1");
        assert.equal(gameObj_1.tails, 0, "Wrong tails for gameObj_1");
        assert.equal(gameObj_1.creatorPrize, 0, "Wrong creatorPrize for gameObj_1");
        assert.equal(gameObj_1.opponentPrize, 0, "Wrong opponentPrize for gameObj_1");
      });

      it("should set referralInGame if was sent", async function () {
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
          from: CREATOR_0,
          value: BET_ETH_0
        });
        assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 0, {
          from: CREATOR_0
        }), CREATOR_REFERRAL_0, "Wrong referral");
      });

      it("should set owner as referralInGame if was not sent", async function () {
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, constants.ZERO_ADDRESS, {
          from: CREATOR_0,
          value: BET_ETH_0
        });
        assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 0, {
          from: CREATOR_0
        }), OWNER, "Wrong referral");
      });

      it("should push game id to gamesParticipatedToCheckPrize[ETH]", async function () {
        assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS)).length, 0, "should be empty before");
        await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, constants.ZERO_ADDRESS, {
          from: CREATOR_0,
          value: BET_ETH_0
        });

        assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
          from: CREATOR_0
        })).length, 1, "should be length == 1 after");
        assert.equal((new BN(await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS))).cmp(new BN("0")), 0, "should be 0 idx after");
      });

      it.only("should increase playerStakeTotal[ETH]", async function () {

      });

      it("should increase betsTotal[ETH]", async function () {

      });

      it("should emit CF_GameStarted with correct params", async function () {

      });
    });

    describe("startGame for Token stake", function () {
      it("should fail if Wrong ETH stake", async function () {

      });

      it("should fail Empty hash", async function () {

      });

      it("should fail if Game is running", async function () {

      });

      it("should increase stakeAmount if prev game was finished & amountToAddToNextStake[ETH] > 0", async function () {

      });

      it("should delete amountToAddToNextStake[ETH] if it was used", async function () {

      });

      it("should push Game with correct params", async function () {

      });

      it("should set referralInGame if was sent", async function () {

      });

      it("should set owner as referralInGame if was not sent", async function () {

      });

      it("should push game id to gamesParticipatedToCheckPrize[ETH]", async function () {

      });

      it("should increase playerStakeTotal[ETH]", async function () {

      });

      it("should increase betsTotal[ETH]", async function () {

      });

      it("should emit CF_GameStarted with correct params", async function () {

      });
    });

  });
});