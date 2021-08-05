// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library LibExecute {
  bytes32 constant EXECUTE_STORAGE_POSITION =
    keccak256("zer0.zdao.execute.storage.v0");

  struct ExecuteStorage {
    mapping(address => bool) safelistedContracts;
  }

  function executeStorage() internal pure returns (ExecuteStorage storage ds) {
    bytes32 position = EXECUTE_STORAGE_POSITION;
    assembly {
      ds.slot := position
    }
  }

  function isContractSafelisted(address target) internal view returns (bool) {
    if (target == address(this)) {
      return true;
    }

    ExecuteStorage storage s = executeStorage();
    bool isSafelisted = s.safelistedContracts[target];
    return isSafelisted;
  }

  function safelistContract(address target, bool safelisted) internal {
    ExecuteStorage storage s = executeStorage();
    require(s.safelistedContracts[target] != safelisted, "ZDAO: 0014");

    s.safelistedContracts[target] = safelisted;
  }

  function execute(
    address to,
    uint256 value,
    bytes memory data,
    uint256 txGas
  ) internal returns (bool success) {
    assembly {
      success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
    }
  }
}
