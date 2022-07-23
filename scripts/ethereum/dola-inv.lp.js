const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/inverse-finance
const payoutTokenPrice = 250;
// https://etherscan.io/tokenholdings?a=0x5ba61c0a8c4dcccc200cd0ccc40a5725a426d002
// https://etherscan.io/token/0x5ba61c0a8c4dcccc200cd0ccc40a5725a426d002
const principalTokenPrice = 1535230.40415066866 * 2 / 87127.979765638879041895;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0x34eb308c932fe3bbda8716a1774ef01d302759d9',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'INV/DOLA',
  principalTokenPrice,
  payoutTicker: 'INV',
  payoutTokenPrice,
  // https://etherscan.io/token/0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68
  payoutTokensInContract: 140_000,
  payoutTokensPerTerm: 2170,
  payoutRateDescription: '2,170 INV per month',
  customBondName: 'CustomOLDBond',
  customTreasuryName: 'CustomOLDTreasury',
  sendPayoutAddress: true,
  feeInPayout: null,
  adjustment: true,
  bcv: 37_000,
  blocksUntilDiscount: 7_500
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});