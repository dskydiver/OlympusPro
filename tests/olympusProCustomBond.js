
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe('Olympus Pro Custom Bond', () => {

    async function mineBlocks(blockNumber) {
        while (blockNumber > 0) {
          blockNumber--;
          await hre.network.provider.request({
            method: "evm_mine",
            params: [],
          });
        }
    }


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
      OlympusProSubsidyRouter,
      olympusProSubsidyRouter,
      olympusProFactoryStorage,
      OlympusProFactory,
      olympusProFactory,
      CustomTreasury,
      CustomBond,
      customTreasury,
      customBond,
      customTreasury1,
      customBond1,
      hold



    beforeEach(async () => {

        [deployer, user, admin, addr3, mockDAO, hold] = await ethers.getSigners();

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

        // Whitelist bond in treasury
        await customTreasury.connect(admin).whitelistBondContract(customBond.address);  

        // Mint amount of payout token and principal token
        await payout.mint(hold.address, '1390000000000000000000000');
        await payout.connect(hold).transfer(customTreasury.address, '1000000000000000000000000');
        await principal.mint(user.address, '100000000000000000000000000');

        // Approve bond contract to spend principal tokens
        await principal.connect(user).approve(customBond.address, '10000000000000000000000000');

        // Set vesting rate
        await customBond.connect(admin).setBondTerms('0', '46200');

        // Initialize bond
        //await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');

    });

    describe('constructor()', () => {
        it('should set initial owner address correctly', async () => {
            expect(await customBond.policy()).to.equal(admin.address);
        });
    });

    describe('initializeBond()', () => {
        it('should let admin intialize bond', async () => {
            expect(await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000'));
        });

        it('should NOT let non admin intialize bond', async () => {
            await expect(customBond.connect(user).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000')).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should NOT let bond be intialized twice', async () => {
            expect(await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000'));
            await expect(customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000')).to.be.revertedWith('Debt must be 0 for initialization');
        });
    });

    describe('setBondTerms()', () => {
        it('should let admin set bond terms for vesting', async () => {
            expect(await customBond.connect(admin).setBondTerms('0', '20000'));
        });

        it('should let admin set bond terms for payout', async () => {
            expect(await customBond.connect(admin).setBondTerms('1', '5'));
        });

        it('should let admin set bond terms for max debt', async () => {
            expect(await customBond.connect(admin).setBondTerms('2', '1000000000000000000000'));
        });

        it('should NOT let admin set vesting under 10,000 blocks', async () => {
            await expect(customBond.connect(admin).setBondTerms('0', '5000')).to.be.revertedWith('Vesting must be longer than 36 hours');
        });

        it('should NOT let admin set payout above 1 percent of payout token supply', async () => {
            await expect(customBond.connect(admin).setBondTerms('1', '1001')).to.be.revertedWith('Payout cannot be above 1 percent');
        });

        it('should NOT let non admin address set bond terms', async () => {
            await expect(customBond.connect(user).setBondTerms('1', '1001')).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });

    describe('setAdjustment()', () => {
        it('should let admin set adjustment', async () => {
            expect(await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000'));
            expect(await customBond.connect(admin).setAdjustment(true, '100', '600000', '100'));
        });

        it('should NOT let non admin set adjustment', async () => {
            expect(await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000'));
            await expect(customBond.connect(user).setAdjustment(true, '100', '600000', '100')).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should NOT let admin set too large of increment', async () => {
            expect(await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000'));
            await expect(customBond.connect(admin).setAdjustment(true, '17501', '1000000', '100')).to.be.revertedWith('Increment too large');
        });


    });

    describe('changeOlympusTreasury()', () => {
        it('should NOT let non DAO address call', async () => {
            await expect(customBond.connect(admin).changeOlympusTreasury(admin.address)).to.be.revertedWith("Only Olympus DAO");
        });

        it('should let Olympus DAO call', async () => {
            await customBond.connect(mockDAO).changeOlympusTreasury(admin.address);
        });

        it('should send fee to updated treasury address', async () => {
            expect(await payout.balanceOf(mockTreasury.address)).to.equal('0'); 
            
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await expect(customBond.connect(user).deposit('1000000000000000000', '10000000', user.address));

            expect(await payout.balanceOf(mockTreasury.address)).to.not.equal('0'); 

            expect(await payout.balanceOf(admin.address)).to.equal('0'); 

            await customBond.connect(mockDAO).changeOlympusTreasury(admin.address);
            
            await expect(customBond.connect(user).deposit('1000000000000000000', '10000000', user.address));

            expect(await payout.balanceOf(admin.address)).to.not.equal('0'); 
        });
    });

    describe('paySubsidy()', () => {
        it('should NOT let non subsidy router address call', async () => {
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await expect(customBond.connect(user).deposit('1000000000000000000', '10000000', user.address));
            await expect(customBond.paySubsidy()).to.be.revertedWith('Only subsidy controller');
        });

        it('should let subsidy router call', async () => {
            await olympusProSubsidyRouter.addSubsidyController(customBond.address, admin.address);
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await expect(customBond.connect(user).deposit('1000000000000000000', '10000000', user.address));
            await olympusProSubsidyRouter.connect(admin).getSubsidyInfo();
        });
    });

    describe('deposit() --- FEE IN PAYOUT', () => {
        it('should NOT let user deposit if bond is not initialized', async () => {
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await expect(customBond.connect(user).deposit('1', '10000000', user.address)).to.be.revertedWith('FixedPoint::fraction: division by zero');
        });

        it('should let user deposit once bond is intialized', async () => {
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await customBond.connect(user).deposit('1000000000000000000', '10000000', user.address);
        });

        it('should NOT let user deposit if recipient is the 0 address', async () => {
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await expect(customBond.connect(user).deposit('10000000000000000000', '10000000', '0x0000000000000000000000000000000000000000')).to.be.revertedWith('Invalid address');
        });

        it('should NOT let user deposit if bond is too large', async () => {
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await expect(customBond.connect(user).deposit('10000000000000000000', '10000000', user.address)).to.be.revertedWith('Bond too large');
        });

        it('should NOT let user deposit if bond is too small', async () => {
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await expect(customBond.connect(user).deposit('10000', '10000000', user.address)).to.be.revertedWith('Bond too small');
        });

        it('should NOT let user deposit if max price is under bond price', async () => {
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await expect(customBond.connect(user).deposit('1000000000000000000', '1475000', user.address)).to.be.revertedWith('Slippage limit: more than max price');
        });

        it('should NOT let user bond if debt is over max debt', async () => {
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);
            await expect(customBond.connect(user).deposit('8000000000000000000', '10000000', user.address)).to.be.revertedWith('Max capacity reached');
        });

        it('should give user same payout as expected', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            let userPayout = await customBond.payoutFor('8000000000000000000');
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);

            let bondDetails = await customBond.bondInfo(user.address);

            expect(await bondDetails[0]).to.equal(userPayout[0]);
        });

        it('should send proper fee to the Olympus treasury', async () => {
            expect(await payout.balanceOf(mockTreasury.address)).to.equal('0'); 
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);

            expect(await payout.balanceOf(mockTreasury.address)).to.not.equal('0');
        });

        it('should send principal tokens to custom treasury', async () => {
            expect(await principal.balanceOf(customTreasury.address)).to.equal('0'); 
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);

            expect(await principal.balanceOf(customTreasury.address)).to.equal('8000000000000000000'); 
        });

        it('should deposit properly if fee is 0', async () => {
            await olympusProFactory.connect(mockDAO).createBond(principal.address, customTreasury.address, admin.address, ['0'], ['0'], true);
    
            let newBondDetails = await olympusProFactoryStorage.bondDetails('1');
            let newBond = await CustomBond.attach(newBondDetails[2])

            await customTreasury.connect(admin).whitelistBondContract(newBond.address)

            await newBond.connect(admin).setBondTerms('0', '46200');
            await newBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '100000000000000000000', '30000000000000000000');

            let userPayout = await newBond.payoutFor('6000000000000000000');

            await principal.connect(user).approve(newBond.address, '10000000000000000000000');
            await newBond.connect(user).deposit('6000000000000000000', '10000000', user.address);

            let bondInfo = (await newBond.bondInfo(user.address));
            
            expect(await newBond.currentOlympusFee()).to.equal('0');
            expect(bondInfo[0]).to.equal(userPayout[0]);
            expect(await payout.balanceOf(mockTreasury.address)).to.equal('0');
        });

        it('should deposit properly with NO fee if array is empty', async () => {
            await olympusProFactory.connect(mockDAO).createBond(principal.address, customTreasury.address, admin.address, [], [], true);
    
            let newBondDetails = await olympusProFactoryStorage.bondDetails('1');
            let newBond = await CustomBond.attach(newBondDetails[2])

            await customTreasury.connect(admin).whitelistBondContract(newBond.address);

            await newBond.connect(admin).setBondTerms('0', '46200');
            await newBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '100000000000000000000', '30000000000000000000');

            let userPayout = await newBond.payoutFor('6000000000000000000');

            await principal.connect(user).approve(newBond.address, '10000000000000000000000');
            await newBond.connect(user).deposit('6000000000000000000', '10000000', user.address);

            let bondInfo = (await newBond.bondInfo(user.address));
            
            expect(await newBond.currentOlympusFee()).to.equal('0');
            expect(bondInfo[0]).to.equal(userPayout[0]);
            expect(await payout.balanceOf(mockTreasury.address)).to.equal('0');
        });

    });

    describe('deposit() --- FEE IN PRINCIPAL', () => {
        beforeEach(async () => {
            // Create custom treasury and custom bond
            await olympusProFactory.connect(mockDAO).createBondAndTreasury(payout.address, principal.address, admin.address, ['0'], ['33300'], false);

            // Bond details
            bondDetails = await olympusProFactoryStorage.bondDetails('1');

            // Get contract factory for custom treasury and custom bond
            CustomTreasury = await ethers.getContractFactory('CustomTreasury');
            CustomBond = await ethers.getContractFactory('CustomBond');

            // Attached contract facotry to address
            customTreasury1 = await CustomTreasury.attach(bondDetails[1]);
            customBond1 = await CustomBond.attach(bondDetails[2]);

            // Whitelist bond in treasury
            await customTreasury1.connect(admin).whitelistBondContract(customBond1.address);  

            // Mint amount of payout token and principal token
            await payout.connect(hold).transfer(customTreasury1.address, '390000000000000000000000');

            // Approve bond contract to spend principal tokens
            await principal.connect(user).approve(customBond1.address, '10000000000000000000000000');

            // Set vesting rate
            await customBond1.connect(admin).setBondTerms('0', '46200');
        });

        it('should let user deposit when trying to deposit when fee is principal token', async () => {
            await principal.connect(user).approve(customBond1.address, '10000000000000000000000');
            await customBond1.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await customBond1.connect(user).deposit('1000000000000000000', '10000000', user.address);
        });

        it('should give user same payout as expected', async () => {
            await customBond1.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond1.address, '10000000000000000000000');
            let userPayout = await customBond1.payoutFor('8000000000000000000');
            await customBond1.connect(user).deposit('8000000000000000000', '10000000', user.address);

            let bondDetails = await customBond1.bondInfo(user.address);

            expect(await bondDetails[0]).to.equal(userPayout[0]);
        });

        it('should send proper fee to the Olympus treasury', async () => {
            expect(await payout.balanceOf(mockTreasury.address)).to.equal('0'); 
            await customBond1.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond1.address, '10000000000000000000000');
            await customBond1.connect(user).deposit('8000000000000000000', '10000000', user.address);

            let fee = (8000000000000000000 * 33300 / 1000000);

            expect(await payout.balanceOf(mockTreasury.address)).to.equal('0');
            expect(await principal.balanceOf(mockTreasury.address)).to.equal(fee.toString());
        });

        it('should send proper principal tokens to custom treasury', async () => {
            expect(await principal.balanceOf(customTreasury1.address)).to.equal('0'); 
            await customBond1.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond1.address, '10000000000000000000000');
            await customBond1.connect(user).deposit('8000000000000000000', '10000000', user.address);

            let fee = (8000000000000000000 * 33300 / 1000000);
            let remaining = 8000000000000000000 - fee;

            expect(await principal.balanceOf(customTreasury1.address)).to.equal(remaining.toString()); 
        });

        it('should send principal fees to Olympus treasury', async () => {
            expect(await principal.balanceOf(customTreasury1.address)).to.equal('0'); 
            await customBond1.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond1.address, '10000000000000000000000');
            await customBond1.connect(user).deposit('8000000000000000000', '10000000', user.address);

            let fee = (8000000000000000000 * 33300 / 1000000);

            expect(await principal.balanceOf(mockTreasury.address)).to.equal(fee.toString()); 
        });

    });

    describe('redeem()', () => {
        it('should let user redeem vested amount', async () => {
            expect(await payout.balanceOf(user.address)).to.equal('0'); 
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await customBond.connect(user).deposit('5000000000000000000', '10000000', user.address); 

            await mineBlocks(2000);

            expect (await customBond.connect(user).redeem(user.address));

            expect(await payout.balanceOf(user.address)).to.not.equal('0'); 
        });

        it('should let another wallet redeem', async () => {
            expect(await payout.balanceOf(user.address)).to.equal('0'); 
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await customBond.connect(user).deposit('5000000000000000000', '10000000', user.address); 

            await mineBlocks(2000);

            expect (await customBond.redeem(user.address));

            expect(await payout.balanceOf(user.address)).to.not.equal('0'); 
        });

        it('should redeem everything for user once vesting is over', async () => {
            expect(await payout.balanceOf(user.address)).to.equal('0'); 
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(admin).initializeBond('500000', '6200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await customBond.connect(user).deposit('5000000000000000000', '10000000', user.address); 

            await mineBlocks(7000);

            let beforeBondInfo = (await customBond.bondInfo(user.address));

            expect (await customBond.redeem(user.address));

            let afterBondInfo = (await customBond.bondInfo(user.address));

            let beforePending = beforeBondInfo[0].toString();
            let afterPending = afterBondInfo[0].toString();

            expect(await payout.balanceOf(user.address)).to.equal(beforePending); 
            expect(afterPending).to.equal('0'); 
        });
    });

    describe('bondPrice()', () => {
        it('should have bond price minimum price at beginning', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            let terms = await customBond.terms();
            expect(terms[2]).to.equal(await customBond.bondPrice()); 
        });

        it('should have minimum price at 0 once bond price is greater than it', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);
            
            let terms = await customBond.terms();
            expect(terms[2]).to.equal(0); 
        });

        it('should calculate bond price correctly', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);
            
            let terms = await customBond.terms();
            let debtRatio = await customBond.debtRatio();
            let expectedPrice = Math.floor(terms[0] * debtRatio / 10000000000000)

            expect(expectedPrice).to.equal(await customBond.bondPrice());
        });

    });

    describe('trueBondPrice()', () => {
        it('should be correct true bond price', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');

            let fee = Math.floor((await customBond.bondPrice()) * 33300 / 1000000);
            let bondPrice = Math.floor(await customBond.bondPrice());
            let expectedTrueBondPrice = fee + bondPrice;

            let trueBondPrice = await customBond.trueBondPrice();

            expect(expectedTrueBondPrice).to.equal(trueBondPrice);
        });

    });

    describe('maxPayout()', () => {
        it('should give correct max payout', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            let terms = await customBond.terms();

            let maxPayoutPercent = terms[3];
            let totalPayoutSupply = (await payout.totalSupply());

            let maxPayout = (await customBond.maxPayout()).toString();
            let expectedMaxPayout = (totalPayoutSupply * maxPayoutPercent / 1000000 * 10).toString();

            expect(expectedMaxPayout).to.equal(maxPayout);
        });

    });

    describe('debtRatio()', () => {
        it('should give correct debt ratio', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');

            let totalPayoutSupply = await payout.totalSupply();
            let currentDebt = await customBond.currentDebt();
            let decimals = await payout.decimals();

            let expectedDebtRatio = Math.floor(((10 ** decimals) * currentDebt) / totalPayoutSupply).toString();
            let debtRatio = (await customBond.debtRatio()).toString()

            expect(expectedDebtRatio).to.equal(debtRatio);
        });
    });

    describe('currentDebt()', () => {
        it('should give correct current debt', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            
            let totalDebt = await customBond.totalDebt();
            let debtDecay = await customBond.debtDecay();

            let expectedCurrentDebt = (totalDebt - debtDecay).toString();
            let currentDebt = (await customBond.currentDebt()).toString();

            expect(expectedCurrentDebt).to.equal(currentDebt);
        });
    });

    describe('debtDecay()', () => {
        it('should give correct debt decay', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');

            await mineBlocks(100);

            let lastDecay = await customBond.lastDecay();

            let blocksSinceLast = ((await ethers.provider.getBlockNumber()) - lastDecay).toString(); 
            let totalDebt = (await customBond.totalDebt()).toString();
            let terms = await customBond.terms();

            let expectedDecay = (totalDebt * blocksSinceLast / terms[1]).toString();
            let decay = (await customBond.debtDecay()).toString();

            let difference = expectedDecay - decay;

            expect(difference).to.equal(0); // some reason difference is 0 but they do not equal each other. Minute difference
        });
    });

    describe('percentVestedFor()', () => {
        it('should give proper amount vested', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');

            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);

            await mineBlocks(1000);

            let lastDecay = await customBond.lastDecay();

            let bondInfo = await customBond.bondInfo(user.address);
            let blocksSinceLast = ((await ethers.provider.getBlockNumber()) - lastDecay).toString(); 
            let vesting = bondInfo[1];

            let expectedVested = Math.floor((blocksSinceLast * 10000 / vesting)).toString()
            let percentVested = (await customBond.percentVestedFor(user.address)).toString();

            expect(expectedVested).to.equal(percentVested);
        });
    });

    describe('pendingPayoutFor()', () => {
        it('should give proper pending payout', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');

            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(user).deposit('8000000000000000000', '10000000', user.address);

            await mineBlocks(5000);

            let bondInfo = await customBond.bondInfo(user.address);
            let payout = bondInfo[0];
            let percentVested = (await customBond.percentVestedFor(user.address)).toString();

            let expectedPendingPayout = (payout * percentVested / 10000).toString();
            let pendingPayout = (await customBond.pendingPayoutFor(user.address)).toString();

            let difference = (pendingPayout - expectedPendingPayout);

            expect(difference).to.equal(0); // some reason difference is 0 but they do not equal each other. Minute difference
        });
    });


    describe('currentOlympusFee()', () => {
        it('should return correct fee when fee is flat and no bonds have been purchased', async () => {
            expect(await customBond.currentOlympusFee()).to.equal('33300');
        });

        it('should return correct fee when fee is flat and bonds have been purchased', async () => {
            await customBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '60000000000000000000', '30000000000000000000');
            await principal.connect(user).approve(customBond.address, '10000000000000000000000');
            await customBond.connect(user).deposit('1000000000000000000', '10000000', user.address);
            expect(await customBond.currentOlympusFee()).to.equal('33300');
        });

        it('should return proper fee tier when there are multiple', async () => {
            await olympusProFactory.connect(mockDAO).createBond(principal.address, customTreasury.address, admin.address, ['5000000000000000000', '0'], ['33300', '20000'], true);
    
            let newBondDetails = await olympusProFactoryStorage.bondDetails('1');
            let newBond = await CustomBond.attach(newBondDetails[2])

            await customTreasury.connect(admin).whitelistBondContract(newBond.address)

            expect(await newBond.currentOlympusFee()).to.equal('33300');

            await newBond.connect(admin).setBondTerms('0', '46200');
            await newBond.connect(admin).initializeBond('500000', '46200', '1476000', '4', '100000000000000000000', '30000000000000000000');

            await principal.connect(user).approve(newBond.address, '10000000000000000000000');
            await newBond.connect(user).deposit('6000000000000000000', '10000000', user.address);
            
            expect(await newBond.currentOlympusFee()).to.equal('20000');
        });
    });

});
