// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice Both partner and dev fees
 */
contract PMCFeeManager is Ownable {
  using SafeMath for uint256;

  //  partner
  address partner;
  mapping(address => uint256) public partnerFeePending;
  mapping(address => uint256) public partnerFeeWithdrawn;

  //  referral
  mapping(address => uint256) public referralFeePending;
  mapping(address => uint256) public referralFeeWithdrawn;
  uint256 public totalUsedReferralFees;

  //  dev
  uint256 public devFeePending;

  
  function updatePartner(address _partner) external onlyOwner {
    partner = _partner;
  }

  function increasePartnerFee(uint256 _amount) internal {
    require(partner != address(0), "no partner for fee");
    partnerFeePending[partner] = partnerFeePending[partner].add(_amount);
  }

  function increaseReferralFee(address _referral, uint256 _amount) internal {
    require(_referral != address(0), "wrong _referral");
    referralFeePending[_referral] = referralFeePending[_referral].add(_amount);
  }

  function increaseDevFee(uint256 _amount) internal {
    devFeePending = devFeePending.add(_amount);
  }

  function withdrawPartnerFee() external {
    uint256 feeTmp = partnerFeePending[msg.sender];
    require(feeTmp > 0, "no fee");

    delete partnerFeePending[msg.sender];
    partnerFeeWithdrawn[msg.sender] = partnerFeeWithdrawn[msg.sender].add(feeTmp);

    msg.sender.transfer(feeTmp);
  }

  function withdrawReferralFee() external {
    uint256 feeTmp = referralFeePending[msg.sender];
    require(feeTmp > 0, "no fee");

    delete referralFeePending[msg.sender];
    referralFeeWithdrawn[msg.sender] = referralFeeWithdrawn[msg.sender].add(feeTmp);

    msg.sender.transfer(feeTmp);
  }

  function withdrawDevFee() external {
    uint256 feeTmp = devFeePending;
    require(feeTmp > 0, "no fee");

    delete devFeePending;

    msg.sender.transfer(feeTmp);
  }
}