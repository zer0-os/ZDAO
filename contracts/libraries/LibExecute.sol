// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library LibExecute {
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
