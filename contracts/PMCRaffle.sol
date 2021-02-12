// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Runs automatically when game is played by creator.
 */
abstract contract PMCRaffle is Ownable {
  using SafeMath for uint256;

  struct RaffleResult {
    address winner;
    uint256 prize;
  }
  
  mapping(address => mapping(address => uint256)) public raffleJackpotPending;  //  token => (address => amount), 0x0 - ETH
  mapping(address => mapping(address => uint256)) public raffleJackpotWithdrawn;
  
  mapping(address => uint256) public raffleJackpot; //  token => amount, 0x0 - ETH
  mapping(address => uint256) public raffleJackpotsWonTotal;

  mapping(address => address[]) private raffleParticipants; //  token => addresses, 0x0 - ETH
  mapping(address => RaffleResult[]) public raffleResults;


  event CF_RafflePlayed(address indexed token, address indexed winner, uint256 indexed prize);
  event CF_RaffleJackpotWithdrawn(address indexed token, uint256 indexed amount, address indexed winner);


  /**
   * @dev Adds to current raffle.
   * @param _token Token address.
   * @param _amount Amount.
   */
  function addToRaffle(address _token, uint256 _amount) internal {
    require(_amount > 0, "Wrong amount");

    raffleJackpot[_token] = raffleJackpot[_token].add(_amount);
    raffleParticipants[_token].push(msg.sender);
  }

  /**
   * @dev Gets raffle participants.
   * @param _token Token address.
   * @return Participants list.
   */
  function getRaffleParticipants(address _token) external view returns (address[] memory) {
    return raffleParticipants[_token];
  }

  /**
   * @dev Gets raffle participants number.
   * @param _token Token address.
   * @return Participants number.
   */
  function getRaffleParticipantsNumber(address _token) external view returns (uint256) {
    return raffleParticipants[_token].length;
  }

  /**
   * @dev Gets raffle results number.
   * @param _token Token address.
   * @return Results number.
   */
  function getRaffleResultNumber(address _token) external view returns (uint256) {
    return raffleResults[_token].length;
  }

  /**
   * @dev Runs the current raffle.
   * @param _token Token address.
   */
  function runRaffle(address _token) internal {
    if (raffleJackpot[_token] > 0 && raffleParticipants[_token].length > 0) {
      uint256 winnerIdx = _rand(_token);
      address winnerAddr = raffleParticipants[_token][winnerIdx];
      raffleJackpotPending[_token][winnerAddr] = raffleJackpotPending[_token][winnerAddr].add(raffleJackpot[_token]);
      raffleJackpotsWonTotal[_token] = raffleJackpotsWonTotal[_token].add(raffleJackpot[_token]);
      raffleResults[_token].push(RaffleResult(winnerAddr, raffleJackpot[_token]));

      emit CF_RafflePlayed(_token, winnerAddr, raffleJackpot[_token]);

      delete raffleJackpot[_token];
      delete raffleParticipants[_token];
    }
  }

  /**
   * @dev Generates random number
   * @param _token Token address.
   */
  function _rand(address _token) private view returns(uint256) {
    require(raffleParticipants[_token].length > 0, "No participants");
    return uint256(keccak256(abi.encodePacked(block.timestamp, raffleJackpot[_token], raffleParticipants[_token].length))) % raffleParticipants[_token].length;
  }

  /**
   * @dev Withdraw jackpots for all won raffles.
   * @param _token Token address.
   */
  function withdrawRaffleJackpots(address _token) external {
    uint256 amountToSend = raffleJackpotPending[_token][msg.sender];
    require(amountToSend > 0, "No prize");
    
    delete raffleJackpotPending[_token][msg.sender];

    raffleJackpotWithdrawn[_token][msg.sender] = raffleJackpotWithdrawn[_token][msg.sender].add(amountToSend);

    if (_token == address(0)) {
      msg.sender.transfer(amountToSend);
    } else {
      ERC20(_token).transfer(msg.sender, amountToSend);
    }
    
    CF_RaffleJackpotWithdrawn(_token, amountToSend, msg.sender);
  }
}