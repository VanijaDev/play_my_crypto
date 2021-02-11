// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract PMCt is ERC20("PlayMyCrypto token", "PMCt"), Ownable {
  mapping(address => bool) minters;

  /**
   * @dev Mints tokens to account.
   * @param _receiver Receiver address.
   * @param _amount Token amount to be minted.
   */
  function mint(address _receiver, uint256 _amount) public {
    require(minters[msg.sender], "Not minter");

    super._mint(_receiver, _amount);
  }

  /**
   * @dev Adds address to minters.
   * @param _minter Minter address.
   */
  function addMinter(address _minter) external onlyOwner {
    require(_minter != address(0), "Wrong minter");
    require(!minters[msg.sender], "Already minter");

    minters[_minter] = true;
  }

  /**
   * @dev Removes address from minters.
   * @param _minter Minter address.
   */
  function removeMinter(address _minter) external onlyOwner {
    require(minters[msg.sender], "Not minter");

    delete minters[_minter];
  }
}