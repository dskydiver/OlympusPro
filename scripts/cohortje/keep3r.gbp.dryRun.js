const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 7 * 4,
  principalTicker: 'USDC/ibGBP',
  principalTokenPrice: 408_976.76 / 0.17331070365098631, // https://analytics.sushi.com/pairs/0x8704850232Ab7f3490f64b14fd8C8B3e6E411914 / https://etherscan.io/token/0x8704850232ab7f3490f64b14fd8c8b3e6e411914
  payoutTicker: 'KP3R',
  payoutTokenPrice: 850, // https://analytics.sushi.com/tokens/0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44
  payoutTokensInContract: 293_070, // https://etherscan.io/token/0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44
  payoutTokensPerTerm: 1_000 / 6 * 4,
  payoutRateDescription: '1/6k per week',
  minBondsPerDay: 1,
  // bcv: 33,
  // initialDebt: 33,
  // maxPayout: 33,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});