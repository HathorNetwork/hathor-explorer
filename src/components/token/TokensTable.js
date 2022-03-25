import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import TokenRow from './TokenRow';

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
                                <Link to={this} className="page-link">Previous</Link>
                            </li>
                            <li ref="tokenNext" className={(!this.props.hasAfter) ? "page-item disabled" : "page-item"}>
                                <Link to={this} className="page-link">Next</Link>
                            </li>
                        </ul>
                    </nav>
                );
            }
        }

        const loadTableBody = () => {
            return this.props.tokens.map((token, idx) => {
                return (
                    <TokenRow key={token.id} token={token} />
                );
            });
        }

        const loadTable = () => {
            if (this.props.tokens.length === 0) {
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
                                    <th className="d-lg-table-cell">UID</th>
                                    <th className="d-lg-table-cell">Name</th>
                                    <th className="d-lg-table-cell">Symbol</th>
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
