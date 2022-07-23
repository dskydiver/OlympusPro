// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import "./interfaces/IOlympusProFactoryStorage.sol";

import "./OlympusProCustomBond.sol";
import "./OlympusProCustomTreasury.sol";

contract OlympusProFactory {
    
    /* ======== STATE VARIABLS ======== */

    address immutable private olympusProFactoryStorage;
    address immutable private olympusProSubsidyRouter;
    address immutable public olympusDAO;

    address public olympusTreasury;

    /* ======== MODIFIERS ======== */

    modifier onlyDAO() {
        require( olympusDAO == msg.sender, "caller is not the DAO" );
        _;
    }
    
    /* ======== CONSTRUCTION ======== */
    
    constructor(address _olympusTreasury, address _olympusProFactoryStorage, address _olympusProSubsidyRouter, address _olympusDAO) {
        require( _olympusTreasury != address(0) );
        olympusTreasury = _olympusTreasury;
        require( _olympusProFactoryStorage != address(0) );
        olympusProFactoryStorage = _olympusProFactoryStorage;
        require( _olympusProSubsidyRouter != address(0) );
        olympusProSubsidyRouter = _olympusProSubsidyRouter;
        require( _olympusDAO != address(0) );
        olympusDAO = _olympusDAO;
    }
    
    /* ======== POLICY FUNCTIONS ======== */

    
    /**
        @notice chnage Olympus Treasury address
        @param _olympusTreasury address
     */
    function changeTreasuryAddress(address _olympusTreasury) external onlyDAO() {
        olympusTreasury = _olympusTreasury;
    }
    
    /**
        @notice deploys custom treasury and custom bond contracts and returns address of both
        @param _payoutToken address
        @param _principalToken address
        @param _initialOwner address
        @param _tierCeilings uint[]
        @param _fees uint[]
        @param _feeInPayout bool
        @return _treasury address
        @return _bond address
     */
    function createBondAndTreasury(address _payoutToken, address _principalToken, address _initialOwner, uint[] calldata _tierCeilings, uint[] calldata _fees, bool _feeInPayout) external onlyDAO() returns(address _treasury, address _bond) {
    
        CustomTreasury treasury = new CustomTreasury(_payoutToken, _initialOwner);
        CustomBond bond = new CustomBond(address(treasury), _principalToken, olympusTreasury, olympusProSubsidyRouter, _initialOwner, olympusDAO, _tierCeilings, _fees, _feeInPayout);
        
        return IOlympusProFactoryStorage(olympusProFactoryStorage).pushBond(
            _principalToken, address(treasury), address(bond), _initialOwner, _tierCeilings, _fees
        );
    }

    /**
        @notice deploys custom treasury and custom bond contracts and returns address of both
        @param _principalToken address
        @param _customTreasury address
        @param _initialOwner address
        @param _tierCeilings uint[]
        @param _fees uint[]
        @param _feeInPayout bool
        @return _treasury address
        @return _bond address
     */
    function createBond(address _principalToken, address _customTreasury, address _initialOwner, uint[] calldata _tierCeilings, uint[] calldata _fees, bool _feeInPayout ) external onlyDAO() returns(address _treasury, address _bond) {

        CustomBond bond = new CustomBond(_customTreasury, _principalToken, olympusTreasury, olympusProSubsidyRouter, _initialOwner, olympusDAO, _tierCeilings, _fees, _feeInPayout);

        return IOlympusProFactoryStorage(olympusProFactoryStorage).pushBond(
            _principalToken, _customTreasury, address(bond), _initialOwner, _tierCeilings, _fees
        );
    }
    
}