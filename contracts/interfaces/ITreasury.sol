// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

interface ITreasury {
    function sendPayoutTokens(uint _amountPayoutToken) external;
    function valueOfToken( address _principalTokenAddress, uint _amount ) external view returns ( uint value_ );
    function payoutToken() external view returns (address);
}