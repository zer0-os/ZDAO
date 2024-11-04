// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZeroVotingERC721 is ERC721Votes, Ownable {
     /**
     * @dev Initializes the ERC721 token with a name, symbol, and version for EIP-712 compatibility.
     *
     * @param name The name of the ERC721 token.
     * @param symbol The symbol of the ERC721 token.
     * @param version The version string for EIP-712 domain separator.
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory version
    )
        ERC721(name, symbol)
        EIP712(name, version)
        ERC721Votes()
        Ownable()
    {}

    /**
     * @dev Executes additional logic after a token transfer, overriding ERC721Votes behavior.
     *
     * @param from The address sending the tokens.
     * @param to The address receiving the tokens.
     * @param firstTokenId The ID of the first token being transferred.
     * @param batchSize The number of tokens being transferred in the batch.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override (ERC721Votes) {
        super._afterTokenTransfer(
            from,
            to,
            firstTokenId,
            batchSize
        );
    }

    /**
     * @dev Burns a specific token by its ID, removing it from circulation.
     * Overrides the default ERC721 `_burn` behavior.
     *
     * @param tokenId The ID of the token to burn.
     */

    // TODO: add access control!!
    function _burn(
        uint256 tokenId
    ) internal override (ERC721) {
        super._burn(tokenId);
    }
}