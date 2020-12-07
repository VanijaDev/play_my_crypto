// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

contract CoinFlip {

  uint256 public gameMinBet = 1e16; //  0.001 ETH
  uint256 public gameMaxDuration = 1 days;

  uint256 public gamesStarted;
  uint256 public gamesFinished;

  //  Running game properties
  bytes32 public runningGameCoinSideHash; //  TODO: clear on finish
  uint256 public runningGameBet;          //  TODO: clear on finish
  uint256 public runningGameTimestamp;    //  TODO: clear on finish
  address public runningGameCreator;      //  TODO: clear on finish
  address[] public runningGameOpponents;  //  TODO: clear on finish

  constructor() {}

  function startGame(bytes32 _coinSideHash) external payable {
    require(_coinSideHash[0] != 0, "Empty hash");
    require(runningGameTimestamp == 0, "Already started");
    require(msg.value > gameMinBet, "value < gameMinBet");

    runningGameCoinSideHash = _coinSideHash;
    runningGameBet = msg.value;
    runningGameTimestamp = block.timestamp;
    runningGameCreator = msg.sender;
  }
}
