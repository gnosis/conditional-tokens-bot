const { urlExplorer, web3 } = require('../config/constants');
const { truncate } = require('../utils/utils');
const { pushSlackMessage } = require('../utils/slack');
const { getTokenName, getTokenDecimals } = require('../services/contractERC20');
const { getTrade, getOldTrade } = require('../services/getTrade');

module.exports.findTradeEvents = async (timestamp, pastTimeInSeconds) => {
    console.log(`Looking for new trades at ${timestamp}`);
    getTrade(timestamp, pastTimeInSeconds, 20)
        .then(trades => {
            trades.forEach(trade => {
                const message = new Array();
                const type = (trade.type === 'Buy') ? 'purchased' : 'sold';
                const odds = parseFloat(trade.outcomeTokenMarginalPrices[trade.outcomeIndex] * 100 ).toFixed(2);
                Promise.all([
                    getTokenName(web3, trade.collateralToken),
                    getTokenDecimals(web3, trade.collateralToken),
                    getOldTrade(trade.id),
                ])
                    .then(([tokenName, decimals, oldTrade]) => {
                        // TODO calculate the amount in USD or add it to the subgraph
                        const amount = parseFloat(trade.collateralAmount / 10**decimals).toFixed(2);
                        if (amount > 1000) {
                            message.push('<!here>');
                        }
                        const oldOdds = oldTrade ? parseFloat(oldTrade.outcomeTokenMarginalPrices[trade.outcomeIndex] * 100 ).toFixed(2) : '0.00';
                        const outcome = trade.outcomes ? trade.outcomes[trade.outcomeIndex] : trade.outcomeIndex;
                        message.push(`> ${amount} <https://${urlExplorer}/token/${trade.collateralToken}|${tokenName}> of *${outcome}* ${type} in "<https://omen.eth.link/#/${trade.fpmm}|${trade.title}>".`,
                            `> Outcome odds: ${oldOdds}% --> ${odds}%`,
                            `> *Created by*: <https://omen.eth.link/#/${trade.creator}|${truncate(trade.creator, 14)}>`,
                        );
                        // Send Slack notification
                        pushSlackMessage(message);
                        console.log(message.join('\n') + '\n');
                    });
            });
        });
}