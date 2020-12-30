// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./PMCGovernanceCompliant.sol";
import "./PMCFeeManager.sol";
import "./PMCStaking.sol";
import "./PMCRaffle.sol";

/**
  * @notice Deplyment flow:
  * 1. Deploy PMCt;
  * 2. Deploy Game(PMCt);
  * 3. Add Game to minters for PMCt;
  * 4. Deploy Governance(PMCt, Game);
 */

contract PMCCoinFlipContract is PMCGovernanceCompliant, PMCFeeManager, PMCStaking, PMCRaffle {
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
  uint256 private constant FEES_AND_TOKEN_PERCENTAGE = 5;

  mapping(address => uint256) public betsTotal; //  0x0 - ETH, 0x... - token
  mapping(address => mapping(address => uint256)) public playerBetTotal;    //  token => (player => amount)
  mapping(address => mapping(address => uint256)) public playerWithdrawTotal;   //  token => (player => amount)
  mapping(address => uint256) public playerWithdrawPMCtTotal;

  mapping(address => mapping(address => uint256[])) public gamesParticipated;    //  token => (player => amount)
  mapping(address => mapping(address => uint256)) public gamesParticipatedIdxToStartCheckForPendingWithdrawal; //  token => (player => idx); game idx, that should be started while checking for gamesParticipated for player

  mapping(address => Game[]) private games; //  0x0 - ETH, 0x... - token

  modifier onlyCorrectCoinSide(CoinSide _coinSide) {
    require(_coinSide == CoinSide.heads || _coinSide == CoinSide.tails, "Wrong side");
    _;
  }
  
  modifier onlyWhileRunningGame(address _token) {
    require(gamesStarted(_token) > gamesFinished(_token), "No running games");
    _;
  }

  modifier onlyNonZeroAddress(address _address) {
    require(_address != address(0), "address(0)");
    _;
  }

  event GameStarted(uint256 id, address token);
  event GameJoined(uint256 id, address token, address opponent);
  event GameFinished(uint256 id, address token, bool timeout);
  event PrizeWithdrawn(address player, address token, uint256 prize, uint256 tokens);

  constructor(address _pmct) PMCStaking(_pmct) {
  }


  //  <-- GAMEPLAY
  
  //  <-- START
  function startGame(address _token, uint256 _tokens, bytes32 _coinSideHash, address _referral) external payable {
    require(_coinSideHash[0] != 0, "Empty hash");
    
    (_token == address(0)) ? _startGameETH(_coinSideHash, _referral) : _startGameToken(_token, _tokens, _coinSideHash, _referral);
  }
  
  function _startGameETH(bytes32 _coinSideHash, address _referral) private payable {
    require(msg.value >= gameMinBet, "Wrong bet");
    require(gamesStarted(address(0)) == gamesFinished(address(0)), "Game is running");

    uint256 nextIdx = gamesStarted(address(0));
    games[address(0)][nextIdx].creatorCoinSide = _coinSideHash;
    games[address(0)][nextIdx].creator = msg.sender;
    games[address(0)][nextIdx].bet = msg.value;
    games[address(0)][nextIdx].startBlock = block.number;
    games[address(0)][nextIdx].referral[msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipated[address(0)][msg.sender].push(nextIdx);
    addRafflePlayer(msg.sender);
    increaseBets(address(0), msg.value);

    emit GameStarted(nextIdx, address(0));
  }
  
  function _startGameToken(address _token, uint256 _tokens, bytes32 _coinSideHash, address _referral) private onlyAllowedTokens(_token, _tokens) {
    require(gamesStarted(_token) == gamesFinished(_token), "Game is running");

    uint256 nextIdx = gamesStarted(_token);
    games[_token][nextIdx].creatorCoinSide = _coinSideHash;
    games[_token][nextIdx].creator = msg.sender;
    games[_token][nextIdx].bet = _tokens;
    games[_token][nextIdx].startBlock = block.number;
    games[_token][nextIdx].referral[msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipated[_token][msg.sender].push(nextIdx);
    increaseBets(_token, _tokens);
    
    ERC20(_token).transferFrom(msg.sender, address(this), _tokens);

    emit GameStarted(nextIdx, _token);
  }
  //  START -->

  //  <-- JOIN
  function joinGame(address _token, uint256 _tokens, CoinSide _coinSide, address _referral) external payable onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame(_token) {
    (_token == address(0)) ? _joinGameETH(_coinSide, _referral) : _joinGameToken(_token, _tokens, _coinSide, _referral);
  }
  
  function _joinGameETH(CoinSide _coinSide, address _referral) private payable {
    Game storage game = lastStartedGame(address(0));
    
    require(msg.value == game.bet, "Wrong bet");
    require(game.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Game time out");
    require(game.opponentCoinSide[msg.sender] == CoinSide.none, "Already joined");

    game.opponentCoinSide[msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);
    game.referral[msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipated[address(0)][msg.sender].push(gamesStarted([address(0)]).sub(1));
    addRafflePlayer(msg.sender);
    increaseBets(address(0), msg.value);

    emit GameJoined(gamesStarted(address(0).sub(1)), address(0), msg.sender);
  }
  
  function _joinGameToken(address _token, uint256 _tokens, CoinSide _coinSide, address _referral) private onlyAllowedTokens(_token, _tokens) {
    Game storage game = lastStartedGame(_token);
    
    require(_tokens == game.bet, "Wrong bet");
    require(game.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Game time out");
    require(game.opponentCoinSide[msg.sender] == CoinSide.none, "Already joined");

    game.opponentCoinSide[msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);
    game.referral[msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipated[_token][msg.sender].push(gamesStarted([_token]).sub(1));
    increaseBets(_token, _tokens);

    ERC20(_token).transferFrom(msg.sender, address(this), _tokens);
    
    emit GameJoined(gamesStarted(_token).sub(1), _token, msg.sender);
  }
  //  JOIN -->

  
  //  <-- PLAY
  function playGame(address _token, CoinSide _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame(_token) {
    (_token == address(0)) ? _playGameETH(_coinSide, _seedHash) : _playGameToken(_token, _coinSide, _seedHash);
  }
  
  function _playGameETH(CoinSide _coinSide, bytes32 _seedHash) private {
    Game storage game = lastStartedGame(address(0));
    
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

    runRaffle();
    moveOngoingRewardPoolToStakingRewards();

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(gamesStarted(address(0)).sub(1), address(0), false);
  }
  
  function _playGameToken(address _token, CoinSide _coinSide, bytes32 _seedHash) private onlyNonZeroAddress(_token) {
    Game storage game = lastStartedGame(_token);
    
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

    runRaffle();
    moveOngoingRewardPoolToStakingRewards();

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(gamesStarted(_token).sub(1), _token, false);
      
  }
  //  PLAY -->

  //  <-- FINISH ON TIMEOUT
  function finishTimeoutGame(address _token) external onlyWhileRunningGame(_token) {
    (_token == address(0)) ? _finishTimeoutGameETH() : _finishTimeoutGameToken(_token);
  }
  
  function _finishTimeoutGameETH() private {
    Game storage game = lastStartedGame(address(0));

    require(game.startBlock.add(uint256(gameMaxDuration)) < block.number, "Still running");

    uint256 opponents = game.heads.add(game.tails);
    if (opponents > 0) {
      uint256 opponentsReward = game.bet.div(opponents);
      game.opponentPrize = game.bet.add(opponentsReward);
    } else {
      addToRaffleJackpot(game.bet);
    }

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(gamesStarted(address(0)).sub(1), address(0), true);
  }
  
  function _finishTimeoutGameToken(address _token) private onlyNonZeroAddress(_token) {
    Game storage game = lastStartedGame(_token);

    require(game.startBlock.add(uint256(gameMaxDuration)) < block.number, "Still running");

    uint256 opponents = game.heads.add(game.tails);
    if (opponents > 0) {
      uint256 opponentsReward = game.bet.div(opponents);
      game.opponentPrize = game.bet.add(opponentsReward);
    } else {
      addToRaffleJackpot(game.bet);
    }

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(gamesStarted(_token).sub(1), _token, true);
  }
  
  function moveOngoingRewardPoolToStakingRewards() private {
    replenishRewardPool(stakeRewardPoolOngoing);  //  ETH only
    delete stakeRewardPoolOngoing;
  }
  //  FINISH ON TIMEOUT -->
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
    playerWithdrawPMCtTotal[msg.sender] = playerWithdrawPMCtTotal[msg.sender].add(pendingTokens);
    PMCt(pmct).mint(msg.sender, pendingTokens);

    //  fee
    uint256 feeTotal = pendingPrize.sub(transferAmount);
    uint256 singleFee = feeTotal.div(FEES_AND_TOKEN_PERCENTAGE);
    uint256 unusedFee;
    
    //  partner fee
    (partner != address(0)) ? addFee(FeeType.partner, singleFee, address(0)) : unusedFee = singleFee;

    //  dev fee
    addFee(FeeType.dev, singleFee, address(0));

    //  staking
    addFee(FeeType.stake, singleFee, address(0));

    //  raffle
    uint256 stakingFee = (unusedFee == 0) ? singleFee : singleFee.add(unusedFee);
    addToRaffleJackpot(stakingFee);
    

    emit PrizeWithdrawn(msg.sender, pendingPrize, pendingTokens);
  }
  //  PENDING WITHDRAWAL -->


  function increaseBets(address _token, uint256 _amount) private {
    playerBetTotal[_token][msg.sender] = playerBetTotal[_token][msg.sender].add(_amount);
    betsTotal[_token] = betsTotal[_token].add(_amount);
  }

  function lastStartedGame(address _token) private view returns (Game storage) {
    uint256 ongoingGameIdx = gamesStarted(_token).sub(1);
    return games[_token][ongoingGameIdx];
  }

  function gamesStarted(address _token) public view returns (uint256) {
    return games[_token].length;
  }

  function gamesFinished(address _token) public view returns (uint256) {
    uint256 startedGames = games[_token].length;
    if (startedGames > 0) {
      Game storage game = lastStartedGame(_token);
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
      require(_idx < games[_token].length, "Wrong game idx");

      creatorCoinSide = games[_token][_idx].creatorCoinSide;
      creator = games[_token][_idx].creator;
      bet = games[_token][_idx].bet;
      startBlock = games[_token][_idx].startBlock;
      heads = games[_token][_idx].heads;
      tails = games[_token][_idx].tails;
      prize = games[_token][_idx].opponentPrize;
      if (_addr != address(0)) {
        opponentCoinSide = games[_token][_idx].opponentCoinSide[_addr];
      }
      referral = games[_token][_idx].referral[_addr];
  }

  /**
   * PMCGovernanceCompliant
   */
  function updateGameMinBet(address _token, uint256 _gameMinBet) external override onlyGovernance(msg.sender) {
    require(_gameMinBet > 0, "Wrong gameMinBet");

    Game storage game = lastStartedGame();
    bool later = !isGameFinished(game);
    updateGameMinBetLater(_gameMinBet, later);
  }

  function updateGameMaxDuration(uint16 _gameMaxDuration) external override onlyGovernance(msg.sender) {
    require(_gameMaxDuration > 0, "Wrong duration");

    Game storage game = lastStartedGame();
    bool later = !isGameFinished(game);
    updateGameMaxDurationLater(_gameMaxDuration, later);
  }
}