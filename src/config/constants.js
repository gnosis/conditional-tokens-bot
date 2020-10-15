require('dotenv').config()
const { IncomingWebhook } = require('@slack/webhook');
const Web3 = require('web3');

const slackUrl = process.env.SLACK_WEBHOOK_URL;
const networkName = process.env.NETWORK_NAME;
const urlExplorer = networkName == "rinkeby" ? 'rinkeby.etherscan.io' : 'etherscan.io';
// Initialize webhook for Slack
const webhook = slackUrl ? new IncomingWebhook(slackUrl) : undefined;
if (webhook === undefined) {
    console.log('SLACK_WEBHOOK_URL not defined!!');
}

const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE));

module.exports = {
    urlExplorer,
    webhook,
    web3,
}