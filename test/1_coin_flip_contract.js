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

    it("should increase stakeAmount if prev game was finished", async function () {
      //  0
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });
      await time.increase(time.duration.days(2));

      //  1
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      assert.equal((new BN((await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).stake)).cmp(BET_ETH_0.add(BET_ETH_1)), 0, "wrong stake after game started");
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


      //  1
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
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

      //  1
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
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
      await expectRevert(game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      }), "Wrong value");
    });

    it("should fail Wrong token", async function () {
      await expectRevert(game.startGame(OTHER, 100, creatorHash, CREATOR_REFERRAL_0, {
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

      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      assert.equal((await testToken.balanceOf.call(game.address)).cmp(new BN("100")), 0, "Wrong tokens after");
    });

    it("should fail Empty hash", async function () {
      await expectRevert(game.startGame(testToken.address, 100, "0x0", CREATOR_REFERRAL_0, {
        from: CREATOR_0
      }), "Empty hash");
    });

    it("should fail if Game is running", async function () {
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await expectRevert(game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      }), "Game is running");
    });

    it("should increase stakeAmount if prev game was finished on timeout", async function () {
      //  0
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      //  1
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });
      assert.equal((new BN((await game.gameInfo.call(testToken.address, 1)).stake)).cmp((new BN("300"))), 0, "wrong stake after game started");
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
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      let startAt_0 = await time.latest();
      await time.increase(time.duration.minutes(1));

      let gameObj_0 = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameObj_0.running, true, "Should be true for gameObj_0");
      assert.equal(gameObj_0.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_0");
      assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
      assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
      assert.equal(gameObj_0.stake.cmp(new BN("100")), 0, "Wrong stake for gameObj_0");
      assert.equal(gameObj_0.startTime.cmp(startAt_0), 0, "Wrong startTime for gameObj_0");
      assert.equal(gameObj_0.heads, 0, "Wrong heads for gameObj_0");
      assert.equal(gameObj_0.tails, 0, "Wrong tails for gameObj_0");
      assert.equal(gameObj_0.creatorPrize, 0, "Wrong creatorPrize for gameObj_0");
      assert.equal(gameObj_0.opponentPrize, 0, "Wrong opponentPrize for gameObj_0");

      //  1
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_1, {
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
      assert.equal(gameObj_0.stake.cmp(new BN("100")), 0, "Wrong stake for gameObj_0");
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
      assert.equal(gameObj_1.stake.cmp((new BN("300"))), 0, "Wrong stake for gameObj_1");
      assert.equal(gameObj_1.startTime.cmp(startAt_1), 0, "Wrong startTime for gameObj_1");
      assert.equal(gameObj_1.heads, 0, "Wrong heads for gameObj_1");
      assert.equal(gameObj_1.tails, 0, "Wrong tails for gameObj_1");
      assert.equal(gameObj_1.creatorPrize, 0, "Wrong creatorPrize for gameObj_1");
      assert.equal(gameObj_1.opponentPrize, 0, "Wrong opponentPrize for gameObj_1");
    });

    it("should set referralInGame if was sent", async function () {
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: CREATOR_0
      }), CREATOR_REFERRAL_0, "Wrong referral");
    });

    it("should set owner as referralInGame if was not sent", async function () {
      await game.startGame(testToken.address, 100, creatorHash, constants.ZERO_ADDRESS, {
        from: CREATOR_0
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: CREATOR_0
      }), OWNER, "Wrong referral");
    });

    it("should push game id to gamesParticipatedToCheckPrize[Token]", async function () {
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address)).length, 0, "should be empty before");
      await game.startGame(testToken.address, 100, creatorHash, constants.ZERO_ADDRESS, {
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
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("100"))), 0, "wrong playerStakeTotal[Token] after 0");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("100"))), 0, "wrong betsTotal[Token] after 0");

      //  1
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });
      assert.equal(((await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("100"))), 0, "wrong playerStakeTotal[Token] after 1, CREATOR_0");
      assert.equal(((await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("200"))), 0, "wrong playerStakeTotal[Token] after 1, CREATOR_1");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("300"))), 0, "wrong betsTotal[Token] after 1");
    });

    it("should emit CF_GameStarted with correct params", async function () {
      const {
        logs
      } = await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
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
      game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_0
      })
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

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
      let gameInfo_before = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(gameInfo_before.tails.cmp(new BN("0")), 0, "Wrong tails before");

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });

      let gameInfo_after = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
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
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
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


      //  1
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
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

      testToken.transfer(CREATOR_0, 10000);
      testToken.transfer(CREATOR_1, 10000);
      testToken.transfer(OPPONENT_0, 10000);
      testToken.transfer(OPPONENT_1, 10000);

      await testToken.approve(game.address, 10000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 10000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_1
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);

      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      })
    });

    it("should fail if Wrong side", async function () {
      await expectRevert(game.joinGame(testToken.address, 100, 0, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Wrong side");
      await expectRevert(game.joinGame(testToken.address, 100, 3, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Wrong side");
    });

    it("should fail if No running games", async function () {
      await time.increase(time.duration.hours(2));
      game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      })
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await expectRevert(game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "No running games");
    });

    it("should fail if Wrong stake", async function () {
      await expectRevert(game.joinGame(testToken.address, 110, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Wrong stake");
    });

    it("should fail if Game time out", async function () {
      await time.increase(time.duration.days(2));
      await expectRevert(game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Game time out");
    });

    it("should fail if Already joined", async function () {
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await expectRevert(game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      }), "Already joined");
    });

    it("should set correct coin side in opponentCoinSideInGame", async function () {
      assert.equal((await game.opponentCoinSideForOpponent.call(testToken.address, 0, {
        from: OPPONENT_0
      })).cmp(new BN("0")), 0, "wrong opponentCoinSideInGame before");

      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      assert.equal((await game.opponentCoinSideForOpponent.call(testToken.address, 0, {
        from: OPPONENT_0
      })).cmp(new BN("1")), 0, "wrong opponentCoinSideInGame after");
    });

    it("should increase heads if CoinSide.heads", async function () {
      let gameInfo_before = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_before.heads.cmp(new BN("0")), 0, "Wrong heads before");

      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_after.heads.cmp(new BN("1")), 0, "Wrong heads after");
    });

    it("should increase tails if CoinSide.tails", async function () {
      let gameInfo_before = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_before.tails.cmp(new BN("0")), 0, "Wrong heads before");

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameInfo_after.tails.cmp(new BN("1")), 0, "Wrong heads after");
    });

    it("should set correct referral in referralInGame if passed", async function () {
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: CREATOR_0
      }), CREATOR_REFERRAL_0, "Wrong referral");
    });

    it("should set OWNER as referral in referralInGame if not passed", async function () {
      await game.joinGame(testToken.address, 100, 1, constants.ZERO_ADDRESS, {
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

      await game.joinGame(testToken.address, 100, 1, constants.ZERO_ADDRESS, {
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
      })).cmp(new BN("100"))), 0, "wrong betsTotal[Token] before 0");

      //  0
      await game.joinGame(testToken.address, 100, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      });
      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("100"))), 0, "wrong playerStakeTotal[Token] after 0");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("200"))), 0, "wrong betsTotal[Token] after 0");
      assert.equal(((await game.getPlayerStakeTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("100"))), 0, "wrong playerStakeTotal[Token] after 0, OPPONENT_0");

      //  1
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });
      await game.joinGame(testToken.address, 200, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 1, constants.ZERO_ADDRESS, {
        from: OPPONENT_1
      });
      assert.equal(((await game.getPlayerStakeTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("300"))), 0, "wrong playerStakeTotal[Token] after 1, OPPONENT_0");
      assert.equal(((await game.getPlayerStakeTotal.call(testToken.address, {
        from: OPPONENT_1
      })).cmp(new BN("200"))), 0, "wrong playerStakeTotal[Token] after 1, OPPONENT_1");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp((new BN("800")))), 0, "wrong betsTotal[Token] after 1");
    });

    it("should emit CF_GameJoined", async function () {
      const {
        logs
      } = await game.joinGame(testToken.address, 100, 1, constants.ZERO_ADDRESS, {
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
      game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

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
      game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      })

      await expectRevert(game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      }), "No opponents");
    });

    it("should delete game.running", async function () {
      game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo = await game.gameInfo(constants.ZERO_ADDRESS, 0);
      assert.isFalse(gameInfo.running, "should be false");

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
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(2));

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
      await time.increase(time.duration.minutes(2));

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

    it("should not replenishRewardPool if (stakingAddr != address(0)) && (stakeRewardPoolPending_ETH == 0), check balance", async function () {
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

      assert.equal(0, (await balance.current(staking.address, "wei")).cmp(ether("0")), "should be == 0 eth after");
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

      testToken.transfer(CREATOR_0, 10000);
      testToken.transfer(CREATOR_1, 10000);
      testToken.transfer(OPPONENT_0, 10000);
      testToken.transfer(OPPONENT_1, 10000);
      testToken.transfer(OPPONENT_2, 10000);
      testToken.transfer(OPPONENT_3, 10000);

      await testToken.approve(game.address, 10000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 10000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_2
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_3
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);

      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
    });

    it("should fail if Wrong side", async function () {
      await expectRevert(game.playGame(testToken.address, 4, CREATOR_SEED_HASH, {
        from: CREATOR_0
      }), "Wrong side");
    });

    it("should fail if No running games", async function () {
      //  eth
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

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
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      });

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
      await game.finishTimeoutGame(testToken.address, 100, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_1, {
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
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      //  100 + 100 * 3 / 2 = 250
      assert.equal(0, (gameInfo_after.creatorPrize).cmp(new BN("250")), "Wrong creatorPrize after");
    });

    it("should set game.creatorPrize == 0 if ((game.heads == 0) && (game.tails > 0)), all opponents chose same coin side as creator", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(testToken.address, 100, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_2, {
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
      await game.startGame(testToken.address, 200, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })
      await game.joinGame(testToken.address, 200, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });

      await game.joinGame(testToken.address, 200, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
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
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 0);
      //  100 + 100 * 3 / 2 = 250
      assert.equal(0, (gameInfo_after.opponentPrize).cmp(new BN("250")), "Wrong opponentPrize after");
    });

    it("should set correct game.opponentPrize if not ((game.heads > 0) && (game.tails > 0)), all opponents chose same coin side as creator", async function () {
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  start new game
      await game.startGame(testToken.address, 200, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await game.joinGame(testToken.address, 200, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 200, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      //  play
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameInfo_after = await game.gameInfo.call(testToken.address, 1);
      //  200 + 200 / 3 = 266
      assert.equal(0, (gameInfo_after.opponentPrize).cmp(new BN("266")), "Wrong opponentPrize after, should be 266");
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
      await game.startGame(testToken.address, 100, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
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
      await game.startGame(testToken.address, 100, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
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
      await game.startGame(testToken.address, 100, web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH), CREATOR_REFERRAL_1, {
        from: CREATOR_1
      })

      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, CREATOR_COIN_SIDE, OPPONENT_REFERRAL_2, {
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
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await time.increase(time.duration.days(2));

      await expectRevert(game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      }), "No running games");
    });

    it("should fail if Still running", async function () {
      await expectRevert(game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: BET_ETH_1
      }), "Still running");
    });

    it("should increase playerStakeTotal[ETH], betsTotal[ETH]", async function () {
      assert.equal((new BN(await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(new BN("0"))), 0, "wrong playerStakeTotal[ETH] before");
      assert.equal((new BN(await game.betsTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(BET_ETH_0.mul(new BN("2")))), 0, "wrong betsTotal[ETH] before");

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      assert.equal((new BN(await game.getPlayerStakeTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(BET_ETH_1)), 0, "wrong playerStakeTotal[ETH] after");
      assert.equal((new BN(await game.betsTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(BET_ETH_0.mul(new BN("2")).add(BET_ETH_1))), 0, "wrong betsTotal[ETH] after");
    });

    it("should delete game.running", async function () {
      await time.increase(time.duration.days(2));

      assert.isTrue((await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).running, "should be true before");
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      assert.isFalse((await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).running, "should be false after");
    });

    it("should set correct opponentPrize if (opponents > 0) for single opponent", async function () {
      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
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
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });
      //  ether("0.11") + ether("0.11") / 4 = 0.1375
      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 0)).opponentPrize.cmp(ether("0.1375")), "should be 0.1375 eth after");
    });

    it("should set opponentPrize == 0 if (opponents == 0)", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.days(2));
      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });
      assert.equal(0, (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).opponentPrize.cmp(new BN("0")), "should be 0 after");
    });

    it("should start new game with correct params", async function () {
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await time.increase(time.duration.days(2));
      assert.equal(0, (await game.gamesStarted.call(constants.ZERO_ADDRESS)).cmp(new BN("2")), "should be 2 before");
      let startAt = await time.latest();
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1,
        value: ether("0.123")
      });
      await time.increase(time.duration.minutes(2));

      assert.equal(0, (await game.gamesStarted.call(constants.ZERO_ADDRESS)).cmp(new BN("3")), "should be 3 after");
      let lastGameInfo = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      let newGameInfo = await game.gameInfo.call(constants.ZERO_ADDRESS, 2);

      assert.equal(lastGameInfo.running, false, "Should be false for lastGameInfo");
      assert.equal(newGameInfo.running, true, "Should be true for newGameInfo");
      assert.equal(newGameInfo.creatorCoinSide, lastGameInfo.creatorCoinSide, "Wrong creatorCoinSide for newGameInfo");
      assert.equal(newGameInfo.creator, CREATOR_1, "Wrong creator for newGameInfo");
      assert.equal(0, newGameInfo.idx.cmp(new BN("2")), "Wrong idx for newGameInfo");
      assert.equal(0, newGameInfo.stake.cmp(ether("0.123").add(BET_ETH_0)), "Wrong stake for newGameInfo");
      assert.equal(0, newGameInfo.startTime.cmp(startAt), "Wrong startTime for newGameInfo");
      assert.equal(0, newGameInfo.heads.cmp(new BN("0")), "Wrong heads for newGameInfo");
      assert.equal(0, newGameInfo.tails.cmp(new BN("0")), "Wrong tails for newGameInfo");
      assert.equal(0, newGameInfo.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for newGameInfo");
      assert.equal(0, newGameInfo.opponentPrize.cmp(new BN("0")), "Wrong opponentPrize for newGameInfo");
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
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: OTHER,
        value: ether("0.15")
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
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: OTHER,
        value: BET_ETH_0
      });
      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(2)), "Wrong gameMaxDuration after");
    });

    it("should emit CF_GameFinished with correct params", async function () {
      await time.increase(time.duration.days(2));
      const {
        logs
      } = await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: OTHER,
        value: BET_ETH_0
      });
      await expectEvent.inLogs(logs, 'CF_GameFinished', {
        token: constants.ZERO_ADDRESS,
        id: new BN("0"),
        timeout: true
      });
    });
  });

  describe("finishTimeoutGame for Token", function () {
    let testToken;

    beforeEach("Add token", async function () {
      testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 10000);
      testToken.transfer(CREATOR_1, 10000);
      testToken.transfer(OPPONENT_0, 10000);
      testToken.transfer(OPPONENT_1, 10000);
      testToken.transfer(OPPONENT_2, 10000);
      testToken.transfer(OPPONENT_3, 10000);

      await testToken.approve(game.address, 10000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 10000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_2
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_3
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);

      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
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
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await expectRevert(game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      }), "No running games");
    });

    it("should fail if Still running", async function () {
      await expectRevert(game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      }), "Still running");
    });

    it("should increase playerStakeTotal[testToken.address], betsTotal[testToken.address]", async function () {
      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("0"))), 0, "wrong playerStakeTotal[testToken.address] before");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("200"))), 0, "wrong betsTotal[testToken.address] before");

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      })

      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("100"))), 0, "wrong playerStakeTotal[testToken.address] CREATOR_0 after");
      assert.equal((new BN(await game.getPlayerStakeTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("200"))), 0, "wrong playerStakeTotal[testToken.address] CREATOR_1 after");
      assert.equal((new BN(await game.betsTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("400"))), 0, "wrong betsTotal[testToken.address] after");
    });

    it("should delete game.running", async function () {
      await time.increase(time.duration.days(2));

      assert.isTrue((await game.gameInfo.call(testToken.address, 0)).running, "should be true before");
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      assert.isFalse((await game.gameInfo.call(testToken.address, 0)).running, "should be false after");
    });

    it("should set correct opponentPrize if (opponents > 0) for single opponent", async function () {
      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(testToken.address, 0)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameInfo.call(testToken.address, 0)).opponentPrize.cmp(new BN("200")), "should be 200 after");
    });

    it("should set correct opponentPrize if (opponents > 0) for multiple opponents", async function () {
      //  join more
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(testToken.address, 0)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      //  100 + 100 / 4 = 125
      assert.equal(0, (await game.gameInfo.call(testToken.address, 0)).opponentPrize.cmp(new BN("125")), "should be 125 after");
    });

    it("should set opponentPrize == 0 if (opponents == 0)", async function () {
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.startGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      });

      await time.increase(time.duration.days(2));

      assert.equal(0, (await game.gameInfo.call(testToken.address, 1)).opponentPrize.cmp(new BN("0")), "should be 0 before");
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameInfo.call(testToken.address, 1)).opponentPrize.cmp(new BN("0")), "should be 0 after");
    });

    it("should start new game with correct params if (opponents == 0) and (msg.sender == game.creator)", async function () {
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_1, {
        from: CREATOR_1
      });

      await time.increase(time.duration.days(2));
      assert.equal(0, (await game.gamesStarted.call(testToken.address)).cmp(new BN("2")), "should be 2 before");
      let startAt = await time.latest();
      await game.finishTimeoutGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await time.increase(time.duration.minutes(2));

      assert.equal(0, (await game.gamesStarted.call(testToken.address)).cmp(new BN("3")), "should be 3 after");
      let lastGameInfo = await game.gameInfo.call(testToken.address, 1);
      let newGameInfo = await game.gameInfo.call(testToken.address, 2);

      assert.equal(lastGameInfo.running, false, "Should be false for lastGameInfo");
      assert.equal(newGameInfo.running, true, "Should be true for newGameInfo");
      assert.equal(newGameInfo.creatorCoinSide, lastGameInfo.creatorCoinSide, "Wrong creatorCoinSide for newGameInfo");
      assert.equal(newGameInfo.creator, CREATOR_0, "Wrong creator for newGameInfo");
      assert.equal(0, newGameInfo.idx.cmp(new BN("2")), "Wrong idx for newGameInfo");
      assert.equal(0, newGameInfo.stake.cmp(new BN("400")), "Wrong stake for newGameInfo");
      assert.equal(0, newGameInfo.startTime.cmp(startAt), "Wrong startTime for newGameInfo");
      assert.equal(0, newGameInfo.heads.cmp(new BN("0")), "Wrong heads for newGameInfo");
      assert.equal(0, newGameInfo.tails.cmp(new BN("0")), "Wrong tails for newGameInfo");
      assert.equal(0, newGameInfo.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for newGameInfo");
      assert.equal(0, newGameInfo.opponentPrize.cmp(new BN("0")), "Wrong opponentPrize for newGameInfo");
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
      await game.finishTimeoutGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
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
      await game.finishTimeoutGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.gameMaxDuration.call()).cmp(time.duration.days(3)), "Wrong gameMaxDuration after");
    });

    it("should emit CF_GameFinished with correct params", async function () {
      await time.increase(time.duration.days(2));
      const {
        logs
      } = await game.finishTimeoutGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await expectEvent.inLogs(logs, 'CF_GameFinished', {
        token: testToken.address,
        id: new BN("0"),
        timeout: true
      });
    });
  });

  describe("pendingPrizeToWithdraw for ETH", function () {
    it("should return 0 if no prize", async function () {
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0)).prize.cmp(new BN("0")), "Should be 0");
    });

    it("should return correct prize & pmct_tokens for multiple games", async function () {
      //  0
      let startAt_0 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  eth
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).prize.cmp(ether("0.165")), "Should be 0.165 eth for CREATOR_0, for 0");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).prize.cmp(ether("0")), "Should be 0 eth for OPPONENT_0, for 0");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).prize.cmp(ether("0.165")), "Should be 0.165 eth for OPPONENT_1, for 0");

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0.00165")), "Should be 0.00165 Token for CREATOR_0, for 0");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 0");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 0");


      //  1
      let startAt_1 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_0, {
        from: CREATOR_1,
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
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  eth
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).prize.cmp(ether("0.165")), "Should be 0.165 eth for CREATOR_0, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).prize.cmp(ether("0.15")), "Should be 0.15 eth for CREATOR_1, for 1"); //  0.12 + 0.12 / 4 = 0.15

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).prize.cmp(ether("0.15")), "Should be 0.15 eth for OPPONENT_0, for 1"); //  0.12 + 0.12 / 4 = 0.15

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).prize.cmp(ether("0.165")), "Should be 0.165 eth for OPPONENT_1, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).prize.cmp(ether("0.15")), "Should be 0.15 eth for OPPONENT_2, for 1"); //  0.12 + 0.12 / 4 = 0.15

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).prize.cmp(ether("0.15")), "Should be 0.15 eth for OPPONENT_2, for 1"); //  0.12 + 0.12 / 4 = 0.15

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0.00165")), "Should be 0.00165 Token for CREATOR_0, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0.0015")), "Should be 0.0015 Token for CREATOR_1, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 1");


      //  2
      let startAt_2 = await time.latest();
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
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(3));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  eth
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).prize.cmp(ether("0.365")), "Should be 0.365 eth for CREATOR_0, for 2"); //  0.165 + (0.12 + 0.12 * 2 / 3) = 0.365

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).prize.cmp(ether("0.15")), "Should be 0.15 eth for CREATOR_1, for 2"); //  0.15

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).prize.cmp(ether("0.15")), "Should be 0.15 eth for OPPONENT_0, for 2"); //  0.15 

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).prize.cmp(ether("0.365")), "Should be 0.365 eth for OPPONENT_1, for 2"); //  0.165 + (0.12 + 0.12 * 2 / 3) = 0.365

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).prize.cmp(ether("0.35")), "Should be 0.35 eth for OPPONENT_2, for 2"); //  0.15 + (0.12 + 0.12 * 2 / 3) = 0.35

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).prize.cmp(ether("0.15")), "Should be 0.15 eth for OPPONENT_2, for 2"); //  0.15

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0.00365")), "Should be 0.00365 Token for CREATOR_0, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0.0015")), "Should be 0.0015 Token for CREATOR_1, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 2");


      //  3
      let startAt_3 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(4));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  eth
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).prize.cmp(ether("0.365")), "Should be 0.365 eth for CREATOR_0, for 3"); //  0.365

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).prize.cmp(ether("0.31")), "Should be 0.31 eth for CREATOR_1, for 3"); //  0.15 + 0.12 + 0.12 / 3 = 0.31

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).prize.cmp(ether("0.31")), "Should be 0.31 eth for OPPONENT_0, for 3"); //  0.15 + 0.12 + 0.12 / 3 = 0.31

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).prize.cmp(ether("0.525")), "Should be 0.525 eth for OPPONENT_1, for 3"); //  0.365 + 0.12 + 0.12 / 3 = 0.525

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).prize.cmp(ether("0.35")), "Should be 0.35 eth for OPPONENT_2, for 3"); //  0.35

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).prize.cmp(ether("0.15")), "Should be 0.15 eth for OPPONENT_2, for 3"); //  0.15

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0.00365")), "Should be 0.00365 Token for CREATOR_0, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0.0031")), "Should be 0.0031 Token for CREATOR_1, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 3");


      //  4
      let startAt_4 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: ether("0.123")
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: ether("0.123")
      });

      await time.increase(time.duration.minutes(5));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  eth
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).prize.cmp(ether("0.365")), "Should be 0.365 eth for CREATOR_0, for 4"); //  0.365

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).prize.cmp(ether("0.31")), "Should be 0.31 eth for CREATOR_1, for 4"); //  0.31

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).prize.cmp(ether("0.46375")), "Should be 0.46375 eth for OPPONENT_0, for 4"); //  0.31 + 0.123 + 0.123 / 4 = 0.46375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).prize.cmp(ether("0.67875")), "Should be 0.67875 eth for OPPONENT_1, for 4"); //  0.525 + 0123 + 0.123 / 4 = 0.67875

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).prize.cmp(ether("0.50375")), "Should be 0.50375 eth for OPPONENT_2, for 4"); //  0.35 + 0.123 + 0.123 / 4 = 0.50375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).prize.cmp(ether("0.30375")), "Should be 0.30375 eth for OPPONENT_2, for 4"); //  0.15 + 0.123 + 0.123 / 4 = 0.30375

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0.00365")), "Should be 0.00365 Token for CREATOR_0, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0.0031")), "Should be 0.0031 Token for CREATOR_1, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 4");


      //  5
      let startAt_5 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
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

      await time.increase(time.duration.minutes(4));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  eth
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).prize.cmp(ether("0.365")), "Should be 0.365 eth for CREATOR_0, for 5"); //  0.365

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).prize.cmp(ether("0.86")), "Should be 0.86 eth for CREATOR_1, for 5"); //  0.31 + 0.11 + 0.11 * 4 = 0.86

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).prize.cmp(ether("0.46375")), "Should be 0.46375 eth for OPPONENT_0, for 5"); //  0.46375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).prize.cmp(ether("0.67875")), "Should be 0.67875 eth for OPPONENT_1, for 5"); //  0.67875

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).prize.cmp(ether("0.50375")), "Should be 0.50375 eth for OPPONENT_2, for 5"); //  0.50375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).prize.cmp(ether("0.30375")), "Should be 0.30375 eth for OPPONENT_2, for 5"); //  0.30375

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0.00365")), "Should be 0.00365 Token for CREATOR_0, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0.0086")), "Should be 0.0086 Token for CREATOR_1, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 5");


      //  6 timeout
      let startAt_6 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: ether("0.2")
      });

      //  eth
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).prize.cmp(ether("0.365")), "Should be 0.365 eth for CREATOR_0, for 6"); //  0.365

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).prize.cmp(ether("0.86")), "Should be 0.86 eth for CREATOR_1, for 6"); //  0.86

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).prize.cmp(ether("0.62875")), "Should be 0.62875 eth for OPPONENT_0, for 6"); //  0.46375 + 0.11 + 0.11 / 2 = 0.62875

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).prize.cmp(ether("0.84375")), "Should be 0.84375 eth for OPPONENT_1, for 6"); //  0.67875 + 0.11 + 0.11 / 2 = 0.84375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).prize.cmp(ether("0.50375")), "Should be 0.50375 eth for OPPONENT_2, for 6"); //  0.50375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).prize.cmp(ether("0.30375")), "Should be 0.30375 eth for OPPONENT_2, for 6"); //  0.30375

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0.00365")), "Should be 0.00365 Token for CREATOR_0, for 6");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0.0086")), "Should be 0.0086 Token for CREATOR_1, for 6");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0.00165")), "Should be 0.00165 Token for OPPONENT_0, for 6"); //  (0.11 + 0.11 / 2) / 100 = 0.00165

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0.00165")), "Should be 0.00165 Token for OPPONENT_1, for 6"); //  (0.11 + 0.11 / 2) / 100 = 0.00165

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 6");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 6");


      //  join
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: CREATOR_0,
        value: ether("0.2")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: ether("0.2")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: ether("0.2")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: ether("0.2")
      });

      await time.increase(time.duration.minutes(4));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  eth
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).prize.cmp(ether("0.865")), "Should be 0.865 eth for CREATOR_0, for 7"); //  0.365 + 0.2 + 0.2 * 3 / 2 = 0.865

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).prize.cmp(ether("1.36")), "Should be 1.36 eth for CREATOR_1, for 7"); //  0.86 + 0.2 + 0.2 * 3 / 2 = 1.36

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).prize.cmp(ether("0.62875")), "Should be 0.62875 eth for OPPONENT_0, for 7"); //  0.62875

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).prize.cmp(ether("0.84375")), "Should be 0.84375 eth for OPPONENT_1, for 7"); //  0.84375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).prize.cmp(ether("0.50375")), "Should be 0.50375 eth for OPPONENT_2, for 7"); //  0.50375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).prize.cmp(ether("0.30375")), "Should be 0.30375 eth for OPPONENT_2, for 7"); //  0.30375

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0.00365")), "Should be 0.00365 Token for CREATOR_0, for 7");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0.0136")), "Should be 0.0136 Token for CREATOR_1, for 7"); //  0.0086 + (0.2 + 0.2 * 3 / 2) / 100 = 0.0136

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0.00165")), "Should be 0.00165 Token for OPPONENT_0, for 7"); //  0.00165

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0.00165")), "Should be 0.00165 Token for OPPONENT_1, for 7"); //  0.00165

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 7");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 7");
    });

    it("should not increase referral fee", async function () {
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });


      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0")), "Should be 0 for CREATOR_REFERRAL_0");
      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_REFERRAL_0
      })).cmp(ether("0")), "Should be 0 for OPPONENT_REFERRAL_0");
      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_REFERRAL_1
      })).cmp(ether("0")), "Should be 0 for OPPONENT_REFERRAL_1");
    });
  });

  describe("pendingPrizeToWithdraw for Token", function () {
    let testToken;

    beforeEach("Add token", async function () {
      testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 10000);
      testToken.transfer(CREATOR_1, 10000);
      testToken.transfer(OPPONENT_0, 10000);
      testToken.transfer(OPPONENT_1, 10000);
      testToken.transfer(OPPONENT_2, 10000);
      testToken.transfer(OPPONENT_3, 10000);

      await testToken.approve(game.address, 10000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 10000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_2
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_3
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);


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

    it("should return 0 if no prize", async function () {
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0)).prize.cmp(new BN("0")), "Should be 0");
    });

    it("should return correct prize & pmct_tokens for multiple games", async function () {
      //  0
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

      //  testToken
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).prize.cmp(new BN("150")), "Should be 15 Token for CREATOR_0, for 0"); //  100 + 100  / 2 = 150

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).prize.cmp(new BN("0")), "Should be 0 testToken for OPPONENT_0, for 0");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).prize.cmp(new BN("150")), "Should be 15 testToken for OPPONENT_1, for 0"); //  100 + 100  / 2 = 150

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_0, for 0");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 0");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 0");

      //  1
      await game.startGame(testToken.address, 300, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  testToken
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).prize.cmp(new BN("150")), "Should be 150 testToken for CREATOR_0, for 1"); //  150

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).prize.cmp(new BN("375")), "Should be 375 testToken for CREATOR_1, for 1"); //  300 + 300 / 4 = 375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).prize.cmp(new BN("375")), "Should be 375 testToken for OPPONENT_0, for 1"); //  300 + 300 / 4 = 375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).prize.cmp(new BN("150")), "Should be 150 testToken for OPPONENT_1, for 1"); //  150

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).prize.cmp(new BN("375")), "Should be  testToken for OPPONENT_2, for 1"); //  300 + 300 / 4 = 375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).prize.cmp(new BN("375")), "Should be 375 testToken for OPPONENT_2, for 1"); //  300 + 300 / 4 = 375

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_0, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_1, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 1");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 1");


      //  2
      await game.startGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(3));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  testToken
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).prize.cmp(new BN("483")), "Should be 483 testToken for CREATOR_0, for 2"); //  150 + (200 + 200 * 2 / 3) = 483

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).prize.cmp(new BN("375")), "Should be 375 testToken for CREATOR_1, for 2"); //  375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).prize.cmp(new BN("375")), "Should be 375 testToken for OPPONENT_0, for 2"); //  375

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).prize.cmp(new BN("483")), "Should be 483 testToken for OPPONENT_1, for 2"); //  150 + (200 + 200 * 2 / 3) = 483

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).prize.cmp(new BN("708")), "Should be 708 testToken for OPPONENT_2, for 2"); //  375 + (200 + 200 * 2 / 3) = 708

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).prize.cmp(new BN("375")), "Should be 375 testToken for OPPONENT_2, for 2"); //  375

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(new BN("0")), "Should be 0.00365 Token for CREATOR_0, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(new BN("0")), "Should be 0 Token for CREATOR_1, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(new BN("0")), "Should be 0 Token for OPPONENT_0, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(new BN("0")), "Should be 0 Token for OPPONENT_1, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(new BN("0")), "Should be 0 Token for OPPONENT_2, for 2");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(new BN("0")), "Should be 0 Token for OPPONENT_3, for 2");


      //  3
      await game.startGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      await time.increase(time.duration.minutes(4));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });


      //  testToken
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).prize.cmp(new BN("483")), "Should be 483 testToken for CREATOR_0, for 3"); //  483

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).prize.cmp(new BN("775")), "Should be 775 testToken for CREATOR_1, for 3"); //  375 + 300 + 300 / 3 = 775

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).prize.cmp(new BN("775")), "Should be 775 testToken for OPPONENT_0, for 3"); //  375 + 300 + 300 / 3 = 775

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).prize.cmp(new BN("883")), "Should be 883 testToken for OPPONENT_1, for 3"); //  483 + 300 + 300 / 3 = 883

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).prize.cmp(new BN("708")), "Should be 408 testToken for OPPONENT_2, for 3"); //  708

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).prize.cmp(new BN("375")), "Should be 375 testToken for OPPONENT_2, for 3"); //  375

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_0, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_1, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 3");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 3");


      //  4
      let startAt_4 = await time.latest();
      await game.startGame(testToken.address, 150, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(5));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  testToken
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).prize.cmp(new BN("483")), "Should be 48 testToken for CREATOR_0, for 4"); //  483

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).prize.cmp(new BN("775")), "Should be 775 testToken for CREATOR_1, for 4"); //  775

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).prize.cmp(new BN("962")), "Should be 962 testToken for OPPONENT_0, for 4"); //  775 + 150 + 150 / 4 = 962

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).prize.cmp(new BN("1070")), "Should be 1070 testToken for OPPONENT_1, for 4"); //  883 + 150 + 150 / 4 = 1070

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).prize.cmp(new BN("895")), "Should be 895 testToken for OPPONENT_2, for 4"); //  708 + 150 + 150 / 4 = 895

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).prize.cmp(new BN("562")), "Should be 562 testToken for OPPONENT_2, for 4"); //  375 + 150 + 150 / 4 = 562

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_0, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_1, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 4");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 4");


      //  5
      let startAt_5 = await time.latest();
      await game.startGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(4));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  testToken
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).prize.cmp(new BN("483")), "Should be 483 testToken for CREATOR_0, for 5"); //  483

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).prize.cmp(new BN("1775")), "Should be 1775 testToken for CREATOR_1, for 5"); //  775 + 200 + 200 * 4 = 1775

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).prize.cmp(new BN("962")), "Should be 962 testToken for OPPONENT_0, for 5"); //  962

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).prize.cmp(new BN("1070")), "Should be 1070 testToken for OPPONENT_1, for 5"); //  1070

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).prize.cmp(new BN("895")), "Should be 895 testToken for OPPONENT_2, for 5"); //  895

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).prize.cmp(new BN("562")), "Should be 562 testToken for OPPONENT_2, for 5"); //  562

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_0, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_1, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 5");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 5");


      //  6 timeout
      let startAt_6 = await time.latest();
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      //  testToken
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).prize.cmp(new BN("483")), "Should be 483 testToken for CREATOR_0, for 6"); //  483

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).prize.cmp(new BN("1775")), "Should be 1775 testToken for CREATOR_1, for 6"); //  1775

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).prize.cmp(new BN("1112")), "Should be 1112 testToken for OPPONENT_0, for 6"); //  962 + 100 + 100 / 2 = 1112

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).prize.cmp(new BN("1220")), "Should be 1220 testToken for OPPONENT_1, for 6"); //  1070 + 100 + 100 / 2 = 1220

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).prize.cmp(new BN("895")), "Should be 895 testToken for OPPONENT_2, for 6"); //  895

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).prize.cmp(new BN("562")), "Should be 562 testToken for OPPONENT_2, for 6"); //  562

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_0, for 6");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_1, for 6");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 6");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 6");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 6");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 6");


      //  7 CREATOR_0 as opponent
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_0, {
        from: CREATOR_0
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(4));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      //  testToken
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).prize.cmp(new BN("983")), "Should be 983 testToken for CREATOR_0, for 7"); //  483 + 200 + 200 * 3 / 2 = 983

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).prize.cmp(new BN("2275")), "Should be 2275 testToken for CREATOR_1, for 7"); //  1775 + 200 + 200 * 3 / 2 = 2275

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).prize.cmp(new BN("1112")), "Should be 1112 testToken for OPPONENT_0, for 7"); //  1112

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).prize.cmp(new BN("1220")), "Should be 1220 testToken for OPPONENT_1, for 7"); //  1220

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).prize.cmp(new BN("895")), "Should be 895 testToken for OPPONENT_2, for 7"); //  895

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).prize.cmp(new BN("562")), "Should be 562 testToken for OPPONENT_2, for 7"); //  562

      //  Token
      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_0, for 7");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: CREATOR_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for CREATOR_1, for 7");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_0
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_0, for 7");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_1
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_1, for 7");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_2
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_2, for 7");

      assert.equal(0, (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
        from: OPPONENT_3
      })).pmct_tokens.cmp(ether("0")), "Should be 0 Token for OPPONENT_3, for 7");
    });

    it("should not increase referral fee", async function () {
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });


      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0")), "Should be 0 for CREATOR_REFERRAL_0");
      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: OPPONENT_REFERRAL_0
      })).cmp(ether("0")), "Should be 0 for OPPONENT_REFERRAL_0");
      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: OPPONENT_REFERRAL_1
      })).cmp(ether("0")), "Should be 0 for OPPONENT_REFERRAL_1");
    });
  });

  describe("gameInfo after play for ETH", function () {
    it("should set correct info", async function () {
      //  0
      let startAt_0 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameObj_0 = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(gameObj_0.running, false, "Should be true for gameObj_0");
      assert.equal(gameObj_0.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_0");
      assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
      assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
      assert.equal(gameObj_0.stake.cmp(BET_ETH_0), 0, "Wrong stake for gameObj_0");
      // assert.equal(gameObj_0.startTime.cmp(startAt_0), 0, "Wrong startTime for gameObj_0");
      assert.equal(gameObj_0.heads, 2, "Wrong heads for gameObj_0");
      assert.equal(gameObj_0.tails, 1, "Wrong tails for gameObj_0");
      assert.equal(0, gameObj_0.creatorPrize.cmp(ether("0.165")), "Wrong creatorPrize for gameObj_0"); //  0.11 + 0.11 / 2 = 0.165
      assert.equal(0, gameObj_0.opponentPrize.cmp(ether("0.165")), "Wrong opponentPrize for gameObj_0"); //  0.11 + 0.11 / 2 = 0.165 

      //  1
      let startAt_1 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_0, {
        from: CREATOR_1,
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
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameObj_1 = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      assert.equal(gameObj_1.running, false, "Should be true for gameObj_1");
      assert.equal(gameObj_1.creatorCoinSide, web3.utils.soliditySha3(2), "Wrong creatorCoinSide for gameObj_1");
      assert.equal(gameObj_1.creator, CREATOR_1, "Wrong creator for gameObj_1");
      assert.equal(gameObj_1.idx, 1, "Wrong idx for gameObj_1");
      assert.equal(gameObj_1.stake.cmp(BET_ETH_1), 0, "Wrong stake for gameObj_1");
      // assert.equal(gameObj_1.startTime.cmp(startAt_1), 0, "Wrong startTime for gameObj_1");
      assert.equal(gameObj_1.heads, 1, "Wrong heads for gameObj_1");
      assert.equal(gameObj_1.tails, 4, "Wrong tails for gameObj_1");
      assert.equal(0, gameObj_1.creatorPrize.cmp(ether("0.15")), "Wrong creatorPrize for gameObj_1"); //  0.12 + 0.12 / 4 = 0.15
      assert.equal(0, gameObj_1.opponentPrize.cmp(ether("0.15")), "Wrong opponentPrize for gameObj_1"); //  0.12 + 0.12 / 4 = 0.15

      //  2
      let startAt_2 = await time.latest();
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
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(3));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameObj_2 = await game.gameInfo.call(constants.ZERO_ADDRESS, 2);
      assert.equal(gameObj_2.running, false, "Should be true for gameObj_2");
      assert.equal(gameObj_2.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_2");
      assert.equal(gameObj_2.creator, CREATOR_0, "Wrong creator for gameObj_2");
      assert.equal(gameObj_2.idx, 2, "Wrong idx for gameObj_2");
      assert.equal(gameObj_2.stake.cmp(BET_ETH_1), 0, "Wrong stake for gameObj_2");
      // assert.equal(gameObj_2.startTime.cmp(startAt_2), 0, "Wrong startTime for gameObj_2");
      assert.equal(gameObj_2.heads, 3, "Wrong heads for gameObj_2");
      assert.equal(gameObj_2.tails, 2, "Wrong tails for gameObj_2");
      assert.equal(0, gameObj_2.creatorPrize.cmp(ether("0.2")), "Wrong creatorPrize for gameObj_2"); //  0.12 + 0.12 * 2 / 3 = 0.2
      assert.equal(0, gameObj_2.opponentPrize.cmp(ether("0.2")), "Wrong opponentPrize for gameObj_2"); //  0.12 + 0.12 * 2 / 3 = 0.2

      //  3
      let startAt_3 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(4));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameObj_3 = await game.gameInfo.call(constants.ZERO_ADDRESS, 3);
      assert.equal(gameObj_3.running, false, "Should be true for gameObj_3");
      assert.equal(gameObj_3.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_3");
      assert.equal(gameObj_3.creator, CREATOR_1, "Wrong creator for gameObj_3");
      assert.equal(gameObj_3.idx, 3, "Wrong idx for gameObj_3");
      assert.equal(gameObj_3.stake.cmp(BET_ETH_1), 0, "Wrong stake for gameObj_3");
      // assert.equal(gameObj_3.startTime.cmp(startAt_3), 0, "Wrong startTime for gameObj_3");
      assert.equal(gameObj_3.heads, 3, "Wrong heads for gameObj_3");
      assert.equal(gameObj_3.tails, 1, "Wrong tails for gameObj_3");
      assert.equal(0, gameObj_3.creatorPrize.cmp(ether("0.16")), "Wrong creatorPrize for gameObj_3"); //  0.12 + 0.12 / 3 = 0.16
      assert.equal(0, gameObj_3.opponentPrize.cmp(ether("0.16")), "Wrong opponentPrize for gameObj_3"); //  0.12 + 0.12 / 3 = 0.16

      //  4
      let startAt_4 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: ether("0.123")
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: ether("0.123")
      });

      await time.increase(time.duration.minutes(5));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameObj_4 = await game.gameInfo.call(constants.ZERO_ADDRESS, 4);
      assert.equal(gameObj_4.running, false, "Should be true for gameObj_4");
      assert.equal(gameObj_4.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_4");
      assert.equal(gameObj_4.creator, CREATOR_1, "Wrong creator for gameObj_4");
      assert.equal(gameObj_4.idx, 4, "Wrong idx for gameObj_4");
      assert.equal(gameObj_4.stake.cmp(ether("0.123")), 0, "Wrong stake for gameObj_4");
      // assert.equal(gameObj_4.startTime.cmp(startAt_4), 0, "Wrong startTime for gameObj_4");
      assert.equal(gameObj_4.heads, 5, "Wrong heads for gameObj_4");
      assert.equal(gameObj_4.tails, 0, "Wrong tails for gameObj_4");
      assert.equal(0, gameObj_4.creatorPrize.cmp(ether("0")), "Wrong creatorPrize for gameObj_4"); //  0
      assert.equal(0, gameObj_4.opponentPrize.cmp(ether("0.15375")), "Wrong opponentPrize for gameObj_4"); //  0.123 + 0.123 / 4 = 0.15375

      //  5
      let startAt_5 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
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

      await time.increase(time.duration.minutes(4));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameObj_5 = await game.gameInfo.call(constants.ZERO_ADDRESS, 5);
      assert.equal(gameObj_5.running, false, "Should be true for gameObj_5");
      assert.equal(gameObj_5.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_5");
      assert.equal(gameObj_5.creator, CREATOR_1, "Wrong creator for gameObj_5");
      assert.equal(gameObj_5.idx, 5, "Wrong idx for gameObj_5");
      assert.equal(gameObj_5.stake.cmp(BET_ETH_0), 0, "Wrong stake for gameObj_5");
      // assert.equal(gameObj_5.startTime.cmp(startAt_4), 0, "Wrong startTime for gameObj_5");
      assert.equal(gameObj_5.heads, 1, "Wrong heads for gameObj_5");
      assert.equal(gameObj_5.tails, 4, "Wrong tails for gameObj_5");
      assert.equal(0, gameObj_5.creatorPrize.cmp(ether("0.55")), "Wrong creatorPrize for gameObj_5"); //  0.11 + 0.11 * 4 = 0.55
      assert.equal(0, gameObj_5.opponentPrize.cmp(ether("0")), "Wrong opponentPrize for 5"); //  0
    });
  });

  describe("gameInfo after play for Token", function () {
    it("should set correct info", async function () {
      let testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 10000);
      testToken.transfer(CREATOR_1, 10000);
      testToken.transfer(OPPONENT_0, 10000);
      testToken.transfer(OPPONENT_1, 10000);
      testToken.transfer(OPPONENT_2, 10000);
      testToken.transfer(OPPONENT_3, 10000);

      await testToken.approve(game.address, 10000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 10000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_2
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_3
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);


      //  0
      let startAt_0 = await time.latest();
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

      let gameObj_0 = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameObj_0.running, false, "Should be true for gameObj_0");
      assert.equal(gameObj_0.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_0");
      assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
      assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
      assert.equal(gameObj_0.stake.cmp(new BN("100")), 0, "Wrong stake for gameObj_0");
      // assert.equal(gameObj_0.startTime.cmp(startAt_0), 0, "Wrong startTime for gameObj_0");
      assert.equal(gameObj_0.heads, 2, "Wrong heads for gameObj_0");
      assert.equal(gameObj_0.tails, 1, "Wrong tails for gameObj_0");
      assert.equal(0, gameObj_0.creatorPrize.cmp(new BN("150")), "Wrong creatorPrize for gameObj_0"); //  100 + 100 / 2 = 150
      assert.equal(0, gameObj_0.opponentPrize.cmp(new BN("150")), "Wrong opponentPrize for gameObj_0"); //  100 + 100 / 2 = 150

      //  1
      let startAt_1 = await time.latest();
      await game.startGame(testToken.address, 200, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameObj_1 = await game.gameInfo.call(testToken.address, 1);
      assert.equal(gameObj_1.running, false, "Should be true for gameObj_1");
      assert.equal(gameObj_1.creatorCoinSide, web3.utils.soliditySha3(2), "Wrong creatorCoinSide for gameObj_1");
      assert.equal(gameObj_1.creator, CREATOR_1, "Wrong creator for gameObj_1");
      assert.equal(gameObj_1.idx, 1, "Wrong idx for gameObj_1");
      assert.equal(gameObj_1.stake.cmp(new BN("200")), 0, "Wrong stake for gameObj_1");
      // assert.equal(gameObj_1.startTime.cmp(startAt_1), 0, "Wrong startTime for gameObj_1");
      assert.equal(gameObj_1.heads, 1, "Wrong heads for gameObj_1");
      assert.equal(gameObj_1.tails, 4, "Wrong tails for gameObj_1");
      assert.equal(0, gameObj_1.creatorPrize.cmp(new BN("250")), "Wrong creatorPrize for gameObj_1"); //  200 + 200 / 4 = 250
      assert.equal(0, gameObj_1.opponentPrize.cmp(new BN("250")), "Wrong opponentPrize for gameObj_1"); //  200 + 200 / 4 = 250

      //  2
      let startAt_2 = await time.latest();
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(3));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let gameObj_2 = await game.gameInfo.call(testToken.address, 2);
      assert.equal(gameObj_2.running, false, "Should be true for gameObj_2");
      assert.equal(gameObj_2.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_2");
      assert.equal(gameObj_2.creator, CREATOR_0, "Wrong creator for gameObj_2");
      assert.equal(gameObj_2.idx, 2, "Wrong idx for gameObj_2");
      assert.equal(gameObj_2.stake.cmp(new BN("100")), 0, "Wrong stake for gameObj_2");
      // assert.equal(gameObj_2.startTime.cmp(startAt_2), 0, "Wrong startTime for gameObj_2");
      assert.equal(gameObj_2.heads, 3, "Wrong heads for gameObj_2");
      assert.equal(gameObj_2.tails, 2, "Wrong tails for gameObj_2");
      assert.equal(0, gameObj_2.creatorPrize.cmp(new BN("166")), "Wrong creatorPrize for gameObj_2"); //  100 + 100 * 2 / 3 = 166
      assert.equal(0, gameObj_2.opponentPrize.cmp(new BN("166")), "Wrong opponentPrize for gameObj_2"); //  100 + 100 * 2 / 3 = 166

      //  3
      let startAt_3 = await time.latest();
      await game.startGame(testToken.address, 310, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 310, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 310, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 310, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      await time.increase(time.duration.minutes(4));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameObj_3 = await game.gameInfo.call(testToken.address, 3);
      assert.equal(gameObj_3.running, false, "Should be true for gameObj_3");
      assert.equal(gameObj_3.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_3");
      assert.equal(gameObj_3.creator, CREATOR_1, "Wrong creator for gameObj_3");
      assert.equal(gameObj_3.idx, 3, "Wrong idx for gameObj_3");
      assert.equal(gameObj_3.stake.cmp(new BN("310")), 0, "Wrong stake for gameObj_3");
      // assert.equal(gameObj_3.startTime.cmp(startAt_3), 0, "Wrong startTime for gameObj_3");
      assert.equal(gameObj_3.heads, 3, "Wrong heads for gameObj_3");
      assert.equal(gameObj_3.tails, 1, "Wrong tails for gameObj_3");
      assert.equal(0, gameObj_3.creatorPrize.cmp(new BN("413")), "Wrong creatorPrize for gameObj_3"); //  310 + 310 / 3 = 413
      assert.equal(0, gameObj_3.opponentPrize.cmp(new BN("413")), "Wrong opponentPrize for gameObj_3"); //  310 + 310 / 3 = 413

      //  4
      let startAt_4 = await time.latest();
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(5));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameObj_4 = await game.gameInfo.call(testToken.address, 4);
      assert.equal(gameObj_4.running, false, "Should be true for gameObj_4");
      assert.equal(gameObj_4.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_4");
      assert.equal(gameObj_4.creator, CREATOR_1, "Wrong creator for gameObj_4");
      assert.equal(gameObj_4.idx, 4, "Wrong idx for gameObj_4");
      assert.equal(gameObj_4.stake.cmp(new BN("100")), 0, "Wrong stake for gameObj_4");
      // assert.equal(gameObj_4.startTime.cmp(startAt_4), 0, "Wrong startTime for gameObj_4");
      assert.equal(gameObj_4.heads, 5, "Wrong heads for gameObj_4");
      assert.equal(gameObj_4.tails, 0, "Wrong tails for gameObj_4");
      assert.equal(0, gameObj_4.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for gameObj_4"); //  0
      assert.equal(0, gameObj_4.opponentPrize.cmp(new BN("125")), "Wrong opponentPrize for gameObj_4"); //  100 + 100 / 4 = 125

      //  5
      let startAt_5 = await time.latest();
      await game.startGame(testToken.address, 500, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.minutes(4));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      let gameObj_5 = await game.gameInfo.call(testToken.address, 5);
      assert.equal(gameObj_5.running, false, "Should be true for gameObj_5");
      assert.equal(gameObj_5.creatorCoinSide, web3.utils.soliditySha3(1), "Wrong creatorCoinSide for gameObj_5");
      assert.equal(gameObj_5.creator, CREATOR_1, "Wrong creator for gameObj_5");
      assert.equal(gameObj_5.idx, 5, "Wrong idx for gameObj_5");
      assert.equal(gameObj_5.stake.cmp(new BN("500")), 0, "Wrong stake for gameObj_5");
      // assert.equal(gameObj_5.startTime.cmp(startAt_4), 0, "Wrong startTime for gameObj_5");
      assert.equal(gameObj_5.heads, 1, "Wrong heads for gameObj_5");
      assert.equal(gameObj_5.tails, 4, "Wrong tails for gameObj_5");
      assert.equal(0, gameObj_5.creatorPrize.cmp(new BN("2500")), "Wrong creatorPrize for gameObj_5"); //  500 + 500 * 4 = 2500
      assert.equal(0, gameObj_5.opponentPrize.cmp(new BN("0")), "Wrong opponentPrize for 5"); //  0
    });
  });

  describe("gameInfo after finishTimeoutGame for ETH", function () {
    it("should set correct info", async function () {
      //  0
      let startAt_0 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      let gameObj_0 = await game.gameInfo.call(constants.ZERO_ADDRESS, 0);
      assert.equal(gameObj_0.running, false, "Should be true for gameObj_0");
      assert.equal(gameObj_0.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_0");
      assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
      assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
      assert.equal(gameObj_0.stake.cmp(BET_ETH_0), 0, "Wrong stake for gameObj_0");
      // assert.equal(gameObj_0.startTime.cmp(startAt_0), 0, "Wrong startTime for gameObj_0");
      assert.equal(gameObj_0.heads, 1, "Wrong heads for gameObj_0");
      assert.equal(gameObj_0.tails, 1, "Wrong tails for gameObj_0");
      assert.equal(0, gameObj_0.creatorPrize.cmp(ether("0")), "Wrong creatorPrize for gameObj_0"); //  0
      assert.equal(0, gameObj_0.opponentPrize.cmp(ether("0.165")), "Wrong opponentPrize for gameObj_0"); //  0.11 + 0.11 / 2 = 0.165 

      //  1
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      let gameObj_1 = await game.gameInfo.call(constants.ZERO_ADDRESS, 1);
      assert.equal(gameObj_1.running, false, "Should be true for gameObj_1");
      assert.equal(gameObj_1.creatorCoinSide, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), "Wrong creatorCoinSide for gameObj_1");
      assert.equal(gameObj_1.creator, CREATOR_1, "Wrong creator for gameObj_1");
      assert.equal(gameObj_1.idx, 1, "Wrong idx for gameObj_1");
      assert.equal(gameObj_1.stake.cmp(BET_ETH_1), 0, "Wrong stake for gameObj_1");
      // assert.equal(gameObj_1.startTime.cmp(startAt_1), 0, "Wrong startTime for gameObj_1");
      assert.equal(gameObj_1.heads, 1, "Wrong heads for gameObj_1");
      assert.equal(gameObj_1.tails, 3, "Wrong tails for gameObj_1");
      assert.equal(0, gameObj_1.creatorPrize.cmp(ether("0")), "Wrong creatorPrize for gameObj_1"); //  0
      assert.equal(0, gameObj_1.opponentPrize.cmp(ether("0.15")), "Wrong opponentPrize for gameObj_1"); //  0.12 + 0.12 / 4 = 0.15

      //  2
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      let gameObj_2 = await game.gameInfo.call(constants.ZERO_ADDRESS, 2);
      assert.equal(gameObj_2.running, false, "Should be true for gameObj_2");
      assert.equal(gameObj_2.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_2");
      assert.equal(gameObj_2.creator, CREATOR_0, "Wrong creator for gameObj_2");
      assert.equal(gameObj_2.idx, 2, "Wrong idx for gameObj_2");
      assert.equal(gameObj_2.stake.cmp(BET_ETH_1), 0, "Wrong stake for gameObj_2");
      // assert.equal(gameObj_2.startTime.cmp(startAt_2), 0, "Wrong startTime for gameObj_2");
      assert.equal(gameObj_2.heads, 2, "Wrong heads for gameObj_2");
      assert.equal(gameObj_2.tails, 2, "Wrong tails for gameObj_2");
      assert.equal(0, gameObj_2.creatorPrize.cmp(ether("0")), "Wrong creatorPrize for gameObj_2"); //  0
      assert.equal(0, gameObj_2.opponentPrize.cmp(ether("0.15")), "Wrong opponentPrize for gameObj_2"); //  0.12 + 0.12 / 4 = 0.15

      //  3
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: ether("0.123")
      });

      let gameObj_3 = await game.gameInfo.call(constants.ZERO_ADDRESS, 3);
      assert.equal(gameObj_3.running, false, "Should be true for gameObj_3");
      assert.equal(gameObj_3.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_3");
      assert.equal(gameObj_3.creator, CREATOR_1, "Wrong creator for gameObj_3");
      assert.equal(gameObj_3.idx, 3, "Wrong idx for gameObj_3");
      assert.equal(gameObj_3.stake.cmp(BET_ETH_1), 0, "Wrong stake for gameObj_3");
      // assert.equal(gameObj_3.startTime.cmp(startAt_3), 0, "Wrong startTime for gameObj_3");
      assert.equal(gameObj_3.heads, 2, "Wrong heads for gameObj_3");
      assert.equal(gameObj_3.tails, 1, "Wrong tails for gameObj_3");
      assert.equal(0, gameObj_3.creatorPrize.cmp(ether("0")), "Wrong creatorPrize for gameObj_3"); //  0
      assert.equal(0, gameObj_3.opponentPrize.cmp(ether("0.16")), "Wrong opponentPrize for gameObj_3"); //  0.12 + 0.12 / 3 = 0.16

      //  4
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: ether("0.123")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: ether("0.123")
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_0
      });

      let gameObj_4 = await game.gameInfo.call(constants.ZERO_ADDRESS, 4);
      assert.equal(gameObj_4.running, false, "Should be true for gameObj_4");
      assert.equal(gameObj_4.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_4");
      assert.equal(gameObj_4.creator, CREATOR_1, "Wrong creator for gameObj_4");
      assert.equal(gameObj_4.idx, 4, "Wrong idx for gameObj_4");
      assert.equal(gameObj_4.stake.cmp(ether("0.123")), 0, "Wrong stake for gameObj_4");
      // assert.equal(gameObj_4.startTime.cmp(startAt_4), 0, "Wrong startTime for gameObj_4");
      assert.equal(gameObj_4.heads, 4, "Wrong heads for gameObj_4");
      assert.equal(gameObj_4.tails, 0, "Wrong tails for gameObj_4");
      assert.equal(0, gameObj_4.creatorPrize.cmp(ether("0")), "Wrong creatorPrize for gameObj_4"); //  0
      assert.equal(0, gameObj_4.opponentPrize.cmp(ether("0.15375")), "Wrong opponentPrize for gameObj_4"); //  0.123 + 0.123 / 4 = 0.15375

      //  5
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
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
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: OTHER,
        value: BET_ETH_0
      });

      let gameObj_5 = await game.gameInfo.call(constants.ZERO_ADDRESS, 5);
      assert.equal(gameObj_5.running, false, "Should be true for gameObj_5");
      assert.equal(gameObj_5.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_5");
      assert.equal(gameObj_5.creator, CREATOR_1, "Wrong creator for gameObj_5");
      assert.equal(gameObj_5.idx, 5, "Wrong idx for gameObj_5");
      assert.equal(gameObj_5.stake.cmp(BET_ETH_0), 0, "Wrong stake for gameObj_5");
      // assert.equal(gameObj_5.startTime.cmp(startAt_4), 0, "Wrong startTime for gameObj_5");
      assert.equal(gameObj_5.heads, 0, "Wrong heads for gameObj_5");
      assert.equal(gameObj_5.tails, 4, "Wrong tails for gameObj_5");
      assert.equal(0, gameObj_5.creatorPrize.cmp(ether("0")), "Wrong creatorPrize for gameObj_5"); //  0
      assert.equal(0, gameObj_5.opponentPrize.cmp(ether("0.1375")), "Wrong opponentPrize for 5"); //  0.11 + 0.11 / 4 = 0.1375
    });
  });

  describe("gameInfo after finishTimeoutGame for Token", function () {
    it("should set correct info", async function () {
      let testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 10000);
      testToken.transfer(CREATOR_1, 10000);
      testToken.transfer(OPPONENT_0, 10000);
      testToken.transfer(OPPONENT_1, 10000);
      testToken.transfer(OPPONENT_2, 10000);
      testToken.transfer(OPPONENT_3, 10000);

      await testToken.approve(game.address, 10000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 10000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_0
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_2
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_3
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address);

      //  0
      await game.startGame(testToken.address, 120, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 120, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 120, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 100, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      let gameObj_0 = await game.gameInfo.call(testToken.address, 0);
      assert.equal(gameObj_0.running, false, "Should be true for gameObj_0");
      assert.equal(gameObj_0.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_0");
      assert.equal(gameObj_0.creator, CREATOR_0, "Wrong creator for gameObj_0");
      assert.equal(gameObj_0.idx, 0, "Wrong idx for gameObj_0");
      assert.equal(gameObj_0.stake.cmp(new BN("120")), 0, "Wrong stake for gameObj_0");
      assert.equal(gameObj_0.heads, 1, "Wrong heads for gameObj_0");
      assert.equal(gameObj_0.tails, 1, "Wrong tails for gameObj_0");
      assert.equal(0, gameObj_0.creatorPrize.cmp(ether("0")), "Wrong creatorPrize for gameObj_0"); //  0
      assert.equal(0, gameObj_0.opponentPrize.cmp(new BN("180")), "Wrong opponentPrize for gameObj_0"); //  120 + 120 / 2 = 180


      //  1
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      let gameObj_1 = await game.gameInfo.call(testToken.address, 1);
      assert.equal(gameObj_1.running, false, "Should be true for gameObj_1");
      assert.equal(gameObj_1.creatorCoinSide, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), "Wrong creatorCoinSide for gameObj_1");
      assert.equal(gameObj_1.creator, CREATOR_1, "Wrong creator for gameObj_1");
      assert.equal(gameObj_1.idx, 1, "Wrong idx for gameObj_1");
      assert.equal(gameObj_1.stake.cmp(new BN("100")), 0, "Wrong stake for gameObj_1");
      assert.equal(gameObj_1.heads, 1, "Wrong heads for gameObj_1");
      assert.equal(gameObj_1.tails, 3, "Wrong tails for gameObj_1");
      assert.equal(0, gameObj_1.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for gameObj_1"); //  0
      assert.equal(0, gameObj_1.opponentPrize.cmp(new BN("125")), "Wrong opponentPrize for gameObj_1"); //  10 0+ 100 / 4 = 125


      //  2
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      let gameObj_2 = await game.gameInfo.call(testToken.address, 2);
      assert.equal(gameObj_2.running, false, "Should be true for gameObj_2");
      assert.equal(gameObj_2.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_2");
      assert.equal(gameObj_2.creator, CREATOR_0, "Wrong creator for gameObj_2");
      assert.equal(gameObj_2.idx, 2, "Wrong idx for gameObj_2");
      assert.equal(gameObj_2.stake.cmp(new BN("200")), 0, "Wrong stake for gameObj_2");
      assert.equal(gameObj_2.heads, 2, "Wrong heads for gameObj_2");
      assert.equal(gameObj_2.tails, 2, "Wrong tails for gameObj_2");
      assert.equal(0, gameObj_2.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for gameObj_2"); //  0
      assert.equal(0, gameObj_2.opponentPrize.cmp(new BN("250")), "Wrong opponentPrize for gameObj_2"); //  200 + 200 / 4 = 250


      //  3
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 110, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      let gameObj_3 = await game.gameInfo.call(testToken.address, 3);
      assert.equal(gameObj_3.running, false, "Should be true for gameObj_3");
      assert.equal(gameObj_3.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_3");
      assert.equal(gameObj_3.creator, CREATOR_1, "Wrong creator for gameObj_3");
      assert.equal(gameObj_3.idx, 3, "Wrong idx for gameObj_3");
      assert.equal(gameObj_3.stake.cmp(new BN("300")), 0, "Wrong stake for gameObj_3");
      assert.equal(gameObj_3.heads, 2, "Wrong heads for gameObj_3");
      assert.equal(gameObj_3.tails, 1, "Wrong tails for gameObj_3");
      assert.equal(0, gameObj_3.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for gameObj_3"); //  0
      assert.equal(0, gameObj_3.opponentPrize.cmp(new BN("400")), "Wrong opponentPrize for gameObj_3"); //  300 + 300 / 3 = 400


      //  4
      await game.joinGame(testToken.address, 110, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 110, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 110, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 110, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 400, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      let gameObj_4 = await game.gameInfo.call(testToken.address, 4);
      assert.equal(gameObj_4.running, false, "Should be true for gameObj_4");
      assert.equal(gameObj_4.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_4");
      assert.equal(gameObj_4.creator, CREATOR_1, "Wrong creator for gameObj_4");
      assert.equal(gameObj_4.idx, 4, "Wrong idx for gameObj_4");
      assert.equal(gameObj_4.stake.cmp(new BN("110")), 0, "Wrong stake for gameObj_4");
      assert.equal(gameObj_4.heads, 4, "Wrong heads for gameObj_4");
      assert.equal(gameObj_4.tails, 0, "Wrong tails for gameObj_4");
      assert.equal(0, gameObj_4.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for gameObj_4"); //  0
      assert.equal(0, gameObj_4.opponentPrize.cmp(new BN("137")), "Wrong opponentPrize for gameObj_4"); //  110 + 110 / 4 = 137


      //  5
      await game.joinGame(testToken.address, 400, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 400, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 400, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 400, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 400, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      let gameObj_5 = await game.gameInfo.call(testToken.address, 5);
      assert.equal(gameObj_5.running, false, "Should be true for gameObj_5");
      assert.equal(gameObj_5.creatorCoinSide, creatorHash, "Wrong creatorCoinSide for gameObj_5");
      assert.equal(gameObj_5.creator, CREATOR_1, "Wrong creator for gameObj_5");
      assert.equal(gameObj_5.idx, 5, "Wrong idx for gameObj_5");
      assert.equal(gameObj_5.stake.cmp(new BN("400")), 0, "Wrong stake for gameObj_5");
      assert.equal(gameObj_5.heads, 0, "Wrong heads for gameObj_5");
      assert.equal(gameObj_5.tails, 4, "Wrong tails for gameObj_5");
      assert.equal(0, gameObj_5.creatorPrize.cmp(new BN("0")), "Wrong creatorPrize for gameObj_5"); //  0
      assert.equal(0, gameObj_5.opponentPrize.cmp(new BN("500")), "Wrong opponentPrize for 5"); //  400 + 400 / 4 = 500
    });
  });

  describe("withdrawPendingPrizes ETH & Token combined, _maxLoop = 0", function () {
    let testToken;

    beforeEach("setup Token", async function () {
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

    it("should fail if No prize", async function () {
      await expectRevert(game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0), "No prize");
      await expectRevert(game.withdrawPendingPrizes(testToken.address, 0), "No prize");
    });

    it("should withdraw correct amount", async function () {
      //  add staking
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      //  add partner
      await game.updatePartner(OTHER);


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
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  check - CREATOR_0
      let CREATOR_0_balance_before_0 = await balance.current(CREATOR_0, "wei");
      let tx_CREATOR_0_0 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      let gasUsed = new BN(tx_CREATOR_0_0.receipt.gasUsed);
      let txInfo = await web3.eth.getTransaction(tx_CREATOR_0_0.tx);
      let gasPrice = new BN(txInfo.gasPrice);
      let gasSpent = gasUsed.mul(gasPrice);

      let CREATOR_0_balance_after_0 = await balance.current(CREATOR_0, "wei");
      assert.equal(0, CREATOR_0_balance_before_0.add(ether("0.15675")).sub(gasSpent).cmp(CREATOR_0_balance_after_0), "Wrong CREATOR_0_balance_after_0"); //  0.11 + 0.11 / 2 = 0.165 * 0.95

      //  check - OPPONENT_0
      await expectRevert(game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      }), "No prize");

      //  check - OPPONENT_1
      let OPPONENT_1_balance_before_0 = await balance.current(OPPONENT_1, "wei");
      let tx_OPPONENT_1_0 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      });
      gasUsed = new BN(tx_OPPONENT_1_0.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx_OPPONENT_1_0.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      let OPPONENT_1_balance_after_0 = await balance.current(OPPONENT_1, "wei");
      assert.equal(0, OPPONENT_1_balance_before_0.add(ether("0.15675")).sub(gasSpent).cmp(OPPONENT_1_balance_after_0), "Wrong OPPONENT_1_balance_after_0"); //  0.11 + 0.11 / 2 = 0.165 * 0.95

      //  check - PMCt
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_0)).cmp(ether("0.00165")), "should be 0.00165 PMCT for CREATOR_0, 0");
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_1)).cmp(ether("0")), "should be 0 PMCT for CREATOR_1, 0");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_0)).cmp(ether("0")), "should be 0 PMCT for OPPONENT_0, 0");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_1)).cmp(ether("0")), "should be 0 PMCT for OPPONENT_1, 0");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_2)).cmp(ether("0")), "should be 0 PMCT for OPPONENT_2, 0");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_3)).cmp(ether("0")), "should be 0 PMCT for OPPONENT_3, 0");


      //  check - playerWithdrawedTotal, ETH
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(ether("0.15675")), "should playerWithdrawedTotal 0.15675 ETH for CREATOR_0, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(ether("0")), "should playerWithdrawedTotal 0 ETH for CREATOR_1, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).cmp(ether("0")), "should playerWithdrawedTotal 0 ETH for OPPONENT_0, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_1
      })).cmp(ether("0.15675")), "should playerWithdrawedTotal 0.15675 ETH for OPPONENT_1, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_2
      })).cmp(ether("0")), "should playerWithdrawedTotal 0 ETH for OPPONENT_2, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_3
      })).cmp(ether("0")), "should playerWithdrawedTotal 0 ETH for OPPONENT_3, 0");

      //  check - playerWithdrawedTotal, Token
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("0")), "should playerWithdrawedTotal 0.15675 Token for CREATOR_0, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("0")), "should playerWithdrawedTotal 0 Token for CREATOR_1, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("0")), "should playerWithdrawedTotal 0 Token for OPPONENT_0, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_1
      })).cmp(new BN("0")), "should playerWithdrawedTotal 0.15675 Token for OPPONENT_1, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_2
      })).cmp(new BN("0")), "should playerWithdrawedTotal 0 Token for OPPONENT_2, 0");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_3
      })).cmp(new BN("0")), "should playerWithdrawedTotal 0 Token for OPPONENT_3, 0");
      //  ----------------------------------------------


      //  1 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 0.12 + 0.12 / 4 = 0.15
      //  OPPONENT_0: 0
      //  OPPONENT_1: 0.12 + 0.12 / 4 = 0.15
      //  OPPONENT_2: 0.12 + 0.12 / 4 = 0.15
      //  OPPONENT_3: 0.12 + 0.12 / 4 = 0.15


      //  2 - Token - finishTimeoutGame
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });
      //  CREATOR_0: 0
      //  OPPONENT_0: 100 + 100 / 4 = 125 Tokens
      //  OPPONENT_1: 100 + 100 / 4 = 125 Tokens
      //  OPPONENT_2: 100 + 100 / 4 = 125 Tokens
      //  OPPONENT_3: 100 + 100 / 4 = 125 Tokens


      //  3 - Token
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 1, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      //  CREATOR_1: 300 + 300 / 3 = 400 Tokens
      //  OPPONENT_0: 300 + 300 / 3 = 400 Tokens
      //  OPPONENT_1: 300 + 300 / 3 = 400 Tokens
      //  OPPONENT_2: 0 Tokens


      //  4 - Token
      await game.startGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 1, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 200 + 200 * 2 / 3 = 333 Tokens
      //  OPPONENT_0: 200 + 200 * 2 / 3 = 333 Tokens
      //  OPPONENT_1: 200 + 200 * 2 / 3 = 333 Tokens
      //  OPPONENT_2: 0 Tokens
      //  OPPONENT_3: 0 Tokens

      //  check - CREATOR_0, ETH
      let CREATOR_0_balance_before_4 = await balance.current(CREATOR_0, "wei");
      let tx_CREATOR_0_4 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      gasUsed = new BN(tx_CREATOR_0_4.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx_CREATOR_0_4.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      let CREATOR_0_balance_after_4 = await balance.current(CREATOR_0, "wei");
      assert.equal(0, CREATOR_0_balance_before_4.add(ether("0.1425")).sub(gasSpent).cmp(CREATOR_0_balance_after_4), "Wrong CREATOR_0_balance_after_4"); //  0.15 * 0.95 = 0.1425


      //  check - OPPONENT_0, ETH
      await expectRevert(game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      }), "No prize");

      //  check - OPPONENT_1, ETH
      let OPPONENT_1_balance_before_4 = await balance.current(OPPONENT_1, "wei");
      let tx_OPPONENT_1_4 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      });
      gasUsed = new BN(tx_OPPONENT_1_4.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx_OPPONENT_1_4.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      let OPPONENT_1_balance_after_4 = await balance.current(OPPONENT_1, "wei");
      assert.equal(0, OPPONENT_1_balance_before_4.add(ether("0.1425")).sub(gasSpent).cmp(OPPONENT_1_balance_after_4), "Wrong OPPONENT_1_balance_after_4"); //  0.15 * 0.95 = 0.1425

      //  check - OPPONENT_2, ETH
      let OPPONENT_2_balance_before_4 = await balance.current(OPPONENT_2, "wei");
      let tx_OPPONENT_2_4 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      });
      gasUsed = new BN(tx_OPPONENT_2_4.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx_OPPONENT_2_4.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      let OPPONENT_2_balance_after_4 = await balance.current(OPPONENT_2, "wei");
      assert.equal(0, OPPONENT_2_balance_before_4.add(ether("0.1425")).sub(gasSpent).cmp(OPPONENT_2_balance_after_4), "Wrong OPPONENT_2_balance_after_4"); //  0.15 * 0.95 = 0.1425

      //  check - OPPONENT_3, ETH
      let OPPONENT_3_balance_before_4 = await balance.current(OPPONENT_3, "wei");
      let tx_OPPONENT_3_4 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      });
      gasUsed = new BN(tx_OPPONENT_3_4.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx_OPPONENT_3_4.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      let OPPONENT_3_balance_after_4 = await balance.current(OPPONENT_3, "wei");
      assert.equal(0, OPPONENT_3_balance_before_4.add(ether("0.1425")).sub(gasSpent).cmp(OPPONENT_3_balance_after_4), "Wrong OPPONENT_3_balance_after_4"); //  0.15 * 0.95 = 0.1425


      //  check - CREATOR_0, Token
      let balance_token_before = await testToken.balanceOf(CREATOR_0);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: CREATOR_0
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });
      let balance_token_after = await testToken.balanceOf(CREATOR_0);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: CREATOR_0
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("319")).cmp(balance_token_after), "Wrong balance_token_after for CREATOR_0, 4"); //  333 * 0.96 = 319


      //  check - CREATOR_1, Token
      balance_token_before = await testToken.balanceOf(CREATOR_1);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: CREATOR_1
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_1
      });
      balance_token_after = await testToken.balanceOf(CREATOR_1);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: CREATOR_1
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("384")).cmp(balance_token_after), "Wrong balance_token_after for CREATOR_1, 4"); //  400 * 0.96 = 384


      //  check - OPPONENT_0, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_0);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_0
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_0);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("823")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_0, 4"); //  858 * 0.96 = 823


      //  check - OPPONENT_1, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_1);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_1
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_1);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_1
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("823")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_1, 4"); //  858 * 0.96 = 823


      //  check - OPPONENT_2, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_2);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_2
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_2
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_2);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_2
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("120")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_2, 4"); //  125 * 0.96 = 120


      //  check - OPPONENT_3, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_3);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_3
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_3
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_3);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_3
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("120")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_3, 4"); //  125 * 0.96 = 120

      //  check - PMCt
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_0)).cmp(ether("0.00315")), "should be 0.00315 PMCT for CREATOR_0, 4");
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_1)).cmp(ether("0")), "should be 0.15675 PMCT for CREATOR_1, 4");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_0)).cmp(ether("0")), "should be 0 PMCT for OPPONENT_0, 4");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_1)).cmp(ether("0")), "should be 0 PMCT for OPPONENT_1, 4");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_2)).cmp(ether("0")), "should be 0 PMCT for OPPONENT_2, 4");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_3)).cmp(ether("0")), "should be 0 PMCT for OPPONENT_3, 4");


      //  check - playerWithdrawedTotal, ETH
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(ether("0.29925")), "should playerWithdrawedTotal 0.29925 ETH for CREATOR_0, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(ether("0")), "should playerWithdrawedTotal 0 ETH for CREATOR_1, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).cmp(ether("0")), "should playerWithdrawedTotal 0 ETH for OPPONENT_0, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_1
      })).cmp(ether("0.29925")), "should playerWithdrawedTotal 0.29925 ETH for OPPONENT_1, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_2
      })).cmp(ether("0.1425")), "should playerWithdrawedTotal 0.1425 ETH for OPPONENT_2, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_3
      })).cmp(ether("0.1425")), "should playerWithdrawedTotal 0.1425 ETH for OPPONENT_3, 4");

      //  check - playerWithdrawedTotal, Token
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("319")), "should playerWithdrawedTotal 319 Token for CREATOR_0, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("384")), "should playerWithdrawedTotal 384 Token for CREATOR_1, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("823")), "should playerWithdrawedTotal 823 Token for OPPONENT_0, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_1
      })).cmp(new BN("823")), "should playerWithdrawedTotal 823 Token for OPPONENT_1, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_2
      })).cmp(new BN("120")), "should playerWithdrawedTotal 120 Token for OPPONENT_2, 4");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_3
      })).cmp(new BN("120")), "should playerWithdrawedTotal 120 Token for OPPONENT_3, 4");

      //  ------------------------------


      //  5 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      //  CREATOR_1: 0.12 + 0.12 * 2 / 3 = 0.2
      //  OPPONENT_0: 0
      //  OPPONENT_1: 0.12 + 0.12 * 2 / 3 = 0.2
      //  OPPONENT_2: 0
      //  OPPONENT_3: 0.12 + 0.12 * 2 / 3 = 0.2


      //  6 - ETH - finishTimeoutGame
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_0
      });
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });
      //  CREATOR_0: 0
      //  OPPONENT_0: 0.11 + 0.11 / 4 = 0.1375
      //  OPPONENT_1: 0.11 + 0.11 / 4 = 0.1375
      //  OPPONENT_2: 0.11 + 0.11 / 4 = 0.1375
      //  OPPONENT_3: 0.11 + 0.11 / 4 = 0.1375

      //  6.1 - ETH
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 0.12 + 0.12 * 2 / 3 = 0.2
      //  OPPONENT_0: 0
      //  OPPONENT_1: 0.11 + 0.11 * 2 / 3 = 0.2
      //  OPPONENT_2: 0
      //  OPPONENT_3: 0.11 + 0.11 * 2 / 3 = 0.2


      //  check - CREATOR_0, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: CREATOR_0
      // })).prize.toString());
      let eth_balance_before = await balance.current(CREATOR_0, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      let eth_balance_after = await balance.current(CREATOR_0, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.19")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for CREATOR_0, 5"); //  0.2 * 0.95 = 0.19

      //  check - CREATOR_1, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: CREATOR_1
      // })).prize.toString());
      eth_balance_before = await balance.current(CREATOR_1, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(CREATOR_1, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.19")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for CREATOR_1, 5"); //  0.2 * 0.95 = 0.19


      //  check - OPPONENT_0, ETH
      eth_balance_before = await balance.current(OPPONENT_0, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_0, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.130625")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_0, 5"); //  0.1375 * 0.95 = 0.130625


      //  check - OPPONENT_1, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_1, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_1, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.510625")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_1, 5"); //  0.5375 * 0.95 = 0.510625


      //  check - OPPONENT_2, ETH
      eth_balance_before = await balance.current(OPPONENT_2, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_2, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.130625")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_2, 5"); //  0.1375 * 0.95 = 0.130625


      //  check - OPPONENT_3, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_3, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_3, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.510625")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_3, 5"); //  0.5375 * 0.95 = 0.510625

      //  check - PMCt
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_0)).cmp(ether("0.00515")), "should be 0.0055 PMCT for CREATOR_0, 5");
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_1)).cmp(ether("0.002")), "should be 0.002 PMCT for CREATOR_1, 5");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_0)).cmp(ether("0.001375")), "should be 0.001375 PMCT for OPPONENT_0, 5");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_1)).cmp(ether("0.001375")), "should be 0.001375 PMCT for OPPONENT_1, 5");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_2)).cmp(ether("0.001375")), "should be 0.001375 PMCT for OPPONENT_2, 5");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_3)).cmp(ether("0.001375")), "should be 0.001375 PMCT for OPPONENT_3, 5");

      //  check - playerWithdrawedTotal, ETH
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(ether("0.48925")), "should playerWithdrawedTotal 0.48925 ETH for CREATOR_0, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(ether("0.19")), "should playerWithdrawedTotal 0.19 ETH for CREATOR_1, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).cmp(ether("0.130625")), "should playerWithdrawedTotal 0.130625 ETH for OPPONENT_0, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_1
      })).cmp(ether("0.809875")), "should playerWithdrawedTotal 0.809875 ETH for OPPONENT_1, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_2
      })).cmp(ether("0.273125")), "should playerWithdrawedTotal 0.273125 ETH for OPPONENT_2, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_3
      })).cmp(ether("0.653125")), "should playerWithdrawedTotal 0.653125 ETH for OPPONENT_3, 5");

      //  check - playerWithdrawedTotal, Token
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("319")), "should playerWithdrawedTotal 319 Token for CREATOR_0, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("384")), "should playerWithdrawedTotal 384 Token for CREATOR_1, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("823")), "should playerWithdrawedTotal 823 Token for OPPONENT_0, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_1
      })).cmp(new BN("823")), "should playerWithdrawedTotal 823 Token for OPPONENT_1, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_2
      })).cmp(new BN("120")), "should playerWithdrawedTotal 120 Token for OPPONENT_2, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_3
      })).cmp(new BN("120")), "should playerWithdrawedTotal 120 Token for OPPONENT_3, 5");

      //  -------------------------------


      //  7 - ETH - finishTimeoutGame
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });
      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });
      //  CREATOR_1: 0
      //  OPPONENT_0: 0.12 + 0.12 / 3 = 0.16
      //  OPPONENT_2: 0.12 + 0.12 / 3 = 0.16
      //  OPPONENT_3: 0.12 + 0.12 / 3 = 0.16


      //  8 - ETH
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_0
      });
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 0.11 + 0.11 * 3 / 2 = 0.275
      //  OPPONENT_0: 0
      //  OPPONENT_1: 0
      //  OPPONENT_2: 0
      //  OPPONENT_3: 0.11 + 0.11 * 3 / 2 = 0.275


      //  9 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: ether("0.2")
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: ether("0.2")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: ether("0.2")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: ether("0.2")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: ether("0.2")
      });
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 0.2 + 0.2 / 4 = 0.25
      //  OPPONENT_0: 0
      //  OPPONENT_1: 0.2 + 0.2 / 4 = 0.25
      //  OPPONENT_2: 0.2 + 0.2 / 4 = 0.25
      //  OPPONENT_3: 0.2 + 0.2 / 4 = 0.25


      //  10 - Token
      await game.startGame(testToken.address, 150, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 150, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 150, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 1, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      //  CREATOR_1: 150 + 150 * 2 / 3 = 250 Tokens
      //  OPPONENT_0: 150 + 150 * 2 / 3 = 250 Tokens
      //  OPPONENT_1: 150 + 150 * 2 / 3 = 250 Tokens
      //  OPPONENT_2: 0 Tokens
      //  OPPONENT_3: 0 Tokens


      //  check - CREATOR_0, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: CREATOR_0
      // })).prize.toString());
      eth_balance_before = await balance.current(CREATOR_0, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(CREATOR_0, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.49875")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for CREATOR_0, 7"); //  0.525 * 0.95 = 0.49875


      // check - CREATOR_1, ETH
      await expectRevert(game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }), "No prize");


      // check - OPPONENT_0, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_0, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_0, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.152")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_0, 7"); //  0.16 * 0.95 = 0.152


      // check - OPPONENT_1, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT_1
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_1, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_1, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.2375")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_1, 7"); //  0.25 * 0.95 = 0.2375


      // check - OPPONENT_2, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT_2
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_2, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_2, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.3895")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_2, 7"); //  0.41 * 0.95 = 0.3895


      // check - OPPONENT_3, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT_3
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_3, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_3, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.65075")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_3, 7"); //  0.685 * 0.95 = 0.65075




      //  CREATOR_1: 150 + 150 * 2 / 3 = 250 Tokens
      //  OPPONENT_0: 150 + 150 * 2 / 3 = 250 Tokens
      //  OPPONENT_1: 150 + 150 * 2 / 3 = 250 Tokens
      //  OPPONENT_2: 0 Tokens
      //  OPPONENT_3: 0 Tokens

      //  check - CREATOR_0, Token
      await expectRevert(game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }), "No prize");


      //  check - CREATOR_1, Token
      balance_token_before = await testToken.balanceOf(CREATOR_1);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: CREATOR_1
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_1
      });
      balance_token_after = await testToken.balanceOf(CREATOR_1);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: CREATOR_1
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("240")).cmp(balance_token_after), "Wrong balance_token_after for CREATOR_1, 7"); //  250 * 0.96 = 240


      //  check - OPPONENT_0, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_0);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_0
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_0);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("240")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_0, 7"); //  250 * 0.96 = 240


      //  check - OPPONENT_1, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_1);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_1
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_1);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_1
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("240")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_1, 7"); //  250 * 0.96 = 240


      //  check - OPPONENT_2, Token
      await expectRevert(game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_2
      }), "No prize");


      //  check - OPPONENT_3, Token
      await expectRevert(game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_3
      }), "No prize");

      //  check - PMCt
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_0)).cmp(ether("0.0104")), "should be 0.0104 PMCT for CREATOR_0, 7");
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_1)).cmp(ether("0.002")), "should be 0.002 PMCT for CREATOR_1, 7");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_0)).cmp(ether("0.002975")), "should be 0.002975 PMCT for OPPONENT_0, 7");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_1)).cmp(ether("0.001375")), "should be 0.001375 PMCT for OPPONENT_1, 7");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_2)).cmp(ether("0.002975")), "should be 0.002975 PMCT for OPPONENT_2, 7");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_3)).cmp(ether("0.002975")), "should be 0.002975 PMCT for OPPONENT_3, 7");


      //  check - playerWithdrawedTotal, ETH
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(ether("0.988")), "should playerWithdrawedTotal 0.988 ETH for CREATOR_0, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(ether("0.19")), "should playerWithdrawedTotal 0.19 ETH for CREATOR_1, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).cmp(ether("0.282625")), "should playerWithdrawedTotal 0.282625 ETH for OPPONENT_0, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_1
      })).cmp(ether("1.047375")), "should playerWithdrawedTotal 1.047375 ETH for OPPONENT_1, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_2
      })).cmp(ether("0.662625")), "should playerWithdrawedTotal 0.662625 ETH for OPPONENT_2, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_3
      })).cmp(ether("1.303875")), "should playerWithdrawedTotal 1.303875 ETH for OPPONENT_3, 5");

      //  check - playerWithdrawedTotal, Token
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("319")), "should playerWithdrawedTotal 319 Token for CREATOR_0, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("624")), "should playerWithdrawedTotal 624 Token for CREATOR_1, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("1063")), "should playerWithdrawedTotal 1063 Token for OPPONENT_0, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_1
      })).cmp(new BN("1063")), "should playerWithdrawedTotal 1063 Token for OPPONENT_1, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_2
      })).cmp(new BN("120")), "should playerWithdrawedTotal 120 Token for OPPONENT_2, 5");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_3
      })).cmp(new BN("120")), "should playerWithdrawedTotal 120 Token for OPPONENT_3, 5");

      //  -----------------------------------------------------------------


      //  11 - Token
      await game.startGame(testToken.address, 150, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 150, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 1, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 150 + 150 / 4 = 187 Tokens
      //  OPPONENT_0: 150 + 150 / 4 = 187 Tokens
      //  OPPONENT_1: 150 + 150 / 4 = 187 Tokens
      //  OPPONENT_2: 150 + 150 / 4 = 187 Tokens
      //  OPPONENT_3: 0 Tokens


      //  12 - Token
      await game.startGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 1, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 300 + 300 * 3 / 2 = 750 Tokens
      //  OPPONENT_0: 0 Tokens
      //  OPPONENT_1: 0 Tokens
      //  OPPONENT_2: 300 + 300 * 3 / 2 = 750 Tokens
      //  OPPONENT_3: 0 Tokens


      //  13 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: ether("0.21")
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: ether("0.21")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: ether("0.21")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: ether("0.21")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: ether("0.21")
      });
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 0.21 + 0.21 * 2 / 3 = 0.35
      //  OPPONENT_0: 0
      //  OPPONENT_1: 0
      //  OPPONENT_2: 0.21 + 0.21 * 2 / 3 = 0.35
      //  OPPONENT_3: 0.21 + 0.21 * 2 / 3 = 0.35


      //  14 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: BET_ETH_1
      });
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      //  CREATOR_1: 0.12 + 0.12 * 2 / 3 = 0.2
      //  OPPONENT_0: 0.12 + 0.12 * 2 / 3 = 0.2
      //  OPPONENT_1: 0
      //  OPPONENT_2: 0.12 + 0.12 * 2 / 3 = 0.2
      //  OPPONENT_3: 0


      //  check - CREATOR_0, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: CREATOR_0
      // })).prize.toString());
      eth_balance_before = await balance.current(CREATOR_0, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(CREATOR_0, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.3325")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for CREATOR_0, 14"); //  0.35 * 0.95 = 0.3325


      // check - CREATOR_1, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: CREATOR_1
      // })).prize.toString());
      eth_balance_before = await balance.current(CREATOR_1, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(CREATOR_1, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.19")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for CREATOR_1, 14"); //  0.2 * 0.95 = 0.19


      // check - OPPONENT_0, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: CREATOR_1
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_0, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_0
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_0, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.19")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_0, 14"); //  0.2 * 0.95 = 0.19


      // check - OPPONENT_1, ETH
      await expectRevert(game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }), "No prize");


      // check - OPPONENT_2, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT_2
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_2, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_2
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_2, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.5225")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_2, 14"); //  0.55 * 0.95 = 0.5225


      // check - OPPONENT_3, ETH
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT_3
      // })).prize.toString());
      eth_balance_before = await balance.current(OPPONENT_3, "wei");
      // console.log(eth_balance_before.toString());
      tx = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_3
      });
      gasUsed = new BN(tx.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      eth_balance_after = await balance.current(OPPONENT_3, "wei");
      // console.log(eth_balance_after.toString());
      assert.equal(0, eth_balance_before.add(ether("0.3325")).sub(gasSpent).cmp(eth_balance_after), "Wrong eth_balance_after for OPPONENT_3, 14"); //  0.35 * 0.95 = 0.3325


      //  check - CREATOR_0, Token
      balance_token_before = await testToken.balanceOf(CREATOR_0);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: CREATOR_1
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });
      balance_token_after = await testToken.balanceOf(CREATOR_0);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: CREATOR_0
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("899")).cmp(balance_token_after), "Wrong balance_token_after for CREATOR_0, 14"); //  937 * 0.96 = 899


      //  check - CREATOR_1, Token
      await expectRevert(game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_1
      }), "No prize");


      //  check - OPPONENT_0, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_0);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_0
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_0);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_0
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("179")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_0, 14"); //  187 * 0.96 = 179


      //  check - OPPONENT_1, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_1);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_1
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_1);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_1
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("179")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_1, 14"); //  187 * 0.96 = 179


      //  check - OPPONENT_2, Token
      balance_token_before = await testToken.balanceOf(OPPONENT_2);
      // console.log(balance_token_before.toString());
      // console.log("before:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_2
      // })).prize.toString());
      await game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_2
      });
      balance_token_after = await testToken.balanceOf(OPPONENT_2);
      // console.log(balance_token_after.toString());
      // console.log("after:", (await game.pendingPrizeToWithdraw.call(testToken.address, 0, {
      //   from: OPPONENT_2
      // })).prize.toString());
      assert.equal(0, balance_token_before.add(new BN("899")).cmp(balance_token_after), "Wrong balance_token_after for OPPONENT_2, 14"); //  937 * 0.96 = 899


      //  check - OPPONENT_3, Token
      await expectRevert(game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_3
      }), "No prize");


      //  check - PMCT
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_0)).cmp(ether("0.0139")), "should be 0.0139 PMCT for CREATOR_0, 14");
      assert.equal(0, (await pmct.balanceOf.call(CREATOR_1)).cmp(ether("0.004")), "should be 0.004 PMCT for CREATOR_1, 14");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_0)).cmp(ether("0.002975")), "should be 0.002975 PMCT for OPPONENT_0, 14");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_1)).cmp(ether("0.001375")), "should be 0.001375 PMCT for OPPONENT_1, 14");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_2)).cmp(ether("0.002975")), "should be 0.002975 PMCT for OPPONENT_2, 14");
      assert.equal(0, (await pmct.balanceOf.call(OPPONENT_3)).cmp(ether("0.002975")), "should be 0.002975 PMCT for OPPONENT_3, 14");


      // check - playerWithdrawedTotal, ETH
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(ether("1.3205")), "should playerWithdrawedTotal 1.3205 ETH for CREATOR_0, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(ether("0.38")), "should playerWithdrawedTotal 0.38 ETH for CREATOR_1, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_0
      })).cmp(ether("0.472625")), "should playerWithdrawedTotal 0.472625 ETH for OPPONENT_0, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_1
      })).cmp(ether("1.047375")), "should playerWithdrawedTotal 1.047375 ETH for OPPONENT_1, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_2
      })).cmp(ether("1.185125")), "should playerWithdrawedTotal 1.185125 ETH for OPPONENT_2, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_3
      })).cmp(ether("1.636375")), "should playerWithdrawedTotal 1.636375 ETH for OPPONENT_3, 14");

      //  check - playerWithdrawedTotal, Token
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("1218")), "should playerWithdrawedTotal 1218 Token for CREATOR_0, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("624")), "should playerWithdrawedTotal 624 Token for CREATOR_1, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_0
      })).cmp(new BN("1242")), "should playerWithdrawedTotal 1242 Token for OPPONENT_0, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_1
      })).cmp(new BN("1242")), "should playerWithdrawedTotal 1242 Token for OPPONENT_1, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_2
      })).cmp(new BN("1019")), "should playerWithdrawedTotal 1019 Token for OPPONENT_2, 14");
      assert.equal(0, (await game.getPlayerWithdrawedTotal.call(testToken.address, {
        from: OPPONENT_3
      })).cmp(new BN("120")), "should playerWithdrawedTotal 120 Token for OPPONENT_3, 14");
    });

    it("should withdraw correct amount if no staking, ETH only", async function () {
      //  add partner
      await game.updatePartner(OTHER);

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
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  check - CREATOR_0
      let CREATOR_0_balance_before_0 = await balance.current(CREATOR_0, "wei");
      let tx_CREATOR_0_0 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      let gasUsed = new BN(tx_CREATOR_0_0.receipt.gasUsed);
      let txInfo = await web3.eth.getTransaction(tx_CREATOR_0_0.tx);
      let gasPrice = new BN(txInfo.gasPrice);
      let gasSpent = gasUsed.mul(gasPrice);

      let CREATOR_0_balance_after_0 = await balance.current(CREATOR_0, "wei");
      assert.equal(0, CREATOR_0_balance_before_0.add(ether("0.1584")).sub(gasSpent).cmp(CREATOR_0_balance_after_0), "Wrong CREATOR_0_balance_after_0"); //  0.11 + 0.11 / 2 = 0.165 * 0.96 = 0.1584
    });

    it("should withdraw correct amount if no partner", async function () {
      //  add staking
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

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
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  check - CREATOR_0
      let CREATOR_0_balance_before_0 = await balance.current(CREATOR_0, "wei");
      let tx_CREATOR_0_0 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      let gasUsed = new BN(tx_CREATOR_0_0.receipt.gasUsed);
      let txInfo = await web3.eth.getTransaction(tx_CREATOR_0_0.tx);
      let gasPrice = new BN(txInfo.gasPrice);
      let gasSpent = gasUsed.mul(gasPrice);

      let CREATOR_0_balance_after_0 = await balance.current(CREATOR_0, "wei");
      assert.equal(0, CREATOR_0_balance_before_0.add(ether("0.1584")).sub(gasSpent).cmp(CREATOR_0_balance_after_0), "Wrong CREATOR_0_balance_after_0"); //  0.11 + 0.11 / 2 = 0.165 * 0.97 = 0.1584
    });

    it("should emit CF_PrizeWithdrawn with correct params", async function () {
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
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  check - CREATOR_0
      const {
        logs
      } = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      await expectEvent.inLogs(logs, 'CF_PrizeWithdrawn', {
        token: constants.ZERO_ADDRESS,
        player: CREATOR_0,
        prize: ether("0.16005"),
        pmct: ether("0.00165")
      });
    });
  });

  describe("withdrawPendingPrizes ETH & Token combined, _maxLoop = manual", function () {
    let testToken;

    beforeEach("setup Token", async function () {
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

    it("withdrawPendingPrizes ETH & Token combined, _maxLoop = manual", async function () {
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
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 0.11 + 0.11 / 2 = 0.165 * 0.97 = 0.16005

      //  1 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_0
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_0
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 0.11 + 0.11 / 2 = 0.165 * 0.97 = 0.16005

      //  2 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1,
        value: BET_ETH_1
      });

      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });
      //  CREATOR_0: 0.12 + 0.12 / 2 = 0.18 * 0.97 = 0.1746


      //  3 - Token
      await game.startGame(testToken.address, 150, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 150, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 150, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 1, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 150 + 150 / 4 = 187 * 0.97 = 181


      //  4 - Token
      await game.startGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2
      });
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3
      });
      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 1, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 200 + 200 / 4 = 250 * 0.97 = 242


      //  5 - ETH
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: ether("0.21")
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: ether("0.21")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
        from: OPPONENT_1,
        value: ether("0.21")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_2, {
        from: OPPONENT_2,
        value: ether("0.21")
      });
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_3, {
        from: OPPONENT_3,
        value: ether("0.21")
      });
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      //  CREATOR_0: 0.21 + 0.21 * 2 / 3 = 0.35 * 0.97 = 0.3395

      //  ETH

      //  check - CREATOR_0: 2 / 4
      let pmct_before = await pmct.balanceOf.call(CREATOR_0);
      let CREATOR_0_balance_before_0 = await balance.current(CREATOR_0, "wei");
      let tx_CREATOR_0_0 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 2, {
        from: CREATOR_0
      });
      let gasUsed = new BN(tx_CREATOR_0_0.receipt.gasUsed);
      let txInfo = await web3.eth.getTransaction(tx_CREATOR_0_0.tx);
      let gasPrice = new BN(txInfo.gasPrice);
      let gasSpent = gasUsed.mul(gasPrice);

      let CREATOR_0_balance_after_0 = await balance.current(CREATOR_0, "wei");
      assert.equal(0, CREATOR_0_balance_before_0.add(ether("0.5141")).sub(gasSpent).cmp(CREATOR_0_balance_after_0), "Wrong CREATOR_0_balance_after_0");

      let pmct_after = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_after.sub(pmct_before).cmp(ether("0.0035")), "Wrong pmct after 0");


      //  check - CREATOR_0: single 3 / 4
      pmct_before = await pmct.balanceOf.call(CREATOR_0);

      let CREATOR_0_balance_before_1 = await balance.current(CREATOR_0, "wei");
      let tx_CREATOR_0_1 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 1, {
        from: CREATOR_0
      });
      gasUsed = new BN(tx_CREATOR_0_1.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx_CREATOR_0_1.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      let CREATOR_0_balance_after_1 = await balance.current(CREATOR_0, "wei");
      assert.equal(0, CREATOR_0_balance_before_1.add(ether("0.16005")).sub(gasSpent).cmp(CREATOR_0_balance_after_1), "Wrong CREATOR_0_balance_after_1");

      pmct_after = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_after.sub(pmct_before).cmp(ether("0.00165")), "Wrong pmct after 1");


      //  check - CREATOR_0: single 4 / 4
      pmct_before = await pmct.balanceOf.call(CREATOR_0);

      let CREATOR_0_balance_before_2 = await balance.current(CREATOR_0, "wei");
      let tx_CREATOR_0_2 = await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      });
      gasUsed = new BN(tx_CREATOR_0_2.receipt.gasUsed);
      txInfo = await web3.eth.getTransaction(tx_CREATOR_0_2.tx);
      gasPrice = new BN(txInfo.gasPrice);
      gasSpent = gasUsed.mul(gasPrice);

      let CREATOR_0_balance_after_2 = await balance.current(CREATOR_0, "wei");
      assert.equal(0, CREATOR_0_balance_before_2.add(ether("0.16005")).sub(gasSpent).cmp(CREATOR_0_balance_after_2), "Wrong CREATOR_0_balance_after_2");

      pmct_after = await pmct.balanceOf.call(CREATOR_0);
      assert.equal(0, pmct_after.sub(pmct_before).cmp(ether("0.00165")), "Wrong pmct after 2");


      //  Tokens

      //  check - CREATOR_0: 1 / 2 for Token
      CREATOR_0_balance_before_0 = await testToken.balanceOf(CREATOR_0);
      await game.withdrawPendingPrizes(testToken.address, 1, {
        from: CREATOR_0
      });

      CREATOR_0_balance_after_0 = await testToken.balanceOf(CREATOR_0);
      assert.equal(0, CREATOR_0_balance_before_0.add(new BN("242")).cmp(CREATOR_0_balance_after_0), "Wrong CREATOR_0_balance_after_0 for Token");


      //  check - CREATOR_0: single 2 / 2 for Token
      CREATOR_0_balance_before_1 = await testToken.balanceOf(CREATOR_0);
      await game.withdrawPendingPrizes(testToken.address, 1, {
        from: CREATOR_0
      });

      CREATOR_0_balance_after_1 = await testToken.balanceOf(CREATOR_0);
      assert.equal(0, CREATOR_0_balance_before_1.add(new BN("181")).cmp(CREATOR_0_balance_after_1), "Wrong CREATOR_0_balance_after_1");
    });
  });

  describe("gamesFinished", function () {
    it("should increase gamesFinished for ETH", async function () {
      //  0
      let startAt_0 = await time.latest();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_0
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(constants.ZERO_ADDRESS, 0, web3.utils.soliditySha3(2, CREATOR_SEED_HASH), CREATOR_REFERRAL_0, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      assert.equal(0, (await game.gamesFinished.call(constants.ZERO_ADDRESS)).cmp(new BN(1)), "should be 1");

      //  1
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1.add(BET_ETH_0)
      });

      await time.increase(time.duration.minutes(2));
      await game.playGame(constants.ZERO_ADDRESS, 2, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      assert.equal(0, (await game.gamesFinished.call(constants.ZERO_ADDRESS)).cmp(new BN(2)), "should be 2");
    });

    it("should increase gamesFinished for Token", async function () {
      testToken = await TestToken.new();

      testToken.transfer(CREATOR_0, 10000);
      testToken.transfer(CREATOR_1, 10000);
      testToken.transfer(OPPONENT_0, 10000);

      await testToken.approve(game.address, 10000, {
        from: CREATOR_0
      });
      await testToken.approve(game.address, 10000, {
        from: CREATOR_1
      });
      await testToken.approve(game.address, 10000, {
        from: OPPONENT_0
      });

      await game.updateGovernanceContract(OWNER);
      await game.updateGameAddTokenSupported(testToken.address)

      //  0
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await time.increase(time.duration.days(2));
      await game.finishTimeoutGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1
      });

      assert.equal(0, (await game.gamesFinished.call(testToken.address)).cmp(new BN(1)), "should be 1");

      //  1
      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      await time.increase(time.duration.minutes(2));
      await game.playGame(testToken.address, 1, CREATOR_SEED_HASH, {
        from: CREATOR_1
      });

      assert.equal(0, (await game.gamesFinished.call(testToken.address)).cmp(new BN(2)), "should be 2");
    });
  });
});