const express = require("express");
const schedule = require('node-schedule');

const packageJson = require('../package.json');
const { port, jobTime } = require('./config');
const { pushSlackMessage } = require('./utils/slack');
const { watchCreationMarketsEvent, 
    watchResolvedMarketsEvent, 
    findMarketReadyByQuestionOpeningTimestamp,
    findMarketIsPendingArbitration } = require('./events/marketEvents');
const { findLogNotifyOfArbitrationRequestArbitration } = require('./events/realitioEvents');
const { findTradeEvents } = require('./events/tradeEvents');
const { findLiquidityEvents } = require('./events/liquidityEvents');

// Configure endpoint for readiness
const app = express();

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

findMarketReadyByQuestionOpeningTimestamp(1604321891, 1000000000);

// Watch new market created and resolved market events
let lastUsedBlock = 0;
schedule.scheduleJob(`*/${jobTime} * * * *`, function() {
    const fromBlock = lastUsedBlock ? lastUsedBlock : 0;
    watchCreationMarketsEvent(fromBlock).then(toBlock => {
        lastUsedBlock = toBlock;
    });
    // Watch resolved markets
    watchResolvedMarketsEvent(fromBlock);

    // Watch Realitio events
    findLogNotifyOfArbitrationRequestArbitration(fromBlock);
});

console.log(`Configure to find trade, liquidity events and market ready to be resolved for every ${jobTime} minutes`);
const pastTimeInSeconds = jobTime * 60;

const timestamp = Math.floor(Date.now() / 1000);
findTradeEvents(timestamp, pastTimeInSeconds);
findLiquidityEvents(timestamp, pastTimeInSeconds);
schedule.scheduleJob(`*/${jobTime} * * * *`, function() {
    const timestamp = Math.floor(Date.now() / 1000);
    // Find sell/buy Trade
    findTradeEvents(timestamp, pastTimeInSeconds);
    // Find added/removed Liquidity
    findLiquidityEvents(timestamp, pastTimeInSeconds);
    // Find markets ready to be resolved
    findMarketReadyByQuestionOpeningTimestamp(timestamp, pastTimeInSeconds);
});