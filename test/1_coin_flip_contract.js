const CoinFlipContract = artifacts.require("PMCCoinFlipContract");
const Governance = artifacts.require("PMCGovernance");
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

contract("CoinFlipContract", function (accounts) {
  const OWNER = accounts[0];
  const OTHER = accounts[1];

  const CREATOR = accounts[2];
  const CREATOR_REFERRAL = accounts[3];
  const CREATOR_1 = accounts[4];
  const CREATOR_1_REFERRAL = accounts[5];
  const OPPONENT = accounts[6];
  const OPPONENT_REFERRAL = accounts[7];
  const OPPONENT_1 = accounts[8];
  const OPPONENT_1_REFERRAL = accounts[9];

  const BET_TOKEN_MIN = new BN("100");
  const BET_TOKEN = new BN("111");
  const BET_TOKEN_1 = new BN("222");
  const BET_TOKEN_2 = new BN("333");

  const BET_ETH_MIN = ether("0.01");
  const BET_ETH = ether("0.11");
  const BET_ETH_1 = ether("0.12");
  const BET_ETH_2 = ether("0.13");

  const CREATOR_COIN_SIDE = 1;
  const CREATOR_SEED = "Hello World";

  let pmct;
  let game;
  let governance;
  let creatorHash;
  let testToken;
  let initialGameStartBlock;

  before("IMPORTANT", function () {
    console.log("IMPORTANT: before unit testing do the following: MIN_VOTERS_TO_ACCEPT_PROPOSAL = 2");
  });

  beforeEach("setup", async function () {
    pmct = await PMCt.new();
    game = await CoinFlipContract.new(pmct.address);
    await pmct.addMinter(game.address);
    governance = await Governance.new(pmct.address, game.address);
    await game.updateGovernanceContract(governance.address);

    creatorHash = web3.utils.soliditySha3(CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED));

    await time.advanceBlock();

    testToken = await TestToken.new();
    await testToken.transfer(CREATOR, ether("1000"));
    await testToken.transfer(CREATOR_1, ether("1000"));
    await testToken.transfer(OPPONENT, ether("1000"));
    await testToken.transfer(OPPONENT_1, ether("1000"));

    await time.advanceBlock();

    //  play first game to get PMCt tokens to add new ERC-20 token
    await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL, {
      from: CREATOR,
      value: BET_ETH
    });
    initialGameStartBlock = await time.latestBlock();
    await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
      from: OPPONENT,
      value: BET_ETH
    });
    await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
      from: CREATOR
    });
    await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
      from: CREATOR
    });

    assert.equal(0, (await pmct.balanceOf(CREATOR)).cmp(ether("0.011")), "Wrong pmct balane for CREATOR after first game");
    pmct.transfer(OPPONENT, ether("0.005"), {
      from: CREATOR
    });
    assert.equal(0, (await pmct.balanceOf(CREATOR)).cmp(ether("0.006")), "Wrong pmct balane for CREATOR after transfer");
    assert.equal(0, (await pmct.balanceOf(OPPONENT)).cmp(ether("0.005")), "Wrong pmct balane for OPPONENT after transfer");

    //  add testToken for betting
    await pmct.approve(governance.address, ether("0.1"), {
      from: CREATOR
    });
    await governance.addProposal(2, testToken.address, 0, ether("0.002"), {
      from: CREATOR
    });

    await pmct.approve(governance.address, ether("0.1"), {
      from: OPPONENT
    });
    await governance.addProposal(2, testToken.address, 0, ether("0.002"), {
      from: OPPONENT
    });
    assert.isTrue(await game.isTokenSupportedToPrediction.call(testToken.address), "TestToken should be supported to prediction");

    await time.advanceBlock();
  });

  describe("startGame", function () {
    it("should fail if Wrong Token address", async function () {
      await expectRevert(game.startGame(OTHER, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      }), "Wrong token");
    });

    it("should fail if Token & msg.value > 0", async function () {
      await expectRevert(game.startGame(pmct.address, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR,
        value: BET_ETH
      }), "Wrong value");
    });

    it("should fail if Token & _tokens < MIN_TOKENS_TO_BET", async function () {
      let tokens = BET_TOKEN_MIN.sub(new BN("10"));
      await expectRevert(game.startGame(pmct.address, tokens, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR,
      }), "Wrong tokens prediction");
    });

    it("should fail if Token & failed to transferFrom", async function () {
      await expectRevert(game.startGame(pmct.address, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR,
      }), "ERC20: transfer amount exceeds allowance");
    });

    it("should fail if ETH & msg.value < gameMinPrediction", async function () {
      await expectRevert(game.startGame(constants.ZERO_ADDRESS, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      }), "Wrong ETH prediction");

      let wrongEthPrediction = BET_ETH_MIN.div(new BN("2"));
      await expectRevert(game.startGame(constants.ZERO_ADDRESS, wrongEthPrediction, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      }), "Wrong ETH prediction");
    });

    it("should fail if Empty hash", async function () {
      await expectRevert(game.startGame(constants.ZERO_ADDRESS, BET_TOKEN, "0x0", CREATOR_REFERRAL, {
        from: CREATOR,
        value: BET_ETH
      }), "Empty hash");
    });

    it("should fail if Game is running", async function () {
      await game.startGame(constants.ZERO_ADDRESS, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR,
        value: BET_ETH
      });

      await expectRevert(game.startGame(constants.ZERO_ADDRESS, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR,
        value: BET_ETH
      }), "Game is running");


      await expectRevert(game.startGame(constants.ZERO_ADDRESS, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      }), "Game is running");
    });

    it("should add game with correct params in games for ETH", async function () {
      //  0
      let game_0 = await game.gameInfo(constants.ZERO_ADDRESS, 0);
      assert.isFalse(game_0.running, "should be running");
      assert.equal(game_0.creatorCoinSide, "0x0000000000000000000000000000000000000000000000000000000000000001", "Wrong creatorHash");
      assert.equal(game_0.creator, CREATOR, "wrong creator");
      assert.equal(0, game_0.idx.cmp(new BN("0")), "wrong idx for 0");
      assert.equal(0, game_0.prediction.cmp(BET_ETH), "wrong prediction for 0");
      assert.equal(0, game_0.startBlock.cmp(initialGameStartBlock), "wrong startBlock for 0");
      assert.equal(0, game_0.heads.cmp(new BN("1")), "wrong heads for 0");
      assert.equal(0, game_0.tails.cmp(new BN("1")), "wrong tails for 0");
      assert.equal(0, game_0.creatorPrize.cmp(ether("0.22")), "wrong creatorPrize for 0");
      assert.equal(0, game_0.opponentPrize.cmp(ether("0.22")), "wrong opponentPrize for 0");

      // let game_0_opponent = await game.gameInfoForOpponent(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT
      // });
      // // assert.equal(0, (game_0_opponent.opponentCoinSide).cmp(new BN("2")), "Wrong opponentCoinSide for 0");
      // // assert.equal(game_0.referral, OPPONENT_REFERRAL, "wrong referral for 0");
      // console.log((game_0_opponent.opponentCoinSide).toString());
      // console.log(await game.getReferralInGame(constants.ZERO_ADDRESS, 0, {
      //   from: OPPONENT
      // }));


      //  2
      await time.advanceBlock();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      let game_1 = await game.gameInfo(constants.ZERO_ADDRESS, 1);
      assert.isTrue(game_1.running, "should be running for 1");
      assert.equal(game_1.creatorCoinSide, creatorHash, "Wrong creatorHash for 1");
      assert.equal(game_1.creator, CREATOR_1, "wrong creator for 1");
      assert.equal(0, game_1.idx.cmp(new BN("1")), "wrong idx for 1");
      assert.equal(0, game_1.prediction.cmp(BET_ETH_1), "wrong prediction for 1");
      assert.equal(0, game_1.startBlock.cmp(await time.latestBlock()), "wrong startBlock for 1");
      assert.equal(0, game_1.heads.cmp(new BN("0")), "wrong heads for 1");
      assert.equal(0, game_1.tails.cmp(new BN("0")), "wrong tails for 1");
      assert.equal(0, game_1.creatorPrize.cmp(new BN("0")), "wrong creatorPrize for 1");
      assert.equal(0, game_1.opponentPrize.cmp(new BN("0")), "wrong opponentPrize for 1");
    });

    it("should add game with correct params in games for Token", async function () {
      //  0
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR
      });
      await testToken.approve(game.address, ether("0.1"), {
        from: OPPONENT
      });

      await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      });
      let game_0 = await game.gameInfo(testToken.address, 0);
      assert.isTrue(game_0.running, "should be running");
      assert.equal(game_0.creatorCoinSide, creatorHash, "Wrong creatorHash for 1");
      assert.equal(game_0.creator, CREATOR, "wrong creator for 0");
      assert.equal(0, game_0.idx.cmp(new BN("0")), "wrong idx for 0");
      assert.equal(0, game_0.prediction.cmp(BET_TOKEN), "wrong prediction for 0");
      assert.equal(0, game_0.startBlock.cmp(await time.latestBlock()), "wrong startBlock for 0");
      assert.equal(0, game_0.heads.cmp(new BN("0")), "wrong heads for 0");
      assert.equal(0, game_0.tails.cmp(new BN("0")), "wrong tails for 0");
      assert.equal(0, game_0.creatorPrize.cmp(new BN("0")), "wrong creatorPrize for 0");
      assert.equal(0, game_0.opponentPrize.cmp(new BN("0")), "wrong opponentPrize for 0");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });
      await time.advanceBlock();

      //  1
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR_1
      });
      await testToken.approve(game.address, ether("0.1"), {
        from: OPPONENT_1
      });

      await game.startGame(testToken.address, BET_TOKEN_1, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1
      });
      let game_1 = await game.gameInfo(testToken.address, 1);
      assert.isTrue(game_1.running, "should be running for 1");
      assert.equal(game_1.creatorCoinSide, creatorHash, "Wrong creatorHash for 1");
      assert.equal(game_1.creator, CREATOR_1, "wrong creator for 1");
      assert.equal(0, game_1.idx.cmp(new BN("1")), "wrong idx for 1");
      assert.equal(0, game_1.prediction.cmp(BET_TOKEN_1), "wrong prediction for 1");
      assert.equal(0, game_1.startBlock.cmp(await time.latestBlock()), "wrong startBlock for 1");
      assert.equal(0, game_1.heads.cmp(new BN("0")), "wrong heads for 1");
      assert.equal(0, game_1.tails.cmp(new BN("0")), "wrong tails for 1");
      assert.equal(0, game_1.creatorPrize.cmp(new BN("0")), "wrong creatorPrize for 1");
      assert.equal(0, game_1.opponentPrize.cmp(new BN("0")), "wrong opponentPrize for 1");
    });

    it("should set correct referralInGame for ETH", async function () {
      //`0
      assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 0, {
        from: CREATOR
      }), CREATOR_REFERRAL, "Wrong CREATOR referral for 0");

      //`1
      await time.advanceBlock();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 1, {
        from: CREATOR_1
      }), CREATOR_1_REFERRAL, "Wrong CREATOR referral for 1");
    });

    it("should set correct referralInGame for Token", async function () {
      //  0
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR
      });
      await testToken.approve(game.address, ether("0.1"), {
        from: OPPONENT
      });

      await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: CREATOR
      }), CREATOR_REFERRAL, "Wrong CREATOR referral for 0");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });
      await time.advanceBlock();

      //  1
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR_1
      });
      await testToken.approve(game.address, ether("0.1"), {
        from: OPPONENT_1
      });

      await game.startGame(testToken.address, BET_TOKEN_1, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 1, {
        from: CREATOR_1
      }), CREATOR_1_REFERRAL, "Wrong CREATOR referral for 1");
    });

    it("should add game to gamesParticipatedToCheckPrize for ETH", async function () {
      //`0
      await time.advanceBlock();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).length, 1, "Wrong gamesParticipatedToCheckPrize length for 0");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      }))[0].cmp(new BN("1")), "Wrong gamesParticipatedToCheckPrize idx for 0");

      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR_1
      });

      //`1
      await time.advanceBlock();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).length, 2, "Wrong gamesParticipatedToCheckPrize length for 1");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      }))[0].cmp(new BN("1")), "Wrong gamesParticipatedToCheckPrize idx for 1");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      }))[1].cmp(new BN("2")), "Wrong gamesParticipatedToCheckPrize idx for 1");
    });

    it("should add game to gamesParticipatedToCheckPrize for Token", async function () {
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR
      });
      await testToken.approve(game.address, ether("0.1"), {
        from: OPPONENT
      });

      // 0
      await time.advanceBlock();
      await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      });
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: CREATOR
      })).length, 0, "Wrong gamesParticipatedToCheckPrize length for 0 for ETH");

      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: CREATOR
      })).length, 1, "Wrong gamesParticipatedToCheckPrize length for 0 for Token");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: CREATOR
      }))[0].cmp(new BN("0")), "Wrong gamesParticipatedToCheckPrize idx for 0 Token");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });

      // 1
      await time.advanceBlock();
      await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      });
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: CREATOR
      })).length, 0, "Wrong gamesParticipatedToCheckPrize length for 1 for ETH");

      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: CREATOR
      })).length, 2, "Wrong gamesParticipatedToCheckPrize length for 1 for Token");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: CREATOR
      }))[0].cmp(new BN("0")), "Wrong gamesParticipatedToCheckPrize idx[0] for 1 for Token");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: CREATOR
      }))[1].cmp(new BN("1")), "Wrong gamesParticipatedToCheckPrize idx[1] for 1 for Token");
    });

    it("should increase playerPredictionTotal (_increasePredictions) for ETH", async function () {
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR
      })).cmp(BET_ETH), "wrong value before for CREATOR");

      // 0
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(new BN("0")), "should be 0 before");

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(BET_ETH_1), "wrong value before for 0 for CREATOR_1");
      assert.equal(0, (await game.getPlayerPredictionTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("0")), "should be 0 before");

      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR_1
      });

      // 1
      await time.advanceBlock();
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_2
      });
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(BET_ETH_1.add(BET_ETH_2)), "wrong value before for 1 for CREATOR_1");
    });

    it("should increase playerPredictionTotal for Token", async function () {
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR_1
      });
      await testToken.approve(game.address, ether("0.1"), {
        from: OPPONENT_1
      });

      // 0
      assert.equal(0, (await game.getPlayerPredictionTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(new BN("0")), "should be 0 before");

      await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1
      });
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(new BN("0")), "wrong value after for 0 for CREATOR_1 for ETH");
      assert.equal(0, (await game.getPlayerPredictionTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(BET_TOKEN), "should be 0 after for CREATOR_1 for Token");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR_1
      });

      // 1
      await time.advanceBlock();
      await time.increase(time.duration.minutes(1));

      await game.startGame(testToken.address, BET_TOKEN_1, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1
      });
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_1
      })).cmp(new BN("0")), "wrong value after for 1 for CREATOR_1 for ETH");
      assert.equal(0, (await game.getPlayerPredictionTotal.call(testToken.address, {
        from: CREATOR_1
      })).cmp(BET_TOKEN.add(BET_TOKEN_1)), "should be 1 after for CREATOR_1 for Token");
    });

    it("should increase betsTotal (_increasePredictions) for ETH", async function () {
      assert.equal(0, (await game.betsTotal.call(constants.ZERO_ADDRESS)).cmp(BET_ETH.add(BET_ETH)), "wrong value before");

      // 0
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      assert.equal(0, (await game.betsTotal.call(constants.ZERO_ADDRESS)).cmp(BET_ETH.add(BET_ETH).add(BET_ETH_1)), "wrong value after 0");

      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR_1
      });

      // 1
      await time.advanceBlock();
      await time.increase(time.duration.minutes(1));
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_2
      });
      assert.equal(0, (await game.betsTotal.call(constants.ZERO_ADDRESS)).cmp(BET_ETH.add(BET_ETH).add(BET_ETH_1).add(BET_ETH_2)), "wrong value after 1");
    });

    it("should increase betsTotal (_increasePredictions) for Token", async function () {
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR_1
      });
      assert.equal(0, (await game.betsTotal.call(testToken.address)).cmp(new BN("0")), "wrong value before");

      // 0
      await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1
      });
      assert.equal(0, (await game.betsTotal.call(testToken.address)).cmp(BET_TOKEN), "wrong value after 0");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR_1
      });

      // 1
      await time.advanceBlock();
      await time.increase(time.duration.minutes(1));
      await game.startGame(testToken.address, BET_TOKEN_1, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1
      });
      assert.equal(0, (await game.betsTotal.call(testToken.address)).cmp(BET_TOKEN.add(BET_TOKEN_1)), "wrong value after 1");
    });

    it("should emit GameStarted with correct params for ETH", async function () {
      const {
        logs
      } = await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });
      await expectEvent.inLogs(logs, 'GameStarted', {
        token: constants.ZERO_ADDRESS,
        id: new BN("1")
      });
    });

    it("should emit GameStarted with correct params for ETH", async function () {
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR_1
      });

      //  0
      const {
        logs
      } = await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1
      });
      await expectEvent.inLogs(logs, 'GameStarted', {
        token: testToken.address,
        id: new BN("0")
      });
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR_1
      });

      // 1
      await time.advanceBlock();
      await time.increase(time.duration.minutes(1));

      let tx = await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_1_REFERRAL, {
        from: CREATOR_1
      });
      await expectEvent.inLogs(tx.logs, 'GameStarted', {
        token: testToken.address,
        id: new BN("1")
      });
    });
  });

  describe("joinGame", function () {
    beforeEach("start game", async function () {
      //  approve TestToken
      await testToken.approve(game.address, ether("0.1"), {
        from: CREATOR
      });
      await testToken.approve(game.address, ether("0.1"), {
        from: OPPONENT
      });

      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR,
        value: BET_ETH
      });

      await game.startGame(testToken.address, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      });
    });

    it("should fail if wrong coin side", async function () {
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 0, OPPONENT_REFERRAL, {
        from: OPPONENT
      }), "Wrong side");
    });

    it("should fail if no running game", async function () {
      //  play ETH
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });

      //  join
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      }), "No running games");

      //  play Token
      await game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });

      //  join
      await expectRevert(game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      }), "No running games");
    });

    it("should fail if Wrong token", async function () {
      await expectRevert(game.joinGame(OTHER, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      }), "No games");
    });

    it("should fail if msg.value > 0 for Token", async function () {
      await expectRevert(game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      }), "Wrong value");
    });

    it("should fail if Wrong prediction for Token", async function () {
      await expectRevert(game.joinGame(testToken.address, BET_TOKEN_2, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      }), "Wrong prediction");
    });

    it("should fail if cannot transferFrom for Token", async function () {
      await expectRevert(game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT_1
      }), "ERC20: transfer amount exceeds allowance");
    });

    it("should transferFrom for Token", async function () {
      let OPPONENT_before = await testToken.balanceOf.call(OPPONENT);
      let game_before = await testToken.balanceOf.call(game.address);

      await game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });

      let OPPONENT_after = await testToken.balanceOf.call(OPPONENT);
      let game_after = await testToken.balanceOf.call(game.address);

      assert.equal(0, OPPONENT_before.sub(BET_TOKEN).cmp(OPPONENT_after), "wrong OPPONENT_after");
      assert.equal(0, game_before.add(BET_TOKEN).cmp(game_after), "wrong game_after");
    });

    it("should fail if Wrong prediction for ETH", async function () {
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: ether("1")
      }), "Wrong prediction");
    });

    it("should fail if Already joined for ETH", async function () {
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      }), "Already joined");
    });

    it("should fail if Already joined for Token", async function () {
      await game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });
      await expectRevert(game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      }), "Already joined");
    });

    it("should set correct opponentCoinSideInGame for ETH", async function () {
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });
      assert.equal(0, (await game.gameInfoForOpponent.call(constants.ZERO_ADDRESS, 1, {
        from: OPPONENT
      })).opponentCoinSide.cmp(new BN("1")), "Wrong opponentCoinSide");
    });

    it("should set correct opponentCoinSideInGame for Token", async function () {
      await game.joinGame(testToken.address, BET_TOKEN, 1, OPPONENT_REFERRAL, {
        from: OPPONENT
      });
      assert.equal(0, (await game.gameInfoForOpponent.call(testToken.address, 0, {
        from: OPPONENT
      })).opponentCoinSide.cmp(new BN("1")), "Wrong opponentCoinSide");
    });

    it("should increase heads for ETH", async function () {
      let heads_before = (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).heads;
      let tails_before = (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).tails;

      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });

      let heads_after = (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).heads;
      let tails_after = (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).tails;

      assert.equal(0, heads_before.add(new BN("1")).cmp(heads_after), "Wrong heads_after");
      assert.equal(0, tails_before.cmp(tails_after), "Wrong tails_after");
    });

    it("should increase tails for ETH", async function () {
      let heads_before = (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).heads;
      let tails_before = (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).tails;

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });

      let heads_after = (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).heads;
      let tails_after = (await game.gameInfo.call(constants.ZERO_ADDRESS, 1)).tails;

      assert.equal(0, heads_before.cmp(heads_after), "Wrong heads_after");
      assert.equal(0, tails_before.add(new BN("1")).cmp(tails_after), "Wrong tails_after");
    });

    it("should increase heads for Token", async function () {
      let heads_before = (await game.gameInfo.call(testToken.address, 0)).heads;
      let tails_before = (await game.gameInfo.call(testToken.address, 0)).tails;

      await game.joinGame(testToken.address, BET_TOKEN, 1, OPPONENT_REFERRAL, {
        from: OPPONENT
      });

      let heads_after = (await game.gameInfo.call(testToken.address, 0)).heads;
      let tails_after = (await game.gameInfo.call(testToken.address, 0)).tails;

      assert.equal(0, heads_before.add(new BN("1")).cmp(heads_after), "Wrong heads_after");
      assert.equal(0, tails_before.cmp(tails_after), "Wrong tails_after");
    });

    it("should increase tails for Token", async function () {
      let heads_before = (await game.gameInfo.call(testToken.address, 0)).heads;
      let tails_before = (await game.gameInfo.call(testToken.address, 0)).tails;

      await game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });

      let heads_after = (await game.gameInfo.call(testToken.address, 0)).heads;
      let tails_after = (await game.gameInfo.call(testToken.address, 0)).tails;

      assert.equal(0, heads_before.cmp(heads_after), "Wrong heads_after");
      assert.equal(0, tails_before.add(new BN("1")).cmp(tails_after), "Wrong tails_after");
    });

    it("should set correct referralInGame for ETH", async function () {
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_1_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });
      assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 1, {
        from: OPPONENT
      }), OPPONENT_1_REFERRAL, "Wrong referralInGame");
    });

    it("should set OWNER as referralInGame for ETH", async function () {
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, constants.ZERO_ADDRESS, {
        from: OPPONENT,
        value: BET_ETH
      });
      assert.equal(await game.getReferralInGame.call(constants.ZERO_ADDRESS, 1, {
        from: OPPONENT
      }), OWNER, "Wrong referralInGame");
    });

    it("should set correct referralInGame for Token", async function () {
      await game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_1_REFERRAL, {
        from: OPPONENT
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: OPPONENT
      }), OPPONENT_1_REFERRAL, "Wrong referralInGame");
    });

    it("should set OWNER as referralInGame for Token", async function () {
      await game.joinGame(testToken.address, BET_TOKEN, 2, constants.ZERO_ADDRESS, {
        from: OPPONENT
      });
      assert.equal(await game.getReferralInGame.call(testToken.address, 0, {
        from: OPPONENT
      }), OWNER, "Wrong referralInGame");
    });

    it("should add game idx to gamesParticipatedToCheckPrize for ETH", async function () {
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: OPPONENT
      })).length, 1, "Wrong length before");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: OPPONENT
      }))[0].cmp(new BN("0")), "Wrong [0] before");

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, constants.ZERO_ADDRESS, {
        from: OPPONENT,
        value: BET_ETH
      });

      assert.equal((await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: OPPONENT
      })).length, 2, "Wrong length after");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: OPPONENT
      }))[0].cmp(new BN("0")), "Wrong [0] after");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(constants.ZERO_ADDRESS, {
        from: OPPONENT
      }))[1].cmp(new BN("1")), "Wrong [1] after");
    });

    it("should add game idx to gamesParticipatedToCheckPrize for Token", async function () {
      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: OPPONENT
      })).length, 0, "Wrong length before");

      await game.joinGame(testToken.address, BET_TOKEN, 2, constants.ZERO_ADDRESS, {
        from: OPPONENT
      });

      assert.equal((await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: OPPONENT
      })).length, 1, "Wrong length after");
      assert.equal(0, (await game.getGamesParticipatedToCheckPrize.call(testToken.address, {
        from: OPPONENT
      }))[0].cmp(new BN("0")), "Wrong [0] after");
    });

    it("should increase playerPredictionTotal (_increasePredictions) for ETH", async function () {
      //  0
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT
      })).cmp(BET_ETH), "wrong value before");

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT
      })).cmp(BET_ETH.mul(new BN("2"))), "wrong value after 0");

      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      //  1
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH_1
      });
      assert.equal(0, (await game.getPlayerPredictionTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT
      })).cmp(BET_ETH.mul(new BN("2")).add(BET_ETH_1)), "wrong value after 1");
    });

    it("should increase playerPredictionTotal (_increasePredictions) for Token", async function () {
      //  0
      assert.equal(0, (await game.getPlayerPredictionTotal.call(testToken.address, {
        from: OPPONENT
      })).cmp(new BN("0")), "wrong value before");

      await game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });
      assert.equal(0, (await game.getPlayerPredictionTotal.call(testToken.address, {
        from: OPPONENT
      })).cmp(BET_TOKEN), "wrong value after 0");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });
      await game.startGame(testToken.address, BET_TOKEN_1, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      });

      //  1
      await game.joinGame(testToken.address, BET_TOKEN_1, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });
      assert.equal(0, (await game.getPlayerPredictionTotal.call(testToken.address, {
        from: OPPONENT
      })).cmp(BET_TOKEN.add(BET_TOKEN_1)), "wrong value after 1");
    });

    it("should increase betsTotal (_increasePredictions) for ETH", async function () {
      //  0
      let betsTotal_before = await game.betsTotal.call(constants.ZERO_ADDRESS);

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });
      assert.equal(0, (await game.betsTotal.call(constants.ZERO_ADDRESS)).cmp(betsTotal_before.add(BET_ETH)), "wrong betsTotal after 0");

      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR_1,
        value: BET_ETH_1
      });

      //  1
      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH_1
      });
      assert.equal(0, (await game.betsTotal.call(constants.ZERO_ADDRESS)).cmp(betsTotal_before.add(BET_ETH).add(BET_ETH_1.mul(new BN("2")))), "wrong betsTotal after 1");
    });

    it("should increase betsTotal (_increasePredictions) for Token", async function () {
      //  0
      let betsTotal_before = await game.betsTotal.call(testToken.address);

      await game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });
      assert.equal(0, (await game.betsTotal.call(testToken.address)).cmp(betsTotal_before.add(BET_TOKEN)), "wrong betsTotal after 0");

      await game.playGame(testToken.address, CREATOR_COIN_SIDE, web3.utils.soliditySha3(CREATOR_SEED), {
        from: CREATOR
      });
      await game.startGame(testToken.address, BET_TOKEN_1, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      });

      //  1
      await game.joinGame(testToken.address, BET_TOKEN_1, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });
      assert.equal(0, (await game.betsTotal.call(testToken.address)).cmp(betsTotal_before.add(BET_TOKEN).add(BET_TOKEN_1.mul(new BN("2")))), "wrong betsTotal after 1");
    });

    it("should emit GameJoined for ETH", async function () {
      const {
        logs
      } = await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      });
      await expectEvent.inLogs(logs, 'GameJoined', {
        token: constants.ZERO_ADDRESS,
        id: new BN("1"),
        opponent: OPPONENT
      });
    });

    it("should emit GameJoined for Token", async function () {
      const {
        logs
      } = await game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      });
      await expectEvent.inLogs(logs, 'GameJoined', {
        token: testToken.address,
        id: new BN("0"),
        opponent: OPPONENT
      });
    });

    it("should fail if Game time out for ETH", async function () {
      await time.increase(time.duration.minutes(1));
      await time.advanceBlockTo((await time.latestBlock()).add(new BN("13")));
      await expectRevert(game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL, {
        from: OPPONENT,
        value: BET_ETH
      }), "Game time out");
    });

    it("should fail if Game time out for Token", async function () {
      await time.increase(time.duration.minutes(1));
      await time.advanceBlockTo((await time.latestBlock()).add(new BN("13")));
      await expectRevert(game.joinGame(testToken.address, BET_TOKEN, 2, OPPONENT_REFERRAL, {
        from: OPPONENT
      }), "Game time out");
    });
  });

  describe("playGame", function () {
    it.only("should fail if Wrong side", async function () {

    });

    it("should fail if no running games for ETH", async function () {

    });

    it("should fail if no running games for Token", async function () {

    });

    it("should fail if Not creator for ETH", async function () {

    });

    it("should fail if Not creator for Token", async function () {

    });

    it("should fail if Time out for ETH", async function () {

    });

    it("should fail if Time out for Token", async function () {

    });

    it("should fail if Wrong hash value for ETH", async function () {

    });

    it("should fail if Wrong hash value for Token", async function () {

    });

    it("should delete game.running for ETH", async function () {

    });

    it("should delete game.running for Token", async function () {

    });

    it("should increase game.heads for ETH", async function () {

    });

    it("should increase game.tails for ETH", async function () {

    });

    it("should increase game.heads for Token", async function () {

    });

    it("should increase game.tails for Token", async function () {

    });

    it("should set correct creatorPrize if CREATOR there were opponents, who lost for ETH", async function () {

    });

    it("should set creatorPrize == 0 if CREATOR there were no opponents, who lost for ETH", async function () {

    });

    it("should set creatorPrize == 0 if CREATOR there were no opponents at all for ETH", async function () {

    });

    it("should set correct creatorPrize if CREATOR there were opponents, who lost for Token", async function () {

    });

    it("should set creatorPrize == 0 if CREATOR there were no opponents, who lost for Token", async function () {

    });

    it("should set creatorPrize == 0 if CREATOR there were no opponents at all for Token", async function () {

    });

    it("should set correct opponentPrize if won for ETH", async function () {

    });

    it("should set opponentPrize == 0 if lost for ETH", async function () {

    });

    it("should set correct opponentPrize if won for Token", async function () {

    });

    it("should set opponentPrize == 0 if lost for Token", async function () {

    });

    it("should runRaffle for ETH", async function () {

    });

    it("should not runRaffle, if no opponents joined for ETH", async function () {

    });

    it("should runRaffle for Token", async function () {

    });

    it("should not runRaffle, if no opponents joined for Token", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });

    it("should ", async function () {

    });
  });
});