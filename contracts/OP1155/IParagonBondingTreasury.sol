// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

interface IParagonBondingTreasury {
    function sendPDT(uint _amountPayoutToken) external;
    function valueOfToken( address _principalToken, uint _amount ) external view returns ( uint value_ );
    function PDT() external view returns (address);
}