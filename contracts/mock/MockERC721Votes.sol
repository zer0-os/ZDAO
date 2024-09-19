// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC721Votes
 * @dev ERC721 token with governance voting capabilities using OpenZeppelin's ERC721Votes.
 */
contract MockERC721Votes is ERC721Votes, Ownable {

    constructor() ERC721("MockERC721Votes", "M721V") EIP712("name", "version"){}

    /**
     * @dev Mint a new token to a specific address.
     * @param to The address to mint the token to.
     */
    function mint(address to, uint id) external onlyOwner {
        _safeMint(to, id);
    }
}
