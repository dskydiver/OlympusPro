const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/shapeshift-fox-token
const payoutTokenPrice = 0.30;
// https://www.coingecko.com/en/coins/ethereum
const principalTokenPrice = 3_240;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0x6541084d5cef19d80b760ce53319da5a711e70a8',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'WETH',
  principalTokenPrice,
  payoutTicker: 'FOX',
  payoutTokenPrice,
  // https://etherscan.io/token/0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d
  payoutTokensInContract: 1_000_001_337,
  payoutTokensPerTerm: 72_265 * 30,
  payoutRateDescription: '72,265 FOX per day',
  minBondsPerDay: 1,
  customBondName: 'CustomFOXBond',
  customTreasuryName: 'CustomOLDTreasury',
  feeInPayout: false,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});