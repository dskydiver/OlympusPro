const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const olympusDAO = "0x15fddc0d0397117b46903c1F6c735b55755C2a3a";
    const olympusTreasury = "0x31F8Cc382c9898b273eff4e0b7626a6987C846E8";

    // Deplopy Olympus Pro Subsidy Router
    const OlympusProSubsidyRouter = await ethers.getContractFactory('OPSubsidyRouter');
    const olympusProSubsidyRouter = await OlympusProSubsidyRouter.deploy();

    // Deplopy Factory storage
    const OlympusProFactoryStorage = await ethers.getContractFactory('OlympusProFactoryStorage');
    const olympusProFactoryStorage = await OlympusProFactoryStorage.deploy();

    // Deploy Factory
    const OlympusProFactory = await ethers.getContractFactory('OlympusProFactory');
    const olympusProFactory = await OlympusProFactory.deploy(olympusTreasury, olympusProFactoryStorage.address, olympusProSubsidyRouter.address, olympusDAO);

    // Set factory address a in storage
    await olympusProFactoryStorage.setFactoryAddress(olympusProFactory.address);

    // Transfer managment
    await olympusProSubsidyRouter.transferManagment(olympusDAO);
    await olympusProFactoryStorage.transferManagment(olympusDAO);

    console.log("Subsidy Router: " + olympusProSubsidyRouter.address);
    console.log("Olympus Pro Storage: " + olympusProFactoryStorage.address);
    console.log("Olympus Pro Factory: " + olympusProFactory.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})