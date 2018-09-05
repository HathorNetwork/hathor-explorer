import React from 'react';
import txApi from '../api/txApi';
import ReactLoading from 'react-loading';
import ReactPaginate from 'react-paginate';
import {TX_COUNT} from '../constants';


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
    this.getData = this.getData.bind(this);
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    txApi.getTransactions(this.state.page, TX_COUNT).then((data) => {
      console.log(data);
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

  render() {
    const loadPagination = () => {
      if (this.state.transactions.length === 0 || this.state.totalPages === 1) {
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

    const loadTable = () => {
      return (
        <table>
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
          <tr key={tx.hash}>
            <td className="pr-3">{tx.hash}</td>
            <td className="pr-3">{tx.timestamp}</td>
          </tr>
        );
      });
    }

    return (
      <div className="tab-content-wrapper">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : null}
        {this.state.loaded ? loadTable() : null}
        {loadPagination()}
      </div>
    );
  }
}

export default Transactions;
