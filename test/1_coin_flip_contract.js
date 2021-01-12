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
    assert.isTrue(await game.isTokenSupportedToBet.call(testToken.address), "TestToken should be supported to bet");

    await time.advanceBlock();
  });

  describe.only("startGame", function () {
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
      }), "Wrong tokens bet");
    });

    it("should fail if Token & failed to transferFrom", async function () {
      await expectRevert(game.startGame(pmct.address, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR,
      }), "ERC20: transfer amount exceeds allowance");
    });

    it("should fail if ETH & msg.value < gameMinBet", async function () {
      await expectRevert(game.startGame(constants.ZERO_ADDRESS, BET_TOKEN, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      }), "Wrong ETH bet");

      let wrongEthBet = BET_ETH_MIN.div(new BN("2"));
      await expectRevert(game.startGame(constants.ZERO_ADDRESS, wrongEthBet, creatorHash, CREATOR_REFERRAL, {
        from: CREATOR
      }), "Wrong ETH bet");
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
      assert.equal(0, game_0.bet.cmp(BET_ETH), "wrong bet for 0");
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
      assert.equal(0, game_1.bet.cmp(BET_ETH_1), "wrong bet for 1");
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
      assert.equal(0, game_0.bet.cmp(BET_TOKEN), "wrong bet for 0");
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
      assert.equal(0, game_1.bet.cmp(BET_TOKEN_1), "wrong bet for 1");
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

    it.only("should add game to gamesParticipatedToCheckPrize for Token", async function () {

    });

    it("should increase playerBetTotal for ETH", async function () {

    });

    it("should increase playerBetTotal for Token", async function () {

    });

    it("should increase betsTotal for ETH", async function () {

    });

    it("should increase betsTotal for Token", async function () {

    });

    it("should emit GameStarted with correct params for ETH", async function () {

    });

    it("should emit GameStarted with correct params for ETH", async function () {

    });
  });
});