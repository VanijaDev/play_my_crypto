// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract CoinFlip {
  using SafeMath for uint256;

  enum CoinSide {
    none,
    heads,
    tails
  }

  struct Game {
    bool timeout;
    CoinSide creatorCoinSide;
    bytes32 creatorCoinSideHash;
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
  mapping(address => uint256[]) private playerParticipatedInGames;

  mapping(address => uint256[]) private gamesWithPrizeWithdrawPending; //  game idxs with pending prize withdrawal for player
  mapping(address => uint256) public gamesWithPrizeWithdrawPendingLastCheckedIdxForPlayer; //  last game idx, that was checked for gamesWithPrizeWithdrawPending for player
  
  Game[] private games;

  modifier onlyCorrectCoinSide(uint8 _coinSide) {
    require(_coinSide == CoinSide.heads || _coinSide == CoinSide.tails, "Wrong side");
    _;
  }
  
  modifier onlyWhileRunningGame() {
    require(gamesStarted() > gamesFinished(), "No running games");
    _;
  }

  event GameStarted(uint256 id);
  event GameJoined(uint256 id, address opponent);
  event GameFinished(uint256 id);
  event PrizeWithdrawn(address player, uint256 prize, uint256 tokens);

  constructor() {}

  //  Too high bet & none joined. What then?


  //  --- GAMEPLAY
  function startGame(bytes32 _coinSideHash) external payable {
    require(_coinSideHash[0] != 0, "Empty hash");
    require(msg.value >= gameMinBet, "value < gameMinBet");
    require(gamesStarted() == gamesFinished(), "Game is running");

    uint256 nextIdx = gamesStarted();
    games[nextIdx].creatorCoinSideHash = _coinSideHash;
    games[nextIdx].creator = msg.sender;
    games[nextIdx].bet = msg.value;
    games[nextIdx].startBlock = block.number;

    playerParticipatedInGames[msg.sender].push(nextIdx);

    increaseBets();

    emit GameStarted(nextIdx);
  }

  function joinGame(uint8 _coinSide) external payable onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame {
    uint256 lastStartedGameIdx = games[gamesStarted().sub(1);  
    Game storage lastStartedGame = games[gameIdx];
    
    require(msg.value == lastStartedGame.bet, "Wrong bet");
    require(lastStartedGame.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Running game time out");
    require(lastStartedGame.opponentCoinSide[msg.sender] == CoinSide.none, "Already joined");

    lastStartedGame.opponentCoinSide[msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? lastStartedGame.heads = lastStartedGame.heads.add(1) : lastStartedGame.tails = lastStartedGame.tails.add(1);

    playerParticipatedInGames[msg.sender].push(lastStartedGameIdx);

    increaseBets();

    emit GameJoined(msg.sender, lastStartedGame.bet);
  }

  function playGame(uint8 _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) onlyWhileRunningGame {
    uint256 lastStartedGameIdx = games[gamesStarted().sub(1);  
    Game storage lastStartedGame = games[lastStartedGameIdx];
    
    require(lastStartedGame.creator == msg.sender, "Not creator");
    require(lastStartedGame.startBlock.add(uint256(gameMaxDuration)) >= block.number, "Time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == lastStartedGame.creatorCoinSideHash, "Wrong hash value");

    lastStartedGame.creatorCoinSide = _coinSide;
    (_coinSide == CoinSide.heads) ? lastStartedGame.heads = lastStartedGame.heads.add(1) : lastStartedGame.tails = lastStartedGame.tails.add(1);

    lastStartedGame.prize = (_coinSide == CoinSide.heads) ? lastStartedGame.bet.mul(lastStartedGame.tails).div(lastStartedGame.heads) : lastStartedGame.bet.mul(lastStartedGame.heads).div(lastStartedGame.tails);
    //  TODO: 5% of tokens to creator

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(lastStartedGameIdx);
  }

  function finishTimeoutGame() external onlyWhileRunningGame {
    uint256 lastStartedGameIdx = games[gamesStarted().sub(1);  
    Game storage lastStartedGame = games[lastStartedGameIdx];
    
    require(lastStartedGame.startBlock.add(uint256(gameMaxDuration)) < block.number, "Game still running");

    lastStartedGame.timeout = true;
    lastStartedGame.prize = lastStartedGame.bet.div(lastStartedGame.heads.add(lastStartedGame.tails));
    //  TODO: 5% of tokens to all opponents + dev

    updateGameMinBetIfNeeded();
    updateGameMaxDurationIfNeeded();

    emit GameFinished(lastStartedGameIdx);
  }
  //  GAMEPLAY ---


  //  --- UPDATE
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


  //  --- PENDING WITHDRAWAL
  function getGamesWithPrizeWithdrawPending() {
    return gamesWithPrizeWithdrawPending[msg.sender];
  }

  function updateGamesWithPrizeWithdrawPending(uint256 _maxLoop) {
    require(gamesFinished() > 0, "No finished games");
    
    uint256 startIdx = gamesWithPrizeWithdrawPendingLastCheckedIdxForPlayer[msg.sender];
    uint256 stopIdx = (_maxLoop == 0) ? gamesFinished().sub(1) : startIdx.add(_maxLoop);
    require(stopIdx < gamesFinished(), "_maxLoop too high");
    
    gamesWithPrizeWithdrawPendingLastCheckedIdxForPlayer[msg.sender] = stopIdx;

    for (uint256 i = startIdx; i <= stopIdx; i ++) {
      Game memory game = games[i];

      if (game.creator == msg.sender) {
        if (game.timeout) {
          continue;
        }

        if ((game.creatorCoinSide == CoinSide.heads) ? game.tails == 0 : game.heads == 0) {
          continue;
        }
      } else (!game.timeout || (game.creatorCoinSide != game.opponentCoinSide{msg.sender})) {
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

    msg.sender.transfer(prize);
    playerWithdrawTotal[msg.sender] = playerWithdrawTotal[msg.sender].add(prize);

    //  TODO: mint token
    uint256 tokens;

    emit PrizeWithdrawn(msg.sender, prize, tokens);
  }

  function withdrawPendingPrize() external {
    //  TODO: emergency withdrawal
  }
  //  PENDING WITHDRAWAL ---


  function increaseBets() private {
    playerBetTotal[msg.sender] = playerBetTotal[msg.sender].add(msg.value);
    betsTotal = betsTotal.add(msg.value);
  }

  function gamesStarted() public view returns (uint256) {
    return games.length;
  }

  function gamesFinished() public view returns (uint256) {
    uint256 gamesStarted = games.length;
    if (gamesStarted == 0) {
      return 0;
    }

    return (games[gamesStarted.sub(1)].prize > 0) ? gamesStarted : gamesStarted.sub(1);
  }

  function getPlayerParticipatedInGames(address _address) external returns(uint256[] memory) {
    require(_address != address(0), "Wrong address");

    return playerParticipatedInGames[_address];
  }
}
