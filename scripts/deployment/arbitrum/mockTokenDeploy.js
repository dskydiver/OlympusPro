const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const Principal = await ethers.getContractFactory('Principal');
    const principal = await Principal.deploy('1');

    const IQ = await ethers.getContractFactory('IQ');
    const iq = await IQ.deploy('1');

    await principal.mint(deployer.address, "1000000000000000000000000000")
    await iq.mint(deployer.address, "30100000000000000000000000")

    console.log("Principal: " + principal.address);
    console.log("IQ: " + iq.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})