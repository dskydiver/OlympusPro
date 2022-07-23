// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import "../libraries/SafeMath.sol";
import "../libraries/SafeERC20.sol";

import "../interfaces/IERC20.sol";
import "../interfaces/IERC1155.sol";

import "../types/Ownable.sol";
import "../types/ERC1155Holder.sol";


/// @title   Paragon Bonding Treasury Contract
/// @author  JeffX
/// @notice  Facilitates PDT to payout to bonding contract and receives bonded tokens
contract ParagonBondingTreasury is Ownable, ERC1155Holder {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    /// EVENTS ///

    /// @notice Emitted when a contract is whitelisted
    /// @param bondContract Address of contract whitelisted
    event BondContractWhitelisted(address bondContract);

    /// @notice Emitted when a bond dewhitelisted
    /// @param bondContract Address of contract dewhitelisted
    event BondContractDewhitelisted(address bondContract);

    /// @notice Emitted ERC20 tokens are withdrawn
    /// @param token Address of token being withdrawn
    /// @param destination Address of where withdrawn token is sent
    /// @param amount Amount of tokens withdrawn
    event WithdrawERC20(address token, address destination, uint amount);

    /// @notice Emitted when ERC1155 tokens are withdrawn
    /// @param token Address of token being withdrawn
    /// @param destination Address of where withdrawn token is sent
    /// @param ids Array of ids that are being witdrawn
    /// @param amounts Amounts of token being withdrawn corresponding with ID
    event WithdrawERC1155(address token, address destination, uint[] ids, uint[] amounts);
    
    
    /// STATE VARIABLS ///
    
    /// @notice Paragon DAO Token
    address public immutable PDT;

    /// @notice Stores approved bond contracts
    mapping(address => bool) public bondContract; 

    
    /// CONSTRUCTOR ///

    /// @param _PDT           Address of PDT
    /// @param _initialOwner  Address of the initial owner
    constructor(address _PDT, address _initialOwner) {
        require( _PDT != address(0) );
        PDT = _PDT;
        require( _initialOwner != address(0) );
        policy = _initialOwner;
    }


    /// BOND CONTRACT FUNCTION ///

    /// @notice                    Sends bond contract PDT
    /// @param _amountPayoutToken  Amount of PDT to be sent
    function sendPDT(uint _amountPayoutToken) external {
        require(bondContract[msg.sender], "msg.sender is not a bond contract");
        IERC20(PDT).safeTransfer(msg.sender, _amountPayoutToken);
    }

    /// VIEW FUNCTION ///

    /// @notice                 Returns payout token valuation of principal
    /// @param _principalToken  Address of principal token
    /// @param _amount          Amount of `_principalToken` to value
    /// @return value_          Value of `_amount` of `_principalToken`
    function valueOfToken( address _principalToken, uint _amount ) public view returns ( uint value_ ) {
        // convert amount to match payout token decimals
        value_ = _amount.mul( 10 ** IERC20( PDT ).decimals() ).div( 10 ** IERC20( _principalToken ).decimals() );
    }


    /// POLICY FUNCTIONS ///

    /// @notice              Withdraw ERC20 token to `_destination`
    /// @param _token        Address of token to withdraw
    /// @param _destination  Address of where to send `_token`
    /// @param _amount       Amount of `_token` to withdraw
    function withdrawERC20(address _token, address _destination, uint _amount) external onlyPolicy() {
        IERC20(_token).safeTransfer(_destination, _amount);
        emit WithdrawERC20(_token, _destination, _amount);
    }

    /// @notice              Withdraw ERC1155 token to `_destination`
    /// @param _token        Address of token to withdraw
    /// @param _destination  Address of where to send `_token`
    /// @param _ids          Array of IDs of `_token`
    /// @param _amounts      Array of amount of corresponding `_id`
    function withdrawERC1155(address _token, address _destination, uint[] calldata _ids, uint[] calldata _amounts) external onlyPolicy() {
        IERC1155(_token).safeBatchTransferFrom(address(this), _destination, _ids, _amounts, '');
        emit WithdrawERC1155(_token, _destination, _ids, _amounts);
    }

    /// @notice               Whitelist bond contract
    /// @param _bondContract  Address to whitelist
    function whitelistBondContract(address _bondContract) external onlyPolicy() {
        bondContract[_bondContract] = true;
        emit BondContractWhitelisted(_bondContract);
    }

    /// @notice               Dewhitelist bond contract
    /// @param _bondContract  Address to dewhitelist
    function dewhitelistBondContract(address _bondContract) external onlyPolicy() {
        bondContract[_bondContract] = false;
        emit BondContractDewhitelisted(_bondContract);
    }
}