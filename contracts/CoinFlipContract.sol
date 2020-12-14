// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

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
    uint256 prize; 
    mapping(address => CoinSide) opponentCoinSide;
    mapping(address => bool) prizeWithdrawn;
  }

  uint256 public gameMinBet = 1e16; //  0.001 ETH
  uint256 public gameMinBetToUpdate;  // TODO:  move to Update -> Governance
  
  uint8 public gameMaxDuration = 5760;  // 24 hours == 5,760 blocks
  uint8 public gameMaxDurationToUpdate;  // TODO:  move to Update -> Governance

  uint256 public betsTotal;
  mapping(address => uint256) public playerBetTotal;
  mapping(address => uint256) public playerWithdrawTotal;
  mapping(address => uint256) public playerParticipatedInGames;

  mapping(address => uint256[]) private gamesWithPrizeWithdrawPending; //  game idxs with pending prize withdrawal for player
  mapping(address => uint256) public gamesWithPrizeWithdrawPendingLastCheckedIdxForPlayer; //  game idx, that should be started while checking for gamesWithPrizeWithdrawPending for player
  
  Game[] private games;

  modifier onlyCorrectCoinSide(uint8 _coinSide) {
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
  event GameFinished(uint256 id);
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

    playerParticipatedInGames[msg.sender] = playerParticipatedInGames[msg.sender].add(1);

    increaseBets();

    emit GameStarted(nextIdx);
  }

  function joinGame(uint8 _coinSide) external payable onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame {
    Game storage lastStartedGame = lastStartedGame();
    
    require(msg.value == lastStartedGame.bet, "Wrong bet");
    require(lastStartedGame.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Running game time out");
    require(lastStartedGame.opponentCoinSide[msg.sender] == CoinSide.none, "Already joined");

    lastStartedGame.opponentCoinSide[msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? lastStartedGame.heads = lastStartedGame.heads.add(1) : lastStartedGame.tails = lastStartedGame.tails.add(1);

    playerParticipatedInGames[msg.sender] = playerParticipatedInGames[msg.sender].add(1);

    increaseBets();

    emit GameJoined(msg.sender, lastStartedGame.bet);
  }

  function playGame(uint8 _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame {
    Game storage lastStartedGame = lastStartedGame();
    
    require(lastStartedGame.creator == msg.sender, "Not creator");
    require(lastStartedGame.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == lastStartedGame.creatorCoinSideHash, "Wrong hash value");

    lastStartedGame.creatorCoinSide = bytes32(uint256(_coinSide));
    (_coinSide == CoinSide.heads) ? lastStartedGame.heads = lastStartedGame.heads.add(1) : lastStartedGame.tails = lastStartedGame.tails.add(1);
  
    uint256 gameProfit;
    if ((lastStartedGame.heads > 0) && (lastStartedGame.tails > 0)) {
      gameProfit = (_coinSide == CoinSide.heads) ? lastStartedGame.bet.mul(lastStartedGame.tails).div(lastStartedGame.heads) : lastStartedGame.bet.mul(lastStartedGame.heads).div(lastStartedGame.tails);

      //  TODO: 5% * prize in tokens to CREATOR - move to withdraw? 
    } else {
      uint256 opponentsOnly = (lastStartedGame.heads > 0) ? lastStartedGame.heads.sub(1) : lastStartedGame.tails.sub(1);
      gameProfit = lastStartedGame.bet.div(opponentsOnly);
    
    //  TODO: 5% * bet in tokens to CREATOR - move to withdraw? 
    }
    lastStartedGame.prize = lastStartedGame.bet.add(gameProfit);

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(lastStartedGameIdx);
  }

  function finishTimeoutGame() external onlyWhileRunningGame {
    Game storage lastStartedGame = lastStartedGame();

    require(lastStartedGame.startBlock.add(uint256(gameMaxDuration)) < block.number, "Game still running");

    uint256 opponents = lastStartedGame.heads.add(lastStartedGame.tails);
    if (opponents > 0) {
      uint256 gameProfit = lastStartedGame.bet.div(opponents);
      lastStartedGame.prize = lastStartedGame.bet.add(gameProfit);
    } else {
      //  TODO: creator only, so bet -> raffle jackpot
    }
    
    //  TODO: 5% of tokens to all OPPONENTS + dev - move to withdraw?

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(lastStartedGameIdx);
  }
  //  GAMEPLAY ---


  //  --- PENDING WITHDRAWAL
  function getGamesWithPrizeWithdrawPending(address _address) external onlyNonZeroAddress(_address) returns(uint256[] memory) {
    return gamesWithPrizeWithdrawPending[msg.sender];
  }

  function updateGamesWithPrizeWithdrawPending(uint256 _maxLoop) external {
    require(gamesFinished() > 0, "No finished games");
    
    uint256 startIdx = gamesWithPrizeWithdrawPendingLastCheckedIdxForPlayer[msg.sender];
    uint256 stopIdx = (_maxLoop == 0) ? gamesFinished().sub(1) : startIdx.add(_maxLoop);
    require(stopIdx < gamesFinished().sub(1), "_maxLoop too high");
    
    gamesWithPrizeWithdrawPendingLastCheckedIdxForPlayer[msg.sender] = stopIdx;

    for (uint256 i = startIdx; i <= stopIdx; i ++) {
      Game memory game = games[i];
      bool timeout = game.creatorCoinSide > CoinSide.tails;

      if (game.creator == msg.sender) {
        if (timeout) {
          continue;
        }

        if ((game.heads == 1 && game.tails == 0) || (game.heads == 0 && game.tails == 1)) {
          // creator only
          continue;
        }
      } else (!timeout || (game.creatorCoinSide != bytes32(uint256(game.opponentCoinSide[msg.sender])))) {
        continue;
      }

      gamesWithPrizeWithdrawPending[msg.sender].push(i);
    }
  }

  function withdrawPendingPrizes(uint256 _maxLoop) external {
    uint256[] idxs = gamesWithPrizeWithdrawPending[msg.sender];
    require(idxs.length > 0, "No pending");

    uint256 stopIdx = (_maxLoop == 0) ? idxs.length.sub(1) : _maxLoop.sub(1);

    uint256 prize;
    for (uint256 i = 0; i <= stopIdx; i++) {
      Game storage game = games[gamesWithPrizeWithdrawPending[i]];
      prize = prize.add(game.prize);
      game.prizeWithdrawn[msg.sender] = true;
    }

    //  TODO: 95% as prize
    //  TODO: all 1% fees

    msg.sender.transfer(prize);
    playerWithdrawTotal[msg.sender] = playerWithdrawTotal[msg.sender].add(prize);

    //  TODO: mint token
    uint256 tokens;

    emit PrizeWithdrawn(msg.sender, prize, tokens);
  }
  //  PENDING WITHDRAWAL ---



  //  --- UPDATE -> move to Governance
  function updateGameMinBet(uint256 _gameMinBet) external {
    require(_gameMinBet > 0, "Wrong _gameMinBet");

    if (games[gamesStarted().sub(1)].prize == 0) {
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

    if (games[gamesStarted().sub(1)].prize == 0) {
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

  function lastStartedGame() private returns (Game storage game) {
    uint256 lastStartedGameIdx = games[gamesStarted().sub(1)];
    game = games[lastStartedGameIdx];
  }

  function gamesStarted() public view returns (uint256) {
    return games.length;
  }

  function gamesFinished() public view returns (uint256) {
    uint256 gamesStarted = games.length;
    if (gamesStarted > 0) {
      return (games[gamesStarted.sub(1)].prize > 0) ? gamesStarted : gamesStarted.sub(1);
    }
  }

  function gameInfoBasic(uint256 _idx) external returns(
    CoinSide creatorCoinSide,
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
      prize = games[_idx].prize; 
  }

  function gameInfoOpponentInfo(uint256 _idx) external returns(CoinSide opponentCoinSide, bool prizeWithdrawn) {
    require(_idx < games.length, "Wrong game idx");

    opponentCoinSide = games[_idx].opponentCoinSide[msg.sender];
    prizeWithdrawn = games[_idx].prizeWithdrawn[msg.sender];
  }
}
