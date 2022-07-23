const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

const payoutTokenPrice = 1.10; // https://app.zerion.io/invest/asset/THOR-0xa5f2211b9b8170f694421f2046281775e8468044

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'RUNE',
  principalTokenPrice: 8.84, // https://app.zerion.io/invest/asset/RUNE-0x3155ba85d5f96b2d030a4966af206230e46849cb
  payoutTicker: 'THOR',
  payoutTokenPrice,
  payoutTokensInContract: 500_000_000,
  payoutTokensPerTerm: 500_000 / payoutTokenPrice,
  payoutRateDescription: '$500k per month',
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