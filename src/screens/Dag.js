/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import txApi from '../api/txApi';
import DagComponent from '../components/DagComponent';
import WebSocketHandler from '../WebSocketHandler';

// The pure functions below have no interaction with the screen component and are used only for
// calculations.

/*
 * Gets the maximum timestamp from the blocks and transactions.
 * This function assumes the arrays are ordered
 */
function getMax(blocks, txs) {
  let max;
  if (blocks.length > 0 && txs.length > 0) {
    max = Math.max(blocks[blocks.length - 1].timestamp, txs[txs.length - 1].timestamp);
  } else if (blocks.length > 0) {
    max = blocks[blocks.length - 1].timestamp;
  } else {
    max = txs[txs.length - 1].timestamp;
  }

  return max;
}

/*
 * Assumes array is ordered. Return new array whose timestamp
 * is greater or equal the given timestamp.
 */
function filterTxArray(timestamp, txArray) {
  let i;
  for (i = 0; i < txArray.length; i++) {
    if (txArray[i].timestamp >= timestamp) {
      break;
    }
  }
  return txArray.slice(i);
}

/*
 * Remove elements from arrays that do not fall inside the
 * time window we'll display.
 */
function filterArrays(blocks, txs, timeframe) {
  const max = getMax(blocks, txs);
  const min = max - timeframe;
  const newBlocks = filterTxArray(min, blocks);
  const newTxs = filterTxArray(min, txs);
  return [newBlocks, newTxs];
}

