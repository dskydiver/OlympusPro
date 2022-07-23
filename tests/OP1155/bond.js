
const { ethers } = require("hardhat");
const { expect } = require("chai");
const BN = require('bn.js');

describe('Parallel Bond Contract', () => {

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
      CustomTreasury,
      CustomBond,
      customTreasury,
      customBond,
      hold,
      price1,
      price2,
      price3



    beforeEach(async () => {

        [deployer, user, admin, addr3, mockDAO, hold] = await ethers.getSigners();

        price1 = '100000000000000000000';
        price2 = '200000000000000000000';
        price3 = '300000000000000000000';

        // Deploy Mock Principal token
        Principal = await ethers.getContractFactory('ERC1155Mintable');
        principal = await Principal.deploy();

        // Deploy Mock Payout token
        Payout = await ethers.getContractFactory('Payout');
        payout = await Payout.deploy('1');

        // Deploy Mock Treaury
        MockTreasury = await ethers.getContractFactory('MockTreasury');
        mockTreasury = await MockTreasury.deploy(deployer.address);

        // Get contract factory for custom treasury and custom bond
        CustomTreasury = await ethers.getContractFactory('ParagonBondingTreasury');
        CustomBond = await ethers.getContractFactory('ParallelBondingContract');

        // Attached contract facotry to address
        customTreasury = await CustomTreasury.deploy(payout.address, admin.address);
        customBond = await CustomBond.deploy(customTreasury.address, principal.address, mockTreasury.address, admin.address, mockDAO.address);

        // Whitelist bond in treasury
        await customTreasury.connect(admin).whitelistBondContract(customBond.address);  

        // Mint amount of payout token and principal token
        await payout.mint(hold.address, '1390000000000000000000000');
        await payout.connect(hold).transfer(customTreasury.address, '1000000000000000000000000');

        await principal.create("10", '');
        await principal.create("20", '');
        await principal.create("30", '');
        await principal.create("40", '');
        await principal.create("50", '');
        await principal.create("60", '');
        await principal.create("70", '');
        await principal.create("80", '');
        await principal.create("90", '');
        await principal.create("100", '');

    });

    describe('constructor()', () => {
        it('should set custom treasury correctly', async () => {
            expect(await customBond.customTreasury()).to.equal(customTreasury.address);
        });

        it('should set principal token correctly', async () => {
            expect(await customBond.LL()).to.equal(principal.address);
        });

        it('should set Olympus treasury correctly', async () => {
            expect(await customBond.olympusTreasury()).to.equal(mockTreasury.address);
        });

        it('should set policy correctly', async () => {
            expect(await customBond.policy()).to.equal(admin.address);
        });

        it('should set Olympus DAO correctly', async () => {
            expect(await customBond.olympusDAO()).to.equal(mockDAO.address);
        });

        it('should initialize balance properly', async () => {
            expect(await principal.balanceOf(deployer.address, '1')).to.equal('10');
            expect(await principal.balanceOf(deployer.address, '10')).to.equal('100');
        });

        it('should start with bond not initialized', async () => {
            expect(await customBond.active()).to.equal(false);
        });

        it('should start with vesting term at 0', async () => {
            expect(await customBond.vestingTerm()).to.equal('0');
        });
    });

    describe('activateBond()', () => {
        it('should NOT allow a non policy address to activate the bond', async () => {
            await expect(customBond.connect(user).activateBond('46200', '18480')).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should allow policy address to initailize and set active to true', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            expect(await customBond.active()).to.equal(true);
        });

        it('should update vesting', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            expect(await customBond.vestingTerm()).to.equal('46200');
        });

        it('should NOT allow to be activate bond while active', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await expect(customBond.connect(admin).activateBond('46200', '18480')).to.be.revertedWith('Already active');
        });
    });

    describe('deactivateBond()', () => {
        it('should NOT allow a non policy address to deactivate the bond', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await expect(customBond.connect(user).deactivateBond()).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should allow policy address to deactivate bond and set active to false', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await expect(customBond.connect(admin).deactivateBond());
            expect(await customBond.active()).to.equal(false);
        });

        it('should NOT allow to be decativate while decativated', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await expect(customBond.connect(admin).deactivateBond());
            await expect(customBond.connect(admin).deactivateBond()).to.be.revertedWith('Already inactive');
        });
    });

    describe('setVesting()', () => {
        it('should NOT allow a non policy address to set vesting on the bond', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await expect(customBond.connect(user).setVesting('56200')).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should NOT allow policy address to set vesting before bond has been initalized', async () => {
            await expect(customBond.connect(admin).setVesting('46200')).to.be.revertedWith('Not active');
        });

        it('should allow policy address to set vesting after bond has been initalized', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            expect(await customBond.vestingTerm()).to.equal('46200');

            await customBond.connect(admin).setVesting('10000');
            expect(await customBond.vestingTerm()).to.equal('10000');
        });
    });

    describe('setBlocksToDouble()', () => {
        it('should NOT allow a non policy address to set blocks to double', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await expect(customBond.connect(user).setBlocksToDouble('56200')).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should NOT allow policy address to set vesting before bond has been initalized', async () => {
            await expect(customBond.connect(admin).setBlocksToDouble('46200')).to.be.revertedWith('Not active');
        });

        it('should allow policy address to set vesting after bond has been initalized', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            expect(await customBond.blocksToDouble()).to.equal('18480');

            await customBond.connect(admin).setBlocksToDouble('10000');
            expect(await customBond.blocksToDouble()).to.equal('10000');
        });
    });

    describe('setIdDetails()', async () => {
        it('should start with details non initialized', async () => {
            let detail = await customBond.idDetails('1');
            expect(detail[0].toString()).to.equal('0');
            expect(detail[1].toString()).to.equal('0');
        });

        it('should NOT allow non policy to set details', async () => {
            await expect(customBond.connect(user).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should allow policy to set details', async () => {
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
        });

        it('should set details properly', async () => {
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let detail1 = await customBond.idDetails('1');
            expect(detail1[0].toString()).to.equal(price1);
            expect(detail1[1].toString()).to.equal((price1 * 2).toString());
            expect(detail1[3].toString()).to.equal('5');

            let detail2 = await customBond.idDetails('2');
            expect(detail2[0].toString()).to.equal(price2);
            expect(detail2[1].toString()).to.equal((price2 * 2).toString());
            expect(detail2[3].toString()).to.equal('5');

            let detail3 = await customBond.idDetails('3');
            expect(detail3[0].toString()).to.equal(price3);
            expect(detail3[1].toString()).to.equal((price3 * 2).toString());
            expect(detail3[3].toString()).to.equal('5');
        });

        it('should NOT allow policy to set details if arrays are different lengths', async () => {
            await expect(customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2], 5, 100)).to.be.revertedWith('Lengths do not match');
        });
    });

    describe('changeOlympusTreasury()', async () => {
        it('should NOT allow non policy to set treasury', async () => {
            await expect(customBond.connect(user).changeOlympusTreasury(user.address)).to.be.revertedWith('Only Olympus DAO');
        });

        it('should allow policy to set treasury', async () => {
            await customBond.connect(mockDAO).changeOlympusTreasury(user.address);
            expect(await customBond.olympusTreasury()).to.equal(user.address);
        });

    });

    describe('deposit()', async () => {
        it('should NOT allow deposit if not initialized', async () => {
            await expect(customBond.deposit('1', '1', user.address)).to.be.revertedWith('Not active');
        });

        it('should NOT allow deposit if bond price is 0', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await expect(customBond.deposit('1', '1', user.address)).to.be.revertedWith('Not bondable');
        });

        it('should NOT allow deposit if amount is 0', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await expect(customBond.deposit('1', '0', user.address)).to.be.revertedWith('Cannot bond 0');
        });

        it('should NOT allow deposit if depositor is 0 address', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await expect(customBond.deposit('1', '1', '0x0000000000000000000000000000000000000000')).to.be.revertedWith('Invalid address');
        });

        it('should NOT bond prior to approving', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await expect(customBond.deposit('1', '1', user.address)).to.be.revertedWith('Need operator approval for 3rd party transfers.');
        });

        it('should bond if proper conditions', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);
            await customBond.deposit('1', '1', user.address);
        });

        it('should send payout to bond contract if bonded', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            expect(await payout.balanceOf(customBond.address)).to.equal('0');

            await customBond.deposit('1', '1', user.address);
            let payoutFor = await customBond.payoutFor('1');
            expect(payoutFor[0]).to.equal(await payout.balanceOf(customBond.address));
        });

        it('should update bondable ids if bonded', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            let detailBefore = await customBond.idDetails('1');
            expect(detailBefore[3].toString()).to.equal('5');
            
            await customBond.deposit('1', '1', user.address);

            let detailAfter = await customBond.idDetails('1');
            expect(detailAfter[3].toString()).to.equal('4');
        });

        it('should send proper payout if bonding multiple', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480')); 
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            expect(await payout.balanceOf(customBond.address)).to.equal('0');

            await customBond.deposit('1', '4', user.address);
            let payoutFor = await customBond.payoutFor('1');

            expect(payoutFor[0].mul(4)).to.equal((await payout.balanceOf(customBond.address)));
        });

        it('should send proper fee to Olympus', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            expect(await payout.balanceOf(customBond.address)).to.equal('0');
            await customBond.deposit('1', '4', user.address);
            let payoutFor = await customBond.payoutFor('1');

            expect((payoutFor[1].mul(4))).to.equal((await payout.balanceOf(mockTreasury.address)));
        });

        it('should update bondable ids if multiple bonded', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            let detailBefore = await customBond.idDetails('1');
            expect(detailBefore[3].toString()).to.equal('5');
            
            await customBond.deposit('1', '4', user.address);

            let detailAfter = await customBond.idDetails('1');
            expect(detailAfter[3].toString()).to.equal('1');
        });

        it('should NOT bond over bondable amount', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            
            await expect(customBond.deposit('1', '6', user.address)).to.be.revertedWith('Not bondable');
        });

        it('should NOT bond if 0 left to bond', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            await customBond.deposit('1', '5', user.address);            
            await expect(customBond.deposit('1', '1', user.address)).to.be.revertedWith('Not bondable');
        });

        it('should add to total principal bonded', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            expect((await customBond.totalPrincipalBonded()).toString()).to.equal('0');

            await customBond.deposit('1', '2', user.address);            
            expect((await customBond.totalPrincipalBonded()).toString()).to.equal('2');

            await customBond.deposit('1', '3', user.address);         
            expect((await customBond.totalPrincipalBonded()).toString()).to.equal('5');
        });

        it('should add to total payout given', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            expect((await customBond.totalPayoutGiven()).toString()).to.equal('0');

            await customBond.deposit('1', '2', user.address);     
            let payoutGiven = await payout.balanceOf(customBond.address);
            
            expect((await customBond.totalPayoutGiven()).toString()).to.equal((payoutGiven).toString());
        });

        it('should transfer bonded tokens to custom treasury', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            expect((await principal.balanceOf(customTreasury.address, '1')).toString()).to.equal(('0'));

            await customBond.deposit('1', '2', user.address);     
            
            expect((await principal.balanceOf(customTreasury.address, '1')).toString()).to.equal(('2'));
        });

    });

    describe('redeem()', () => {
        it('should let user redeem vested amount', async () => {
            expect(await payout.balanceOf(user.address)).to.equal('0'); 
            await customBond.connect(admin).activateBond('5000', '18480'); 
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            await customBond.deposit('1', '5', user.address);         

            await mineBlocks(2000);

            expect (await customBond.connect(user).redeem(user.address));

            expect(await payout.balanceOf(user.address)).to.not.equal('0'); 
        });

        it('should let another wallet redeem', async () => {
            expect(await payout.balanceOf(user.address)).to.equal('0'); 
            await customBond.connect(admin).activateBond('5000', '18480'); 
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            await customBond.deposit('1', '5', user.address);         

            await mineBlocks(2000);

            expect (await customBond.redeem(user.address));

            expect(await payout.balanceOf(user.address)).to.not.equal('0'); 
        });

        it('should redeem everything for user once vesting is over', async () => {
            expect(await payout.balanceOf(user.address)).to.equal('0'); 
            await customBond.connect(admin).activateBond('5000', '18480'); 
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            await customBond.deposit('1', '5', user.address);

            await mineBlocks(7000);

            let beforeBondInfo = (await customBond.bondInfo(user.address));

            expect (await customBond.redeem(user.address));

            let afterBondInfo = (await customBond.bondInfo(user.address));

            let beforeClaiming = beforeBondInfo[0].toString();
            let afterClaiming = afterBondInfo[0].toString();

            expect(await payout.balanceOf(user.address)).to.equal(beforeClaiming); 
            expect(afterClaiming).to.equal('0'); 
        });
    });

    describe('payoutFor()', () => {
        it('should give proper payout amount', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let payoutFor = await customBond.payoutFor('1');
            let fee = (await customBond.olympusFee()) * price1 / 1000000;

            expect(payoutFor[0].toString()).to.equal((price1 - fee).toString());
        });

        it('should give proper fee amount', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let payoutFor = await customBond.payoutFor('1');
            let fee = (await customBond.olympusFee()) * price1 / 1000000;

            expect(payoutFor[1].toString()).to.equal(fee.toString());
        });
    });

    describe('currentPrice()', () => {
        it('should start current price as starting price', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let detail1 = await customBond.idDetails('1');
            expect(detail1[0].toString()).to.equal(await customBond.currentPrice('1'));        
        });

        it('should only go up to max price', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let detail1 = await customBond.idDetails('1');

            await mineBlocks(19000);
            expect(detail1[1].toString()).to.equal(await customBond.currentPrice('1'));    
        
        });
    });

    describe('percentVestedFor()', () => {
        it('should give proper amount vested', async () => {
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            await customBond.deposit('1', '5', user.address);

            await mineBlocks(1000);

            let bondInfo = await customBond.bondInfo(user.address);
            let blocksSinceLast = ((await ethers.provider.getBlockNumber()) - bondInfo[2]).toString(); 
            let vesting = bondInfo[1];

            let expectedVested = Math.floor((blocksSinceLast * 10000 / vesting)).toString()
            let percentVested = (await customBond.percentVestedFor(user.address)).toString();

            expect(expectedVested).to.equal(percentVested);
        });
    });

    describe('pendingPayoutFor()', () => {
        it('should give proper pending payout', async () => { 
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
            await principal.setApprovalForAll(customBond.address, true);

            await customBond.deposit('1', '5', user.address);

            await mineBlocks(5000);

            let bondInfo = await customBond.bondInfo(user.address);
            let payout = bondInfo[0];
            let percentVested = (await customBond.percentVestedFor(user.address)).toString();

            let expectedPendingPayout = (payout * percentVested / 10000).toString();
            let pendingPayout = (await customBond.pendingPayoutFor(user.address)).toString();

            let difference = (pendingPayout - expectedPendingPayout);

            expect(difference).to.equal(0);
        });
    });

    describe('bondableIds()', () => {
        it('should give all that are bondable', async () => { 
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['2', '3', '4'], [price1, price2, price3], 5, 100);
            
            let allBondable = await customBond.bondableIds();        

            expect(allBondable[0].length).to.equal(3);
            expect(allBondable[1].length).to.equal(3);

            expect(allBondable[0][0]).to.equal('2');   
            expect(allBondable[0][1]).to.equal('3');   
            expect(allBondable[0][2]).to.equal('4');  
            expect(allBondable[1][0]).to.equal('5');   
            expect(allBondable[1][1]).to.equal('5');   
            expect(allBondable[1][2]).to.equal('5');
        });

        it('should remove once all; have been bonded', async () => { 
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['2', '3', '4'], [price1, price2, price3], 5, 100);

            await principal.setApprovalForAll(customBond.address, true);
            await customBond.deposit('3', '5', user.address);
            await customBond.deposit('2', '1', user.address);
            await customBond.deposit('4', '3', user.address);
            
            let allBondable = await customBond.bondableIds();

            expect(allBondable[0].length).to.equal(2);
            expect(allBondable[1].length).to.equal(2);

            expect(allBondable[0][0]).to.equal('2');   
            expect(allBondable[0][1]).to.equal('4');     
            expect(allBondable[1][0]).to.equal('4');   
            expect(allBondable[1][1]).to.equal('2');   
        });
    });

    describe('canBeBonded()', () => {
        it('should NOT be bondable prior to being set', async () => { 
            let canBeBonded = await customBond.canBeBonded('1');
            expect(canBeBonded[0]).to.equal(false);   
        });

        it('should have 0 as being bondable prior to being set', async () => { 
            let canBeBonded = await customBond.canBeBonded('1');
            expect(canBeBonded[1]).to.equal('0');   
        });

        it('should be bondable after being set', async () => { 
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let canBeBonded = await customBond.canBeBonded('1');
            expect(canBeBonded[0]).to.equal(true);   
        });

        it('should update how many of id can be bonded', async () => { 
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let canBeBonded = await customBond.canBeBonded('1');
            expect(canBeBonded[1]).to.equal('5');   
        });

        it('should NOT be bondable after full amount has been bonded', async () => { 
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let canBeBondedBefore = await customBond.canBeBonded('1');
            expect(canBeBondedBefore[0]).to.equal(true);   

            await principal.setApprovalForAll(customBond.address, true);
            await customBond.deposit('1', '5', user.address);

            let canBeBondedAfter = await customBond.canBeBonded('1');
            expect(canBeBondedAfter[0]).to.equal(false);   
        });

        it('should have 0 bondable after full amount has been bonded', async () => { 
            await expect(customBond.connect(admin).activateBond('46200', '18480'));
            await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);

            let canBeBondedBefore = await customBond.canBeBonded('1');
            expect(canBeBondedBefore[1]).to.equal('5');   

            await principal.setApprovalForAll(customBond.address, true);
            await customBond.deposit('1', '5', user.address);

            let canBeBondedAfter = await customBond.canBeBonded('1');
            expect(canBeBondedAfter[1]).to.equal('0');   
        });
    });
});
