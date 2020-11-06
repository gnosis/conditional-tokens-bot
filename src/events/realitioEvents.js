const { blockReorgLimit } = require('../config');
const { pushSlackArrayMessages } = require('../utils/slack');
const { web3, getLastBlockNumber } = require('../utils/web3');
const { getRealitioContract } = require('../services/contractEvents');
const { getQuestion } = require('../services/getQuestion');

const realitioContract = getRealitioContract(web3);

/**
 * Get `LogNotifyOfArbitrationRequest` events from a `Realitio` contract.
 * @param  fromBlock
 * @param  toBlock
 * on the `returnValues` values like the `question_id`,
 * and the `requester` resolver address.
 * 
 */
const getRealitioLogNotifyOfArbitrationRequestEvent = async (fromBlock, toBlock) => {
    console.log(`Watching realitio LogNotifyOfArbitrationRequest events from ${fromBlock} to ${toBlock} block.`);

    realitioContract.getPastEvents('LogNotifyOfArbitrationRequest', {
        filter: {},
        fromBlock,
        toBlock,
    }, (error, events) => {
        events.forEach(event => {
            (async () => {
                const questions = await getQuestion(event.returnValues.question_id);
                questions.forEach(question => {
                    const message = new Array(
                        '> *Market is in arbitration*',
                        `> *Title:* <https://omen.eth.link/#/${question.indexedFixedProductMarketMakers}|${question.title}>`,
                    );
                    pushSlackArrayMessages(message);
                    console.log(question.id + ':\n' + message.join('\n') + '\n\n');
                });
            })();
        });
    })
}

/**
 * Find a notify of arbitration from Realitio events
 * @param fromBlock 
 */
module.exports.findLogNotifyOfArbitrationRequestArbitration = async (fromBlock) => {
    const lastBlock = await getLastBlockNumber();
    if (fromBlock === 0) {
        fromBlock = lastBlock - (blockReorgLimit * 2);
    }
    const toBlock = lastBlock - blockReorgLimit;
    getRealitioLogNotifyOfArbitrationRequestEvent(fromBlock, toBlock);
    return (toBlock + 1);
}