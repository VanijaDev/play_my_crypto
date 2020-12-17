// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract CoinFlipContract {
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
    mapping(address => bool) prizeWithdrawn;
  }

  uint256 public gameMinBet = 1e16; //  0.001 ETH
  uint256 public gameMinBetToUpdate;  // TODO:  move to Update -> Governance
  
  uint16 public gameMaxDuration = 5760;  // 24 hours == 5,760 blocks
  uint16 public gameMaxDurationToUpdate;  // TODO:  move to Update -> Governance

  uint256 public betsTotal;
  mapping(address => uint256) public playerBetTotal;
  mapping(address => uint256) public playerWithdrawTotal;

  mapping(address => uint256[]) public gamesParticipated;
  mapping(address => uint256) public gamesParticipatedIdxToStartCheckForPendingWithdrawal; //  game idx, that should be started while checking for gamesParticipatedPrizeWithdrawPending____ for player
  
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

  constructor() {}


  //  --- GAMEPLAY
  function startGame(bytes32 _coinSideHash) external payable {
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

    gamesParticipated[msg.sender].push(nextIdx);
    increaseBets();

    emit GameStarted(nextIdx);
  }

  function joinGame(CoinSide _coinSide) external payable onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame {
    Game storage game = ongoingGame();
    
    require(msg.value == game.bet, "Wrong bet");
    require(game.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Running game time out");
    require(game.opponentCoinSide[msg.sender] == CoinSide.none, "Already joined");

    game.opponentCoinSide[msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);

    gamesParticipated[msg.sender].push(gamesStarted().sub(1));
    increaseBets();

    emit GameJoined(gamesStarted(), msg.sender);
  }

  function playGame(CoinSide _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame {
    Game storage game = ongoingGame();
    
    require(game.creator == msg.sender, "Not creator");
    require(game.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == game.creatorCoinSide, "Wrong hash value");

    game.creatorCoinSide = bytes32(uint256(_coinSide));
    (_coinSide == CoinSide.heads) ? game.heads = game.heads.add(1) : game.tails = game.tails.add(1);
  
    uint256 opponentsProfit;
    if ((game.heads > 0) && (game.tails > 0)) {
      opponentsProfit = (_coinSide == CoinSide.heads) ? game.bet.mul(game.tails).div(game.heads) : game.bet.mul(game.heads).div(game.tails);
      game.creatorPrize = game.bet.add(opponentsProfit);

      //  TODO: 5% * prize in tokens to CREATOR - move to withdraw? 
    } else {
      uint256 opponentsOnly = (game.heads > 0) ? game.heads.sub(1) : game.tails.sub(1);
      if (opponentsOnly > 0) {
        opponentsProfit = game.bet.div(opponentsOnly);

        //  TODO: 5% * bet in tokens to CREATOR - move to withdraw? 
      }
    }

    if (opponentsProfit > 0) {
      game.opponentPrize = game.bet.add(opponentsProfit);
    }

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(gamesStarted(), false);
  }

  function finishTimeoutGame() external onlyWhileRunningGame {
    Game storage game = ongoingGame();

    require(game.startBlock.add(uint256(gameMaxDuration)) < block.number, "Game still running");

    uint256 opponents = game.heads.add(game.tails);
    if (opponents > 0) {
      uint256 opponentsProfit = game.bet.div(opponents);
      game.opponentPrize = game.bet.add(opponentsProfit);

      //  TODO: 5% of tokens to all OPPONENTS + dev - move to withdraw?
    } else {
      //  TODO: creator only, so bet -> raffle jackpot
    }

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(gamesStarted(), true);
  }
  //  GAMEPLAY ---


  //  --- PENDING WITHDRAWAL
  function pendingPrizeToWithdraw(uint256 _maxLoop) public view returns(uint256) {
    uint256 startIdx;
    uint256 stopIdx;
    (startIdx, stopIdx) = startStopIdxsInGamesParticipatedToCheckForPendingWithdrawal(_maxLoop);

    uint256 prize;
    for (uint256 i = startIdx; i <= stopIdx; i ++) {
      Game storage game = games[gamesParticipated[msg.sender][i]];
      if ((game.creator == msg.sender) && (game.creatorPrize > 0)) {
        prize = prize.add(game.creatorPrize);
      } else {
        bool timeout = game.creatorCoinSide > bytes32(uint256(CoinSide.tails));
        if (timeout || (game.creatorCoinSide == bytes32(uint256(game.opponentCoinSide[msg.sender])))) {
          prize = prize.add(game.opponentPrize);
        }
      }
    }
    return prize;
  }

  function startStopIdxsInGamesParticipatedToCheckForPendingWithdrawal(uint256 _maxLoop) private view returns(uint256 startIdx, uint stopIdx) {
    uint256[] memory participatedInGames = gamesParticipated[msg.sender];
    require(participatedInGames.length > 0, "No participated games");
    
    startIdx = gamesParticipatedIdxToStartCheckForPendingWithdrawal[msg.sender];
    stopIdx = (_maxLoop == 0) ? participatedInGames.length.sub(1) : startIdx.add(_maxLoop.sub(1));
    require(stopIdx < participatedInGames.length, "_maxLoop too high");
  }

  function withdrawPendingPrizes(uint256 _maxLoop) external {
    uint256 pendingPrize = pendingPrizeToWithdraw(_maxLoop);
    
    uint256 stopIdx;
    (, stopIdx) = startStopIdxsInGamesParticipatedToCheckForPendingWithdrawal(_maxLoop);
    gamesParticipatedIdxToStartCheckForPendingWithdrawal[msg.sender] = stopIdx.add(1);

    //  TODO: 95% as prize
    //  TODO: all 1% fees
    uint256 transferAmount = pendingPrize;  //  TODO: 

    msg.sender.transfer(transferAmount);
    playerWithdrawTotal[msg.sender] = playerWithdrawTotal[msg.sender].add(pendingPrize);

    //  TODO: mint token
    uint256 tokens;

    emit PrizeWithdrawn(msg.sender, pendingPrize, tokens);
  }
  //  PENDING WITHDRAWAL ---



  //  --- UPDATE -> move to Governance
  function updateGameMinBet(uint256 _gameMinBet) external {
    require(_gameMinBet > 0, "Wrong _gameMinBet");

    if (games[gamesStarted().sub(1)].opponentPrize == 0) {
       gameMinBetToUpdate = _gameMinBet;
      return;
    }

    gameMinBet = _gameMinBet;
  }

  function updateGameMinBetIfNeeded() private {
    if (gameMinBetToUpdate > 0) {
      gameMinBet = gameMinBetToUpdate;
      delete gameMinBetToUpdate;
    }
  }

  function updateGameMaxDuration(uint8 _gameMaxDuration) external {
    require(_gameMaxDuration > 0, "Wrong duration");

    if (games[gamesStarted().sub(1)].opponentPrize == 0) {
       gameMaxDurationToUpdate = _gameMaxDuration;
      return;
    }

    gameMaxDuration = _gameMaxDuration;
  }

  function updateGameMaxDurationIfNeeded() private {
    if (gameMaxDurationToUpdate > 0) {
      gameMaxDuration = gameMaxDurationToUpdate;
      delete gameMaxDurationToUpdate;
    }
  }
  //  UPDATE ---

  function increaseBets() private {
    playerBetTotal[msg.sender] = playerBetTotal[msg.sender].add(msg.value);
    betsTotal = betsTotal.add(msg.value);
  }

  function ongoingGame() private view returns (Game storage game) {
    uint256 ongoingGameIdx = gamesStarted().sub(1);
    game = games[ongoingGameIdx];
  }

  function gamesStarted() public view returns (uint256) {
    return games.length;
  }

  function gamesFinished() public view returns (uint256) {
    uint256 startedGames = games.length;
    if (startedGames > 0) {
      return (games[startedGames.sub(1)].opponentPrize > 0) ? startedGames : startedGames.sub(1);
    }
    
    return 0;
  }

  function gameInfoBasic(uint256 _idx) external view returns(
    bytes32 creatorCoinSide,
    address creator,
    uint256 bet,
    uint256 startBlock,
    uint256 heads,
    uint256 tails,
    uint256 prize) {
      require(_idx < games.length, "Wrong game idx");

      creatorCoinSide = games[_idx].creatorCoinSide;
      creator = games[_idx].creator;
      bet = games[_idx].bet;
      startBlock = games[_idx].startBlock;
      heads = games[_idx].heads;
      tails = games[_idx].tails;
      prize = games[_idx].opponentPrize; 
  }

  function gameInfoOpponentInfo(uint256 _idx) external view returns(CoinSide opponentCoinSide, bool prizeWithdrawn) {
    require(_idx < games.length, "Wrong game idx");

    opponentCoinSide = games[_idx].opponentCoinSide[msg.sender];
    prizeWithdrawn = games[_idx].prizeWithdrawn[msg.sender];
  }
  
  function gameInfoCreatorInfo(uint256 _idx) external view returns(bool prizeWithdrawn) {
    require(_idx < games.length, "Wrong game idx");

    prizeWithdrawn = games[_idx].prizeWithdrawn[msg.sender];
  }
}
