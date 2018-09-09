import React from 'react';
import txApi from '../api/txApi';
import ReactLoading from 'react-loading';
import HathorPaginate from '../components/HathorPaginate';
import {TX_COUNT} from '../constants';
import dateFormatter from '../utils/date';
import { withRouter } from "react-router-dom";


class Transactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      transactions: [],
      totalPages: 0,
      page: 1,
      loaded: false
    }

    this.handlePageClick = this.handlePageClick.bind(this);
    this.handleClickTr = this.handleClickTr.bind(this);
    this.getData = this.getData.bind(this);
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    txApi.getTransactions(this.state.page, TX_COUNT).then((data) => {
      this.setState({ transactions: data.transactions, loaded: true, totalPages: data.total_pages });
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  handlePageClick = (data) => {
    let selected = data.selected;
    let page = selected + 1;

    this.setState({ page: page }, () => {
      // TODO Update url parameter
      this.getData();
    });
  }

  handleClickTr = (hash) => {
    this.props.history.push(`/transaction/${hash}`);
  }

  render() {
    const loadPagination = () => {
      if (this.state.transactions.length === 0 || this.state.totalPages === 1) {
        return null;
      } else {
        return (
          <HathorPaginate pageCount={this.state.totalPages}
            onPageChange={this.handlePageClick} />
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
              <th>Type</th>
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
          <tr key={tx.hash} onClick={(e) => this.handleClickTr(tx.hash)}>
            <td className="pr-3">{tx.hash}</td>
            <td className="pr-3">{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td className="pr-3">{tx.inputs.length ? 'Tx' : 'Block'}</td>
          </tr>
        );
      });
    }

    return (
      <div className="tab-content-wrapper">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : loadTable()}
        {loadPagination()}
      </div>
    );
  }
}

export default withRouter(Transactions);
