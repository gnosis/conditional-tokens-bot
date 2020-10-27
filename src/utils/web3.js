const Web3 = require('web3');

const { network } = require('../config');

// Create a web3 instance
const web3 = new Web3(new Web3.providers.HttpProvider(network));

const getLastBlockNumber = async () => {
    return web3.eth.getBlockNumber();
}

module.exports = {
    web3,
    getLastBlockNumber,
}