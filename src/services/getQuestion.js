const fetch = require('node-fetch');

/**
 * Find questions where question id is a given `questionId`.
 * @param  {} questionId the question Id.
 * @returns a Question records list.
 */
module.exports.getQuestion = (questionId) => {
  const jsonQuery = { query: `{  questions(  where: {    id: \"${questionId}\"  }  ) { id outcomes title indexedFixedProductMarketMakers { id }}}` }

  return fetch(process.env.THE_GRAPH_OMEN, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonQuery),
    method: "POST",
  })
    .then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(json => {
      if(json.errors) {
        throw new Error(json.errors.map(error => error.message));
      }
      return json.data.questions && json.data.questions.map(question =>
        ({
          title: question.title,
          outcomes: question.outcomes,
          indexedFixedProductMarketMakers: (question.indexedFixedProductMarketMakers.length > 0) ? question.indexedFixedProductMarketMakers[0].id : null,
        })
      );
    });
}

/**
 * Find questions where the closing date giving by the field `openingTimestamp`
 * is between `openingTimestamp - seconds` and `openingTimestamp`.
 * @param openingTimestamp timestamp in seconds to look for Question records 
 * where `openingTimestamp` field is less or equal than `openingTimestamp`.
 * @param seconds number of seconds to filter
 * question records where `openingTimestamp` field is greather than 
 * `timestamp - seconds`.
 * @param limit number of first Question elements to retrieve.
 * @returns a Question records list.
 */
module.exports.getQuestionByOpeningTimestamp = (openingTimestamp, seconds, limit) => {
  const jsonQuery = { query: `{  questions(first: ${limit}, where: { openingTimestamp_gt: \"${openingTimestamp-seconds}\", openingTimestamp_lte: \"${openingTimestamp}\"}) { id outcomes title indexedFixedProductMarketMakers { id }}}` }

  return fetch(process.env.THE_GRAPH_OMEN, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonQuery),
    method: "POST",
  })
    .then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(json => {
      if(json.errors) {
        throw new Error(json.errors.map(error => error.message));
      }
      return json.data.questions && json.data.questions.map(question =>
        ({
          id: question.id,
          title: question.title,
          outcomes: question.outcomes,
          indexedFixedProductMarketMakers: (question.indexedFixedProductMarketMakers.length > 0) ? question.indexedFixedProductMarketMakers[0].id : null,
        })
      );
    });
}

/**
 * Find questions where `isPendingArbitration` field is `true` on
 * the closing date giving by the field `openingTimestamp`
 * is greather or equals than `openingTimestamp` timestamp.
 * @param openingTimestamp timestamp in seconds.
 * @param limit number of first Question elements to retrieve.
 * @returns a Question records list.
 */
module.exports.findQuestionByIsPendingArbitration = (openingTimestamp, limit) => {
  const jsonQuery = { query: `{  questions(first: ${limit}, where: { isPendingArbitration: true, openingTimestamp_gte: \"${openingTimestamp}\"}) { id outcomes title indexedFixedProductMarketMakers { id }}}` }

  return fetch(process.env.THE_GRAPH_OMEN, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonQuery),
    method: "POST",
  })
    .then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(json => {
      if(json.errors) {
        throw new Error(json.errors.map(error => error.message));
      }
      return json.data.questions && json.data.questions.map(question =>
        ({
          id: question.id,
          title: question.title,
          outcomes: question.outcomes,
          indexedFixedProductMarketMakers: (question.indexedFixedProductMarketMakers.length > 0) ? question.indexedFixedProductMarketMakers[0].id : null,
        })
      );
    });
}