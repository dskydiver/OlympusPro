const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const ICHI = await ethers.getContractFactory('ICHI');
    const ichi = await ICHI.deploy('1');

    await ichi.mint(deployer.address, "5000000000000000")

    console.log("ICHI: " + ichi.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})