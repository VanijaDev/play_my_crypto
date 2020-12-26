// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @notice Min bet, game duration.
 * @dev Smart Contract used to handle Gocernance.
 */
abstract contract PMCGovernanceCompliant is Ownable {
  using SafeMath for uint256;
  
  address governance;

  mapping(address => uint256) public gameMinBet;    //  token => amount, 0x0 - ETH
  mapping(address => uint256) public gameMinBetToUpdate;    //  token => amount, 0x0 - ETH
  
  uint16 public gameMaxDuration = 5760;  // 24 hours == 5,760 blocks
  uint16 public gameMaxDurationToUpdate;
  
  address[] minBetToUpdate; //  tokens to update min bet
  

  modifier onlyGovernance(address _address) {
    require(_address == governance, "Not PMCGovernance");
    _;
  }
  
  constructor() {
      gameMinBet[address(0)] = 1e16; //  0.001 ETH
  }

  /**
   * @dev Updates Governance Contract address.
   * @param _address Governance Contract address to be used.
   */
  function updateGovernanceContract(address _address) external onlyOwner {
    governance = _address;
  } 

  /**
   * @dev Governance calls when min bet update proposal accepted.
   * @param _gameMinBet Bet value to be used.
   */
  function updateGameMinBet(address _token, uint256 _gameMinBet) external virtual;

  /**
   * @dev Updates min bet.
   * @param _gameMinBet Bet value to be used.
   * @param _later Should be updated later.
   */
  function updateGameMinBetLater(address _token, uint256 _gameMinBet, bool _later) internal {
    require(_gameMinBet != gameMinBet[_token], "Same gameMinBet");

    if (_later) {
        gameMinBetToUpdate[_token] = _gameMinBet;
        minBetToUpdate.push(_token);
        
    } else {
        gameMinBet[_token] = _gameMinBet;
    }
        
  }

  /**
   * @dev Checks if min bet should be updated.
   */
  function updateGameMinBetIfNeeded() internal {
      for (uint8 i = 0; i < minBetToUpdate.length; i ++) {
        address tokenAddr = minBetToUpdate[i];
        if (gameMinBetToUpdate[tokenAddr] > 0) {
          gameMinBet[tokenAddr] = gameMinBetToUpdate[tokenAddr];
          delete gameMinBetToUpdate[tokenAddr];
        }   
      }
      delete minBetToUpdate;
  }

  /**
   * @dev Updates game duration.
   * @dev Governance calls when game duration update proposal accepted.
   * @param _gameMaxDuration Duration value to be used.
   */
  function updateGameDuration(uint16 _gameMaxDuration) external virtual;

  /**
   * @dev Updates game duration.
   * @param _gameMaxDuration Game duration value to be used.
   * @param _later Should be updated later.
   */
  function updateGameDurationLater(uint16 _gameMaxDuration, bool _later) internal {
    require(_gameMaxDuration != gameMaxDuration, "Same gameMaxDuration");

    _later ? gameMaxDurationToUpdate = _gameMaxDuration : gameMaxDuration = _gameMaxDuration;
  }

  /**
   * @dev Checks if game duration should be updated.
   */
  function updateGameMaxDurationIfNeeded() internal {
    if (gameMaxDurationToUpdate > 0) {
      gameMaxDuration = gameMaxDurationToUpdate;
      delete gameMaxDurationToUpdate;
    }
  }
}