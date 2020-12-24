Version 1.1.3 (2020-12-24)
==========================

Fix error when API fails #66

Version 1.1.2 (2020-12-21)
==========================

Fix `watchCreationMarketsEvent` condition.question.outcomes loop
Add error text on log error messages

Version 1.1.0 (2020-12-07)
==========================

Add Twitter support #60
Add async/await #58
Fix new Market outcomes Slack message #57
Update node-fetch dependencies #56
Fix creator address link and Liquidity amounts #55

Version 1.0.0 (2020-11-11)
==========================

Add escape HTML on title Slack messages #51
Fix watch events fromBlock greather than toBlock #50
Fix liquidity messages before new Markets #48
Add outcomeTokenMarginalPrice FPMMTrade fields #47
Fix call `findMarketReadyByQuestionOpeningTimestamp` on startup #45
Add channel Slack on messages for ready markets #44
Fix query get old FPMMTrade #40
Add Realitio arbitration request events #38
Add find markets ready to be resolved #35
Add watch event for market is resolved #34
Add default config json parameters #31
Get Market events between blocks #26
Add Liquidity market events #23
Add collateral amount in USD for get Trade #22
Add watch events from last 5 blocks #21
Feature/add start message version #19
Add getTrade event and refactor get new market #14
Add FPMMDeterministicFactory contract for new created markets event #10
Add gql and get info from Omen graph #6
