require('dotenv').config()
const Web3 = require('web3');

const slackUrl = process.env.SLACK_WEBHOOK_URL;
const networkName = process.env.NETWORK_NAME;
const urlExplorer = networkName == "rinkeby" ? 'rinkeby.etherscan.io' : 'etherscan.io';

// Create a web3 instance
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE));

// Check websocket connection event
web3._provider.on('end', (eventObj) => {
    console.error('The websocket was Disconnected');
});


module.exports = {
    slackUrl,
    urlExplorer,
    web3,
}