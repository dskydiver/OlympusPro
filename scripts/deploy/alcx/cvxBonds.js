const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const CustomTreasury = "0x246c00f93001c344038A0d9Cf012754b539c1014";
    const CVX = "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b";
    const Admin = "0x9e2b6378ee8ad2A4A95Fe481d63CAba8FB0EBBF9";
    const SubisdyRouter = "0x97Fac4EA361338EaB5c89792eE196DA8712C9a4a";
    const OlympusTreasury = "0x31F8Cc382c9898b273eff4e0b7626a6987C846E8";
    const OlympusDAO = "0x15fddc0d0397117b46903c1F6c735b55755C2a3a";

    const CustomBond = await ethers.getContractFactory('CustomALCXBond');
    const customBond = await CustomBond.deploy(CustomTreasury, CVX, OlympusTreasury, SubisdyRouter, Admin, OlympusDAO, ['0'], ['20000'], false);

    console.log("CVX Bond: " + customBond.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})