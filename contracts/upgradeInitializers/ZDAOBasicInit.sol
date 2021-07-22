// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IZeroToken} from "../interfaces/IZeroToken.sol";
import {LibZDAOCore} from "../libraries/LibZDAOCore.sol";
import {LibBasicVoting} from "../libraries/LibBasicVoting.sol";

contract ZDAOBasicInit {
  function init(
    address membershipToken,
    LibBasicVoting.VotingType voteType,
    uint256 voteTime,
    uint256 threshold
  ) external {
    LibZDAOCore.ZDAOCoreStorage storage zcs = LibZDAOCore.zDAOCoreStorage();
    zcs.membershipToken = IZeroToken(membershipToken);

    LibBasicVoting.BasicVotingStorage storage bvs = LibBasicVoting
    .basicVotingStorage();
    bvs.voteType = voteType;
    bvs.voteTime = voteTime;
    bvs.threshold = threshold;
  }
}
