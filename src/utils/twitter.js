const Twit = require('twit');

const { 
  twitterConsumerKey,
  twitterConsumerSecret,
  twitterAccessToken,
  twitterAccessTokenSecret 
} = require('../config');

let twit;
if (twitterConsumerKey === undefined || 
  twitterConsumerSecret === undefined ||
  twitterAccessToken === undefined ||
  twitterAccessTokenSecret === undefined
) {
  console.log('Twitter API keys are not defined!!');
} else {
  twit = new Twit({
    consumer_key:         twitterConsumerKey,
    consumer_secret:      twitterConsumerSecret,
    access_token:         twitterAccessToken,
    access_token_secret:  twitterAccessTokenSecret,
    timeout_ms:           60000, // optional HTTP request timeout to apply to all requests.
    strictSSL:            true,
  });
}

/**
 * Push a tweet from a given `message` text.
 * @param message the Twitter message text.
*/
module.exports.pushTweetMessages = (message) => {
  if ( message.length > 280 ) {
    console.error('Error:', 'Twitter is longer than 280 chars');
    return;
  }
  twit && twit.post('statuses/update',
    { status: message }, 
    (err, data, response) => {
      if (err !== undefined) {
        console.error('Error:', err);
      } else {
        console.log(`${data.created_at} Tweet sent  ${data.id} with text ${data.text}.`);
      }
  });
}