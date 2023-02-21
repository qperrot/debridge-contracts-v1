//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract MockCounter {
    uint256 public counter;

    /// @dev Restricts calls made by deBridge's CallProxy
    ///         AND that are originating from the whitelisted CrossChainCounter address on the origin chain

    /* ========== INITIALIZERS ========== */

    constructor() {}

    /* ========== MAINTENANCE METHODS ========== */

    /* ========== PUBLIC METHODS: RECEIVING ========== */

    function receiveIncrementCommand(uint8 _amount) external {
        counter += _amount;
    }
}
