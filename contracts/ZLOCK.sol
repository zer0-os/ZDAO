// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract ZLOCK {
    // Instance of the TimelockController contract
    TimelockController public timelock;

    // Set up roles for proposal execution
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor(
        uint256 minDelay,               // Minimum delay before executing
        address[] memory proposers,      // List of addresses that can propose
        address[] memory executors,      // List of addresses that can execute
        address admin                   // Admin address with admin role
    ) {
        // Initialize the TimelockController
        timelock = new TimelockController(minDelay, proposers, executors, admin);

        // Grant admin the necessary roles
        _grantRole(PROPOSER_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function _grantRole(bytes32 role, address account) internal {
        timelock.grantRole(role, account);
    }

    function _revokeRole(bytes32 role, address account) internal {
        timelock.revokeRole(role, account);
    }
}
