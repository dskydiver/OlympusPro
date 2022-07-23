const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const botto = "0x3FAD541ee50a07fDd574e79D512ce11CaEF26a40";
    const Admin = "0x7d3047D0aaFFEAc7Eb45f04070C248BC34d89F74";

    const CustomTreasury = await ethers.getContractFactory('CustomOLDTreasury');
    const customTreasury = await CustomTreasury.deploy(botto, Admin);

    console.log("Custom Treasury: " + customTreasury.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})