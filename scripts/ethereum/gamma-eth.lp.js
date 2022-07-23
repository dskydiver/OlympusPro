const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/gamma-strategies
const payoutTokenPrice = 0.40;
// https://etherscan.io/token/0xf6eeCA73646ea6A5c878814e6508e87facC7927C#readContract
const principalTokenPrice = (62808169348294192349033 * payoutTokenPrice + 7184732018870174633 * 3_020) / 14347551340360064557;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0xE6F2332b539CCd4f173CB62D784A279c600c58A8',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'GAMMA/ETH v2',
  principalTokenPrice,
  payoutTicker: 'GAMMA',
  payoutTokenPrice,  
  payoutTokensInContract: 100_000_000,  // https://etherscan.io/token/0x6BeA7CFEF803D1e3d5f7C0103f7ded065644e197
  payoutTokensPerTerm: 250_000 / payoutTokenPrice,
  payoutRateDescription: '$250K GAMMA per month',
  increasePriceDigits: 3,
  decreaseBcvDigits: 3,
  customBondName: 'SandclockCustomBond',
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});