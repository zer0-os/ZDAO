// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Governor } from "@openzeppelin/contracts/governance/Governor.sol";
import { GovernorSettings } from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import { GovernorCountingSimple } from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import { GovernorVotes, IVotes } from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import { GovernorTimelockControl, TimelockController } from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {GovernorVotesQuorumFraction } from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

/**
 * @title ZDAO
 */
contract ZDAO is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorTimelockControl,
    GovernorVotesQuorumFraction
{
    constructor(
        string memory governorName,
        IVotes token,
        TimelockController timelock,
        uint delay_,
        uint votingPeriod_,
        uint proposalThreshold_,
        uint quorum_
    )
        Governor(governorName)
        GovernorVotes(token)
        GovernorTimelockControl(timelock)
        GovernorSettings(
            delay_,
            votingPeriod_,
            proposalThreshold_
        )
        GovernorVotesQuorumFraction(quorum_)
    {}

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._execute(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
