// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @notice Min prediction (ETH only), game duration, add token to prediction.
 * @dev Smart Contract used to handle Governance.
 */
abstract contract PMCGovernanceCompliant is Ownable {
  using SafeMath for uint256;
  
  address governance;

  uint256 public gameMinPrediction;
  uint256 public gameMinPredictionToUpdate;
  
  uint16 public gameMaxDuration;
  uint16 public gameMaxDurationToUpdate;
  
  address[] private tokensSupportedToPrediction;
  mapping(address => bool) public isTokenSupportedToPrediction;
  

  modifier onlyGovernance(address _address) {
    require(_address == governance, "Not PMCGovernance");
    _;
  }

  constructor(address _address) {
    gameMinPrediction = 1e15; //  0.01 ETH
    gameMaxDuration = 12;  //  TODO: 5760;  // 24 hours == 5,760 blocks
    isTokenSupportedToPrediction[_address] = true;
  }

  /**
   * @dev Updates Governance Contract address.
   * @param _address Governance Contract address to be used.
   */
  function updateGovernanceContract(address _address) external onlyOwner {
    governance = _address;
  } 

  /**
   * @dev Governance calls it when min prediction update proposal accepted.
   * @param _gameMinPrediction Prediction value to be used.
   */
  function updateGameMinPrediction(uint256 _gameMinPrediction) external virtual;

  /**
   * @dev Updates min prediction.
   * @param _gameMinPrediction Prediction value to be used.
   * @param _later Should be updated later.
   */
  function updateGameMinPredictionLater(uint256 _gameMinPrediction, bool _later) internal {
    if (_gameMinPrediction != gameMinPrediction) {
      _later ? gameMinPredictionToUpdate = _gameMinPrediction : gameMinPrediction = _gameMinPrediction;
    }
  }

  /**
   * @dev Checks if min prediction should be updated & updates.
   */
  function updateGameMinPredictionIfNeeded() internal {
    if (gameMinPredictionToUpdate > 0) {
      gameMinPrediction = gameMinPredictionToUpdate;
      delete gameMinPredictionToUpdate;
    }
  }

  /**
   * @dev Governance calls it when game duration update proposal accepted.
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
      _later ? gameMaxDurationToUpdate = _gameMaxDuration : gameMaxDuration = _gameMaxDuration;
    }
  }

  /**
   * @dev Checks if game duration should be updated & updates.
   */
  function updateGameMaxDurationIfNeeded() internal {
    if (gameMaxDurationToUpdate > 0) {
      gameMaxDuration = gameMaxDurationToUpdate;
      delete gameMaxDurationToUpdate;
    }
  }
  
  /**
   * @dev Returns tokens, that can be used for prediction.
   * @return Token address list.
   */
  function gettokensSupportedToPrediction() external view returns(address[] memory) {
    return tokensSupportedToPrediction;
  }
  
  /**
   * @dev Governance calls when add token proposal accepted.
   * @param _token Token address to be added.
   */
  function updateGameAddToken(address _token) external onlyGovernance(msg.sender) {
    if (_token != address(0) && !isTokenSupportedToPrediction[_token]) {
      tokensSupportedToPrediction.push(_token);
      isTokenSupportedToPrediction[_token] = true;
    }
  }
}