const PMCCoinFlipContract = artifacts.require("PMCCoinFlipContract");
const PMCStaking = artifacts.require("PMCStaking");
const PMC = artifacts.require("PMC");
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


contract("PMCRaffle", function (accounts) {
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

  let pmc;
  let game;
  let creatorHash;

  beforeEach("setup", async function () {
    pmc = await PMC.new();
    game = await PMCCoinFlipContract.new(pmc.address);
    await pmc.addMinter(game.address);

    creatorHash = web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH);

    await time.advanceBlock();
  });

  describe("runRaffle, ETH", function () {
    beforeEach("play game", async function () {
      await game.updatePartner(OTHER);

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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165
    });

    it("should increase raffleJackpot", async function () {
      assert.equal(0, (await game.getRaffleJackpot(constants.ZERO_ADDRESS)).cmp(ether("0.00165")), "wrong for raffleJackpot");
    });

    it("should push to raffleParticipants - getRaffleParticipants", async function () {
      assert.deepEqual(await game.getRaffleParticipants(constants.ZERO_ADDRESS), [CREATOR_0], "worng on 0");

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.deepEqual(await game.getRaffleParticipants(constants.ZERO_ADDRESS), [CREATOR_0, OPPONENT_1], "worng on 1");
    });

    it("should validate getRaffleParticipantsNumber", async function () {
      assert.equal(0, (await game.getRaffleParticipantsNumber(constants.ZERO_ADDRESS)).cmp(new BN("1")), "worng on 0");

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165
      assert.equal(0, (await game.getRaffleParticipantsNumber(constants.ZERO_ADDRESS)).cmp(new BN("2")), "worng on 1");
    });
  });

  describe("addToRaffle, Token", function () {
    let testToken;

    beforeEach("Add token", async function () {
      //   ETH
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165


      //  Token
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

      await game.updatePartner(OTHER);

      //  start game
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      }); //  100 + 100 / 2 = 150
    });

    it("should increase raffleJackpot", async function () {
      assert.equal(0, (await game.getRaffleJackpot(testToken.address)).cmp(new BN("1")), "wrong for raffleJackpot");
    });

    it("should push to raffleParticipants - getRaffleParticipants", async function () {
      assert.deepEqual(await game.getRaffleParticipants(testToken.address), [CREATOR_0], "worng on 0");

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      });

      assert.deepEqual(await game.getRaffleParticipants(testToken.address), [CREATOR_0, OPPONENT_1], "worng on 1");
    });

    it("should validate getRaffleParticipantsNumber", async function () {
      assert.equal(0, (await game.getRaffleParticipantsNumber(testToken.address)).cmp(new BN("1")), "worng on 0");

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      });
      assert.equal(0, (await game.getRaffleParticipantsNumber(testToken.address)).cmp(new BN("2")), "worng on 1");
    });
  });

  describe("runRaffle, ETH", function () {
    beforeEach("play game", async function () {
      await game.updatePartner(OTHER);

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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165
    });

    it("should not run if raffleJackpot[_token] == 0 || raffleParticipants[_token].length == 0", async function () {
      assert.equal(0, (await game.getRaffleResultNumber(constants.ZERO_ADDRESS)).cmp(new BN("0")), "should be 0");
    });

    it("should increase raffleJackpotPending for winner", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(constants.ZERO_ADDRESS, 0);
      assert.equal(0, (await game.getRaffleJackpotPending.call(constants.ZERO_ADDRESS, resultInfo.winner)).cmp(ether("0.00165")), "Wrong raffleJackpotPending");
    });

    it("should increase raffleJackpotsWonTotal for winner", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleJackpotsWonTotal.call(constants.ZERO_ADDRESS)).cmp(ether("0.00165")), "Wrong raffleJackpotsWonTotal");
    });

    it("should push correct result to raffleResults", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(constants.ZERO_ADDRESS, 0);
      assert.isTrue((resultInfo.winner == CREATOR_0) || (resultInfo.winner == OPPONENT_0) || (resultInfo.winner == OPPONENT_1), "Wrong winner");
      assert.equal(0, resultInfo.prize.cmp(ether("0.00165")), "Wrong prize");
    });

    it("should emit CF_RafflePlayed with correct params", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      const {
        logs
      } = await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await expectEvent.inLogs(logs, 'CF_RafflePlayed', {
        token: constants.ZERO_ADDRESS,
        winner: CREATOR_0 || OPPONENT_0 || OPPONENT_1,
        prize: ether("0.00165"),
      });
    });

    it("should delete raffleJackpot", async function () {
      //  0
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

      assert.equal(0, (await game.getRaffleJackpot(constants.ZERO_ADDRESS)).cmp(ether("0.00165")), "Wrong before");

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleJackpot(constants.ZERO_ADDRESS)).cmp(ether("0")), "Wrong after");


      //  1
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

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.12 + 0.12 / 2 = 0.18

      assert.equal(0, (await game.getRaffleJackpot(constants.ZERO_ADDRESS)).cmp(ether("0.0018")), "Wrong before 1");

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleJackpot(constants.ZERO_ADDRESS)).cmp(ether("0")), "Wrong after 1");
    });

    it("should delete raffleParticipants", async function () {
      //  0
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });

      assert.equal(0, (await game.getRaffleParticipantsNumber(constants.ZERO_ADDRESS)).cmp(new BN("1")), "Wrong before");

      // play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleParticipantsNumber(constants.ZERO_ADDRESS)).cmp(new BN("0")), "Wrong after");


      //  1
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

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.12 + 0.12 / 2 = 0.18

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.12 + 0.12 / 2 = 0.18

      assert.equal(0, (await game.getRaffleParticipantsNumber(constants.ZERO_ADDRESS)).cmp(new BN("2")), "Wrong before 1");

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleParticipantsNumber(constants.ZERO_ADDRESS)).cmp(new BN("0")), "Wrong after 1");
    });

    it("should correct getRaffleResultNumber", async function () {
      //  0
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0,
        value: BET_ETH_1
      });

      await game.joinGame(constants.ZERO_ADDRESS, 0, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0,
        value: BET_ETH_1
      });

      assert.equal(0, (await game.getRaffleResultNumber(constants.ZERO_ADDRESS)).cmp(new BN("0")), "Wrong before");

      // play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleResultNumber(constants.ZERO_ADDRESS)).cmp(new BN("1")), "Wrong after");


      //  1
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

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.12 + 0.12 / 2 = 0.18

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.12 + 0.12 / 2 = 0.18

      assert.equal(0, (await game.getRaffleResultNumber(constants.ZERO_ADDRESS)).cmp(new BN("1")), "Wrong before 1");

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleResultNumber(constants.ZERO_ADDRESS)).cmp(new BN("2")), "Wrong after 1");
    });
  });

  describe("runRaffle, Token", function () {
    let testToken;

    beforeEach("Add token", async function () {
      //   ETH
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165


      //  Token
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

      await game.updatePartner(OTHER);

      //  start game
      await game.startGame(testToken.address, 400, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 400, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 400, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      }); //  100 + 100 / 2 = 150
    });

    it("should not run if raffleJackpot[_token] == 0 || raffleParticipants[_token].length == 0", async function () {
      assert.equal(0, (await game.getRaffleResultNumber(testToken.address)).cmp(new BN("0")), "should be 0");
    });

    it("should increase raffleJackpotPending for winner", async function () {
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(testToken.address, 0);
      assert.equal(0, (await game.getRaffleJackpotPending.call(testToken.address, resultInfo.winner)).cmp(new BN("6")), "Wrong raffleJackpotPending");
    });

    it("should increase raffleJackpotsWonTotal for winner", async function () {
      await game.startGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleJackpotsWonTotal.call(testToken.address)).cmp(new BN("6")), "Wrong raffleJackpotsWonTotal");
    });

    it("should push correct result to raffleResults", async function () {
      await game.startGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(testToken.address, 0);
      assert.isTrue((resultInfo.winner == CREATOR_0) || (resultInfo.winner == OPPONENT_0) || (resultInfo.winner == OPPONENT_1), "Wrong winner");
      assert.equal(0, resultInfo.prize.cmp(new BN("6")), "Wrong prize");
    });

    it("should emit CF_RafflePlayed with correct params", async function () {
      await game.startGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      const {
        logs
      } = await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      await expectEvent.inLogs(logs, 'CF_RafflePlayed', {
        token: testToken.address,
        winner: CREATOR_0 || OPPONENT_0 || OPPONENT_1,
        prize: new BN("6"),
      });
    });

    it("should delete raffleJackpot", async function () {
      //  0
      await game.startGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      assert.equal(0, (await game.getRaffleJackpot(testToken.address)).cmp(new BN("6")), "Wrong before");

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleJackpot(testToken.address)).cmp(new BN("0")), "Wrong after");


      //  1
      await game.startGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.getRaffleJackpot(testToken.address)).cmp(new BN("4")), "Wrong before 1");

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      });
      assert.equal(0, (await game.getRaffleJackpot(testToken.address)).cmp(new BN("14")), "Wrong before 1 OPPONENT_1");

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });
      assert.equal(0, (await game.getRaffleJackpot(testToken.address)).cmp(new BN("0")), "Wrong after 1 1");
    });

    it("should delete raffleParticipants", async function () {
      //  0
      await game.startGame(testToken.address, 300, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 300, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 300, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      assert.equal(0, (await game.getRaffleParticipantsNumber(testToken.address)).cmp(new BN("1")), "Wrong before");

      // play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleParticipantsNumber(testToken.address)).cmp(new BN("0")), "Wrong after");


      //  1
      await game.startGame(testToken.address, 500, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 500, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      });

      assert.equal(0, (await game.getRaffleParticipantsNumber(testToken.address)).cmp(new BN("2")), "Wrong before 1");

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleParticipantsNumber(testToken.address)).cmp(new BN("0")), "Wrong after 1");
    });

    it("should correct getRaffleResultNumber", async function () {
      //  0
      await game.startGame(testToken.address, 500, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });

      assert.equal(0, (await game.getRaffleResultNumber(testToken.address)).cmp(new BN("0")), "Wrong before");

      // play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleResultNumber(testToken.address)).cmp(new BN("1")), "Wrong after");


      //  1
      await game.startGame(testToken.address, 500, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 500, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      });

      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      });

      assert.equal(0, (await game.getRaffleResultNumber(testToken.address)).cmp(new BN("1")), "Wrong before 1");

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      assert.equal(0, (await game.getRaffleResultNumber(testToken.address)).cmp(new BN("2")), "Wrong after 1");
    });
  });

  describe("withdrawRaffleJackpots, ETH", function () {
    beforeEach("play game", async function () {
      await game.updatePartner(OTHER);

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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165
    });

    it("should fail if No prize", async function () {
      await expectRevert(game.withdrawRaffleJackpots(constants.ZERO_ADDRESS), "No prize");
    });

    it("should delete raffleJackpotPending for sender", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(constants.ZERO_ADDRESS, 0);
      assert.equal(0, (await game.getRaffleJackpotPending.call(constants.ZERO_ADDRESS, resultInfo.winner)).cmp(ether("0.00165")), "Wrong raffleJackpotPending before");

      await game.withdrawRaffleJackpots(constants.ZERO_ADDRESS, {
        from: resultInfo.winner
      });

      assert.equal(0, (await game.getRaffleJackpotPending.call(constants.ZERO_ADDRESS, resultInfo.winner)).cmp(ether("0")), "Wrong raffleJackpotPending after");
    });

    it("should increase raffleJackpotWithdrawn for sender", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(constants.ZERO_ADDRESS, 0);
      assert.equal(0, (await game.getRaffleJackpotWithdrawn.call(constants.ZERO_ADDRESS, resultInfo.winner)).cmp(ether("0")), "Wrong raffleJackpotPending before");

      await game.withdrawRaffleJackpots(constants.ZERO_ADDRESS, {
        from: resultInfo.winner
      });

      assert.equal(0, (await game.getRaffleJackpotWithdrawn.call(constants.ZERO_ADDRESS, resultInfo.winner)).cmp(ether("0.00165")), "Wrong raffleJackpotPending after");
    });

    it("should transfer correct amount", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(constants.ZERO_ADDRESS, 0);
      assert.equal(0, (await game.getRaffleJackpotWithdrawn.call(constants.ZERO_ADDRESS, resultInfo.winner)).cmp(ether("0")), "Wrong raffleJackpotPending before");

      let winner_before = await balance.current(resultInfo.winner, "wei");

      let tx = await game.withdrawRaffleJackpots(constants.ZERO_ADDRESS, {
        from: resultInfo.winner
      });

      let gasUsed = new BN(tx.receipt.gasUsed);
      let txInfo = await web3.eth.getTransaction(tx.tx);
      let gasPrice = new BN(txInfo.gasPrice);
      let gasSpent = gasUsed.mul(gasPrice);

      let winner_after = await balance.current(resultInfo.winner, "wei");

      assert.equal(0, winner_before.add(ether("0.00165")).sub(gasSpent).cmp(winner_after), "Wrong winner_after");
    });

    it("should emit CF_RaffleJackpotWithdrawn with correct params", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(constants.ZERO_ADDRESS, 0);
      assert.equal(0, (await game.getRaffleJackpotWithdrawn.call(constants.ZERO_ADDRESS, resultInfo.winner)).cmp(ether("0")), "Wrong raffleJackpotPending before");

      let winner_before = await balance.current(resultInfo.winner, "wei");

      const {
        logs
      } = await game.withdrawRaffleJackpots(constants.ZERO_ADDRESS, {
        from: resultInfo.winner
      });

      await expectEvent.inLogs(logs, 'CF_RaffleJackpotWithdrawn', {
        token: constants.ZERO_ADDRESS,
        amount: ether("0.00165"),
        winner: resultInfo.winner
      });
    });
  });

  describe("withdrawRaffleJackpots, Token", function () {
    let testToken;

    beforeEach("Add token", async function () {
      //   ETH
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165


      //  Token
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

      await game.updatePartner(OTHER);

      //  start game
      await game.startGame(testToken.address, 400, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 400, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 400, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: CREATOR_0
      }); //  100 + 100 / 2 = 150
    });

    it("should fail if No prize", async function () {
      await expectRevert(game.withdrawRaffleJackpots(testToken.address), "No prize");
    });

    it("should delete raffleJackpotPending for sender", async function () {
      await game.startGame(testToken.address, 400, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 400, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 400, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(testToken.address, 0);
      assert.equal(0, (await game.getRaffleJackpotPending.call(testToken.address, resultInfo.winner)).cmp(new BN("6")), "Wrong raffleJackpotPending before");

      await game.withdrawRaffleJackpots(testToken.address, {
        from: resultInfo.winner
      });

      assert.equal(0, (await game.getRaffleJackpotPending.call(testToken.address, resultInfo.winner)).cmp(new BN("0")), "Wrong raffleJackpotPending after");
    });

    it("should increase raffleJackpotWithdrawn for sender", async function () {
      await game.startGame(testToken.address, 500, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 500, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(testToken.address, 0);
      assert.equal(0, (await game.getRaffleJackpotWithdrawn.call(testToken.address, resultInfo.winner)).cmp(new BN("0")), "Wrong raffleJackpotPending before");

      await game.withdrawRaffleJackpots(testToken.address, {
        from: resultInfo.winner
      });

      assert.equal(0, (await game.getRaffleJackpotWithdrawn.call(testToken.address, resultInfo.winner)).cmp(new BN("6")), "Wrong raffleJackpotPending after");
    });

    it("should transfer correct amount", async function () {
      await game.startGame(testToken.address, 500, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 500, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(testToken.address, 0);
      assert.equal(0, (await game.getRaffleJackpotWithdrawn.call(testToken.address, resultInfo.winner)).cmp(new BN("0")), "Wrong raffleJackpotPending before");

      let winner_before = await testToken.balanceOf(resultInfo.winner);

      await game.withdrawRaffleJackpots(testToken.address, {
        from: resultInfo.winner
      });

      let winner_after = await testToken.balanceOf(resultInfo.winner);

      assert.equal(0, winner_before.add(new BN("6")).cmp(winner_after), "Wrong winner_after");
    });

    it("should emit CF_RaffleJackpotWithdrawn with correct params", async function () {
      await game.startGame(testToken.address, 500, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 500, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 500, 1, OPPONENT_REFERRAL_0, {
        from: OPPONENT_1
      });

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(testToken.address, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      let resultInfo = await game.getRaffleResultInfo(testToken.address, 0);

      const {
        logs
      } = await game.withdrawRaffleJackpots(testToken.address, {
        from: resultInfo.winner
      });

      await expectEvent.inLogs(logs, 'CF_RaffleJackpotWithdrawn', {
        token: testToken.address,
        amount: new BN("6"),
        winner: resultInfo.winner
      });
    });
  });
});