const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/barnbridge
const payoutTokenPrice = 7.30;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'BOND/USDC',
  // https://etherscan.io/tokenholdings?a=0x6591c4bcd6d7a1eb4e537da8b78676c1576ba244
  // https://etherscan.io/token/0x6591c4bcd6d7a1eb4e537da8b78676c1576ba244
  principalTokenPrice: 5554691.259922 * 2 / 1.73924592772952419,
  payoutTicker: 'BOND',
  payoutTokenPrice,
  // https://etherscan.io/token/0x0391d2021f89dc339f60fff84546ea23e337750f
  payoutTokensInContract: 10_000_000,
  payoutTokensPerTerm: 1_000_000 / payoutTokenPrice,
  payoutRateDescription: '$1m BOND per month',
  customBondName: 'CustomBondBarnBridge',
  customTreasuryName: 'CustomOLDTreasury',
  sendPayoutAddress: true,
  feeInPayout: null,
  priceDecimals: 1e10,
  bcvDecimals: 1e8,
  minBondsPerDay: 0.75,
  bcv: 42_000,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});