require('dotenv').config()
const Web3 = require('web3');

const slackUrl = process.env.SLACK_WEBHOOK_URL;
const networkName = process.env.NETWORK_NAME;
const urlExplorer = networkName == "rinkeby" ? 'rinkeby.etherscan.io' : 'etherscan.io';

const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE));

module.exports = {
    slackUrl,
    urlExplorer,
    web3,
}