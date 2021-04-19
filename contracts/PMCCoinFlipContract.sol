// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "./PMC.sol";
import "./PMCRaffle.sol";
import "./PMC_IStaking.sol";
import "./PMCFeeManager.sol";
import "./PMCGovernanceCompliant.sol";

/**
  * @notice Deplyment flow:
  * 1. Deploy PMC;
  * 2. Deploy Game(PMC);
  * 3. Add Game to minters for PMC;
  * 4. Deploy Staking(PMC, PMCCoinFlipContract);
  * 5. Deploy Governance(PMC, PMCCoinFlipContract);
 */

contract PMCCoinFlipContract is PMCGovernanceCompliant, PMCFeeManager, PMCRaffle {
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

  uint8 private constant FEE_NUMBER_ETH = 5;  //  1. referral; 2. partner*; 3. raffle; 4. staking*; 5. dev. 95% - as a prize. (*) - may be not used if 0x0.
  uint8 private constant FEE_NUMBER_TOKEN = 4;  //  1. referral; 2. partner*; 3. raffle; 4. dev. 96% - as a prize

  address public pmcAddr;
  address public stakingAddr;

  mapping(address => uint256) public betsTotal; //  token => amount, 0x0 - ETH.
  mapping(address => mapping(address => uint256)) private playerStakeTotal;    //  token => (player => amount)
  mapping(address => mapping(address => uint256)) private playerWithdrawedTotal;   //  token => (player => amount)
  mapping(address => uint256) public playerPendingWithdrawalPMC;
  mapping(address => uint256) public playerWithdrawedPMCTotal;

  mapping(address => mapping(address => uint256[])) private gamesParticipatedToCheckPrize;    //  token => (player => idx[])

  mapping(address => Game[]) private games; //  token => Game[], 0x0 - ETH.
  mapping(address => mapping(uint256 => mapping(address => CoinSide))) private opponentCoinSideInGame; //  token => (idx => (player => CoinSide))
  mapping(address => mapping(uint256 => mapping(address => address))) private referralInGame;          //  token => (idx => (player => referral))

  modifier onlyCorrectCoinSide(uint8 _coinSide) {
    require(_coinSide == uint8(CoinSide.heads) || _coinSide == uint8(CoinSide.tails), "Wrong side");
    _;
  }

  modifier onlyCorrectReferral(address _referral) {
    require(_referral != msg.sender, "Wrong referral");
    _;
  }
  
  modifier onlyWhileRunningGame(address _token) {
    require(_lastStartedGame(_token).running, "No running games");
    _;
  }

  event CF_GameStarted(address indexed token, uint256 indexed id);
  event CF_GameJoined(address indexed token, uint256 indexed id, address indexed opponent);
  event CF_GameFinished(address indexed token, uint256 indexed id, bool indexed timeout);
  event CF_PrizeWithdrawn(address indexed token, address indexed player, uint256 indexed prize, uint256 pmc);

  /***
   * @dev Constructor.
   * @param _pmc PMC address.
   */
  constructor(address _pmc) PMCGovernanceCompliant() {
    require(_pmc != address(0), "Wrong token");
    pmcAddr = _pmc;
  }


  //  <-- GAMEPLAY
  /***
   * @dev Starts game.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _tokens Token amount.
   * @param _coinSideHash Hashed coin side.
   * @param _referral Referral address.
   */
  function startGame(address _token, uint256 _tokens, bytes32 _coinSideHash, address _referral) external payable onlyCorrectReferral(_referral) {
    uint256 stake = msg.value;

    if (!_isEth(_token)) {
      require(msg.value == 0, "Wrong value");
      stake = _tokens;
    }

    _startGame(_token, stake, _coinSideHash, _referral);
    _increaseStakes(_token, stake);
  }

  /***
   * @dev Starts game with extraStake param. 
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _stake Stake amount.
   * @param _coinSideHash Hashed coin side.
   * @param _referral Referral address.
   */
  function _startGame(address _token, uint256 _stake, bytes32 _coinSideHash, address _referral) private {
    if (_isEth(_token)) {
      require(_stake >= gameMinStakeETH, "Wrong ETH stake");
    } else {
      require(isTokenSupported[_token], "Wrong token");
      require(_stake >= 100, "Wrong tokens");
      ERC20(_token).transferFrom(msg.sender, address(this), _stake);
    }

    require(_coinSideHash[0] != 0, "Empty hash");
    require(gamesStarted(_token) == gamesFinished(_token), "Game is running");

    uint256 nextIdx = gamesStarted(_token);
    Game memory game = Game(true, _coinSideHash, msg.sender, nextIdx, _stake, block.timestamp, 0, 0, 0, 0);
    games[_token].push(game);
    
    referralInGame[_token][nextIdx][msg.sender] = (_referral != address(0)) ? _referral : owner();
    gamesParticipatedToCheckPrize[_token][msg.sender].push(nextIdx);

    emit CF_GameStarted(_token, nextIdx);
  }

  /***
   * @dev Joins game.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _tokens Token amount.
   * @param _coinSide Coin side.
   * @param _referral Referral address.
   */
  function joinGame(address _token, uint256 _tokens, uint8 _coinSide, address _referral) external payable onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame(_token) onlyCorrectReferral(_referral) {
    Game storage game = _lastStartedGame(_token);
    require(game.creator != msg.sender, "Cannt join");

    if (_isEth(_token)) {
      require(msg.value == game.stake, "Wrong stake");
    } else {
      require(msg.value == 0, "Wrong value");
      require(_tokens == game.stake, "Wrong stake");
      ERC20(_token).transferFrom(msg.sender, address(this), _tokens);
    }

    uint256 gameIdx = game.idx;

    require(game.startTime + gameMaxDuration >= block.timestamp, "Game time out");
    require(opponentCoinSideInGame[_token][gameIdx][msg.sender] == CoinSide.none, "Already joined");

    opponentCoinSideInGame[_token][gameIdx][msg.sender] = CoinSide(_coinSide);
    (CoinSide(_coinSide) == CoinSide.heads) ? game.heads = game.heads + 1 : game.tails = game.tails + 1;
    referralInGame[_token][gameIdx][msg.sender] = (_referral != address(0)) ? _referral : owner();

    gamesParticipatedToCheckPrize[_token][msg.sender].push(gameIdx);
    _increaseStakes(_token, game.stake);

    emit CF_GameJoined(_token, gameIdx, msg.sender);
  }
  
  /***
   * @dev Plays game.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _coinSide Coin side, that was used on game start.
   * @param _seedHash Hash of the seed string, that was used to generate hashed coin side on game start.
   */
  function playGame(address _token, uint8 _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame(_token) {
    Game storage game = _lastStartedGame(_token);

    require(game.creator == msg.sender, "Not creator");
    require(game.startTime + gameMaxDuration >= block.timestamp, "Time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == game.creatorCoinSide, "Wrong hash value");
    require(game.heads + game.tails > 0, "No opponents");

    delete game.running;
    game.creatorCoinSide = keccak256(abi.encodePacked(uint256(_coinSide)));
    (CoinSide(_coinSide) == CoinSide.heads) ? game.heads = game.heads + 1 : game.tails = game.tails + 1;
  
    uint256 opponentReward;
    if ((game.heads > 0) && (game.tails > 0)) {
      uint256 singlePlayerReward;
      if (CoinSide(_coinSide) == CoinSide.heads) {
        singlePlayerReward = game.stake * game.tails / game.heads;
        if (game.heads > 1) {
          opponentReward = singlePlayerReward;
        }
      } else {
        singlePlayerReward = game.stake * game.heads / game.tails;
        if (game.tails > 1) {
          opponentReward = singlePlayerReward;
        }
      }

      game.creatorPrize = game.stake + singlePlayerReward;
    } else {
      uint256 opponentsOnly = (game.heads > 0) ? game.heads - 1 : game.tails - 1;
      opponentReward = game.stake / opponentsOnly;
    }

    if (opponentReward > 0) {
      game.opponentPrize = game.stake + opponentReward;
    }
    runRaffle(_token);

    if ((_isEth(_token)) && (stakingAddr != address(0)) && (stakeRewardPoolPending_ETH > 0)) {
      PMC_IStaking(stakingAddr).replenishRewardPool{value: stakeRewardPoolPending_ETH}();
      delete stakeRewardPoolPending_ETH;
    }

    updateGameMinStakeETHIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit CF_GameFinished(_token, game.idx, false);
  }

  /***
   * @dev Finishes game on timeout.
   * @param _token ERC20 token address. 0x0 - ETH.
   */
  function finishTimeoutGame(address _token, uint256 _tokens, bytes32 _coinSideHash, address _referral) external payable onlyWhileRunningGame(_token) {
    uint256 stake = msg.value;

    if (!_isEth(_token)) {
      require(msg.value == 0, "Wrong value");
      stake = _tokens;
    }
    
    Game storage game = _lastStartedGame(_token);
    require(game.startTime + gameMaxDuration < block.timestamp, "Still running");

    _increaseStakes(_token, stake);
    
    delete game.running;
    uint256 opponents = game.heads + game.tails;
    if (opponents > 0) {
      uint256 opponentReward = game.stake / opponents;
      game.opponentPrize = game.stake + opponentReward;
    } else {
      stake = stake + game.stake;
    }

    updateGameMinStakeETHIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit CF_GameFinished(_token, game.idx, true);

    _startGame(_token, stake, _coinSideHash, _referral);
  }

  //  GAMEPLAY -->


  //  <-- PENDING WITHDRAWAL
  /***
   * @dev Calculates prize to withdraw for sender.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   * @return prize Prize amount.
   * @return pmc_tokens PMC amount.
   */
  function pendingPrizeToWithdraw(address _token, uint256 _maxLoop) external view returns(uint256 prize, uint256 pmc_tokens) {
    uint256 gamesToCheck = gamesParticipatedToCheckPrize[_token][msg.sender].length;
    if (gamesToCheck == 0) {
      return (0, 0);
    }

    uint256 loop = ((_maxLoop > 0) && (_maxLoop < gamesToCheck)) ? _maxLoop : gamesToCheck;
    uint256 subIdx;

    while (loop > 0) {
      subIdx = subIdx + 1;
      
      uint256 gameToCheckIdx = gamesParticipatedToCheckPrize[_token][msg.sender][gamesParticipatedToCheckPrize[_token][msg.sender].length - subIdx];
      Game storage game = games[_token][gameToCheckIdx];

      if (msg.sender == game.creator) {
        if (game.creatorPrize > 0) {
          prize = prize + game.creatorPrize;

          if (_isEth(_token)) {
            pmc_tokens = pmc_tokens + game.creatorPrize / 100;  //  1%
          }
        }
      } else {
        if (game.opponentPrize > 0) {
          bool timeout = (game.creatorCoinSide != keccak256(abi.encodePacked(uint256(CoinSide.heads))) && game.creatorCoinSide != keccak256(abi.encodePacked(uint256(CoinSide.tails))));
            
          if (timeout || keccak256(abi.encodePacked(uint256(opponentCoinSideInGame[_token][game.idx][msg.sender]))) == game.creatorCoinSide) {
            prize = prize + game.opponentPrize;

            if (timeout && _isEth(_token)) {
              pmc_tokens = pmc_tokens + game.opponentPrize / 100;  //  1%
            }
          }
        }
      }

      loop = loop - 1;
    }
  }

  /***
   * @dev Calculates prize to withdraw for sender and updates referral fees.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   * @return prize Prize amount.
   * @return pmc_tokens PMC amount.
   */
  function _pendingPrizeToWithdrawAndReferralFeesUpdate(address _token, uint256 _maxLoop) private returns(uint256 prize, uint256 pmc_tokens) {
    uint256 gamesToCheck = gamesParticipatedToCheckPrize[_token][msg.sender].length;
    if (gamesToCheck == 0) {
      return (0, 0);
    }

    address prevReferral;
    uint256 prevReferralAmount;

    uint256 loop = ((_maxLoop > 0) && (_maxLoop < gamesToCheck)) ? _maxLoop : gamesToCheck;

    while (loop > 0) {
      uint256 gameToCheckIdx = gamesParticipatedToCheckPrize[_token][msg.sender][gamesParticipatedToCheckPrize[_token][msg.sender].length - 1];
      Game storage game = games[_token][gameToCheckIdx];

      if (msg.sender == game.creator) {
        if (game.creatorPrize > 0) {
          prize = prize + game.creatorPrize;

          if (_isEth(_token)) {
            pmc_tokens = pmc_tokens + game.creatorPrize / 100;  //  1%
          }

          //  referral fees
          address referral = referralInGame[_token][game.idx][msg.sender];
          uint256 referralFee = game.creatorPrize / 100;  //  1%

          if (prevReferral != referral) {
            if (prevReferralAmount > 0) {
              addFee(FeeType.referral, _token, prevReferralAmount, prevReferral);
              delete prevReferral;
              delete prevReferralAmount;
            }
            
            prevReferral = referral;
          }
          
          prevReferralAmount = prevReferralAmount + referralFee;
        }
      } else {
        if (game.opponentPrize > 0) {
          bool timeout = (game.creatorCoinSide != keccak256(abi.encodePacked(uint256(CoinSide.heads))) && game.creatorCoinSide != keccak256(abi.encodePacked(uint256(CoinSide.tails))));
            
          if (timeout || keccak256(abi.encodePacked(uint256(opponentCoinSideInGame[_token][game.idx][msg.sender]))) == game.creatorCoinSide) {
            prize = prize + game.opponentPrize;

            if (timeout && _isEth(_token)) {
              pmc_tokens = pmc_tokens + game.opponentPrize / 100;  //  1%
            }

            
            //  referral fees
            address referral = referralInGame[_token][game.idx][msg.sender];
            uint256 referralFee = game.opponentPrize / 100;  //  1%

            if (prevReferral != referral) {
              if (prevReferralAmount > 0) {
                addFee(FeeType.referral, _token, prevReferralAmount, prevReferral);
                delete prevReferral;
                delete prevReferralAmount;
              }

              prevReferral = referral;
            }
              
            prevReferralAmount = prevReferralAmount + referralFee;
          }
        }
      }

      gamesParticipatedToCheckPrize[_token][msg.sender].pop();
      loop = loop - 1;
    }
    
    addFee(FeeType.referral, _token, prevReferralAmount, prevReferral);
  }

  /***
   * @dev Withdraws prize for sender.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   */
  function withdrawPendingPrizes(address _token, uint256 _maxLoop) external {
    uint256 pendingPrize;
    uint256 pendingPMC;
    (pendingPrize, pendingPMC) = _pendingPrizeToWithdrawAndReferralFeesUpdate(_token, _maxLoop);

    require(pendingPrize > 0, "No prize");

    //  PMC
    distributePMC(pendingPMC);

    //  ETH / token
    uint8 feeNumber;  //  5 - ETH, 4 - Token
    uint256 transferAmount;

    if (_isEth(_token)) {
      feeNumber = (stakingAddr == address(0)) ? FEE_NUMBER_ETH - 1 : FEE_NUMBER_ETH;

      if (partner == address(0)) {
        feeNumber = feeNumber - 1;
      }

      transferAmount = pendingPrize * (100 - feeNumber) / 100;
      payable(msg.sender).transfer(transferAmount);
    } else {
      feeNumber = (partner == address(0)) ? FEE_NUMBER_TOKEN - 1 : FEE_NUMBER_TOKEN;

      transferAmount = pendingPrize * (100 - feeNumber) / 100;
      ERC20(_token).transfer(payable(msg.sender), transferAmount);
    }
    
    //  fee
    uint256 feeTotal = pendingPrize - transferAmount;
    uint256 singleFee = feeTotal / feeNumber;
    uint256 usedFee = singleFee * 2;  //  referral + raffle

    //  raffle
    addToRaffle(_token, singleFee);

    //  partner fee
    if (partner != address(0)) {
      addFee(FeeType.partner, _token, singleFee, partner);
      usedFee = usedFee + singleFee;
    }

    //  staking
    if (_isEth(_token) && (stakingAddr != address(0))) {
      addFee(FeeType.stake, _token, singleFee, address(0));
      usedFee = usedFee + singleFee;
    }
    
    //  dev fee
    addFee(FeeType.dev, _token, feeTotal - usedFee, address(0));
    
    playerWithdrawedTotal[_token][msg.sender] = playerWithdrawedTotal[_token][msg.sender] + transferAmount;
    emit CF_PrizeWithdrawn(_token, msg.sender, transferAmount, pendingPMC);
  }
  
  /***
   * @dev Distributes PMC tokens.
   * @param _pmc PMC amount to be distributed;
   */
  function distributePMC(uint256 _pmc) private {
    if (_pmc > 0) {
      playerPendingWithdrawalPMC[owner()] = playerPendingWithdrawalPMC[owner()] + _pmc / 100;
      
      uint256 singleAmount = _pmc / 4;
      uint256 senderAmount = singleAmount + playerPendingWithdrawalPMC[msg.sender];
      delete playerPendingWithdrawalPMC[msg.sender];
      playerWithdrawedPMCTotal[msg.sender] = playerWithdrawedPMCTotal[msg.sender] + senderAmount;
      PMC(pmcAddr).mint(msg.sender, senderAmount);
      
      address zeroAddr = address(0);
      if (raffleParticipants[zeroAddr].length > 0) {
        for (uint8 i = 1; i <= 3; i ++) {
          uint256 idx = _rand(zeroAddr, i);
          address winner = raffleParticipants[zeroAddr][idx];
          playerPendingWithdrawalPMC[winner] = playerPendingWithdrawalPMC[winner] + singleAmount;
        }  
      }
    }
  }
  
  /***
   * @dev Withdraws PMC tokens.
   */
  function withdrawPendingPMC() external {
    uint256 pmc = playerPendingWithdrawalPMC[msg.sender];
    require(pmc > 0, "No PMC");

    delete playerPendingWithdrawalPMC[msg.sender];
    PMC(pmcAddr).mint(msg.sender, pmc);
    playerWithdrawedPMCTotal[msg.sender] = playerWithdrawedPMCTotal[msg.sender] + pmc;
  }
  
  //  PENDING WITHDRAWAL -->


  /***
   * @dev Updates staking Smart Contract address. Can be 0x0.
   * @param _address Staking Smart Contract address.
   */
  function updateStakingAddr(address _address) external onlyOwner {
    stakingAddr = _address;
  }

  /***
   * @dev Checks if address corresponds to ETH or token.
   * @param _token Token address or 0x0 adsress.
   * @return Whether address corresponds to ETH or Token.
   */
  function _isEth(address _token) private pure returns (bool) {
    return _token == address(0);
  }

  /***
   * @dev Increases player stake total & bets total.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _amount Stake value.
   */
  function _increaseStakes(address _token, uint256 _amount) private {
    playerStakeTotal[_token][msg.sender] = playerStakeTotal[_token][msg.sender] + _amount;
    betsTotal[_token] = betsTotal[_token] + _amount;
  }

  /***
   * @dev Gets last started game.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @return Game obj.
   */
  function _lastStartedGame(address _token) private view returns (Game storage) {
    if (!_isEth(_token)) {
      require(isTokenSupported[_token], "Wrong token");
    }

    uint256 startedGames = gamesStarted(_token);
    require(startedGames > 0, "No running games");

    uint256 ongoingGameIdx = startedGames - 1;
    return games[_token][ongoingGameIdx];
  }

  /***
   * @dev Gets number of started games.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @return Number of started games.
   */
  function gamesStarted(address _token) public view returns (uint256) {
    return games[_token].length;
  }

  /***
   * @dev Gets number of finished games.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @return Number of finished games.
   */
  function gamesFinished(address _token) public view returns (uint256) {
    uint256 startedGames = gamesStarted(_token);
    if (startedGames > 0) {
      Game storage game = _lastStartedGame(_token);
      return (game.running) ? game.idx : startedGames;
    }
    
    return 0;
  }

  /***
   * @dev Gets game info.
   * @param _token ERC20 token address. 0x0 - ETH.
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

      Game storage game = games[_token][_idx];

      running = game.running;
      creatorCoinSide = game.creatorCoinSide;
      creator = game.creator;
      idx = game.idx;
      stake = game.stake;
      startTime = game.startTime;
      heads = game.heads;
      tails = game.tails;
      creatorPrize = game.creatorPrize;
      opponentPrize = game.opponentPrize;
  }
  
  /***
   * @dev Gets opponentCoinSide for sender in game.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _idx Game index in games for token.
   * @return opponentCoinSide Coin side for sender.
   */

  function opponentCoinSideForOpponent(address _token, uint256 _idx) external view returns(CoinSide opponentCoinSide) {
    require(_idx < gamesStarted(_token), "Wrong game idx");

    opponentCoinSide = opponentCoinSideInGame[_token][_idx][msg.sender];
  }

  /***
   * @dev Gets referral for sender in game.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @param _idx Game index in games for token.
   * @return Referral address for sender.
   */
  function getReferralInGame(address _token, uint256 _idx) external view returns(address) {
    require(_idx < gamesStarted(_token), "Wrong game idx");
    
    return referralInGame[_token][_idx][msg.sender];
  }

  /***
   * @dev Gets games participated to check prize for sender.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @return Games number.
   */
  function getGamesParticipatedToCheckPrize(address _token) external view returns(uint256[] memory) {
    return gamesParticipatedToCheckPrize[_token][msg.sender];
  }
  
  /***
   * @dev Gets player stake total amount.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @return Stakes total amount.
   */
  function getPlayerStakeTotal(address _token) external view returns(uint256) {
    return playerStakeTotal[_token][msg.sender];
  }

  /***
   * @dev Gets player withdraw total amount.
   * @param _token ERC20 token address. 0x0 - ETH.
   * @return Withdrawed total amount.
   */
  function getPlayerWithdrawedTotal(address _token) external view returns(uint256) {
    return playerWithdrawedTotal[_token][msg.sender];
  }

  /***
   * PMCGovernanceCompliant
   */
  function updateGameMinStakeETH(uint256 _gameMinStakeETH) external override onlyGovernance(msg.sender) {
    require(_gameMinStakeETH > 0, "Wrong gameMinStakeETH");

    Game storage game = _lastStartedGame(address(0));
    bool later = game.running;
    updateGameMinStakeETHLater(_gameMinStakeETH, later);
  }

  function updateGameMaxDuration(uint256 _gameMaxDuration) external override onlyGovernance(msg.sender) {
    require(_gameMaxDuration > 0, "Wrong duration");

    Game storage game = _lastStartedGame(address(0));
    bool later = game.running;
    updateGameMaxDurationLater(_gameMaxDuration, later);
  }
}