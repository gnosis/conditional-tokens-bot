const fetch = require('node-fetch');

/**
 * Get FPMM liquidity list ordered by `creationTimestamp` in 
 * descendent order direction.
 * @param  {} creationTimestamp timestamp in seconds to look for FPMM liquidity list
 * where `creationTimestamp` field is less or equal than `timestamp`.
 * @param  {} seconds number of seconds to filter the last FPMM 
 * trade records where `creationTimestamp` field is greather than 
 * `timestamp` minus `seconds`.
 * @limit the number limit of the first Liquidity elements to retrieve.
 * @returns a FPMM liquidity list with the ffpm and funder addresses.
 */
module.exports.getLiquidity = (creationTimestamp, seconds, limit) => {
  const jsonQuery = { query: `{fpmmLiquidities(first: ${limit}, where: { creationTimestamp_gt: \"${creationTimestamp-seconds}\", creationTimestamp_lte: \"${creationTimestamp}\" }, orderBy: creationTimestamp, orderDirection: desc) { id fpmm { id title scaledLiquidityParameter collateralToken } funder { id } type outcomeTokenAmounts collateralTokenAmount additionalLiquidityParameter sharesAmount collateralRemovedFromFeePool creationTimestamp }}` };
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
    return json.data && json.data.fpmmLiquidities && json.data.fpmmLiquidities.map(liquidity => 
      ({
        id: liquidity.id,
        fpmm: liquidity.fpmm.id,
        scaledLiquidityParameter: liquidity.fpmm.scaledLiquidityParameter,
        collateralToken: liquidity.fpmm.collateralToken,
        title: liquidity.fpmm.title,
        funder: liquidity.funder.id,
        type: liquidity.type,
        outcomeTokenAmounts: liquidity.outcomeTokenAmounts,
        collateralTokenAmount: liquidity.collateralTokenAmount,
        additionalLiquidityParameter: liquidity.additionalLiquidityParameter,
        sharesAmount: liquidity.sharesAmount,
        collateralRemovedFromFeePool: liquidity.collateralRemovedFromFeePool,
        creationTimestamp: liquidity.creationTimestamp,
      })
    );
  });

  return promise;
}