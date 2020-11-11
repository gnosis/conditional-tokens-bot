const { truncate, escapeHTML } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { getTokenName, getTokenSymbol, getTokenDecimals } = require('../services/contractERC20');
const { getLiquidity } = require('../services/getLiquidity');
const { getUrlExplorer, web3 } = require('../utils/web3');

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
    const urlExplorer = await getUrlExplorer();

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
                        message.push(`> ${amount} <${urlExplorer}/token/${liquidity.collateralToken}|${tokenName}> of liquidity ${type} in "*<https://omen.eth.link/#/${liquidity.fpmm}|${escapeHTML(liquidity.title)}>*", total liquidity is now *${liquidity.scaledLiquidityParameter} ${tokenSymbol}*.`,
                            `> *Created by*: <https://omen.eth.link/#/${liquidity.funder}|${truncate(liquidity.funder, 14)}>`,
                            `> *Transaction*: <${urlExplorer}/tx/${liquidity.transactionHash}|${truncate(liquidity.transactionHash, 14)}>`,
                        );
                        // Send Slack notification
                        pushSlackArrayMessages(message);
                        console.log(liquidity.creationTimestamp);
                        console.log(message.join('\n') + '\n');
                    });
            });
        });
}