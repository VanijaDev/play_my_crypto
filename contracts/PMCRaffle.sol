// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
  
  mapping(address => mapping(address => uint256)) public raffleJackpotWithdrawPending;  //  token => (address => amount), 0x0 - ETH
  mapping(address => mapping(address => uint256)) public raffleJackpotWithdrawn;
  
  mapping(address => uint256) public raffleJackpot; //  address => amount, 0x0 - ETH
  mapping(address => uint256) public raffleJackpotsWonTotal;

  mapping(address => address[]) private raffleParticipants;
  mapping(address => RaffleResult[]) public raffleResults;


  event CF_RafflePlayed(address token, address indexed winner, uint256 indexed prize);
  event CF_RaffleJackpotWithdrawn(address token, address indexed winner);

  function addToRaffleJackpot(address _token, uint256 _amount) internal {
    raffleJackpot[_token] = raffleJackpot[_token].add(_amount);
  }

  function addRafflePlayer(address _token, address _player) internal {
    require(_player != address(0), "Raffle player 0x0");

    raffleParticipants[_token].push(_player);
  }

  /**
   * @dev Gets raffle participants.
   * @return Participants list.
   */
  function getRaffleParticipants(address _token) external view returns (address[] memory) {
    return raffleParticipants[_token];
  }

  /**
   * @dev Gets raffle participants number.
   * @return Participants number.
   */
  function getRaffleParticipantsNumber(address _token) external view returns (uint256) {
    return raffleParticipants[_token].length;
  }

  /**
   * @dev Gets past raffle results number.
   * @return Results number.
   */
  function getRaffleResultNumber(address _token) external view returns (uint256) {
    return raffleResults[_token].length;
  }

  /**
   * @dev Runs the raffle.
   */
  function runRaffle(address _token) internal {
    uint256 winnerIdx = rand(_token);
    raffleJackpotWithdrawPending[_token][raffleParticipants[_token][winnerIdx]] = raffleJackpotWithdrawPending[_token][raffleParticipants[_token][winnerIdx]].add(raffleJackpot[_token]);
    raffleJackpotsWonTotal[_token] = raffleJackpotsWonTotal[_token].add(raffleJackpot[_token]);
    raffleResults[_token].push(RaffleResult(raffleParticipants[_token][winnerIdx], raffleJackpot[_token]));

    emit CF_RafflePlayed(_token, raffleParticipants[_token][winnerIdx], raffleJackpot[_token]);

    delete raffleJackpot[_token];
    delete raffleParticipants[_token];
  }

  /**
   * @dev Generates random number
   */
  function rand(address _token) private view returns(uint256) {
    require(raffleParticipants[_token].length > 0, "No participants");
    return uint256(keccak256(abi.encodePacked(block.timestamp, raffleJackpot[_token], raffleParticipants[_token].length))) % raffleParticipants[_token].length;
  }

  /**
   * @dev Withdraw jackpots for all won raffles.
   */
  function withdrawRaffleJackpotsPending(address _token) external {
    uint256 amountToSend = raffleJackpotWithdrawPending[_token][msg.sender];
    require(amountToSend > 0, "No prize");
    
    delete raffleJackpotWithdrawPending[_token][msg.sender];

    raffleJackpotWithdrawn[_token][msg.sender] = raffleJackpotWithdrawn[_token][msg.sender].add(amountToSend);

    if (_token == address(0)) {
      msg.sender.transfer(amountToSend);
    } else {
      ERC20(_token).transfer(msg.sender, amountToSend);
    }
    
    CF_RaffleJackpotWithdrawn(_token, msg.sender);
  }
}
