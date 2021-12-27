/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import hathorLib from '@hathor/wallet-lib';
import tokenApi from '../api/tokenApi';
import ReactLoading from 'react-loading';
import colors from '../index.scss';


// TODO This component currently has no pagination due to the API that is not ready yet to it.
// That's why we have truncated the data on the API (for now to 200 tokens) until we finish a refactor
// that will add pagination capability on the API. When this is ready we must refactor this component to paginate the data.
//
// TODO We also don't have a new created token ws message to update this page in real time,
// so if we add it on the full node in the future we could improve the UX here.

class TokensList extends React.Component {
  /*
   * tokens {Array} List of token objects {'uid', 'name', 'symbol'} from data arriving in the API
   * truncated {boolean} If data from API was truncated
   * loaded {boolean} If data was loaded from API
   * errorMessage {String} Error message
   */
  state = {
    tokens: [],
    truncated: false,
    loaded: false,
    errorMessage: '',
  }

  componentDidMount() {
    this.updateData();
  }

  /*
   * Call the API of tokens list and update component state with result
   */
  updateData = () => {
    tokenApi.getList().then(response => {
      if (response.success) {
        this.setState({
          tokens: response.tokens,
          truncated: response.truncated,
          loaded: true,
        });
      } else {
        this.setState({ errorMessage: response.message, loaded: true });
      }
    });
  }

  /*
   * Redirect to token detail screen when clicked on the token row
   *
   * @param {String} uid UID of the token clicked
   */
  handleClickTr = (uid) => {
    this.props.history.push(`/token_detail/${uid}`);
  }

  render() {
    const renderList = () => {
      return (
        <div className="table-responsive mt-5">
          {this.state.truncated && <p className="text-warning">You are not seeing all tokens on this list. The data was truncated to {this.state.tokens.length} elements. </p>}
          <table className="table table-striped" id="tx-table">
            <thead>
              <tr>
                <th className="d-none d-lg-table-cell">UID</th>
                <th className="d-none d-lg-table-cell">Name</th>
                <th className="d-none d-lg-table-cell">Symbol</th>
                <th className="d-table-cell d-lg-none" colSpan="2">UID<br/>Name (Symbol)</th>
              </tr>
            </thead>
            <tbody>
              {renderData()}
            </tbody>
          </table>
        </div>
      );
    }

    const renderData = () => {
      return this.state.tokens.map((token, idx) => {
        return renderRow(token, idx);
      });
    }

    const renderRow = (token, idx) => {
      return (
        <tr key={idx} onClick={(e) => this.handleClickTr(token.uid)}>
          <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getShortHash(token.uid)}</td>
          <td className="d-none d-lg-table-cell pr-3">{token.name}</td>
          <td className="d-none d-lg-table-cell pr-3">{token.symbol}</td>
          <td className="d-lg-none d-table-cell pr-3" colSpan="2">{hathorLib.helpers.getShortHash(token.uid)}<br/>{token.name} ({token.symbol})</td>
        </tr>
      )
    }

    return (
      <div className="content-wrapper">
        <div className="w-100">
          <h1>Tokens</h1>
          {!this.state.loaded ? <ReactLoading type='spin' color={colors.purpleHathor} delay={500} /> : renderList()}
          {this.state.errorMessage ? <span className="text-danger">{this.state.errorMessage}</span> : null}
        </div>
      </div>
    );
  }
}

export default TokensList;
