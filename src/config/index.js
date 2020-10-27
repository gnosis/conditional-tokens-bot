const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT ? process.env.PORT : 3000,
  slackUrl: process.env.SLACK_WEBHOOK_URL,
  networkName: process.env.NETWORK_NAME,
  network: process.env.ETH_NODE,
  jobTime: process.env.JOB_GET_TRADE_MINUTES ? process.env.JOB_GET_TRADE_MINUTES : 5,
}