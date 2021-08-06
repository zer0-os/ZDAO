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

  function getRevertMsg(bytes memory _returnData)
    internal
    pure
    returns (string memory)
  {
    // If the _res length is less than 68, then the transaction failed silently (without a revert message)
    if (_returnData.length < 68) return "Transaction reverted silently";

    assembly {
      // Slice the sighash.
      _returnData := add(_returnData, 0x04)
    }
    return abi.decode(_returnData, (string)); // All that remains is the revert string
  }

  function execute(
    address to,
    uint256 value,
    bytes memory data,
    uint256 txGas
  ) internal returns (bool success, bytes memory res) {
    // solhint-disable-next-line avoid-low-level-calls
    (success, res) = to.call{value: value, gas: txGas}(data);
  }
}
