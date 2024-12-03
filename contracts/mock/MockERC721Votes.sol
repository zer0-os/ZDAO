// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../votingTokens/ZeroVotingERC721.sol";


/**
 * @title MockERC721Votes
 * @dev ERC721 token with governance voting capabilities using OpenZeppelin's ERC721Votes.
 */
contract MockERC721Votes is ZeroVotingERC721 {

    constructor(
        string memory name,
        string memory symbol,
        string memory version,
        address deployer
    ) 
        ZeroVotingERC721 (name, symbol, version, deployer)
    {}
}
