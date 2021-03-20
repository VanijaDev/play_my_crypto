const PMCCoinFlipContract = artifacts.require("PMCCoinFlipContract");
const PMCStaking = artifacts.require("PMCStaking");
const PMCGovernance = artifacts.require("PMCGovernance");
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

  let pmc;
  let game;
  let governance;

  let creatorHash;

  beforeEach("setup", async function () {
    pmc = await PMC.new();
    game = await PMCCoinFlipContract.new(pmc.address);
    await pmc.addMinter(game.address);

    governance = await PMCGovernance.new(pmc.address, game.address);

    creatorHash = web3.utils.soliditySha3(CREATOR_COIN_SIDE, CREATOR_SEED_HASH);

    await pmc.approve(governance.address, ether("1"), {
      from: CREATOR_0
    });
    await pmc.approve(governance.address, ether("1"), {
      from: CREATOR_1
    });
    await pmc.approve(governance.address, ether("1"), {
      from: OTHER
    });

    await time.advanceBlock();
  });

  describe("Constructor", function () {
    it("should fail if Wrong _pmc", async function () {
      await expectRevert(PMCGovernance.new(constants.ZERO_ADDRESS, game.address), "Wrong _pmc");
    });

    it("should fail if Wrong _game", async function () {
      await expectRevert(PMCGovernance.new(pmc.address, constants.ZERO_ADDRESS), "Wrong _game");
    });

    it("should set correct pmcAddr", async function () {
      let gov = await PMCGovernance.new(OTHER, game.address);
      assert.equal(await gov.pmcAddr.call(), OTHER, "Wrong pmcAddr");
    });

    it("should push game into games", async function () {
      let gov = await PMCGovernance.new(pmc.address, OTHER);
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

  describe("addProposal", function () {
    it("should fail if Wrong proposal", async function () {
      await expectRevert(governance.addProposal(3, constants.ZERO_ADDRESS, ether("0"), ether("1"), {
        from: OTHER
      }), "Wrong proposal");
    });

    it("should fail if Wrong _pmcTokens", async function () {
      await expectRevert(governance.addProposal(1, constants.ZERO_ADDRESS, ether("0"), ether("0"), {
        from: OTHER
      }), "Wrong _pmcTokens");
    });

    it("should fail if Wrong value for minStake", async function () {
      await expectRevert(governance.addProposal(0, constants.ZERO_ADDRESS, ether("0"), ether("1"), {
        from: OTHER
      }), "Wrong value");
    });

    it("should fail if Wrong value for gameMaxDuration", async function () {
      await expectRevert(governance.addProposal(1, constants.ZERO_ADDRESS, new BN("0"), ether("1"), {
        from: OTHER
      }), "Wrong value");
    });

    it("should fail if Wrong token for addToken", async function () {
      await expectRevert(governance.addProposal(2, constants.ZERO_ADDRESS, new BN("0"), ether("1"), {
        from: OTHER
      }), "Wrong token");
    });

    it("should fail if Cannt add PMC for addToken", async function () {
      await expectRevert(governance.addProposal(2, pmc.address, new BN("0"), ether("1"), {
        from: OTHER
      }), "Cannt add PMC");
    });
  });

  describe("_addProposalMinStake - voteProposalMinStake", function () {
    beforeEach("setup", async function () {
      //  play game 0
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
      // console.log("staking balance 0:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH


      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
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
        from: CREATOR_1
      });
      // console.log("staking balance 0:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }); //  0.165 ETH
    });

    it("should transfer PMC tokens", async function () {
      assert.equal(0, (await pmc.balanceOf.call(governance.address)).cmp(ether("0")), "Wrong before");

      await governance.addProposal(1, constants.ZERO_ADDRESS, ether("0.2"), ether("0.0001"), {
        from: CREATOR_0
      });

      assert.equal(0, (await pmc.balanceOf.call(governance.address)).cmp(ether("0.0001")), "Wrong after");
    });

    it("should push _minStake to proposalsMinStakeValues", async function () {
      assert.equal(0, (await governance.proposalMinStakeValueParticipating.call(CREATOR_0)).cmp(ether("0")), "Wrong before");

      await governance.addProposal(0, constants.ZERO_ADDRESS, ether("0.2"), ether("0.0001"), {
        from: CREATOR_0
      });
      assert.equal(0, (await governance.proposalMinStakeValueParticipating.call(CREATOR_0)).cmp(ether("0.2")), "Wrong after");
    });

    it("should update proposalMinStakeValueParticipating for sender", async function () {
      await governance.addProposal(0, constants.ZERO_ADDRESS, ether("0.2"), ether("0.0001"), {
        from: CREATOR_0
      });
      let startedTime = await time.latest();
      await time.increase(time.duration.seconds(5));

      let info = await governance.getProposalInfo.call(0, constants.ZERO_ADDRESS, ether("0.2"), {
        from: CREATOR_0
      });
      assert.equal(0, (info.votersTotal).cmp(new BN("1")), "Wrong votersTotal");
      assert.equal(0, (info.tokensTotal).cmp(ether("0.0001")), "Wrong tokensTotal");
      assert.equal(0, (info.startedAt).cmp(startedTime), "Wrong startedAt");
      assert.equal(0, (info.tokensOfVoter).cmp(ether("0.0001")), "Wrong tokensOfVoter");
      assert.equal(0, (info.voterVotedAt).cmp(startedTime), "Wrong voterVotedAt");
    });

    it("should emit ProposalAdded", async function () {
      const {
        logs
      } = await governance.addProposal(0, constants.ZERO_ADDRESS, ether("0.2"), ether("0.0001"), {
        from: CREATOR_0
      });

      await expectEvent.inLogs(logs, 'ProposalAdded', {
        sender: CREATOR_0,
        proposalType: new BN("0"),
        token: constants.ZERO_ADDRESS,
      });
    });
  });

  describe("_addProposalMinStake - voteProposalMinStake", function () {
    beforeEach("setup", async function () {
      //  play game 0
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
      // console.log("staking balance 0:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.165 ETH


      //  play game 1
      await game.startGame(constants.ZERO_ADDRESS, 0, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_1,
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
        from: CREATOR_1
      });
      // console.log("staking balance 0:", (await balance.current(staking.address, "wei")).toString()); //  0 ETH

      await game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_1
      }); //  0.165 ETH
    });



  });
});