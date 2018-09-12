import React from 'react';
import dateFormatter from '../utils/date';
import walletApi from '../api/wallet';
import HathorPaginate from '../components/HathorPaginate';
import {WALLET_HISTORY_COUNT} from '../constants';


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
                <th>Spent</th>
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
            <td>{tx.from_tx_id ? tx.from_tx_id.substring(0,32) : tx.tx_id.substring(0,32)}<br/>{tx.from_tx_id ? tx.from_tx_id.substring(32,64) : tx.tx_id.substring(32,64)}</td>
            <td>{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td>{tx.index}{tx.from_index}</td>
            <td>{tx.value}</td>
            <td>{tx.from_tx_id ? tx.tx_id.substring(0,32) : ''}</td>
          </tr>
        );
      });
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {renderHistory()}
      </div>
    );
  }
}

export default WalletHistory;