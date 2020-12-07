const { truncate, truncateEnd, escapeHTML } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { pushTweetMessages } = require('../utils/twitter');
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

    const liquidities = await getLiquidity(timestamp, pastTimeInSeconds, 20);
    for (const liquidity of liquidities) {        
        const tokenName = await getTokenName(web3, liquidity.collateralToken);
        const tokenSymbol = await getTokenSymbol(web3, liquidity.collateralToken);
        const decimals = await getTokenDecimals(web3, liquidity.collateralToken);
        const type = (liquidity.type === 'Add') ? 'added' : 'removed';
        const amount = parseFloat(liquidity.collateralTokenAmount / 10**decimals);
        const amountToShow = amount > 0.01 ? amount.toFixed(2) : amount.toFixed(decimals/2);
        const liquidityScaledToShow = parseFloat(liquidity.scaledLiquidityParameter).toFixed(2);
        const tweetMessage = `${amountToShow} ${tokenSymbol} of liquidity ${type} ` +
            `in "${truncateEnd(escapeHTML(liquidity.title), 100)}", ` + 
            `total liquidity is now ${liquidityScaledToShow} ${tokenSymbol}.\n` +
            `https://omen.eth.link/#/${liquidity.fpmm}`;
        const slackMessage = new Array(`> ${amountToShow} <${urlExplorer}/token/${liquidity.collateralToken}|${tokenName}> of liquidity ${type} in "*<https://omen.eth.link/#/${liquidity.fpmm}|${escapeHTML(liquidity.title)}>*", total liquidity is now *${liquidityScaledToShow} ${tokenSymbol}*.`,
            `> *Created by*: <${urlExplorer}/address/${liquidity.funder}|${truncate(liquidity.funder, 14)}>`,
            `> *Transaction*: <${urlExplorer}/tx/${liquidity.transactionHash}|${truncate(liquidity.transactionHash, 14)}>`,
        );
        // Send Slack notification
        await pushSlackArrayMessages(slackMessage);
        // Send Twitter notification
        await pushTweetMessages(tweetMessage);
        console.log(liquidity.creationTimestamp);
        console.log(tweetMessage + '\n');
    }
}