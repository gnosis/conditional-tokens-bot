const fetch = require('node-fetch');

/**
 * Find conditions where condition id is a given `questionId`.
 * @param  {} conditionId the condition Id.
 * @returns a Condition records list.
 */
module.exports.getCondition = (conditionId) => {
  const jsonQuery = { query: `{  conditions(  where: {    id: \"${conditionId}\"  }  ) { id oracle questionId fixedProductMarketMakers { id outcomeTokenMarginalPrices scaledLiquidityParameter } }}` }

  const promise = fetch(process.env.THE_GRAPH_OMEN, {
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
    return json.data.conditions && json.data.conditions.map(condition => 
      ({
        oracle: condition.oracle,
        questionId: condition.questionId,
        fixedProductMarketMakers: (condition.fixedProductMarketMakers.length > 0) ? condition.fixedProductMarketMakers[0].id : null,
        outcomeTokenMarginalPrices: (condition.fixedProductMarketMakers.length > 0) ? condition.fixedProductMarketMakers[0].outcomeTokenMarginalPrices : null,
        scaledLiquidityParameter: (condition.fixedProductMarketMakers.length > 0) ? condition.fixedProductMarketMakers[0].scaledLiquidityParameter : null,
      })
    );
  });

  return promise;
}