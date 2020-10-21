require('dotenv').config()

const slackUrl = process.env.SLACK_WEBHOOK_URL;
const networkName = process.env.NETWORK_NAME;
const urlExplorer = networkName == "rinkeby" ? 'rinkeby.etherscan.io' : 'etherscan.io';

module.exports = {
    slackUrl,
    urlExplorer,
}