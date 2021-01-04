// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @notice Min bet, game duration.
 * @dev Smart Contract used to handle Gocernance.
 */
abstract contract PMCGovernanceCompliant is Ownable {
  using SafeMath for uint256;
  
  address governance;

  uint256 public gameMinBet;
  uint256 public gameMinBetToUpdate;
  
  uint16 public gameMaxDuration;
  uint16 public gameMaxDurationToUpdate;
  
  address[] private tokensSupportedToBet;
  mapping(address => bool) public isTokenSupportedToBet;
  

  modifier onlyGovernance(address _address) {
    require(_address == governance, "Not PMCGovernance");
    _;
  }
  
  modifier onlyAllowedTokens(address _token, uint256 _tokens) {
    require(tokensAllowed(_token, _tokens), "Tokens not allowed");
    _;
  }

  constructor() {
    gameMinBet = 1e16; //  0.001 ETH
    gameMaxDuration = 5760;  // 24 hours == 5,760 blocks
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
  function updateGameMinBet(uint256 _gameMinBet) external virtual;

  /**
   * @dev Updates min bet.
   * @param _gameMinBet Bet value to be used.
   * @param _later Should be updated later.
   */
  function updateGameMinBetLater(uint256 _gameMinBet, bool _later) internal {
    require(_gameMinBet != gameMinBet, "Same gameMinBet");

    _later ? gameMinBetToUpdate = _gameMinBet : gameMinBet = _gameMinBet;
  }

  /**
   * @dev Checks if min bet should be updated.
   */
  function updateGameMinBetIfNeeded() internal {
    if (gameMinBetToUpdate > 0) {
      gameMinBet = gameMinBetToUpdate;
      delete gameMinBetToUpdate;
    }
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
  
  /**
   * @dev Returns tokens, that can be used for bet.
   * @return Token address list.
   */
  function gettokensSupportedToBet() external view returns(address[] memory) {
    return tokensSupportedToBet;
  }
  
  /**
   * @dev Governance calls when add token proposal accepted.
   * @param _token Token address to be added.
   */
  function updateGameAddToken(address _token) external onlyGovernance(msg.sender) {
    if (_token != address(0) && !isTokenSupportedToBet[_token]) {
      tokensSupportedToBet.push(_token);
      isTokenSupportedToBet[_token] = true;
    }
  }
  
  function tokensAllowed(address _token, uint256 _tokens) public view returns (bool) {
    if (_token == address(0)) {
      return false;
    }

    if (_tokens == 0) {
      return false;
    }

    return ERC20(_token).allowance(msg.sender, address(this)) >= _tokens;
  }
}