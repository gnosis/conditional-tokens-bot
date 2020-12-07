#/bin/bash

CONDITION_ID=$1

if [ $# -ne 1 ];
then
  echo "usage: $1 CONDITION_ID_HASH"
  exit -1
fi

if [ -n $CONDITION_ID ]; then

HASH_ID=`curl -s 'https://api.thegraph.com/subgraphs/name/cag/hg' \
 -H 'content-type: application/json' \
 --data-binary '{"query":"{ conditions(where : { id: \"'${CONDITION_ID}'\"}) { id oracle questionId }}"}' | jq '.data["conditions"][].questionId' | cut -d'"' -f 2`
 
 if [ -n $HASH_ID ]; then
  echo "questionID: $HASH_ID";
  json=`curl -s 'https://api.thegraph.com/subgraphs/name/protofire/omen' \
    -H 'content-type: application/json' \
    -d '{"query":"{  questions(  where: {    id: \"'${HASH_ID}'\"  }  ) {    id    indexedFixedProductMarketMakers { id outcomeTokenMarginalPrices } templateId    data    title  }}"}'`    
  echo $json | jq '.data["questions"][].data'
  echo $json | jq '.data["questions"][].indexedFixedProductMarketMakers[].id'
  echo $json | jq '.data["questions"][].indexedFixedProductMarketMakers[].outcomeTokenMarginalPrices[]'
 fi

fi
