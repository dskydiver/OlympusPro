const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const principal = "0x76be3b62873462d2142405439777e971754e8e77";
    const admin = "0x12267aefd8Bb461817Df348CE16c933e76C1Aa0D";
    const OlympusTreasury = "0x9A315BdF513367C0377FB36545857d12e85813Ef";
    const DAO = "0x245cc372C84B3645Bf0Ffe6538620B04a217988B";
    const customTreasury = "0xA9aB2478531Dcc5597A91413b39d462B3413E47c";

    CustomBond = await ethers.getContractFactory('ParallelBondingContract');
    customBond = await CustomBond.deploy(customTreasury, principal, OlympusTreasury, admin, DAO);

    console.log("1155 Bond: " + customBond.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})