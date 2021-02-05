// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @notice Min stake (ETH only), game duration, add token to stake.
 * @dev Smart Contract used to handle Governance.
 */
abstract contract PMCGovernanceCompliant is Ownable {
  using SafeMath for uint256;
  
  address governance;

  uint256 public gameMinStakeETH;
  uint256 public gameMinStakeETHToUpdate;
  
  uint256 public gameMaxDuration;
  uint256 public gameMaxDurationToUpdate;
  
  address[] private tokensSupportedToStake;
  mapping(address => bool) public isTokenSupported;
  

  modifier onlyGovernance(address _address) {
    require(_address == governance, "Not PMCGovernance");
    _;
  }

  constructor(address _address) {
    gameMinStakeETH = 1e15; //  0.01 ETH
    gameMaxDuration = 24 hours;
    isTokenSupported[_address] = true;
  }

  /**
   * @dev Updates Governance Contract address.
   * @param _address Governance Contract address to be used.
   */
  function updateGovernanceContract(address _address) external onlyOwner {
    governance = _address;
  } 

  /**
   * @dev Governance calls it when min stake update proposal accepted.
   * @param _gameMinStakeETH Stake value to be used.
   */
  function updateGameMinStakeETH(uint256 _gameMinStakeETH) external virtual;

  /**
   * @dev Updates min stake.
   * @param _gameMinStakeETH Stake value to be used.
   * @param _later Should be updated later.
   */
  function updateGameMinStakeETHLater(uint256 _gameMinStakeETH, bool _later) internal {
    if (_gameMinStakeETH != gameMinStakeETH) {
      _later ? gameMinStakeETHToUpdate = _gameMinStakeETH : gameMinStakeETH = gameMinStakeETH;
    }
  }

  /**
   * @dev Checks if min stake should be updated & updates.
   */
  function updateGameMinStakeETHIfNeeded() internal {
    if (gameMinStakeETHToUpdate > 0) {
      gameMinStakeETH = gameMinStakeETHToUpdate;
      delete gameMinStakeETHToUpdate;
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
   * @dev Returns tokens, that can be used for stake.
   * @return Token address list.
   */
  function gettokensSupportedToStake() external view returns(address[] memory) {
    return tokensSupportedToStake;
  }
  
  /**
   * @dev Governance calls when add token proposal accepted.
   * @param _token Token address to be added.
   */
  function updateGameAddToken(address _token) external onlyGovernance(msg.sender) {
    if (_token != address(0) && !isTokenSupported[_token]) {
      tokensSupportedToStake.push(_token);
      isTokenSupported[_token] = true;
    }
  }
}