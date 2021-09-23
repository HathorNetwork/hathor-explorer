/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import $ from 'jquery';
import HathorAlert from '../HathorAlert';
import React from 'react';
import TokenMarkers from '../token/TokenMarkers';
import TxAlerts from './TxAlerts';
import TxMarkers from './TxMarkers';
import Viz from 'viz.js';
import dateFormatter from '../../utils/date';
import hathorLib from '@hathor/wallet-lib';
import helpers from '../../utils/helpers';
import metadataApi from '../../api/metadataApi';
import txApi from '../../api/txApi';
import { BASE_URL, HATHOR_TOKEN_INDEX, HATHOR_TOKEN_CONFIG, MAX_GRAPH_LEVEL } from '../../constants';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom'
import { Module, render } from 'viz.js/full.render.js';


/**
 * Component that renders data of a transaction (used in TransactionDetail and DecodeTx screens)
 *
 * @memberof Components
 */
class TxData extends React.Component {
  /**
   * raw {boolean} if should show raw transaction
   * children {boolean} if should show children (default is hidden but user can show with a click)
   * tokens {Array} tokens contained in this transaction
   * metadataLoaded {boolean} true when all token metadatas are loaded
   */
  state = { raw: false, children: false, tokens: [], metadataLoaded: false };

  // Array of token uid that was already found to show the symbol
  tokensFound = [];

