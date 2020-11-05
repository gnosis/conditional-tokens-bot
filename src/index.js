const express = require("express");
const schedule = require('node-schedule');

const packageJson = require('../package.json');
const { port, jobTime, blockReorgLimit, averageBlockTime } = require('./config');
const { pushSlackMessage } = require('./utils/slack');
const { getLastBlockNumber } = require('./utils/web3');
const { watchCreationMarketsEvent, 
    watchResolvedMarketsEvent, 
    findMarketReadyByQuestionOpeningTimestamp } = require('./events/marketEvents');
const { watchLogNotifyOfArbitrationRequestArbitration } = require('./events/realitioEvents');
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
const startMessage = `Conditional Tokens bot \`${packageJson.version}\` was started.`;
pushSlackMessage(startMessage);
console.log(startMessage);


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
schedule.scheduleJob(`*/${jobTime} * * * *`, async () => {
    // Calculate from and to bock numbers
    const lastBlock = await getLastBlockNumber();
    const toBlock = lastBlock - blockReorgLimit;
    if (fromBlock === 0 || fromBlock > toBlock) {
        fromBlock = toBlock;
    }
    // Watch creation market events
    await watchCreationMarketsEvent(fromBlock, toBlock);
    // Watch resolved market events
    await watchResolvedMarketsEvent(fromBlock, toBlock);
    // Watch Reality.eth events
    await watchLogNotifyOfArbitrationRequestArbitration(fromBlock, toBlock);
    fromBlock = toBlock + 1;

    const timestamp = Math.floor(Date.now() / 1000) - (blockReorgLimit * averageBlockTime);
    // Find sell/buy Trades
    await findTradeEvents(timestamp, pastTimeInSeconds);
    // Find added/removed Liquidities
    await findLiquidityEvents(timestamp, pastTimeInSeconds);
    // Find markets ready to be resolved
    await findMarketReadyByQuestionOpeningTimestamp(timestamp, pastTimeInSeconds);
});