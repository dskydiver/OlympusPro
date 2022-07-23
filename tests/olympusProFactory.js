const hre = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;
describe('Olympus Pro Factory', () => {


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
        it('should set DAO adddress correctly', async () => {
            expect(await olympusProFactory.olympusDAO()).to.equal(mockDAO.address);
        });

        it('should set treasury adddress correctly', async () => {
            expect(await olympusProFactory.olympusTreasury()).to.equal(mockTreasury.address);
        });
    });

    describe('changeTreasuryAddress()', () => {
        it('should NOT allow non DAO adddress to change treasury address', async () => {
            await expect(olympusProFactory.connect(user).changeTreasuryAddress(user.address)).to.be.revertedWith('caller is not the DAO');
            expect(await olympusProFactory.olympusTreasury()).to.equal(mockTreasury.address);
        });

        it('should allow DAO adddress to change treasury address', async () => {
            await olympusProFactory.connect(mockDAO).changeTreasuryAddress(user.address);
            expect(await olympusProFactory.olympusTreasury()).to.equal(user.address);
        });
    });

    describe('createBondAndTreasury()', () => {
        it('should let admin create bond and treasury', async () => {
            expect(await olympusProFactory.connect(mockDAO).createBondAndTreasury(payout.address, principal.address, admin.address, ['0'], ['33300'], true));
        });

        it('should NOT let non admin create bond and treasury', async () => {
            await expect(olympusProFactory.connect(user).createBondAndTreasury(payout.address, principal.address, admin.address, ['0'], ['33300'], true)).to.be.revertedWith('caller is not the DAO');
        });

        it('should NOT create bond and treasury if fee tiers and fee length are not the same', async () => {
            await expect(olympusProFactory.connect(mockDAO).createBondAndTreasury(payout.address, principal.address, admin.address, ['0', '1001'], ['33300'], true)).to.be.revertedWith('tier length and fee length not the same');
        });

    });

    describe('createBond()', () => {
        it('should let admin create bond', async () => {
            expect(await olympusProFactory.connect(mockDAO).createBond(principal.address, customTreasury.address, admin.address, ['0'], ['33300'], true));
        });

        it('should NOT let non admin create bond', async () => {
            await expect(olympusProFactory.connect(user).createBond(principal.address, customTreasury.address, admin.address, ['0'], ['33300'], true)).to.be.revertedWith('caller is not the DAO');
        });

        it('should NOT create bond if fee tiers and fee length are not the same', async () => {
            await expect(olympusProFactory.connect(mockDAO).createBond(principal.address, customTreasury.address, admin.address, ['0', '1001'], ['33300'], true)).to.be.revertedWith('tier length and fee length not the same');
        });

    });

});