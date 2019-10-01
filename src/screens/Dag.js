/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import txApi from '../api/txApi';
import DagComponent from '../components/DagComponent';
import WebSocketHandler from '../WebSocketHandler';


/*
 * Gets the maximum timestamp from the blocks and transactions.
 * This function assumes the arrays are ordered
 */
export const getMax = (blocks, txs) => {
    let max = 0;
    if (blocks.length > 0 && txs.length > 0) {
      max = Math.max(blocks[blocks.length - 1].timestamp, txs[txs.length - 1].timestamp);
    } else if (blocks.length > 0) {
      max = blocks[blocks.length - 1].timestamp;
    } else {
      max = txs[txs.length - 1].timestamp;
    }
    
    return max;
  }


class Dag extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      blocks: null,         // array of blocks to show on the graph
      txs: null,            // array of txs to show on graph
      isPaused: false,      // whether we should update the graph on realtime
      inputTimeframe: 60,   // the time window to display
      throttled: false, // if tx/block messages are being throttled because it reached the flow limit
    }

    // blocks received while visualization is paused
    this.pausedBlocks = []; 
    // txs received while visualization is paused
    this.pausedTxs = []; 
    // indicates how many seconds to display on the graphic
    this.timeframe = this.state.inputTimeframe;     
  }
  
  /*
   * Remove elements from arrays that do not fall inside the
   * time window we'll display.
   */
  filterArrays = (blocks, txs) => {
    const max = getMax(blocks, txs);
    const min = max - this.timeframe;
    const newBlocks = this.filterTxArray(min, blocks);
    const newTxs = this.filterTxArray(min, txs);
    return [newBlocks, newTxs];
  }

  /*
   * Assumes array is ordered. Return new array whose timestamp
   * is greater or equal the given timestamp.
   */
  filterTxArray = (timestamp, txArray) => {
    let i;
    for (i = 0; i < txArray.length; i++) {
      if (txArray[i].timestamp >= timestamp) {
        break;
      }
    }
    return txArray.slice(i);
  }
  
  componentDidMount() {
    this.requestData();
  }

  componentWillUnmount() {
    WebSocketHandler.removeListener('network', this.handleWebsocket);
  }

  requestData = () => {
    const blockNum = 5 * (1 + Math.round(this.timeframe/60));
    txApi.getTransactions('block', blockNum).then((data) => {
      const _blocks = data.transactions;
      _blocks.sort((a, b) => {return a.timestamp - b.timestamp})
      if (this.state.txs) {
        const [blocks, txs] = this.filterArrays(_blocks, this.state.txs);
        this.setState({ blocks, txs });
        WebSocketHandler.on('network', this.handleWebsocket);
      } else {
        this.setState({ blocks: _blocks });
      }
    }, (e) => {
      // Error in request
      console.log(e);
      this.setState({ blocks: [] });
    });

    const txNum = 60 * (1 + Math.round(this.timeframe/60));
    txApi.getTransactions('tx', txNum).then((data) => {
      const _txs = data.transactions;
      _txs.sort((a, b) => {return a.timestamp - b.timestamp})
      if (this.state.blocks) {
        const [blocks, txs] = this.filterArrays(this.state.blocks, _txs);
        this.setState({ blocks, txs });
        WebSocketHandler.on('network', this.handleWebsocket);
      } else {
        this.setState({ txs: _txs });
      }
    }, (e) => {
      // Error in request
      console.log(e);
      this.setState({ txs: [] });
    });
  }

  handleWebsocket = (wsData) => {
    if (wsData.type === 'network:new_tx_accepted') {
      if (this.state.isPaused) {
        if (wsData.is_block) {
          this.pausedBlocks.push(wsData);
        } else {
          this.pausedTxs.push(wsData);
        }
      } else {
        let blocks = this.state.blocks;
        let txs = this.state.txs;
        if (wsData.is_block) {
          blocks = [...this.state.blocks, wsData];
        } else {
          txs = [...this.state.txs, wsData];
        }
        this.dag.newData(wsData, wsData.is_block, false);
        const [newBlocks, newTxs] = this.filterArrays(blocks, txs);
        this.setState({
          blocks: newBlocks,
          txs: newTxs,
        });
      }

      this.setState({ throttled: wsData.throttled });
    }
  }

  handlePause = (e) => {
    if (this.state.isPaused) {
      for (let tx of this.pausedTxs) {
        this.dag.newData(tx, false, false);
      }
      for (let block of this.pausedBlocks) {
        this.dag.newData(block, true, false);
      }
      this.setState({isPaused: false});
      this.pausedBlocks = [];
      this.pausedTxs = [];
    } else {
      this.setState({isPaused: true});
    }
  }

  handleReset = (e) => {
    this.timeframe = this.state.inputTimeframe;
    this.setState({
      blocks: null,
      txs: null,
      isPaused: false,
    });
    WebSocketHandler.removeListener('network', this.handleWebsocket);
    this.requestData();
  }

  handleTimeframeChange = (e) => {
    const value = e.target.value;
    if (value) {
      this.setState({ inputTimeframe: parseInt(value, 10) });
    } else {
      this.setState({ inputTimeframe: '' });
    }
  }

  render() {
    return (
      <div className="d-flex align-items-start flex-column content-wrapper dag-visualizer">
        <button className="btn btn-secondary mr-5" onClick={this.handlePause} >
          {this.state.isPaused ? 'Play' : 'Pause'}
        </button>
        <div className="d-flex align-items-center mt-3">
          <label htmlFor="timeframe" className="mr-3">Timeframe (in seconds):</label>
          <input type="number" id="timeframe" name="timeframe" min="0" 
                 value={this.state.inputTimeframe} onChange={this.handleTimeframeChange}
          />
          <button className="btn btn-secondary ml-3" onClick={this.handleReset}>
            Reset
          </button>
        </div>
        {this.state.throttled && <div className="mt-3 text-warning">The graph is not 100% correct because it has reached the flow limit, so we are showing only a limited amount of transactions and blocks</div>}
        {(this.state.blocks && this.state.txs) 
          && <DagComponent ref={node => this.dag = node} blocks={this.state.blocks} txs={this.state.txs} timeframe={this.timeframe} />}
      </div>
    );
  }
}

export default Dag;
