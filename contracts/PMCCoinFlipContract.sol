// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./PMCGovernanceCompliant.sol";
import "./PMCFeeManager.sol";
import "./PMCMortable.sol";
import "./PMCStaking.sol";
import "./PMCRaffle.sol";

/**
  * @notice Deplyment flow:
  * 1. Deploy PMCt;
  * 2. Deploy Game(PMCt);
  * 3. Add Game to minters for PMCt;
  * 4. Deploy Governance(PMCt, Game);
 */

contract PMCCoinFlipContract is PMCGovernanceCompliant, PMCFeeManager, PMCMortable, PMCStaking, PMCRaffle {
  using SafeMath for uint256;

  enum CoinSide {
    none,
    heads,
    tails
  }

  struct Game {
    bytes32 creatorCoinSide;  //  coinSide + saltStr = hash - in startGame, coinSide - in playGame
    address creator;
    uint256 bet;
    uint256 startBlock;
    uint256 heads;
    uint256 tails;
    uint256 creatorPrize; 
    uint256 opponentPrize; 
    mapping(address => CoinSide) opponentCoinSide;
    mapping(address => address) referral;
  }

  uint256 private constant PRIZE_PERCENTAGE = 95;
  uint256 private constant FEE_DIVISION = 5;
  uint256 public constant TOKEN_PERCENTAGE = 5;

  uint256 public betsTotal;
  mapping(address => uint256) public playerBetTotal;
  mapping(address => uint256) public playerWithdrawTotal;
  mapping(address => uint256) public playerWithdrawTokensTotal;

  mapping(address => uint256[]) public gamesParticipated;
  mapping(address => uint256) public gamesParticipatedIdxToStartCheckForPendingWithdrawal; //  game idx, that should be started while checking for gamesParticipated for player

  Game[] private games;

  modifier onlyCorrectCoinSide(CoinSide _coinSide) {
    require(_coinSide == CoinSide.heads || _coinSide == CoinSide.tails, "Wrong side");
    _;
  }
  
  modifier onlyWhileRunningGame() {
    require(gamesStarted() > gamesFinished(), "No running games");
    _;
  }

  modifier onlyNonZeroAddress(address _address) {
    require(_address != address(0), "Address == 0");
    _;
  }

  event GameStarted(uint256 id);
  event GameJoined(uint256 id, address opponent);
  event GameFinished(uint256 id, bool timeout);
  event PrizeWithdrawn(address player, uint256 prize, uint256 tokens);

  constructor(address _pmct) PMCStaking(_pmct) {
  }


  //  <-- GAMEPLAY
  function startGame(bytes32 _coinSideHash, address _referral) external payable onlyLivable {
    //  test: bytes32: 0x0000000000000000000000000000000000000000000000000000000000000000
    //  test: bytes32: 0x0000000000000000000000000000000000000000000000000000000000000001
    //  test: bytes32: 0x0000000000000000000000000000000000000000000000000000000000000002
    require(_coinSideHash[0] != 0, "Empty hash");
    require(msg.value >= gameMinBet, "value < gameMinBet");
    require(gamesStarted() == gamesFinished(), "Game is running");

    uint256 nextIdx = gamesStarted();
    games[nextIdx].creatorCoinSide = _coinSideHash;
    games[nextIdx].creator = msg.sender;
    games[nextIdx].bet = msg.value;
    games[nextIdx].startBlock = block.number;
    games[nextIdx].referral[msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipated[msg.sender].push(nextIdx);
    addRafflePlayer();
    increaseBets();

    emit GameStarted(nextIdx);
  }

  function joinGame(CoinSide _coinSide, address _referral) external payable onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame {
    Game storage game = lastStartedGame();
    
    require(msg.value == game.bet, "Wrong bet");
    require(game.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Running game time out");
    require(game.opponentCoinSide[msg.sender] == CoinSide.none, "Already joined");

    game.opponentCoinSide[msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);
    game.referral[msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipated[msg.sender].push(gamesStarted().sub(1));
    addRafflePlayer();
    increaseBets();

    emit GameJoined(gamesStarted(), msg.sender);
  }

  function playGame(CoinSide _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame {
    Game storage game = lastStartedGame();
    
    require(game.creator == msg.sender, "Not creator");
    require(game.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == game.creatorCoinSide, "Wrong hash value");

    game.creatorCoinSide = bytes32(uint256(_coinSide));
    (_coinSide == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);
  
    uint256 opponentsReward;
    if ((game.heads > 0) && (game.tails > 0)) {
      opponentsReward = (_coinSide == CoinSide.heads) ? game.bet.mul(game.tails).div(game.heads) : game.bet.mul(game.heads).div(game.tails);
      game.creatorPrize = game.bet.add(opponentsReward);
    } else {
      uint256 opponentsOnly = (game.heads > 0) ? game.heads.sub(1) : game.tails.sub(1);
      if (opponentsOnly > 0) {
        opponentsReward = game.bet.div(opponentsOnly);
      }
    }

    if (opponentsReward > 0) {
      game.opponentPrize = game.bet.add(opponentsReward);
    }

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();
    runRaffle();

    emit GameFinished(gamesStarted(), false);
  }

  function finishTimeoutGame() external onlyWhileRunningGame {
    Game storage game = lastStartedGame();

    require(game.startBlock.add(uint256(gameMaxDuration)) < block.number, "Game still running");

    uint256 opponents = game.heads.add(game.tails);
    if (opponents > 0) {
      uint256 opponentsReward = game.bet.div(opponents);
      game.opponentPrize = game.bet.add(opponentsReward);
    } else {
      increaseOngoingRaffleJackpot(game.bet);
    }

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(gamesStarted(), true);
  }
  //  GAMEPLAY -->


  //  <-- PENDING WITHDRAWAL
  function pendingPrizeToWithdraw(uint256 _maxLoop) external returns(uint256 prize, uint256 tokens) {
    return pendingPrizeToWithdrawAndReferralFeesUpdate(_maxLoop, false);
  }

  function pendingPrizeToWithdrawAndReferralFeesUpdate(uint256 _maxLoop, bool _updateReferralFees) private returns(uint256 prize, uint256 tokens) {
    uint256 startIdx;
    uint256 stopIdx;
    (startIdx, stopIdx) = startStopIdxsInGamesParticipatedToCheckForPendingWithdrawal(_maxLoop);

    for (uint256 i = startIdx; i <= stopIdx; i ++) {
      Game storage game = games[gamesParticipated[msg.sender][i]];

      if (game.creator == msg.sender) {
        if (game.creatorPrize > 0) {
          prize = prize.add(game.creatorPrize);
          tokens = tokens.add(game.creatorPrize.mul(TOKEN_PERCENTAGE).div(100));

          if (_updateReferralFees) {
            address referral = game.referral[msg.sender];
            uint256 referralFee = game.creatorPrize.div(100);
            increaseFee(FeeType.referral, referralFee, referral);
          }
        }
      } else {
        bool timeout = game.creatorCoinSide > bytes32(uint256(CoinSide.tails));
        if (timeout || (game.creatorCoinSide == bytes32(uint256(game.opponentCoinSide[msg.sender])))) {
          prize = prize.add(game.opponentPrize);
          
          if (timeout) {
            tokens = tokens.add(game.opponentPrize.mul(TOKEN_PERCENTAGE).div(100));
          }

          if (_updateReferralFees) {
            address referral = game.referral[msg.sender];
            uint256 referralFee = game.opponentPrize.div(100);
            increaseFee(FeeType.referral, referralFee, referral);
          }
        }
      }
    }
  }

  function startStopIdxsInGamesParticipatedToCheckForPendingWithdrawal(uint256 _maxLoop) private view returns(uint256 startIdx, uint stopIdx) {
    uint256[] memory participatedInGames = gamesParticipated[msg.sender];
    require(participatedInGames.length > 0, "No participated games");
    
    startIdx = gamesParticipatedIdxToStartCheckForPendingWithdrawal[msg.sender];
    stopIdx = (_maxLoop == 0) ? participatedInGames.length.sub(1) : startIdx.add(_maxLoop.sub(1));
    require(stopIdx < participatedInGames.length, "_maxLoop too high");
  }

  function withdrawPendingPrizes(uint256 _maxLoop) external {
    uint256 pendingPrize;
    uint256 pendingTokens;
    (pendingPrize, pendingTokens) = pendingPrizeToWithdrawAndReferralFeesUpdate(_maxLoop, true);
    
    uint256 stopIdx;
    (, stopIdx) = startStopIdxsInGamesParticipatedToCheckForPendingWithdrawal(_maxLoop);
    gamesParticipatedIdxToStartCheckForPendingWithdrawal[msg.sender] = stopIdx.add(1);

    //  ETH
    playerWithdrawTotal[msg.sender] = playerWithdrawTotal[msg.sender].add(pendingPrize);
    uint256 transferAmount = pendingPrize.mul(PRIZE_PERCENTAGE).div(100);
    msg.sender.transfer(transferAmount);

    //  PMCt
    playerWithdrawTokensTotal[msg.sender] = playerWithdrawTokensTotal[msg.sender].add(pendingTokens);
    PMCt(pmct).mint(msg.sender, pendingTokens);

    //  fee
    uint256 feeTotal = pendingPrize.sub(transferAmount);
    uint256 singleFee = feeTotal.div(FEE_DIVISION);
    
    //  partner fee
    (partner != address(0)) ? increaseFee(FeeType.partner, singleFee, address(0)) : increaseOngoingRaffleJackpot(singleFee);

    //  dev fee
    increaseFee(FeeType.dev, singleFee, address(0));

    //  staking
    increaseFee(FeeType.stake, singleFee, address(0));

    //  raffle
    increaseOngoingRaffleJackpot(singleFee);
    

    emit PrizeWithdrawn(msg.sender, pendingPrize, pendingTokens);
  }
  //  PENDING WITHDRAWAL -->


  function increaseBets() private {
    playerBetTotal[msg.sender] = playerBetTotal[msg.sender].add(msg.value);
    betsTotal = betsTotal.add(msg.value);
  }

  function lastStartedGame() private view returns (Game storage game) {
    uint256 ongoingGameIdx = gamesStarted().sub(1);
    game = games[ongoingGameIdx];
  }

  function gamesStarted() public view returns (uint256) {
    return games.length;
  }

  function gamesFinished() public view returns (uint256) {
    uint256 startedGames = games.length;
    if (startedGames > 0) {
      Game storage game = lastStartedGame();
      return isGameFinished(game) ? startedGames : startedGames.sub(1);
    }
    
    return 0;
  }

  function isGameFinished(Game storage _game) private view returns(bool) {
     return (_game.creatorPrize > 0 || _game.opponentPrize > 0);
  }

  function gameInfoBasic(uint256 _idx, address _addr) external view returns(
    bytes32 creatorCoinSide,
    address creator,
    uint256 bet,
    uint256 startBlock,
    uint256 heads,
    uint256 tails,
    uint256 prize,
    CoinSide opponentCoinSide,
    address referral) {
      require(_idx < games.length, "Wrong game idx");

      creatorCoinSide = games[_idx].creatorCoinSide;
      creator = games[_idx].creator;
      bet = games[_idx].bet;
      startBlock = games[_idx].startBlock;
      heads = games[_idx].heads;
      tails = games[_idx].tails;
      prize = games[_idx].opponentPrize;
      if (_addr != address(0)) {
        opponentCoinSide = games[_idx].opponentCoinSide[_addr];
      }
      referral = games[_idx].referral[_addr];
  }

  /**
   * PMCGovernanceCompliant
   */
  function updateGameMinBet(uint256 _gameMinBet) external override onlyGovernance(msg.sender) {
    require(_gameMinBet > 0, "Wrong gameMinBet");

    Game storage game = lastStartedGame();
    bool later = !isGameFinished(game);
    updateGameMinBetLater(_gameMinBet, later);
  }

  function updateGameDuration(uint16 _gameMaxDuration) external override onlyGovernance(msg.sender) {
    require(_gameMaxDuration > 0, "Wrong duration");

    Game storage game = lastStartedGame();
    bool later = !isGameFinished(game);
    updateGameDurationLater(_gameMaxDuration, later);
  }
}