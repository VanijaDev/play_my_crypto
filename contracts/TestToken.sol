// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20("Test Token", "TT") {
  constructor() {
    _mint(msg.sender, 100000*10**18);
  }
}
