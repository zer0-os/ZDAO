// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title ZeroVotingERC721 Interface
 */
interface IZeroVotingERC721 {
    /**
     * @dev Emitted when a new token is minted.
     * @param to The address that received the minted token.
     * @param tokenId The ID of the minted token.
     */
    event Mint(address indexed to, uint256 indexed tokenId);

    /**
     * @dev Emitted when a token is burned.
     * @param owner The address that owned the burned token.
     * @param tokenId The ID of the burned token.
     */
    event Burn(address indexed owner, uint256 indexed tokenId);

    /**
     * @dev External mint function. Mints a new token to a specified address.
     * @param to The address that will receive the minted token.
     * @param tokenId The token ID for the newly minted token.
     */
    function mint(address to, uint256 tokenId) external;

    /**
     * @dev External burn function. Burns a token for a specified address.
     * @param tokenId The token ID of the token to burn.
     */
    function burn(uint256 tokenId) external;

    /**
     * @dev Overridden function to support the interfaces of ERC721 and AccessControl.
     * @param interfaceId The interface identifier to check.
     * @return True if the contract supports the given interface.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
