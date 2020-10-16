const express = require("express");
const schedule = require('node-schedule');

const { urlExplorer, webhook, web3 } = require('./config/constants');
const { marketEvents } = require('./events/marketEvents');
const { tradeEvents } = require('./events/tradeEvents');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('CT bot is running!')
})
app.listen(port, () => console.log(`Bot listening on port ${port}!`));

// Watch new market created events
marketEvents(web3, webhook, urlExplorer);

// Look for trade events every minute
console.log(`Configure get trades job for every ${process.env.JOB_GET_TRADE_MINUTES} minutes`);
const timestamp = Math.floor(Date.now() / 1000);
console.log(`Looking for new trades at ${timestamp}`);
tradeEvents(web3, webhook, urlExplorer, timestamp, process.env.JOB_GET_TRADE_MINUTES*60);

schedule.scheduleJob(`*/${process.env.JOB_GET_TRADE_MINUTES} * * * *`, function(){
    const timestamp = Math.floor(Date.now() / 1000);
    console.log(`Looking for new trades at ${timestamp}`);
    tradeEvents(web3, webhook, urlExplorer, timestamp, process.env.JOB_GET_TRADE_MINUTES*60);
});