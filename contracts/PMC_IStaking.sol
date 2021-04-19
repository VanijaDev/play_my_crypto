// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

/**
 * @dev Interface of the PMCStaking.
 */
interface PMC_IStaking {
    /**
     * @notice Staking Smart Contract uses ETH only as staking reward.
     * @dev Replenishes Staking Smart Contract with ETH value.
     */
    function replenishRewardPool() external payable;
}