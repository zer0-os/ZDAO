// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IZeroVotingERC20.sol";

/**
* Throw this error if someone submits a zero token burn address.
* @param to address to send the transaction.
*/
error InvalidBurnAddress(address to);

contract ZeroVotingERC20 is ERC20, ERC20Permit, ERC20Votes, AccessControl, IZeroVotingERC20 {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

     /**
     * @dev Initializes the token with name and symbol, also sets up ERC20Permit and ownership.
     * @param name The name of the ERC20 token.
     * @param symbol The symbol of the ERC20 token.
     */
    constructor(
        string memory name,
        string memory symbol,
        address deployer
    )
        ERC20(name, symbol) 
        ERC20Permit(name)
        AccessControl()
    {
        // temporary TODO: decide, who gets the roles
        _setupRole(DEFAULT_ADMIN_ROLE, deployer);
        _setupRole(BURNER_ROLE, deployer);
        _setupRole(MINTER_ROLE, deployer);
    }

    /**
     * @dev External burn function. Burns a specified amount of tokens from the sender account.
     * @param account Account where tokens need to be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(
        address account,
        uint256 amount
    ) external onlyRole(BURNER_ROLE) {
        _burn(
            account,
            amount   
        );
    }

    /**
     * @dev Internal burn function overriding ERC20 and ERC20Votes.
     * @param account Account where tokens need to be burned.
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
     * @dev External mint function. Mints a specified amount of tokens to a specified account.
     * @param account The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint to the specified account.
     */
    function mint(
        address account,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        _mint(
            account,
            amount
        );
    }

    /**
     * @dev Internal mint function overriding ERC20 and ERC20Votes.
     * @param account The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint to the specified account.
     */
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
     * @dev Internal function afterTokenTransfer overriding ERC20 and ERC20Votes.
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