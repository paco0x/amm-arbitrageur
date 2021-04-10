//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}
