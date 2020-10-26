const Web3 = require('web3');

// Create a web3 instance
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETH_NODE));

const getLastBlockNumber = async () => {
    return web3.eth.getBlockNumber();
}

module.exports = {
    web3,
    getLastBlockNumber,
}