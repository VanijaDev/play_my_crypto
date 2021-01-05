// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract PMCt is ERC20("PlayMyCrypto token", "PMCt"), Ownable {
  mapping(address => bool) minters;

  function mint(address account, uint256 amount) public {
    require(minters[msg.sender], "Not minter");

    super._mint(account, amount);
  }

  /**
   * @dev Adds address, that can mint tokens.
   * @param _minter Minter address.
   */
  function addMinter(address _minter) external onlyOwner {
    require(_minter != address(0), "Wrong minter");
    require(!minters[msg.sender], "Already minter");

    minters[_minter] = true;
  }

  /**
   * @dev Removes address from minters array.
   * @param _minter Minter address.
   */
  function removeMinter(address _minter) external onlyOwner {
    require(_minter != address(0), "Wrong minter");
    require(minters[msg.sender], "Not minter");

    delete minters[_minter];
  }
}