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
  principalTicker: 'USDC/ibKRW',
  principalTokenPrice: 57_000, // https://app.zerion.io/invest/asset/SLP-0xa42f219d4394216d851d75dcb6b742595146379c
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