// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
* Throw this error if someone submits a zero token burn address.
* @param to address to send the transaction.
*/
error InvalidBurnAddress(address to);

contract ZeroVotingERC20 is ERC20, ERC20Permit, ERC20Votes, Ownable {

     /**
     * @dev Initializes the token with name and symbol, also sets up ERC20Permit and ownership.
     *
     * @param name The name of the ERC20 token.
     * @param symbol The symbol of the ERC20 token.
     */
    constructor(
        string memory name,
        string memory symbol
    )
        ERC20(name, symbol) 
        ERC20Permit(name)
        Ownable() 
    {}

    /**
     * @dev Burns a specific amount of tokens from the specified account.
     *
     * @param account The address from which tokens will be burned.
     * @param amount The amount of tokens to burn from the specified account.
     */

    // TODO: add access control!!
    function burn(
        address account,
        uint256 amount
    ) public {
        _burn(
            account,
            amount
        );
    }

    /**
     * @dev Internal burn function overriding ERC20 and ERC20Votes.
     * Burns a specified amount of tokens from a specified account.
     *
     * @param account The address from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function _burn(
        address account,
        uint256 amount
    ) internal override (ERC20, ERC20Votes) {
        super._burn(
            account,
            amount   
        );
    }

    /**
     * @dev Internal mint function overriding ERC20 and ERC20Votes.
     * Mints a specified amount of tokens to a specified account.
     *
     * @param account The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint to the specified account.
     */

    // TODO: add access control
    // 1. How to make mint? Who'll be able to mint?
    function _mint(
        address account,
        uint256 amount
    ) internal override (ERC20, ERC20Votes) {
        super._mint(
            account,
            amount
        );
    }

    /**
     * @dev Handles actions to be performed after token transfers, overriding ERC20 and ERC20Votes.
     *
     * @param from The address sending the tokens.
     * @param to The address receiving the tokens.
     * @param amount The amount of tokens being transferred.
     */
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