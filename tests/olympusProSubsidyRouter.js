
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe('Olympus Pro Subisdy Router', () => {


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

    describe('getSubsidyInfo()', () => {
        it('should NOT get subsidy info if msg.sender has not been set as subsidy controlled', async () => {
            await expect(olympusProSubsidyRouter.connect(user).getSubsidyInfo()).to.be.revertedWith('Address not mapped');
        });

        it('should get subsidy info if msg.sender is subsidy controller', async () => {
            await olympusProSubsidyRouter.addSubsidyController(customBond.address, admin.address);
            await olympusProSubsidyRouter.connect(admin).getSubsidyInfo();
        });

        it('should NOT get subsidy info if msg.sender was subsidy controller then removed', async () => {
            await olympusProSubsidyRouter.addSubsidyController(customBond.address, admin.address);
            await olympusProSubsidyRouter.connect(admin).getSubsidyInfo();

            await olympusProSubsidyRouter.removeSubsidyController(admin.address);
            await expect(olympusProSubsidyRouter.connect(admin).getSubsidyInfo()).to.be.revertedWith('Address not mapped');
        });

    });

    describe('addSubsidyController()', () => {
        it('should NOT add subsidy controller if msg.sender is NOT owner', async () => {
            await expect(olympusProSubsidyRouter.connect(user).addSubsidyController(customBond.address, admin.address)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should add subsidy controller if msg.sender is owner', async () => {
            await olympusProSubsidyRouter.addSubsidyController(customBond.address, admin.address);
            expect(await olympusProSubsidyRouter.bondForController(admin.address)).to.equal(customBond.address);
        });

    });

    describe('removeSubsidyController()', () => {
        it('should NOT remove subsidy controller if msg.sender is NOT owner', async () => {
            await expect(olympusProSubsidyRouter.connect(user).removeSubsidyController(admin.address)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should remove subsidy controller if user is owner', async () => {
            await olympusProSubsidyRouter.addSubsidyController(customBond.address, admin.address);
            expect(await olympusProSubsidyRouter.bondForController(admin.address)).to.equal(customBond.address);

            await olympusProSubsidyRouter.removeSubsidyController(admin.address);
            expect(await olympusProSubsidyRouter.bondForController(admin.address)).to.equal('0x0000000000000000000000000000000000000000');
        });

    });

});

