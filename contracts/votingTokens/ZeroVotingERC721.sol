// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZeroVotingERC721 is ERC721Votes, Ownable {
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

    function _burn(
        uint256 tokenId
    ) internal override (ERC721) {
        super._burn(tokenId);
    }
}