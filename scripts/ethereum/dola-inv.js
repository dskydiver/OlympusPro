const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/inverse-finance
const payoutTokenPrice = 250;
// https://www.coingecko.com/en/coins/dola-usd
const principalTokenPrice = 1;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0xdbfbb1140f8ba147ca4c8c27a2e576dfed0449bd',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'DOLA',
  principalTokenPrice,
  payoutTicker: 'INV',
  payoutTokenPrice,
  // https://etherscan.io/token/0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68
  payoutTokensInContract: 140_000,
  payoutTokensPerTerm: 1085,
  payoutRateDescription: '1,085 INV per month',
  customBondName: 'CustomINVBond',
  customTreasuryName: 'CustomOLDTreasury',
  address: '0xdbfbb1140f8ba147ca4c8c27a2e576dfed0449bd',
  adjustment: true,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});