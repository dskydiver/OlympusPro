const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://v2.info.uniswap.org/token/0xc770eefad204b5180df6a14ee197d99d808ee52d
const payoutTokenPrice = 0.40;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e6,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'USDC',
  principalTokenPrice: 1,
  payoutTicker: 'FOX',
  payoutTokenPrice,
  // https://etherscan.io/token/0xc770eefad204b5180df6a14ee197d99d808ee52d
  payoutTokensInContract: 1_000_001_337,
  payoutTokensPerTerm: 3_000_000 / payoutTokenPrice,
  payoutRateDescription: '$3m per month',
  oldContracts: true,
  customBondName: 'CustomFOXBond',
  customTreasuryName: 'CustomOLDTreasury',
  principalName: 'Principal6',
  feeInPayout: false,
  maxPayout: 19,
  maxDebt: '1000000000000000000000000',
  minBondsPerDay: 1,
  maxBondsPerDay: 1,
  blocksUntilDiscount: 5300,
  bcv: 70000,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});