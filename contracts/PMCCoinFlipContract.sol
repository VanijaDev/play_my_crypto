// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./PMCGovernanceCompliant.sol";
import "./PMCFeeManager.sol";
import "./PMCRaffle.sol";
import "./PMC_IStaking.sol";

/**
  * @notice Deplyment flow:
  * 1. Deploy PMCt;
  * 2. Deploy Game(PMCt);
  * 3. Add Game to minters for PMCt;
  * 4. TODO: Deploy Staking(???);
  * 5. TODO: Deploy Governance(PMCt, Game);
 */

contract PMCCoinFlipContract is PMCGovernanceCompliant, PMCFeeManager, PMCRaffle {
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
    uint256 stake;
    uint256 startTime;
    uint256 heads;
    uint256 tails;
    uint256 creatorPrize; 
    uint256 opponentPrize;
  }

  uint8 private constant FEE_NUMBER_ETH = 5;  //  number of fees for ETH 
  uint8 private constant PRIZE_PERCENTAGE_ETH = 95;
  uint8 private constant FEE_NUMBER_TOKEN = 4;
  uint8 private constant PRIZE_PERCENTAGE_TOKEN = 96;
  
  uint8 private constant PMCT_TOKEN_PERCENTAGE = 1; //  prize percentage as token bonus

  address public stakingAddress;  //  TODO: check if present for replenish

  mapping(address => uint256) public betsTotal; //  token => amount, 0x0 - ETH
  mapping(address => mapping(address => uint256)) private playerStakeTotal;    //  token => (player => amount)
  mapping(address => mapping(address => uint256)) private playerWithdrawTotal;   //  token => (player => amount)
  mapping(address => uint256) public playerWithdrawPMCtTotal;

  mapping(address => mapping(address => uint256[])) private gamesParticipatedToCheckPrize;    //  token => (player => idx[])

  mapping(address => Game[]) private games; //  token => Game[], 0x0 - ETH
  mapping(address => mapping(uint256 => mapping(address => CoinSide))) private opponentCoinSideInGame; //  token => (idx => (player => CoinSide))
  mapping(address => mapping(uint256 => mapping(address => address))) private referralInGame;          //  token => (idx => (player => referral))

  modifier onlyCorrectCoinSide(uint8 _coinSide) {
    require(_coinSide == uint8(CoinSide.heads) || _coinSide == uint8(CoinSide.tails), "Wrong side");
    _;
  }
  
  modifier onlyWhileRunningGame(address _token) {
    require(games[_token].length > 0, "No games");
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
  constructor(address _pmct) PMCGovernanceCompliant(_pmct) {
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
    if (_isEth(_token)) {
      require(msg.value >= gameMinStakeETH, "Wrong ETH stake");
    } else {
      require(isTokenSupported[_token], "Wrong token");
      require(_tokens > 0, "Wrong tokens");
      require(msg.value == 0, "Wrong value");
      ERC20(_token).transferFrom(msg.sender, address(this), _tokens);
    }

    require(_coinSideHash[0] != 0, "Empty hash");
    require(gamesStarted(_token) == gamesFinished(_token), "Game is running");
    
    uint256 nextIdx = gamesStarted(_token);
    Game memory game = Game(true, _coinSideHash, msg.sender, nextIdx, (_isEth(_token)) ? msg.value : _tokens, block.timestamp, 0, 0, 0, 0);
    games[_token].push(game);
    
    referralInGame[_token][nextIdx][msg.sender] = (_referral != address(0)) ? _referral : owner();
    gamesParticipatedToCheckPrize[_token][msg.sender].push(nextIdx);
    _increaseStakes(_token, (_isEth(_token)) ? msg.value : _tokens);

    emit GameStarted(_token, nextIdx);
  }

  /**
   * @dev Joins game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _tokens Token amount.
   * @param _coinSide Coin side.
   * @param _referral Referral address.
   */
  function joinGame(address _token, uint256 _tokens, uint8 _coinSide, address _referral) external payable onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame(_token) {
    Game storage game = _lastStartedGame(_token);

    if (_isEth(_token)) {
      require(msg.value == game.stake, "Wrong stake");
    } else {
      require(msg.value == 0, "Wrong value");
      require(_tokens == game.stake, "Wrong stake");
      ERC20(_token).transferFrom(msg.sender, address(this), _tokens);
    }

    uint256 gameIdx = gamesStarted(_token).sub(1);

    require(game.startTime.add(gameMaxDuration) >= block.timestamp, "Game time out");
    require(opponentCoinSideInGame[_token][gameIdx][msg.sender] == CoinSide.none, "Already joined");

    opponentCoinSideInGame[_token][gameIdx][msg.sender] = CoinSide(_coinSide);
    (CoinSide(_coinSide) == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);
    referralInGame[_token][gameIdx][msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipatedToCheckPrize[_token][msg.sender].push(gameIdx);
    _increaseStakes(_token, (_isEth(_token)) ? msg.value : _tokens);

    emit GameJoined(_token, gameIdx, msg.sender);
  }
  
  /**
   * @dev Plays game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _coinSide Coin side, that was used on game start.
   * @param _seedHash Hash of the seed string, that was used to generate hashed coin side on game start.
   */
  function playGame(address _token, uint8 _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame(_token) {
    Game storage game = _lastStartedGame(_token);

    require(game.creator == msg.sender, "Not creator");
    require(game.startTime.add(gameMaxDuration) >= block.timestamp, "Time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == game.creatorCoinSide, "Wrong hash value");

    delete game.running;
    game.creatorCoinSide = bytes32(uint256(_coinSide));
    (CoinSide(_coinSide) == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);
  
    uint256 opponentsReward;
    if ((game.heads > 0) && (game.tails > 0)) {
      opponentsReward = (CoinSide(_coinSide) == CoinSide.heads) ? game.stake.mul(game.tails).div(game.heads) : game.stake.mul(game.heads).div(game.tails);
      game.creatorPrize = game.stake.add(opponentsReward);
    } else {
      uint256 opponentsOnly = (game.heads > 0) ? game.heads.sub(1) : game.tails.sub(1);
      if (opponentsOnly > 0) {
        opponentsReward = game.stake.div(opponentsOnly);
      }
    }

    if (opponentsReward > 0) {
      game.opponentPrize = game.stake.add(opponentsReward);

      runRaffle(_token);
      if (_isEth(_token))) {
        if (stakingAddress != address(0)) {
          if (stakeRewardPoolOngoing_ETH > 0) {
            PMC_IStaking(stakingAddress).replenishRewardPool(stakeRewardPoolOngoing_ETH);
            delete stakeRewardPoolOngoing_ETH;
          }
        }
      }
    } else {
      addToRaffleNoPlayer(_token, game.stake); //  creator only in game
    }

    updateGameMinStakeETHIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(_token, gamesStarted(_token).sub(1), false);
  }

  /**
   * @dev Finishes game on timeout.
   * @param _token ERC-20 token address. 0x0 - ETH
   */
  function finishTimeoutGame(address _token) external onlyWhileRunningGame(_token) {
    Game storage game = _lastStartedGame(_token);

    require(game.startTime.add(gameMaxDuration) < block.timestamp, "Still running");

    delete game.running;
    uint256 opponents = game.heads.add(game.tails);
    if (opponents > 0) {
      uint256 opponentReward = game.stake.div(opponents);
      game.opponentPrize = game.stake.add(opponentReward);
    } else {
      addToRaffleNoPlayer(_token, game.stake); //  creator only in game
    }

    updateGameMinStakeETHIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(_token, gamesStarted(_token).sub(1), true);
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
    //   PMCt(pmct).mint(msg.sender, pendingPMCt);  TODO
    }

    //  ETH / token
    uint256 transferAmount;
    if (_isEth(_token)) {
      transferAmount = pendingPrize.mul(PRIZE_PERCENTAGE_ETH).div(100);
      msg.sender.transfer(transferAmount);
    } else {
      transferAmount = pendingPrize.mul(PRIZE_PERCENTAGE_TOKEN).div(100);
      ERC20(_token).transfer(msg.sender, transferAmount);
    }
    
    //  fee
    uint256 feeTotal = pendingPrize.sub(transferAmount);
    uint256 singleFee = (_isEth(_token)) ? feeTotal.div(FEE_NUMBER_ETH) : feeTotal.div(FEE_NUMBER_TOKEN);
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
    if (_isEth(_token)) {
      addFee(FeeType.stake, _token, singleFee, address(0));
    }
    
    //  dev fee
    uint256 usedFee = (_isEth(_token)) ? singleFee.mul(uint256(FEE_NUMBER_ETH).sub(1)) : singleFee.mul(uint256(FEE_NUMBER_TOKEN).sub(1));
    addFee(FeeType.dev, _token, feeTotal.sub(usedFee), address(0));

    emit PrizeWithdrawn(_token, msg.sender, pendingPrize, pendingPMCt);
  }
  //  PENDING WITHDRAWAL -->

  /**
   * @dev Checks if address used corresponds to ETH or token.
   * @param _token Token address or 0 adress.
   * @return Address corresponds to ETH or Token.
   */
  function _isEth(address _token) private returns (bool) {
    return _token == address(0);
  }

  /**
   * @dev Updates staking Smart Contract address.
   * @param _address Staking Smart Contract address.
   */
  function updateStakingAddress(address _address) external onlyOwner {
    require(_address != address(0), "Wrong address");

    stakingAddress = _address;
  }

  /**
   * @dev Increases bets total & for sender.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _amount Stake value.
   */
  function _increaseStakes(address _token, uint256 _amount) private {
    playerStakeTotal[_token][msg.sender] = playerStakeTotal[_token][msg.sender].add(_amount);
    betsTotal[_token] = betsTotal[_token].add(_amount);
  }

  /**
   * @dev Gets last started game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @return Game obj.
   */
  function _lastStartedGame(address _token) private view returns (Game storage) {
    if (!_isEth(_token)) {
      require(isTokenSupported[_token], "Wrong token");
    }

    uint256 startedGames = gamesStarted(_token);
    require(startedGames > 0, "No running games");

    uint256 ongoingGameIdx = startedGames.sub(1);
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
    if (startedGames == 0) {
      return 0;
    }
    
    Game storage game = _lastStartedGame(_token);
    return (game.running) ? game.idx : startedGames;
  }

  /**
   * @dev Gets game info.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _idx Game index in games for token.
   * @return running is game running.
   * @return creatorCoinSide Coin side of creator. Hash is set before creator played the game.
   * @return creator Creator address.
   * @return idx Game index.
   * @return stake Stake value.
   * @return startTime Timestamp, when game was started.
   * @return heads Heads amount.
   * @return tails Tails amount.
   * @return creatorPrize Prize for creator.
   * @return opponentPrize Prize for each opponent.
   */

  function gameInfo(address _token, uint256 _idx) external view returns(
    bool running,
    bytes32 creatorCoinSide,
    address creator,
    uint256 idx,
    uint256 stake,
    uint256 startTime,
    uint256 heads,
    uint256 tails,
    uint256 creatorPrize,
    uint256 opponentPrize) {
      require(_idx < gamesStarted(_token), "Wrong game idx");

      running = games[_token][_idx].running;
      creatorCoinSide = games[_token][_idx].creatorCoinSide;
      creator = games[_token][_idx].creator;
      idx = games[_token][_idx].idx;
      stake = games[_token][_idx].stake;
      startTime = games[_token][_idx].startTime;
      heads = games[_token][_idx].heads;
      tails = games[_token][_idx].tails;
      creatorPrize = games[_token][_idx].creatorPrize;
      opponentPrize = games[_token][_idx].opponentPrize;
  }
  
  /**
   * @dev Gets opponent info for game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _idx Game index in games for token.
   * @return opponentCoinSide Coin side for sender.
   * @return referral Referral address for sender.
   */

  function gameInfoForOpponent(address _token, uint256 _idx) external view returns(CoinSide opponentCoinSide, address referral) {
    require(_idx < gamesStarted(_token), "Wrong game idx");

    opponentCoinSide = opponentCoinSideInGame[_token][_idx][msg.sender];
    referral = referralInGame[_token][_idx][msg.sender];
  }

  /**
   * @dev Gets referral for sender for game.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @param _idx Game index in games for token.
   * @return Referral address for sender.
   */
  function getReferralInGame(address _token, uint256 _idx) external view returns(address) {
    require(_idx < gamesStarted(_token), "Wrong game idx");
    return referralInGame[_token][_idx][msg.sender];
  }

  /**
   * @dev Gets games participated to check prize for sender.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @return Games number.
   */
  function getGamesParticipatedToCheckPrize(address _token) external view returns(uint256[] memory) {
    return gamesParticipatedToCheckPrize[_token][msg.sender];
  }
  
  /**
   * @dev Gets player stake total amount.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @return Stakes total amount.
   */
  function getPlayerStakeTotal(address _token) external view returns(uint256) {
    return playerStakeTotal[_token][msg.sender];
  }

  /**
   * @dev Gets player withdraw total amount.
   * @param _token ERC-20 token address. 0x0 - ETH
   * @return Withdrawals total amount.
   */
  function getPlayerWithdrawTotal(address _token) external view returns(uint256) {
    return playerWithdrawTotal[_token][msg.sender];
  }

  /**
   * PMCGovernanceCompliant
   */
  function updateGameMinStakeETH(uint256 _gameMinStakeETH) external override onlyGovernance(msg.sender) {
    require(_gameMinStakeETH > 0, "Wrong gameMinStakeETH");

    Game storage game = _lastStartedGame(address(0));
    bool later = game.running;
    updateGameMinStakeETHLater(_gameMinStakeETH, later);
  }

  function updateGameMaxDuration(uint16 _gameMaxDuration) external override onlyGovernance(msg.sender) {
    require(_gameMaxDuration > 0, "Wrong duration");

    Game storage game = _lastStartedGame(address(0));
    bool later = game.running;
    updateGameMaxDurationLater(_gameMaxDuration, later);
  }
}