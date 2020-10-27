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