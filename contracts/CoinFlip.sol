// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract CoinFlip {
  using SafeMath for uint256;

  uint256 public gameMinBet = 1e16; //  0.001 ETH
  uint256 public gameMaxDuration = 1 days;

  uint256 public gamesStarted;
  uint256 public gamesFinished;

  mapping(address => uint256) public betTotal;
  mapping(address => uint256) public withdrawTotal;

  //  Running game properties
  bytes32 public runningGameCoinSideHash; //  TODO: clear on finish
  uint256 public runningGameBet;          //  TODO: clear on finish
  uint256 public runningGameTimestamp;    //  TODO: clear on finish
  address public runningGameCreator;      //  TODO: clear on finish
  mapping(address => uint8) public runningGameOpponentGuess;  //  TODO: clear on finish

  constructor() {}

  function startGame(bytes32 _coinSideHash) external payable {
    require(_coinSideHash[0] != 0, "Empty hash");
    require(runningGameTimestamp == 0, "Already started");
    require(msg.value > gameMinBet, "value < gameMinBet");

    runningGameCoinSideHash = _coinSideHash;
    runningGameBet = msg.value;
    runningGameTimestamp = block.timestamp;
    runningGameCreator = msg.sender;

    betTotal[msg.sender] = betTotal[msg.sender].add(msg.value);
  }

  function joinGame(uint8 _coinSide) external payable {
    require(runningGameTimestamp > 0, "No running game");
    require(runningGameOpponentGuess[msg.sender] == 0, "Already joined");
    require(_coinSide == 1 || _coinSide == 2, "Wrong side"); //  1, 2
    require(msg.value == runningGameBet, "Wrong bet");

    runningGameOpponentGuess[msg.sender] = _coinSide ;
    betTotal[msg.sender] = betTotal[msg.sender].add(msg.value);
  }
}
