const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const payout = "0x375aBB85C329753b1Ba849a601438AE77eEc9893";
    const admin = "0x12267aefd8Bb461817Df348CE16c933e76C1Aa0D";

    const CustomTreasury = await ethers.getContractFactory('ParagonBondingTreasury');
    const customTreasury = await CustomTreasury.deploy(payout, admin)

   console.log("1155 Treasury: " + customTreasury.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})