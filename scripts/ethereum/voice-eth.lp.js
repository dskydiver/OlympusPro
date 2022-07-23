// https://etherscan.io/address/0xd9062CE377Fad49593b85BBA6D1b8e094CAb9708#readContract

const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/voice-token
const payoutTokenPrice = 125;
// https://etherscan.io/tokenholdings?a=0x06e4c11eaac88ae9253f9e86b60c8b4e7d4b281c
// https://etherscan.io/token/0x06e4c11eaac88ae9253f9e86b60c8b4e7d4b281c
const principalTokenPrice = payoutTokenPrice * 6157.45997439416817 * 2 / 1_040.875908999445915198;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'VOICE/ETH',
  principalTokenPrice,
  payoutTicker: 'VOICE',
  payoutTokenPrice,
  // https://etherscan.io/token/0x2e2364966267B5D7D2cE6CD9A9B5bD19d9C7C6A9
  payoutTokensInContract: 44_612.46,
  payoutTokensPerTerm: 1_000,
  payoutRateDescription: '1,000 VOICE per month',
  minBondsPerDay: 0.38,
  bcv: 32_000,
  blocksUntilDiscount: 16_000,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});