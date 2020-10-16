const { IncomingWebhook } = require('@slack/webhook');

const { slackUrl } = require('../config/constants');

// Initialize webhook for Slack
const webhook = slackUrl ? new IncomingWebhook(slackUrl) : undefined;
if (webhook === undefined) {
    console.log('SLACK_WEBHOOK_URL not defined!!');
}

// Send slack message
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