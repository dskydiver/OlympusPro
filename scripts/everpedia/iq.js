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
    const Principal = await ethers.getContractFactory('Principal');
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
    const CustomBond = await ethers.getContractFactory('CustomOLDBond');

    // Attached contract facotry to address
    const customTreasury = await CustomTreasury.deploy(payout.address, admin.address);
    const customBond = await CustomBond.deploy(customTreasury.address, payout.address, principal.address, mockTreasury.address, olympusProSubsidyRouter.address, admin.address, mockDAO.address, ['0'], ['33300']);

    // Toggle bond in treasury
    await customTreasury.connect(admin).toggleBondContract(customBond.address);

    // Mint amount of payout token and principal token
    await payout.mint(customTreasury.address, '593358537177045606372952036');
    await principal.mint(user.address, '100000000000000000000000000');

    // Approve bond contract to spend principal tokens
    await principal.connect(user).approve(customBond.address, '10000000000000000000000000');

    // Set vesting rate
    await customBond.connect(admin).setBondTerms('0', '46200');

    /* Assuming IQ price of $0.013 and IQ/ETH LP price of $14.86 */

    // Initialize bond
    await customBond.connect(admin).initializeBond('5250', '46200', '6700', '307', '25294000000000000000000', '9000000000000000000000');

    console.log("Bond Price BEFORE bonds: " + (await customBond.trueBondPrice()).toString());

    let totalBlocksPassed = 0;
    let bondNum = 1;

    async function bond() {
      while(totalBlocksPassed < 184800) {
        await customBond.connect(user).deposit('1434000000000000000000', '100000000', user.address );
        console.log("Bond Price After bond (BOND " + (+bondNum) + "): " + (await customBond.trueBondPrice()).toString());
        console.log()

        let blocksPassed = 5900;
        await mineBlocks(5900);
        while((await customBond.trueBondPrice()).toNumber() > 8310) {
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


}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})