require('dotenv').config()
const Web3 = require('web3');
const _ = require("lodash/collection");
const express = require("express");
const { IncomingWebhook } = require('@slack/webhook');
const { getconditionalTokensContract } = require('./services/contractEvents');
const { getTokenName, getTokenSymbol, getTokenDecimals } = require('./services/contractERC20');
const { getQuestion } = require('./services/getQuestion');
const { getCondition } = require('./services/getCondition');

const app = express();
const port = 3000;
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE));
const conditionalTokenContract = getconditionalTokensContract(web3);

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('CT bot is running!')
})
app.listen(port, () => console.log(`Bot listening on port ${port}!`));

// Read a url from the environment variables
const url = process.env.SLACK_WEBHOOK_URL;
const networkName = process.env.NETWORK_NAME;
const urlExplorer = networkName == "rinkeby" ? 'rinkeby.etherscan.io' : 'etherscan.io';

// Initialize webhook for Slack
const webhook = url ? new IncomingWebhook(url) : undefined;
if (webhook === undefined) {
    console.log('SLACK_WEBHOOK_URL not defined!!');
}

/**
 * Split Positions
 */
conditionalTokenContract.events.PositionSplit({
    filter: {}, 
    fromBlock: process.env.START_BLOCK
}, function(error, event){ 
    console.log(event); 
    // Send the notification
    (async () => {
        const message = new Array('> *New market created!* :tada:\n> ');
        getCondition(event.returnValues.conditionId).then((conditions) => {
            _.forEach(conditions, condition => {
                getQuestion(condition.questionId).then((questions) => {
                    if (questions.length == 0) {
                        console.error(`ERROR: Question for hex "${condition.questionId}" not found on contition ID ${event.returnValues.conditionId}`);
                    } else {
                        _.forEach(questions, question => {
                            message.push(`> *Title:*\n> ${question.title}`,
                                `> *Outcomes:*`);
                            if (question.outcomeTokenMarginalPrices) {
                                _.forEach(question.outcomes, (outcome, i) => {
                                    message.push(`> \`${(parseFloat(question.outcomeTokenMarginalPrices[i]) * 100 ).toFixed(2)}%\` - ${outcome}`);
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
                                            `> *Liquidity*: ${(parseFloat(event.returnValues.amount) / 10**decimals ).toFixed(2)} ${tokenSymbol}`,
                                            `> *Omen URL*: <https://omen.eth.link/#/${questions[0].indexedFixedProductMarketMakers}|--&gt;>`,
                                            `> *Created by*: <https://${urlExplorer}/address/${transaction.from}|${transaction.from}>`);
                                        webhook && webhook.send({
                                            blocks: [{
                                                type: 'section',
                                                text: {
                                                    type: 'mrkdwn',
                                                    text: '---'
                                                    }
                                                },{
                                                type: 'section',
                                                text: {
                                                    type: 'mrkdwn',
                                                    text: message.join('\n')
                                                    }
                                                }
                                                ,{
                                                type: 'section',
                                                text: {
                                                    type: 'mrkdwn',
                                                    text: `<!here>`,
                                                    }
                                                },
                                                {
                                                type: 'section',
                                                text: {
                                                    type: 'mrkdwn',
                                                    text: '---'
                                                    }
                                                }
                                            ]
                                        });
                                    });
                                });
                            });
                        });
                    }
                });
            });
        });
    })();
})
.on('data', function(event){
    console.log(event); // same results as the optional callback above
})
.on('changed', function(event){
    // remove event from local database
})
.on('error', console.error);


// watching create condition
conditionalTokenContract.events.ConditionPreparation({
    filter: {}, 
    fromBlock: process.env.START_BLOCK
}, function(error, event){ 
    console.log(event);
})
.on('data', function(event){
    console.log(event); // same results as the optional callback above
})
.on('changed', function(event){
    // remove event from local database
})
.on('error', console.error);

// watching condition resolution
conditionalTokenContract.events.ConditionResolution({
    filter: {}, 
    fromBlock: process.env.START_BLOCK
}, function(error, event){ 
    console.log(event); 
    // Send the notification
    (async () => {
        webhook && await webhook.send({
        blocks: [
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `>----`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `-> *New \`${event.event}\` at block <https://${urlExplorer}/block/${event.blockNumber}|${event.blockNumber}>*`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*conditionId*: ${event.returnValues.conditionId}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*oracle*: <https://${urlExplorer}/address/${event.returnValues.oracle}|${event.returnValues.oracle}>`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*questionId*: ${event.returnValues.questionId}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*outcomeSlotCount*: ${event.returnValues.outcomeSlotCount}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*payoutNumerators*: ${event.returnValues.payoutNumerators}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `>----`,
                }
            }],
        });
    })();
})
.on('data', function(event){
    console.log(event); // same results as the optional callback above
})
.on('changed', function(event){
    // remove event from local database
})
.on('error', console.error);

/**
 * Merge Positions
 */
conditionalTokenContract.events.PositionsMerge({
    filter: {}, 
    fromBlock: process.env.START_BLOCK
}, function(error, event){ 
    console.log(event); 
    // Send the notification
    (async () => {
        webhook && await webhook.send({
        blocks: [
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `>----`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `-> *New \`${event.event}\` at block <https://${urlExplorer}/block/${event.blockNumber}|${event.blockNumber}>*`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*stakeholder*: ${event.returnValues.stakeholder}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*collateralToken*: <https://${urlExplorer}/address/${event.returnValues.collateralToken}|${event.returnValues.collateralToken}>`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*parentCollectionId*: ${event.returnValues.parentCollectionId}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*conditionId*: ${event.returnValues.conditionId}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*partition*: ${event.returnValues.partition}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*amount*: ${event.returnValues.amount}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `>----`,
                }
            }],
        });
    })();
})
.on('data', function(event){
    console.log(event); // same results as the optional callback above
})
.on('changed', function(event){
    // remove event from local database
})
.on('error', console.error);

/**
 * Payout Redemption
 */
conditionalTokenContract.events.PayoutRedemption({
    filter: {}, 
    fromBlock: process.env.START_BLOCK
}, function(error, event){ 
    console.log(event); 
    // Send the notification
    (async () => {
        webhook && await webhook.send({
        blocks: [
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `>----`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `-> *New \`${event.event}\` at block <https://${urlExplorer}/block/${event.blockNumber}|${event.blockNumber}>*`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*redeemer*: ${event.returnValues.redeemer}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*collateralToken*: <https://${urlExplorer}/address/${event.returnValues.collateralToken}|${event.returnValues.collateralToken}>`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*parentCollectionId*: ${event.returnValues.parentCollectionId}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*conditionId*: ${event.returnValues.conditionId}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*indexSets*: ${event.returnValues.indexSets}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*payout*: ${event.returnValues.payout}`,
                }
            },
            {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `>----`,
                }
            }],
        });
    })();
})
.on('data', function(event){
    console.log(event); // same results as the optional callback above
})
.on('changed', function(event){
    // remove event from local database
})
.on('error', console.error);