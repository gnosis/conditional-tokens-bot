require('dotenv').config()
const _ = require("lodash/collection");
const express = require("express");
const { myContract } = require('./services/contractEvents');
const { IncomingWebhook } = require('@slack/webhook');
const getQuestion = require('./services/getQuestion');
const getCondition = require('./services/getCondition');

const app = express();
const port = 3000;

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

// watching create condition
myContract.events.ConditionPreparation({
    filter: {}, 
    fromBlock: process.env.START_BLOCK
}, function(error, event){ 
    // console.log(event);
    // Send the notification
    (async () => {
        const blocks = new Array({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '*New market created!* :tada:',
            }
        });
        getCondition(event.returnValues.conditionId).then((conditions) => {
            _.forEach(conditions, condition => {
                getQuestion(event.returnValues.questionId).then((questions) => {
                    if (questions.length == 0) {
                        console.error(`ERROR: Question for hex "${event.returnValues.questionId}" not found on contition ID ${event.returnValues.conditionId}`);
                        blocks.push({
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `Question for hex \`${event.returnValues.questionId}\' not found on contition ID \`${event.returnValues.conditionId}\``,
                            }
                        });
                    } else {
                        _.forEach(questions, question => {
                            blocks.push({ 
                                type: 'section', text: { type: 'mrkdwn', text: `*Title:* ${question.title}`, } 
                            });
                            blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*Outcomes:*`, } });
                            _.forEach(question.outcomes, outcome => {
                                blocks.push({
                                    type: 'section',
                                    text: {
                                        type: 'mrkdwn',
                                        text: `- ${outcome} - {outcome odds}`,
                                    }
                                });
                            });
                        });
                    }
                    blocks.push({
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Collateral*: ${event.returnValues.oracle}`,
                        }
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Liquidity*: {amount} {tokenSymbol}`,
                        }
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Omen URL*: {omenUrl}`,
                        }
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Created by*: ${condition.creator}`,
                        }
                    }
                    );
                    webhook && webhook.send({
                        blocks: blocks
                    });
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


// watching condition resolution
myContract.events.ConditionResolution({
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
 * Split Positions
 */
myContract.events.PositionSplit({
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
myContract.events.PositionsMerge({
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
myContract.events.PayoutRedemption({
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