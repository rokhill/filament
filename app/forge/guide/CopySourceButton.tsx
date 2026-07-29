"use client";
import { useState } from "react";

const SOURCE = String.raw`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LaunchToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    address public immutable forge;
    bool public graduated;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Graduated();
    constructor(string memory _name, string memory _symbol, uint256 _supply) {
        name = _name;
        symbol = _symbol;
        forge = msg.sender;
        totalSupply = _supply;
        balanceOf[msg.sender] = _supply;
        emit Transfer(address(0), msg.sender, _supply);
    }
    function _checkTransfer(address from, address to) internal view {
        if (!graduated) {
            require(from == forge || to == forge, "LaunchToken: locked until graduation");
        }
    }
    function graduate() external {
        require(msg.sender == forge, "LaunchToken: only forge");
        graduated = true;
        emit Graduated();
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "LaunchToken: zero to");
        _checkTransfer(msg.sender, to);
        _transfer(msg.sender, to, amount);
        return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(to != address(0), "LaunchToken: zero to");
        _checkTransfer(from, to);
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "LaunchToken: allowance");
            unchecked { allowance[from][msg.sender] = allowed - amount; }
            emit Approval(from, msg.sender, allowed - amount);
        }
        _transfer(from, to, amount);
        return true;
    }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "LaunchToken: balance");
        unchecked {
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}`;

export default function CopySourceButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(SOURCE); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="rounded-lg px-3 py-1 text-sm font-semibold transition-opacity hover:opacity-80"
      style={{ background: "linear-gradient(180deg,#ffaa32,#e07a12)", color: "#140d05" }}
    >
      {copied ? "Copied!" : "Copy Source Code"}
    </button>
  );
}
