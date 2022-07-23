const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const CustomTreasury = "0x005AFa0d6df75f12b1E89C92cc92368373815425";
    const botto = "0x3FAD541ee50a07fDd574e79D512ce11CaEF26a40";
    const LP = "0x10D9afC017A6e82D8E35B742283E7afc2B9020e8";
    const SubisdyRouter = "0x52807bf40CC28D3DEbBdfD278512Cb354579b3B7";
    const Admin = "0x7d3047D0aaFFEAc7Eb45f04070C248BC34d89F74";
    const OlympusTreasury = "0x7d3047D0aaFFEAc7Eb45f04070C248BC34d89F74";
    const OlympusDAO = "0x7d3047D0aaFFEAc7Eb45f04070C248BC34d89F74";

    const CustomBond = await ethers.getContractFactory('CustomOLDBond');
    const customBond = await CustomBond.deploy(CustomTreasury, botto, LP, OlympusTreasury, SubisdyRouter, Admin, OlympusDAO, ['0'], ['33300']);

    console.log("Custom Bond: " + customBond.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})