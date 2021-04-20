// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "./PMC_IStaking.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice ETH only.
 * User, who has PMC stake will get reward from all the games on the platform. Replenishment from each game goes to single staking pool.
 */
contract PMCStaking is Ownable, PMC_IStaking {
  ERC20 public pmcAddr;
  
  struct StateForReplenishment {
    uint256 replenishment;
    uint256 tokensStaked;
  }

  uint256 public tokensStaked;
  uint256 public replenishmentIdxToStartCalculatingRewardIfNoStakes;
  StateForReplenishment[] private replenishments;

  mapping(address => uint256) public replenishmentIdxToStartCalculatingRewardOf;
  mapping(address => uint256) public pendingRewardOf;
  mapping(address => uint256) public stakeOf;
  mapping(address => uint256) public stakingRewardWithdrawnOf;

  mapping(address => bool) public gameplaySupported;  //  used to prevent spamming with small amounts as each replenishment is added to array.

  event Stake(address indexed addr, uint256 indexed tokens);
  event Unstake(address indexed addr);
  
  /***
   * @dev Constructor.
   * @param _pmc PMC token address.
   * @param _gameplay Gameplay address.
   */
  constructor(address _pmc, address _gameplay) {
    require(_pmc != address(0), "Wrong _pmc");
    require(_gameplay != address(0), "Wrong _gameplay");
    
    pmcAddr = ERC20(_pmc);
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
   * @dev Replenishes reward pool with eth.
   */
  function replenishRewardPool() override external payable {
    require(gameplaySupported[msg.sender], "Wrong sender");
    
    if (msg.value > 0) {
      replenishments.push(StateForReplenishment(msg.value, tokensStaked));
    }
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
        replenishmentIdxToStartCalculatingRewardOf[msg.sender] = replenishmentIdxToStartCalculatingRewardIfNoStakes;
      } else {
        replenishmentIdxToStartCalculatingRewardOf[msg.sender] = getReplenishmentCount();
      }
    } else {
      uint256 reward;
      uint256 _replenishmentIdxToStartCalculatingRewardOf;
      (reward, _replenishmentIdxToStartCalculatingRewardOf) = calculateRewardAndStartReplenishmentIdx(0);  //  if tx fails, then firstly withdrawReward(_loopNumber)
      
      if (reward > 0) {
        pendingRewardOf[msg.sender] = pendingRewardOf[msg.sender] + reward;
        replenishmentIdxToStartCalculatingRewardOf[msg.sender] = _replenishmentIdxToStartCalculatingRewardOf;
      }
    }

    stakeOf[msg.sender] = stakeOf[msg.sender] + _tokens;
    tokensStaked = tokensStaked + _tokens;

    emit Stake(msg.sender, _tokens);
  }

  /***
   * @dev Unstakes PMC tokens.
   */
  function unstake() external {
    uint256 tokens = stakeOf[msg.sender];
    require(tokens > 0, "No stake");

    withdrawReward(0);  //  if tx fails, then firstly withdrawReward(_loopNumber)

    delete stakeOf[msg.sender];
    tokensStaked = tokensStaked - tokens;

    if (tokensStaked == 0) {
      replenishmentIdxToStartCalculatingRewardIfNoStakes = getReplenishmentCount();
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
    (reward, idx) = calculateRewardAndStartReplenishmentIdx(_maxLoop);

    if (reward > 0) {
      replenishmentIdxToStartCalculatingRewardOf[msg.sender] = idx;
      
      if (pendingRewardOf[msg.sender] > 0) {
        uint256 pendingReward = pendingRewardOf[msg.sender];
        delete pendingRewardOf[msg.sender];
        reward = reward + pendingReward;
      }

      stakingRewardWithdrawnOf[msg.sender] = stakingRewardWithdrawnOf[msg.sender] + reward;
      payable(msg.sender).transfer(reward);
    }
  }

  /***
   * @dev Calculates staking reward.
   * @param _maxLoop Max loop. Used as a safeguard for block gas limit.
   * @return reward Reward amount.
   * @return _replenishmentIdxToStartCalculatingRewardOf Replenishment index to start calculating for next staker.
   */
  function calculateRewardAndStartReplenishmentIdx(uint256 _maxLoop) public view returns(uint256 reward, uint256 _replenishmentIdxToStartCalculatingRewardOf) {
    uint256 replenishmentsLength = getReplenishmentCount();
    if (replenishmentsLength > 0) {
      if (stakeOf[msg.sender] > 0) {
        uint256 startIdx = replenishmentIdxToStartCalculatingRewardOf[msg.sender];
        
        if (startIdx < replenishmentsLength) {
          uint256 replenishmentsToCalculate = replenishmentsLength - startIdx;
          uint256 stopIdx = ((_maxLoop > 0 && _maxLoop <= replenishmentsToCalculate)) ? startIdx + _maxLoop - 1 : startIdx + replenishmentsToCalculate - 1;
      
          for (uint256 i = startIdx; i <= stopIdx; i++) {
            StateForReplenishment storage replenishmentTmp = replenishments[i];
            uint256 replenishmentReward = (replenishmentTmp.tokensStaked > 0) ? replenishmentTmp.replenishment * stakeOf[msg.sender] / replenishmentTmp.tokensStaked : replenishmentTmp.replenishment;
            reward = reward + replenishmentReward;
          }

          _replenishmentIdxToStartCalculatingRewardOf = stopIdx + 1;
        }
      }
    }
  }

  /***
   * @dev Gets replenishment count.
   * @return Replenishment count.
   */
  function getReplenishmentCount() public view returns (uint256) {
    return replenishments.length;
  }

  /***
   * @dev Gets replenishment info.
   * @param _idx Index.
   * @return Replenishment replenishment amount replenished.
   * @return tokensStakedAmount Tokens staked when replenished.
   */
  function getReplenishmentInfo(uint256 _idx) public view returns (uint256 replenishment, uint256 tokensStakedAmount) {
    replenishment = replenishments[_idx].replenishment;
    tokensStakedAmount = replenishments[_idx].tokensStaked;
  }
}