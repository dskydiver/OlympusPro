const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

const payoutTokenPrice = 0.004639417447;
// https://www.coingecko.com/en/coins/weth
const wethPrice = 3_000;
// https://etherscan.io/address/0xe0abce449a0e368eaf657f6f1c0ed5711174c46f#readProxyContract
const principalTokenPrice = (4946660185396880844 * wethPrice + 3200235991789476493212552 * payoutTokenPrice) / 3960131587495792185272

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  address: '0x84f0015998021fe53fdc7F1C299Bd7c92FccD455',
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 30,
  principalTicker: 'JPEG/wETH G-UNI',
  principalTokenPrice,
  payoutTicker: 'JPEG',
  payoutTokenPrice,
  // https://etherscan.io/token/0xe80c0cd204d654cebe8dd64a4857cab6be8345a3
  payoutTokensInContract: 69_420_000_000,
  payoutTokensPerTerm: 222_000_000,
  payoutRateDescription: '222M JPEG per month',
  minBondsPerDay: 1,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});