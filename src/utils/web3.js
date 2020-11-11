const Web3 = require('web3');

const { network } = require('../config');

// Create a web3 instance
const web3 = new Web3(new Web3.providers.HttpProvider(network));
const chainId = web3.eth.getChainId();

/**
 * Get network id
 */
const getChainId = async () => {
    return await chainId;
}

/**
 * Get Ethereum urlExplorer
 */
const getUrlExplorer = async () => {
    const protocol = 'https'
    const explorer = 'etherscan.io';
    const chainId = await getChainId();

    switch (chainId) {
        case 1: return `${protocol}://${explorer}`;
            break;
        case 4: return `${protocol}://rinkeby.${explorer}`
            break;
        default:
            return `${protocol}://${explorer}`;
    }
}

/**
 * Get last block number
 */
const getLastBlockNumber = async () => {
    return web3.eth.getBlockNumber();
}



module.exports = {
    web3,
    getChainId,
    getUrlExplorer,
    getLastBlockNumber,
}