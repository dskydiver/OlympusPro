
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe('Paragon Bonding Treasury', () => {

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
        it('should set PDT token correctly', async () => {
            expect(await customTreasury.PDT()).to.equal(payout.address);
        });

        it('should set policy correctly', async () => {
            expect(await customTreasury.policy()).to.equal(admin.address);
        });
    });

    describe('sendPDT()', () => {
        it('should NOT let non bond contract send PDT', async () => {
            await expect(customTreasury.sendPDT('1')).to.be.revertedWith("msg.sender is not a bond contract");
        });

        it('should allow bond address to deposit', async () => {
            await customTreasury.connect(admin).whitelistBondContract(user.address);
            await customTreasury.connect(user).sendPDT('1');
          });
    });

    describe('withdrawERC20()', () => {
        it('should NOT allow non policy address to withdraw', async () => {
          await expect(customTreasury.withdrawERC20(payout.address, deployer.address, '1')).to.be.revertedWith('Ownable: caller is not the owner');
        });
    
        it('should allow policy address to withdraw', async () => {
          expect(await payout.balanceOf(admin.address)).to.equal('0');
          await customTreasury.connect(admin).withdrawERC20(payout.address, admin.address, '100');
          expect(await payout.balanceOf(admin.address)).to.equal('100');
        });
    
      });

    describe('withdrawERC1155()', () => {
        it('should NOT allow non policy address to withdraw', async () => {
          await expect(customBond.connect(admin).activateBond('46200', '18480'));
          await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
          await principal.setApprovalForAll(customBond.address, true);
          await customBond.deposit('1', '5', user.address);

          await expect(customTreasury.withdrawERC1155(principal.address, deployer.address, [1], [1])).to.be.revertedWith('Ownable: caller is not the owner');
        });
    
        it('should allow policy address to withdraw', async () => {
          await expect(customBond.connect(admin).activateBond('46200', '18480'));
          await customBond.connect(admin).setIdDetails(['1', '2', '3'], [price1, price2, price3], 5, 100);
          await principal.setApprovalForAll(customBond.address, true);
          await customBond.deposit('1', '5', user.address);

          expect(await principal.balanceOf(admin.address, '1')).to.equal('0');
          await customTreasury.connect(admin).withdrawERC1155(principal.address, admin.address, [1], [3]);
          expect(await principal.balanceOf(admin.address, '1')).to.equal('3');
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
          await customTreasury.connect(admin).dewhitelistBondContract(customBond.address);
          expect(await customTreasury.bondContract(customBond.address)).to.equal(false);
        });
    
      });



});
