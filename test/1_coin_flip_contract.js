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
  });
});