const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'ETH/USF',
  principalTokenPrice: 112, // https://app.zerion.io/invest/asset/UNI-V2-0x1fbf001792e8cc747a5cb4aedf8c26b7421147e7
  payoutTicker: 'USF',
  payoutTokenPrice: 0.68, // https://app.zerion.io/invest/asset/USF-0xe0e05c43c097b0982db6c9d626c4eb9e95c3b9ce
  payoutTokensInContract: 86_000_000, // https://etherscan.io/token/0xe0e05c43c097b0982db6c9d626c4eb9e95c3b9ce
  payoutTokensPerTerm: 500_000,
  payoutRateDescription: '500k USF per month',
  // bcv: 33,
  // initialDebt: 33,
  // maxPayout: 33,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});