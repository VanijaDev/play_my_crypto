// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice Both partner and dev fees
 * partner, referral, dev - implemented
 * raffle, governance - inherited Smart Contract
 * staking - separate Smart Contract
 */
contract PMCFeeManager is Ownable {
  using SafeMath for uint256;

  enum FeeType {
    partner,
    referral,
    dev,
    stake
  }

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

  //  staking
  uint256 public stakeRewardPool;
  
  
  function updatePartner(address _partner) external onlyOwner {
    partner = _partner;
  }

  function increaseFee(FeeType _type, uint256 _amount, address _address) internal {
    if (_type == FeeType.partner) {
      require(partner != address(0), "no partner for fee");
      partnerFeePending[partner] = partnerFeePending[partner].add(_amount);
    } else if (_type == FeeType.referral) {
      require(_address != address(0), "wrong _referral");
      referralFeePending[_address] = referralFeePending[_address].add(_amount);
    } else if (_type == FeeType.dev) {
      devFeePending = devFeePending.add(_amount);
    } else if (_type == FeeType.stake) {
      stakeRewardPool = stakeRewardPool.add(_amount);
    } else {
      revert("Wrong FeeType");
    }
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