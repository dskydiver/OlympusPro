const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    const BOTTO = await ethers.getContractFactory('BOTTO');
    const botto = await BOTTO.deploy('1');

    await botto.mint(deployer.address, "100000000000000004764729344")

    console.log("BOTTO: " + botto.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})