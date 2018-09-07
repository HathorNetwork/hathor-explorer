import React from 'react';
import ReactLoading from 'react-loading';
import dateFormatter from '../utils/date';
import walletApi from '../api/wallet';
import ReactPaginate from 'react-paginate';
import {WALLET_HISTORY_COUNT} from '../constants';


class Wallet extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      balance: null,
      address: null,
      history: null,
      loaded: false,
      totalPages: 0,
      page: 1,
    }

    this.getAddress = this.getAddress.bind(this);
    this.sendTokens = this.sendTokens.bind(this);
    this.getHistoryData = this.getHistoryData.bind(this);
  }

  componentWillMount() {
    walletApi.getBalance().then((data) => {
      this.setState({balance: data.balance, loaded: this.state.history !== null})
    }, (e) => {
      // Error in request
      console.log(e);
    });

    this.getHistoryData();
  }

  getHistoryData() {
    walletApi.getHistory(this.state.page, WALLET_HISTORY_COUNT).then((data) => {
      this.setState({history: data.history, loaded: this.state.balance !== null, totalPages: data.total_pages})
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

  sendTokens() {
    this.props.history.push('/wallet/send_tokens');
  }

  getAddress() {
    walletApi.getAddress().then((data) => {
      this.setState({address: data.address})
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {
    const loadPagination = () => {
      if (this.state.history === null || this.state.history.length === 0 || this.state.totalPages === 1) {
        return null;
      } else {
        return (
          <ReactPaginate previousLabel={"Previous"}
             nextLabel={"Next"}
             pageCount={this.state.totalPages}
             marginPagesDisplayed={1}
             pageRangeDisplayed={2}
             onPageChange={this.handlePageClick}
             containerClassName={"pagination justify-content-center"}
             subContainerClassName={"pages pagination"}
             activeClassName={"active"}
             breakClassName="page-item"
             breakLabel={<a className="page-link">...</a>}
             pageClassName="page-item"
             previousClassName="page-item"
             nextClassName="page-item"
             pageLinkClassName="page-link"
             previousLinkClassName="page-link"
             nextLinkClassName="page-link"
             ref={a => this._paginate = a} />
        );
      }
    }

    const renderBalance = () => {
      return (
        <div>
          <p><strong>Balance:</strong> {this.state.balance} hathor{this.state.balance === 1 ? '' : 's'}</p>
        </div>
      );
    }

    const renderWallet = () => {
      return (
        <div>
          {renderBalance()}
          {renderAddress()}
          {renderSendTokensBtn()}
          {renderHistory()}
        </div>
      );
    }

    const renderAddress = () => {
      return (
        <div className="flex flex-row align-items-center new-address-wrapper">
          <button className="btn new-address btn-primary" onClick={this.getAddress}>Get address</button>
          <span>{this.state.address}</span>
        </div>
      )
    }

    const renderHistory = () => {
      return (
        <div className="flex">
          <strong>Transaction history</strong>
          <table className="table table-striped" id="wallet-history">
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
        </div>
      );
    }

    const renderHistoryData = () => {
      return this.state.history.map((tx, idx) => {
        return (
          <tr key={tx.tx_id + tx.index}>
            <td>{tx.from_tx_id ? tx.from_tx_id.substring(0,32) : tx.tx_id.substring(0,32)}</td>
            <td>{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td>{tx.index}{tx.from_index}</td>
            <td>{tx.value}</td>
            <td>{tx.from_tx_id ? tx.tx_id.substring(0,32) : ''}</td>
          </tr>
        );
      });
    }

    const renderSendTokensBtn = () => {
      return (
        <button className="btn send-tokens btn-primary" onClick={this.sendTokens}>Send tokens</button>
      );
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : renderWallet()}
        {loadPagination()}
      </div>
    );
  }
}

export default Wallet;