# OlympusPro

## Partner Dry Run

### Dependencies

1. From the terminal, navigate to this directory
2. `npm install hardhat`
3. `npx hardhat run scripts/[partner]/[partner]Deploy.js`
4. `npm install [remaining dependencies]` as needed until script runs

### Examples of Unique Scenarios

* [Using old bond contracts](./scripts/ethereum/dola-inv.lp.js): uses old bond and treasury, `sendPayoutAddress`/`feeInPayout` to change what parameters are sent
* [Adjusting decimals places](./scripts/ethereum/quart-usdc.lp.js): uses `increasePriceDigits` and `decreaseBcvDigits` with a custom contract

### Testing

Prices shown are in the payout token price per principal token price. The goal is to emit 85–90% of the desired payout tokens per month in max bond sizes so that we sell around 1½ per day. Total amount of emissions are driven by the Bond Control Variable but the first few days are heavily influenced by the initial debt.

On Ethereum, it's better to sell $10k max bonds rather than frequent bonds.

### Bond Setup

1. Copy `templates/partnerDeploy.js` into its cohort directory
2. Make sure the right network is being imported and used
3. Run the script

### Project/Contract Setup

NOTE: When viewing dollar and supply amounts on a scanner, make sure you hover the numbers to ensure you are capturing enough granularity.

#### Pricing LP Tokens

* Don't depend on Zerion/etc. since we've been burned by them though it's nice having it to double check
* Look up token on the scanner for the network (Etherscan, SnowTrace, etc.)
* For V2 bonds:
    * This equation appears in partnerDeploy.js but is commented out
    * Use the address view of the LP token to see how much of the payout token if in the pair
    * If the LP is different from the payout token, just pick the more reliably priced token
    * Multiply it by the price of the token, then multiply by 2 to get total liquidity
    * Use the token view of the LP token to see the LP token supply
    * Divide the total liquidity by the LP token supply
* For V3 bonds:
    * This equation appears in partnerDeploy.js but is commented out
    * From the read contract view, look at token0, token1, getTotalAmounts, and totalSupply
    * Using the addresses of token0 and token0, get their prices
    * The price is getTotalAmounts(total0)\*priceoftoken0 + getTotalAmounts(total1)\*priceoftoken1) / totalSupply
* It's a good idea to add the URLs as comments to the simulation code as you'll likely refer to them later

#### Payout Tokens

* Get the price of the payout token through the exchange if you know it
* Otherwise, you can usually use CoinGecko to find the price/exchange of the largest pool
* Verify the address matches
* Typically, exchanges will link directly to the token view on the scanner for the network though you can look it up manually
* From the token view, get the total supply
* Add the price and total supply to the simulation code
* It's a good idea to add the URLs as comments to the simulation code as you'll likely refer to them later

### Simulation Configuration

#### Standard Parameters

* principalTokenDecimals: Verify in the principal token contract
* payoutTokenDecimals: Verify in the payout token contract
* vestingTermInDays: Number of days from bond to claim
* fullTermInDays: Length of time to run the simulation, unrelated to the actual length of the bond program
* principalTicker: Ticker of the principal token
* principalTokenPrice: Price of the principal token
* payoutTicker: Ticker of the payout token
* payoutTokenPrice: Price of the payout token
* payoutTokensInContract: Total supply of tokens in the payout token contract
* payoutTokensPerTerm: Total number of payout tokens to emit per term
* payoutRateDescription: A description of token emissions

#### Often Customized

* minBondsPerDay: Minimum number of bonds to try to sell per day, influences max bond size
* bcv: If you need to make granular changes or test an existing contract
* maxPayout: If you need to make granular changes or test an existing contract
* feeInPayout: If the fee is collected in the payout token (default: true)
* customBondName: If a custom bond contract is used
* blocksUntilDiscount: As an optimization, the simulator estimates how many blocks to wait until it sees a discount. Adjust if it overshoots the discount or if it's being too conservative.

#### Configured When Price is Low Resolution

* customBondName = 'OPCustomDecimalsBond'
* [increase|decrease]PriceDigits: How many digits we need to add or remove until the market price has 4 digits
* [increase|decrease]BcvDigits: How many digits we need to add or remove until the BCV has 6 digits
* increaseMaxPayoutDigits: How many digits we need to add until the max payout can be at least 3 digits
* increaseDebtRatioDigits: How many digits we need to add until the debt ratio is at least 4 digits

#### Rarely Customized

* customTreasuryName: If a custom treasury contract is used
* maxBondsPerDay: Maximum number of bonds to try to sell per day, influences how fast simulation expects to see a discount
* payoutGoal: How much of the payout goal we should target
* bondReduction: How much of the max bond size we'll be bonding in the simulation
* bondDiscount: Discount we expect to get when we bond
* bcvDecimals: Only change if you know this is what the contract has to use
* priceDecimals: Only change if you know this is what the contract has to use
* maxPayoutDecimals: Just matches what's in the contract
* blockName: Configured by the network
* blocksPerDay: Configured by the network
* mine: Function configured by the network
* significantDigits: Used by some rounding operations
* initialDebt: If you need to make granular changes or test an existing contract
* maxDebt: If you need to make granular changes or test an existing contract
* fee: If partner has a different rate
* principalName: If a custom principal token contract is used
* payoutName: If a custom payout token contract is used
* sendPayoutAddress: Some old contracts need the payout address to be passed

### initializeBond Parameters

1. controlVariable: The Bond Control Variable (BCV)—a lower value drives price lower faster (increases discount)
2. vestingTerm: Number of blocks over which the bond will vest
3. minimumPrice: Minimum price a bond can be sold for
4. maxPayout: Ratio of payout token total supply—expressed in 1,000th of a percent (e-5)
5. maxDebt: In principal tokens, the most we would ever have outstanding
6. initialDebt: In principal tokens, the number to initialize the contract with as if those bonds were already purchased
