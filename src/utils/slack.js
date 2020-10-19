const { IncomingWebhook } = require('@slack/webhook');

const { slackUrl } = require('../config/constants');

// Initialize webhook for Slack
const webhook = slackUrl ? new IncomingWebhook(slackUrl) : undefined;
if (webhook === undefined) {
    console.log('SLACK_WEBHOOK_URL not defined!!');
}

/**
 * Push a message from a given `message` string list.
 * @param  {} message and array with the message text
 * to separate elements by `\n` on the Slack pushed message.
*/
module.exports.pushSlackMessage = (message) => {
    webhook && webhook.send({
        blocks: [{
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: message.join('\n')
                }
            }
        ]
    });
}