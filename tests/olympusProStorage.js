
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe('Olympus Pro Factory Storage', () => {


    let
      // Used as default deployer for contracts, asks as owner of contracts.
      deployer,
      user,
      Principal,
      principal,
      Payout,
      payout, 
      MockTreasury, 
      mockTreasury,
      OlympusProFactoryStorage,
      olympusProFactoryStorage,
      OlympusProFactory,
      olympusProFactory,
      CustomTreasury,
      CustomBond,
      customTreasury,
      customBond



    beforeEach(async () => {

        [deployer, user, admin, addr3, mockDAO] = await ethers.getSigners();

        // Deploy Mock Principal token
        Principal = await ethers.getContractFactory('Principal');
        principal = await Principal.deploy('1');

        // Deploy Mock Payout token
        Payout = await ethers.getContractFactory('Payout');
        payout = await Payout.deploy('1');

        // Deploy Mock Treaury
        MockTreasury = await ethers.getContractFactory('MockTreasury');
        mockTreasury = await MockTreasury.deploy(deployer.address);

        // Deplopy Olympus Pro Subsidy Router
        OlympusProSubsidyRouter = await ethers.getContractFactory('OPSubsidyRouter');
        olympusProSubsidyRouter = await OlympusProSubsidyRouter.deploy();

        // Deplopy Factory storage
        OlympusProFactoryStorage = await ethers.getContractFactory('OlympusProFactoryStorage');
        olympusProFactoryStorage = await OlympusProFactoryStorage.deploy();

        // Deploy Factory
        OlympusProFactory = await ethers.getContractFactory('OlympusProFactory');
        olympusProFactory = await OlympusProFactory.deploy(mockTreasury.address, olympusProFactoryStorage.address, olympusProSubsidyRouter.address, mockDAO.address);

        // Set factory address a in storage
        olympusProFactoryStorage.setFactoryAddress(olympusProFactory.address);

        // Create custom treasury and custom bond
        olympusProFactory.connect(mockDAO).createBondAndTreasury(payout.address, principal.address, admin.address, ['0'], ['33300'], true);

        // Bond details
        bondDetails = await olympusProFactoryStorage.bondDetails('0');

        // Get contract factory for custom treasury and custom bond
        CustomTreasury = await ethers.getContractFactory('CustomTreasury');
        CustomBond = await ethers.getContractFactory('CustomBond');

        // Attached contract facotry to address
        customTreasury = await CustomTreasury.attach(bondDetails[1]);
        customBond = await CustomBond.attach(bondDetails[2]);

        // Toggle bond in treasury
        await customTreasury.connect(admin).whitelistBondContract(customBond.address);

        // Mint amount of payout token and principal token
        await payout.mint(customTreasury.address, '1390000000000000000000000');
        await principal.mint(user.address, '100000000000000000000000000');

        // Approve bond contract to spend principal tokens
        await principal.connect(user).approve(customBond.address, '10000000000000000000000000');

        // Set vesting rate
        await customBond.connect(admin).setBondTerms('0', '46200');

        // Initialize bond
        await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');

    });

    describe('constructor()', () => {
        it('should set owner adddress correctly', async () => {
            expect(await olympusProFactoryStorage.policy()).to.equal(deployer.address);
        });
    });

    describe('pushBond()', () => {
        it('should NOT allow non factory address to push bond', async () => {
            await expect(olympusProFactoryStorage.pushBond(principal.address, customTreasury.address, customBond.address, admin.address, ['0'], ['33300'])).to.be.revertedWith('Not Olympus Pro Factory');
        });

        it('should have first custom bond at index 0', async () => {
            expect(await olympusProFactoryStorage.indexOfBond(customBond.address)).to.equal(0);
        });

        it('should have first bond details properly', async () => {
            const index = await olympusProFactoryStorage.indexOfBond(customBond.address);
            const details = await olympusProFactoryStorage.bondDetails(index);

            expect(details[0]).to.equal(principal.address);
            expect(details[1]).to.equal(customTreasury.address);
            expect(details[2]).to.equal(customBond.address);
            expect(details[3]).to.equal(admin.address);
        });

        it('should have second custom bond at index 1', async () => {
            const secondBond = await olympusProFactory.connect(mockDAO).createBondAndTreasury(payout.address, principal.address, admin.address, ['0'], ['33300'], true);
            const secondBondDetails = await olympusProFactoryStorage.bondDetails('1');
            const secondBondAddress = secondBondDetails[2];
        
            expect(await olympusProFactoryStorage.indexOfBond(secondBondAddress)).to.equal(1);
        });
    });

    describe('setFactoryAddress()', () => {
        it('should have factory address set properly', async () => {
            expect(await olympusProFactoryStorage.olympusProFactory()).to.equal(olympusProFactory.address);
        });

        it('should allow admin to change factory address', async () => {
            expect(await olympusProFactoryStorage.setFactoryAddress(addr3.address));
        })

        it('should NOT allow non admin to change factory address', async () => {
            await expect(olympusProFactoryStorage.connect(user).setFactoryAddress(addr3.address)).to.be.revertedWith('Ownable: caller is not the owner');
        })
    });

});