// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Fee implementation:
 * partner, referral, dev - implemented here
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
  address public partner;
  mapping(address => mapping(address => uint256)) private partnerFeePending; //  token => (address => amount), token 0x0 - ETH.
  mapping(address => mapping(address => uint256)) private partnerFeeWithdrawn;
  mapping(address => uint256) private partnerFeeWithdrawnTotal; //  (token => amount), token 0x0 - ETH.

  //  referral
  mapping(address => mapping(address => uint256)) private referralFeePending;
  mapping(address => mapping(address => uint256)) private referralFeeWithdrawn;
  mapping(address => uint256) private referralFeeWithdrawnTotal;

  //  dev
  mapping(address => uint256) private devFeePending; //  token => amount, token 0x0 - ETH.
  mapping(address => uint256) private devFeeWithdrawn;
  mapping(address => uint256) private devFeeWithdrawnTotal;

  //  staking (ETH only)
  uint256 public stakeRewardPoolPending_ETH;
  
  
  /***
   * @notice Can be 0x0.
   * @dev Updates partner address.
   * @param _partner Partner address.
   */
  function updatePartner(address _partner) external onlyOwner {
    partner = _partner;
  }

  /***
   * @dev Adds fee.
   * @param _type Fee type.
   * @param _token Token address. 0x0 - ETH.
   * @param _amount Fee amount.
   * @param _referralAddress Referral address.
   */
  function addFee(FeeType _type, address _token, uint256 _amount, address _referralAddress) internal {
    if (_amount > 0) {
      if (_type == FeeType.partner) {
        if (partner != address(0)) {
          partnerFeePending[_token][partner] = partnerFeePending[_token][partner].add(_amount);
        }
      } else if (_type == FeeType.referral) {
        if (_referralAddress != address(0)) {
          referralFeePending[_token][_referralAddress] = referralFeePending[_token][_referralAddress].add(_amount);
        }
      } else if (_type == FeeType.dev) {
        devFeePending[_token] = devFeePending[_token].add(_amount);
      } else if (_type == FeeType.stake) {
        stakeRewardPoolPending_ETH = stakeRewardPoolPending_ETH.add(_amount);
      } else {
        revert("Wrong fee type");
      }
    }
  }


  /***
   * @dev Gets partner fee pending of sender.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getPartnerFeePending(address _token) external view returns (uint256) {
    return partnerFeePending[_token][msg.sender];
  }
  
  /***
   * @dev Gets partner fee withdrawn of sender.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getPartnerFeeWithdrawn(address _token) external view returns (uint256) {
    return partnerFeeWithdrawn[_token][msg.sender];
  }
  
  /***
   * @dev Gets partner fee withdrawn total.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getPartnerFeeWithdrawnTotal(address _token) external view returns (uint256) {
    return partnerFeeWithdrawnTotal[_token];
  }


  /***
   * @dev Gets referral fee pending of sender.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getReferralFeePending(address _token) external view returns (uint256) {
    return referralFeePending[_token][msg.sender];
  }
  
  /***
   * @dev Gets referral fee withdrawn of sender.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getReferralFeeWithdrawn(address _token) external view returns (uint256) {
    return referralFeeWithdrawn[_token][msg.sender];
  }
  
  /***
   * @dev Gets referral fee withdrawn total.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getReferralFeeWithdrawnTotal(address _token) external view returns (uint256) {
    return referralFeeWithdrawnTotal[_token];
  }


  /***
   * @dev Gets dev fee pending.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getDevFeePending(address _token) external view onlyOwner returns (uint256) {
    return devFeePending[_token];
  }
  
  /***
   * @dev Gets dev fee withdrawn.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getDevFeeWithdrawn(address _token) external view onlyOwner returns (uint256) {
    return devFeeWithdrawn[_token];
  }
  
  /***
   * @dev Gets dev fee withdrawn total.
   * @param _token Token address. if 0x0 - ETH.
   * @return Fee amount.
   */
  function getDevFeeWithdrawnTotal(address _token) external view onlyOwner returns (uint256) {
    return devFeeWithdrawnTotal[_token];
  }

  /***
   * @dev Withdraws partner fee.
   * @param _token Token address. if 0x0 - ETH.
   */
  function withdrawPartnerFee(address _token) external {
    uint256 feeTmp = partnerFeePending[_token][msg.sender];
    require(feeTmp > 0, "no fee");

    delete partnerFeePending[_token][msg.sender];
    partnerFeeWithdrawn[_token][msg.sender] = partnerFeeWithdrawn[_token][msg.sender].add(feeTmp);
    partnerFeeWithdrawnTotal[_token] = partnerFeeWithdrawnTotal[_token].add(feeTmp);

    if (_token != address(0)) {
      ERC20(_token).transfer(msg.sender, feeTmp);
    } else {
      msg.sender.transfer(feeTmp);
    }
  }
  
  /***
   * @dev Withdraws referral fee.
   * @param _token Token address. if 0x0 - ETH.
   */
  function withdrawReferralFee(address _token) external {
    uint256 feeTmp = referralFeePending[_token][msg.sender];
    require(feeTmp > 0, "no fee");

    delete referralFeePending[_token][msg.sender];
    referralFeeWithdrawn[_token][msg.sender] = referralFeeWithdrawn[_token][msg.sender].add(feeTmp);
    referralFeeWithdrawnTotal[_token] = referralFeeWithdrawnTotal[_token].add(feeTmp);

    if (_token != address(0)) {
      ERC20(_token).transfer(msg.sender, feeTmp);
    } else {
      msg.sender.transfer(feeTmp);
    }
  }

  /***
   * @dev Withdraws dev fee.
   * @param _token Token address. if 0x0 - ETH.
   */
  function withdrawDevFee(address _token) external onlyOwner {
    uint256 feeTmp = devFeePending[_token];
    require(feeTmp > 0, "no fee");

    delete devFeePending[_token];
    devFeeWithdrawn[_token] = devFeeWithdrawn[_token].add(feeTmp);
    devFeeWithdrawnTotal[_token] = devFeeWithdrawnTotal[_token].add(feeTmp);

    if (_token != address(0)) {
      ERC20(_token).transfer(msg.sender, feeTmp);
    } else {
      msg.sender.transfer(feeTmp);
    }
  }
}