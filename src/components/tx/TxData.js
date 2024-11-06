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
import graphvizApi from '../../api/graphvizApi';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import { Module, render } from 'viz.js/full.render.js';
import Loading from '../Loading';
import FeatureDataRow from '../feature_activation/FeatureDataRow';
import featureApi from '../../api/featureApi';
import { connect } from 'react-redux';
import { get, upperFirst } from 'lodash';
import HathorSnackbar from '../HathorSnackbar';
import { DropDetails } from '../DropDetails';
import { ReactComponent as Copy } from '../../assets/images/copy-icon.svg';
import { ReactComponent as ValidIcon } from '../../assets/images/success-icon.svg';
import { ReactComponent as RowDown } from '../../assets/images/chevron-down.svg';

const mapStateToProps = state => ({
  nativeToken: state.serverInfo.native_token,
  decimalPlaces: state.serverInfo.decimal_places,
});

/**
 * Component that renders data of a transaction (used in TransactionDetail and DecodeTx screens)
 *
 * @memberof Components
 */
class TxData extends React.Component {
  /**
   * Base states of a graph
   */
  baseItemGraph = {
    calculatedNeighbors: false,
    showNeighbors: false,
    graphLoading: false,
  };

  /**
   * raw {boolean} if should show raw transaction
   * children {boolean} if should show children (default is hidden but user can show with a click)
   * tokens {Array} tokens contained in this transaction
   * metadataLoaded {boolean} true when all token metadatas are loaded
   * graphs {array} hold all states that a graph needs
   */
  state = {
    raw: false,
    children: false,
    tokens: [],
    metadataLoaded: false,
    showFeatureActivation: false,
    loadedSignalBits: false,
    signalBits: [],
    graphs: [
      {
        name: 'verification',
        label: 'Verification neighbors',
        ...this.baseItemGraph,
      },
      {
        name: 'funds',
        label: 'Funds neighbors',
        ...this.baseItemGraph,
      },
    ],
    ncDeserializer: null,
    ncLoading: false,
  };

  // Array of token uid that was already found to show the symbol
  tokensFound = [];

  snackbarRef = React.createRef();

  componentDidMount = async () => {
    await this.handleDataFetch();
  };

  componentDidUpdate = async prevProps => {
    if (prevProps.transaction !== this.props.transaction) {
      await this.handleDataFetch();
    }
  };

  handleDataFetch = async () => {
    this.calculateTokens();
    await this.handleNanoContractFetch();
  };

  handleNanoContractFetch = async () => {
    if (this.props.transaction.version !== hathorLib.constants.NANO_CONTRACTS_VERSION) {
      this.setState({ ncLoading: false });
      return;
    }

    this.setState({ ncLoading: true });

    const network = hathorLib.config.getNetwork();
    const ncData = this.props.transaction;
    const deserializer = new hathorLib.NanoContractTransactionParser(
      ncData.nc_blueprint_id,
      ncData.nc_method,
      ncData.nc_pubkey,
      network,
      ncData.nc_args
    );
    deserializer.parseAddress();
    await deserializer.parseArguments();
    this.setState({ ncDeserializer: deserializer, ncLoading: false });
  };

  /**
   * Add all tokens of this transaction (inputs and outputs) to the state
   */
  calculateTokens = () => {
    let tokens = this.props.transaction.tokens;

    const metaRequests = tokens.map(token => this.getTokenMetadata(token));

    Promise.all(metaRequests).then(metaResults => {
      this.setState({ tokens: metaResults, metadataLoaded: true });
    });
  };

  getNativeToken = () => {
    const nativeToken = this.props.nativeToken;
    return { ...nativeToken, uid: hathorLib.constants.NATIVE_TOKEN_UID };
  };

  /**
   * Fetch token metadata
   *
   * @param {Object} token Token object to be updated
   */
  getTokenMetadata = token => {
    return metadataApi
      .getDagMetadata(token.uid)
      .then(data => ({
        ...token,
        meta: data,
      }))
      .catch(err => token);
  };

  /**
   * Show/hide raw transaction in hexadecimal
   *
   * @param {Object} e Event emitted when clicking link
   */
  toggleRaw = e => {
    this.props.newUiEnabled === false && e.preventDefault();
    this.setState({ raw: !this.state.raw }, () => {
      if (this.state.raw) {
        $(this.refs.rawTx).show(300);
      } else {
        $(this.refs.rawTx).hide(300);
      }
    });
  };

  /**
   * Show/hide children of the transaction
   *
   * @param {Object} e Event emitted when clicking link
   */
  toggleChildren = e => {
    e.preventDefault();
    this.setState({ children: !this.state.children });
  };

