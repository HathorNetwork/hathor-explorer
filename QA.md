This QA document can be used both on the [mainnet](https://explorer.hathor.network/) and [testnet](https://explorer.testnet.hathor.network/) versions of the Explorer.

## References
Some useful links and strings to use on the QAs:
### Mainnet
- A [block](https://explorer.hathor.network/transaction/00000000000000003e207addfc23c863d730dfacf8e8b9edc6d0ab05202046a2) - `00000000000000003e207addfc23c863d730dfacf8e8b9edc6d0ab05202046a2`
- A [simple transaction](https://explorer.hathor.network/transaction/00001152b5f46e98af68b901138e381e86a77919bd3a0a568536958a2b3f727b) - `00001152b5f46e98af68b901138e381e86a77919bd3a0a568536958a2b3f727b`
- A [token creation transaction](https://explorer.hathor.network/transaction/00001edd5c736e58a2189c8f56b7e96282f2f09723c6079a94060de06532f2a1) - `00001edd5c736e58a2189c8f56b7e96282f2f09723c6079a94060de06532f2a1`
- A [nft creation transaction](https://explorer.hathor.network/transaction/0000080e4ab98ad76126403d58d37443991517e6c9edeab55b6653f34b308b7a) - `0000080e4ab98ad76126403d58d37443991517e6c9edeab55b6653f34b308b7a`
- An [address](https://explorer.hathor.network/address/HH5As5aLtzFkcbmbXZmE65wSd22GqPWq2T) - `HH5As5aLtzFkcbmbXZmE65wSd22GqPWq2T`

### Testnet
- A [block](https://explorer.testnet.hathor.network/transaction/000000000737bc54cbad0d29eda40754ea5dd4325f2938cd6640801acfc393ac) - `000000000737bc54cbad0d29eda40754ea5dd4325f2938cd6640801acfc393ac`
- A [simple transaction](https://explorer.testnet.hathor.network/transaction/0000227fd2310cb6de2644445b6d650a275a7910b5492e87d4aa019de89f2762) - `0000227fd2310cb6de2644445b6d650a275a7910b5492e87d4aa019de89f2762`
- A [token creation transaction](https://explorer.testnet.hathor.network/token_detail/000029a879e0430b2c1bd335787a2f79bc373590053be220472bc620e640df77) - `000029a879e0430b2c1bd335787a2f79bc373590053be220472bc620e640df77`
- A [nft creation transaction](https://explorer.testnet.hathor.network/token_detail/000035ee44954f0b896c18d63e4f30cd87ccac7220bd94e1878b0fb01e964be8) - `000035ee44954f0b896c18d63e4f30cd87ccac7220bd94e1878b0fb01e964be8`
- An [address](https://explorer.testnet.hathor.network/address/WmeByhYxt2F8As6Hon6mnpFUqbLpJh2pjE?token=00) - `WmeByhYxt2F8As6Hon6mnpFUqbLpJh2pjE`

## 1. Landing page
1. Check that there is a list displaying the most recent 6 blocks
1. Check that there is a list displaying the most recent 6 transactions
1. Confirm that the version number is the expected one
1. Click on a block and confirm it navigates to `/transaction/{tx_id}`
1. Click on a transaction and confirm it navigates to `/transaction/{tx_id}`
1. Wait a while for a new block to appear in real time
1. Wait a while or make a new tx and wait for it to appear in real time
1. Fetch the transaction id from one of the transactions in the list and use it as input to the search box in the page header. Confirm it navigates to `/transaction/{tx_id}
1. Copy one of the transaction's addresses to the clipboard, then click on the header search box and click its internal "✖" icon to remove the filter.
1. Now filter for the address in the clipboard. Confirm it navigates to `/address/{address}?token=00`

### 2. Blocks list
1. On the landing page, click on "See all Blocks"
1. The url is now `/blocks`
1. Confirm there are 10 rows in the main page
1. Wait a while for a new block to appear and confirm the page updates in realtime
1. Click Next and see that the exhibited blocks have changed
1. Verify that the page no longer updates in realtime
1. Copy the URL and open in another browser: the same blocks must be shown on both screens even if new blocks have arrived
1. Click on a block and confirm it navigates to `/transaction/{tx_id}`

### 3. Transactions list
1. On the landing page, click on "See all Transactions"
1. The url is now `/transactions`
1. Confirm there are 10 rows in the main page
1. Wait a while for a new transaction to appear or create one and confirm the page updates in realtime
1. Click Next and see that the transactions have changed
1. Verify that the page no longer updates in realtime
1. Copy the URL and open in another browser: the same txs must be shown on both screens even if new txs have arrived
1. Click on a block and confirm it navigates to `/transaction/{tx_id}`

### 4. Tokens List
1. Navigate to "Tokens" -> "Tokens List" on the header menu
1. The url now is `/tokens`
1. Confirm there are 10 rows and a search box in the main page
1. There is no realtime update expectation here
1. Verify that some columns allow ordering by clicking on their header: Name, Symbol and Created At. 
1. Click on one of those and validate that the list is updated correctly, even with elements that were not visible and not even loaded before ( for example, "Created at" descending/ascending )
1. Click on the "Next" button and confirm that the tokens list has changed
1. Confirm also that the url has not changed, and will not replicate this exact state if shared to another window
1. If the column headers is clicked, the pagination returns to the first page
1. Click a token row and confirm it navigates to `/token_detail/{uid}`

#### 4.1 Tokens Search
1. Search for a token `uid` (see example in the References section) and confirm it's the only one to show as a result
1. Search for a string with common keywords ( for example `Test NFT Token` ) and verify that the search is not executed by the full string, but by each of the words used: there should be many results
1. Search for a rarer term ( for example `TK002` on `mainnet` ) and confirm the results are fewer

### 5. Token Balances
1. Navigate to "Tokens" -> "Token Balances" on the header menu
1. Verify that a loading component is displayed while the data is being fetched
1. Confirm the page displays 10 rows, a search box, the number of addresses and transactions on the network
1. The rows displays addresses, total tokens, unlocked and locked tokens
1. Click on the column headers and validate that the list is updated correctly, even with elements that were not visible and not even loaded before ( for example, clicking on the "Locked" column )
1. There is no realtime update expectation here
1. Click on the "Next" button and confirm that the tokens list has changed
1. Confirm also that the url has not changed, and will not replicate this exact state if shared to another window
1. If the column headers is clicked, the pagination returns to the first page
1. Click a token row and confirm it navigates to `/address/{address}?token=00`

#### 5.1 Token Balance Search
1. Try searching for an **address** and confirm it doesn't even attempt to reload the results, as the input is invalid
1. Search for an **uid** and do not click the magnifier button. After a few moments an "autocomplete" visual element must appear with the token name and symbol. Click it.
1. Only addresses containing this token should be exhibited, with the updated totals
1. The search box is no longer clickable, all but removing the filter
1. Try searching for a rare keyword like `TK002` and wait for the autocomplete. There should be multiple options to select from.
1. Select one of them: the url should now be shareable with the current search parameters
1. There should also be a link to "see the token details" that lead to `/token_detail`

### 6. Address details
1. Sample mainnet address with many tokens ( [link](https://explorer.hathor.network/address/HSXQQWTCYKP9rHgC9dnBJ3uANtTSz672qa?token=00) )
1. Initially, look at all the information exhibited on the first two sections of the page. All data should be correct for the selected address ( use the Desktop Wallet to validate, if necessary )
1. The url should contain the address and the token, in a way that the visualization with this same data is shareable
1. If the "Number of tokens" is greater than 1, there should be a SelectBox allowing a change of the token being focused within this address
1. After selecting a different token, all data in the screen should be updated accordingly
1. The list of transactions should have at most 10 rows
1. These rows cannot be reordered by the header
1. There should be an option to navigate to the next page, but not to the last page
1. The pagination should not change the URL, so the current page cannot be shared
1. Clicking any row should navigate to `/transaction/tx_id`
1. If a new transaction has arrived while the page is open, a yellow alert-like element should be exhibited, requesting the user to reload the screen.

### 7. Transaction details
1. Verify all fields about the transaction and compare them to another source of truth ( the wallet desktop, or other previous knowledge of the transaction data )
1. If this is a common transaction, there should be a "First block" field with a link to the block
1. If this is a block, validate that:
   1. There aren´t any inputs
   1. A "Feature Activation" section is shown
   1. The "Funds heighbors" only show the block itself
   1. The "Verification neighbors" should be empty
1. If this is a token creation tx, validate that: 
   1. There is a section named "Tokens" containing the token name, symbol and link to `/token_detail/{uid}`
1. If this is an NFT, validate that:
   1. The first output is of type `Data` 
   2. There is a section named "Tokens" containing the token name, symbol and link to `/token_detail/{uid}`

### 8. Token details
1. Verify that the screen contains all information about the token on a single section
1. Check that there are (ℹ) icons explaining the _mint_ and _melt_ fields
1. Verify that there is another section containing the configuration string in the following forms:
   - A QR Code
   - A component that allows copying to clipboard
   - A download button that offers a PNG image
1. With the help of a QR Code reader, validate that both the QR on page and the downloaded one contain the token configuration string 
1. The last part of the screen should be a transactions history containing at most 10 rows
1. Click the "Next" button and verify that the url has changed, so that this exact same content can be shared
1. Clicking any of the transactions should navigate to `/transaction/{tx_id}`

### 9. Network page
1. Should have a "Peer" select box with peer ids to select from
1. There should be an (ℹ) icon to the right of the selectbox explaining it
1. The active peer on the selectbox should also be present on the url
1. A dark box should give details about the peer itself: id, uptime, version, latest timestamp and best block
1. A list of connected peers should be displayed below, with the additional fields: protocol, address, entrypoints, state, synced block and best block
1. If the state is "Synchronizing", there should be an (ℹ) icon explaining if the peer is ahead of behind.
1. There should be a "Reload data" button on the top right of the screen
1. Click to change the peer and validate all information is loaded again

### 10. Tools - Decode Tx
1. On screen there should be a large, multiline text input, a button "Decode Tx" and a link to the "Push Tx" screen
1. Fetch the "Raw" data from any known transaction on the _Transaction Details Screen_ and confirm it is exhibited correctly on the _Decode Tx_ screen
1. Fetch the raw data from a transaction on another network and try to decode it: an error should be shown indicating the transaction cannot be decoded.

### 11. Tools - Push Tx
1. Try submitting the raw data from an existing transaction and see that it gives an error `Transaction already exists {tx_id}`.
1. Try submitting the raw data from an existing block and see that it gives an error because the transaction has no inputs.
1. Generate a signed transaction data on the headless wallet and try sending it through here

### 12. Tools - DAG
1. Open the screen and follow it for a while: geometric figures should be appearing indicating blocks ( rectangles ) and transactions ( circles )
1. Hover over any of the blocks and see that it has the following data:
   - Transaction hash
   - Timestamp
   - Its neighbors highlighted while the remaining are greyed out
3. Confirm you can zoom in and out of the graph
1. Change the "Timeframe" to a higher value, such as 600 or 1800, and check that the graph changes too
1. Validate that the graph shows the same blocks and transactions as the landing page, given the same time frame
1. Validate that those blocks and transactions are connected through lines, indicating its parents and children

### 13. Features page
1. At the top of the screen is displayed the height of the last block evaluated
1. Confirm that this block does not update in realtime
1. Verify that the latest feature activation instances are listed there, including the ones already completed or failed.

### 14. Statistics Page
1. The screen starts with the best block height, the number of transactions and the hashrate
1. The "real time" section should be updated with every block or transaction
1. The "Historical Data" should be loaded in its own time, with a "Loading" component indicating its progress
1. After the "Historical Data" section is loaded, there should be displayed the block and the timestamp when it was last updated.
1. Click on the period input and select different timeframes. The graphs should be updated.

### 15. Nano Contracts (run this section only if nano contracts is available)
1. Open the transaction detail screen of a nano contract transaction.
1. See if it correctly loads the nano contract ID, the address used to sign, the method, arguments, and list of actions.
1. Click on the nano contract ID link to go to the nano contract detail screen.
1. See if correctly load the Nano Contract ID, Blueprint ID, the state of the contract, the balance of tokens, and history.
1. Click on a tx in the history and validate it goes to the transaction detail screen.
1. Go back and click on the blueprint link.
1. See if it correctly loads the blueprint attributes, method, and source code.
