// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {LibBasicVoting} from "../libraries/LibBasicVoting.sol";
import {LibProposal} from "../libraries/LibProposal.sol";
import {LibZDAOCore} from "../libraries/LibZDAOCore.sol";
import {LibExecute} from "../libraries/LibExecute.sol";
import {IZeroToken} from "../interfaces/IZeroToken.sol";

contract BasicVotingFacet {
  event ProposalCreated(
    address creator,
    uint256 proposalId,
    uint256 snapshotId,
    uint256 totalVotingPower,
    address to,
    uint256 value,
    bytes data
  );

  event ProposalVotedOn(
    uint256 indexed proposalId,
    address voter,
    uint256 weight,
    bool inFavor
  );

  event AbsoluteVoteProposalPassed(uint256 indexed proposalId);
  event AbsoluteVoteProposalRejected(uint256 indexed proposalId);

  event ExecutedProposal(uint256 indexed proposalId, bool success);

  function createProposal(
    address to,
    uint256 value,
    bytes calldata data
  ) public returns (uint256) {
    // Must own some of the membership token to create a proposal
    IZeroToken membershipToken = LibZDAOCore.membershipToken();
    uint256 callerTokenBalance = membershipToken.balanceOf(msg.sender);
    require(callerTokenBalance > 0, "ZDAO: 0001");

    // We need to keep track of the snapshot id to calculate voting
    uint256 snapshotId = membershipToken.snapshot();
    uint256 totalVotingPower = membershipToken.totalSupplyAt(snapshotId);

    uint256 proposalNonce = LibProposal.createProposal(
      to,
      value,
      data,
      snapshotId
    );

    emit ProposalCreated(
      msg.sender,
      proposalNonce,
      snapshotId,
      totalVotingPower,
      to,
      value,
      data
    );

    return proposalNonce;
  }

  function voteOnProposal(uint256 proposalId, bool inFavor) public {
    // Must own some of the membership token to vote on a proposal
    IZeroToken membershipToken = LibZDAOCore.membershipToken();
    uint256 callerTokenBalance = membershipToken.balanceOf(msg.sender);
    require(callerTokenBalance > 0, "ZDAO: 0003");

    // Must be a valid proposal
    require(LibProposal.proposalExists(proposalId), "ZDAO: 0004");

    LibProposal.Proposal storage proposal = LibProposal.proposalDetails(
      proposalId
    );

    // Must not have been executed
    require(!proposal.executed, "ZDAO: 0005");

    LibBasicVoting.BasicVotingStorage storage bvs = LibBasicVoting
      .basicVotingStorage();

    // Voting period must not have passed yet
    require(block.number < proposal.createdOn + bvs.voteTime, "ZDAO: 0006");

    // Voting has not already passed this proposal (used only for absolute voting)
    require(!LibBasicVoting.proposalHasPassed(proposalId), "ZDAO: 0007A");
    require(!LibBasicVoting.proposalHasRejected(proposalId), "ZDAO: 0007B");

    // Cannot vote twice on a proposal
    require(!bvs.votingData[proposalId].voters[msg.sender], "ZDAO: 0008");

    // Get voting weight of voter at start
    uint256 votingPower = membershipToken.balanceOfAt(
      msg.sender,
      proposal.snapshotId
    );

    if (inFavor) {
      bvs.votingData[proposalId].weightFor += votingPower;
    } else {
      bvs.votingData[proposalId].weightAgainst += votingPower;
    }

    bvs.votingData[proposalId].voters[msg.sender] = true;

    emit ProposalVotedOn(proposalId, msg.sender, votingPower, inFavor);

    // Absolute votes can pass early, so check if it passed
    if (bvs.voteType == LibBasicVoting.VotingType.Absolute) {
      uint256 totalVotingPower = membershipToken.totalSupplyAt(
        proposal.snapshotId
      );

      if (inFavor) {
        uint256 percentFor = LibBasicVoting.calculatePercent(
          bvs.votingData[proposalId].weightFor,
          totalVotingPower
        );

        if (percentFor > bvs.threshold) {
          // Vote has passed
          bvs.votingData[proposalId].hasPassed = true;
          emit AbsoluteVoteProposalPassed(proposalId);
        }
      } else {
        uint256 percentAgainst = LibBasicVoting.calculatePercent(
          bvs.votingData[proposalId].weightAgainst,
          totalVotingPower
        );

        if (percentAgainst > ((10**18) - bvs.threshold)) {
          // Vote has passed
          bvs.votingData[proposalId].hasRejected = true;
          emit AbsoluteVoteProposalRejected(proposalId);
        }
      }
    }
  }

  function executeProposal(uint256 proposalId) public returns (bool success) {
    // Must be a valid proposal
    require(LibProposal.proposalExists(proposalId), "ZDAO: 0009");

    LibProposal.Proposal storage proposal = LibProposal.proposalDetails(
      proposalId
    );

    // Must not have been executed
    require(!proposal.executed, "ZDAO: 0010");

    LibBasicVoting.BasicVotingStorage storage bvs = LibBasicVoting
      .basicVotingStorage();

    if (bvs.voteType == LibBasicVoting.VotingType.Absolute) {
      require(LibBasicVoting.proposalHasPassed(proposalId), "ZDAO: 0011");
    } else {
      // Voting period must have ended
      require(block.number > proposal.createdOn + bvs.voteTime, "ZDAO: 0012");

      LibBasicVoting.ProposalVotingData storage proposalData = bvs.votingData[
        proposalId
      ];

      uint256 percentInFavor = LibBasicVoting.calculatePercent(
        proposalData.weightFor,
        proposalData.weightFor + proposalData.weightAgainst
      );

      require(percentInFavor >= bvs.threshold, "ZDAO: 0013");
    }

    {
      proposal.executed = true;

      // Execute the proposal
      success = LibExecute.execute(
        proposal.to,
        proposal.value,
        proposal.data,
        gasleft() - 2000 // Save some gas for emitting events, only really need ~1262 though
      );

      emit ExecutedProposal(proposalId, success);
    }
  }

  function proposalHasPassed(uint256 proposalId) public view returns (bool) {
    // Must be a valid proposal
    require(LibProposal.proposalExists(proposalId), "ZDAO: 0004");

    LibBasicVoting.BasicVotingStorage storage bvs = LibBasicVoting
      .basicVotingStorage();

    // Absolute votes can pass early, so check if it passed
    if (bvs.voteType == LibBasicVoting.VotingType.Absolute) {
      return LibBasicVoting.proposalHasPassed(proposalId);
    }

    LibProposal.Proposal storage proposal = LibProposal.proposalDetails(
      proposalId
    );

    // Relative only passes after expiration
    if (block.number < proposal.createdOn + bvs.voteTime) {
      return false;
    }

    LibBasicVoting.ProposalVotingData storage proposalData = bvs.votingData[
      proposalId
    ];

    uint256 percentInFavor = LibBasicVoting.calculatePercent(
      proposalData.weightFor,
      proposalData.weightFor + proposalData.weightAgainst
    );

    return percentInFavor >= bvs.threshold;
  }
}
