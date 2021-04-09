//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '../FlashBot.sol';

contract TestMath is FlashBot {
    constructor() FlashBot(address(1)) {}

    function _calcBorrowAmount(OrderedReserves memory reserves) internal pure returns (uint256) {
        return calcBorrowAmount(reserves);
    }

    function _calcSolutionForQuadratic(
        int256 a,
        int256 b,
        int256 c
    ) public pure returns (int256, int256) {
        return calcSolutionForQuadratic(a, b, c);
    }

    function _sqrt(uint256 n) public pure returns (uint256) {
        return sqrt(n);
    }
}
