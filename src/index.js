const express = require("express");
const schedule = require('node-schedule');

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

// Watch new market created events
watchNewMarketsEvent();

// Look for trade events every minute
console.log(`Configure get trades job for every ${process.env.JOB_GET_TRADE_MINUTES} minutes`);
const pastTimeInSeconds = process.env.JOB_GET_TRADE_MINUTES * 60;

findTradeEvents(Math.floor(Date.now() / 1000), pastTimeInSeconds);
schedule.scheduleJob(`*/${process.env.JOB_GET_TRADE_MINUTES} * * * *`, function() {
    const timestamp = Math.floor(Date.now() / 1000);    
    findTradeEvents(timestamp, pastTimeInSeconds);
});