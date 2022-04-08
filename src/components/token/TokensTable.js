import React from 'react';
import PropTypes from 'prop-types';
import TokenRow from './TokenRow';
import Loading from '../Loading';
import colors from '../../index.scss';

class TokensTable extends React.Component {
    render() {
        const loadPagination = () => {
            if (this.props.tokens.length === 0) {
                return null;
            } else {
                return (
                    <nav aria-label="Token pagination" className="d-flex justify-content-center">
                        <ul className="pagination">
                            <li ref="tokenPrevious" className={(!this.props.hasBefore) ? "page-item mr-3 disabled" : "page-item mr-3"}>
                                <button onClick={(e) => this.props.onPreviousPageClicked(e)} className="page-link">Previous</button>
                            </li>
                            <li ref="tokenNext" className={(!this.props.hasAfter) ? "page-item disabled" : "page-item"}>
                                <button onClick={(e) => this.props.onNextPageClicked(e)} className="page-link">Next</button>
                            </li>
                        </ul>
                    </nav>
                );
            }
        }

        const loadTableBody = () => {
            return this.props.tokens.map((token, idx) => {
                return (
                    <TokenRow key={token.uid} token={token} />
                );
            });
        }

        const loadTable = () => {

            const getArrow = (field) => {
                if (field === this.props.sortBy) {
                    if (this.props.order === "asc") {
                        return "↑"
                    }
                    return "↓"
                }
                return ""
            }

            if(this.props.loading) {
                return(
                    <Loading type='spin' color={colors.purpleHathor} delay={500} />
                )
            }
            else if (this.props.tokens.length === 0) {
                return (
                    <div className='col-12'>
                        <span>
                            <i className={`fa fa-frown-o`}></i>
                            <strong> Ops! No tokens matched your query. </strong>
                        </span>
                    </div>
                )
            } else {
                return (
                    <div className="table-responsive col-12 mt-2">
                        <table className="table table-striped" id="tx-table">
                            <thead>
                                <tr>
                                    <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, "uid")}>UID {getArrow("uid")}</th>
                                    <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, "name")}>Name {getArrow("name")}</th>
                                    <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, "symbol")}>Symbol {getArrow("symbol")}</th>
                                    <th className="d-lg-table-cell">Type</th>
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
TokensTable.propTypes = {
    tokens: PropTypes.array.isRequired,
    hasAfter: PropTypes.bool.isRequired,
    hasBefore: PropTypes.bool.isRequired,
}

export default TokensTable;
