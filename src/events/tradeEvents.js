const { truncate } = require('../utils/utils');
const { getTokenName, getTokenDecimals } = require('../services/contractERC20');
const { getTrade, getOldTrade } = require('../services/getTrade');

module.exports.tradeEvents = async (web3, webhook, urlExplorer, timestamp, seconds) => {
    getTrade(timestamp, seconds, 20).then(trades => {
        trades.forEach(trade => {
            const message = new Array();
            const type = (trade.type === 'Buy') ? 'purchased' : 'sold';
            const odds = parseFloat(trade.outcomeTokenMarginalPrices[trade.outcomeIndex] * 100 ).toFixed(2);
            getTokenName(web3, trade.collateralToken).then(tokenName => {
                getTokenDecimals(web3, trade.collateralToken).then(decimals => {
                    const amount = parseFloat(trade.collateralAmount / 10**decimals).toFixed(2);
                    // TODO calculate the amount in USD or add it to the subgraph
                    if (amount > 1000) {
                        message.push('<!here>');
                    }
                    // TODO add oldTrade to the subgraph
                    getOldTrade(trade.id).then(oldTrade => {
                        const oldOdds = oldTrade ? parseFloat(oldTrade.outcomeTokenMarginalPrices[trade.outcomeIndex] * 100 ).toFixed(2) : '0.00';
                        const outcome = trade.outcomes ? trade.outcomes[trade.outcomeIndex] : trade.outcomeIndex;
                        message.push(`> ${amount} <https://${urlExplorer}/token/${trade.collateralToken}|${tokenName}> of *${outcome}* ${type} in "<https://omen.eth.link/#/${trade.fpmm}|${trade.title}>".`,
                            `> Outcome odds: ${oldOdds}% --> ${odds}%`,
                            `> *Created by*: <https://omen.eth.link/#/${trade.creator}|${truncate(trade.creator, 14)}>`,
                        );
                        // Send the notification
                        webhook && webhook.send({
                            blocks: [{
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: message.join('\n')
                                    }
                                },
                            ]
                        });
                        console.log(message.join('\n') + '\n');
                    });
                });
            });
        });
    });
}