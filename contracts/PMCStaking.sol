// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./PMC.sol";
import "./PMC_IStaking.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @notice ETH only. 
 * User, who has PMC stake will get reward from all the games on the platform. Replenishment from each game goes to single staking pool.
 */
contract PMCStaking is Ownable, PMC_IStaking {
  using SafeMath for uint256;

  address public pmcAddr;
  
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
  mapping(address => uint256) public stakingRewardWithdrawnOf;

  mapping(address => bool) public gameplaySupported;

  event Unstake(address indexed addr);
  
  /***
   * @dev Constructor.
   * @param _pmc PMC token address.
   * @param _gameplay Gameplay address.
   */
  constructor(address _pmc, address _gameplay) {
    require(_pmc != address(0), "Wrong _pmc");
    require(_gameplay != address(0), "Wrong _gameplay");
    
    pmcAddr = _pmc;
    gameplaySupported[_gameplay] = true;
  }

  /***
   * @dev Adds gameplay to accept replenish from.
   * @param _gameplay Gameplay address.
   */
  function addGame(address _gameplay) external onlyOwner {
    require(_gameplay != address(0), "Wrong _gameplay");
    
    gameplaySupported[_gameplay] = true;
  }

  /***
   * @dev Removes gameplay to accept replenish from.
   * @param _gameplay Gameplay address.
   */
  function removeGame(address _gameplay) external onlyOwner {
    require(_gameplay != address(0), "Wrong _gameplay");
    
    delete gameplaySupported[_gameplay];
  }

  /***
   * @dev Adds ETH to reward pool.
   */
  function replenishRewardPool() override external payable {
    require(gameplaySupported[msg.sender], "Wrong sender");
    require(msg.value > 0, "Wrong value");
    
    incomes.push(StateForIncome(msg.value, tokensStaked));
  }

  /***
   * @dev Stakes PMC tokens.
   * @param _tokens Token amount.
   */
  function stake(uint256 _tokens) external {
    require(_tokens > 0, "0 tokens");
    ERC20(pmcAddr).transferFrom(msg.sender, address(this), _tokens);
    
    if (stakeOf[msg.sender] == 0) {
      if (tokensStaked == 0) {
        incomeIdxToStartCalculatingRewardOf[msg.sender] = incomeIdxToStartCalculatingRewardIfNoStakes;
      } else {
        incomeIdxToStartCalculatingRewardOf[msg.sender] = getIncomeCount();
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

  /***
   * @dev Unstakes PMC tokens.
   */
  function unstake() external {
    uint256 tokens = stakeOf[msg.sender];
    require(tokens > 0, "No stake");

    withdrawReward(0);  //  if tx fails, then firstly withdrawReward(_loopNumber)

    delete stakeOf[msg.sender];
    tokensStaked = tokensStaked.sub(tokens);

    if (tokensStaked == 0) {
      incomeIdxToStartCalculatingRewardIfNoStakes = getIncomeCount();
    }
    
    ERC20(pmcAddr).transfer(msg.sender, tokens);

    emit Unstake(msg.sender);
  }

  /***
   * @dev Withdraws staking reward.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   */
  function withdrawReward(uint256 _maxLoop) public {
    uint256 reward;
    uint256 idx;
    (reward, idx) = calculateRewardAndStartIncomeIdx(_maxLoop);

    if (reward > 0) {
      incomeIdxToStartCalculatingRewardOf[msg.sender] = idx;
      if (pendingRewardOf[msg.sender] > 0) {
        reward = reward.add(pendingRewardOf[msg.sender]);
        delete pendingRewardOf[msg.sender];
      }

      stakingRewardWithdrawnOf[msg.sender] = stakingRewardWithdrawnOf[msg.sender].add(reward);
      msg.sender.transfer(reward);
    }
  }

  /***
   * @dev Calculates staking reward.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   * @return reward Reward amount.
   * @return _incomeIdxToStartCalculatingRewardOf Income index to start calculate.
   */
  function calculateRewardAndStartIncomeIdx(uint256 _maxLoop) public view returns(uint256 reward, uint256 _incomeIdxToStartCalculatingRewardOf) {
    uint256 incomesLength = getIncomeCount();
    if (incomesLength > 0) {
      if (stakeOf[msg.sender] > 0) {
        uint256 startIdx = incomeIdxToStartCalculatingRewardOf[msg.sender];
        if (startIdx < incomesLength) {
          uint256 incomesToCalculate = incomesLength.sub(startIdx);
          uint256 stopIdx = ((_maxLoop > 0 && _maxLoop < incomesToCalculate)) ? startIdx.add(_maxLoop) : startIdx.add(incomesToCalculate);
      
          for (uint256 i = startIdx; i < stopIdx; i++) {
            StateForIncome storage incomeTmp = incomes[i];
            uint256 incomeReward = (incomeTmp.tokensStaked > 0) ? incomeTmp.income.mul(stakeOf[msg.sender]).div(incomeTmp.tokensStaked) : incomeTmp.income;
            reward = reward.add(incomeReward);
          }

          _incomeIdxToStartCalculatingRewardOf = stopIdx;
        }
      }
    }
  }

  /***
   * @dev Gets income count.
   * @return Income count.
   */
  function getIncomeCount() public view returns (uint256) {
    return incomes.length;
  }

  /***
   * @dev Gets income info.
   * @param _idx Index.
   * @return income Income amount replenished.
   * @return tokensStakedAmount Tokens staked when replenished.
   */
  function getIncomeInfo(uint256 _idx) public view returns (uint256 income, uint256 tokensStakedAmount) {
    income = incomes[_idx].income;
    tokensStakedAmount = incomes[_idx].tokensStaked;
  }
}