  componentDidMount = () => {
    this.calculateTokens();
    this.updateGraphs();
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.transaction !== this.props.transaction) {
      this.calculateTokens();
      this.updateGraphs();
    }
  }

  /**
   * Returns the url to get the graph for each type
   *
   * @param {string} hash ID of the transaction to get the graph
   * @param {string} type Type of graph to be returned (funds or verification)
   */
  graphURL = (hash, type) => {
    return `${BASE_URL}graphviz/neighbours.dot/?tx=${hash}&graph_type=${type}&max_level=${MAX_GRAPH_LEVEL}`;
  }

  /**
   * Update graphs on the screen to add the ones from the server
   */
  updateGraphs = () => {
    const viz = new Viz({ Module, render });
    const url1 = this.graphURL(this.props.transaction.hash, 'funds');
    const url2 = this.graphURL(this.props.transaction.hash, 'verification');
    txApi.getGraphviz(url1).then((response) => {
      viz.renderSVGElement(response).then((element) => {
        document.getElementById('graph-funds').appendChild(element);
      });
    });

    txApi.getGraphviz(url2).then((response) => {
      viz.renderSVGElement(response).then((element) => {
        document.getElementById('graph-verification').appendChild(element);
      });
    });
  }

  /**
   * Add all tokens of this transaction (inputs and outputs) to the state
   */
  calculateTokens = () => {
    let tokens = this.props.transaction.tokens;

    const metaRequests = tokens.map(token => this.getTokenMetadata(token));

    Promise.all(metaRequests).then((metaResults) => {
      this.setState({ tokens: metaResults, metadataLoaded: true });
    });
  }

  /**
   * Fetch token metadata
   *
   * @param {Object} token Token object to be updated
   */
  getTokenMetadata = (token) => {
    return metadataApi.getDagMetadata(token.uid).then((data) => ({
      ...token,
      meta: data,
    })).catch(err => token);
  }

  /**
   * Show/hide raw transaction in hexadecimal
   *
   * @param {Object} e Event emitted when clicking link
   */
  toggleRaw = (e) => {
    e.preventDefault();
    this.setState({ raw: !this.state.raw }, () => {
      if (this.state.raw) {
        $(this.refs.rawTx).show(300);
      } else {
        $(this.refs.rawTx).hide(300);
      }
    });
  }

  /**
   * Show/hide children of the transaction
   *
   * @param {Object} e Event emitted when clicking link
   */
  toggleChildren = (e) => {
    e.preventDefault();
    this.setState({ children: !this.state.children });
  }

  /**
   * Method called on copy to clipboard success
   * Show alert success message
   *
   * @param {string} text Text copied to clipboard
   * @param {*} result Null in case of error
   */
  copied = (text, result) => {
    if (result) {
      // If copied with success
      this.refs.alertCopied.show(1000);
    }
  }

  /**
   * Get symbol of token from an output gettings its UID from tokenData
   *
   * @param {number} tokenData
   *
   * @return {string} Token symbol
   */
  getOutputToken = (tokenData) => {
    if (tokenData === HATHOR_TOKEN_INDEX) {
      return HATHOR_TOKEN_CONFIG.symbol;
    }
    const tokenConfig = this.props.transaction.tokens[tokenData - 1];
    return tokenConfig.symbol;
  }

  /**
   * Get symbol of token from UID iterating through possible tokens in the transaction
   *
   * @param {string} uid UID of token to get the symbol
   *
   * @return {string} Token symbol
   */
  getSymbol = (uid) => {
    if (uid === HATHOR_TOKEN_CONFIG.uid) {
      return HATHOR_TOKEN_CONFIG.symbol;
    }
    const tokenConfig = this.state.tokens.find((token) => token.uid === uid);
    if (tokenConfig === undefined) return '';
    return tokenConfig.symbol;
  }

  /**
   * Get uid of token from an output token data
   *
   * @param {number} tokenData
   *
   * @return {string} Token uid
   */
  getUIDFromTokenData = (tokenData) => {
    if (tokenData === HATHOR_TOKEN_INDEX) {
      return HATHOR_TOKEN_CONFIG.uid;
    }
    const tokenConfig = this.props.transaction.tokens[tokenData - 1];
    return tokenConfig.uid;
  }

  render() {
    const renderBlockOrTransaction = () => {
      if (hathorLib.helpers.isBlock(this.props.transaction)) {
        return 'block';
      } else {
        return 'transaction';
      }
    }

    const renderInputs = (inputs) => {
      return inputs.map((input, idx) => {
        return (
          <div key={`${input.tx_id}${input.index}`}>
            <Link to={`/transaction/${input.tx_id}`}>{helpers.getShortHash(input.tx_id)}</Link> ({input.index})
            {renderInputOrOutput(input, 0, false)}
          </div>
        );
      });
    }

    const renderOutputToken = (output) => {
      return (
        <strong>{this.getOutputToken(hathorLib.wallet.getTokenIndex(output.token_data))}</strong>
      );
    }

    const outputValue = (output) => {
      if (hathorLib.wallet.isAuthorityOutput(output)) {
        if (hathorLib.wallet.isMintOutput(output)) {
          return 'Mint authority';
        } else if (hathorLib.wallet.isMeltOutput(output)) {
          return 'Melt authority';
        } else {
          // Should never come here
          return 'Unknown authority';
        }
      } else {
        if (!this.state.metadataLoaded) {
          // We show 'Loading' until all metadatas are loaded
          // to prevent switching from decimal to integer if one of the tokens is an NFT
          return 'Loading...';
        }

        // if it's an NFT token we should show integer value
        const uid = this.getUIDFromTokenData(hathorLib.wallet.getTokenIndex(output.token_data));
        const tokenData = this.state.tokens.find((token) => token.uid === uid);
        const isNFT = tokenData && tokenData.meta && tokenData.meta.nft;
        return helpers.renderValue(output.value, isNFT);
      }
    }

    const renderOutputLink = (idx) => {
      if (idx in this.props.spentOutputs) {
        return <span> (<Link to={`/transaction/${this.props.spentOutputs[idx]}`}>Spent</Link>)</span>;
      } else {
        return null;
      }
    }

    const renderInputOrOutput = (output, idx, isOutput) => {
      return (
        <div key={idx}>
          <div>{outputValue(output)} {renderOutputToken(output)}</div>
          <div>
            {renderDecodedScript(output)}
            {isOutput && renderOutputLink(idx)}
          </div>
        </div>
      );
    }

    const renderOutputs = (outputs) => {
      return outputs.map((output, idx) => {
        return renderInputOrOutput(output, idx, true);
      });
    }

    const renderDecodedScript = (output) => {
      switch (output.decoded.type) {
        case 'P2PKH':
        case 'MultiSig':
          return renderP2PKHorMultiSig(output.decoded);
        case 'NanoContractMatchValues':
          return renderNanoContractMatchValues(output.decoded);
        default:
          let script = output.script;
          try {
            script = atob(output.script)
          } catch {}

          return `Unable to decode script: ${script.trim()}`;
      }
    }

    const renderP2PKHorMultiSig = (decoded) => {
      var ret = decoded.address;
      if (decoded.timelock) {
        ret = `${ret} | Locked until ${dateFormatter.parseTimestamp(decoded.timelock)}`
      }
      ret = `${ret} [${decoded.type}]`;
      return ret;
    }

    const renderNanoContractMatchValues = (decoded) => {
      const ret = `Match values (nano contract), oracle id: ${decoded.oracle_data_id} hash: ${decoded.oracle_pubkey_hash}`;
      return ret;
    }

    const renderListWithLinks = (hashes, textDark) => {
      if (hashes.length === 0) {
        return;
      }
      if (hashes.length === 1) {
        const h = hashes[0];
        return <Link className={textDark ? "text-dark" : ""} to={`/transaction/${h}`}> {h} {h === this.props.transaction.hash && ' (Current transaction)'}</Link>;
      }
      const v = hashes.map((h) => <li key={h}><Link className={textDark ? "text-dark" : ""} to={`/transaction/${h}`}>{h} {h === this.props.transaction.hash && ' (Current transaction)'}</Link></li>)
      return (<ul>
        {v}
      </ul>)
    }

    const renderDivList = (hashes) => {
      return hashes.map((h) => <div key={h}><Link to={`/transaction/${h}`}>{helpers.getShortHash(h)}</Link></div>)
    }

    const renderTwins = () => {
      if (!this.props.meta.twins.length) {
        return;
      } else {
        return <div>This transaction has twin {helpers.plural(this.props.meta.twins.length, 'transaction', 'transactions')}: {renderListWithLinks(this.props.meta.twins, true)}</div>
      }
    }

    const renderConflicts = () => {
      let twins = this.props.meta.twins;
      let conflictNotTwin = this.props.meta.conflict_with.length ?
                            this.props.meta.conflict_with.filter(hash => twins.indexOf(hash) < 0) :
                            []
      if (!this.props.meta.voided_by.length) {
        if (!this.props.meta.conflict_with.length) {
          // there are conflicts, but it is not voided
          return (
            <div className="alert alert-success">
              <h4 className="alert-heading mb-0">This {renderBlockOrTransaction()} is valid.</h4>
            </div>
          )
        }

        if (this.props.meta.conflict_with.length) {
          // there are conflicts, but it is not voided
          return (
            <div className="alert alert-success">
              <h4 className="alert-heading">This {renderBlockOrTransaction()} is valid.</h4>
              <p>
                Although there is a double-spending transaction, this transaction has the highest accumulated weight and is valid.
              </p>
              <hr />
              {conflictNotTwin.length > 0 &&
                <div className="mb-0">
                  <span>Transactions double spending the same outputs as this transaction: </span>
                  {renderListWithLinks(conflictNotTwin, true)}
                </div>}
              {renderTwins()}
            </div>
          );
        }
        return;
      }

      if (!this.props.meta.conflict_with.length) {
        // it is voided, but there is no conflict
        return (
          <div className="alert alert-danger">
            <h4 className="alert-heading">This {renderBlockOrTransaction()} is voided and <strong>NOT</strong> valid.</h4>
            <p>
              This {renderBlockOrTransaction()} is verifying (directly or indirectly) a voided double-spending transaction, hence it is voided as well.
            </p>
            <div className="mb-0">
              <span>This {renderBlockOrTransaction()} is voided because of these transactions: </span>
              {renderListWithLinks(this.props.meta.voided_by, true)}
            </div>
          </div>
        )
      }

      // it is voided, and there is a conflict
      return (
        <div className="alert alert-danger">
          <h4 className="alert-heading">This {renderBlockOrTransaction()} is <strong>NOT</strong> valid.</h4>
          <div>
            <span>It is voided by: </span>
            {renderListWithLinks(this.props.meta.voided_by, true)}
          </div>
          <hr />
          {conflictNotTwin.length > 0 &&
            <div className="mb-0">
              <span>Conflicts with: </span>
              {renderListWithLinks(conflictNotTwin, true)}
            </div>}
          {renderTwins()}
        </div>
      )
    }

    const renderGraph = (label, type) => {
      return (
        <div className="mt-3 graph-div" id={`graph-${type}`} key={`graph-${type}-${this.props.transaction.hash}`}>
          <label className="graph-label">{label}:</label>
        </div>
      );
    }

    const renderAccumulatedWeight = () => {
      if (this.props.confirmationData) {
        let acc = helpers.roundFloat(this.props.confirmationData.accumulated_weight);
        if (this.props.confirmationData.accumulated_bigger) {
          return `Over ${acc}`;
        } else {
          return acc;
        }
      } else {
        return 'Retrieving accumulated weight data...';
      }
    }

    const renderHeight = () => {
      return (
        <div>
          <label>Height:</label> {this.props.transaction.height}
        </div>
      );
    }

    const renderScore = () => {
      return (
        <div>
          <label>Score:</label> {helpers.roundFloat(this.props.meta.score)}
        </div>
      );
    }

    const renderTokenList = () => {
      const renderTokenUID = (token) => {
        if (token.uid === hathorLib.constants.HATHOR_TOKEN_CONFIG.uid) {
          return token.uid;
        } else {
          return <Link to={`/token_detail/${token.uid}`}>{token.uid}</Link>
        }
      }
      const tokens = this.state.tokens.map((token) => {
        return (
          <div key={token.uid}>
            <TokenMarkers token={token} /><span>{token.name} <strong>({token.symbol})</strong> | {renderTokenUID(token)}</span>
          </div>
        );
      });
      return (
        <div className="d-flex flex-column align-items-start mb-3 common-div bordered-wrapper">
          <div><label>Tokens:</label></div>
          {tokens}
        </div>
      );
    }

    const renderFirstBlock = () => {
      return (
         <Link to={`/transaction/${this.props.meta.first_block}`}> {helpers.getShortHash(this.props.meta.first_block)}</Link>
      );
    }

    const renderFirstBlockDiv = () => {
      return (
        <div>
          <label>First block:</label>
          {this.props.meta.first_block && renderFirstBlock()}
        </div>
      );
    }

    const renderAccWeightDiv = () => {
      return (
        <div>
          <label>Accumulated weight:</label>
          {renderAccumulatedWeight()}
        </div>
      );
    }

    const renderConfirmationLevel = () => {
      return (
        <div>
          <label>Confirmation level:</label>
          {this.props.confirmationData ? `${helpers.roundFloat(this.props.confirmationData.confirmation_level * 100)}%` : 'Retrieving confirmation level data...'}
        </div>
      );
    }

    const isNFTCreation = () => {
      if (this.props.transaction.version !== hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
        return false;
      }

      const createdToken = this.props.transaction.tokens[0];
      const tokenData = this.state.tokens.find((token) => token.uid === createdToken.uid);
      return tokenData && tokenData.meta && tokenData.meta.nft;
    }

    const loadTxData = () => {
      return (
        <div className="tx-data-wrapper">
          <TxAlerts tokens={this.state.tokens}/>
          {this.props.showConflicts ? renderConflicts() : ''}
          <div><label>{hathorLib.helpers.isBlock(this.props.transaction) ? 'Block' : 'Transaction'} ID:</label> {this.props.transaction.hash}</div>
          <div className="d-flex flex-column flex-lg-row align-items-start mt-3 mb-3">
            <div className="d-flex flex-column align-items-start common-div bordered-wrapper mr-lg-3 w-100">
              <div><label>Type:</label> {hathorLib.helpers.getTxType(this.props.transaction)} {isNFTCreation() && '(NFT)'} <TxMarkers tx={this.props.transaction} /></div>
              <div><label>Time:</label> {dateFormatter.parseTimestamp(this.props.transaction.timestamp)}</div>
              <div><label>Nonce:</label> {this.props.transaction.nonce}</div>
              <div><label>Weight:</label> {helpers.roundFloat(this.props.transaction.weight)}</div>
              {!hathorLib.helpers.isBlock(this.props.transaction) && renderFirstBlockDiv()}
            </div>
            <div className="d-flex flex-column align-items-center important-div bordered-wrapper mt-3 mt-lg-0 w-100">
              {hathorLib.helpers.isBlock(this.props.transaction) && renderHeight()}
              {hathorLib.helpers.isBlock(this.props.transaction) && renderScore()}
              {!hathorLib.helpers.isBlock(this.props.transaction) && renderAccWeightDiv()}
              {!hathorLib.helpers.isBlock(this.props.transaction) && renderConfirmationLevel()}
            </div>
          </div>
          <div className="d-flex flex-column flex-lg-row align-items-start mb-3 w-100">
            <div className="f-flex flex-column align-items-start common-div bordered-wrapper mr-lg-3 w-100">
              <div><label>Inputs ({ this.props.transaction.inputs.length })</label></div>
              {renderInputs(this.props.transaction.inputs)}
            </div>
            <div className="d-flex flex-column align-items-center common-div bordered-wrapper mt-3 mt-lg-0 w-100">
              <div><label>Outputs ({ this.props.transaction.outputs.length })</label></div>
              {renderOutputs(this.props.transaction.outputs)}
            </div>
          </div>
          {this.state.tokens.length > 0 && renderTokenList()}
          <div className="d-flex flex-column flex-lg-row align-items-start mb-3">
            <div className="f-flex flex-column align-items-start common-div bordered-wrapper mr-lg-3 w-100">
              <div><label>Parents:</label></div>
              {renderDivList(this.props.transaction.parents)}
            </div>
            <div className="f-flex flex-column align-items-start common-div bordered-wrapper mt-3 mt-lg-0 w-100">
              <div><label>Children: </label>{this.props.meta.children.length > 0 && <a href="true" className="ml-1" onClick={(e) => this.toggleChildren(e)}>{this.state.children ? 'Click to hide' : 'Click to show'}</a>}</div>
              {this.state.children && renderDivList(this.props.meta.children)}
            </div>
          </div>
          <div className="d-flex flex-column flex-lg-row align-items-start mb-3 common-div bordered-wrapper w-100">
            {this.props.showGraphs && renderGraph('Verification neighbors', 'verification')}
          </div>
          <div className="d-flex flex-column flex-lg-row align-items-start mb-3 common-div bordered-wrapper w-100">
            {this.props.showGraphs && renderGraph('Funds neighbors', 'funds')}
          </div>
          <div className="d-flex flex-column flex-lg-row align-items-start mb-3 common-div bordered-wrapper w-100">
            {this.props.showRaw ? showRawWrapper() : null}
          </div>
        </div>
      );
    }

    const showRawWrapper = () => {
      return (
        <div className="mt-3 mb-3">
          <a href="true" onClick={(e) => this.toggleRaw(e)}>{this.state.raw ? 'Hide raw transaction' : 'Show raw transaction'}</a>
          {this.state.raw ?
            <CopyToClipboard text={this.props.transaction.raw} onCopy={this.copied}>
              <i className="fa fa-clone pointer ml-1" title="Copy raw tx to clipboard"></i>
            </CopyToClipboard>
          : null}
          <p className="mt-3" ref="rawTx" style={{display: 'none'}}>{this.props.transaction.raw}</p>
        </div>
      );
    }

    return (
      <div>
        {loadTxData()}
        <HathorAlert ref="alertCopied" text="Copied to clipboard!" type="success" />
      </div>
    );
  }
}

export default TxData;
