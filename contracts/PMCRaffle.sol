// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice ETH only
 * @dev Run when game is played by creator. Acumulates balances & participants of not played games.
 */
abstract contract PMCRaffle is Ownable {
  using SafeMath for uint256;

  struct RaffleResult {
    address winner;
    uint256 prize;
  }
  
  mapping(address => uint256) public raffleJackpotWithdrawPending;
  mapping(address => uint256) public raffleJackpotWithdrawn;
  
  uint256 public raffleJackpot;
  uint256 public raffleJackpotsWonTotal;

  address[] private raffleParticipants;
  RaffleResult[] public raffleResults;


  event CF_RafflePlayed(address indexed winner, uint256 indexed prize);
  event CF_RaffleJackpotWithdrawn(address indexed winner);

  function addToRaffleJackpot(uint256 _amount) internal {
    raffleJackpot = raffleJackpot.add(_amount);
  }

  function addRafflePlayer(address _address) internal {
    require(_address != address(0), "Raffle player 0x0");

    raffleParticipants.push(_address);
  }

  /**
   * @dev Gets raffle participants.
   * @return Participants list.
   */
  function getraffleParticipants() external view returns (address[] memory) {
    return raffleParticipants;
  }

  /**
   * @dev Gets raffle participants number.
   * @return Participants number.
   */
  function getraffleParticipantsNumber() external view returns (uint256) {
    return raffleParticipants.length;
  }

  /**
   * @dev Gets past raffle results number.
   * @return Results number.
   */
  function getRaffleResultNumber() external view returns (uint256) {
    return raffleResults.length;
  }

  /**
   * @dev Runs the raffle.
   */
  function runRaffle() internal virtual {
    uint256 winnerIdx = rand();
    raffleJackpotWithdrawPending[raffleParticipants[winnerIdx]] = raffleJackpotWithdrawPending[raffleParticipants[winnerIdx]].add(raffleJackpot);
    raffleJackpotsWonTotal = raffleJackpotsWonTotal.add(raffleJackpot);
    raffleResults.push(RaffleResult(raffleParticipants[winnerIdx], raffleJackpot));

    emit CF_RafflePlayed(raffleParticipants[winnerIdx], raffleJackpot);

    delete raffleJackpot;
    delete raffleParticipants;
  }

  /**
   * @dev Generates random number
   */
  function rand() private view returns(uint256) {
    require(raffleParticipants.length > 0, "No participants");
    return uint256(keccak256(abi.encodePacked(block.timestamp, raffleJackpot, raffleParticipants.length))) % raffleParticipants.length;
  }

  /**
   * @dev Withdraw jackpots for all won raffles.
   */
  function withdrawRaffleJackpotsPending() external {
    uint256 amountToSend = raffleJackpotWithdrawPending[msg.sender];
    require(amountToSend > 0, "No prize");
    
    delete raffleJackpotWithdrawPending[msg.sender];

    raffleJackpotWithdrawn[msg.sender] = raffleJackpotWithdrawn[msg.sender].add(amountToSend);

    msg.sender.transfer(amountToSend);
    CF_RaffleJackpotWithdrawn(msg.sender);
  }
}
