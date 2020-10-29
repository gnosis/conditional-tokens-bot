const fetch = require('node-fetch');

/**
 * Look for last FPMM trade records ordered by `creationTimestamp` in 
 * descendent order direction.
 * @param creationTimestamp timestamp in seconds to look for FPMM trade records 
 * where `creationTimestamp` field is less or equal than `timestamp`.
 * @param seconds number of seconds to filter the last FPMM 
 * trade records where `creationTimestamp` field is greather than 
 * `creationTimestamp - seconds`.
 * @param limit number of first Trade elements to retrieve.
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
 * descendent order direction where market id is the given `fpmmId`,
 * the trade id is NOT the given `notTradeId`, and
 * the creationTimestamp is less than `creationTimestamp`.
 * @param fpmmId the `id` of the market.
 * @param notTradeId the `id` hex value to filter by not this given value.
 * @param creationTimestamp the creation timestamp is before `creationTimestamp`.
 * @returns a last FPMM trade record.
 */
module.exports.getOldTrade = (fpmmId, notTradeId, creationTimestamp) => {
  const jsonQuery = { query: `{fpmmTrades(first: 1, where: { fpmm: \"${fpmmId}\", id_not: \"${notTradeId}\", creationTimestamp_lt: \"${creationTimestamp}\" }, orderBy: creationTimestamp, orderDirection: desc) { id fpmm { id outcomeTokenMarginalPrices } }}` }

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