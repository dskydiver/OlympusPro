const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/mute
const payoutTokenPrice = 0.75;
// https://etherscan.io/tokenholdings?a=0x0efb424c465dbd0a626359d63412838f727f2c25
// https://etherscan.io/token/0x0efb424c465dbd0a626359d63412838f727f2c25
const principalTokenPrice = payoutTokenPrice * 1315462.60255638858 * 2 / 15304.990258901592035392;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0x5845a586dfe7498760E17071cd9994E2b209bf59',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'MUTE/ETH',
  principalTokenPrice,
  payoutTicker: 'MUTE',
  payoutTokenPrice,
  // https://etherscan.io/token/0xa49d7499271ae71cd8ab9ac515e6694c755d400c
  payoutTokensInContract: 31_188_934.89360874,
  payoutTokensPerTerm: 200_000,
  payoutRateDescription: '200k MUTE per month',
  minBondsPerDay: 0.45,
  bcv: 100_000,
  adjustment: true,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});