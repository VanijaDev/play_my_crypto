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
    bool running;
    bytes32 creatorCoinSide;  //  startGame: hash(coinSide + saltStr), playGame: hash(coinSide)
    address creator;
    uint256 idx;
    uint256 bet;
    uint256 startBlock;
    uint256 heads;
    uint256 tails;
    uint256 creatorPrize; 
    uint256 opponentPrize;
  }

  uint8 private constant FEE_NUMBER_ETH = 5;
  uint8 private constant PRIZE_PERCENTAGE_ETH = 95;
  
  uint8 private constant FEE_NUMBER_TOKEN = 4;
  uint8 private constant PRIZE_PERCENTAGE_TOKEN = 96;
  uint8 private constant MIN_TOKENS_TO_BET = 100;
  
  uint8 private constant PMCT_TOKEN_PERCENTAGE = 5;

  mapping(address => uint256) public betsTotal; //  token => amount, 0x0 - ETH
  mapping(address => mapping(address => uint256)) public playerBetTotal;    //  token => (player => amount)
  mapping(address => mapping(address => uint256)) public playerWithdrawTotal;   //  token => (player => amount)
  mapping(address => uint256) public playerWithdrawPMCtTotal;

  mapping(address => mapping(address => uint256[])) public gamesParticipatedToCheckPrize;    //  token => (player => game idxs)

  mapping(address => Game[]) private games; //  token => Game[], 0x0 - ETH
  mapping(address => mapping(uint256 => mapping(address => CoinSide))) opponentCoinSideInGame; //  token => (gameId => (address => CoinSide))
  mapping(address => mapping(uint256 => mapping(address => address))) referralInGame;          //  token => (gameId => (address => address))

  modifier onlyCorrectCoinSide(CoinSide _coinSide) {
    require(_coinSide == CoinSide.heads || _coinSide == CoinSide.tails, "Wrong side");
    _;
  }
  
  modifier onlyWhileRunningGame(address _token) {
    require(_lastStartedGame(_token).running, "No running games");
    _;
  }

  event GameStarted(address token, uint256 id);
  event GameJoined(address token, uint256 id, address opponent);
  event GameFinished(address token, uint256 id, bool timeout);
  event PrizeWithdrawn(address token, address player, uint256 prize, uint256 pmct);

  /**
   * @dev Constructor.
   * @param _pmct PMCt address.
   */
  constructor(address _pmct) PMCStaking(_pmct) {
  }


  //  <-- GAMEPLAY
  /**
   * @dev Starts game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _tokens Token amount.
   * @param _coinSideHash Hashed coin side.
   * @param _referral Referral address.
   */
  function startGame(address _token, uint256 _tokens, bytes32 _coinSideHash, address _referral) external payable {
    if (_token != address(0)) {
      require(isTokenSupportedToBet[_token], "Wrong token");
      require(msg.value == 0, "Wrong value");
      require(_tokens > MIN_TOKENS_TO_BET, "Wrong tokens bet");
      require(ERC20(_token).transferFrom(msg.sender, address(this), _tokens), "Tokens not allowed");
    } else {
      require(msg.value > gameMinBet, "Wrong ETH bet");
    }

    require(_coinSideHash[0] != 0, "Empty hash");
    require(gamesStarted(_token) == gamesFinished(_token), "Game is running");
    
    uint256 nextIdx = gamesStarted(_token);
    Game memory game = Game(true, _coinSideHash, msg.sender, nextIdx, (_token != address(0)) ? _tokens : msg.value, block.number, 0, 0, 0, 0);
    games[_token].push(game);
    
    referralInGame[_token][nextIdx][msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipatedToCheckPrize[_token][msg.sender].push(nextIdx);
    (_token != address(0)) ? _increaseBets(_token, _tokens) : _increaseBets(_token, msg.value);

    emit GameStarted(_token, nextIdx);
  }

  /**
   * @dev Joins game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _tokens Token amount.
   * @param _coinSide Coin side.
   * @param _referral Referral address.
   */
  function joinGame(address _token, uint256 _tokens, CoinSide _coinSide, address _referral) external payable onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame(_token) {
    Game storage game = _lastStartedGame(_token);

    if (_token != address(0)) {
      require(msg.value == 0, "Wrong value");
      require(_tokens == game.bet, "Wrong bet");
      require(ERC20(_token).transferFrom(msg.sender, address(this), _tokens), "Tokens not allowed");
    } else {
      require(msg.value == game.bet, "Wrong bet");
    }

    require(game.startBlock.add(gameMaxDuration) >= block.number, "Game time out");
    require(opponentCoinSideInGame[_token][gamesStarted(_token)][msg.sender] == CoinSide.none, "Already joined");

    opponentCoinSideInGame[_token][gamesStarted(_token)][msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);
    referralInGame[_token][gamesStarted(_token)][msg.sender] = (_referral != address(0)) ? _referral : owner();

    uint256 gameIdx = gamesStarted(_token).sub(1);
    gamesParticipatedToCheckPrize[_token][msg.sender].push(gameIdx);
    (_token != address(0)) ? _increaseBets(_token, _tokens) : _increaseBets(_token, msg.value);

    emit GameJoined(_token, gameIdx, msg.sender);
  }
  
  /**
   * @dev Plays game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _coinSide Coin side, that was used on game start.
   * @param _seedHash Hash of the seed string, that was used to generate hashed coing side on game start.
   */
  function playGame(address _token, CoinSide _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame(_token) {
    Game storage game = _lastStartedGame(_token);

    require(game.creator == msg.sender, "Not creator");
    require(game.startBlock.add(gameMaxDuration) >= block.number, "Time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == game.creatorCoinSide, "Wrong hash value");

    delete game.running;
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

      runRaffle(_token);
      if (_token == address(0)) {
        _moveOngoingRewardPoolToStakingRewards_ETH_ONLY();
      }
    } else {
      addToRaffleNoPlayer(_token, game.bet); //  creator only in game
    }

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(_token, gamesStarted(_token).sub(1), false);
  }

  /**
   * @dev Finishes game on timeout.
   * @param _token ERC-20 token address. 0x0 - ETH
   */
  function finishTimeoutGame(address _token) external onlyWhileRunningGame(_token) {
    Game storage game = _lastStartedGame(_token);

    require(game.startBlock.add(gameMaxDuration) < block.number, "Still running");

    delete game.running;
    uint256 opponents = game.heads.add(game.tails);
    if (opponents > 0) {
      uint256 opponentReward = game.bet.div(opponents);
      game.opponentPrize = game.bet.add(opponentReward);
    } else {
      addToRaffleNoPlayer(_token, game.bet); //  creator only in game
    }

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(_token, gamesStarted(_token).sub(1), true);
  }
  
  /**
   * @dev Moves stake fee (ETH) to staking reward pool.
   */
  function _moveOngoingRewardPoolToStakingRewards_ETH_ONLY() private {
    if (stakeRewardPoolOngoing_ETH > 0) {
      replenishRewardPool(stakeRewardPoolOngoing_ETH);
      delete stakeRewardPoolOngoing_ETH;
    }
  }
  //  GAMEPLAY -->


  //  <-- PENDING WITHDRAWAL
  /**
   * @notice Referral fees not updated.
   * @dev Calculates prize to withdraw for sender.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   * @return prize Prize amount.
   * @return pmct_tokens PMCt amount.
   */
  function pendingPrizeToWithdraw(address _token, uint256 _maxLoop) external returns(uint256 prize, uint256 pmct_tokens) {
    return _pendingPrizeToWithdrawAndReferralFeesUpdate(_token, _maxLoop, false);
  }

  /**
   * @dev Calculates prize to withdraw for sender.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   * @param _updateReferralFees Boolean value whether to update referral fees.
   * @return prize Prize amount.
   * @return pmct_tokens PMCt amount.
   */
  function _pendingPrizeToWithdrawAndReferralFeesUpdate(address _token, uint256 _maxLoop, bool _updateReferralFees) private returns(uint256 prize, uint256 pmct_tokens) {
    uint256 gamesToCheck = gamesParticipatedToCheckPrize[_token][msg.sender].length;
    require(gamesToCheck > 0, "No games to check");

    uint256 loop = ((_maxLoop > 0) && (_maxLoop < gamesToCheck)) ? _maxLoop : gamesToCheck;

    while (loop > 0) {
      Game storage game = games[_token][gamesParticipatedToCheckPrize[_token][msg.sender].length.sub(1)];

      if (msg.sender == game.creator) {
        if (game.creatorPrize > 0) {
          prize = prize.add(game.creatorPrize);
          pmct_tokens = pmct_tokens.add(game.creatorPrize.div(100).mul(PMCT_TOKEN_PERCENTAGE));

          if (_updateReferralFees) {
            address referral = referralInGame[_token][game.idx][msg.sender];
            uint256 referralFee = game.creatorPrize.div(100);
            addFee(FeeType.referral, _token, referralFee, referral);
          }
        }
      } else {
        if (game.opponentPrize > 0) {
          prize = prize.add(game.opponentPrize);

          bool timeout = (game.creatorCoinSide != bytes32(uint256(CoinSide.heads)) && game.creatorCoinSide != bytes32(uint256(CoinSide.tails)));
          if (timeout) {
            pmct_tokens = pmct_tokens.add(game.opponentPrize.div(100).mul(PMCT_TOKEN_PERCENTAGE));
          }

          if (_updateReferralFees) {
            address referral = referralInGame[_token][game.idx][msg.sender];
            uint256 referralFee = game.opponentPrize.div(100);
            addFee(FeeType.referral, _token, referralFee, referral);
          }
        }
      }
      gamesParticipatedToCheckPrize[_token][msg.sender].pop();
      loop = loop.sub(1);
    }
  }

  /**
   * @dev Withdraws prize for sender.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   */
  function withdrawPendingPrizes(address _token, uint256 _maxLoop) external {
    uint256 pendingPrize;
    uint256 pendingPMCt;
    (pendingPrize, pendingPMCt) = _pendingPrizeToWithdrawAndReferralFeesUpdate(_token, _maxLoop, true);
    
    playerWithdrawTotal[_token][msg.sender] = playerWithdrawTotal[_token][msg.sender].add(pendingPrize);

    //  PMCt
    if (pendingPMCt > 0) {
      playerWithdrawPMCtTotal[msg.sender] = playerWithdrawPMCtTotal[msg.sender].add(pendingPMCt);
      PMCt(pmct).mint(msg.sender, pendingPMCt);
    }

    //  ETH / token
    uint256 transferAmount;
    if (_token != address(0)) {
      transferAmount = pendingPrize.mul(PRIZE_PERCENTAGE_TOKEN).div(100);
      ERC20(_token).transfer(msg.sender, transferAmount);
    } else {
      transferAmount = pendingPrize.mul(PRIZE_PERCENTAGE_ETH).div(100);
      msg.sender.transfer(transferAmount);
    }
    
    //  fee
    uint256 feeTotal = pendingPrize.sub(transferAmount);
    uint256 singleFee = (_token != address(0)) ? feeTotal.div(FEE_NUMBER_TOKEN) : feeTotal.div(FEE_NUMBER_ETH);
    uint256 raffleFee = singleFee;

    //  partner fee
    if (partner != address(0)) {
      addFee(FeeType.partner, _token, singleFee, partner);
    } else {
      raffleFee = raffleFee.add(singleFee);
    }

    //  raffle
    addToRaffle(_token, raffleFee, msg.sender);

    //  staking
    if (_token == address(0)) {
      addFee(FeeType.stake, _token, singleFee, address(0));
    }
    
    //  dev fee
    uint256 usedFee = (_token != address(0)) ? singleFee.mul(uint256(FEE_NUMBER_TOKEN).sub(1)) : singleFee.mul(uint256(FEE_NUMBER_ETH).sub(1));
    addFee(FeeType.dev, _token, feeTotal.sub(usedFee), address(0));

    emit PrizeWithdrawn(_token, msg.sender, pendingPrize, pendingPMCt);
  }
  //  PENDING WITHDRAWAL -->


  /**
   * @dev Increases bets total & for sender.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _amount Bet value.
   */
  function _increaseBets(address _token, uint256 _amount) private {
    playerBetTotal[_token][msg.sender] = playerBetTotal[_token][msg.sender].add(_amount);
    betsTotal[_token] = betsTotal[_token].add(_amount);
  }

  /**
   * @dev Gets last started game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @return Game obj.
   */
  function _lastStartedGame(address _token) private view returns (Game storage) {
    if (_token != address(0)) {
      require(isTokenSupportedToBet[_token], "Wrong token");
    }

    uint256 ongoingGameIdx = gamesStarted(_token).sub(1);
    return games[_token][ongoingGameIdx];
  }

  /**
   * @dev Gets number of started games.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @return Number of started games.
   */
  function gamesStarted(address _token) public view returns (uint256) {
    return games[_token].length;
  }

  /**
   * @dev Gets number of finished games.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @return Number of finished games.
   */
  function gamesFinished(address _token) public view returns (uint256) {
    uint256 startedGames = gamesStarted(_token);
    if (startedGames > 0) {
      Game storage game = _lastStartedGame(_token);
      return (game.running) ? startedGames.sub(1) : startedGames;
    }
    
    return 0;
  }

  /**
   * @dev Gets number of finished games.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _idx Game index in games for token.
   * @param _addr Player address to get info for.
   * @return running is game running.
   * @return creatorCoinSide Coin side of creator. Hash is set before creator played the game.
   * @return creator Creator address.
   * @return bet Bet value.
   * @return startBlock Block, when game was started.
   * @return heads Heads amount.
   * @return tails Tails amount.
   * @return creatorPrize Prize for creator.
   * @return opponentPrize Prize for each opponent.
   * @return opponentCoinSide Coin side for passed address.
   * @return referral Referral address for passed address.
   */

  function gameInfo(address _token, uint256 _idx, address _addr) external view returns(
    bool running,
    bytes32 creatorCoinSide,
    address creator,
    uint256 bet,
    uint256 startBlock,
    uint256 heads,
    uint256 tails,
    uint256 creatorPrize,
    uint256 opponentPrize,
    CoinSide opponentCoinSide,
    address referral) {
      require(_idx < gamesStarted(_token), "Wrong game idx");

      running = games[_token][_idx].running;
      creatorCoinSide = games[_token][_idx].creatorCoinSide;
      creator = games[_token][_idx].creator;
      bet = games[_token][_idx].bet;
      startBlock = games[_token][_idx].startBlock;
      heads = games[_token][_idx].heads;
      tails = games[_token][_idx].tails;
      creatorPrize = games[_token][_idx].creatorPrize;
      opponentPrize = games[_token][_idx].opponentPrize;
      if (_addr != address(0)) {
        opponentCoinSide = opponentCoinSideInGame[_token][_idx][_addr];
        referral = referralInGame[_token][_idx][_addr];
      }
  }

  /**
   * PMCGovernanceCompliant
   */
  function updateGameMinBet(uint256 _gameMinBet) external override onlyGovernance(msg.sender) {
    require(_gameMinBet > 0, "Wrong gameMinBet");

    Game storage game = _lastStartedGame(address(0));
    bool later = game.running;
    updateGameMinBetLater(_gameMinBet, later);
  }

  function updateGameMaxDuration(uint16 _gameMaxDuration) external override onlyGovernance(msg.sender) {
    require(_gameMaxDuration > 0, "Wrong duration");

    Game storage game = _lastStartedGame(address(0));
    bool later = game.running;
    updateGameMaxDurationLater(_gameMaxDuration, later);
  }
}