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

  uint16 public gameMaxDuration = 5760;  // 24 hours == 5,760 blocks
  uint16 public gameMaxDurationToUpdate;
  
  mapping(address => uint256) public gameMinBetForToken;    //  token => amount, 0x0 - ETH
  mapping(address => uint256) public gameMinBetToUpdateForToken;    //  token => amount, 0x0 - ETH
  address[] tokenToUpdateMinBet; //  tokens to update min bet
  

  modifier onlyGovernance(address _address) {
    require(_address == governance, "Not PMCGovernance");
    _;
  }
  
  event GameMaxDurationUpdated(uint16 gameMaxDuration);
  event GameMinBetUpdated(address _token, uint256 _minBet);
  event GameTokenAdded(address _token);
  
  constructor() {
      gameMinBetForToken[address(0)] = 1e16; //  ETH => 0.001 ETH
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
    if (_gameMinBet != gameMinBetForToken[_token]) {
        if (_later) {
            gameMinBetToUpdateForToken[_token] = _gameMinBet;
            tokenToUpdateMinBet.push(_token);
            
        } else {
            gameMinBetForToken[_token] = _gameMinBet;
            emit GameMinBetUpdated(_token, _gameMinBet);
        }
    } 
  }

  /**
   * @dev Checks if min bet should be updated.
   */
  function updateGameMinBetIfNeeded() internal {
      for (uint8 i = 0; i < tokenToUpdateMinBet.length; i ++) {
        address tokenAddr = tokenToUpdateMinBet[i];
        if (gameMinBetToUpdateForToken[tokenAddr] > 0) {
          gameMinBetForToken[tokenAddr] = gameMinBetToUpdateForToken[tokenAddr];
          delete gameMinBetToUpdateForToken[tokenAddr];
          
          emit GameMinBetUpdated(tokenAddr, gameMinBetForToken[tokenAddr]);
        }   
      }
      delete tokenToUpdateMinBet;
  }

  /**
   * @dev Updates game duration.
   * @dev Governance calls when game duration update proposal accepted.
   * @param _gameMaxDuration Duration value to be used.
   */
  function updateGameMaxDuration(uint16 _gameMaxDuration) external virtual;

  /**
   * @dev Updates game duration.
   * @param _gameMaxDuration Game duration value to be used.
   * @param _later Should be updated later.
   */
  function updateGameMaxDurationLater(uint16 _gameMaxDuration, bool _later) internal {
    if (_gameMaxDuration != gameMaxDuration) {
        if (_later) {
            gameMaxDurationToUpdate = _gameMaxDuration;
            emit GameMaxDurationUpdated(_gameMaxDuration);
        } else {
            gameMaxDuration = _gameMaxDuration;
        }
    }
  }

  /**
   * @dev Checks if game duration should be updated.
   */
  function updateGameMaxDurationIfNeeded() internal {
    if (gameMaxDurationToUpdate > 0) {
      gameMaxDuration = gameMaxDurationToUpdate;
      delete gameMaxDurationToUpdate;
      emit GameMaxDurationUpdated(gameMaxDuration);
    }
  }
  
  /**
   * @dev Adds token to be used in games.
   * @param _token Token address.
   * @param _minBet Min bet for token.
   */
  function addToken(address _token, uint256 _minBet) external onlyGovernance(msg.sender) {
      if(_token != address(0) && _minBet > 0) {
        gameMinBetForToken[_token] = _minBet;
        
        emit GameTokenAdded(_token);
      }
  }
}