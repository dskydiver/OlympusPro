const { ethers } = require("hardhat");

exports.dryRun = async function ({
  minBondsPerDay,
  maxBondsPerDay,
  // dailyPayoutGoalUSD,
  payoutGoal,
  bondReduction,
  bondDiscount,
  bcvDecimals,
  priceDecimals,
  maxPayoutDecimals,
  debtRatioDecimals,
  blockName = 'blocks',
  blocksPerDay,
  blocksUntilDiscount = undefined,
  mine,
  principalTokenDecimals,
  payoutTokenDecimals,
  significantDigits,
  vestingTermInDays,
  fullTermInDays,
  principalTicker = 'PPL',
  principalTokenPrice,
  payoutTicker = 'PAY',
  payoutTokenPrice,
  payoutTokensInContract,
  payoutTokensPerTerm,
  payoutRateDescription,
  bcv = undefined,
  initialDebt = undefined,
  maxDebt = undefined,
  maxPayout = undefined,
  fee = 3.33e-2,
  feeInPayout = true,
  customTreasuryName = 'CustomTreasury',
  customBondName = 'CustomBond',
  principalName = 'Principal',
  payoutName = 'Payout',
  sendPayoutAddress = false,
  increasePriceDigits = 0,
  decreasePriceDigits = 0,
  increaseBcvDigits = 0,
  decreaseBcvDigits = 0,
  increaseMaxPayoutDigits = 0,
  increaseDebtRatioDigits = 0,
  debtRatioTotalSupply = 0,
  address = '',
  readContract,
  adjustment = false,
}) {
  // BCV decimals
  let bcvDecimalsPow = bcvDecimals;
  if (bcvDecimals <= 18) {
    bcvDecimalsPow = bcvDecimals;
  }
  else {
    bcvDecimalsPow = Math.log10(bcvDecimals);
  }
  bcvDecimalsPow += decreaseBcvDigits - increaseBcvDigits;
  bcvDecimals = 10 ** bcvDecimalsPow;
  let needsCustomContract = false;
  if (bcvDecimalsPow !== 5) {
    needsCustomContract = true;
    console.log('Customized bcvDecimals', bcvDecimalsPow);
  }
  // price decimals
  let priceDecimalsPow = priceDecimals;
  if (priceDecimals <= 18) {
    priceDecimalsPow = priceDecimals;
  }
  else {
    priceDecimalsPow = Math.log10(priceDecimals);
  }
  priceDecimalsPow += increasePriceDigits - decreasePriceDigits;
  priceDecimals = 10 ** priceDecimalsPow;
  if (priceDecimalsPow !== 7) {
    needsCustomContract = true;
    console.log('Customized priceDecimals', priceDecimalsPow);
  }
  // max payout decimals
  let maxPayoutDecimalsPow = maxPayoutDecimals;
  if (maxPayoutDecimals <= 18) {
    maxPayoutDecimalsPow = maxPayoutDecimals;
  }
  else {
    maxPayoutDecimalsPow = Math.log10(maxPayoutDecimals);
  }
  maxPayoutDecimalsPow += increaseMaxPayoutDigits;
  maxPayoutDecimals = 10 ** maxPayoutDecimalsPow;
  if (maxPayoutDecimalsPow !== 5) {
    needsCustomContract = true;
    console.log('Customized maxPayoutDecimals', maxPayoutDecimalsPow);
  }
  // debt ratio decimals
  let debtRatioDecimalsPow = debtRatioDecimals;
  if (debtRatioDecimals <= 18) {
    debtRatioDecimalsPow = debtRatioDecimals;
  }
  else {
    debtRatioDecimalsPow = Math.log10(debtRatioDecimals);
  }
  debtRatioDecimalsPow += increaseDebtRatioDigits;
  debtRatioDecimals = 10 ** debtRatioDecimalsPow;
  if (debtRatioDecimalsPow !== 0) {
    needsCustomContract = true;
    console.log('Customized debtRatioDecimals', debtRatioDecimalsPow);
  }
  // warn about custom contracts
  if (needsCustomContract) {
    console.log('Customized decimals require custom contract');
    console.log('');
  }
  // calculate debt ratio denominator
  if (debtRatioTotalSupply === 0) {
    debtRatioTotalSupply = payoutTokensInContract;
  }
  if (!bcv) {
    // Debt is how much is paid out over the vesting term
    // I compensated for the bondDiscount in both the debt and price
    let debt = (payoutTokensPerTerm * payoutGoal * vestingTermInDays * bondDiscount / fullTermInDays);
    // If you take the contract equation to calculate price and solve for bcv, you get
    // bcv = bondPrice * payoutTokensInContract / debt / bcvDecimals
    // I'm not sure how it works to just replace bondPrice with priceDecimals but it does
    bcv = priceDecimals * debtRatioTotalSupply;
    if (feeInPayout) {
      debt *= (1 - fee);
    }
    bcv = bcv / bondDiscount / debt / bcvDecimals / debtRatioDecimals;
    bcv = roundSignificant(bcv, 3);
    console.log(`Auto-calculated BCV: ${bcv}`);
  }
  if (!maxPayout) {
    // Calculate payout between the minimum and maximum number of bonds we want to sell per day
    // and try to get above the payout goal in USD we want to have per day
    const highestPayout = Math.ceil(payoutTokensPerTerm * payoutGoal / fullTermInDays / minBondsPerDay / payoutTokensInContract * maxPayoutDecimals);
    /*
    const lowestPayout = Math.ceil(payoutTokensPerTerm * payoutGoal / fullTermInDays / maxBondsPerDay / payoutTokensInContract * maxPayoutDecimals);
    let possiblePayout = lowestPayout;
    for (; possiblePayout <= lowestPayout; possiblePayout++) {
      if (payoutTokensInContract * possiblePayout / bcvDecimals * payoutTokenPrice >= dailyPayoutGoalUSD) {
        break;
      }
    }
    */
    maxPayout = highestPayout;
  }
  // Calculate values based on inputs
  const vestingTermBlocks = blocksPerDay * vestingTermInDays;
  const termBlocks = blocksPerDay * fullTermInDays;
  const marketPrice = Math.round(payoutTokenPrice / principalTokenPrice * priceDecimals);
  const minimumPrice = Math.round(0.7 * payoutTokenPrice / principalTokenPrice * priceDecimals);
  const discountPrice = Math.round(bondDiscount * payoutTokenPrice / principalTokenPrice * priceDecimals);
  const maxBondSize = payoutTokensInContract * maxPayout / maxPayoutDecimals * payoutTokenPrice / principalTokenPrice * principalTokenDecimals;
  const maxPayoutSize = payoutTokensInContract * maxPayout / maxPayoutDecimals;
  const discountBondSize = Math.round(bondReduction * maxBondSize);
  if (!maxDebt) {
    // amount of debt in the principal token expected over the vesting term multiplied by 3
    maxDebt = BigInt(roundSignificant(Math.round((vestingTermInDays / fullTermInDays) * (payoutTokensPerTerm * payoutTokenPrice / principalTokenPrice * principalTokenDecimals) * 3), significantDigits));
  }
  // Calculate an initial debt that gets us closest to ideal payout and price based on BCV
  const options = [];
  if (!initialDebt) {
    // Solve for initialDebt using contract payout calculation
    initialDebt = discountPrice * debtRatioTotalSupply / bcv / (1 + fee) * (payoutTokenDecimals / bcvDecimals / debtRatioDecimals);
    initialDebt = BigInt(roundSignificant(initialDebt, significantDigits));
    console.log(`Auto-calculated initial debt: ${initialDebt}`);
  }
  
  // Show URL for reading this contract
  address && console.log(readContract(address));
  
  // Display the report we went to the partner
  const maxPayoutLog = `Max Payout: ${maxPayout} (${pretty(maxPayout / maxPayoutDecimals * 100)}%) = ${pretty(maxPayoutSize)} ${payoutTicker} = $${pretty(Math.round(maxPayoutSize * payoutTokenPrice))}`;
  console.log(`
~~-                  -~~
${principalTicker} => ${payoutTicker}${address ? ` (${address})` : ''}
~~-                  -~~
Please double-check price assumptions, the payout token total supply, and emissions goals.

Assuming ${payoutTicker} ${pretty(payoutTokenPrice, { currency: 'USD', maximumFractionDigits: 9 })}
Assuming ${principalTicker} ${pretty(principalTokenPrice, { currency: 'USD', maximumFractionDigits: 9 })}
Market Price: ${pretty(marketPrice)} (${pretty(Math.round(marketPrice / priceDecimals * priceDecimals) / priceDecimals, {minimumSignificantDigits: 1})} ${principalTicker} is worth 1 ${payoutTicker})
Discounted: ${pretty(discountPrice)}

Total ${payoutTicker} Token Supply: ${pretty(payoutTokensInContract)}
${payoutRateDescription ? `Emissions Goal: ${payoutRateDescription}\n` : ''}\
Emissions Goal (${fullTermInDays} days): ${pretty(payoutTokensPerTerm * payoutGoal)} (${Math.round(payoutGoal * 100)}% of ${pretty(payoutTokensPerTerm)})

BCV: ${bcv}
Vesting: ${vestingTermBlocks} (${vestingTermInDays} days)
Simulation Duration: ${termBlocks} (${fullTermInDays} days)
Min Price: ${minimumPrice}
${maxPayoutLog} = Max Payout ${pretty(maxBondSize / principalTokenDecimals, {minimumSignificantDigits: 1})} ${principalTicker} (Market)
Max Debt: ${BigInt(maxDebt)} (${pretty(Number(maxDebt) / principalTokenDecimals, {minimumSignificantDigits: 1})} ${principalTicker})${adjustment ? '' : `
Initial Debt: ${BigInt(initialDebt)} (${pretty(Number(initialDebt) / principalTokenDecimals, {minimumSignificantDigits: 1})} ${principalTicker})`}

Bonding ${pretty(discountBondSize / principalTokenDecimals, {minimumSignificantDigits: 1})} ${principalTicker} = ${pretty(discountBondSize / principalTokenDecimals * principalTokenPrice, { currency: 'USD' })} (${Math.round(bondReduction * 100)}% of max bond size)
`);
    const [deployer, admin, user, mockDAO] = await ethers.getSigners();
    console.log('Deploying contracts with the account: ' + deployer.address);

    // Deploy Mock Principal token
    const Principal = await ethers.getContractFactory(principalName);
    const principal = await Principal.deploy('1');

    // Deploy Mock Payout token
    const Payout = await ethers.getContractFactory(payoutName);
    const payout = await Payout.deploy('1');

    // Deploy Mock Treaury
    const MockTreasury = await ethers.getContractFactory('MockTreasury');
    const mockTreasury = await MockTreasury.deploy(deployer.address);

    // Deplopy Olympus Pro Subsidy Router
    const OlympusProSubsidyRouter = await ethers.getContractFactory('OPSubsidyRouter');
    const olympusProSubsidyRouter = await OlympusProSubsidyRouter.deploy();

    // Deplopy Factory storage
    const OlympusProFactoryStorage = await ethers.getContractFactory('OlympusProFactoryStorage');
    const olympusProFactoryStorage = await OlympusProFactoryStorage.deploy();

    // Deploy Factory
    const OlympusProFactory = await ethers.getContractFactory('OlympusProFactory');
    const olympusProFactory = await OlympusProFactory.deploy(mockTreasury.address, olympusProFactoryStorage.address, olympusProSubsidyRouter.address, mockDAO.address);

    // Toggle factory address a in storage
    await olympusProFactoryStorage.setFactoryAddress(olympusProFactory.address);

    // Get contract factory for custom treasury and custom bond
    const CustomTreasury = await ethers.getContractFactory(customTreasuryName);
    const CustomBond = await ethers.getContractFactory(customBondName);

    // Deploy contracts
    const customTreasury = await CustomTreasury.deploy(payout.address, admin.address);
    const customBondParameters = [customTreasury.address, principal.address, mockTreasury.address, olympusProSubsidyRouter.address, admin.address, mockDAO.address, ['0'], [`${Math.round(fee * 1e6)}`]];
    if (sendPayoutAddress) {
      customBondParameters.splice(1, 0, payout.address);
    }
    if (feeInPayout === true || feeInPayout === false) {
      customBondParameters.push(feeInPayout);
    }
    const customBond = await CustomBond.deploy(...customBondParameters);

    try {
      // Toggle bond in treasury
      await customTreasury.connect(admin).toggleBondContract(customBond.address);
    } catch (e) {}

    try {
      // Toggle bond in treasury
      await customTreasury.connect(admin).whitelistBondContract(customBond.address);
    } catch (e) {}

    // Mint amount of payout token and principle token
    await payout.mint(customTreasury.address, `${BigInt(payoutTokensInContract * payoutTokenDecimals)}`);
    await principal.mint(user.address, '100000000000000000000000000');

    // Approve bond contract to spend principal tokens
    await principal.connect(user).approve(customBond.address, '10000000000000000000000000');

    // Set vesting rate
    await customBond.connect(admin).setBondTerms('0', `${vestingTermBlocks}`);

    // Set decimals
    try {
      await customBond.connect(admin).setDecimals(`${priceDecimalsPow}`, `${bcvDecimalsPow}`, `${maxPayoutDecimalsPow}`, `${debtRatioDecimalsPow}`);
    } catch (e) {}

    // Initialize bond
    await customBond.connect(admin).initializeBond(
      `${bcv}`,
      `${vestingTermBlocks}`,
      `${minimumPrice}`,
      `${maxPayout}`,
      `${BigInt(maxDebt)}`,
      `${BigInt(initialDebt)}`
    );

    const history = [];

    console.log(`\nDebt ratio: ${await customBond.debtRatio()}`);
    const payoutResponse = await customBond.payoutFor(`${BigInt(discountBondSize)}`);
    console.log(`First payout: ${pretty((Array.isArray(payoutResponse) ? payoutResponse[0] : payoutResponse) / payoutTokenDecimals, {minimumSignificantDigits: 1})}`);
    const priceBefore = await customBond.trueBondPrice();
    const discountBefore = Math.round((marketPrice - priceBefore) / marketPrice * 100);
    console.log(`Bond price before FIRST bond: ${pretty(priceBefore)} (${discountBefore}% discount)`);
    await customBond.connect(user).deposit(`${BigInt(discountBondSize)}`, '10000000000', user.address );
    const priceAfter = await customBond.trueBondPrice();
    const premiumAfter = Math.round((priceAfter - marketPrice) / marketPrice * 100);
    console.log(`Bond price FIRST bond: ${pretty(priceAfter)} (${premiumAfter}% premium)`);
    history.push({ priceBefore, discountBefore, priceAfter, premiumAfter });

    console.log();

    // divide the term length by the number of discounted bonds we expect to sell then give it some wiggle room (15%)
    if (!blocksUntilDiscount) {
      blocksUntilDiscount = Math.floor(termBlocks * (bondReduction * payoutTokensInContract * maxPayout / maxPayoutDecimals) / (payoutTokensPerTerm * payoutGoal) * 0.85);
    }
    console.log(`Waiting ${blocksUntilDiscount} blocks for a discount`);

    console.log();

    let totalBlocksPassed = 0;
    let bondNum = 1;
    async function bond() {
        while(totalBlocksPassed < termBlocks) {
            bondNum++;
            let immediateDiscount = true;
            let blocksPassed = await mine(blocksUntilDiscount);
            while((await customBond.trueBondPrice()).toNumber() > discountPrice) {
              blocksPassed += await mine();
              immediateDiscount = false;
            }
            if (immediateDiscount) {
              console.log('Overshot discount');
              blocksUntilDiscount -= Math.floor(blocksPerDay / 24);
            }
            else {
              // Move the prediction toward the number of blocks just passed
              blocksUntilDiscount += Math.floor((blocksPassed - blocksUntilDiscount) * 0.5);
            }
            if (totalBlocksPassed === 0) {
                // Additional block cycle added to first bond to normalize the extrapolation below
                totalBlocksPassed += blocksPassed;
            }
            totalBlocksPassed += blocksPassed; 

            console.log(`Blocks passed until bond ${bondNum}: ${blocksPassed}`);

            const priceBefore = await customBond.trueBondPrice();
            const discountBefore = Math.round((marketPrice - priceBefore) / marketPrice * 100);
            console.log(`Bond price before bond ${bondNum}: ${pretty(priceBefore)} (${discountBefore}% discount)`);
            await customBond.connect(user).deposit(`${BigInt(discountBondSize)}`, '10000000000', user.address );
            const priceAfter = await customBond.trueBondPrice();
            const premiumAfter = Math.round((priceAfter - marketPrice) / marketPrice * 100);
            console.log(`Bond price after bond ${bondNum}: ${pretty(priceAfter)} (${premiumAfter}% premium)`);
            history.push({ priceBefore, discountBefore, priceAfter, premiumAfter, blocksPassed });
            const extrapolatedEmissions = (await customBond.totalPayoutGiven()) / payoutTokenDecimals * termBlocks / totalBlocksPassed;
            console.log(`Extrapolated emissions: ${pretty(extrapolatedEmissions)} (${Math.round(extrapolatedEmissions / (payoutTokensPerTerm * payoutGoal) * 100)}%)`)
            console.log()
        }
      }

    await bond();

    const totalPrincipal = (await customBond.totalPrincipalBonded()) / principalTokenDecimals;
    const totalPayout = (await customBond.totalPayoutGiven()) / payoutTokenDecimals;
    const totalFees = feeInPayout ? (await payout.balanceOf(mockTreasury.address) / payoutTokenDecimals) : (await principal.balanceOf(mockTreasury.address) / principalTokenDecimals)

    console.log(`
${bondNum} total bonds

Total Payout given: ${pretty(totalPayout)} ${payoutTicker} = ${pretty(totalPayout * payoutTokenPrice, { currency: 'USD' })}
Principal Bonded: ${pretty(totalPrincipal)} ${principalTicker} = ${pretty(totalPrincipal * principalTokenPrice, { currency: 'USD' })}
${feeInPayout ? 'Payout' : 'Principal'} Fees Taken In: ${pretty(totalFees)} ${feeInPayout ? payoutTicker : principalTicker} = ${pretty(totalFees * (feeInPayout ? payoutTokenPrice : principalTokenPrice), { currency: 'USD' })}

${pretty(totalPayout)} / ${pretty(payoutTokensPerTerm)} - ${Math.round(totalPayout / payoutTokensPerTerm * 100)}% of goal

${pretty(history[0].priceBefore)} (${pretty(history[0].discountBefore)}% discount) => \
bond of ${pretty((discountBondSize / principalTokenDecimals))} ${principalTicker} => \
${pretty(history[0].priceAfter)} (${pretty(history[0].premiumAfter)}% premium) => \
${pretty(history[1].blocksPassed)} ${blockName} => \
${pretty(history[1].priceBefore)} (${pretty(history[1].discountBefore)}% discount) => \
bond of ${pretty((discountBondSize / principalTokenDecimals))} ${principalTicker} => \
${pretty(history[1].priceAfter)} (${pretty(history[1].premiumAfter)}% premium) => \
${pretty(history[2].blocksPassed)} ${blockName} => \
etc`);

if (!adjustment) {
  console.log(`
When ready to go live:
4. initializeBond('${bcv}', '${vestingTermBlocks}', '${minimumPrice}', '${maxPayout}', '${BigInt(maxDebt)}', '${BigInt(initialDebt)}')
`);
}
else {
  console.log(`~~-                  -~~
# BCV ??? => ${pretty(bcv)} (??? bonds):

setAdjustment
_addition: true/false
_increment: ???
_target: ${bcv}
_buffer: 200

# ${maxPayoutLog}

setBondTerms
_parameter: 1
_input: ${maxPayout}

# Max Debt ${pretty(Number(maxDebt) / principalTokenDecimals, {minimumSignificantDigits: 1})} ${principalTicker}

setBondTerms
_parameter: 2
_input: ${BigInt(maxDebt)}
`)
}

  function pretty(thing, options = {}, locale = 'en-US') {
    if (options.currency) {
      options.style = 'currency';
    }
    if (typeof thing === 'number') {
      return new Intl.NumberFormat(locale, options).format(thing);
    }
    if (typeof thing.toNumber === 'function') {
      return new Intl.NumberFormat(locale, options).format(BigInt(`${thing}`));
    }
    if (typeof thing === 'object' && `${thing}`.match(/^\d+$/)) {
      return new Intl.NumberFormat(locale, options).format(parseInt(`${thing}`, 10));
    }
    if (typeof thing === 'string' && thing.match(/^\d+$/)) {
      return new Intl.NumberFormat(locale, options).format(parseInt(thing, 10));
    }
    throw new Error('Unrecognized thing to pretty');
  }

  function roundSignificant(int, significantDigits) {
    let intString = int;
    if (typeof int === 'number') {
      intString = `${BigInt(Math.round(int))}`;
    }
    else if (typeof int === 'bigint') {
      intString = `${int}`;
    }
    if (intString.length <= significantDigits) {
      return intString;
    }
    return Math.round(parseInt(`${intString}`.slice(0, significantDigits + 1), 10) / 10) + ''.padStart(intString.length - significantDigits, '0');
  }
}