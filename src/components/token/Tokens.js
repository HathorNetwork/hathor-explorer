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
import tokensApi from '../../api/tokensApi';
import { get, forEach, isNil, last, find, isEmpty } from 'lodash';

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
            searchText: "",
            sortBy: "uid",
            order: "asc",
            page: 1,
            //This variable stores the pages and its searchAfter params that is passed to explorer-service
            pageSearchAfter: [],
            loading: true
        }
    }

    componentDidMount = async() => {
        //"Click" on search to make the first query
        await this.onSearchButtonClicked();
        this.setState({loading: false})
    }

    resetPageSearchAfter = () => {
        this.setState({pageSearchAfter: [
            {
                page: 1,
                searchAfter: []
            }
        ]})
    }

    getTokens = async (searchAfter) => {
        const tokensRequest = await tokensApi.getList(this.state.searchText, this.state.sortBy, this.state.order, searchAfter)
        let tokens = get(tokensRequest, 'data', {hits:[], 'has_next': false})
        forEach(tokens.hits, (token) => {
            if(isNil(token.uid)) {
                token.uid = token.id
            }
            token.type = token.nft ? 'NFT' : 'Custom Token'
        })

        return tokens;
    }

    onSearchButtonClicked = async () => {
        //When search button is clicked, results return to the first page
        this.resetPageSearchAfter();
        const tokens = await this.getTokens([]);

        this.setState({page: 1, tokens: tokens.hits, hasAfter: tokens.has_next, hasBefore: false})
    }

    onSearchTextChanged = (event) => {
        this.setState({ searchText: event.target.value })
    }

    onSearchTextKeyPressed = (event) => {
        if(event.charCode === 13) {
            this.onSearchButtonClicked();
        }
    }

    nextPageClicked = async (event) => {
        const nextPage = this.state.page+1
        let searchAfter = get(find(this.state.pageSearchAfter, {page: nextPage}), 'searchAfter', [])

        //Calculate searchAfter of next page if not already calculated
        if(isEmpty(searchAfter)) {
            const lastCurrentTokenSort = get(last(this.state.tokens), 'sort', []);

            const newEntry = {
                page: nextPage,
                searchAfter: lastCurrentTokenSort
            }

            this.setState({ pageSearchAfter: [...this.state.pageSearchAfter, newEntry]})
            searchAfter = lastCurrentTokenSort
        }

        const tokens = await this.getTokens(searchAfter);
        this.setState({tokens: tokens.hits, hasAfter: tokens.has_next, hasBefore: true, page: nextPage})
    }

    previousPageClicked = async(event) => {
        const previousPage = this.state.page-1;
        const searchAfter = get(find(this.state.pageSearchAfter, {page: previousPage}), 'searchAfter', [])

        const tokens = await this.getTokens(searchAfter);
        this.setState({tokens: tokens.hits, hasAfter: true, hasBefore: previousPage === 1 ? false : true, page: previousPage})
    }

    tableHeaderClicked = async(event, header) => {
        if(header === this.state.sortBy) {
            await this.setState({order: this.state.order === "asc" ? "desc" : "asc"})
        } else {
            await this.setState({sortBy: header})
        }

        await this.onSearchButtonClicked();
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
                        onSearchTextKeyPressed={this.onSearchTextKeyPressed}
                    />
                    <TokensTable
                        tokens={this.state.tokens}
                        hasBefore={this.state.hasBefore}
                        hasAfter={this.state.hasAfter}
                        onNextPageClicked={this.nextPageClicked}
                        onPreviousPageClicked={this.previousPageClicked}
                        loading={this.state.loading}
                        sortBy={this.state.sortBy}
                        order={this.state.order}
                        tableHeaderClicked={this.tableHeaderClicked}
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