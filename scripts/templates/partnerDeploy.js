const { dryRun } = require("../dryRun");
const config = require("../templates/config");
const contract = require("../templates/contracts");
const { ethereum } = require("../templates/networks");

const payoutTokenPrice = 33;
// Reserve:
// const principalTokenPrice = 33;
// V2 LP:
// const principalTokenPrice = payoutTokenPrice * payoutTokensInPair * 2 / lpTokenSupply;
// V3 LP:
// const principalTokenPrice = (contract.getTotalAmounts.total0 * contract.token0.price + contract.getTotalAmounts.total1 * contract.token1.price) / contract.totalSupply
// Beethoven X:
// const poolAddress = '0xf3a602d30dcb723a74a0198313a7551feaca7dac00010000000000000000005f';
// console.log(`https://graph-node.beets-ftm-node.com/subgraphs/name/beethovenx/graphql?query=%7B%0A%20%20pool(id%3A%20%22${poolAddress}%22)%20%7B%0A%20%20%20%20totalLiquidity%0A%20%20%20%20totalShares%0A%20%20%7D%0A%7D%0A`);
// const principalTokenPrice = totalLiquidity / totalShares;

dryRun({
  ...config,
  ...contract,
  ...ethereum,
  principalTokenDecimals: 1e18,
  payoutTokenDecimals: 1e18,
  vestingTermInDays: 7,
  fullTermInDays: 7 * 4,
  principalTicker: 'PPL',
  principalTokenPrice,
  payoutTicker: 'PAY',
  payoutTokenPrice,
  payoutTokensInContract: 33,
  payoutTokensPerTerm: 33,
  payoutRateDescription: '',
  // minBondsPerDay: 1,
})
  .then(() => process.exit())
  .catch(error => {
      console.error(error);
      process.exit(1);
});