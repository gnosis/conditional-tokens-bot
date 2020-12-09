const { truncate, truncateEnd, escapeHTML } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { pushTweetMessages } = require('../utils/twitter');
const { getChainId, getUrlExplorer, web3 } = require('../utils/web3');
const { getFixedProductionMarketMakerFactoryContract, getconditionalTokensContract } = require('../services/contractEvents');
const { getTokenName, getTokenSymbol } = require('../services/contractERC20');
const { getQuestion, getQuestionByOpeningTimestamp } = require('../services/getQuestion');
const { getConditionAndQuestions } = require('../services/getCondition');

const fixedProductMarketMakerFactoryContract = getFixedProductionMarketMakerFactoryContract(web3);
const conditionalTokensContract = getconditionalTokensContract(web3);

/**
 * Watch `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
 * @param fromBlock
 * @param toBlock
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
            console.error('Error:', error);
        } else {        
            for(const event of events) {
                (async () => {
                    const slackMessage = new Array('<!here>', '*New market created!* :tada:');
                    //TODO support conditional markets
                    const conditions = await getConditionAndQuestions(event.returnValues.conditionIds[0]);
                    const transaction = await web3.eth.getTransaction(event.transactionHash);
                    const tokenName = await getTokenName(web3, event.returnValues.collateralToken);
                    const tokenSymbol = await getTokenSymbol(web3, event.returnValues.collateralToken);
                    for(const condition of conditions) {
                        if (!condition.question) {
                            console.error('Error:', `Question for hex "${condition.questionId}" not found on contition ID ${event.returnValues.conditionIds[0]}`);
                        } else {
                            const tweetMessage = `New market created!\n` + 
                                `"${truncateEnd(escapeHTML(condition.question.title), 100)}"\n` +
                                `https://omen.eth.link/#/${condition.fixedProductMarketMakers}`;
                            slackMessage.push(`> *<https://omen.eth.link/#/${condition.fixedProductMarketMakers}|${escapeHTML(condition.question.title)}>*\n> *Outcomes:*`);
                            if (condition.outcomeTokenMarginalPrices) {
                                condition.question.outcomes.map((outcome, i) =>
                                    slackMessage.push(
                                        `> \`${(parseFloat(condition.outcomeTokenMarginalPrices[i]) * 100)
                                        .toFixed(2)}%\` - ${outcome}`
                                    )
                                );
                            } else {
                                slackMessage.push(condition.question.outcomes.map(outcome => slackMessage.push(`> - ${outcome}`)));
                            }
                            slackMessage.push(
                                `> *Collateral*: <${urlExplorer}/token/${event.returnValues.collateralToken}|${tokenName}>`,
                                `> *Liquidity*: ${parseFloat(condition.scaledLiquidityParameter).toFixed(2)} ${tokenSymbol}`,
                                `> *Created by*: <${urlExplorer}/address/${transaction.from}|${truncate(transaction.from, 14)}>`,
                                `> *Transaction*: <${urlExplorer}/tx/${transaction.hash}|${truncate(transaction.hash, 14)}>`
                            );
                            // Send Slack notification
                            await pushSlackArrayMessages(slackMessage);
                            // Send Twitter notification
                            await pushTweetMessages(tweetMessage);
                            console.log(event.returnValues.conditionIds[0] + ':\n' + tweetMessage + '\n');
                        }
                    }
                })();
            };
        }
    });
}

/**
 * Watch `ConditionResolution` events from a `ConditionalTokens` contract.
 * @param fromBlock
 * @param toBlock
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
            console.error('Error:', error);
        } else {
            for(const event of events) {
                (async () => {
                    const questions = await getQuestion(event.returnValues.questionId);
                    if (questions.length > 0) {
                        const tweetMessage = `Market resolved "${truncateEnd(escapeHTML(questions[0].title), 100)}"\n` + 
                            `https://omen.eth.link/#/${questions[0].indexedFixedProductMarketMakers}`;
                        const slackMessage = new Array(
                            '> *Market resolved*',
                            `> *Title:* <https://omen.eth.link/#/${questions[0].indexedFixedProductMarketMakers}|${escapeHTML(questions[0].title)}>`,
                            `> *Answer:*`,
                        );
                        event.returnValues.payoutNumerators.forEach((payout, index) => {
                            if(payout === '1') {
                                slackMessage.push(`> - ${questions[0].outcomes[index]}`);
                            }
                        });
                        // Send Slack notification
                        await pushSlackArrayMessages(slackMessage);
                        // Send Twitter notification
                        await pushTweetMessages(tweetMessage);
                        console.log(event.returnValues.questionId + ':\n' + tweetMessage + '\n');                        
                    } else {
                        console.error('Error:', `Question for hex "${event.returnValues.questionId}" not found on Omen subgraph.`);
                    }
                })();
            }
        }
    });
}

/**
 * Look for Question records where `openingTimestamp`
 * field is between `timestamp` and `timestamp-pastTimeInSeconds`.
 * @param timestamp timestamp in seconds to look for Question records.
 * @param pastTimeInSeconds number of seconds to filter the ready Market question.
 */
module.exports.findMarketReadyByQuestionOpeningTimestamp = async (timestamp, pastTimeInSeconds) => {
    console.log(`Looking for markets ready to be resolved between ${timestamp-pastTimeInSeconds} and ${timestamp}`);
    const questions = await getQuestionByOpeningTimestamp(timestamp, pastTimeInSeconds, 20);
    const chainId = await getChainId();
    for(const question of questions) {
        const slackMessage = new Array();
        if (chainId === 1) {
            slackMessage.push('<!channel>');
        }
        const tweetMessage = `Market ready for resolution "${truncateEnd(escapeHTML(question.title), 100)}"\n` + 
            `https://omen.eth.link/#/${question.indexedFixedProductMarketMakers}`;
        slackMessage.push('> *Market ready for resolution*',
            `> *Title:* <https://omen.eth.link/#/${question.indexedFixedProductMarketMakers}|${escapeHTML(question.title)}>`,
        );
        // Send Slack notification
        await pushSlackArrayMessages(slackMessage);
        // Send Twitter notification
        await pushTweetMessages(tweetMessage);
        console.log(question.id + ':\n' + tweetMessage + '\n');
    }
}