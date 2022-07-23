const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/inverse-finance
const payoutTokenPrice = 250;
// https://etherscan.io/token/0xaa5a67c256e27a5d80712c51971408db3370927d
const principalTokenPrice = 1;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0x8e57a30a3616f65e7d14c264943e77e084fddd25',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'DOLA-3POOL',
  principalTokenPrice,
  payoutTicker: 'INV',
  payoutTokenPrice,
  // https://etherscan.io/token/0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68
  payoutTokensInContract: 140_000,
  payoutTokensPerTerm: 1085,
  payoutRateDescription: '1,085 INV per month',
  customBondName: 'CustomINVBond',
  customTreasuryName: 'CustomOLDTreasury',
  address: '0x8e57a30a3616f65e7d14c264943e77e084fddd25',
  adjustment: true,
  // bcv: 45_000,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});