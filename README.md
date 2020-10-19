# Conditional Tokens bot

This is a bot to get events from Omen contiditional tokens smart contract and from Omen thengraph explorer and push them into social networks.

The bot supports `mainnet` and `rinkeby` Ethereum networks.

## Configure

- **NETWORK_NAME**: THe Ethereum network name.
- **ETH_NODE**: The Ethereum websocket to watch contracts.
- **CT_ADDRESS**: The Conditional Tokens contract address.
- **FIXED_PRODUCT_MM_FACTORY_ADDRESS**: The Fixed Product Market Maker factory contract address.
- **THE_GRAPH_CONDITIONAL_TOKENS**: The conditional tokens API subgraph endpoint.
- **THE_GRAPH_OMEN**: The Omen subgraph API endpoint.
- **SLACK_WEBHOOK_URL** (optional): Your Slack Incomming Webhook endpoint to push messages. If it's not setted the message will be send to the standard output.
- **START_BLOCK** (optional): The block number to start to watch events for. Default value `latest`.
- **JOB_GET_TRADE_MINUTES** (optional): The number of minutes for the job to ask for new trades on every Market Makers events. Default value `5` minutes.