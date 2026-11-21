// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title Guestbook storing publications in event logs
contract Poster {
    event NewPost(address indexed user, string content, string indexed tag);

    function post(string memory content, string memory tag) public {
        emit NewPost(msg.sender, content, tag);
    }
}
