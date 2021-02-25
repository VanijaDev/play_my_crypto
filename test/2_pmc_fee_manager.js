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


contract("PMCFeeManager", function (accounts) {
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

  describe("updatePartner", function () {
    it("should fail if not owner", async function () {
      await expectRevert(game.updatePartner(OTHER, {
        from: OTHER
      }), "Ownable: caller is not the owner");
    });

    it("should set correct partner address", async function () {
      assert.equal(await game.partner.call(), constants.ZERO_ADDRESS, "should be 0x0 before");

      await game.updatePartner(OTHER);
      assert.equal(await game.partner.call(), OTHER, "should be OTHER");

      await game.updatePartner(CREATOR_0);
      assert.equal(await game.partner.call(), CREATOR_0, "should be CREATOR_0");
    });
  });

  describe("addFee ETH", function () {
    it("should update partnerFeePending", async function () {
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

      assert.equal(0, (await game.getPartnerFeePending.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0.00165")), "wrong fee");

      assert.equal(0, (await game.getPartnerFeePending.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(ether("0")), "wrong fee for CREATOR_0");


      //  withdraw OPPONENT_1
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.equal(0, (await game.getPartnerFeePending.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0.0033")), "wrong fee for OPPONENT_1");

      assert.equal(0, (await game.getPartnerFeePending.call(constants.ZERO_ADDRESS, {
        from: CREATOR_0
      })).cmp(ether("0")), "wrong fee for CREATOR_0 for OPPONENT_1");
    });

    it("should update referralFeePending", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0.00165")), "wrong fee for CREATOR_REFERRAL_0");
      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_REFERRAL_0
      })).cmp(ether("0")), "wrong fee for OPPONENT_REFERRAL_0");
      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_REFERRAL_1
      })).cmp(ether("0")), "wrong fee for OPPONENT_REFERRAL_1");


      //  withdraw OPPONENT_1
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0.00165")), "wrong fee for CREATOR_REFERRAL_0 after OPPONENT_1");
      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_REFERRAL_0
      })).cmp(ether("0")), "wrong fee for OPPONENT_REFERRAL_0 after OPPONENT_1");
      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_REFERRAL_1
      })).cmp(ether("0.00165")), "wrong fee for OPPONENT_REFERRAL_1 after OPPONENT_1");
    });

    it("should update devFeePending", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.equal(0, (await game.getDevFeePending.call(constants.ZERO_ADDRESS, {
        from: OWNER
      })).cmp(ether("0.00165")), "wrong fee for OWNER");


      //  withdraw OPPONENT_1
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.equal(0, (await game.getDevFeePending.call(constants.ZERO_ADDRESS, {
        from: OWNER
      })).cmp(ether("0.0033")), "wrong fee for OWNER");
    });

    it("should update stakeRewardPoolPending_ETH if staking present", async function () {
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

      //  play
      await time.increase(time.duration.minutes(1));
      await game.playGame(constants.ZERO_ADDRESS, CREATOR_COIN_SIDE, CREATOR_SEED_HASH, {
        from: CREATOR_0
      });

      //  withdraw CREATOR_0
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: CREATOR_0
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.equal(0, (await game.stakeRewardPoolPending_ETH.call()).cmp(ether("0")), "stakeRewardPoolPending_ETH shold be 0");


      //  withdraw OPPONENT_1
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.equal(0, (await game.stakeRewardPoolPending_ETH.call()).cmp(ether("0.00165")), "stakeRewardPoolPending_ETH shold be 0.00165");
    });
  });

  describe("addFee Token", function () {
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
    });

    it("should update partnerFeePending", async function () {
      await game.updatePartner(OTHER);

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

      assert.equal(0, (await game.getPartnerFeePending.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("1")), "wrong fee");

      assert.equal(0, (await game.getPartnerFeePending.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("0")), "wrong fee for CREATOR_0");


      //  withdraw OPPONENT_1
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      }); //  100 + 100 / 2 = 150

      assert.equal(0, (await game.getPartnerFeePending.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("2")), "wrong fee for OPPONENT_1");

      assert.equal(0, (await game.getPartnerFeePending.call(testToken.address, {
        from: CREATOR_0
      })).cmp(new BN("0")), "wrong fee for CREATOR_0 for OPPONENT_1");
    });

    it("should update referralFeePending", async function () {
      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_1, {
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

      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(new BN("1")), "wrong fee for CREATOR_REFERRAL_0");
      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: OPPONENT_REFERRAL_0
      })).cmp(new BN("0")), "wrong fee for OPPONENT_REFERRAL_0");
      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: OPPONENT_REFERRAL_1
      })).cmp(new BN("0")), "wrong fee for OPPONENT_REFERRAL_1");


      //  withdraw OPPONENT_1
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(new BN("1")), "wrong fee for CREATOR_REFERRAL_0 after OPPONENT_1");
      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: OPPONENT_REFERRAL_0
      })).cmp(new BN("0")), "wrong fee for OPPONENT_REFERRAL_0 after OPPONENT_1");
      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: OPPONENT_REFERRAL_1
      })).cmp(new BN("1")), "wrong fee for OPPONENT_REFERRAL_1 after OPPONENT_1");
    });

    it("should update devFeePending", async function () {
      await game.startGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_1, {
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
      }); //  200 + 200 / 2 = 300

      assert.equal(0, (await game.getDevFeePending.call(testToken.address, {
        from: OWNER
      })).cmp(new BN("3")), "wrong fee for OWNER");


      //  withdraw OPPONENT_1
      let staking = await PMCStaking.new(pmct.address, game.address);
      await game.updateStakingAddr(staking.address);

      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      }); //  200 + 200 / 2 = 300

      assert.equal(0, (await game.getDevFeePending.call(testToken.address, {
        from: OWNER
      })).cmp(new BN("6")), "wrong fee for OWNER");
    });
  });

  describe("withdrawPartnerFee for ETH", function () {
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

    it("should fail if no fee", async function () {
      await expectRevert(game.withdrawPartnerFee(constants.ZERO_ADDRESS, {
        from: OWNER
      }), "no fee");
    });

    it("should delete partnerFeePending", async function () {
      assert.equal(0, (await game.getPartnerFeePending.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0.00165")), "wrong fee before");

      await game.withdrawPartnerFee(constants.ZERO_ADDRESS, {
        from: OTHER
      })

      assert.equal(0, (await game.getPartnerFeePending.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0")), "wrong fee after");
    });

    it("should update partnerFeeWithdrawn", async function () {
      assert.equal(0, (await game.getPartnerFeeWithdrawn.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0")), "wrong fee before");

      await game.withdrawPartnerFee(constants.ZERO_ADDRESS, {
        from: OTHER
      });

      assert.equal(0, (await game.getPartnerFeeWithdrawn.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0.00165")), "wrong fee after");
    });

    it("should update partnerFeeWithdrawnTotal", async function () {
      //  0
      assert.equal(0, (await game.getPartnerFeeWithdrawnTotal.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0")), "wrong fee before");

      await game.withdrawPartnerFee(constants.ZERO_ADDRESS, {
        from: OTHER
      })

      assert.equal(0, (await game.getPartnerFeeWithdrawnTotal.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0.00165")), "wrong fee after");

      //  1
      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      await game.withdrawPartnerFee(constants.ZERO_ADDRESS, {
        from: OTHER
      });

      assert.equal(0, (await game.getPartnerFeeWithdrawnTotal.call(constants.ZERO_ADDRESS, {
        from: OTHER
      })).cmp(ether("0.0033")), "wrong fee after 1");
    });

    it("should transfer correct amount", async function () {
      let balance_before = await balance.current(OTHER, "wei");

      let tx = await game.withdrawPartnerFee(constants.ZERO_ADDRESS, {
        from: OTHER
      });

      let gasUsed = new BN(tx.receipt.gasUsed);
      let txInfo = await web3.eth.getTransaction(tx.tx);
      let gasPrice = new BN(txInfo.gasPrice);
      let gasSpent = gasUsed.mul(gasPrice);

      let balance_after = await balance.current(OTHER, "wei");
      assert.equal(0, balance_before.add(ether("0.00165")).sub(gasSpent).cmp(balance_after), "Wrong balance_after");
    });
  });

  describe("withdrawPartnerFee for Token", function () {
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

      await game.updatePartner(OTHER);

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

    it("should fail if no fee", async function () {
      await expectRevert(game.withdrawPartnerFee(testToken.address, {
        from: OWNER
      }), "no fee");
    });

    it("should delete partnerFeePending", async function () {
      assert.equal(1, (await game.getPartnerFeePending.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("0")), "wrong fee before");

      await game.withdrawPartnerFee(testToken.address, {
        from: OTHER
      })

      assert.equal(0, (await game.getPartnerFeePending.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("0")), "wrong fee after");
    });

    it("should update partnerFeeWithdrawn", async function () {
      assert.equal(0, (await game.getPartnerFeeWithdrawn.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("0")), "wrong fee before");

      await game.withdrawPartnerFee(testToken.address, {
        from: OTHER
      });

      assert.equal(0, (await game.getPartnerFeeWithdrawn.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("1")), "wrong fee after");
    });

    it("should update partnerFeeWithdrawnTotal", async function () {
      //  0
      assert.equal(0, (await game.getPartnerFeeWithdrawn.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("0")), "wrong fee before");

      await game.withdrawPartnerFee(testToken.address, {
        from: OTHER
      });

      assert.equal(0, (await game.getPartnerFeeWithdrawn.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("1")), "wrong fee after");

      //  1
      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      }); //  100 + 100 / 2 = 150

      await game.withdrawPartnerFee(testToken.address, {
        from: OTHER
      });

      assert.equal(0, (await game.getPartnerFeeWithdrawn.call(testToken.address, {
        from: OTHER
      })).cmp(new BN("2")), "wrong fee after");
    });

    it("should transfer correct amount", async function () {
      let balance_before = await testToken.balanceOf(OTHER);

      await game.withdrawPartnerFee(testToken.address, {
        from: OTHER
      });

      let balance_after = await testToken.balanceOf(OTHER);
      assert.equal(0, balance_before.add(new BN("1")).cmp(balance_after), "Wrong balance_after");
    });
  });

  describe("withdrawReferralFee for ETH", function () {
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
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
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

    it("should fail if no fee", async function () {
      await expectRevert(game.withdrawPartnerFee(constants.ZERO_ADDRESS, {
        from: OWNER
      }), "no fee");
    });

    it("should delete referralFeePending", async function () {
      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0.00165")), "wrong fee before");

      await game.withdrawReferralFee(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })

      assert.equal(0, (await game.getReferralFeePending.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0")), "wrong fee after");
    });

    it("should update referralFeeWithdrawn", async function () {
      assert.equal(0, (await game.getReferralFeeWithdrawn.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0")), "wrong fee before");

      await game.withdrawReferralFee(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      });

      assert.equal(0, (await game.getReferralFeeWithdrawn.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0.00165")), "wrong fee after");
    });

    it("should update referralFeeWithdrawnTotal", async function () {
      //  0
      assert.equal(0, (await game.getReferralFeeWithdrawnTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0")), "wrong fee before");

      await game.withdrawReferralFee(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })

      assert.equal(0, (await game.getReferralFeeWithdrawnTotal.call(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      })).cmp(ether("0.00165")), "wrong fee after");

      //  1
      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      await game.withdrawReferralFee(constants.ZERO_ADDRESS, {
        from: OPPONENT_REFERRAL_1
      });

      assert.equal(0, (await game.getReferralFeeWithdrawnTotal.call(constants.ZERO_ADDRESS, {
        from: OPPONENT_REFERRAL_1
      })).cmp(ether("0.0033")), "wrong fee after 1");
    });

    it("should transfer correct amount", async function () {
      let balance_before = await balance.current(CREATOR_REFERRAL_0, "wei");

      let tx = await game.withdrawReferralFee(constants.ZERO_ADDRESS, {
        from: CREATOR_REFERRAL_0
      });

      let gasUsed = new BN(tx.receipt.gasUsed);
      let txInfo = await web3.eth.getTransaction(tx.tx);
      let gasPrice = new BN(txInfo.gasPrice);
      let gasSpent = gasUsed.mul(gasPrice);

      let balance_after = await balance.current(CREATOR_REFERRAL_0, "wei");
      assert.equal(0, balance_before.add(ether("0.00165")).sub(gasSpent).cmp(balance_after), "Wrong balance_after");
    });
  });

  describe("withdrawReferralFee for Token", function () {
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

      await game.updatePartner(OTHER);

      await game.startGame(testToken.address, 100, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 100, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 100, 1, OPPONENT_REFERRAL_1, {
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

    it("should fail if no fee", async function () {
      await expectRevert(game.withdrawReferralFee(testToken.address, {
        from: OWNER
      }), "no fee");
    });

    it("should delete referralFeePending", async function () {
      assert.equal(1, (await game.getReferralFeePending.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(new BN("0")), "wrong fee before");

      await game.withdrawReferralFee(testToken.address, {
        from: CREATOR_REFERRAL_0
      })

      assert.equal(0, (await game.getReferralFeePending.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(new BN("0")), "wrong fee after");
    });

    it("should update referralFeeWithdrawn", async function () {
      assert.equal(0, (await game.getReferralFeeWithdrawn.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(new BN("0")), "wrong fee before");

      await game.withdrawReferralFee(testToken.address, {
        from: CREATOR_REFERRAL_0
      });

      assert.equal(0, (await game.getReferralFeeWithdrawn.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(new BN("1")), "wrong fee after");
    });

    it("should update referralFeeWithdrawnTotal", async function () {
      //  0
      assert.equal(0, (await game.getReferralFeeWithdrawnTotal.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(new BN("0")), "wrong fee before");

      await game.withdrawReferralFee(testToken.address, {
        from: CREATOR_REFERRAL_0
      });

      assert.equal(0, (await game.getReferralFeeWithdrawnTotal.call(testToken.address, {
        from: CREATOR_REFERRAL_0
      })).cmp(new BN("1")), "wrong fee after");

      //  1
      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      }); //  100 + 100 / 2 = 150

      await game.withdrawReferralFee(testToken.address, {
        from: OPPONENT_REFERRAL_1
      });

      assert.equal(0, (await game.getReferralFeeWithdrawnTotal.call(testToken.address, {
        from: OPPONENT_REFERRAL_1
      })).cmp(new BN("2")), "wrong fee after");
    });

    it("should transfer correct amount", async function () {
      let balance_before = await testToken.balanceOf(CREATOR_REFERRAL_0);

      await game.withdrawReferralFee(testToken.address, {
        from: CREATOR_REFERRAL_0
      });

      let balance_after = await testToken.balanceOf(CREATOR_REFERRAL_0);
      assert.equal(0, balance_before.add(new BN("1")).cmp(balance_after), "Wrong balance_after");
    });
  });

  describe("withdrawDevFee for ETH", function () {
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
      await game.joinGame(constants.ZERO_ADDRESS, 0, 1, OPPONENT_REFERRAL_1, {
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

    it("should fail if no fee", async function () {
      await game.withdrawDevFee(constants.ZERO_ADDRESS);

      await expectRevert(game.withdrawDevFee(constants.ZERO_ADDRESS), "no fee");
    });

    it("should delete devFeePending", async function () {
      assert.equal(0, (await game.getDevFeePending.call(constants.ZERO_ADDRESS)).cmp(ether("0.00165")), "wrong fee before");

      await game.withdrawDevFee(constants.ZERO_ADDRESS);

      assert.equal(0, (await game.getDevFeePending.call(constants.ZERO_ADDRESS)).cmp(ether("0")), "wrong fee after");
    });

    it("should update devFeeWithdrawn", async function () {
      assert.equal(0, (await game.getDevFeeWithdrawn.call(constants.ZERO_ADDRESS)).cmp(ether("0")), "wrong fee before");

      await game.withdrawDevFee(constants.ZERO_ADDRESS);

      assert.equal(0, (await game.getDevFeeWithdrawn.call(constants.ZERO_ADDRESS)).cmp(ether("0.00165")), "wrong fee after");
    });

    it("should update devFeeWithdrawnTotal", async function () {
      //  0
      assert.equal(0, (await game.getDevFeeWithdrawnTotal.call(constants.ZERO_ADDRESS)).cmp(ether("0")), "wrong fee before");

      await game.withdrawDevFee(constants.ZERO_ADDRESS);

      assert.equal(0, (await game.getDevFeeWithdrawnTotal.call(constants.ZERO_ADDRESS)).cmp(ether("0.00165")), "wrong fee after");

      //  1
      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(constants.ZERO_ADDRESS, 0, {
        from: OPPONENT_1
      }); //  0.11 + 0.11 / 2 = 0.165

      await game.withdrawDevFee(constants.ZERO_ADDRESS);

      assert.equal(0, (await game.getDevFeeWithdrawnTotal.call(constants.ZERO_ADDRESS)).cmp(ether("0.0033")), "wrong fee after 1");
    });

    it("should transfer correct amount", async function () {
      let balance_before = await balance.current(OWNER, "wei");

      let tx = await game.withdrawDevFee(constants.ZERO_ADDRESS);

      let gasUsed = new BN(tx.receipt.gasUsed);
      let txInfo = await web3.eth.getTransaction(tx.tx);
      let gasPrice = new BN(txInfo.gasPrice);
      let gasSpent = gasUsed.mul(gasPrice);

      let balance_after = await balance.current(OWNER, "wei");
      assert.equal(0, balance_before.add(ether("0.00165")).sub(gasSpent).cmp(balance_after), "Wrong balance_after");
    });
  });

  describe("withdrawReferralFee for Token", function () {
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

      await game.updatePartner(OTHER);

      await game.startGame(testToken.address, 200, creatorHash, CREATOR_REFERRAL_0, {
        from: CREATOR_0
      });

      await game.joinGame(testToken.address, 200, 2, OPPONENT_REFERRAL_0, {
        from: OPPONENT_0
      });
      await game.joinGame(testToken.address, 200, 1, OPPONENT_REFERRAL_1, {
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
      }); //  200 + 200 / 2 = 300
    });

    it("should fail if no fee", async function () {
      await game.withdrawDevFee(testToken.address);

      await expectRevert(game.withdrawReferralFee(testToken.address), "no fee");
    });

    it("should delete devFeePending", async function () {
      assert.equal(1, (await game.getDevFeePending.call(testToken.address)).cmp(new BN("0")), "wrong fee before");

      await game.withdrawDevFee(testToken.address);

      assert.equal(0, (await game.getDevFeePending.call(testToken.address)).cmp(new BN("0")), "wrong fee after");
    });

    it("should update devFeeWithdrawn", async function () {
      assert.equal(0, (await game.getDevFeeWithdrawn.call(testToken.address)).cmp(new BN("0")), "wrong fee before");

      await game.withdrawDevFee(testToken.address);

      assert.equal(0, (await game.getDevFeeWithdrawn.call(testToken.address)).cmp(new BN("3")), "wrong fee after");
    });

    it("should update devFeeWithdrawnTotal", async function () {
      //  0
      assert.equal(0, (await game.getDevFeeWithdrawnTotal.call(testToken.address)).cmp(new BN("0")), "wrong fee before");

      await game.withdrawDevFee(testToken.address);
      assert.equal(0, (await game.getDevFeeWithdrawnTotal.call(testToken.address)).cmp(new BN("3")), "wrong fee after");

      //  1
      //  withdraw OPPONENT_1
      game.withdrawPendingPrizes(testToken.address, 0, {
        from: OPPONENT_1
      }); //  200 + 200 / 2 = 300

      await game.withdrawDevFee(testToken.address);
      assert.equal(0, (await game.getDevFeeWithdrawnTotal.call(testToken.address)).cmp(new BN("6")), "wrong fee after");
    });

    it("should transfer correct amount", async function () {
      let balance_before = await testToken.balanceOf(OWNER);

      await game.withdrawDevFee(testToken.address);

      let balance_after = await testToken.balanceOf(OWNER);
      assert.equal(0, balance_before.add(new BN("3")).cmp(balance_after), "Wrong balance_after");
    });
  });
});