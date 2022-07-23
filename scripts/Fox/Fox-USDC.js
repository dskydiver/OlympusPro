const { ethers } = require("hardhat");

async function main() {

    async function mineBlocks(blockNumber) {
        while (blockNumber > 0) {
          blockNumber--;
          await hre.network.provider.request({
            method: "evm_mine",
            params: [],
          });
        }
    }

    const [deployer, admin, user, mockDAO] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    // Deploy Mock Principal token
    const Principal = await ethers.getContractFactory('Principal6');
    const principal = await Principal.deploy('1');

    // Deploy Mock Payout token
    const Payout = await ethers.getContractFactory('Payout');
    const payout = await Payout.deploy('1');

    // Deploy Mock Treaury
    const MockTreasury = await ethers.getContractFactory('MockTreasury');
    const mockTreasury = await MockTreasury.deploy(deployer.address);

    // Deplopy Olympus Pro Subsidy Router
    const OlympusProSubsidyRouter = await ethers.getContractFactory('OPSubsidyRouter');
    const olympusProSubsidyRouter = await OlympusProSubsidyRouter.deploy();

    // Deplopy Factory storage
    const OlympusProFactoryStorage = await ethers.getContractFactory('OlympusProFactoryStorage');
    const olympusProFactoryStorage = await OlympusProFactoryStorage.deploy();

    // Deploy Factory
    const OlympusProFactory = await ethers.getContractFactory('OlympusProFactory');
    const olympusProFactory = await OlympusProFactory.deploy(mockTreasury.address, olympusProFactoryStorage.address, olympusProSubsidyRouter.address, mockDAO.address);

    // Toggle factory address a in storage
    await olympusProFactoryStorage.setFactoryAddress(olympusProFactory.address);

    // Get contract factory for custom treasury and custom bond
    const CustomTreasury = await ethers.getContractFactory('CustomOLDTreasury');
    const CustomBond = await ethers.getContractFactory('CustomFOXBond');

    // deploy contracts
    const customTreasury = await CustomTreasury.deploy(payout.address, admin.address);
    const customBond = await CustomBond.deploy(customTreasury.address, principal.address, mockTreasury.address, olympusProSubsidyRouter.address, admin.address, mockDAO.address, ['0'], ['33300'], false);

    // Toggle bond in treasury
    await customTreasury.connect(admin).toggleBondContract(customBond.address);

    // Mint amount of payout token and principal token
    await payout.mint(customTreasury.address, '1000001337000000000000000000');
    await principal.mint(user.address, '100000000000000000000000000');

    // Approve bond contract to spend principal tokens
    await principal.connect(user).approve(customBond.address, '10000000000000000000000000');

    // Set vesting rate
    await customBond.connect(admin).setBondTerms('0', '46200');

    /* Assuming FOX price of $0.60 and USDC price of $1 */

    // Initialize bond
    await customBond.connect(admin).initializeBond('270000', '46200', '450000', '4', '1000000000000000000000000', '195000000000000000000000');

    console.log("Bond Price BEFORE bonds: " + (await customBond.trueBondPrice()).toString());
    console.log("Payout For: " + (await customBond.payoutFor('21600000000')).toString());
    console.log("Max Payout: " + (await customBond.maxPayout()).toString());
    let totalBlocksPassed = 0;
    let bondNum = 1;

    async function bond() {
      while(totalBlocksPassed < 184800) {
        await customBond.connect(user).deposit('21600000000', '100000000', user.address );
        console.log("Bond Price After bond (BOND " + (+bondNum) + "): " + (await customBond.trueBondPrice()).toString());
        console.log()

        let blocksPassed = 4000;
        await mineBlocks(4000);
        while((await customBond.trueBondPrice()).toNumber() > 5700000) {
            await mineBlocks(2);
            blocksPassed = blocksPassed + 2;
        }
        totalBlocksPassed = totalBlocksPassed + blocksPassed; 

        console.log("Blocks Passed (BOND " + (+bondNum + +1) + "): " +  blocksPassed);
        console.log("Bond Price after day (BOND " + (+bondNum + +1) + "): " +  (await customBond.trueBondPrice()).toString());
        bondNum++;
      }
    }
    
    await bond();

    console.log("Total Blocks Passed: " + totalBlocksPassed);
    console.log("Payout given: " + (await customBond.totalPayoutGiven()).toString());
    console.log("Principal Bonded: " + (await customBond.totalPrincipalBonded()).toString());
    console.log("PRINCIPAL FEES TAKEN IN: " + (await principal.balanceOf(mockTreasury.address)).toString());


}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})