const { truncateEnd, escapeHTML } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
const { pushTweetMessages } = require('../utils/twitter');
const { web3 } = require('../utils/web3');
const { getRealitioContract } = require('../services/contractEvents');
const { getQuestion } = require('../services/getQuestion');

const realitioContract = getRealitioContract(web3);

/**
 * Watch `LogNotifyOfArbitrationRequest` events from a `Realitio` contract.
 * @param  fromBlock
 * @param  toBlock
 * on the `returnValues` values like the `question_id`,
 * and the `requester` resolver address.
 * 
 */
module.exports.watchLogNotifyOfArbitrationRequestArbitration = async (fromBlock, toBlock) => {
    console.log(`Watching realitio LogNotifyOfArbitrationRequest events from ${fromBlock} to ${toBlock} block.`);

    realitioContract.getPastEvents('LogNotifyOfArbitrationRequest', {
        filter: {},
        fromBlock,
        toBlock,
    }, (error, events) => {
        if (error) {
            console.error(error);
        } else {
            for(const event of events) {
                (async () => {
                    const questions = await getQuestion(event.returnValues.question_id);
                    for(const question of questions) {
                        const tweetMessage = `Market is in arbitration "${truncateEnd(escapeHTML(question.title), 100)}"\n` +
                            `https://omen.eth.link/#/${question.indexedFixedProductMarketMakers}`;
                        const slackMessage = new Array(
                            '> *Market is in arbitration*',
                            `> *Title:* <https://omen.eth.link/#/${question.indexedFixedProductMarketMakers}|${escapeHTML(question.title)}>`,
                        );
                        // Send Slack slackMessage
                        await pushSlackArrayMessages(slackMessage);
                        // Send Twitter notification
                        await pushTweetMessages(tweetMessage);
                        console.log(question.id + ':\n' + tweetMessage + '\n');
                    }
                })();
            }
        }
    });
}