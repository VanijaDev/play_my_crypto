// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Partnership is Ownable {
  using SafeMath for uint256;

  address partner;

  mapping(address => uint256) feePending;
  mapping(address => uint256) feeWithdrawn;
  
  function updatePartner(address _partner) external onlyOwner {
    partner = _partner;
  }

  function increasePartnerFee(uint256 _amount) internal {
    feePending[partner] = feePending[partner].add(_amount);
  }

  function withdrawPartnerFee() external {
    uint256 feeTmp = feePending[msg.sender];
    require(feeTmp > 0, "no fee");

    delete feePending[msg.sender];
    feeWithdrawn[msg.sender] = feeWithdrawn[msg.sender].add(feeTmp);
  }
}