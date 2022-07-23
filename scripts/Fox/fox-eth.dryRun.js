const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://v2.info.uniswap.org/token/0xc770eefad204b5180df6a14ee197d99d808ee52d
const payoutTokenPrice = 0.32;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'FOX/ETH',
  // https://v2.info.uniswap.org/pair/0x470e8de2ebaef52014a47cb5e6af86884947f08c
  // https://etherscan.io/token/0x470e8de2ebaef52014a47cb5e6af86884947f08c
  principalTokenPrice: 19_277_253 / 306_242,
  payoutTicker: 'FOX',
  payoutTokenPrice,
  // https://etherscan.io/token/0xc770eefad204b5180df6a14ee197d99d808ee52d
  payoutTokensInContract: 1_000_001_337,
  payoutTokensPerTerm: 144_530 * 30,
  payoutRateDescription: '144,530 FOX per day',
  oldContracts: true,
  customBondName: 'CustomOLDBond',
  customTreasuryName: 'CustomOLDTreasury',
  // maxPayout: 10,
  minBondsPerDay: 1,
  maxBondsPerDay: 1,
  // maxDebt: 4000000000000000000000,
  maxDebt: 10000000000000000000000,
  // bcv: 215720,
  bcv: 130000,
  // bcv: 33,
  // initialDebt: 33,
  // maxPayout: 33,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});