  /**
   * Show/hide Feature Activation of the transaction
   *
   * @param {Object} e Event emitted when clicking link
   */
  toggleFeatureActivation = async e => {
    e.preventDefault();
    this.setState({ showFeatureActivation: !this.state.showFeatureActivation });

    if (!this.state.loadedSignalBits) {
      const signalBits = (await featureApi.getSignalBits(this.props.transaction.hash)) || [];
      this.setState({ signalBits, loadedSignalBits: true });
    }
  };

  /**
   * Given a graph type, it calculates the DAG (verification or funds) and renders into the HTML element
   *
   * @param {string} graphType
   */
  calculateNeighborsGraph = async graphType => {
    const viz = new Viz({ Module, render });

    const graphvizResponse = await graphvizApi.dotNeighbors(this.props.transaction.hash, graphType);
    const element = await viz.renderSVGElement(graphvizResponse);

    element.id = `graph-${graphType}-data`;
    document.getElementById(`graph-${graphType}`).appendChild(element);
  };

  /**
   * Handle all the necessary events to perform the graph toggle event
   *
   * @param {e} e Event emitted when clicking the link
   * @param {number} index Index of the graph that will be toggled
   */
  toggleGraph = async (e, index) => {
    e.preventDefault();

    let graphs = [...this.state.graphs];
    graphs[index].showNeighbors = !graphs[index].showNeighbors;

    this.setState({ graphs });

    // Check if graph needs to be calculated before showing
    if (!graphs[index].calculatedNeighbors && !graphs[index].graphLoading) {
      graphs[index].graphLoading = true;
      this.setState({ graphs });

      // Make the necessary requests to calculate the graph
      await this.calculateNeighborsGraph(graphs[index].name);

      // Update graph status
      graphs[index].calculatedNeighbors = true;
      graphs[index].graphLoading = false;
      this.setState({ graphs });
    }
  };

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
      this.props.newUiEnabled
        ? this.snackbarRef.current.show(1000)
        : this.refs.alertCopied.show(1000);
    }
  };

  /**
   * Get symbol of token from an output gettings its UID from tokenData
   *
   * @param {number} tokenData
   *
   * @return {string} Token symbol
   */
  getOutputToken = tokenData => {
    if (tokenData === hathorLib.constants.HATHOR_TOKEN_INDEX) {
      return this.getNativeToken().symbol;
    }
    const tokenConfig = this.props.transaction.tokens[tokenData - 1];
    return tokenConfig.symbol;
  };

  /**
   * Get symbol of token from UID iterating through possible tokens in the transaction
   *
   * @param {string} uid UID of token to get the symbol
   *
   * @return {string} Token symbol
   */
  getSymbol = uid => {
    if (uid === hathorLib.constants.NATIVE_TOKEN_UID) {
      return this.getNativeToken().symbol;
    }
    const tokenConfig = this.state.tokens.find(token => token.uid === uid);
    if (tokenConfig === undefined) return '';
    return tokenConfig.symbol;
  };

  /**
   * Get uid of token from an output token data
   *
   * @param {number} tokenData
   *
   * @return {string} Token uid
   */
  getUIDFromTokenData = tokenData => {
    if (tokenData === hathorLib.constants.HATHOR_TOKEN_INDEX) {
      return hathorLib.constants.NATIVE_TOKEN_UID;
    }
    const tokenConfig = this.props.transaction.tokens[tokenData - 1];
    return tokenConfig.uid;
  };

  render() {
    const renderBlockOrTransaction = () => {
      if (hathorLib.transactionUtils.isBlock(this.props.transaction)) {
        return 'block';
      } else {
        return 'transaction';
      }
    };

    const renderInputs = inputs => {
      return inputs.map((input, idx) => {
        return (
          <div key={`${input.tx_id}${input.index}`}>
            <Link to={`/transaction/${input.tx_id}`}>{helpers.getShortHash(input.tx_id)}</Link> (
            {input.index}){renderInputOrOutput(input, 0, false)}
          </div>
        );
      });
    };

    const renderOutputToken = output => {
      return (
        <strong>
          {this.getOutputToken(hathorLib.tokensUtils.getTokenIndexFromData(output.token_data))}
        </strong>
      );
    };

    const outputValue = output => {
      if (hathorLib.transactionUtils.isAuthorityOutput(output)) {
        if (hathorLib.transactionUtils.isMint(output)) {
          return 'Mint authority';
        } else if (hathorLib.transactionUtils.isMelt(output)) {
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
        const uid = this.getUIDFromTokenData(
          hathorLib.tokensUtils.getTokenIndexFromData(output.token_data)
        );
        const tokenData = this.state.tokens.find(token => token.uid === uid);
        const isNFT = tokenData && tokenData.meta && tokenData.meta.nft;
        return hathorLib.numberUtils.prettyValue(
          output.value,
          isNFT ? 0 : this.props.decimalPlaces
        );
      }
    };

    const renderOutputLink = idx => {
      if (idx in this.props.spentOutputs) {
        return (
          <span>
            {' '}
            (<Link to={`/transaction/${this.props.spentOutputs[idx]}`}>Spent</Link>)
          </span>
        );
      } else {
        return null;
      }
    };

    const renderInputOrOutput = (output, idx, isOutput) => {
      return (
        <div key={idx}>
          <div>
            {outputValue(output)} {renderOutputToken(output)}
          </div>
          <div>
            {renderDecodedScript(output)}
            {isOutput && renderOutputLink(idx)}
          </div>
        </div>
      );
    };

    const renderOutputs = outputs => {
      return outputs.map((output, idx) => {
        return renderInputOrOutput(output, idx, true);
      });
    };

    const renderDecodedScript = output => {
      switch (output.decoded.type) {
        case 'P2PKH':
        case 'MultiSig':
          return renderP2PKHorMultiSig(output.decoded);
        default:
          let script = output.script;
          // Try to parse as script data
          try {
            // The output script is decoded to base64 in the full node
            // before returning as response to the explorer in the API
            // and the lib expects a buffer (bytes)
            // In the future we must receive from the full node
            // the decoded.type as script data but this still needs
            // some refactor there that won't happen soon
            const buff = new Buffer.from(script, 'base64');
            const parsedData = hathorLib.scriptsUtils.parseScriptData(buff);
            return renderDataScript(parsedData.data);
          } catch (e) {
            if (!(e instanceof hathorLib.errors.ParseScriptError)) {
              // Parse script error is the expected error in case the output script
              // is not a script data. If we get another error here, we should at least log it
              console.log('Unexpected error', e);
            }
          }

          try {
            script = atob(output.script);
          } catch {}

          return `Unable to decode script: ${script.trim()}`;
      }
    };

    const renderDataScript = data => {
      return `${data} [Data]`;
    };

    const renderP2PKHorMultiSig = decoded => {
      var ret = decoded.address;
      if (decoded.timelock) {
        ret = `${ret} | Locked until ${dateFormatter.parseTimestamp(decoded.timelock)}`;
      }
      ret = `${ret} [${decoded.type}]`;
      return ret;
    };

    const renderListWithLinks = (hashes, textDark) => {
      if (hashes.length === 0) {
        return;
      }
      if (hashes.length === 1) {
        const h = hashes[0];
        return (
          <Link className={textDark ? 'text-dark' : ''} to={`/transaction/${h}`}>
            {' '}
            {h} {h === this.props.transaction.hash && ' (Current transaction)'}
          </Link>
        );
      }
      const v = hashes.map(h => (
        <li key={h}>
          <Link className={textDark ? 'text-dark' : ''} to={`/transaction/${h}`}>
            {h} {h === this.props.transaction.hash && ' (Current transaction)'}
          </Link>
        </li>
      ));
      return <ul>{v}</ul>;
    };

    const renderDivList = hashes => {
      return hashes.map(h => (
        <div key={h}>
          <Link to={`/transaction/${h}`}>{helpers.getShortHash(h)}</Link>
        </div>
      ));
    };

    const renderNewUiDivList = hashes => {
      return (
        <table className="table-details">
          {hashes.map(h => (
            <tr className="tr-details" key={h}>
              <td>
                <Link to={`/transaction/${h}`}>{h}</Link>
              </td>
            </tr>
          ))}
        </table>
      );
    };

    const renderTwins = () => {
      if (!this.props.meta.twins.length) {
        return;
      } else {
        return (
          <div>
            This transaction has twin{' '}
            {helpers.plural(this.props.meta.twins.length, 'transaction', 'transactions')}:{' '}
            {renderListWithLinks(this.props.meta.twins, true)}
          </div>
        );
      }
    };

    const renderConflicts = () => {
      let twins = this.props.meta.twins;
      let conflictNotTwin = this.props.meta.conflict_with.length
        ? this.props.meta.conflict_with.filter(hash => twins.indexOf(hash) < 0)
        : [];
      if (!this.props.meta.voided_by.length) {
        if (!this.props.meta.conflict_with.length) {
          // there are conflicts, but it is not voided
          return (
            <div className="alert alert-success">
              <h4 className="alert-heading mb-0">This {renderBlockOrTransaction()} is valid.</h4>
            </div>
          );
        }

        if (this.props.meta.conflict_with.length) {
          // there are conflicts, but it is not voided
          return (
            <div className="alert alert-success">
              <h4 className="alert-heading">This {renderBlockOrTransaction()} is valid.</h4>
              <p>
                Although there is a double-spending transaction, this transaction has the highest
                accumulated weight and is valid.
              </p>
              <hr />
              {conflictNotTwin.length > 0 && (
                <div className="mb-0">
                  <span>Transactions double spending the same outputs as this transaction: </span>
                  {renderListWithLinks(conflictNotTwin, true)}
                </div>
              )}
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
            <h4 className="alert-heading">
              This {renderBlockOrTransaction()} is voided and <strong>NOT</strong> valid.
            </h4>
            <p>
              This {renderBlockOrTransaction()} is verifying (directly or indirectly) a voided
              double-spending transaction, hence it is voided as well.
            </p>
            <div className="mb-0">
              <span>
                This {renderBlockOrTransaction()} is voided because of these transactions:{' '}
              </span>
              {renderListWithLinks(this.props.meta.voided_by, true)}
            </div>
          </div>
        );
      }

      // it is voided, and there is a conflict
      return (
        <div className="alert alert-danger">
          <h4 className="alert-heading">
            This {renderBlockOrTransaction()} is <strong>NOT</strong> valid.
          </h4>
          <div>
            <span>It is voided by: </span>
            {renderListWithLinks(this.props.meta.voided_by, true)}
          </div>
          <hr />
          {conflictNotTwin.length > 0 && (
            <div className="mb-0">
              <span>Conflicts with: </span>
              {renderListWithLinks(conflictNotTwin, true)}
            </div>
          )}
          {renderTwins()}
        </div>
      );
    };

    const renderNewUiConflicts = () => {
      let twins = this.props.meta.twins;
      let conflictNotTwin = this.props.meta.conflict_with.length
        ? this.props.meta.conflict_with.filter(hash => twins.indexOf(hash) < 0)
        : [];
      if (!this.props.meta.voided_by.length) {
        if (!this.props.meta.conflict_with.length) {
          // there are conflicts, but it is not voided
          return (
            <div className=" alert-success-container">
              <ValidIcon width="14px" />
              <span className="alert-success-text">
                This {renderBlockOrTransaction()} is valid.
              </span>
            </div>
          );
        }

        if (this.props.meta.conflict_with.length) {
          // there are conflicts, but it is not voided
          return (
            <div className="alert alert-success-container">
              <h4 className="alert-heading">This {renderBlockOrTransaction()} is valid.</h4>
              <p>
                Although there is a double-spending transaction, this transaction has the highest
                accumulated weight and is valid.
              </p>
              <hr />
              {conflictNotTwin.length > 0 && (
                <div className="mb-0">
                  <span>Transactions double spending the same outputs as this transaction: </span>
                  {renderListWithLinks(conflictNotTwin, true)}
                </div>
              )}
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
            <h4 className="alert-heading">
              This {renderBlockOrTransaction()} is voided and <strong>NOT</strong> valid.
            </h4>
            <p>
              This {renderBlockOrTransaction()} is verifying (directly or indirectly) a voided
              double-spending transaction, hence it is voided as well.
            </p>
            <div className="mb-0">
              <span>
                This {renderBlockOrTransaction()} is voided because of these transactions:{' '}
              </span>
              {renderListWithLinks(this.props.meta.voided_by, true)}
            </div>
          </div>
        );
      }

      // it is voided, and there is a conflict
      return (
        <div className="alert alert-danger">
          <h4 className="alert-heading">
            This {renderBlockOrTransaction()} is <strong>NOT</strong> valid.
          </h4>
          <div>
            <span>It is voided by: </span>
            {renderListWithLinks(this.props.meta.voided_by, true)}
          </div>
          <hr />
          {conflictNotTwin.length > 0 && (
            <div className="mb-0">
              <span>Conflicts with: </span>
              {renderListWithLinks(conflictNotTwin, true)}
            </div>
          )}
          {renderTwins()}
        </div>
      );
    };

    const renderGraph = graphIndex => {
      return (
        <div
          key={graphIndex}
          className="d-flex flex-column flex-lg-row align-items-start mb-3 common-div bordered-wrapper w-100"
        >
          <div
            className="mt-3 graph-div"
            key={`graph-${this.state.graphs[graphIndex].name}-${this.props.transaction.hash}`}
          >
            <label className="graph-label">{this.state.graphs[graphIndex].label}:</label>
            {this.props.transaction.parents && this.props.transaction.parents.length ? (
              <a href="true" className="ms-1" onClick={e => this.toggleGraph(e, graphIndex)}>
                {this.state.graphs[graphIndex].showNeighbors ? 'Click to hide' : 'Click to show'}
              </a>
            ) : null}
            <div
              className={this.state.graphs[graphIndex].showNeighbors ? undefined : 'd-none'}
              id={`graph-${this.state.graphs[graphIndex].name}`}
            ></div>
            {this.state.graphs[graphIndex].graphLoading ? <Loading /> : null}
          </div>
        </div>
      );
    };

    const renderNewUiGraph = graphIndex => {
      return (
        <div key={graphIndex} className="container-drop-div">
          <div key={`graph-${this.state.graphs[graphIndex].name}-${this.props.transaction.hash}`}>
            <div className="container-drop-header" onClick={e => this.toggleGraph(e, graphIndex)}>
              <label className="container-drop-header-title">
                {this.state.graphs[graphIndex].label}:
              </label>
              {this.props.transaction.parents && this.props.transaction.parents.length ? (
                <a className="arrow-graph" href="true">
                  <RowDown
                    className="drop-arrow-color"
                    width="24px"
                    height="24px"
                    style={{
                      transform: `${
                        this.state.graphs[graphIndex].showNeighbors ? 'rotate(180deg)' : ''
                      }`,
                    }}
                  />
                </a>
              ) : null}
            </div>
            <div
              className={this.state.graphs[graphIndex].showNeighbors ? '' : 'd-none'}
              id={`graph-${this.state.graphs[graphIndex].name}`}
            ></div>
            {this.state.graphs[graphIndex].graphLoading ? <Loading /> : null}
          </div>
        </div>
      );
    };

    const renderAccumulatedWeight = () => {
      if (this.props.confirmationData) {
        if (!this.props.confirmationData.success) {
          return 'Not available';
        }
        let acc = helpers.roundFloat(this.props.confirmationData.accumulated_weight);
        if (this.props.confirmationData.accumulated_bigger) {
          return `Over ${acc}`;
        } else {
          return acc;
        }
      } else {
        return 'Retrieving accumulated weight data...';
      }
    };

    const renderHeight = () => {
      return (
        <div className="summary-balance-info-container">
          <label className="address-container-title">Height:</label> {this.props.transaction.height}
        </div>
      );
    };

    const renderScore = () => {
      return (
        <div className="summary-balance-info-container">
          <label className="address-container-title">Score:</label>{' '}
          {helpers.roundFloat(this.props.meta.score)}
        </div>
      );
    };

    const renderTokenList = () => {
      const renderTokenUID = token => {
        if (token.uid === hathorLib.constants.NATIVE_TOKEN_UID) {
          return token.uid;
        } else {
          return <Link to={`/token_detail/${token.uid}`}>{token.uid}</Link>;
        }
      };
      const tokens = this.state.tokens.map(token => {
        return (
          <div key={token.uid}>
            <TokenMarkers token={token} />
            <span>
              {token.name} <strong>({token.symbol})</strong> | {renderTokenUID(token)}
            </span>
          </div>
        );
      });
      return (
        <div className="d-flex flex-column align-items-start mb-3 common-div bordered-wrapper">
          <div>
            <label>Tokens:</label>
          </div>
          {tokens}
        </div>
      );
    };

    const renderFirstBlock = () => {
      return (
        <Link to={`/transaction/${this.props.meta.first_block}`}>
          {' '}
          {helpers.getShortHash(this.props.meta.first_block)}
        </Link>
      );
    };

    const renderFirstBlockDiv = () => {
      return (
        <div className="summary-balance-info-container">
          <label className="address-container-title">First block:</label>
          {this.props.meta.first_block && renderFirstBlock()}
        </div>
      );
    };

    const renderAccWeightDiv = () => {
      return (
        <div className="summary-balance-info-container">
          <label className="address-container-title">Accumulated weight:</label>
          {renderAccumulatedWeight()}
        </div>
      );
    };

    const renderConfirmationLevel = () => {
      function getConfirmationMessage(data) {
        if (!data) {
          return 'Retrieving confirmation level data...';
        }
        if (!data.success) {
          return 'Not available';
        }

        return `${helpers.roundFloat(data.confirmation_level * 100)}%`;
      }
      return (
        <div className="summary-balance-info-container">
          <label className="address-container-title">Confirmation level:</label>
          {getConfirmationMessage(this.props.confirmationData)}
        </div>
      );
    };

    const renderNCActionsList = () => {
      return this.props.transaction.nc_context.actions.map((action, index) => (
        <div key={index} className="d-flex flex-column align-items-start">
          <div>
            <label>Type:</label> {upperFirst(action.type)}
          </div>
          <div>
            <label>Amount:</label>{' '}
            {hathorLib.numberUtils.prettyValue(action.amount, this.props.decimalPlaces)}{' '}
            {this.getSymbol(action.token_uid)}
          </div>
        </div>
      ));
    };

    const renderNCActions = () => {
      const actionsCount = get(this.props.transaction, 'nc_context.actions.length', 0);
      return (
        <div className="d-flex flex-column align-items-start common-div bordered-wrapper me-3">
          <div>
            <label>Actions ({actionsCount})</label>
          </div>
          {actionsCount > 0 && renderNCActionsList()}
        </div>
      );
    };

    const renderNCData = () => {
      if (this.state.ncLoading) {
        return (
          <div className="d-flex flex-column align-items-start common-div bordered-wrapper">
            <div>
              <label>Loading nano contract data...</label>
            </div>
          </div>
        );
      }
      const deserializer = this.state.ncDeserializer;
      if (!deserializer) {
        // This should never happen
        return null;
      }
      return (
        <div className="d-flex flex-column align-items-start common-div bordered-wrapper me-3">
          <div>
            <label>Nano Contract ID:</label>{' '}
            <Link to={`/nano_contract/detail/${this.props.transaction.nc_id}`}>
              {' '}
              {this.props.transaction.nc_id}
            </Link>
          </div>
          <div>
            <label>Address used to sign:</label> {deserializer.address.base58}
          </div>
          <div>
            <label>Method:</label> {this.props.transaction.nc_method}
          </div>
          <div>
            <label>Arguments:</label> {renderNCArguments(deserializer.parsedArgs)}
          </div>
        </div>
      );
    };

    const renderNCArguments = args => {
      if (!Array.isArray(args) || args.length === 0) {
        return ' - ';
      }

      return args.map(arg => (
        <div key={arg.name}>
          <label>{arg.name}:</label> {renderArgValue(arg)}
        </div>
      ));
    };

    const renderArgValue = arg => {
      const typeBytesOrigin = ['bytes', 'TxOutputScript', 'TokenUid', 'VertexId', 'ContractId'];
      if (typeBytesOrigin.includes(arg.type)) {
        return arg.parsed.toString('hex');
      }

      if (arg.type === 'Timestamp') {
        return dateFormatter.parseTimestamp(arg.parsed);
      }

      if (arg.type === 'Amount') {
        return hathorLib.numberUtils.prettyValue(arg.parsed, this.props.decimalPlaces);
      }

      return arg.parsed;
    };

    const isNFTCreation = () => {
      if (this.props.transaction.version !== hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
        return false;
      }

      const createdToken = this.props.transaction.tokens[0];
      const tokenData = this.state.tokens.find(token => token.uid === createdToken.uid);
      return tokenData && tokenData.meta && tokenData.meta.nft;
    };

    const renderFeatureActivation = () => {
      return (
        <div className="d-flex flex-column flex-lg-row align-items-start mb-3 common-div bordered-wrapper w-100">
          <div className="mt-3 graph-div" key="feature-activation">
            <label className="graph-label">Feature Activation:</label>
            <a href="true" className="ms-1" onClick={e => this.toggleFeatureActivation(e)}>
              {this.state.showFeatureActivation ? 'Click to hide' : 'Click to show'}
            </a>
            {this.state.showFeatureActivation &&
              this.state.loadedSignalBits &&
              renderBitSignalTable()}
            {this.state.showFeatureActivation && !this.state.loadedSignalBits && <Loading />}
          </div>
        </div>
      );
    };

    const renderBitSignalTable = () => {
      if (this.state.signalBits.length === 0) {
        return <div>There are currently no features.</div>;
      }
      return (
        <div className="table-responsive mt-5">
          <table className="table table-striped" id="features-table">
            <thead>
              <tr>
                <th className="d-lg-table-cell">Bit</th>
                <th className="d-lg-table-cell">Signal</th>
                <th className="d-lg-table-cell">Feature</th>
                <th className="d-lg-table-cell">Feature State</th>
              </tr>
            </thead>
            <tbody>{renderBitSignalTableBody()}</tbody>
          </table>
        </div>
      );
    };

    const renderBitSignalTableBody = () => {
      return this.state.signalBits.map(featureData => {
        return <FeatureDataRow key={featureData.bit} featureData={featureData} />;
      });
    };

    const loadTxData = () => {
      return (
        <div className="tx-data-wrapper">
          <TxAlerts tokens={this.state.tokens} />
          {this.props.showConflicts ? renderConflicts() : ''}
          <div>
            <label>
              {hathorLib.transactionUtils.isBlock(this.props.transaction) ? 'Block' : 'Transaction'}{' '}
              ID:
            </label>{' '}
            {this.props.transaction.hash}
          </div>
          <div className="d-flex flex-column flex-lg-row align-items-start mt-3 mb-3">
            <div className="d-flex flex-column align-items-start common-div bordered-wrapper me-lg-3 w-100">
              <div>
                <label>Type:</label> {hathorLib.transactionUtils.getTxType(this.props.transaction)}{' '}
                {isNFTCreation() && '(NFT)'} <TxMarkers tx={this.props.transaction} />
              </div>
              <div>
                <label>Time:</label>{' '}
                {dateFormatter.parseTimestamp(this.props.transaction.timestamp)}
              </div>
              <div>
                <label>Nonce:</label> {this.props.transaction.nonce}
              </div>
              <div>
                <label>Weight:</label> {helpers.roundFloat(this.props.transaction.weight)}
              </div>
              {this.props.transaction.signer_id && (
                <div>
                  <label>Signer ID:</label> {this.props.transaction.signer_id.toLowerCase()}
                </div>
              )}
              {this.props.transaction.signer && (
                <div>
                  <label>Signer:</label>{' '}
                  {helpers.getShortHash(this.props.transaction.signer.toLowerCase())}
                </div>
              )}
              {!hathorLib.transactionUtils.isBlock(this.props.transaction) && renderFirstBlockDiv()}
            </div>
            <div className="d-flex flex-column align-items-center important-div bordered-wrapper mt-3 mt-lg-0 w-100">
              {hathorLib.transactionUtils.isBlock(this.props.transaction) && renderHeight()}
              {hathorLib.transactionUtils.isBlock(this.props.transaction) && renderScore()}
              {!hathorLib.transactionUtils.isBlock(this.props.transaction) && renderAccWeightDiv()}
              {!hathorLib.transactionUtils.isBlock(this.props.transaction) &&
                renderConfirmationLevel()}
            </div>
          </div>
          <div className="d-flex flex-row align-items-start mb-3">
            {this.props.transaction.version === hathorLib.constants.NANO_CONTRACTS_VERSION &&
              renderNCData()}
          </div>
          <div className="d-flex flex-row align-items-start mb-3">
            {this.props.transaction.version === hathorLib.constants.NANO_CONTRACTS_VERSION &&
              renderNCActions()}
          </div>
          <div className="d-flex flex-column flex-lg-row align-items-start mb-3 w-100">
            <div className="f-flex flex-column align-items-start common-div bordered-wrapper me-lg-3 w-100">
              <div>
                <label>Inputs ({this.props.transaction.inputs.length})</label>
              </div>
              {renderInputs(this.props.transaction.inputs)}
            </div>
            <div className="d-flex flex-column align-items-center common-div bordered-wrapper mt-3 mt-lg-0 w-100">
              <div>
                <label>Outputs ({this.props.transaction.outputs.length})</label>
              </div>
              {renderOutputs(this.props.transaction.outputs)}
            </div>
          </div>
          {this.state.tokens.length > 0 && renderTokenList()}
          <div className="d-flex flex-column flex-lg-row align-items-start mb-3">
            <div className="f-flex flex-column align-items-start common-div bordered-wrapper me-lg-3 w-100">
              <div>
                <label>Parents:</label>
              </div>
              {renderDivList(this.props.transaction.parents)}
            </div>
            <div className="f-flex flex-column align-items-start common-div bordered-wrapper mt-3 mt-lg-0 w-100">
              <div>
                <label>Children: </label>
                {this.props.meta.children.length > 0 && (
                  <a href="true" className="ms-1" onClick={e => this.toggleChildren(e)}>
                    {this.state.children ? 'Click to hide' : 'Click to show'}
                  </a>
                )}
              </div>
              {this.state.children && renderDivList(this.props.meta.children)}
            </div>
          </div>
          {this.state.graphs.map((graph, index) => renderGraph(index))}
          {hathorLib.transactionUtils.isBlock(this.props.transaction) && renderFeatureActivation()}
          <div className="d-flex flex-column flex-lg-row align-items-start mb-3 common-div bordered-wrapper w-100">
            {this.props.showRaw ? showRawWrapper() : null}
          </div>
        </div>
      );
    };

    const loadNewUiTxData = () => {
      return (
        <div className="tx-data-wrapper">
          <TxAlerts tokens={this.state.tokens} />
          <h2 className="title-page">
            {hathorLib.transactionUtils.isBlock(this.props.transaction) ? 'Block' : 'Transaction'}{' '}
            Details
          </h2>

          <div className="tx-id-container">
            <label className="tx-title-purple">
              {hathorLib.transactionUtils.isBlock(this.props.transaction) ? 'Block' : 'TX'} ID:
            </label>{' '}
            <label className="tx-id-top">{this.props.transaction.hash}</label>
            <div className="copy-icon-div">
              <CopyToClipboard text={this.props.transaction.hash} onCopy={this.copied}>
                <Copy width="24" height="24" />
              </CopyToClipboard>
            </div>
          </div>
          {this.props.showConflicts ? renderNewUiConflicts() : ''}

          <div className="summary-balance-info">
            <h2 className="details-title">Overview</h2>
            <div className="summary-balance-info-container">
              <div className="address-container-title">Type:</div>{' '}
              {hathorLib.transactionUtils.getTxType(this.props.transaction)}{' '}
              {isNFTCreation() && '(NFT)'} <TxMarkers tx={this.props.transaction} />
            </div>
            <div className="summary-balance-info-container">
              <div className="address-container-title">Time:</div>{' '}
              {dateFormatter.parseTimestamp(this.props.transaction.timestamp)}
            </div>
            <div className="summary-balance-info-container">
              <div className="address-container-title">Nonce:</div>{' '}
              <span>{this.props.transaction.nonce}</span>
            </div>

            {!hathorLib.transactionUtils.isBlock(this.props.transaction) && renderFirstBlockDiv()}
            <div className="summary-balance-info-container">
              <div className="address-container-title">Weight:</div>{' '}
              {helpers.roundFloat(this.props.transaction.weight)}
            </div>
            {this.props.transaction.signer_id && (
              <div className="summary-balance-info-container">
                <div className="address-container-title">Signer ID:</div>{' '}
                {this.props.transaction.signer_id.toLowerCase()}
              </div>
            )}
            {this.props.transaction.signer && (
              <div className="summary-balance-info-container">
                <div className="address-container-title">Signer:</div>{' '}
                {helpers.getShortHash(this.props.transaction.signer.toLowerCase())}
              </div>
            )}

            {hathorLib.transactionUtils.isBlock(this.props.transaction) && renderHeight()}
            {hathorLib.transactionUtils.isBlock(this.props.transaction) && renderScore()}
            {!hathorLib.transactionUtils.isBlock(this.props.transaction) && renderAccWeightDiv()}
            {!hathorLib.transactionUtils.isBlock(this.props.transaction) &&
              renderConfirmationLevel()}
          </div>
          <div className="details-container-gap">
            {this.props.transaction.version === hathorLib.constants.NANO_CONTRACTS_VERSION && (
              <div className="d-flex flex-row align-items-start mb-3">{renderNCData()}</div>
            )}

            {this.props.transaction.version === hathorLib.constants.NANO_CONTRACTS_VERSION && (
              <div className="d-flex flex-row align-items-start mb-3"> {renderNCActions()}</div>
            )}

            <div className="tx-drop-container-div">
              <DropDetails startOpen title={`Inputs (${this.props.transaction.inputs.length})`}>
                {renderInputs(this.props.transaction.inputs)}
              </DropDetails>
              <DropDetails startOpen title={`Outputs (${this.props.transaction.outputs.length})`}>
                {renderOutputs(this.props.transaction.outputs)}
              </DropDetails>
            </div>
            {/* {this.state.tokens.length > 0 && renderTokenList()} */}
            <div className="tx-drop-container-div">
              <DropDetails title="Parents:">
                {renderNewUiDivList(this.props.transaction.parents)}
              </DropDetails>
              <DropDetails title="Children:">
                {renderNewUiDivList(this.props.meta.children)}
              </DropDetails>
            </div>
            {this.state.graphs.map((graph, index) => renderNewUiGraph(index))}

            {hathorLib.transactionUtils.isBlock(this.props.transaction) && (
              <DropDetails title="Feature Activation:" onT={e => this.toggleFeatureActivation(e)}>
                {this.state.showFeatureActivation &&
                  this.state.loadedSignalBits &&
                  renderBitSignalTable()}
                {this.state.showFeatureActivation && !this.state.loadedSignalBits && <Loading />}
              </DropDetails>
            )}

            <DropDetails
              title={
                <>
                  <span>Raw Transaction</span>
                  <CopyToClipboard
                    className="copy-icon-div"
                    text={this.props.transaction.raw}
                    onCopy={this.copied}
                  >
                    <Copy width="24" height="24" />
                  </CopyToClipboard>
                </>
              }
              onT={e => this.toggleRaw(e)}
            >
              <p className="mt-3" ref="rawTx" style={{ display: 'none' }}>
                {this.props.transaction.raw}
              </p>
            </DropDetails>
          </div>
        </div>
      );
    };

    const showRawWrapper = () => {
      return (
        <div className="mt-3 mb-3">
          <a href="true" onClick={e => this.toggleRaw(e)}>
            {this.state.raw ? 'Hide raw transaction' : 'Show raw transaction'}
          </a>
          {this.state.raw ? (
            <CopyToClipboard text={this.props.transaction.raw} onCopy={this.copied}>
              <i className="fa fa-clone pointer ms-1" title="Copy raw tx to clipboard"></i>
            </CopyToClipboard>
          ) : null}
          <p className="mt-3" ref="rawTx" style={{ display: 'none' }}>
            {this.props.transaction.raw}
          </p>
        </div>
      );
    };

    return this.props.newUiEnabled ? (
      <>
        <div>{loadNewUiTxData()}</div>
        <HathorSnackbar ref={this.snackbarRef} text="Copied to clipboard!" type="success" />
      </>
    ) : (
      <>
        <div>{loadTxData()}</div>
        <HathorAlert ref="alertCopied" text="Copied to clipboard!" type="success" />
      </>
    );
  }
}

export default connect(mapStateToProps)(TxData);
