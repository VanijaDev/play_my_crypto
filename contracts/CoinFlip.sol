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
    uint8 creatorCoinSide;
    bytes32 creatorCoinSideHash;
    address creator;
    uint256 bet;
    uint256 startTimestamp;
    uint256 heads;
    uint256 tails;
    uint256 prize; 
    mapping(address => CoinSide) opponentCoinSide;
  }

  uint256 public gameMinBet = 1e16; //  0.001 ETH
  uint256 public gameMaxDuration = 1 days;

  uint256 public betsTotal;

  mapping(address => uint256) public playerBetTotal;
  mapping(address => uint256) public playerWithdrawTotal;
  
  Game[] private games;

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

    increaseBets();
  }

  function joinGame(uint8 _coinSide) external payable {
    require(_coinSide == CoinSide.heads || _coinSide == CoinSide.tails, "Wrong side");
    require(gamesStarted() > gamesFinished(), "No running games");
    Game storage lastStartedGame = games[gamesStarted().sub(1)];
    require(msg.value == lastStartedGame.bet, "Wrong bet");
    require(lastStartedGame.startTimestamp.add(gameMaxDuration) >= block.timestamp, "Running game time out");
    require(lastStartedGame.opponentCoinSide[msg.sender] == CoinSide.none, "Already joined");

    lastStartedGame.opponentCoinSide[msg.sender] = _coinSide;
    (_coinSide == CoinSide.heads) ? lastStartedGame.heads = lastStartedGame.heads.add(1) : lastStartedGame.tails = lastStartedGame.tails.add(1);

    increaseBets();
  }

  function playGame(uint8 _coinSide, bytes32 _seedHash) external {
    require(gamesStarted() > gamesFinished(), "No running games");
    Game storage lastStartedGame = games[gamesStarted().sub(1)];
    require(lastStartedGame.creator == msg.sender, "Not creator");
    require(lastStartedGame.startTimestamp.add(gameMaxDuration) >= block.timestamp, "Running game time out");
    require(keccak256(abi.encodePacked(uint256(_coinSide), _seedHash)) == lastStartedGame.creatorCoinSideHash, "Wrong hash value");

    lastStartedGame.creatorCoinSide = _coinSide;
    (_coinSide == CoinSide.heads) ? lastStartedGame.heads = lastStartedGame.heads.add(1) : lastStartedGame.tails = lastStartedGame.tails.add(1);

    //  calculate prizes
    lastStartedGame.prize = (_coinSide == CoinSide.heads) ? runningGameBet.mul(lastStartedGame.tails).div(lastStartedGame.heads) : runningGameBet.mul(lastStartedGame.heads).div(lastStartedGame.tails);
    


    //  clear running game stats
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
