const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT ? process.env.PORT : 3000,
  slackUrl: process.env.SLACK_WEBHOOK_URL,
  network: process.env.ETH_NODE,
  blockReorgLimit: process.env.BLOCK_REORG_LIMIT ? process.env.BLOCK_REORG_LIMIT : 5,
  averageBlockTime: process.env.AVERAGE_BLOCK_TIME ? process.env.AVERAGE_BLOCK_TIME : 20,
  jobTime: process.env.JOB_GET_TRADE_MINUTES ? process.env.JOB_GET_TRADE_MINUTES : 5,
}