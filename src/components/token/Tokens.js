/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import TokensTable from './TokensTable';
import TokenSearchField from './TokenSearchField';
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
            tokens: [],
            hasAfter: false,
            hasBefore: false,
            searchText: ""
        }
    }

    onSearchButtonClicked = () => {
        // TODO: Implement behavior when search button is clicked
    }

    onSearchTextChanged = (event) => {
        this.setState({ searchText: event.target.value })
    }

    render() {
        return (
            !shouldRenderCustomTokens ? null :
                <div className="w-100">
                    <div className='col-12'>
                        <h1>{this.props.title}</h1>
                    </div>
                    <TokenSearchField
                        onSearchButtonClicked={this.onSearchButtonClicked}
                        onSearchTextChanged={this.onSearchTextChanged}
                        searchText={this.state.searchText}
                    />
                    <TokensTable
                        tokens={this.state.tokens}
                        hasBefore={this.state.hasBefore}
                        hasAfter={this.state.hasAfter}
                    />
                </div>
        )
    }
}

/**
 * title: Tokens Page title
 */
Tokens.propTypes = {
    title: PropTypes.string.isRequired,
};


export default Tokens