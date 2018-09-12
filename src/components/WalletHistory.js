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
  }

  componentWillMount() {
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
      helpers.showAlert('alert-copied', 1000);
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
        <div className="flex">
          <strong>Transaction history</strong>
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
          {loadPagination()}
        </div>
      );
    }

    const renderHistoryData = () => {
      return this.state.history.map((tx, idx) => {
        return (
          <tr key={tx.tx_id + tx.index}>
            <td>
              <a target="_blank" href={`/transaction/${tx.from_tx_id ? tx.from_tx_id : tx.tx_id}`}>{tx.from_tx_id ? tx.from_tx_id.substring(0,32) : tx.tx_id.substring(0,32)}...</a>
              <CopyToClipboard text={tx.from_tx_id ? tx.from_tx_id : tx.tx_id} onCopy={this.copied}>
                <i className="fa fa-clone pointer ml-1" title="Copy to clipboard"></i>
              </CopyToClipboard>
            </td>
            <td>{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td>{tx.index}{tx.from_index}</td>
            <td className={tx.from_tx_id ? "spent-tx" : ""}>{tx.value}</td>
            <td>
              {tx.from_tx_id ?
                <div>
                  <a href={`/transaction/${tx.tx_id}`} target="_blank">Spent</a> 
                  <CopyToClipboard text={tx.tx_id} onCopy={this.copied}>
                    <i className="fa fa-clone pointer ml-1" title="Copy hash to clipboard"></i>
                  </CopyToClipboard>
                </div>
              : ''}
            </td>
          </tr>
        );
      });
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {renderHistory()}
        <HathorAlert id="alert-copied" text="Copied to clipboard!" type="success" />
      </div>
    );
  }
}

export default WalletHistory;