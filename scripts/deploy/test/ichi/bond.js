const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const CustomTreasury = "0x280c5a9740138234412b5eFe81fc86c8643D807c";
    const LP = "0x10D9afC017A6e82D8E35B742283E7afc2B9020e8";
    const Admin = "0x7d3047D0aaFFEAc7Eb45f04070C248BC34d89F74";
    const SubisdyRouter = "0x52807bf40CC28D3DEbBdfD278512Cb354579b3B7";
    const OlympusTreasury = "0x7d3047D0aaFFEAc7Eb45f04070C248BC34d89F74";
    const OlympusDAO = "0x7d3047D0aaFFEAc7Eb45f04070C248BC34d89F74";

    const CustomBond = await ethers.getContractFactory('IchiCustomBond');
    const customBond = await CustomBond.deploy(CustomTreasury, LP, OlympusTreasury, SubisdyRouter, Admin, OlympusDAO, ['0'], ['33300'], true);

    console.log("Custom Bond: " + customBond.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})