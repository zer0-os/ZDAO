// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ZDAO} from "../libraries/LibZDAOCore.sol";
import {LibExecute} from "../libraries/LibExecute.sol";

contract ExecuteFacet is ZDAO {
  event ContractSafelisted(address target, bool isSafelisted);

  function safelistContract(address target, bool safelist) public onlySelf {
    LibExecute.safelistContract(target, safelist);

    emit ContractSafelisted(target, safelist);
  }

  function isContractSafelisted(address target) public view returns (bool) {
    bool isSafelisted = LibExecute.isContractSafelisted(target);
    return isSafelisted;
  }
}
