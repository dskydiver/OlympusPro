// https://etherscan.io/address/0x89c4993E8A96E70BB507b31B38Fd6ADdf995394C#readContract

const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/synapse
const payoutTokenPrice = 2.44;
// https://etherscan.io/tokenholdings?a=0x4a86c01d67965f8cb3d0aaa2c655705e64097c31
// https://etherscan.io/token/0x4a86c01d67965f8cb3d0aaa2c655705e64097c31
const principalTokenPrice = payoutTokenPrice * 3675180.64123757551 * 2 / 96_450.659784323394262356;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'SYN/ETH',
  principalTokenPrice,
  payoutTicker: 'SYN',
  payoutTokenPrice,
  // https://etherscan.io/token/0x0f2d719407fdbeff09d87557abb7232601fd9f29
  payoutTokensInContract: 108_919_785.385633160460064449,
  payoutTokensPerTerm: 343_000,
  payoutRateDescription: '343,000 SYN per month',
  minBondsPerDay: 0.9,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});