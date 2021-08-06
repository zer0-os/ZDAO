// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibExecute} from "../libraries/LibExecute.sol";

contract ZDAOSafelistInit {
  function init(address[] memory defaultSafelist) external {
    for (uint256 i; i < defaultSafelist.length; ++i) {
      LibExecute.safelistContract(defaultSafelist[i], true);
    }
  }
}
