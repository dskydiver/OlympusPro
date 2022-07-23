const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const ichi = "0x22480ED312278C243319ca360AEaa784b4740Bf8";
    const Admin = "0x7d3047D0aaFFEAc7Eb45f04070C248BC34d89F74";

    const CustomTreasury = await ethers.getContractFactory('CustomTreasury');
    const customTreasury = await CustomTreasury.deploy(ichi, Admin);

    console.log("Custom Treasury: " + customTreasury.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})