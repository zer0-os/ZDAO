// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {LibExecute} from "./LibExecute.sol";

library LibProposal {
  bytes32 constant PROPOSAL_STORAGE_POSITION =
    keccak256("zer0.zdao.proposal.storage.v0");

  struct Proposal {
    address to;
    uint256 value;
    bytes data;
    uint256 snapshotId;
    uint256 createdOn;
    bool executed;
  }

  struct ProposalStorage {
    mapping(uint256 => Proposal) proposals;
    uint256 nonce;
  }

  function proposalStorage()
    internal
    pure
    returns (ProposalStorage storage ds)
  {
    bytes32 position = PROPOSAL_STORAGE_POSITION;
    assembly {
      ds.slot := position
    }
  }

  function createProposal(
    address to,
    uint256 value,
    bytes calldata data,
    uint256 snapshotId
  ) internal returns (uint256) {
    require(LibExecute.isContractSafelisted(to), "ZDAO: 0015");

    ProposalStorage storage s = proposalStorage();

    s.proposals[++s.nonce] = Proposal({
      to: to,
      value: value,
      data: data,
      snapshotId: snapshotId,
      executed: false,
      createdOn: block.number
    });

    return s.nonce;
  }

  function proposalExists(uint256 proposalId) internal view returns (bool) {
    ProposalStorage storage s = proposalStorage();
    return s.proposals[proposalId].createdOn > 0;
  }

  function proposalDetails(uint256 proposalId)
    internal
    view
    returns (Proposal storage proposal)
  {
    ProposalStorage storage ps = proposalStorage();
    proposal = ps.proposals[proposalId];
  }
}
