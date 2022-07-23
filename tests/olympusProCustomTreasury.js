
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe('Olympus Pro Custom Treasury', () => {


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
    it('should set custom bond address correctly', async () => {
      expect(await customTreasury.bondContract(customBond.address)).to.equal(true);
    });

    it('should set payout token address correctly', async () => {
      expect(await customTreasury.payoutToken()).to.equal(payout.address);
    });

    it('should set initial owner address correctly', async () => {
      expect(await customTreasury.policy()).to.equal(admin.address);
    });

  });

  describe('deposit()', () => {
    it('should NOT allow non bond address to deposit', async () => {
      await principal.approve(customTreasury.address, "100000");
      await expect(customTreasury.sendPayoutTokens('1')).to.be.revertedWith("msg.sender is not a bond contract");
    });

    it('should allow bond address to deposit', async () => {
      await principal.connect(user).approve(customTreasury.address, "100000");
      await customTreasury.connect(admin).whitelistBondContract(user.address);
      await customTreasury.connect(user).sendPayoutTokens('1');
    });

  });

  describe('valueOfToken()', () => {
    it('should value principal token properly by accounting for decimals', async () => {
      expect(await customTreasury.valueOfToken(principal.address, "5000000000000000000")).to.equal("5000000000000000000");
    });

  });

  describe('withdraw()', () => {
    it('should NOT allow non policy address to withdraw', async () => {
      await expect(customTreasury.withdraw(payout.address, deployer.address, '1')).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should allow policy address to withdraw', async () => {
      expect(await payout.balanceOf(admin.address)).to.equal('0');
      await expect(customTreasury.connect(admin).withdraw(payout.address, admin.address, '1'));
      expect(await payout.balanceOf(admin.address)).to.equal('1');
    });

  });

  describe('whitelistBondContract()', () => {
    it('should NOT allow non policy address to whitelist bond contract', async () => {
      await expect(customTreasury.whitelistBondContract(user.address)).to.be.revertedWith('Ownable: caller is not the owner');
      expect(await customTreasury.bondContract(user.address)).to.equal(false);
    });

    it('should allow policy address to whitelist bond contract', async () => {
      await expect(customTreasury.connect(admin).whitelistBondContract(user.address));
      expect(await customTreasury.bondContract(user.address)).to.equal(true);
    });
  });

  describe('dewhitelistBondContract()', () => {
    it('should NOT allow non policy address to whitelist bond contract', async () => {
      await expect(customTreasury.dewhitelistBondContract(user.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should allow policy address to whitelist bond contract', async () => {
      expect(await customTreasury.bondContract(customBond.address)).to.equal(true);
      await expect(customTreasury.connect(admin).dewhitelistBondContract(customBond.address));
      expect(await customTreasury.bondContract(customBond.address)).to.equal(false);
    });

  });



});

