const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const Principal = await ethers.getContractFactory('Principal');
    const principal = await Principal.deploy('1');

    await principal.mint(deployer.address, "10000000000000000000000000000000000")

    console.log("principal: " + principal.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})