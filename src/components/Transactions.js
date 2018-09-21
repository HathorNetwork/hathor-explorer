import React from 'react';
import txApi from '../api/txApi';
import ReactLoading from 'react-loading';
import {TX_COUNT} from '../constants';
import TxRow from './TxRow';
import helpers from '../utils/helpers';
import { WS_URL } from '../constants';


class Transactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      transactions: [],
      firstHash: null,
      lastHash: null,
      loaded: false,
      hasAfter: false,
      hasBefore: false,
    }

    this.previousClicked = this.previousClicked.bind(this);
    this.nextClicked = this.nextClicked.bind(this);
    this.getData = this.getData.bind(this);
    this.handleDataFetched = this.handleDataFetched.bind(this);

    this.ws = null;
  }

  componentDidMount() {
    this.getData(true, null, '');

    this.ws = new WebSocket(WS_URL)
    // TODO Handle onClose and onError events
    // TODO Handle also socket reconnection when timeout or lost connection to server
    this.ws.onmessage = (event) => {
      this.handleWebsocket(JSON.parse(event.data));
    }
  }

  handleWebsocket(wsData) {
    if (wsData.type === 'network:new_tx_accepted') {
      this.updateListWs(wsData);
    }
  }

  updateListWs(tx) {
    // We only add new tx/blocks if it's the first page
    if (!this.state.hasBefore && ((tx.is_block && this.props.type === 'block') || (!tx.is_block && this.props.type === 'tx'))) {
      let transactions = this.state.transactions;
      let hasAfter = (this.state.hasAfter || (transactions.length === TX_COUNT && !this.state.hasAfter))
      transactions = helpers.updateListWs(transactions, tx, TX_COUNT);

      let firstHash = transactions[0].hash;
      let lastHash = transactions[transactions.length-1].hash;

      // Finally we update the state again
      this.setState({ transactions, hasAfter, firstHash, lastHash });
    }
  }

  handleDataFetched(data, first, page) {
    // Handle differently if is the first GET response we receive
    // page indicates if was clicked 'previous' or 'next'
    // Set first and last hash of the transactions
    let firstHash = null;
    let lastHash = null;
    if (data.transactions.length) {
      firstHash = data.transactions[0].hash;
      lastHash = data.transactions[data.transactions.length-1].hash;
    }

    let hasAfter = false;
    let hasBefore = false;
    if (first) {
      // Before is always false, so we check after
      hasAfter = data.has_more;
    } else {
      if (page === 'previous') {
        hasAfter = true;
        hasBefore = data.has_more;
      } else {
        hasBefore = true;
        hasAfter = data.has_more;
      }
    }

    this.setState({ transactions: data.transactions, loaded: true, firstHash, lastHash, hasAfter, hasBefore });
  }

  getData = (first, hash, page) => {
    txApi.getTransactions(this.props.type, TX_COUNT, hash, page).then((data) => {
      this.handleDataFetched(data, first, page);
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  previousClicked(e) {
    e.preventDefault();
    this.getData(false, this.state.firstHash, 'previous');
  }

  nextClicked(e) {
    e.preventDefault();
    this.getData(false, this.state.lastHash, 'next');
  }

  render() {
    const loadPagination = () => {
      if (this.state.transactions.length === 0) {
        return null;
      } else {
        return (
          <nav aria-label="Tx pagination" className="d-flex justify-content-center">
            <ul className="pagination">
              <li ref="txPrevious" className={(!this.state.hasBefore || this.state.transactions.length === 0) ? "page-item mr-3 disabled" : "page-item mr-3"}><a className="page-link" onClick={(e) => this.previousClicked(e)} href="">Previous</a></li>
              <li ref="txNext" className={(!this.state.hasAfter || this.state.transactions.length === 0) ? "page-item disabled" : "page-item"}><a className="page-link" href="" onClick={(e) => this.nextClicked(e)}>Next</a></li>
            </ul>
          </nav>
        );
      }
    }

    const loadTable = () => {
      return (
        <table className="table table-striped" id="tx-table">
          <thead>
            <tr>
              <th>Hash</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loadTableBody()}
          </tbody>
        </table>
      );
    }

    const loadTableBody = () => {
      return this.state.transactions.map((tx, idx) => {
        return (
          <TxRow key={tx.hash} tx={tx} />
        );
      });
    }

    return (
      <div className="tab-content-wrapper">
        <h1>{this.props.type === 'tx' ? 'Transactions' : 'Blocks'}</h1>
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : loadTable()}
        {loadPagination()}
      </div>
    );
  }
}

export default Transactions;
