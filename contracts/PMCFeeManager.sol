// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Fee implementation:
 * partner, referral, dev - implemented
 * raffle - inherited Smart Contract
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
  mapping(address => mapping(address => uint256)) public partnerFeePending; //  player => (token => amount), token 0x0 - ETH
  mapping(address => mapping(address => uint256)) public partnerFeeWithdrawn;

  //  referral
  mapping(address => mapping(address => uint256)) public referralFeePending;
  mapping(address => mapping(address => uint256)) public referralFeeWithdrawn;
  mapping(address => uint256) public totalUsedReferralFees;

  //  dev
  mapping(address => uint256) public devFeePending; //  token => amount, token 0x0 - ETH
  mapping(address => uint256) public devFeeWithdrawn;

  //  staking
  uint256 public stakeRewardPoolOngoing;  //  ETH only
  
  
  /**
   * @notice Can be 0x0.
   * @dev Updates partner address.
   * @param _partner Partner address.
   */
  function updatePartner(address _partner) external onlyOwner {
    partner = _partner;
  }

  /**
   * @dev Adds fee.
   * @param _type Fee type.
   * @param _token Token address. if 0x0 -> ETH
   * @param _amount Fee amount.
   * @param _referralAddress Referral address.
   */
  function addFee(FeeType _type, address _token, uint256 _amount, address _referralAddress) internal {
    require(_amount > 0, "No amount");

    if (_type == FeeType.partner) {
      require(partner != address(0), "No partner");
      partnerFeePending[partner][_token] = partnerFeePending[partner][_token].add(_amount);
    } else if (_type == FeeType.referral) {
      referralFeePending[_referralAddress][_token] = referralFeePending[_referralAddress][_token].add(_amount);
    } else if (_type == FeeType.dev) {
      devFeePending[_token] = devFeePending[_token].add(_amount);
    } else if (_type == FeeType.stake) {
      require(_token == address(0), "No token for staking");
      require(_referralAddress == address(0), "No ref for staking");
      stakeRewardPoolOngoing = stakeRewardPoolOngoing.add(_amount);
    } else {
      revert("Wrong FeeType");
    }
  }

  /**
   * @dev Withdraws partner fee.
   * @param _token Token address. if 0x0 -> ETH
   */
  function withdrawPartnerFee(address _token) external {
    uint256 feeTmp = partnerFeePending[msg.sender][_token];
    require(feeTmp > 0, "no fee");

    delete partnerFeePending[msg.sender][_token];
    partnerFeeWithdrawn[msg.sender][_token] = partnerFeeWithdrawn[msg.sender][_token].add(feeTmp);

    if (_token != address(0)) {
      approveTokensToWithdrawFee(_token, feeTmp, msg.sender);
      ERC20(_token).transferFrom(address(this), msg.sender, feeTmp);
      return;
    }
    
    msg.sender.transfer(feeTmp);
  }

  
  /**
   * @dev Withdraws referral fee.
   * @param _token Token address. if 0x0 -> ETH
   */
  function withdrawReferralFee(address _token) external {
    uint256 feeTmp = referralFeePending[msg.sender][_token];
    require(feeTmp > 0, "no fee");

    delete referralFeePending[msg.sender][_token];
    referralFeeWithdrawn[msg.sender][_token] = referralFeeWithdrawn[msg.sender][_token].add(feeTmp);

    if (_token != address(0)) {
      approveTokensToWithdrawFee(_token, feeTmp, msg.sender);
      ERC20(_token).transferFrom(address(this), msg.sender, feeTmp);
      return;
    }
    
    msg.sender.transfer(feeTmp);
  }

  
  /**
   * @dev Withdraws dev fee.
   * @param _token Token address. if 0x0 -> ETH
   */
  function withdrawDevFee(address _token) external {
    uint256 feeTmp = devFeePending[_token];
    require(feeTmp > 0, "no fee");

    delete devFeePending[_token];
    devFeeWithdrawn[_token] = devFeeWithdrawn[_token].add(feeTmp);

    if (_token != address(0)) {
      approveTokensToWithdrawFee(_token, feeTmp, msg.sender);
      ERC20(_token).transferFrom(address(this), msg.sender, feeTmp);
      return;
    }
    
    msg.sender.transfer(feeTmp);
  }

  /**
   * @dev Approves tokens to withdraw.
   * @param _token Token address.
   * @param _amount Token amount.
   * @param _spender Spender address.
   */
  function approveTokensToWithdrawFee(address _token, uint256 _amount, address _spender) private {
    ERC20(_token).approve(_spender, _amount);
  }
}