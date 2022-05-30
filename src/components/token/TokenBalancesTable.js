import React from 'react';
import PropTypes from 'prop-types';
import TokenBalanceRow from './TokenBalanceRow';
import Loading from '../Loading';
import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon';

class TokenBalancesTable extends React.Component {
  constructor() {
    super();
    this.state = {
      tokenId: '',
    };
  }

  render() {
    const loadPagination = () => {
      if (this.props.tokenBalances.length === 0) {
        return null;
      } else {
        return (
          <div className="d-flex col-sm-12">
            <nav aria-label="Token pagination" className="d-flex offset-sm-4 col-sm-4 justify-content-center">
                <ul className="pagination">
                    <li ref="tokenPrevious" className={(!this.props.hasBefore || this.props.calculatingPage) ? "page-item mr-3 disabled" : "page-item mr-3"}>
                      <button onClick={(e) => this.props.onPreviousPageClicked(e)} className="page-link">Previous</button>
                    </li>
                    <li ref="tokenNext" className={(!this.props.hasAfter || this.props.calculatingPage) ? "page-item disabled" : "page-item"}>
                      <button onClick={(e) => this.props.onNextPageClicked(e)} className="page-link">Next</button>
                    </li>
                </ul>
            </nav>
            <div className="d-flex col-sm-4 page-loader">
              {this.props.calculatingPage ? <Loading width={35} height={35} useLoadingWrapper={false} showSlowLoadMessage={false} /> : null}
            </div>
          </div>
        );
      }
    };

    const loadTableBody = () => {
      return this.props.tokenBalances.map((tokenBalance) => {
        return (
          <TokenBalanceRow
            address={tokenBalance.address}
            unlocked={tokenBalance.unlocked_balance}
            locked={tokenBalance.locked_balance}
            total={tokenBalance.total}
            tokenId={this.state.tokenId} />
        );
      });
    }

    const loadTable = () => {
        const getArrow = (field) => {
          if (field === this.props.sortBy) {
            if (this.props.order === 'asc') {
              return '↑';
            }
            return '↓';
          }
          return '';
        }

        if (this.props.loading) {
          return (
            <Loading />
          );
        }
        else if (this.props.tokenBalances.length === 0) {
          return (
            <ErrorMessageWithIcon message="Ops! No balancces matched your query." />
          );
        } else {
            return (
              <div className="table-responsive col-12 mt-2">
                <table className="table table-striped" id="tx-table">
                  <thead>
                    <tr>
                      <th className="d-lg-table-cell">
                        Address 
                      </th>
                      <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, "total")}>
                        Total {getArrow("total")}
                      </th>
                      <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, "unlocked_balance")}>
                        Unlocked {getArrow("unlocked_balance")}
                      </th>
                      <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, "locked_balance")}>
                        Locked {getArrow("locked_balance")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadTableBody()}
                  </tbody>
                </table>
              </div>
          );
        }
    }

    return (
      <>
        {loadTable()}
        {loadPagination()}
      </>
    );
  }
}
/**
 * tokens: Array of tokens to show at the moment
 * hasAfter: Indicates if there is a next page for user to navigate
 * hasBefore: Indicates if there is a previous page for user to navigate
 */
TokenBalancesTable.propTypes = {
  tokens: PropTypes.array.isRequired,
  hasAfter: PropTypes.bool.isRequired,
  hasBefore: PropTypes.bool.isRequired,
}

export default TokenBalancesTable;
