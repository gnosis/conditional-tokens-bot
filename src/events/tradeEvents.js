const { urlExplorer } = require('../config/constants');
const { truncate } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { web3 } = require('../utils/web3');
const { getTokenName, getTokenDecimals } = require('../services/contractERC20');
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
    const trades = await getTrade(timestamp, pastTimeInSeconds, 20)
    trades.forEach(async trade => {
        const message = new Array();
        const type = (trade.type === 'Buy') ? 'purchased' : 'sold';
        const odds = parseFloat(trade.outcomeTokenMarginalPrices[trade.outcomeIndex] * 100 ).toFixed(2);
        const tokenName = await getTokenName(web3, trade.collateralToken);
        const decimals = await getTokenDecimals(web3, trade.collateralToken);
        const oldTrade = await getOldTrade(trade.fpmm, trade.id, trade.creationTimestamp);
        const amount = parseFloat(trade.collateralAmount / 10**decimals).toFixed(2);
        if (trade.collateralAmountUSD > 1000.00) {
            message.push('<!here>');
        }
        const oldOdds = oldTrade ? parseFloat(oldTrade.outcomeTokenMarginalPrices[trade.outcomeIndex] * 100 ).toFixed(2) : '0.00';
        const outcome = trade.outcomes ? trade.outcomes[trade.outcomeIndex] : trade.outcomeIndex;
        message.push(`> ${amount} <https://${urlExplorer}/token/${trade.collateralToken}|${tokenName}> of *${outcome}* ${type} in "<https://omen.eth.link/#/${trade.fpmm}|${trade.title}>".`,
            `> Outcome odds: ${oldOdds}% --> ${odds}%`,
            `> *Created by*: <https://omen.eth.link/#/${trade.creator}|${truncate(trade.creator, 14)}>`,
        );
        // Send Slack notification
        pushSlackArrayMessages(message);
        console.log(message.join('\n') + '\n');
    });
}