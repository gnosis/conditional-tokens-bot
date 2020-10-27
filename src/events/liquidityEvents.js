const { urlExplorer } = require('../config/constants');
const { truncate } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { getTokenName, getTokenSymbol, getTokenDecimals } = require('../services/contractERC20');
const { getLiquidity } = require('../services/getLiquidity');
const { web3 } = require('../utils/web3');

/**
 * Look for last FPMM liquidity records ordered by `creationTimestamp`.
 * @param  {} timestamp timestamp in seconds to look for FPMM liquidity records 
 * where `creationTimestamp` field is less or equal than `timestamp`.
 * @param  {} pastTimeInSeconds number of seconds to filter the last FPMM 
 * liquidity records where `creationTimestamp` field is greather than 
 * `timestamp` minus `pastTimeInSeconds`.
 */
module.exports.findLiquidityEvents = async (timestamp, pastTimeInSeconds) => {
    console.log(`Looking for new liquidity at ${timestamp}`);
    getLiquidity(timestamp, pastTimeInSeconds, 20)
        .then(liquidities => {
            liquidities.forEach(liquidity => {
                const message = new Array();
                Promise.all([
                    getTokenName(web3, liquidity.collateralToken),
                    getTokenSymbol(web3, liquidity.collateralToken),
                    getTokenDecimals(web3, liquidity.collateralToken),
                ])
                    .then(([tokenName, tokenSymbol, decimals]) => {
                        const type = (liquidity.type === 'Add') ? 'added' : 'removed';
                        const amount = parseFloat(liquidity.collateralTokenAmount / 10**decimals).toFixed(2);
                        message.push(`> ${amount} <https://${urlExplorer}/token/${liquidity.collateralToken}|${tokenName}> of liquidity ${type} in "*<https://omen.eth.link/#/${liquidity.fpmm}|${liquidity.title}>*", total liquidity is now *${liquidity.scaledLiquidityParameter} ${tokenSymbol}*.`,
                            `> *Created by*: <https://omen.eth.link/#/${liquidity.funder}|${truncate(liquidity.funder, 14)}>`,
                        );
                        // Send Slack notification
                        pushSlackArrayMessages(message);
                        console.log(message.join('\n') + '\n');
                    });
            });
        });
}