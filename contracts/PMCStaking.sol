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
    uint256 stakesTotal;
  }

  bool private stakesStarted;
  uint256 public stakesTotal;
  StateForIncome[] private incomes;

  mapping(address => uint256) public incomeIdxToStartCalculatingRewardOf;
  mapping(address => uint256) public pendingRewardOf;
  mapping(address => uint256) public stakeOf;
  
  /**
   * @dev Constructor.
   * @param _pmct PMCt token address.
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
    require(msg.value > 0, "Wrong replenish amnt");
    
    incomes.push(StateForIncome(msg.value, stakesTotal));
  }

  /**
   * @dev Stakes PMCt tokens.
   * @param _tokens Token amount.
   */
  function stake(uint256 _tokens) external {
    require(_tokens > 0, "0 tokens");
    ERC20(pmctAddr).transferFrom(msg.sender, address(this), _tokens);
    
    if (stakeOf[msg.sender] == 0) {
      if (!stakesStarted) {
        stakesStarted = true;
        incomeIdxToStartCalculatingRewardOf[msg.sender] = 0;
      } else {
        incomeIdxToStartCalculatingRewardOf[msg.sender] = incomes.length;
      }
    } else {
      uint256 reward;
      uint256 _incomeIdxToStartCalculatingRewardOf;
      (reward, _incomeIdxToStartCalculatingRewardOf) = calculateReward(0);  //  if tx fails, then firstly withdrawReward(_loopNumber)
      
      pendingRewardOf[msg.sender] = pendingRewardOf[msg.sender].add(reward);
      incomeIdxToStartCalculatingRewardOf[msg.sender] = _incomeIdxToStartCalculatingRewardOf;
    }

    stakeOf[msg.sender] = stakeOf[msg.sender].add(_tokens);
    stakesTotal = stakesTotal.add(_tokens);
  }

  /**
   * @dev Unstakes PMCt tokens.
   * @param _tokens Token amount.
   */
  function unstake(uint256 _tokens) external {
    require((_tokens > 0) && (_tokens <= stakeOf[msg.sender]), "Wrong tokens");
    withdrawReward(0);  //  if tx fails, then firstly withdrawReward(_loopNumber)

    stakeOf[msg.sender] = stakeOf[msg.sender].sub(_tokens);
    stakesTotal = stakesTotal.sub(_tokens);
    
    ERC20(pmctAddr).transfer(msg.sender, _tokens);
  }

  /**
   * @dev Withdraws staking reward.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   */
  function withdrawReward(uint256 _maxLoop) public {
    uint256 reward;
    uint256 _incomeIdxToStartCalculatingRewardOf;
    (reward, _incomeIdxToStartCalculatingRewardOf) = calculateReward(_maxLoop);

    incomeIdxToStartCalculatingRewardOf[msg.sender] = _incomeIdxToStartCalculatingRewardOf;
    if (pendingRewardOf[msg.sender] > 0) {
      reward.add(pendingRewardOf[msg.sender]);
      delete pendingRewardOf[msg.sender];
    }

    msg.sender.transfer(reward);
  }

  /**
   * @dev Calculates staking reward.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   */
  function calculateReward(uint256 _maxLoop) public view returns(uint256 reward, uint256 _incomeIdxToStartCalculatingRewardOf) {
    require(stakeOf[msg.sender] > 0, "No stake");

    uint256 incomesLength = incomes.length;
    require(incomesLength > 0, "No incomes");

    uint256 startIdx = incomeIdxToStartCalculatingRewardOf[msg.sender];
    require(startIdx < incomesLength, "Nothing to calculate");

    uint256 incomesToCalculate = incomesLength.sub(startIdx);
    uint256 stopIdx = ((_maxLoop > 0 && _maxLoop < incomesToCalculate)) ? startIdx.add(_maxLoop).sub(1) : startIdx.add(incomesToCalculate).sub(1);

    for (uint256 i = startIdx; i <= stopIdx; i++) {
      StateForIncome storage incomeTmp = incomes[i];
      uint256 incomeReward = incomeTmp.income.mul(stakeOf[msg.sender]).div(incomeTmp.stakesTotal);
      reward = reward.add(incomeReward);
    }

    _incomeIdxToStartCalculatingRewardOf = stopIdx.add(1);
  }
}