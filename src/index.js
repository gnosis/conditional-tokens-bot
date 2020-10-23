const express = require("express");
const schedule = require('node-schedule');

const packageJson = require('../package.json');
const { pushSlackMessage } = require('./utils/slack');
const { watchNewMarketsEvent } = require('./events/marketEvents');
const { findTradeEvents } = require('./events/tradeEvents');

// Configure endpoint for readiness
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('CT bot is running!')
})
app.listen(port, () => console.log(`Bot listening on port ${port}!`));

// Start message
const version = packageJson.version.startsWith('v') ? packageJson.version : `v${packageJson.version}`;
const startMessage = `Conditional Tokens bot \`${version}\` was started.`;
pushSlackMessage(startMessage);
console.log(startMessage);

const jobTime = process.env.JOB_GET_TRADE_MINUTES ? process.env.JOB_GET_TRADE_MINUTES : 5;

// Watch new market created events
let lastUsedBlock = 0
schedule.scheduleJob(`*/${jobTime} * * * *`, function() {
    const fromBlock = lastUsedBlock ? lastUsedBlock : 0;
    watchNewMarketsEvent(fromBlock).then(toBlock => {
        lastUsedBlock = toBlock;
    });
});

// Look for trade events every minute
console.log(`Configure get trades job for every ${jobTime} minutes`);
const pastTimeInSeconds = jobTime * 60;

findTradeEvents(Math.floor(Date.now() / 1000), pastTimeInSeconds);
schedule.scheduleJob(`*/${jobTime} * * * *`, function() {
    const timestamp = Math.floor(Date.now() / 1000);    
    findTradeEvents(timestamp, pastTimeInSeconds);
});