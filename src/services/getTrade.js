const fetch = require('node-fetch');

/**
 * Look for last FPMM trade records ordered by `creationTimestamp` in 
 * descendent order direction.
 * @param  {} timestamp timestamp in seconds to look for FPMM trade records 
 * where `creationTimestamp` field is less or equal than `timestamp`.
 * @param  {} pastTimeInSeconds number of seconds to filter the last FPMM 
 * trade records where `creationTimestamp` field is greather than 
 * `timestamp` minus `pastTimeInSeconds`.
 * @limit number of first Trade elements to retrieve.
 * @returns a FPMM Trade list with the ffpm addres and the outcomes.
 */
module.exports.getTrade = (creationTimestamp, seconds, limit) => {
  const jsonQuery = { query: `{fpmmTrades(first: ${limit}, where: { creationTimestamp_gt: \"${creationTimestamp-seconds}\", creationTimestamp_lte: \"${creationTimestamp}\" }, orderBy: creationTimestamp, orderDirection: desc) { id fpmm { id outcomes outcomeTokenMarginalPrices } creator { id } title collateralToken collateralAmount collateralAmountUSD feeAmount type creationTimestamp outcomeIndex outcomeTokensTraded }}` }

  const promise = fetch(process.env.THE_GRAPH_OMEN, {
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(jsonQuery),
    method: 'POST',
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(json => {
    if(json.errors) {
      throw new Error(json.errors.map(error => error.message));
    }
    return json.data.fpmmTrades && json.data.fpmmTrades.map(trade => 
      ({
        id: trade.id,
        fpmm: trade.fpmm.id,
        title: trade.title,
        collateralToken: trade.collateralToken,
        collateralAmount: trade.collateralAmount,
        collateralAmountUSD: trade.collateralAmountUSD,
        feeAmount: trade.feeAmount,
        type: trade.type,
        creator: trade.creator.id,
        creationTimestamp: trade.creationTimestamp,
        outcomeIndex: trade.outcomeIndex,
        outcomeTokensTraded: trade.outcomeTokensTraded,
        outcomes: trade.fpmm.outcomes,
        outcomeTokenMarginalPrices: trade.fpmm.outcomeTokenMarginalPrices
      })
    );
  });

  return promise;
}

/**
 * Look for the fist last FPMM trade record ordered by `creationTimestamp` in 
 * descendent order direction where `id` is NOT the given `notId`.
 * @param  {} notId the `id` hex value to filter by not this given value.
 * @returns a last FPMM trade record.
 */
module.exports.getOldTrade = (notId) => {
  const jsonQuery = { query: `{fpmmTrades(first: 1, where: { id_not: \"${notId}\" }, orderBy: creationTimestamp, orderDirection: desc) { id fpmm { id outcomeTokenMarginalPrices } }}` }

  const promise = fetch(process.env.THE_GRAPH_OMEN, {
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(jsonQuery),
    method: 'POST',
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(json => {
    if(json.errors) {
      throw new Error(json.errors.map(error => error.message));
    }
    if(json.data.fpmmTrades && json.data.fpmmTrades.length > 0) {
      const trade = json.data.fpmmTrades[0];
      return {
        id: trade.id,
        outcomeTokenMarginalPrices: trade.fpmm.outcomeTokenMarginalPrices
      }
    }
  });

  return promise;
}