function Dag() {
  const [blocks, setBlocks] = useState(null); // array of blocks to show on the graph
  const [txs, setTxs] = useState(null); // array of txs to show on graph
  const [isPaused, setIsPaused] = useState(false); // whether we should update the graph on realtime
  const [inputTimeframe, setInputTimeframe] = useState(60); // the time window to display
  const [throttled, setThrottled] = useState(false); // if tx/block messages are being throttled because it reached the flow limit
  const [newWsData, setNewWsData] = useState(null); // Helper for handling new Websocket data
  const [consolidation, setConsolidation] = useState({
    hasNewData: false,
    type: 'none',
    txs: [],
    blocks: [],
  }); // Helper for consolidating txs and blocks for the component

  const dagElement = useRef(); // Holds the Dag drawing component

  // List of blocks received while visualization is paused
  const pausedBlocks = useRef([]);
  // List of txs received while visualization is paused
  const pausedTxs = useRef([]);
  // Indicates how many seconds to display on the graphic. Updated only on reset
  const timeframe = useRef(inputTimeframe);

  // Initializing the WebSocket listener
  useEffect(() => {
    WebSocketHandler.on('network', handleWebsocket);

    return () => {
      WebSocketHandler.removeListener('network', handleWebsocket);
    };

    // Named handler function, to help with listener removal later
    function handleWebsocket(wsData) {
      // Reject all types of events that are not the new transactions
      if (wsData.type !== 'network:new_tx_accepted') {
        return;
      }
      setNewWsData(wsData);
    }
  }, []);

  // Helper to consolidate both Transactions and Blocks on the drawing component
  useEffect(() => {
    // Only run this effect when there is new data to process
    if (!consolidation.hasNewData) {
      return;
    }

    // Blocks and txs may be empty at this time
    let tmpBlocks = blocks ? [...blocks] : [];
    let tmpTxs = txs ? [...txs] : [];

    switch (consolidation.type) {
      case 'full':
        // The first load, when blocks and txs are still null.
        // This requires no component update: all data is being informed for the first time
        tmpBlocks = consolidation.blocks;
        tmpTxs = consolidation.txs;
        break;
      case 'update':
        // Every update after the component is already drawn needs to be informed to the component
        // directly, besides the state update
        for (const block of consolidation.blocks) {
          tmpBlocks.push(block);
          updateComponentWithNewData(block, true);
        }
        for (const tx of consolidation.txs) {
          tmpTxs.push(tx);
          updateComponentWithNewData(tx, false);
        }
        break;
      default:
        throw new Error('No consolidation type defined');
    }

    // Sorting and slicing with the appropriate timeframe
    const [filteredBlocks, filteredTxs] = filterArrays(tmpBlocks, tmpTxs, timeframe.current);
    setBlocks(filteredBlocks);
    setTxs(filteredTxs);
    setConsolidation({ hasNewData: false });

    // Function that updates the component, if possible
    function updateComponentWithNewData(txData, isBlock) {
      if (!dagElement.current?.newData) {
        return; // Component is not yet ready for interaction
      }
      dagElement.current.newData(txData, isBlock, true);
    }
  }, [consolidation, blocks, txs]);

  // Handling transactions received through the websocket
  useEffect(() => {
    // Disconsider empty updates: they happen after a successful update below
    if (!newWsData) {
      return;
    }

    // Cleaning up so that new txs that arrive while this one is being processed are not duplicated
    const wsData = newWsData;
    setNewWsData(null);

    setThrottled(wsData.throttled);
    if (isPaused) {
      // Transactions received while paused will not be sent to the drawing component immediately
      if (wsData.is_block) {
        pausedBlocks.current.push(wsData);
      } else {
        pausedTxs.current.push(wsData);
      }
      return;
    }

    if (wsData.is_block) {
      setConsolidation({
        hasNewData: true,
        type: 'update',
        blocks: [newWsData],
        txs: [],
      });
    } else {
      setConsolidation({
        hasNewData: true,
        type: 'update',
        blocks: [],
        txs: [wsData],
      });
    }
  }, [newWsData, isPaused]);

  // Function that fetches the full information for transactions and blocks
  const requestData = useCallback(async () => {
    const blockNum = 5 * (1 + Math.round(timeframe.current / 60));
    let fetchedBlocks = [];
    try {
      const { transactions: apiBlocks } = await txApi.getTransactions('block', blockNum);
      apiBlocks.sort((a, b) => a.timestamp - b.timestamp);
      fetchedBlocks = apiBlocks;
    } catch (e) {
      console.error('Error on fetching blocks', e);
    }

    const txNum = 60 * (1 + Math.round(timeframe.current / 60));
    let fetchedTxs = [];
    try {
      console.log(`Getting txs`);
      const { transactions: apiTxs } = await txApi.getTransactions('tx', txNum);
      apiTxs.sort((a, b) => a.timestamp - b.timestamp);
      fetchedTxs = apiTxs;
    } catch (e) {
      console.log('Error on fetching txs', e);
    }
    setConsolidation({
      hasNewData: true,
      type: 'full',
      blocks: fetchedBlocks,
      txs: fetchedTxs,
    });
  }, []);

  // Initializing the screen with transaction data
  useEffect(() => {
    // Request the data and only start the websocket after
    requestData().catch(e => console.error('Error while requesting data on screen start', e));
  }, [requestData]);

  // Handles the Pause button click, sending stored transactions to be drawn, if there are any
  const handlePause = _event => {
    if (!isPaused) {
      setIsPaused(true);
      return;
    }

    // Updating the screen with the elements that arrived while paused
    setConsolidation({
      hasNewData: true,
      type: 'update',
      blocks: [...pausedBlocks.current],
      txs: [...pausedTxs.current],
    });
    setIsPaused(false);
    pausedBlocks.current = [];
    pausedTxs.current = [];
  };

  // Handles the reset button click and loads all transaction information from scratch
  const handleReset = _event => {
    timeframe.current = inputTimeframe;
    setBlocks(null);
    setTxs(null);
    setIsPaused(false);
    requestData().catch(e => console.error('Error while requesting data on a reset', e));
  };

  // Attempts to parse the inputted value to the application state
  const handleTimeframeChange = e => {
    const { value } = e.target;
    if (value) {
      setInputTimeframe(parseInt(value, 10));
    } else {
      setInputTimeframe('');
    }
  };

  const renderNewUi = () => (
    <div className="dag-content-wrapper">
      <div className="dag-content">
        <div>
          <h2 className="content-title">DAG</h2>
          <label htmlFor="timeframe" className="timeframe-label">
            Timeframe (in seconds):
          </label>
          <div>
            <input
              type="number"
              id="timeframe"
              name="timeframe"
              min="0"
              value={inputTimeframe}
              onChange={handleTimeframeChange}
              className="timeframe-input"
            />
          </div>
          <div className="dag-container-btn">
            <button onClick={handlePause}>{isPaused ? 'Play' : 'Pause'}</button>
            <button onClick={handleReset}>Reset</button>
          </div>
        </div>
        {throttled && (
          <div className="mt-3 text-warning">
            The graph is not 100% correct because it has reached the flow limit, so we are showing
            only a limited amount of transactions and blocks
          </div>
        )}
        {blocks && txs && (
          <>
            <DagComponent ref={dagElement} blocks={blocks} txs={txs} timeframe={timeframe} />
          </>
        )}
      </div>
    </div>
  );

  return renderNewUi();
}

export default Dag;
