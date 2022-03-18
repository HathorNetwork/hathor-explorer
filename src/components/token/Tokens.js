/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import colors from '../../index.scss';
import TokenRow from './TokenRow';
import {
    shouldRenderCustomTokens
} from '../../feature';

/**
 * Displays custom tokens in a table with pagination buttons and a search bar.
 */
class Tokens extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tokens: [
            ],
            page: 1,
            loaded: true,
            hasAfter: false,
            hasBefore: false,
        }
    }

    render() {
        const loadPagination = () => {
            if (this.state.tokens.length === 0) {
                return null;
            } else {
                return (
                    <nav aria-label="Token pagination" className="d-flex justify-content-center">
                        <ul className="pagination">
                            <li ref="tokenPrevious" className={(!this.state.hasBefore || this.state.tokens.length === 0) ? "page-item mr-3 disabled" : "page-item mr-3"}>
                                <Link to={this} className="page-link">Previous</Link>
                            </li>
                            <li ref="tokenNext" className={(!this.state.hasAfter || this.state.tokens.length === 0) ? "page-item disabled" : "page-item"}>
                                <Link to={this} className="page-link">Next</Link>
                            </li>
                        </ul>
                    </nav>
                );
            }
        }

        const loadTableBody = () => {
            return this.state.tokens.map((token, idx) => {
                return (
                    <TokenRow key={token.id} token={token} />
                );
            });
        }


        const loadTable = () => {
            return (
                <div className="table-responsive mt-2">
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

        const loadSearchField = () => {
            return (
                <div className="d-flex flex-row align-items-center navigation-search-token">
                    <div className="d-flex flex-row align-items-center col-12">
                        <input className="form-control mr-2" type="search" placeholder="Search ID, name, symbol, or type" aria-label="Search" ref="tokenSearch" />
                        <i className="fa fa-search pointer"></i>
                    </div>
                </div>
            )
        }

        return (
            !shouldRenderCustomTokens ? null :
                <div className="w-100">
                    {this.props.title}
                    {loadSearchField()}
                    {!this.state.loaded ? <ReactLoading type='spin' color={colors.purpleHathor} delay={500} /> : loadTable()}
                    {loadPagination()}
                </div>
        )
    }
}

export default Tokens