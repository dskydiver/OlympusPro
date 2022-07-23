const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const CustomTreasury = "0x01061B0E90DdE2A35dE1687E6a48a7099169b2Eb";
    const LP = "0x1e888882d0f291dd88c5605108c72d414f29d460";
    const Admin = "0x035F210e5d14054E8AE5A6CFA76d643aA200D56E";
    const SubisdyRouter = "0x5a5B49DCF339Bc0D5DaC1736EC95A85eD4B4842f";
    const OlympusTreasury = "0x31F8Cc382c9898b273eff4e0b7626a6987C846E8";
    const OlympusDAO = "0x15fddc0d0397117b46903c1F6c735b55755C2a3a";

    const CustomBond = await ethers.getContractFactory('SandclockCustomBond');
    const customBond = await CustomBond.deploy(CustomTreasury, LP, OlympusTreasury, SubisdyRouter, Admin, OlympusDAO, ['0'], ['33300'], true);

    console.log("Custom Bond: " + customBond.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
}) 