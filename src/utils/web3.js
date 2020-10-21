const Web3 = require('web3');

// Create a web3 instance
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE));

// Check websocket connection event
web3._provider.on('end', (eventObj) => {
    console.error('The websocket was Disconnected');
});

const getLastBlockNumber = async () => {
    return web3.eth.getBlockNumber();
}

module.exports = {
    web3,
    getLastBlockNumber,
}