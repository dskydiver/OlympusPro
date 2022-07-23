// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import "./libraries/SafeMath.sol";
import "./libraries/SafeERC20.sol";

import "./interfaces/IERC20.sol";

import "./types/Ownable.sol";

contract CustomTreasury is Ownable {
    
    /* ======== DEPENDENCIES ======== */
    
    using SafeERC20 for IERC20;
    using SafeMath for uint;
    
    
    /* ======== STATE VARIABLS ======== */
    
    address public immutable payoutToken;

    mapping(address => bool) public bondContract; 
    
    /* ======== EVENTS ======== */

    event BondContractWhitelisted(address bondContract);
    event BondContractDewhitelisted(address bondContract);
    event Withdraw(address token, address destination, uint amount);
    
    /* ======== CONSTRUCTOR ======== */

    constructor(address _payoutToken, address _initialOwner) {
        require( _payoutToken != address(0) );
        payoutToken = _payoutToken;
        require( _initialOwner != address(0) );
        policy = _initialOwner;
    }

    /* ======== BOND CONTRACT FUNCTION ======== */

    /**
     *  @notice bond contract recieves payout tokens
     *  @param _amountPayoutToken uint
     */
    function sendPayoutTokens(uint _amountPayoutToken) external {
        require(bondContract[msg.sender], "msg.sender is not a bond contract");
        IERC20(payoutToken).safeTransfer(msg.sender, _amountPayoutToken);
    }

    /* ======== VIEW FUNCTION ======== */
    
    /**
    *   @notice returns payout token valuation of priciple
    *   @param _principalTokenAddress address
    *   @param _amount uint
    *   @return value_ uint
     */
    function valueOfToken( address _principalTokenAddress, uint _amount ) public view returns ( uint value_ ) {
        // convert amount to match payout token decimals
        value_ = _amount.mul( 10 ** IERC20( payoutToken ).decimals() ).div( 10 ** IERC20( _principalTokenAddress ).decimals() );
    }


    /* ======== POLICY FUNCTIONS ======== */

    /**
     *  @notice policy can withdraw ERC20 token to desired address
     *  @param _token uint
     *  @param _destination address
     *  @param _amount uint
     */
    function withdraw(address _token, address _destination, uint _amount) external onlyPolicy() {
        IERC20(_token).safeTransfer(_destination, _amount);
        emit Withdraw(_token, _destination, _amount);
    }

    /**
        @notice whitelist bond contract
        @param _bondContract address
     */
    function whitelistBondContract(address _bondContract) external onlyPolicy() {
        bondContract[_bondContract] = true;
        emit BondContractWhitelisted(_bondContract);
    }

    /**
        @notice dewhitelist bond contract
        @param _bondContract address
     */
    function dewhitelistBondContract(address _bondContract) external onlyPolicy() {
        bondContract[_bondContract] = false;
        emit BondContractDewhitelisted(_bondContract);
    }
    
}