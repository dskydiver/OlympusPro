// https://etherscan.io/address/0x6dBD2d504cA3BDfeC4967662dC5D8012fE90A923#readContract

const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://app.zerion.io/invest/asset/erowan-0x07bac35846e5ed502aa91adf6a9e7aa210f2dcbe
const payoutTokenPrice = 0.081971;
const principalTokenPrice = payoutTokenPrice * 617_077.39796734 * 2 / 0.032900854730475328;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'eROWAN/ATOM',
  // https://app.zerion.io/invest/asset/SLP-0x55fe80b3c42662a25fd9a515fda1bb76e59607fb
  // https://analytics.sushi.com/pairs/0x55fe80b3c42662a25fd9a515fda1bb76e59607fb
  // https://etherscan.io/token/0x55fe80b3c42662a25fd9a515fda1bb76e59607fb
  principalTokenPrice,
  payoutTicker: 'eROWAN',
  payoutTokenPrice,
  // https://etherscan.io/token/0x07bac35846e5ed502aa91adf6a9e7aa210f2dcbe
  payoutTokensInContract: 42_723_375,
  payoutTokensPerTerm: 250_000 / payoutTokenPrice,
  payoutRateDescription: '$250K eROWAN per month',
  customBondName: 'OPCustomDecimalsBond',
  increasePriceDigits: 4,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});