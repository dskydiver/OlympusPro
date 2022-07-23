const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const CustomTreasury = "0x3AC7ba25be176aaB7Fe926A3EaE5E4580691e849";
    const LP = "0xfaeCcee632912c42a7c88c3544885A8D455408FA";
    const Admin = "0x76c13BfC50e8bED816a2aef044F517A66d979295";
    const SubisdyRouter = "0x5a5B49DCF339Bc0D5DaC1736EC95A85eD4B4842f";
    const OlympusTreasury = "0x31F8Cc382c9898b273eff4e0b7626a6987C846E8";
    const OlympusDAO = "0x15fddc0d0397117b46903c1F6c735b55755C2a3a";

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