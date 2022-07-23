exports.ethereum = {
    blocksPerDay: 6_600,
    mine: async function(blocks = 2) {
        let remaining = blocks;
        while (remaining > 0) {
            remaining--;
            await hre.network.provider.request({
                method: "evm_mine",
                params: [],
            });
        }
        return blocks;
    },
    readContract: function(address) {
        return `https://etherscan.io/address/${address}#readContract`;
    }
};

exports.arbitrum =
exports.avalanche =
exports.fantom =
exports.optimism =
exports.polygon = {
    blockName: 'seconds',
    blocksPerDay: 86_400,
    mine: async function(seconds = 60) {
        await network.provider.send("evm_increaseTime", [seconds]);
        await network.provider.send("evm_mine");
        return seconds;
    },
    readContract: function() {
        throw 'No readContract URL defined for this network';
    }
};

exports.avalanche = { ...exports.avalanche, readContract: (address) => `https://snowtrace.io/address/${address}#readContract` };
exports.fantom = { ...exports.fantom, readContract: (address) => `https://ftmscan.com/address/${address}#readContract` };
exports.polygon = { ...exports.polygon, readContract: (address) => `https://polygonscan.com/address/${address}#readContract` };