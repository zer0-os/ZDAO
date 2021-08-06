// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library LibBasicVoting {
  bytes32 constant BASIC_VOTING_STORAGE_POSITION =
    keccak256("zer0.zdao.basicvoting.storage.v0");

  uint64 constant PERCENT_BASE = 10**18;

  enum VotingType {
    Absolute,
    Relative
  }

  struct ProposalVotingData {
    uint256 weightFor;
    uint256 weightAgainst;
    bool hasPassed; // will only be set if voting is Absolute
    bool hasRejected; // will only be set if voting is Absolute
    mapping(address => bool) voters;
  }

  struct BasicVotingStorage {
    VotingType voteType;
    uint256 voteTime; // Time to vote (in blocks)
    uint256 threshold; // % required to vote [18 decimals; 10^18 = 100%]
    mapping(uint256 => ProposalVotingData) votingData;
  }

  function basicVotingStorage()
    internal
    pure
    returns (BasicVotingStorage storage ds)
  {
    bytes32 position = BASIC_VOTING_STORAGE_POSITION;
    assembly {
      ds.slot := position
    }
  }

  function setVotingParams(
    VotingType voteType,
    uint256 voteTime,
    uint32 threshold
  ) internal {
    // Threshold can never be over 100%
    require(threshold <= 10**18, "ZDAO: 0002");

    BasicVotingStorage storage s = basicVotingStorage();
    s.voteType = voteType;
    s.voteTime = voteTime;
    s.threshold = threshold;
  }

  function proposalHasPassed(uint256 proposalId) internal view returns (bool) {
    BasicVotingStorage storage s = basicVotingStorage();
    return s.votingData[proposalId].hasPassed;
  }

  function proposalHasRejected(uint256 proposalId)
    internal
    view
    returns (bool)
  {
    BasicVotingStorage storage s = basicVotingStorage();
    return s.votingData[proposalId].hasRejected;
  }

  function calculatePercent(uint256 value, uint256 total)
    internal
    pure
    returns (uint256 calculatedPercent)
  {
    if (total == 0) {
      return 0;
    }

    calculatedPercent = (value * PERCENT_BASE) / total;
  }
}
