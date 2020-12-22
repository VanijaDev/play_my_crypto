// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract PMCt is ERC20("PlayMyCrypto token", "PMCt"), Ownable {
  function mint(address account, uint256 amount) public onlyOwner {
    super._mint(account, amount);
  }
}
