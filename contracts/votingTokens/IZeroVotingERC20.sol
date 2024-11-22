// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title Interface for ZeroVotingERC20 contract
 */
interface IZeroVotingERC20 is IERC20, IERC20Permit, IAccessControl {

    /**
     * @dev Burns a specified amount of tokens from the sender's account.
     * @param account The account from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(address account, uint256 amount) external;

    /**
     * @dev Mints a specified amount of tokens to a specified account.
     * @param account The address to receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address account, uint256 amount) external;
}
