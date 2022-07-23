const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const CustomTreasury = "0x40AdeDc0b097717583eD2C97645eB46e5B58CC78";
    const agEUR = "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8";
    const Admin = "0xe02F8E39b8cFA7d3b62307E46077669010883459";
    const SubisdyRouter = "0x97Fac4EA361338EaB5c89792eE196DA8712C9a4a";
    const OlympusTreasury = "0x9A315BdF513367C0377FB36545857d12e85813Ef";
    const OlympusDAO = "0x15fddc0d0397117b46903c1F6c735b55755C2a3a";

    const CustomBond = await ethers.getContractFactory('CustomANGLEBond');
    const customBond = await CustomBond.deploy(CustomTreasury, agEUR, OlympusTreasury, SubisdyRouter, Admin, OlympusDAO, ['0'], ['33300'], false);

    console.log("agEUR Bond: " + customBond.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})