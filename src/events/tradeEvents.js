const { truncate, truncateEnd, escapeHTML } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { pushTweetMessages } = require('../utils/twitter');
const { getUrlExplorer, web3 } = require('../utils/web3');
const { getTokenName, getTokenSymbol, getTokenDecimals } = require('../services/contractERC20');
const { getTrade, getOldTrade } = require('../services/getTrade');

/**
 * Look for last FPMM trade records ordered by `creationTimestamp`.
 * @param  {} timestamp timestamp in seconds to look for FPMM trade records 
 * where `creationTimestamp` field is less or equal than `timestamp`.
 * @param  {} pastTimeInSeconds number of seconds to filter the last FPMM 
 * trade records where `creationTimestamp` field is greather than 
 * `timestamp` minus `pastTimeInSeconds`.
 */
module.exports.findTradeEvents = async (timestamp, pastTimeInSeconds) => {
    console.log(`Looking for new trades at ${timestamp}`);
    const trades = await getTrade(timestamp, pastTimeInSeconds, 20);
    const urlExplorer = await getUrlExplorer();

    for (const trade of trades) {
        const slackMessage = new Array();
        const type = (trade.type === 'Buy') ? 'purchased' : 'sold';
        const odds = parseFloat(trade.outcomeTokenMarginalPrice * 100).toFixed(2);
        const oldOdds = parseFloat(trade.oldOutcomeTokenMarginalPrice * 100).toFixed(2);
        const tokenName = await getTokenName(web3, trade.collateralToken);
        const tokenSymbol = await getTokenSymbol(web3, trade.collateralToken);
        const decimals = await getTokenDecimals(web3, trade.collateralToken);
        const amount = parseFloat(trade.collateralAmount / 10**decimals).toFixed(2);
        if (trade.collateralAmountUSD > 1000.00) {
            slackMessage.push('<!here>');
        }
        const outcome = trade.outcomes ? trade.outcomes[trade.outcomeIndex] : trade.outcomeIndex;
        const tweetMessage = `${amount} ${tokenSymbol} of *${outcome}* ${type} ` +
            `in "${truncateEnd(escapeHTML(trade.title), 100)}".\n` +
            `Outcome odds: ${oldOdds}% --> ${odds}%\n` +
            `https://omen.eth.link/#/${trade.fpmm}`;
        slackMessage.push(`> ${amount} <${urlExplorer}/token/${trade.collateralToken}|${tokenName}> of *${outcome}* ${type} in "<https://omen.eth.link/#/${trade.fpmm}|${escapeHTML(trade.title)}>".`,
            `> Outcome odds: ${oldOdds}% --> ${odds}%`,
            `> *Created by*: <${urlExplorer}/address/${trade.creator}|${truncate(trade.creator, 14)}>`,
            `> *Transaction*: <${urlExplorer}/tx/${trade.transactionHash}|${truncate(trade.transactionHash, 14)}>`,
        );
        // Send Slack notification
        await pushSlackArrayMessages(slackMessage);
        // Send Twitter notification
        await pushTweetMessages(tweetMessage);
        console.log(trade.creationTimestamp);
        console.log(tweetMessage + '\n');
    }
}