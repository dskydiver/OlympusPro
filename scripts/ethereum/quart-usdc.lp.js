const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

// https://www.coingecko.com/en/coins/sandclock
const payoutTokenPrice = 9.70;
// https://etherscan.io/tokenholdings?a=0x1e888882d0f291dd88c5605108c72d414f29d460
// https://etherscan.io/token/0x1e888882d0f291dd88c5605108c72d414f29d460
const principalTokenPrice = payoutTokenPrice * 353751.041588105231 * 2 / 1.01154592139632232;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0x871eecefe9c1aa35b9f2afed48a5f5fa696eb4f0',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'QUARTZ/USDC',
  principalTokenPrice,
  payoutTicker: 'QUARTZ',
  payoutTokenPrice,
  // https://etherscan.io/token/0xba8a621b4a54e61c442f5ec623687e2a942225ef  
  payoutTokensInContract: 100_000_000,
  payoutTokensPerTerm: 300_000 / payoutTokenPrice,
  payoutRateDescription: '$300k per month',
  // bcv: 5_000_000,
  maxPayout: 1,
  customBondName: 'SandclockCustomBond',
  increasePriceDigits: 3,
  decreaseBcvDigits: 3,
  // initialDebt: '21198591447370279',
  // maxDebt: '30000000000000000000',
  // maxPayout: 33,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});