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


contract("PMCCoinFlipContract", function (accounts) {
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
  let creatorHash;

  beforeEach("setup", async function () {
    pmct = await PMCt.new();
    game = await PMCCoinFlipContract.new(pmct.address);
    await pmct.addMinter(game.address);

    creatorHash = web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH);

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

  describe("startGame for ETH stake", function () {
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

    it("should increase playerStakeTotal[ETH], betsTotal[ETH]", async function () {
      assert.equal((new BN(await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(new BN("0"))), 0, "wrong playerStakeTotal[ETH] before 0");
      assert.equal((new BN(await game.betsTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(new BN("0"))), 0, "wrong betsTotal[ETH] before 0");

      //  0
      assert.equal((await game.amountToAddToNextStake.call(constants.ZERO_ADDRESS)).cmp(new BN("0")), 0, "wrong amountToAddToNextStake before");
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });
      assert.equal((new BN(await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(BET_ETH_0)), 0, "wrong playerStakeTotal[ETH] after 0");
      assert.equal((new BN(await game.betsTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(BET_ETH_0)), 0, "wrong betsTotal[ETH] after 0");

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      //  1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      assert.equal(((await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(BET_ETH_0)), 0, "wrong playerStakeTotal[ETH] after 1, BET_ETH_0");
      assert.equal(((await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(BET_ETH_1)), 0, "wrong playerStakeTotal[ETH] after 1, BET_ETH_1");
      assert.equal((new BN(await game.betsTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(BET_ETH_0.add(BET_ETH_1))), 0, "wrong betsTotal[ETH] after 1");
    });

    it("should emit CF_GameStarted with correct params", async function () {
      const {
        logs
      } = await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });
      await expectEvent.inLogs(logs, 'CF_GameStarted', {
        token: constants.ZERO_ADDRESS,
        id: new BN("0")
      });
    });
  });

  describe("startGame for Token stake", function () {
    let testToken;

    beforeEach("Add token", async function () {
      testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 1000);
      testToken.transfer(CREATOR_1, 1000);

      await testToken.approve(game.address, 1000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 1000, {
        from: CREATOR_1
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address)
    });

    it("should fail if value passed as stake", async function () {
      await expectRevert(game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      }), "Wrong value");
    });

    it("should fail Wrong token", async function () {
      await expectRevert(game.startGame(OTHER, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      }), "Wrong token");
    });

    it("should fail Wrong tokens", async function () {
      await expectRevert(game.startGame(testToken.address, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      }), "Wrong tokens");
    });

    it("should transfer correct token amount", async function () {
      assert.equal((await testToken.balanceOf.call(game.address)).cmp(new BN("0")), 0, "Wrong tokens before");

      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      assert.equal((await testToken.balanceOf.call(game.address)).cmp(new BN("10")), 0, "Wrong tokens after");
    });

    it("should fail Empty hash", async function () {
      await expectRevert(game.startGame(testToken.address, 10, "0x0", CREATOR_REFERRAL_0, {
        from: CREATOR_0
      }), "Empty hash");
    });

    it("should fail if Game is running", async function () {
      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await expectRevert(game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      }), "Game is running");
    });

    it("should increase stakeAmount if prev game was finished & amountToAddToNextStake[Token] > 0", async function () {
      //  0
      assert.equal((await game.amountToAddToNextStake.call(testToken.address)).cmp(new BN("0")), 0, "wrong amountToAddToNextStake before");
      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);
      assert.equal((await game.amountToAddToNextStake.call(testToken.address)).cmp(new BN("10")), 0, "wrong amountToAddToNextStake after finish timeout game");

      //  1
      await game.startGame(testToken.address, 20, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });
      assert.equal((new BN((await game.gameInfo.call(testToken.address, 1)).stake)).cmp((new BN("10")).add(new BN("20"))), 0, "wrong stake after game started");
    });

    it("should delete amountToAddToNextStake[Token] if it was used", async function () {
      //  0
      assert.equal((await game.amountToAddToNextStake.call(testToken.address)).cmp(new BN("0")), 0, "wrong amountToAddToNextStake before");
      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);
      assert.equal((await game.amountToAddToNextStake.call(testToken.address)).cmp(new BN("10")), 0, "wrong amountToAddToNextStake after finish timeout game");

      //  1
      await game.startGame(testToken.address, 20, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });
      assert.equal((await game.amountToAddToNextStake.call(testToken.address)).cmp(new BN("0")), 0, "wrong amountToAddToNextStake after game started");
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
      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      let startAt_0 = await time.latest();
      await time.increase(time.duration.minutes(1));

      let gameObj_0 = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameObj_0.running, true, "Should be true for gameObj_0");
      assert.equal(gameObj_0.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_0");
      assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
      assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
      assert.equal(gameObj_0.stake.cmp(new BN("10")), 0, "Wrong stake for gameObj_0");
      assert.equal(gameObj_0.startTime.cmp(startAt_0), 0, "Wrong startTime for gameObj_0");
      assert.equal(gameObj_0.heads, 0, "Wrong heads for gameObj_0");
      assert.equal(gameObj_0.tails, 0, "Wrong tails for gameObj_0");
      assert.equal(gameObj_0.creatorPrize, 0, "Wrong creatorPrize for gameObj_0");
      assert.equal(gameObj_0.opponentPrize, 0, "Wrong opponentPrize for gameObj_0");

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      //  1
      await game.startGame(testToken.address, 20, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      });
      let startAt_1 = await time.latest();
      await time.increase(time.duration.minutes(1));

      //  gameObj_0 after finish
      gameObj_0 = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameObj_0.running, false, "Should be false for gameObj_0");
      assert.equal(gameObj_0.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_0");
      assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
      assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
      assert.equal(gameObj_0.stake.cmp(new BN("10")), 0, "Wrong stake for gameObj_0");
      assert.equal(gameObj_0.startTime.cmp(startAt_0), 0, "Wrong startTime for gameObj_0");
      assert.equal(gameObj_0.heads, 0, "Wrong heads for gameObj_0");
      assert.equal(gameObj_0.tails, 0, "Wrong tails for gameObj_0");
      assert.equal(gameObj_0.creatorPrize, 0, "Wrong creatorPrize for gameObj_0");
      assert.equal(gameObj_0.opponentPrize, 0, "Wrong opponentPrize for gameObj_0");

      //  gameObj_1
      let gameObj_1 = await game.gameInfo.call(testToken.address, 1);
      assert.equal(gameObj_1.running, true, "Should be true for gameObj_1");
      assert.equal(gameObj_1.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_1");
      assert.equal(gameObj_1.creator, CREATOR_1, "Wrong creator for gameObj_1");
      assert.equal(gameObj_1.idx.cmp(new BN("1")), 0, "Wrong idx for gameObj_1");
      assert.equal(gameObj_1.stake.cmp((new BN("10")).add(new BN("20"))), 0, "Wrong stake for gameObj_1");
      assert.equal(gameObj_1.startTime.cmp(startAt_1), 0, "Wrong startTime for gameObj_1");
      assert.equal(gameObj_1.heads, 0, "Wrong heads for gameObj_1");
      assert.equal(gameObj_1.tails, 0, "Wrong tails for gameObj_1");
      assert.equal(gameObj_1.creatorPrize, 0, "Wrong creatorPrize for gameObj_1");
      assert.equal(gameObj_1.opponentPrize, 0, "Wrong opponentPrize for gameObj_1");
    });

    it("should set referralInGame if was sent", async function () {
      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: CREATOR_0
      }), CREATOR_REFERRAL_0, "Wrong referral");
    });

    it("should set owner as referralInGame if was not sent", async function () {
      await game.startGame(testToken.address, 10, creatorHash, constants.ZERO_ADDRESS, {
        from: CREATOR_0
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: CREATOR_0
      }), OWNER, "Wrong referral");
    });

    it("should push game id to gamesParticipatedToCheckPrize[Token]", async function () {
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address)).length, 0, "should be empty before");
      await game.startGame(testToken.address, 10, creatorHash, constants.ZERO_ADDRESS, {
        from: CREATOR_0
      });

      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: CREATOR_0
      })).length, 1, "should be length == 1 after");
      assert.equal((new BN(await game.getGamesParticipatedToCheckPrize.call(testToken.address))).cmp(new BN("0")), 0, "should be 0 idx after");
    });

    it("should increase playerStakeTotal[Token], betsTotal[Token]", async function () {
      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("0"))), 0, "wrong playerStakeTotal[Token] before 0");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("0"))), 0, "wrong betsTotal[Token] before 0");

      //  0
      assert.equal((await game.amountToAddToNextStake.call(testToken.address)).cmp(new BN("0")), 0, "wrong amountToAddToNextStake before");
      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("10"))), 0, "wrong playerStakeTotal[Token] after 0");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("10"))), 0, "wrong betsTotal[Token] after 0");

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      //  1
      await game.startGame(testToken.address, 20, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });
      assert.equal(((await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("10"))), 0, "wrong playerStakeTotal[Token] after 1, CREATOR_0");
      assert.equal(((await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("20"))), 0, "wrong playerStakeTotal[Token] after 1, CREATOR_1");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp((new BN("10")).add(new BN("20")))), 0, "wrong betsTotal[Token] after 1");
    });

    it("should emit CF_GameStarted with correct params", async function () {
      const {
        logs
      } = await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await expectEvent.inLogs(logs, 'CF_GameStarted', {
        token: testToken.address,
        id: new BN("0")
      });
    });
  });

  describe("joinGame for ETH", function () {
    beforeEach("Start game", async function () {
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });
    });

    it("should fail if Wrong side", async function () {
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 0, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      }), "Wrong side");
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 3, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      }), "Wrong side");
    });

    it("should fail if No running games", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      }), "No running games");
    });

    it("should fail if Wrong stake", async function () {
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Wrong stake");

      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      }), "Wrong stake");
    });

    it("should fail if Game time out", async function () {
      await time.increase(time.duration.days(2));
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      }), "Game time out");
    });

    it("should fail if Already joined", async function () {
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      }), "Already joined");
    });

    it("should set correct coin side in opponentCoinSideInGame", async function () {
      assert.equal((await game.opponentCoinSideForOpponent.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).cmp(new BN("0")), 0, "wrong opponentCoinSideInGame before");

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });

      assert.equal((await game.opponentCoinSideForOpponent.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).cmp(new BN("2")), 0, "wrong opponentCoinSideInGame after");
    });

    it("should increase heads if CoinSide.heads", async function () {
      let gameInfo_before = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(gameInfo_before.heads.cmp(new BN("0")), 0, "Wrong heads before");

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(gameInfo_after.heads.cmp(new BN("1")), 0, "Wrong heads after");
    });

    it("should increase tails if CoinSide.tails", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);
      await time.increase(time.duration.seconds(2));

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      })

      let gameInfo_before = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      assert.equal(gameInfo_before.tails.cmp(new BN("0")), 0, "Wrong tails before");

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0.add(BET_ETH_1)
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      assert.equal(gameInfo_after.tails.cmp(new BN("1")), 0, "Wrong tails after");
    });

    it("should set correct referral in referralInGame if passed", async function () {
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }), CREATOR_REFERRAL_0, "Wrong referral");
    });

    it("should set OWNER as referral in referralInGame if not passed", async function () {
      //  0
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      }), OWNER, "Wrong referral");

      //  1
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);
      await time.increase(time.duration.seconds(2));

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      })
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 1, {
        from: OPPONENT_0
      }), OWNER, "Wrong referral");
    });

    it("should update gamesParticipatedToCheckPrize", async function () {
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).length, 0, "should be empty before");

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });

      assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).length, 1, "should be length == 1 after");
      assert.equal((new BN(await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      }))).cmp(new BN("0")), 0, "should be 0 idx after");
    });

    it("should increase increaseStakes, playerStakeTotal & betsTotal", async function () {
      assert.equal((new BN(await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).cmp(new BN("0"))), 0, "wrong playerStakeTotal[Token] before 0");
      assert.equal((new BN(await game.betsTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).cmp(BET_ETH_0)), 0, "wrong betsTotal[Token] before 0");

      //  0
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      assert.equal((new BN(await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(BET_ETH_0)), 0, "wrong playerStakeTotal[Token] after 0");
      assert.equal((new BN(await game.betsTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(BET_ETH_0.mul(new BN("2")))), 0, "wrong betsTotal[Token] after 0");

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      //  1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      assert.equal(((await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).cmp(BET_ETH_0.add(BET_ETH_1))), 0, "wrong playerStakeTotal[Token] after 1, OPPONENT_0");
      assert.equal((new BN(await game.betsTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp((ether("0.46")))), 0, "wrong betsTotal[Token] after 1");
    });

    it("should emit CF_GameJoined", async function () {
      const {
        logs
      } = await game.joinGame(constants.ZERO_ADDRESS, 0, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await expectEvent.inLogs(logs, 'CF_GameJoined', {
        token: constants.ZERO_ADDRESS,
        id: new BN("0"),
        opponent: OPPONENT_0
      });
    });
  });

  describe("joinGame for Token", function () {
    let testToken;

    beforeEach("Add token", async function () {
      testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 1000);
      testToken.transfer(CREATOR_1, 1000);
      testToken.transfer(OPPONENT_0, 1000);
      testToken.transfer(OPPONENT_1, 1000);

      await testToken.approve(game.address, 1000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 1000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_1
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);

      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      })
    });

    it("should fail if Wrong side", async function () {
      await expectRevert(game.joinGame(testToken.address, 10, 0, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Wrong side");
      await expectRevert(game.joinGame(testToken.address, 10, 3, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Wrong side");
    });

    it("should fail if No running games", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      await expectRevert(game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "No running games");
    });

    it("should fail if Wrong stake", async function () {
      await expectRevert(game.joinGame(testToken.address, 11, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Wrong stake");
    });

    it("should fail if Game time out", async function () {
      await time.increase(time.duration.days(2));
      await expectRevert(game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Game time out");
    });

    it("should fail if Already joined", async function () {
      await game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await expectRevert(game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Already joined");
    });

    it("should set correct coin side in opponentCoinSideInGame", async function () {
      assert.equal((await game.opponentCoinSideForOpponent.call(testToken.address, 0, {
        from: OPPONENT_0
      })).cmp(new BN("0")), 0, "wrong opponentCoinSideInGame before");

      await game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      assert.equal((await game.opponentCoinSideForOpponent.call(testToken.address, 0, {
        from: OPPONENT_0
      })).cmp(new BN("1")), 0, "wrong opponentCoinSideInGame after");
    });

    it("should increase heads if CoinSide.heads", async function () {
      let gameInfo_before = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_before.heads.cmp(new BN("0")), 0, "Wrong heads before");

      await game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_after.heads.cmp(new BN("1")), 0, "Wrong heads after");
    });

    it("should increase tails if CoinSide.tails", async function () {
      let gameInfo_before = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_before.tails.cmp(new BN("0")), 0, "Wrong heads before");

      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_after.tails.cmp(new BN("1")), 0, "Wrong heads after");
    });

    it("should set correct referral in referralInGame if passed", async function () {
      await game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: CREATOR_0
      }), CREATOR_REFERRAL_0, "Wrong referral");
    });

    it("should set OWNER as referral in referralInGame if not passed", async function () {
      await game.joinGame(testToken.address, 10, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: OPPONENT_0
      }), OWNER, "Wrong referral");
    });

    it("should update gamesParticipatedToCheckPrize", async function () {
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: OPPONENT_0
      })).length, 0, "should be empty before");

      await game.joinGame(testToken.address, 10, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      });

      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: OPPONENT_0
      })).length, 1, "should be length == 1 after");
      assert.equal((new BN(await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: OPPONENT_0
      }))).cmp(new BN("0")), 0, "should be 0 idx after");
    });

    it("should increase increaseStakes, playerStakeTotal & betsTotal", async function () {
      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("0"))), 0, "wrong playerStakeTotal[Token] before 0");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("10"))), 0, "wrong betsTotal[Token] before 0");

      //  0
      await game.joinGame(testToken.address, 10, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      });
      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("10"))), 0, "wrong playerStakeTotal[Token] after 0");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("20"))), 0, "wrong betsTotal[Token] after 0");

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      //  1
      await game.startGame(testToken.address, 20, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });
      await game.joinGame(testToken.address, 20, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      });
      assert.equal(((await game.getPlayerStakeTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("30"))), 0, "wrong playerStakeTotal[Token] after 1, OPPONENT_0");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp((new BN("60")))), 0, "wrong betsTotal[Token] after 1");
    });

    it("should emit CF_GameJoined", async function () {
      const {
        logs
      } = await game.joinGame(testToken.address, 10, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      });
      await expectEvent.inLogs(logs, 'CF_GameJoined', {
        token: testToken.address,
        id: new BN("0"),
        opponent: OPPONENT_0
      });
    });
  });

  describe("playGame for ETH", function () {
    beforeEach("Start game", async function () {
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
    });

    it("should fail if Wrong side", async function () {
      await expectRevert(game.playGame(constants.ZERO_ADDRESS, 4, CREATOR_SEED_HASH, {
        from: CREATOR_0
      }), "Wrong side");
    });

    it("should fail if No running games", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      await expectRevert(game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      }), "No running games");
    });

    it("should fail if Not creator", async function () {
      await expectRevert(game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      }), "Not creator");
    });

    it("should fail if Time out", async function () {
      await time.increase(time.duration.days(2));

      await expectRevert(game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      }), "Time out");
    });

    it("should fail if Wrong hash value", async function () {
      await expectRevert(game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, web3.utils.soliditySha3("Wrong string"), {
        from: CREATOR_0
      }), "Wrong hash value");
    });

    it("should fail if No opponents", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })

      await expectRevert(game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      }), "No opponents");
    });

    it("should set game.creatorCoinSide", async function () {
      let gameInfo_before = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(gameInfo_before.creatorCoinSide, creatorHash, "Wrong creatorCoinSide before");

      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(gameInfo_after.creatorCoinSide, web3.utils.soliditySha3(CREATOR_COIN_SIDE), "Wrong creatorCoinSide after");
    });

    it("should increase heads if CoinSide.heads", async function () {
      let gameInfo_before = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(0, (gameInfo_before.heads).cmp(new BN("0")), "Wrong heads before");

      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(0, (gameInfo_after.heads).cmp(new BN("1")), "Wrong heads after");
    });

    it("should increase tails if CoinSide.tails", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });

      let gameInfo_before = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      assert.equal(0, (gameInfo_before.tails).cmp(new BN("1")), "Wrong tails before");

      await game.playGame(constants.ZERO_ADDRESS, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      assert.equal(0, (gameInfo_after.tails).cmp(new BN("2")), "Wrong tails after");
    });

    it("should set correct game.creatorPrize if ((game.heads > 0) && (game.tails > 0))", async function () {
      //  join more
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_0
      });

      //  play
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      //  ether("0.11") + ether("0.11") * 3 / 2 = ether("0.275")
      assert.equal(0, (gameInfo_after.creatorPrize).cmp(ether("0.275")), "Wrong creatorPrize after");
    });

    it("should set game.creatorPrize == 0 if ((game.heads == 0) && (game.tails > 0)), all opponents chose same coin side as creator", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      //  play
      await game.playGame(constants.ZERO_ADDRESS, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      assert.equal(0, (gameInfo_after.creatorPrize).cmp(ether("0")), "Wrong creatorPrize after, should be 0");
    });

    it("should set game.creatorPrize == 0 if ((game.heads > 0) && (game.tails == 0)), all opponents chose same coin side as creator", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      //  play
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      assert.equal(0, (gameInfo_after.creatorPrize).cmp(ether("0")), "Wrong creatorPrize after, should be 0");
    });

    it("should set correct game.opponentPrize if ((game.heads > 0) && (game.tails > 0))", async function () {
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_0
      });

      //  play
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      //  ether("0.11") + ether("0.11") * 3 / 2 = ether("0.275")
      assert.equal(0, (gameInfo_after.opponentPrize).cmp(ether("0.275")), "Wrong opponentPrize after");
    });

    it("should set correct game.opponentPrize if not ((game.heads > 0) && (game.tails > 0)), all opponents chose same coin side as creator", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })

      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      //  play
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      //  ether("0.12") + ether("0.12") / 3 = ether("0.16")
      assert.equal(0, (gameInfo_after.opponentPrize).cmp(ether("0.16")), "Wrong opponentPrize after, should be 0.16");
    });

    it("should run raffle, emit event", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })

      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      //  play
      const {
        logs
      } = await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      await expectEvent.inLogs(logs, 'CF_RafflePlayed');
    });

    it("should replenishRewardPool if (stakingAddr != address(0)) && (stakeRewardPoolPending_ETH > 0), check balance", async function () {
      //  add Staking
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })

      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0")), "should be 0 eth before");

      // play
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      assert.equal(1, (await balance.current(staking.address, "wei")).cmp(ether("0")), "should be > 0 eth after");
    });

    it("should replenishRewardPool if (stakingAddr != address(0)) && (stakeRewardPoolPending_ETH == 0), check balance", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw
      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });

      //  add Staking
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      //  start new game
      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })

      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0")), "should be 0 eth before");

      // play
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0")), "should be > 0 eth after");
    });

    it("should updateGameMinStakeETHIfNeeded", async function () {
      //  simulate governance
      await game.updateGovernanceContract(OTHER);
      await game.updateGameMinStakeETH(ether("0.15"), {
        from: OTHER
      });

      assert.equal(0, (await game.gameMinStakeETH.call()).cmp(BET_ETH_MIN), "Wrong gameMinStakeETH before");
      //  play
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameMinStakeETH.call()).cmp(ether("0.15")), "Wrong gameMinStakeETH after");
    });

    it("should updateGameMaxDurationIfNeeded", async function () {
      //  simulate governance
      await game.updateGovernanceContract(OTHER);
      await game.updateGameMaxDuration(time.duration.days(2), {
        from: OTHER
      });

      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(1)), "Wrong gameMaxDuration before");
      //  play
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(2)), "Wrong gameMaxDuration after");
    });

    it("should emit CF_GameFinished with correct params", async function () {
      const {
        logs
      } = await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      await expectEvent.inLogs(logs, 'CF_GameFinished', {
        token: constants.ZERO_ADDRESS,
        id: new BN("0"),
        timeout: false
      });
    });
  });

  describe("playGame for Token", function () {
    let testToken;

    beforeEach("Add token", async function () {
      testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 1000);
      testToken.transfer(CREATOR_1, 1000);
      testToken.transfer(OPPONENT_0, 1000);
      testToken.transfer(OPPONENT_1, 1000);
      testToken.transfer(OPPONENT_2, 1000);
      testToken.transfer(OPPONENT_3, 1000);

      await testToken.approve(game.address, 1000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 1000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_1
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_2
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_3
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);

      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
    });

    it("should fail if Wrong side", async function () {
      await expectRevert(game.playGame(testToken.address, 4, CREATOR_SEED_HASH, {
        from: CREATOR_0
      }), "Wrong side");
    });

    it("should fail if No running games", async function () {
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      await expectRevert(game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      }), "No running games");
    });

    it("should fail if Not creator", async function () {
      await expectRevert(game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      }), "Not creator");
    });

    it("should fail if Time out", async function () {
      await time.increase(time.duration.days(2));

      await expectRevert(game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      }), "Time out");
    });

    it("should fail if Wrong hash value", async function () {
      await expectRevert(game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3("Wrong string"), {
        from: CREATOR_0
      }), "Wrong hash value");
    });

    it("should fail if No opponents", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await expectRevert(game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      }), "No opponents");
    });

    it("should delete game.running", async function () {
      let gameInfo_before = await game.gameInfo.call(testToken.address, 0);
      assert.isTrue(gameInfo_before.running, "Should be true before");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      assert.isFalse(gameInfo_after.running, "Should be false after");
    });

    it("should set game.creatorCoinSide", async function () {
      let gameInfo_before = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_before.creatorCoinSide, creatorHash, "Wrong creatorCoinSide before");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_after.creatorCoinSide, web3.utils.soliditySha3(CREATOR_COIN_SIDE), "Wrong creatorCoinSide after");
    });

    it("should increase heads if CoinSide.heads", async function () {
      let gameInfo_before = await game.gameInfo.call(testToken.address, 0);
      assert.equal(0, (gameInfo_before.heads).cmp(new BN("0")), "Wrong heads before");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      assert.equal(0, (gameInfo_after.heads).cmp(new BN("1")), "Wrong heads after");
    });

    it("should increase tails if CoinSide.tails", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      await game.startGame(testToken.address, 10, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })
      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });

      let gameInfo_before = await game.gameInfo.call(testToken.address, 1);
      assert.equal(0, (gameInfo_before.tails).cmp(new BN("1")), "Wrong tails before");

      await game.playGame(testToken.address, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 1);
      assert.equal(0, (gameInfo_after.tails).cmp(new BN("2")), "Wrong tails after");
    });

    it("should set correct game.creatorPrize if ((game.heads > 0) && (game.tails > 0))", async function () {
      //  join more
      await game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      //  10 + 10 * 3 / 2 = 25
      assert.equal(0, (gameInfo_after.creatorPrize).cmp(new BN("25")), "Wrong creatorPrize after");
    });

    it("should set game.creatorPrize == 0 if ((game.heads == 0) && (game.tails > 0)), all opponents chose same coin side as creator", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(testToken.address, 10, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })
      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });

      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      //  play
      await game.playGame(testToken.address, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 1);
      assert.equal(0, (gameInfo_after.creatorPrize).cmp(ether("0")), "Wrong creatorPrize after, should be 0");
    });

    it("should set game.creatorPrize == 0 if ((game.heads > 0) && (game.tails == 0)), all opponents chose same coin side as creator", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(testToken.address, 20, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })
      await game.joinGame(testToken.address, 20, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });

      await game.joinGame(testToken.address, 20, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 1);
      assert.equal(0, (gameInfo_after.creatorPrize).cmp(ether("0")), "Wrong creatorPrize after, should be 0");
    });

    it("should set correct game.opponentPrize if ((game.heads > 0) && (game.tails > 0))", async function () {
      await game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      //  10 + 10 * 3 / 2 = 25
      assert.equal(0, (gameInfo_after.opponentPrize).cmp(new BN("25")), "Wrong opponentPrize after");
    });

    it("should set correct game.opponentPrize if not ((game.heads > 0) && (game.tails > 0)), all opponents chose same coin side as creator", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(testToken.address, 20, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await game.joinGame(testToken.address, 20, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 20, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 20, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 1);
      //  20 + 20 / 3 = 26
      assert.equal(0, (gameInfo_after.opponentPrize).cmp(new BN("26")), "Wrong opponentPrize after, should be 26");
    });

    it("should run raffle, emit event", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(testToken.address, 10, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      //  play
      const {
        logs
      } = await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      await expectEvent.inLogs(logs, 'CF_RafflePlayed');
    });

    it("should not replenishRewardPool if (stakingAddr != address(0)) && (stakeRewardPoolPending_ETH > 0), check balance", async function () {
      //  add Staking
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(testToken.address, 10, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      assert.equal(0, (await pmct.balanceOf.call(staking.address)).cmp(ether("0")), "should be 0 tokens before");

      // play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      assert.equal(0, (await pmct.balanceOf.call(staking.address)).cmp(ether("0")), "should be 0 tokens after");
    });

    it("should replenishRewardPool if (stakingAddr != address(0)) && (stakeRewardPoolPending_ETH == 0), check balance", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });

      //  add Staking
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      //  start new game
      await game.startGame(testToken.address, 10, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 10, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      assert.equal(0, (await pmct.balanceOf.call(staking.address)).cmp(ether("0")), "should be 0 tokens before");

      // play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      assert.equal(0, (await pmct.balanceOf.call(staking.address)).cmp(ether("0")), "should be 0 tokens after");
    });

    it("should updateGameMinStakeETHIfNeeded", async function () {
      //  start ETH game
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      //  simulate governance
      await game.updateGovernanceContract(OTHER);
      await game.updateGameMinStakeETH(ether("0.25"), {
        from: OTHER
      });

      assert.equal(0, (await game.gameMinStakeETH.call()).cmp(BET_ETH_MIN), "Wrong gameMinStakeETH before");
      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameMinStakeETH.call()).cmp(ether("0.25")), "Wrong gameMinStakeETH after");
    });

    it("should updateGameMaxDurationIfNeeded", async function () {
      //  start ETH game
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      //  simulate governance
      await game.updateGovernanceContract(OTHER);
      await game.updateGameMaxDuration(time.duration.days(3), {
        from: OTHER
      });

      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(1)), "Wrong gameMaxDuration before");
      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(3)), "Wrong gameMaxDuration after");
    });

    it("should emit CF_GameFinished with correct params", async function () {
      const {
        logs
      } = await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      await expectEvent.inLogs(logs, 'CF_GameFinished', {
        token: testToken.address,
        id: new BN("0"),
        timeout: false
      });
    });
  });

  describe("finishTimeoutGame for ETH", function () {
    beforeEach("Start game", async function () {
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
    });

    it("should fail No running games", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      await expectRevert(game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      }), "No running games");
    });

    it("should fail if Still running", async function () {
      await expectRevert(game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      }), "Still running");
    });

    it("should delete game.running", async function () {
      await time.increase(time.duration.days(2));

      assert.isTrue((await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).running, "should be true before");
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      });
      assert.isFalse((await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).running, "should be false after");
    });

    it("should set correct opponentPrize if (opponents > 0) for single opponent", async function () {
      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).opponentPrize.cmp(ether("0.22")), "should be BET_ETH_0 * 2 after");
    });

    it("should set correct opponentPrize if (opponents > 0) for multiple opponents", async function () {
      //  join more
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_0
      });

      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      });
      //  ether("0.11") + ether("0.11") / 4 = 0.1375
      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).opponentPrize.cmp(ether("0.1375")), "should be 0.1375 eth after");
    });

    it("should set opponentPrize == 0 if (opponents == 0)", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);
      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).opponentPrize.cmp(new BN("0")), "should be 0 after");
    });

    it("should start new game with correct params if (opponents == 0) and (msg.sender == game.creator)", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.days(2));
      assert.equal(0, (await game.gamesStarted.call(constants.ZERO_ADDRESS)).cmp(new BN("2")), "should be 2 before");
      let startAt = await time.latest();
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      });
      await time.increase(time.duration.minutes(2));

      assert.equal(0, (await game.gamesStarted.call(constants.ZERO_ADDRESS)).cmp(new BN("3")), "should be 3 after");
      let lastGameInfo = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      let newGameInfo = await game.gameInfo.call(constants.ZERO_ADDRESS, 2);

      assert.equal(lastGameInfo.running, false, "Should be false for lastGameInfo");
      assert.equal(newGameInfo.running, true, "Should be true for newGameInfo");
      assert.equal(newGameInfo.creatorCoinSide, lastGameInfo.creatorCoinSide, "Wrong creatorCoinSide for newGameInfo");
      assert.equal(newGameInfo.creator, lastGameInfo.creator, "Wrong creator for newGameInfo");
      assert.equal(0, newGameInfo.idx.cmp(new BN("2")), "Wrong idx for newGameInfo");
      assert.equal(0, newGameInfo.stake.cmp(lastGameInfo.stake), "Wrong stake for newGameInfo");
      assert.equal(0, newGameInfo.startTime.cmp(startAt), "Wrong startTime for newGameInfo");
      assert.equal(0, newGameInfo.heads.cmp(new BN("0")), "Wrong heads for newGameInfo");
      assert.equal(0, newGameInfo.tails.cmp(new BN("0")), "Wrong tails for newGameInfo");
      assert.equal(0, newGameInfo.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for newGameInfo");
      assert.equal(0, newGameInfo.opponentPrize.cmp(new BN("0")), "Wrong opponentPrize for newGameInfo");
    });

    it("should increase amountToAddToNextStake if (opponents == 0) and (msg.sender != game.creator)", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS);

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.days(2));
      assert.equal(0, (await game.amountToAddToNextStake.call(constants.ZERO_ADDRESS)).cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: OTHER
      });
      assert.equal(0, (await game.amountToAddToNextStake.call(constants.ZERO_ADDRESS)).cmp((await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).stake), "should be BET_ETH_0 after");
    });

    it("should updateGameMinStakeETHIfNeeded", async function () {
      //  simulate governance
      await game.updateGovernanceContract(OTHER);
      await game.updateGameMinStakeETH(ether("0.15"), {
        from: OTHER
      });

      assert.equal(0, (await game.gameMinStakeETH.call()).cmp(BET_ETH_MIN), "Wrong gameMinStakeETH before");
      //  finish
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: OTHER
      });
      assert.equal(0, (await game.gameMinStakeETH.call()).cmp(ether("0.15")), "Wrong gameMinStakeETH after");
    });

    it("should updateGameMaxDurationIfNeeded", async function () {
      //  simulate governance
      await game.updateGovernanceContract(OTHER);
      await game.updateGameMaxDuration(time.duration.days(2), {
        from: OTHER
      });

      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(1)), "Wrong gameMaxDuration before");
      //  finish
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: OPPONENT_3
      });
      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(2)), "Wrong gameMaxDuration after");
    });

    it("should emit CF_GameFinished with correct params", async function () {
      await time.increase(time.duration.days(2));
      const {
        logs
      } = await game.finishTimeoutGame(constants.ZERO_ADDRESS, {
        from: OPPONENT_3
      });
      await expectEvent.inLogs(logs, 'CF_GameFinished', {
        token: constants.ZERO_ADDRESS,
        id: new BN("0"),
        timeout: true
      });
    });
  });

  describe.only("finishTimeoutGame for Token", function () {
    let testToken;

    beforeEach("Add token", async function () {
      testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 1000);
      testToken.transfer(CREATOR_1, 1000);
      testToken.transfer(OPPONENT_0, 1000);
      testToken.transfer(OPPONENT_1, 1000);
      testToken.transfer(OPPONENT_2, 1000);
      testToken.transfer(OPPONENT_3, 1000);

      await testToken.approve(game.address, 1000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 1000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_1
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_2
      });
      await testToken.approve(game.address, 1000, {
        from: OPPONENT_3
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);

      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      //  ETH game
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
    });

    it("should fail No running games", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      await expectRevert(game.finishTimeoutGame(testToken.address, {
        from: CREATOR_0
      }), "No running games");
    });

    it("should fail if Still running", async function () {
      await expectRevert(game.finishTimeoutGame(testToken.address, {
        from: CREATOR_0
      }), "Still running");
    });

    it("should delete game.running", async function () {
      await time.increase(time.duration.days(2));

      assert.isTrue((await game.gameInfo.call(testToken.address, 0)).running, "should be true before");
      await game.finishTimeoutGame(testToken.address, {
        from: CREATOR_0
      });
      assert.isFalse((await game.gameInfo.call(testToken.address, 0)).running, "should be false after");
    });

    it("should set correct opponentPrize if (opponents > 0) for single opponent", async function () {
      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(testToken.address, 0)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(testToken.address, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameInfo.call(testToken.address, 0)).opponentPrize.cmp(new BN("20")), "should be 20 after");
    });

    it("should set correct opponentPrize if (opponents > 0) for multiple opponents", async function () {
      //  join more
      await game.joinGame(testToken.address, 10, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 10, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(testToken.address, 0)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(testToken.address, {
        from: CREATOR_0
      });
      //  10 + 10 / 4 = 12
      assert.equal(0, (await game.gameInfo.call(testToken.address, 0)).opponentPrize.cmp(new BN("12")), "should be 12 after");
    });

    it("should set opponentPrize == 0 if (opponents == 0)", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      await game.startGame(testToken.address, 20, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      });

      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(testToken.address, 1)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(testToken.address);
      assert.equal(0, (await game.gameInfo.call(testToken.address, 1)).opponentPrize.cmp(new BN("0")), "should be 0 after");
    });

    it("should start new game with correct params if (opponents == 0) and (msg.sender == game.creator)", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      await game.startGame(testToken.address, 10, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      });

      await time.increase(time.duration.days(2));
      assert.equal(0, (await game.gamesStarted.call(testToken.address)).cmp(new BN("2")), "should be 2 before");
      let startAt = await time.latest();
      await game.finishTimeoutGame(testToken.address, {
        from: CREATOR_1
      });
      await time.increase(time.duration.minutes(2));

      assert.equal(0, (await game.gamesStarted.call(testToken.address)).cmp(new BN("3")), "should be 3 after");
      let lastGameInfo = await game.gameInfo.call(testToken.address, 1);
      let newGameInfo = await game.gameInfo.call(testToken.address, 2);

      assert.equal(lastGameInfo.running, false, "Should be false for lastGameInfo");
      assert.equal(newGameInfo.running, true, "Should be true for newGameInfo");
      assert.equal(newGameInfo.creatorCoinSide, lastGameInfo.creatorCoinSide, "Wrong creatorCoinSide for newGameInfo");
      assert.equal(newGameInfo.creator, lastGameInfo.creator, "Wrong creator for newGameInfo");
      assert.equal(0, newGameInfo.idx.cmp(new BN("2")), "Wrong idx for newGameInfo");
      assert.equal(0, newGameInfo.stake.cmp(lastGameInfo.stake), "Wrong stake for newGameInfo");
      assert.equal(0, newGameInfo.startTime.cmp(startAt), "Wrong startTime for newGameInfo");
      assert.equal(0, newGameInfo.heads.cmp(new BN("0")), "Wrong heads for newGameInfo");
      assert.equal(0, newGameInfo.tails.cmp(new BN("0")), "Wrong tails for newGameInfo");
      assert.equal(0, newGameInfo.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for newGameInfo");
      assert.equal(0, newGameInfo.opponentPrize.cmp(new BN("0")), "Wrong opponentPrize for newGameInfo");
    });

    it("should increase amountToAddToNextStake if (opponents == 0) and (msg.sender != game.creator)", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address);

      await game.startGame(testToken.address, 20, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      });

      await time.increase(time.duration.days(2));
      assert.equal(0, (await game.amountToAddToNextStake.call(testToken.address)).cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(testToken.address, {
        from: OTHER
      });
      assert.equal(0, (await game.amountToAddToNextStake.call(testToken.address)).cmp((await game.gameInfo.call(testToken.address, 1)).stake), "should be 20 after");
      assert.equal(0, (await game.amountToAddToNextStake.call(testToken.address)).cmp(new BN("20")), "should be 20 after");
    });

    it("should updateGameMinStakeETHIfNeeded", async function () {
      //  simulate governance
      await game.updateGovernanceContract(OTHER);
      await game.updateGameMinStakeETH(ether("0.25"), {
        from: OTHER
      });

      assert.equal(0, (await game.gameMinStakeETH.call()).cmp(BET_ETH_MIN), "Wrong gameMinStakeETH before");
      //  finish
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, {
        from: OTHER
      });
      assert.equal(0, (await game.gameMinStakeETH.call()).cmp(ether("0.25")), "Wrong gameMinStakeETH after");
    });

    it("should updateGameMaxDurationIfNeeded", async function () {
      //  simulate governance
      await game.updateGovernanceContract(OTHER);
      await game.updateGameMaxDuration(time.duration.days(3), {
        from: OTHER
      });

      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(1)), "Wrong gameMaxDuration before");
      //  finish
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, {
        from: OPPONENT_3
      });
      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(3)), "Wrong gameMaxDuration after");
    });

    it("should emit CF_GameFinished with correct params", async function () {
      await time.increase(time.duration.days(2));
      const {
        logs
      } = await game.finishTimeoutGame(testToken.address, {
        from: OPPONENT_3
      });
      await expectEvent.inLogs(logs, 'CF_GameFinished', {
        token: testToken.address,
        id: new BN("0"),
        timeout: true
      });
    });
  });
});