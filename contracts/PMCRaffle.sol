// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Runs automatically when game is played by creator.
 */
abstract contract PMCRaffle is Ownable {
  struct RaffleResult {
    address winner;
    uint256 prize;
  }
  
  mapping(address => mapping(address => uint256)) private raffleJackpotPending;  //  token => (address => amount), 0x0 - ETH
  mapping(address => mapping(address => uint256)) private raffleJackpotWithdrawn;
  
  mapping(address => uint256) private raffleJackpot; //  token => amount, 0x0 - ETH
  mapping(address => uint256) private raffleJackpotsWonTotal;

  mapping(address => address[]) internal raffleParticipants; //  token => addresses, 0x0 - ETH
  mapping(address => RaffleResult[]) private raffleResults;


  event CF_RafflePlayed(address indexed token, address indexed winner, uint256 indexed prize);
  event CF_RaffleJackpotWithdrawn(address indexed token, uint256 indexed amount, address indexed winner);


  /***
   * @dev Adds to current raffle.
   * @param _token Token address.
   * @param _amount Amount.
   */
  function addToRaffle(address _token, uint256 _amount) internal {
    if (_amount > 0) {
      raffleJackpot[_token] = raffleJackpot[_token] + _amount;
      raffleParticipants[_token].push(msg.sender);
    }
  }

  /***
   * @dev Gets raffle jackpot.
   * @param _token Token address.
   * @return Jackpot amount.
   */
  function getRaffleJackpot(address _token) external view returns (uint256) {
    return raffleJackpot[_token];
  }

  /***
   * @dev Gets raffle jackpot won total.
   * @param _token Token address.
   * @return Jackpot won total amount.
   */
  function getRaffleJackpotsWonTotal(address _token) external view returns (uint256) {
    return raffleJackpotsWonTotal[_token];
  }

  /***
   * @dev Gets raffle participants.
   * @param _token Token address.
   * @return Participants list.
   */
  function getRaffleParticipants(address _token) external view returns (address[] memory) {
    return raffleParticipants[_token];
  }

  /***
   * @dev Gets raffle participants number.
   * @param _token Token address.
   * @return Participants number.
   */
  function getRaffleParticipantsNumber(address _token) external view returns (uint256) {
    return raffleParticipants[_token].length;
  }

  /***
   * @dev Gets raffle results number.
   * @param _token Token address.
   * @return Results number.
   */
  function getRaffleResultNumber(address _token) external view returns (uint256) {
    return raffleResults[_token].length;
  }

  /***
   * @dev Gets raffle result info.
   * @param _token Token address.
   * @param _idx result index.
   * @return Results number.
   */
  function getRaffleResultInfo(address _token, uint256 _idx) external view returns (address winner, uint256 prize) {
    winner = raffleResults[_token][_idx].winner;
    prize = raffleResults[_token][_idx].prize;
  }

  /***
   * @dev Gets raffle jackpot for ongoing game for address.
   * @param _token Token address.
   * @param _address Address.
   * @return Jackpot amount.
   */
  function getRaffleJackpotPending(address _token, address _address) external view returns (uint256) {
    return raffleJackpotPending[_token][_address];
  }

  /***
   * @dev Gets raffle jackpot withdrawn for address.
   * @param _token Token address.
   * @param _address Address.
   * @return Jackpot amount.
   */
  function getRaffleJackpotWithdrawn(address _token, address _address) external view returns (uint256) {
    return raffleJackpotWithdrawn[_token][_address];
  }

  /***
   * @dev Runs the current raffle.
   * @param _token Token address.
   */
  function runRaffle(address _token) internal {
    if (raffleJackpot[_token] > 0 && raffleParticipants[_token].length > 0) {
      uint256 winnerIdx = _rand(_token, 0);
      address winnerAddr = raffleParticipants[_token][winnerIdx];
      raffleJackpotPending[_token][winnerAddr] = raffleJackpotPending[_token][winnerAddr] + raffleJackpot[_token];
      raffleJackpotsWonTotal[_token] = raffleJackpotsWonTotal[_token] + raffleJackpot[_token];
      raffleResults[_token].push(RaffleResult(winnerAddr, raffleJackpot[_token]));

      emit CF_RafflePlayed(_token, winnerAddr, raffleJackpot[_token]);

      delete raffleJackpot[_token];
      delete raffleParticipants[_token];
    }
  }

  /***
   * @dev Generates random number
   * @param _token Token address.
   * @param _extraParam Extra value for randomness.
   */
  function _rand(address _token, uint8 _extraParam) internal view returns(uint256) {
    if (raffleParticipants[_token].length > 0) {
      return uint256(keccak256(abi.encodePacked(_extraParam, raffleJackpot[_token], raffleJackpotsWonTotal[_token], block.timestamp))) % raffleParticipants[_token].length;
    }

    return 0;
  }

  /***
   * @dev Withdraw jackpots for all won raffles.
   * @param _token Token address.
   */
  function withdrawRaffleJackpots(address _token) external {
    uint256 amountToSend = raffleJackpotPending[_token][msg.sender];
    require(amountToSend > 0, "No prize");
    
    delete raffleJackpotPending[_token][msg.sender];

    raffleJackpotWithdrawn[_token][msg.sender] = raffleJackpotWithdrawn[_token][msg.sender] + amountToSend;

    if (_token == address(0)) {
      payable(msg.sender).transfer(amountToSend);
    } else {
      ERC20(_token).transfer(msg.sender, amountToSend);
    }
    
    CF_RaffleJackpotWithdrawn(_token, amountToSend, msg.sender);
  }
}