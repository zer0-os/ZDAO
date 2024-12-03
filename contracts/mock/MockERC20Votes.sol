// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../votingTokens/ZeroVotingERC20.sol";

contract MockERC20Votes is ZeroVotingERC20 {
    // Test token, don't deploy
    constructor(
        string memory name,
        string memory symbol,
        address deployer
    )
        ZeroVotingERC20(name, symbol, deployer)
    {}
}
