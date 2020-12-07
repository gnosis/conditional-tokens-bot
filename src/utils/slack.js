const { IncomingWebhook } = require('@slack/webhook');

const { slackUrl } = require('../config');

// Initialize webhook for Slack
const webhook = slackUrl ? new IncomingWebhook(slackUrl) : undefined;
if (webhook === undefined) {
    console.log('SLACK_WEBHOOK_URL not defined!!');
}

/**
 * Push a message from a given `arrayMessage` Array string list 
 * with some elements in the array.
 * @param  {} message and array with the message text
 * to separate elements by `\n` on the Slack pushed message.
*/
module.exports.pushSlackArrayMessages = (arrayMessage) => {
    webhook && (arrayMessage.length>0) && webhook.send({
        blocks: [{
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: arrayMessage.join('\n')
                }
            }
        ]
    });
}

/**
 * Push a message from a given `message` string.
 * @param  {} message and array with the message text
 * to separate elements by `\n` on the Slack pushed message.
*/
module.exports.pushSlackMessage = (message) => {
    webhook && webhook.send({
        blocks: [{
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: message
                }
            }
        ]
    });
}