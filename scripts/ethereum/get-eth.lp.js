const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/get-protocol
const payoutTokenPrice = 2.15;
// https://etherscan.io/tokenholdings?a=0xbb19141e045b133169d7c7160c5e54a54cc821b2
// https://etherscan.io/token/0xbb19141e045b133169d7c7160c5e54a54cc821b2
const principalTokenPrice = payoutTokenPrice * 383311.714154805896 * 2 / 10183.061435368924037166;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0xf2583814B7841044358C724567baf91a98adcA34',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'GET/WETH SLP',
  principalTokenPrice,
  payoutTicker: 'GET',
  payoutTokenPrice,
  // https://etherscan.io/token/0x8a854288a5976036a725879164ca3e91d30c6a1b
  payoutTokensInContract: 33_368_773.400000170376363909,
  payoutTokensPerTerm: 1_000_000 / 3 / payoutTokenPrice,
  payoutRateDescription: '~$1M over 3 months',
  // minBondsPerDay: 1,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});