const { urlExplorer } = require('../config/constants');
const { truncate } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { web3, getLastBlockNumber } = require('../utils/web3');
const { getFixedProductionMarketMakerFactoryContract, getconditionalTokensContract } = require('../services/contractEvents');
const { getTokenName, getTokenSymbol } = require('../services/contractERC20');
const { getQuestion, getQuestionByOpeningTimestamp } = require('../services/getQuestion');
const { getCondition } = require('../services/getCondition');

const fixedProductMarketMakerFactoryContract = getFixedProductionMarketMakerFactoryContract(web3);
const conditionalTokensContract = getconditionalTokensContract(web3);

/**
 * Get `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
 * @param  fromBlock
 * @param  toBlock
 * on the `returnValues` values like an array with the `conditionIds`,
 * and the `collateralToken`.
 * 
 */
const getFPMMCreationEvent = async (fromBlock, toBlock) => {
    console.log(`Watching market creation events from ${fromBlock} to ${toBlock} block.`);

    fixedProductMarketMakerFactoryContract.getPastEvents('FixedProductMarketMakerCreation', {
        filter: {},
        fromBlock,
        toBlock,
    }, (error, events) => {
        events.forEach(event => {
            (async () => {
                const message = new Array('<!here>', '*New market created!* :tada:');
                //TODO support conditional markets
                Promise.all([
                    getCondition(event.returnValues.conditionIds[0]),
                    web3.eth.getTransaction(event.transactionHash),
                    getTokenName(web3, event.returnValues.collateralToken), 
                    getTokenSymbol(web3, event.returnValues.collateralToken), 
                ])
                    .then(([conditions, transaction, tokenName, tokenSymbol]) => {
                        conditions.forEach(condition => {
                            getQuestion(condition.questionId)
                                .then((questions) => {
                                    if (questions.length == 0) {
                                        console.error(`ERROR: Question for hex "${condition.questionId}" not found on contition ID ${event.returnValues.conditionIds[0]}`);
                                    } else {
                                        message.push(questions.map(question => {
                                            return `> *<https://omen.eth.link/#/${condition.fixedProductMarketMakers}|${question.title}>*\n> *Outcomes:*`;
                                        }));
                                        message.push(
                                            (questions.map(question => {
                                                if (condition.outcomeTokenMarginalPrices) {
                                                        return question.outcomes.map((outcome, i) =>
                                                            `> \`${(parseFloat(condition.outcomeTokenMarginalPrices[i]) * 100 )
                                                                .toFixed(2)}%\` - ${outcome}`
                                                        );
                                                } else {
                                                        return question.outcomes.map(outcome => `> - ${outcome}`);
                                                }
                                        })));
                                    }
                                    message.push(`> *Collateral*: <https://${urlExplorer}/token/${event.returnValues.collateralToken}|${tokenName}>`,
                                        `> *Liquidity*: ${parseFloat(condition.scaledLiquidityParameter).toFixed(2)} ${tokenSymbol}`,
                                        `> *Created by*: <https://${urlExplorer}/address/${transaction.from}|${truncate(transaction.from, 14)}>`);
                                        // Send Slack notification
                                    pushSlackArrayMessages(message);
                                    console.log(event.returnValues.conditionIds[0] + ':\n' + message.join('\n') + '\n\n');
                                });
                        });
                    });
            })();
        });
    })
}

/**
 * Get `ConditionResolution` events from a `ConditionalTokens` contract.
 * @param  fromBlock
 * @param  toBlock
 * on the `returnValues` returns the following parameters:
 * bytes32 indexed `conditionId` the condition id of the market.
 * address indexed `oracle` the oracle that calls the function `reportPayouts`.
 * bytes32 indexed `questionId` the question id the oracle is answering for.
 * uint `outcomeSlotCount` the number of the outcomes reported.
 * uint[] `payoutNumerators` the oracle's answer reported.
 */
const getResolvedMarketsEvents = async (fromBlock, toBlock) => {
    console.log(`Watching condition resolution events from ${fromBlock} to ${toBlock} block.`);

    conditionalTokensContract.getPastEvents('ConditionResolution', {
        filter: {},
        fromBlock,
        toBlock,
    }, (error, events) => {
        events.forEach(event => {
            (async () => {
                const questions = await getQuestion(event.returnValues.questionId);
                if (questions.length > 0) {
                    const message = new Array(
                        '*Market resolved*',
                        `*Title:* <https://omen.eth.link/#/${questions[0].indexedFixedProductMarketMakers}|${questions[0].title}>`,
                        `*Answer:*`,
                    );
                    event.returnValues.payoutNumerators.forEach((payout, index) => {
                        if(payout === '1') {
                            message.push(`- ${questions[0].outcomes[index]}`);
                        }
                    });
                    pushSlackArrayMessages(message);
                    console.log(event.returnValues.questionId + ':\n' + message.join('\n') + '\n\n');
                } else {
                    console.error(`ERROR: Question for hex "${event.returnValues.questionId}" not found on Omen subgraph.`);
                }
            })();
        });
    });
}

/**
 * Watch `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
 * @param fromBlock
 */
module.exports.watchCreationMarketsEvent = async (fromBlock) => {
    if (fromBlock === 0) {
        fromBlock = await getLastBlockNumber() - 10;
    }
    const toBlock = await getLastBlockNumber() - 5;
    getFPMMCreationEvent(fromBlock, toBlock);
    return (toBlock + 1);
}

/**
 * Watch `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
 * @param fromBlock
 */
module.exports.watchResolvedMarketsEvent = async (fromBlock) => {
    if (fromBlock === 0) {
        fromBlock = await getLastBlockNumber() - 10;
    }
    const toBlock = await getLastBlockNumber() - 5;
    getResolvedMarketsEvents(fromBlock, toBlock);
    return (toBlock + 1);
}

/**
 * Look for Question records where `openingTimestamp` field is between `timestamp`
 * and `timestamp-pastTimeInSeconds`.
 * @param timestamp timestamp in seconds to look for Question records.
 * @param pastTimeInSeconds number of seconds to filter the ready Market question.
 */
module.exports.findMarketReadyByQuestionOpeningTimestamp = async (timestamp, pastTimeInSeconds) => {
    console.log(`Looking for markets ready to be resolved between ${timestamp-pastTimeInSeconds} and ${timestamp}`);
    const questions = await getQuestionByOpeningTimestamp(timestamp, pastTimeInSeconds, 20);
    questions.forEach(question => {
        const message = new Array(
            '*Market ready for resolution*',
            `*Title:* <https://omen.eth.link/#/${question.indexedFixedProductMarketMakers}|${question.title}>`,
        );
        pushSlackArrayMessages(message);
        console.log(question.id + ':\n' + message.join('\n') + '\n\n');
    });
}