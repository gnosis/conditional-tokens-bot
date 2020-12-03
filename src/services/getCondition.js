const fetch = require('node-fetch');

/**
 * Find a condition by a given `conditionId`.
 * @param conditionId the condition Id.
 * @returns conditions records list.
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

/**
 * Find a condition and its question relationship
 * by a given `conditionId` condition Id.
 * @param conditionId the condition Id.
 * @returns conditions records list.
 */
module.exports.getConditionAndQuestions = (conditionId) => {
  const jsonQuery = { query: `{  conditions(  where: {    id: \"${conditionId}\"  }  ) { id oracle questionId fixedProductMarketMakers { id outcomeTokenMarginalPrices scaledLiquidityParameter } question { id title outcomes } }}` }

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
        question: condition.question
      })
    );
  });

  return promise;
}