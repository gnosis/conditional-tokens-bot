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
const version = packageJson.version.startsWith('v') ? packageJson.version : `v${packageJson.version}`;
const startMessage = `Conditional Tokens bot \`${version}\` was started.`;
pushSlackMessage(startMessage);
console.log(startMessage);

console.log(`Configure to find events every ${jobTime} minutes`);
let fromBlock = 0;
const pastTimeInSeconds = jobTime * 60;
schedule.scheduleJob(`*/10 */${jobTime} * * * *`, async () => {
    // Calculate from and to bock numbers
    const lastBlock = await getLastBlockNumber();
    const toBlock = lastBlock - blockReorgLimit;
    if (fromBlock === 0 || fromBlock > toBlock) {
        fromBlock = toBlock - 752868;
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