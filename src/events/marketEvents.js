const { urlExplorer } = require('../config/constants');
const { truncate } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { web3, getLastBlockNumber } = require('../utils/web3');
const { getFixedProductionMarketMakerFactoryContract } = require('../services/contractEvents');
const { getTokenName, getTokenSymbol } = require('../services/contractERC20');
const { getQuestion } = require('../services/getQuestion');
const { getCondition } = require('../services/getCondition');

const fixedProductMarketMakerFactoryContract = getFixedProductionMarketMakerFactoryContract(web3);

/**
 * Watch `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
 * @param  fromBlock
 * @param  toBlock
 * on the `returnValues` values like an array with the `conditionIds`,
 * and the `collateralToken`.
 * 
 */
const watchFPMMCreationEvent = async (fromBlock, toBlock) => {
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
                                        message.push(questions.map(question => 
                                            `> *<https://omen.eth.link/#/${condition.fixedProductMarketMakers}|${question.title}>*\n> *Outcomes:*`
                                        ));
                                        questions.forEach(question => {
                                            if (condition.outcomeTokenMarginalPrices) {
                                                message.push(
                                                    question.outcomes.map((outcome, i) => 
                                                        `> \`${(parseFloat(condition.outcomeTokenMarginalPrices[i]) * 100 )
                                                            .toFixed(2)}%\` - ${outcome}`
                                                    ));
                                            } else {
                                                message.push(
                                                    question.outcomes.map(outcome => `> - ${outcome}`));
                                            }
                                        });
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
 * Watch `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
 */
module.exports.watchNewMarketsEvent = async (fromBlock) => {
    if (fromBlock === 0) {
        fromBlock = await getLastBlockNumber() - 10;
    }
    const toBlock = process.env.START_BLOCK ? 'latest' : await getLastBlockNumber() - 5;
    watchFPMMCreationEvent(fromBlock, toBlock);
    return (toBlock + 1);
}