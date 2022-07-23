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
  principalTicker: 'RUNE/ETH',
  principalTokenPrice: 525, // https://app.zerion.io/invest/asset/SLP-0xcc39592f5cb193a70f262aa301f54db1d600e6da
  payoutTicker: 'THOR',
  payoutTokenPrice,
  payoutTokensInContract: 500_000_000,
  payoutTokensPerTerm: 250_000 / payoutTokenPrice,
  payoutRateDescription: '$250k per month',
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