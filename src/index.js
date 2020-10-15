const _ = require("lodash/collection");
const express = require("express");
const schedule = require('node-schedule');

const { urlExplorer, webhook, web3 } = require('./config/constants');
const { truncate } = require('./utils/utils');
const { getconditionalTokensContract, getFixedProductionMarketMakerFactoryContract } = require('./services/contractEvents');
const { getTokenName, getTokenSymbol, getTokenDecimals } = require('./services/contractERC20');
const { getQuestion } = require('./services/getQuestion');
const { getCondition } = require('./services/getCondition');
const { tradeEvents } = require('./events/tradeEvents');

const app = express();
const port = 3000;
const fixedProductMarketMakerFactoryContract = getFixedProductionMarketMakerFactoryContract(web3);

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('CT bot is running!')
})
app.listen(port, () => console.log(`Bot listening on port ${port}!`));

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

/**
 * Watching FixedProductMarketMakerCreation
 */
fixedProductMarketMakerFactoryContract.events.FixedProductMarketMakerCreation({
    filter: {},
    fromBlock: process.env.START_BLOCK,
}, (error, event) => {
    (async () => {
        const message = new Array('<!here>', '*New market created!* :tada:');
        //TODO support conditional markets
        getCondition(event.returnValues.conditionIds[0]).then((conditions) => {
            _.forEach(conditions, condition => {
                getQuestion(condition.questionId).then((questions) => {
                    if (questions.length == 0) {
                        console.error(`ERROR: Question for hex "${condition.questionId}" not found on contition ID ${event.returnValues.conditionIds[0]}`);
                    } else {
                        _.forEach(questions, question => {
                            message.push(`> *<https://omen.eth.link/#/${condition.fixedProductMarketMakers}|${question.title}>*`,
                                `> *Outcomes:*`);
                            if (condition.outcomeTokenMarginalPrices) {
                                _.forEach(question.outcomes, (outcome, i) => {
                                    message.push(`> \`${(parseFloat(condition.outcomeTokenMarginalPrices[i]) * 100 ).toFixed(2)}%\` - ${outcome}`);
                                });
                            } else {
                                _.forEach(question.outcomes, (outcome, i) => {
                                    message.push(`> - ${outcome}`);
                                });
                            }
                        });
                        getTokenName(web3, event.returnValues.collateralToken).then(tokenName => {
                            getTokenSymbol(web3, event.returnValues.collateralToken).then(tokenSymbol => {
                                getTokenDecimals(web3, event.returnValues.collateralToken).then(decimals => {
                                    web3.eth.getTransaction(event.transactionHash).then(transaction => {
                                        message.push(`> *Collateral*: <https://${urlExplorer}/token/${event.returnValues.collateralToken}|${tokenName}>`,
                                            `> *Liquidity*: ${parseFloat(condition.scaledLiquidityParameter).toFixed(2)} ${tokenSymbol}`,
                                            `> *Created by*: <https://${urlExplorer}/address/${transaction.from}|${truncate(transaction.from, 14)}>`);
                                        webhook && webhook.send({
                                            blocks: [{
                                                type: 'section',
                                                text: {
                                                    type: 'mrkdwn',
                                                    text: message.join('\n')
                                                    }
                                                }
                                            ]
                                        });
                                        console.log(event.returnValues.conditionIds[0] + ':\n' + message + '\n');
                                    });
                                });
                            });
                        });
                    }
                });
            });
        });
    })();
});
