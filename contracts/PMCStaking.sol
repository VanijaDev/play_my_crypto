// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./PMCt.sol";
import "./PMC_IStaking.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @notice ETH only
 */
contract PMCStaking is PMC_IStaking {
  using SafeMath for uint256;

  address public pmctAddr;
  address public gameplayAddr;
  
  struct StateForIncome {
    uint256 income;
    uint256 tokensStaked;
  }

  uint256 public tokensStaked;
  uint256 public incomeIdxToStartCalculatingRewardIfNoStakes;
  StateForIncome[] private incomes;

  mapping(address => uint256) public incomeIdxToStartCalculatingRewardOf;
  mapping(address => uint256) public pendingRewardOf;
  mapping(address => uint256) public stakeOf;
  
  /**
   * @dev Constructor.
   * @param _pmct PMCt token address.
   * @param _gameplay Gameplay address.
   */
  constructor(address _pmct, address _gameplay) {
    require(_pmct != address(0), "Wrong _pmct");
    require(_gameplay != address(0), "Wrong _gameplay");
    
    pmctAddr = _pmct;
    gameplayAddr = _gameplay;
  }

  /**
   * @dev Adds ETH to reward pool.
   */
  function replenishRewardPool() override external payable {
    require(msg.sender == gameplayAddr, "Wrong sender");
    require(msg.value > 0, "Wrong value");
    
    incomes.push(StateForIncome(msg.value, tokensStaked));
  }

  /**
   * @dev Stakes PMCt tokens.
   * @param _tokens Token amount.
   */
  function stake(uint256 _tokens) external {
    require(_tokens > 0, "0 tokens");
    ERC20(pmctAddr).transferFrom(msg.sender, address(this), _tokens);
    
    if (stakeOf[msg.sender] == 0) {
      if (tokensStaked == 0) {
        incomeIdxToStartCalculatingRewardOf[msg.sender] = incomeIdxToStartCalculatingRewardIfNoStakes;
      } else {
        incomeIdxToStartCalculatingRewardOf[msg.sender] = incomes.length;
      }
    } else {
      uint256 reward;
      uint256 _incomeIdxToStartCalculatingRewardOf;
      (reward, _incomeIdxToStartCalculatingRewardOf) = calculateRewardAndStartIncomeIdx(0);  //  if tx fails, then firstly withdrawReward(_loopNumber)
      
      if (reward > 0) {
        pendingRewardOf[msg.sender] = pendingRewardOf[msg.sender].add(reward);
        incomeIdxToStartCalculatingRewardOf[msg.sender] = _incomeIdxToStartCalculatingRewardOf;
      }
    }

    stakeOf[msg.sender] = stakeOf[msg.sender].add(_tokens);
    tokensStaked = tokensStaked.add(_tokens);
  }

  /**
   * @dev Unstakes PMCt tokens.
   */
  function unstake() external {
    uint256 tokens = stakeOf[msg.sender];
    require(tokens > 0, "No stake");

    withdrawReward(0);  //  if tx fails, then firstly withdrawReward(_loopNumber)

    delete stakeOf[msg.sender];
    tokensStaked = tokensStaked.sub(tokens);

    if (tokensStaked == 0) {
      incomeIdxToStartCalculatingRewardIfNoStakes = incomes.length;
    }
    
    ERC20(pmctAddr).transfer(msg.sender, tokens);
  }

  /**
   * @dev Withdraws staking reward.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   */
  function withdrawReward(uint256 _maxLoop) public {
    uint256 reward;
    uint256 _incomeIdxToStartCalculatingRewardOf;
    (reward, _incomeIdxToStartCalculatingRewardOf) = calculateRewardAndStartIncomeIdx(_maxLoop);

    if (reward > 0) {
      incomeIdxToStartCalculatingRewardOf[msg.sender] = _incomeIdxToStartCalculatingRewardOf;
      if (pendingRewardOf[msg.sender] > 0) {
        reward = reward.add(pendingRewardOf[msg.sender]);
        delete pendingRewardOf[msg.sender];
      }

      msg.sender.transfer(reward);
    }
  }

  /**
   * @dev Calculates staking reward.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   */
  function calculateRewardAndStartIncomeIdx(uint256 _maxLoop) public view returns(uint256 reward, uint256 _incomeIdxToStartCalculatingRewardOf) {
    if (stakeOf[msg.sender] > 0) {
      uint256 incomesLength = incomes.length;
      if (incomesLength > 0) {
        uint256 startIdx = incomeIdxToStartCalculatingRewardOf[msg.sender];
        if (startIdx < incomesLength) {
          
          uint256 incomesToCalculate = incomesLength.sub(startIdx);
          uint256 stopIdx = ((_maxLoop > 0 && _maxLoop < incomesToCalculate)) ? startIdx.add(_maxLoop).sub(1) : startIdx.add(incomesToCalculate).sub(1);
      
          for (uint256 i = startIdx; i <= stopIdx; i++) {
            StateForIncome storage incomeTmp = incomes[i];
            uint256 incomeReward = (incomeTmp.tokensStaked > 0) ? incomeTmp.income.mul(stakeOf[msg.sender]).div(incomeTmp.tokensStaked) : incomeTmp.income;
            reward = reward.add(incomeReward);
          }
      
          _incomeIdxToStartCalculatingRewardOf = stopIdx.add(1);
        }
      }
    }
  }
}