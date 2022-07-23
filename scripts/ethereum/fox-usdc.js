// https://etherscan.io/address/0x976662C8a134096570fc8eDCDcc85b6f6377e422#readContract

const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/shapeshift-fox-token
const payoutTokenPrice = 0.28;
const principalTokenPrice = 1;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e6,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'USDC',
  principalTokenPrice,
  payoutTicker: 'FOX',
  payoutTokenPrice,
  // https://etherscan.io/token/0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d
  payoutTokensInContract: 1_000_001_337,
  payoutTokensPerTerm: 15_000_000,
  payoutRateDescription: '15m FOX per month',
  minBondsPerDay: 1,
  customBondName: 'CustomFOXBond',
  customTreasuryName: 'CustomOLDTreasury',
  principalName: 'Principal6',
  feeInPayout: false,
  maxDebt: '3000000000000000000000000',
  bcv: 35000,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});