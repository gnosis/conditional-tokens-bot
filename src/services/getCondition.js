const fetch = require('node-fetch');
const _ = require("lodash/collection");

module.exports.getCondition = (conditionId) => {
  const jsonQuery = { query: `{  conditions(  where: {    id: \"${conditionId}\"  }  ) { id creator oracle questionId }}` }

  const promise = fetch(process.env.THE_GRAPH_GET_OMEN_CONDITIONS, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonQuery),
    method: "POST",
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(json => {    

    const conditions = new Array();
    _.forEach(json.data.conditions, condition => {
      conditions.push({
        questionId: condition.questionId,
        creator: condition.creator
      });
    });

    return conditions;
  });

  return promise;
}