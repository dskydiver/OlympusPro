const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

const payoutTokenPrice = 650; // https://analytics.sushi.com/tokens/0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 5,
  fullTermInDays: 7 * 4,
  principalTicker: 'KP3R/ETH',
  principalTokenPrice: 3_850, // https://app.zerion.io/invest/asset/SLP-0xaf988aff99d3d0cb870812c325c588d8d8cb7de8
  payoutTicker: 'KP3R',
  payoutTokenPrice,
  payoutTokensInContract: 297_070, // https://etherscan.io/token/0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44
  payoutTokensPerTerm: 200_000 / payoutTokenPrice * 28,
  payoutRateDescription: 'Daily $200k max bonds',
  // minBondsPerDay: 1,
  maxPayout: 105,
  // bcv: 33,
  // initialDebt: 33,
  // maxPayout: 33,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});