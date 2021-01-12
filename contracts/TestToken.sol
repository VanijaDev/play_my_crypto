// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20("Test Token", "TT") {
  constructor() {
    _mint(msg.sender, 100000*10**18);
  }
}
