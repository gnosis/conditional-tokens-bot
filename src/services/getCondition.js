const fetch = require('node-fetch');
const _ = require("lodash/collection");

module.exports.getCondition = (conditionId) => {
  const jsonQuery = { query: `{  conditions(  where: {    id: \"${conditionId}\"  }  ) { id oracle questionId fixedProductMarketMakers { id outcomeTokenMarginalPrices scaledLiquidityParameter } }}` }

  const promise = fetch(process.env.THE_GRAPH_OMEN, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonQuery),
    method: "POST",
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(json => {
    const conditions = new Array();
    if(!json.errors && json.data.conditions) {
      _.forEach(json.data.conditions, condition => {
        conditions.push({
          oracle: condition.oracle,
          questionId: condition.questionId,
          fixedProductMarketMakers: (condition.fixedProductMarketMakers.length > 0) ? condition.fixedProductMarketMakers[0].id : null,
          outcomeTokenMarginalPrices: (condition.fixedProductMarketMakers.length > 0) ? condition.fixedProductMarketMakers[0].outcomeTokenMarginalPrices : null,
          scaledLiquidityParameter: (condition.fixedProductMarketMakers.length > 0) ? condition.fixedProductMarketMakers[0].scaledLiquidityParameter : null,
        });
      });
    } else {
      throw new Error(json.errors[0].message);
    }
    return conditions;
  });

  return promise;
}