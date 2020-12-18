// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Mortable is Ownable {
  using SafeMath for uint256;

  uint256 mortalStartedAt;
  uint256 mortalPeriod = 40320; //  blocks

  modifier onlyLivable {
    require(mortalStartedAt == 0, "mortal started");
    _;
  }

  function startMortal() external onlyOwner {
    mortalStartedAt = block.number;
  }

  function kill() external {
    require(block.number > mortalStartedAt.add(mortalPeriod), "still alive");
    selfdestruct(address(0));
  }
}