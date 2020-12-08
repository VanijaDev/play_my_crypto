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
    uint256 startTimestamp;
    uint256 heads;
    uint256 tails;
    uint256 prize; 
    mapping(address => CoinSide) opponentCoinSide;
    mapping(address => bool) prizeWithdrawn;
  }

  uint256 public gameMinBet = 1e16; //  0.001 ETH
  uint256 public gameMaxDuration = 1 days;

  uint256 public betsTotal;

  mapping(address => uint256) public playerBetTotal;
  mapping(address => uint256) public playerWithdrawTotal;

  mapping(address => uint256[]) private gamesWithPrizeWithdrawPending; //  game idxs with pending prize withdrawal for player
  mapping(address => uint256) public gamesWithPrizeWithdrawPendingLastCheckedIdx; //  last game idx, that was checked for gamesWithPrizeWithdrawPending for player
  
  Game[] private games;

  modifier onlyCorrectCoinSide(uint8 _coinSide) {
    require(_coinSide == CoinSide.heads || _coinSide == CoinSide.tails, "Wrong side");
    _;
  }

  constructor() {}

  function startGame(bytes32 _coinSideHash) external payable {
    require(_coinSideHash[0] != 0, "Empty hash");
    require(msg.value > gameMinBet, "value < gameMinBet");
    require(gamesStarted() == gamesFinished(), "Game is running");

    uint256 nextIdx = gamesStarted();
    games[nextIdx].creatorCoinSideHash = _coinSideHash;
    games[nextIdx].creator = msg.sender;
    games[nextIdx].bet = msg.value;
    games[nextIdx].startTimestamp = block.timestamp;

    playerParticipatedInGames[msg.sender].push(nextIdx);

    increaseBets();
  }

  function joinGame(uint8 _coinSide) external payable onlyCorrectCoinSide(_coinSide) {
    require(gamesStarted() > gamesFinished(), "No running games");
    
    uint256 lastGameIdx = gamesStarted().sub(1);
    Game storage lastStartedGame = games[lastGameIdx];
    
    require(msg.value == lastStartedGame.bet, "Wrong bet");
    require(lastStartedGame.startTimestamp.add(gameMaxDuration) >= block.timestamp, "Running game time out");
    require(lastStartedGame.opponentCoinSide[msg.sender] == CoinSide.none, "Already joined");

    lastStartedGame.opponentCoinSide[msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? lastStartedGame.heads = lastStartedGame.heads.add(1) : lastStartedGame.tails = lastStartedGame.tails.add(1);

    playerParticipatedInGames[msg.sender].push(lastGameIdx);

    increaseBets();
  }

  function playGame(uint8 _coinSide, bytes32 _seedHash) external onlyCorrectCoinSide(_coinSide) {
    require(gamesStarted() > gamesFinished(), "No running games");
    Game storage lastStartedGame = games[gamesStarted().sub(1)];
    require(lastStartedGame.creator == msg.sender, "Not creator");
    require(lastStartedGame.startTimestamp.add(gameMaxDuration) >= block.timestamp, "Running game time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == lastStartedGame.creatorCoinSideHash, "Wrong hash value");

    lastStartedGame.creatorCoinSide = _coinSide;
    (_coinSide == CoinSide.heads) ? lastStartedGame.heads = lastStartedGame.heads.add(1) : lastStartedGame.tails = lastStartedGame.tails.add(1);

    lastStartedGame.prize = (_coinSide == CoinSide.heads) ? lastStartedGame.bet.mul(lastStartedGame.tails).div(lastStartedGame.heads) : lastStartedGame.bet.mul(lastStartedGame.heads).div(lastStartedGame.tails);
    //  TODO: 5% of tokens to creator
  }

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

  function finishTimeoutGame() external {
    Game storage lastStartedGame = games[gamesStarted().sub(1)];
    require(lastStartedGame.prize == 0, "No running game");
    require(lastStartedGame.startTimestamp.add(gameMaxDuration) < block.timestamp, "Game still running");

    lastStartedGame.timeout = true;
    lastStartedGame.prize = lastStartedGame.bet.div(lastStartedGame.heads.add(lastStartedGame.tails));
    //  TODO: 5% of tokens to all opponents + dev
  }

  //  pending withdrawal
  function getGamesWithPrizeWithdrawPending() {
    return gamesWithPrizeWithdrawPending[msg.sender];
  }

  function updateGamesWithPrizeWithdrawPending(uint256 _maxLoop) {
    require(gamesFinished() > 0, "No finished games");
    uint256 maxStopIdx = gamesWithPrizeWithdrawPendingLastCheckedIdx[msg.sender].add(_maxLoop);
    require(maxStopIdx < gamesFinished(), "_maxLoop too high");
    
    uint256 startIdx = gamesWithPrizeWithdrawPendingLastCheckedIdx[msg.sender];
    uint256 stopIdx = (_maxLoop == 0) ? gamesFinished().sub(1) : maxStopIdx;
    gamesWithPrizeWithdrawPendingLastCheckedIdx[msg.sender] = stopIdx;

    for (uint256 i = startIdx; i <= stopIdx; i ++) {
      if (games[i].prizeWithdrawn) {
        continue;
      }

      if (games[i].timeout || (games[i].creatorCoinSide == games[i].opponentCoinSide{msg.sender})) {
        gamesWithPrizeWithdrawPending[msg.sender].push(i);
      }
    }
  }

  function withdrawPendingPrizes(uint256 _maxLoop) {
    //  TODO: implement
  }








  function finishTimeoverGame() external {

  }

  function updateGameMinBet(uint256 _gameMinBet) external {
    require(_gameMinBet > 0, "Wrong min bet");

    if (runningGameStartTimestamp > 0) {
      //  update when finished
      //  gameMinBetToUpdate = _gameMinBet;
      return;
    }

    gameMinBet = _gameMinBet;
  }
}
