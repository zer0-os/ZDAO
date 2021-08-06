// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IZeroToken} from "../../common/interfaces/IZeroToken.sol";

library LibZDAOCore {
  bytes32 constant ZDAO_CORE_STORAGE_POSITION =
    keccak256("zer0.zdao.core.storage.v0");

  struct ZDAOCoreStorage {
    IZeroToken membershipToken;
  }

  function zDAOCoreStorage()
    internal
    pure
    returns (ZDAOCoreStorage storage ds)
  {
    bytes32 position = ZDAO_CORE_STORAGE_POSITION;
    assembly {
      ds.slot := position
    }
  }

  function membershipToken()
    internal
    view
    returns (IZeroToken membershipToken_)
  {
    membershipToken_ = zDAOCoreStorage().membershipToken;
  }

  function requireSelfCall() internal view {
    require(msg.sender == address(this), "ZDAO: 1000");
  }
}

contract ZDAO {
  modifier onlySelf() {
    LibZDAOCore.requireSelfCall();
    _;
  }
}
