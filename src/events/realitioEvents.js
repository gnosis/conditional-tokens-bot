const { escapeHTML } = require('../utils/utils');
const { pushSlackArrayMessages } = require('../utils/slack');
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
                    questions.forEach(question => {
                        const message = new Array(
                            '> *Market is in arbitration*',
                            `> *Title:* <https://omen.eth.link/#/${question.indexedFixedProductMarketMakers}|${escapeHTML(question.title)}>`,
                        );
                        pushSlackArrayMessages(message);
                        console.log(question.id + ':\n' + message.join('\n') + '\n\n');
                    });
                })();
            };
        }
    });
}