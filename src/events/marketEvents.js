const { truncate, escapeHTML } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { getChainId, getUrlExplorer, web3 } = require('../utils/web3');
const { getFixedProductionMarketMakerFactoryContract, getconditionalTokensContract } = require('../services/contractEvents');
const { getTokenName, getTokenSymbol } = require('../services/contractERC20');
const { getQuestion, getQuestionByOpeningTimestamp } = require('../services/getQuestion');
const { getConditionAndQuestions } = require('../services/getCondition');

const fixedProductMarketMakerFactoryContract = getFixedProductionMarketMakerFactoryContract(web3);
const conditionalTokensContract = getconditionalTokensContract(web3);

/**
 * Watch `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
 * @param  fromBlock
 * @param  toBlock
 * on the `returnValues` values like an array with the `conditionIds`,
 * and the `collateralToken`.
 * 
 */
module.exports.watchCreationMarketsEvent = async (fromBlock, toBlock) => {
    console.log(`Watching market creation events from ${fromBlock} to ${toBlock} block.`);
    const urlExplorer = await getUrlExplorer();

    fixedProductMarketMakerFactoryContract.getPastEvents('FixedProductMarketMakerCreation', {
        filter: {},
        fromBlock,
        toBlock,
    }, (error, events) => {
        if (error) {
            console.error(error);
        } else {        
            for(const event of events) {
                (async () => {
                    const message = new Array('<!here>', '*New market created!* :tada:');
                    //TODO support conditional markets
                    const conditions = await getConditionAndQuestions(event.returnValues.conditionIds[0]);
                    const transaction = await web3.eth.getTransaction(event.transactionHash);
                    const tokenName = await getTokenName(web3, event.returnValues.collateralToken);
                    const tokenSymbol = await getTokenSymbol(web3, event.returnValues.collateralToken);
                    for(const condition of conditions) {
                        if (!condition.question) {
                            console.error(`ERROR: Question for hex "${condition.questionId}" not found on contition ID ${event.returnValues.conditionIds[0]}`);
                        } else {
                            message.push(`> *<https://omen.eth.link/#/${condition.fixedProductMarketMakers}|${escapeHTML(condition.question.title)}>*\n> *Outcomes:*`);
                            if (condition.outcomeTokenMarginalPrices) {
                                condition.question.outcomes.map((outcome, i) =>
                                    message.push(
                                        `> \`${(parseFloat(condition.outcomeTokenMarginalPrices[i]) * 100)
                                        .toFixed(2)}%\` - ${outcome}`
                                    )
                                );
                            } else {
                                message.push(condition.question.outcomes.map(outcome => message.push(`> - ${outcome}`)));
                            }
                        }
                        message.push(`> *Collateral*: <${urlExplorer}/token/${event.returnValues.collateralToken}|${tokenName}>`,
                            `> *Liquidity*: ${parseFloat(condition.scaledLiquidityParameter).toFixed(2)} ${tokenSymbol}`,
                            `> *Created by*: <${urlExplorer}/address/${transaction.from}|${truncate(transaction.from, 14)}>`,
                            `> *Transaction*: <${urlExplorer}/tx/${transaction.hash}|${truncate(transaction.hash, 14)}>`);
                            // Send Slack notification
                        pushSlackArrayMessages(message);
                        console.log(event.returnValues.conditionIds[0] + ':\n' + message.join('\n') + '\n\n');
                    }
                })();
            };
        }
    });
}

/**
 * Watch `ConditionResolution` events from a `ConditionalTokens` contract.
 * @param  fromBlock
 * @param  toBlock
 * on the `returnValues` returns the following parameters:
 * bytes32 indexed `conditionId` the condition id of the market.
 * address indexed `oracle` the oracle that calls the function `reportPayouts`.
 * bytes32 indexed `questionId` the question id the oracle is answering for.
 * uint `outcomeSlotCount` the number of the outcomes reported.
 * uint[] `payoutNumerators` the oracle's answer reported.
 */
module.exports.watchResolvedMarketsEvent = async (fromBlock, toBlock) => {
    console.log(`Watching condition resolution events from ${fromBlock} to ${toBlock} block.`);

    conditionalTokensContract.getPastEvents('ConditionResolution', {
        filter: {},
        fromBlock,
        toBlock,
    }, (error, events) => {
        if (error) {
            console.error(error);
        } else {
            for(const event of events) {
                (async () => {
                    const questions = await getQuestion(event.returnValues.questionId);
                    if (questions.length > 0) {
                        const message = new Array(
                            '> *Market resolved*',
                            `> *Title:* <https://omen.eth.link/#/${questions[0].indexedFixedProductMarketMakers}|${escapeHTML(questions[0].title)}>`,
                            `> *Answer:*`,
                        );
                        event.returnValues.payoutNumerators.forEach((payout, index) => {
                            if(payout === '1') {
                                message.push(`> - ${questions[0].outcomes[index]}`);
                            }
                        });
                        pushSlackArrayMessages(message);
                        console.log(event.returnValues.questionId + ':\n' + message.join('\n') + '\n\n');
                    } else {
                        console.error(`ERROR: Question for hex "${event.returnValues.questionId}" not found on Omen subgraph.`);
                    }
                })();
            }
        }
    });
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
    const chainId = await getChainId();

    questions.forEach(question => {
        const message = new Array();
        if (chainId === 1) {
            message.push('<!channel>');
        }
        message.push('> *Market ready for resolution*',
            `> *Title:* <https://omen.eth.link/#/${question.indexedFixedProductMarketMakers}|${escapeHTML(question.title)}>`,
        );
        pushSlackArrayMessages(message);
        console.log(question.id + ':\n' + message.join('\n') + '\n\n');
    });
}