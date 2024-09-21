// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract MockERC20Votes is Ownable, ERC20Votes {
    ///Test token, don't deploy
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
        ERC20Permit(name) // Initialize ERC20Permit with the token name
    {}

    // Mint function with onlyOwner modifier
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
