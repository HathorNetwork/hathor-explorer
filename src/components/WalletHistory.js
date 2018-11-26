import React from 'react';
import dateFormatter from '../utils/date';
import walletApi from '../api/wallet';
import HathorPaginate from '../components/HathorPaginate';
import { WALLET_HISTORY_COUNT } from '../constants';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import HathorAlert from './HathorAlert';
import helpers from '../utils/helpers';


class WalletHistory extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      history: [],
      totalPages: 0,
      page: 1,
    }

    this.getHistoryData = this.getHistoryData.bind(this);
    this.copied = this.copied.bind(this);
  }

  componentDidMount() {
    this.getHistoryData();
  }

  getHistoryData() {
    walletApi.getHistory(this.state.page, WALLET_HISTORY_COUNT).then((data) => {
      this.setState({history: data.history, totalPages: data.total_pages})
      this.props.loaded();
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  outputSpent(data) {
    let history = this.state.history;
    history = history.map((el) => {
      if (el.tx_id === data.from_tx_id && el.from_tx_id === undefined) {
        el.from_tx_id = data.from_tx_id;
        el.tx_id = data.tx_id;
        el.timestamp = data.timestamp;
        return el;
      } else {
        return el;
      }
    });

    this.setState({ history });
  }

  newOutput(data, total) {
    // XXX What should we do if user is not in page 1??
    // XXX Should we keep the same for him?
    if (this.state.page !== 1) return;
    // First we calculate the new total pages
    const totalPages = Math.ceil(total / WALLET_HISTORY_COUNT);

    let history = this.state.history;

    history = helpers.updateListWs(history, data, WALLET_HISTORY_COUNT);
    
    // Finally we update the state again
    this.setState({ history, totalPages });
  }

  handlePageClick = (data) => {
    let selected = data.selected;
    let page = selected + 1;

    this.setState({ page: page }, () => {
      this.getHistoryData();
    });
  }

  copied(text, result) {
    if (result) {
      // If copied with success
      this.refs.alertCopied.show(1000);
    }
  }

  render() {
    const loadPagination = () => {
      if (this.state.history === null || this.state.history.length === 0 || this.state.totalPages === 1) {
        return null;
      } else {
        return (
          <HathorPaginate pageCount={this.state.totalPages}
            onPageChange={this.handlePageClick} />
        );
      }
    }

    const renderHistory = () => {
      return (
        <div className="d-flex flex-column">
          <strong>Transaction history</strong>
          <div className="table-responsive">
            <table className="mt-3 table table-striped" id="wallet-history">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Index</th>
                  <th>Value</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {renderHistoryData()}
              </tbody>
            </table>
          </div>
          {loadPagination()}
        </div>
      );
    }

    const renderHistoryData = () => {
      return this.state.history.map((tx, idx) => {
        return (
          <tr key={`${tx.tx_id}${tx.index}${tx.from_tx_id}${tx.from_index}`}>
            <td>
              <a className={tx.voided && !tx.from_tx_id ? 'voided' : ''} target="_blank" href={`/transaction/${tx.from_tx_id ? tx.from_tx_id : tx.tx_id}`}>{tx.from_tx_id ? tx.from_tx_id.substring(0,32) : tx.tx_id.substring(0,32)}...</a>
              <CopyToClipboard text={tx.from_tx_id ? tx.from_tx_id : tx.tx_id} onCopy={this.copied}>
                <i className="fa fa-clone pointer ml-1" title="Copy to clipboard"></i>
              </CopyToClipboard>
            </td>
            <td>{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td>{tx.index}{tx.from_index}</td>
            <td className={tx.from_tx_id && !tx.voided ? "spent-tx" : ""}>{helpers.prettyValue(tx.value)}</td>
            <td>
              {tx.from_tx_id ?
                <div>
                  <a className={tx.voided ? 'voided' : ''} href={`/transaction/${tx.tx_id}`} target="_blank">
                    Spent {tx.voided ? '(Voided)' : ''}
                  </a> 
                  <CopyToClipboard text={tx.tx_id} onCopy={this.copied}>
                    <i className="fa fa-clone pointer ml-1" title="Copy hash to clipboard"></i>
                  </CopyToClipboard>
                </div>
              : (tx.voided ? 'Voided' : '')}
            </td>
          </tr>
        );
      });
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {renderHistory()}
        <HathorAlert ref="alertCopied" text="Copied to clipboard!" type="success" />
      </div>
    );
  }
}

export default WalletHistory;
