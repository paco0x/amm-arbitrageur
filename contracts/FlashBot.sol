//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


contract FlashBot is Ownable {
    event Wtihdrawn(address indexed to, uint indexed value);

    constructor() {

    }

    receive() external payable {}

    function withdraw() external {
        uint balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
            emit Wtihdrawn(owner(), balance);
        }
    }
}
