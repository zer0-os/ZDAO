// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IZeroVotingERC721.sol";

contract ZeroVotingERC721 is ERC721Votes, AccessControl, IZeroVotingERC721 {

    bytes32 public constant DEFAULT_ADMIN_ROLE_PUBLIC = DEFAULT_ADMIN_ROLE;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

     /**
     * @dev Initializes the ERC721 token with a name, symbol, and version for EIP-712 compatibility.
     * @param name The name of the ERC721 token.
     * @param symbol The symbol of the ERC721 token.
     * @param version The version string for EIP-712 domain separator.
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory version,
        address deployer
    )
        ERC721(name, symbol)
        EIP712(name, version)
        ERC721Votes()
        AccessControl()
    {
        // temporary TODO: decide, who gets the roles
        _setupRole(DEFAULT_ADMIN_ROLE, deployer);
        _setupRole(BURNER_ROLE, deployer);
        _setupRole(MINTER_ROLE, deployer);
    }

    /**
     * @dev External mint function. Mints a new token to a specified address.
     * @param to The address that will receive the minted token.
     * @param tokenId The token ID for the newly minted token.
     */
    function mint(
        address to,
        uint256 tokenId
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, tokenId);
    }

    /**
     * @dev Internal mint function overriding ERC721.
     * @param to The address that will receive the minted token.
     * @param tokenId The token ID for the newly minted token.
     */
    function _mint(
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        super._mint(to, tokenId);
    }

    /**
     * @dev External burn function. Burns a token for a specified address.
     * @param tokenId The token ID of the token to burn.
     */
    function burn(
        uint256 tokenId
    ) external onlyRole(BURNER_ROLE) {
        _burn(tokenId);
    }

    /**
     * @dev Internal burn function overriding ERC721.
     * @param tokenId The token ID of the token to burn.
     */
    function _burn(
        uint256 tokenId
    ) internal override (ERC721) {
        super._burn(tokenId);
    }

    /**
     * @dev Overridden function to support the interfaces of ERC721 and AccessControl.
     * @param interfaceId The interface identifier to check.
     * @return True if the contract supports the given interface.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl, IZeroVotingERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}