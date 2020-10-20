const { urlExplorer, web3 } = require('../config/constants');
const { truncate } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { getFixedProductionMarketMakerFactoryContract } = require('../services/contractEvents');
const { getTokenName, getTokenSymbol } = require('../services/contractERC20');
const { getQuestion } = require('../services/getQuestion');
const { getCondition } = require('../services/getCondition');

/**
 * Watch `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
 */
module.exports.watchNewMarketsEvent = async () => {
    const fixedProductMarketMakerFactoryContract = getFixedProductionMarketMakerFactoryContract(web3);
    
    /**
     * Watch `FixedProductMarketMakerCreation` events from a `FixedProductionMarketMakerFactory` contract.
     * @param  filter filtering options to watch.
     * @param  {process.env.START_BLOCK} fromBlock start to watch events from 
     * the given block or from `latest` block.
     * @param  {} error call to watch event errors.
     * @param  {} event the event which contains market creation data
     * on the `returnValues` values like an array with the `conditionIds`,
     * and the `collateralToken`.
     * 
     */
    fixedProductMarketMakerFactoryContract.events.FixedProductMarketMakerCreation({
        filter: {},
        fromBlock: process.env.START_BLOCK ? process.env.START_BLOCK : 'latest',
    }, (error, event) => {
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
}