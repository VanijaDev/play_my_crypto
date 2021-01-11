const CoinFlipContract = artifacts.require("PMCCoinFlipContract");
const Governance = artifacts.require("PMCGovernance");
const PMCt = artifacts.require("PMCt");

const {
  BN,
  balance,
  constants,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');

contract("CoinFlipContract", function (accounts) {
  const [OWNER] = accounts[0];

  let pmct;
  let game;
  let governance;

  beforeEach("setup", async function () {
    pmct = await PMCt.new();
    game = await CoinFlipContract.new(pmct.address);
    await pmct.addMinter(game.address);
    governance = await Governance.new(pmct.address, game.address);
  });

  describe("smt", function () {
    it("should ", async function () {
      console.log("Hello World 111");
    });
  });
});