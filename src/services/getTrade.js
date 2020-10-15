const fetch = require('node-fetch');
const _ = require("lodash/collection");

module.exports.getTrade = (creationTimestamp, seconds, limit) => {
  const jsonQuery = { query: `{fpmmTrades(first: ${limit}, where: { creationTimestamp_gt: \"${creationTimestamp-seconds}\", creationTimestamp_lte: \"${creationTimestamp}\" }, orderBy: creationTimestamp, orderDirection: desc) { id fpmm { id outcomes outcomeTokenMarginalPrices } creator { id } title collateralToken collateralAmount feeAmount type creationTimestamp outcomeIndex outcomeTokensTraded }}` }

  const promise = fetch(process.env.THE_GRAPH_OMEN, {
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(jsonQuery),
    method: 'POST',
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(json => {
    const trades = new Array();
    if(!json.errors && json.data.fpmmTrades) {
      _.forEach(json.data.fpmmTrades, trade => {
          trades.push({
            id: trade.id,
            fpmm: trade.fpmm.id,
            title: trade.title,
            collateralToken: trade.collateralToken,
            collateralAmount: trade.collateralAmount,
            feeAmount: trade.feeAmount,
            type: trade.type,
            creator: trade.creator.id,
            creationTimestamp: trade.creationTimestamp,
            outcomeIndex: trade.outcomeIndex,
            outcomeTokensTraded: trade.outcomeTokensTraded,
            outcomes: trade.fpmm.outcomes,
            outcomeTokenMarginalPrices: trade.fpmm.outcomeTokenMarginalPrices
          })
      });
    } else {
      throw new Error(json.errors[0].message);
    }
    return trades;
  });

  return promise;
}

module.exports.getOldTrade = (notId) => {
  const jsonQuery = { query: `{fpmmTrades(first: 1, where: { id_not: \"${notId}\" }, orderBy: creationTimestamp, orderDirection: desc) { id fpmm { id outcomeTokenMarginalPrices } }}` }

  const promise = fetch(process.env.THE_GRAPH_OMEN, {
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(jsonQuery),
    method: 'POST',
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(json => {
    if(!json.errors && json.data.fpmmTrades) {
      const trade = json.data.fpmmTrades[0];
      return {
        id: trade.id,
        outcomeTokenMarginalPrices: trade.fpmm.outcomeTokenMarginalPrices
      }
    }
    throw new Error(json.errors[0].message);
  });

  return promise;
}