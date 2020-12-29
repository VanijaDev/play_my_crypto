// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice ETH only
 */
abstract contract PMCRaffle is Ownable {
  using SafeMath for uint256;

  struct RaffleResult {
    address winner;
    uint256 prize;
    uint256 time;
  }
  
  mapping(address => uint256) public raffleJackpotWithdrawPending;
  mapping(address => uint256) public raffleJackpotWithdrawn;
  
  uint256 public ongoingRaffleJackpot;
  uint256 public raffleJackpotsWonTotal;

  address[] public ongoingRaffleParticipants;
  RaffleResult[] public raffleResults;


  event CF_RafflePlayed(address indexed winner, uint256 indexed prize);
  event CF_RaffleJackpotWithdrawn(address indexed winner);

  function increaseOngoingRaffleJackpot(uint256 _amount) internal {
    ongoingRaffleJackpot = ongoingRaffleJackpot.add(_amount);
  }

  function addRafflePlayer() internal {
    ongoingRaffleJackpot = ongoingRaffleJackpot.add(msg.value);
    ongoingRaffleParticipants.push(msg.sender);
  }

  /**
   * @dev Gets raffle participants.
   * @return Participants count.
   */
  function getongoingRaffleParticipants() external view returns (address[] memory) {
    return ongoingRaffleParticipants;
  }

  /**
   * @dev Gets past raffle results count.
   * @return Results count.
   */
  function getRaffleResultCount() external view returns (uint256) {
    return raffleResults.length;
  }

  /**
   * @dev Runs the raffle.
   */
  function runRaffle() internal virtual {
    uint256 winnerIdx = rand();
    raffleJackpotWithdrawPending[ongoingRaffleParticipants[winnerIdx]] = raffleJackpotWithdrawPending[ongoingRaffleParticipants[winnerIdx]].add(ongoingRaffleJackpot);
    raffleJackpotsWonTotal = raffleJackpotsWonTotal.add(ongoingRaffleJackpot);
    raffleResults.push(RaffleResult(ongoingRaffleParticipants[winnerIdx], ongoingRaffleJackpot, block.timestamp));

    emit CF_RafflePlayed(ongoingRaffleParticipants[winnerIdx], ongoingRaffleJackpot);

    delete ongoingRaffleJackpot;
    delete ongoingRaffleParticipants;
  }

  /**
   * @dev Generates random number
   */
  function rand() private view returns(uint256) {
    require(ongoingRaffleParticipants.length > 0, "No participants");
    return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, ongoingRaffleJackpot, ongoingRaffleParticipants.length))) % ongoingRaffleParticipants.length;
  }

  /**
   * @dev Withdraw jackpots for all won raffles.
   */
  function withdrawRaffleJackpotsCombined() external {
    uint256 amountToSend = raffleJackpotWithdrawPending[msg.sender];
    require(amountToSend > 0, "No prize");
    delete raffleJackpotWithdrawPending[msg.sender];

    raffleJackpotWithdrawn[msg.sender] = raffleJackpotWithdrawn[msg.sender].add(amountToSend);

    msg.sender.transfer(amountToSend);
    CF_RaffleJackpotWithdrawn(msg.sender);
  }
}
