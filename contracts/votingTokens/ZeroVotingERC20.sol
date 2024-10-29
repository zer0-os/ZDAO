// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
* Throw this error if someone submits a non-zero token burn address.
* @param to address to send the transaction.
*/
error InvalidBurnAddress(address to);

contract ZeroVotingERC20 is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor(
        string memory name,
        string memory symbol
    )
        ERC20(name, symbol) 
        ERC20Permit(name)
        Ownable() 
    {}

    function burn(
        address account,
        uint256 amount
    ) public {
        if (account == address(0)) {
            _burn(account, amount);
        } else {
            revert InvalidBurnAddress(account);
        }
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override (ERC20, ERC20Votes) {
        super._burn(
        account,
        amount            
        );
    }

    function _mint(
        address account,
        uint256 amount
    ) internal override (ERC20, ERC20Votes) {
        super._mint(
            account,
            amount
        );
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override (ERC20, ERC20Votes) {
        super._afterTokenTransfer(
            from,
            to,
            amount
        );
    }
}