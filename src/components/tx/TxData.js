/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import $ from 'jquery';
import React from 'react';
import Viz from 'viz.js';
import hathorLib from '@hathor/wallet-lib';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import { Module, render } from 'viz.js/full.render';
import { connect } from 'react-redux';
import { get, upperFirst } from 'lodash';
import TokenMarkers from '../token/TokenMarkers';
import TxAlerts from './TxAlerts';
import TxMarkers from './TxMarkers';
import dateFormatter from '../../utils/date';
import { NANO_CONTRACT_EXECUTION_FAIL } from '../../constants';
import helpers from '../../utils/helpers';
import metadataApi from '../../api/metadataApi';
import tokenApi from '../../api/tokenApi';
import { ReactComponent as InfoIcon } from '../../assets/images/icon-info.svg';
import graphvizApi from '../../api/graphvizApi';
import Loading from '../Loading';
import FeatureDataRow from '../feature_activation/FeatureDataRow';
import featureApi from '../../api/featureApi';
import HathorSnackbar from '../HathorSnackbar';
import { DropDetails } from '../DropDetails';
import { ReactComponent as Copy } from '../../assets/images/copy-icon.svg';
import { ReactComponent as ValidIcon } from '../../assets/images/success-icon.svg';
import { ReactComponent as RowDown } from '../../assets/images/chevron-down.svg';
import EllipsiCell from '../EllipsiCell';

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
    ncParser: null,
    ncLoading: false,
    tokenCreationInfo: null,
    feeEntries: [],
    showAllFees: false,
  };

  // Array of token uid that was already found to show the symbol
  tokensFound = [];

  snackbarRef = React.createRef();

  toggleShowAllFees = () => {
    this.setState(prevState => ({ showAllFees: !prevState.showAllFees }));
  };

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
    this.parseFeeHeader();
    await this.handleNanoContractFetch();
    await this.fetchTokenCreationInfo();
  };

  isTokenCreation = () => {
    return this.props.transaction.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION;
  };

  fetchTokenCreationInfo = async () => {
    if (!this.isTokenCreation()) return;

    const createdToken = this.props.transaction.tokens[0];
    if (!createdToken) return;

    try {
      const tokenInfo = await tokenApi.get(createdToken.uid);
      this.setState({ tokenCreationInfo: tokenInfo });
    } catch (e) {
      console.error('Error fetching token creation info:', e);
    }
  };

  handleNanoContractFetch = async () => {
    if (this.props.transaction.nc_id === undefined) {
      this.setState({ ncLoading: false });
      return;
    }

    this.setState({ ncLoading: true });

    try {
      const network = hathorLib.config.getNetwork();
      const ncData = this.props.transaction;
      const ncParser = new hathorLib.NanoContractTransactionParser(
        ncData.nc_blueprint_id,
        ncData.nc_method,
        ncData.nc_address,
        network,
        ncData.nc_args
      );
      await ncParser.parseArguments();
      this.setState({ ncParser, ncLoading: false });
    } catch (e) {
      // Catch any errors deserializing the transaction
      console.error(e);
      this.setState({ ncLoading: false });
    }
  };

  /**
   * Parse fee header from raw transaction bytes to get fee entries
   */
  parseFeeHeader = () => {
    try {
      const { raw } = this.props.transaction;
      if (!raw) return;

      const network = hathorLib.config.getNetwork();
      const txBytes = Buffer.from(raw, 'hex');
      const parsedTx = hathorLib.Transaction.createFromBytes(txBytes, network);
      const feeHeader = parsedTx.getFeeHeader();

      if (!feeHeader || !feeHeader.entries || feeHeader.entries.length === 0) {
        this.setState({ feeEntries: [] });
        return;
      }

      const feeEntries = feeHeader.entries.map(entry => ({
        tokenSymbol: this.getTokenSymbolForFeeIndex(entry.tokenIndex),
        amount: entry.amount,
        tokenIndex: entry.tokenIndex,
      }));

      this.setState({ feeEntries });
    } catch (e) {
      console.error('Error parsing fee header:', e);
      this.setState({ feeEntries: [] });
    }
  };

  /**
   * Get token symbol for a given fee token index
   *
   * @param {number} tokenIndex Token index from fee entry
   * @return {string} Token symbol
   */
  getTokenSymbolForFeeIndex = tokenIndex => {
    if (tokenIndex === hathorLib.constants.HATHOR_TOKEN_INDEX) {
      return this.getNativeToken().symbol;
    }
    const tokenConfig = this.props.transaction.tokens[tokenIndex - 1];
    return tokenConfig?.symbol || 'Unknown';
  };

  /**
   * Add all tokens of this transaction (inputs and outputs) to the state
   */
  calculateTokens = () => {
    const { tokens } = this.props.transaction;

    const metaRequests = tokens.map(token => this.getTokenMetadata(token));

    Promise.all(metaRequests).then(metaResults => {
      this.setState({ tokens: metaResults, metadataLoaded: true });
    });
  };

  getNativeToken = () => {
    const { nativeToken } = this.props;
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
      .catch(() => token);
  };

  /**
   * Show/hide raw transaction in hexadecimal
   *
   * @param {Object} e Event emitted when clicking link
   */
  toggleRaw = e => {
    if (e) {
      e.preventDefault();
    }

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
    if (e) {
      e.preventDefault();
    }
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

    const graphs = [...this.state.graphs];
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
      this.snackbarRef.current.show(1000);
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
   * Get name of token from UID iterating through possible tokens in the transaction
   *
   * @param {string} uid UID of token to get the name
   *
   * @return {string} Token name
   */
  getTokenName = uid => {
    if (uid === hathorLib.constants.NATIVE_TOKEN_UID) {
      return this.getNativeToken().symbol;
    }
    const tokenConfig = this.state.tokens.find(token => token.uid === uid);
    if (tokenConfig === undefined) return '';
    return tokenConfig.name;
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
      }
      return 'transaction';
    };

    const renderInputs = inputs => {
      const obj = inputs.map(input => (
        <div key={`${input.tx_id}${input.index}`}>
          <Link to={`/transaction/${input.tx_id}`}>{helpers.getShortHash(input.tx_id)}</Link> (
          {input.index}){renderInputOrOutput(input, 0, false)}
        </div>
      ));
      return renderListWithSpacer(obj);
    };

    const renderOutputToken = output => {
      return this.getOutputToken(hathorLib.tokensUtils.getTokenIndexFromData(output.token_data));
    };

    const outputValue = output => {
      if (hathorLib.transactionUtils.isAuthorityOutput(output)) {
        if (hathorLib.transactionUtils.isMint(output)) {
          return 'Mint authority';
        }
        if (hathorLib.transactionUtils.isMelt(output)) {
          return 'Melt authority';
        }
        // Should never come here
        return 'Unknown authority';
      }
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
      return hathorLib.numberUtils.prettyValue(output.value, isNFT ? 0 : this.props.decimalPlaces);
    };

    const renderOutputLink = idx => {
      if (idx in this.props.spentOutputs) {
        return (
          <span className="fw-bold">
            {' '}
            (<Link to={`/transaction/${this.props.spentOutputs[idx]}`}>Spent</Link>)
          </span>
        );
      }
      return null;
    };

    const renderInputOrOutput = (output, idx, isOutput) => {
      return (
        <div key={idx}>
          <div className="fw-bold">
            <span>{outputValue(output)}</span> {renderOutputToken(output)}
          </div>
          <div>
            {renderDecodedScript(output)}
            {isOutput && renderOutputLink(idx)}
          </div>
        </div>
      );
    };

    const renderOutputs = outputs => {
      const mappedOutputs = outputs.map(o => ({ ...o, value: BigInt(o.value) }));
      const obj = mappedOutputs.map((output, idx) => renderInputOrOutput(output, idx, true));
      return renderListWithSpacer(obj);
    };

    const renderDecodedScript = output => {
      switch (output.decoded.type) {
        case 'P2PKH':
        case 'MultiSig':
          return renderP2PKHorMultiSig(output.decoded);
        default: {
          let { script } = output;
          // Try to parse as script data
          try {
            // The output script is decoded to base64 in the full node
            // before returning as response to the explorer in the API
            // and the lib expects a buffer (bytes)
            // In the future we must receive from the full node
            // the decoded.type as script data but this still needs
            // some refactor there that won't happen soon
            const buff = Buffer.from(script, 'base64');
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
          } catch (e) {
            console.error(e);
          }

          return `Unable to decode script: ${script.trim()}`;
        }
      }
    };

    const renderDataScript = data => {
      return `${data} [Data]`;
    };

    const renderP2PKHorMultiSig = decoded => {
      let ret = decoded.address;
      if (decoded.timelock) {
        ret = `${ret} | Locked until ${dateFormatter.parseTimestamp(decoded.timelock)}`;
      }
      ret = `${ret} [${decoded.type}]`;
      return ret;
    };

    const renderListWithLinks = hashes => {
      return renderNewUiListWithLinks(hashes);
    };

    const renderNewUiListWithLinks = hashes => {
      if (hashes.length === 0) {
        return null;
      }
      const ncFailedExecution = 'Nano contract failed execution';
      const renderSingleElement = h => {
        if (h === NANO_CONTRACT_EXECUTION_FAIL) {
          return (
            <span>
              {ncFailedExecution} (
              <Link to={`/nano_contract/logs/${this.props.transaction.hash}`}>
                See execution logs
              </Link>
              )
            </span>
          );
        }

        return (
          <Link to={`/transaction/${h}`}>
            {' '}
            {h} {h === this.props.transaction.hash && ' (Current transaction)'}
          </Link>
        );
      };
      if (hashes.length === 1) {
        const h = hashes[0];
        return renderSingleElement(h);
      }
      const v = hashes.map(h => <li key={h}>{renderSingleElement(h)}</li>);
      return <ul>{v}</ul>;
    };

    const renderTxListWithSpacer = hashes => {
      const obj = hashes.map((h, key) => (
        <Link className="fs-14" key={key} to={`/transaction/${h}`}>
          {h}
        </Link>
      ));
      return renderListWithSpacer(obj);
    };

    const renderListWithSpacer = children => {
      return (
        <table className="table-details">
          <tbody>
            {children.map((child, index) => (
              <tr className="tr-details" key={index}>
                <td className={index === children.length - 1 ? 'tr-details-last-cell' : ''}>
                  {child}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    };

    const renderTwins = () => {
      if (!this.props.meta.twins.length) {
        return null;
      }
      return (
        <div>
          This transaction has twin{' '}
          {helpers.plural(this.props.meta.twins.length, 'transaction', 'transactions')}:{' '}
          {renderListWithLinks(this.props.meta.twins)}
        </div>
      );
    };

    const renderNewUiConflicts = () => {
      const { twins } = this.props.meta;
      const conflictNotTwin = this.props.meta.conflict_with.length
        ? this.props.meta.conflict_with.filter(hash => twins.indexOf(hash) < 0)
        : [];
      if (!this.props.meta.voided_by.length) {
        if (!this.props.meta.conflict_with.length) {
          // there are conflicts, but it is not voided
          return (
            <div className=" alert-success-container">
              <ValidIcon width="14px" />
              <span className="alert-success-text">
                This {renderBlockOrTransaction()} is valid!
              </span>
            </div>
          );
        }

        if (this.props.meta.conflict_with.length) {
          // there are conflicts, but it is not voided
          return (
            <div className="alert alert-success-container-big alert-double-spending">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ValidIcon width="14px" />

                <span className="alert-success-text">
                  This {renderBlockOrTransaction()} is valid!
                </span>
              </div>

              <p>
                Although there is a double-spending transaction, this transaction has the highest
                accumulated weight and is valid.
              </p>

              {conflictNotTwin.length > 0 && (
                <div className="container-big-links">
                  <span>Transactions double spending the same outputs as this transaction: </span>
                  {renderListWithLinks(conflictNotTwin)}
                </div>
              )}
              {renderTwins()}
            </div>
          );
        }
        return null;
      }

      // Check if this is a nano contract execution failure
      const isNcExecutionFail = this.props.meta.voided_by.includes(NANO_CONTRACT_EXECUTION_FAIL);

      if (isNcExecutionFail) {
        // For nano contract execution failure, show simplified message
        return (
          <div className="alert alert-double-spending alert-invalid">
            <div>
              <span>
                This {renderBlockOrTransaction()} is <strong>NOT</strong> valid.
              </span>
            </div>
            <div>
              <span>
                The nano contract execution failed (
                <Link to={`/nano_contract/logs/${this.props.transaction.hash}`}>
                  See execution logs
                </Link>
                )
              </span>
            </div>
          </div>
        );
      }

      if (!this.props.meta.conflict_with.length) {
        // it is voided, but there is no conflict
        return (
          <div className="alert alert-double-spending alert-invalid">
            <div>
              <span>
                This {renderBlockOrTransaction()} is voided and <strong>NOT</strong> valid.
              </span>
            </div>

            <p>
              This {renderBlockOrTransaction()} is verifying (directly or indirectly) a voided
              double-spending transaction, hence it is voided as well.
            </p>
            <div className="mb-0">
              <span>
                This {renderBlockOrTransaction()} is voided because of these transactions:{' '}
              </span>
              {renderListWithLinks(this.props.meta.voided_by)}
            </div>
          </div>
        );
      }

      // it is voided, and there is a conflict
      return (
        <div className="alert alert-double-spending alert-invalid">
          <div>
            <span>
              This {renderBlockOrTransaction()} is <strong>NOT</strong> valid.
            </span>
          </div>

          <div style={{ textAlign: 'left' }}>
            <span>It is voided by: </span>
            {renderListWithLinks(this.props.meta.voided_by)}
          </div>

          {conflictNotTwin.length > 0 && (
            <div className="mb-0">
              <span>Conflicts with: </span>
              {renderListWithLinks(conflictNotTwin)}
            </div>
          )}
          {renderTwins()}
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
                    width="24px"
                    height="24px"
                    style={{
                      transform: `${
                        this.state.graphs[graphIndex].showNeighbors ? '' : 'rotate(180deg)'
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
        const acc = helpers.roundFloat(this.props.confirmationData.accumulated_weight);
        if (this.props.confirmationData.accumulated_bigger) {
          return `Over ${acc}`;
        }
        return acc;
      }
      return 'Retrieving accumulated weight data...';
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
        }
        return <Link to={`/token_detail/${token.uid}`}>{token.uid}</Link>;
      };
      const obj = this.state.tokens.map(token => (
        // TODO I don't think we have a TokenMarker here on Figma. Remove?
        <div key={token.uid}>
          <div>
            <TokenMarkers token={token} />
            <span>
              {token.name} ({token.symbol})
            </span>
          </div>
          <div>{renderTokenUID(token)}</div>
        </div>
      ));
      return (
        <DropDetails startOpen title="Tokens">
          {renderListWithSpacer(obj)}
        </DropDetails>
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
          <label className="address-container-title">First block</label>
          {this.props.meta.first_block && renderFirstBlock()}
        </div>
      );
    };

    const renderAccWeightDiv = () => {
      return (
        <div className="summary-balance-info-container">
          <label className="address-container-title">Accumulated weight</label>
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
          <label className="address-container-title">Confirmation level</label>
          {getConfirmationMessage(this.props.confirmationData)}
        </div>
      );
    };

    const renderFeeDiv = () => {
      if (this.state.feeEntries.length === 0) return null;

      const INITIAL_DISPLAY_COUNT = 5;
      const showToggle = this.state.feeEntries.length > INITIAL_DISPLAY_COUNT;
      const entriesToShow = this.state.showAllFees
        ? this.state.feeEntries
        : this.state.feeEntries.slice(0, INITIAL_DISPLAY_COUNT);

      return (
        <div className="fee-paid-section">
          <table className="table-details fee-table">
            <tbody>
              {entriesToShow.map((entry, idx) => (
                <tr key={idx} className="tr-details">
                  <td className="fee-label-cell">
                    {idx === 0 && <span className="address-container-title">Fee paid</span>}
                  </td>
                  <td
                    className={
                      idx === entriesToShow.length - 1 && !showToggle ? 'tr-details-last-cell' : ''
                    }
                  >
                    {hathorLib.numberUtils.prettyValue(entry.amount, this.props.decimalPlaces)}{' '}
                    {entry.tokenSymbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showToggle && (
            <a
              href="#"
              className="show-more-link"
              onClick={e => {
                e.preventDefault();
                this.toggleShowAllFees();
              }}
            >
              {this.state.showAllFees ? 'Show less' : 'Show more'}
            </a>
          )}
        </div>
      );
    };

    const renderNCActionsTableBody = () => {
      return this.props.transaction.nc_context.actions.map((action, index) => (
        <tr key={index}>
          <td>
            {action.type
              .split('_')
              .map(t => upperFirst(t))
              .join(' ')}
          </td>
          <td>
            {action.token_uid === hathorLib.constants.NATIVE_TOKEN_UID ? (
              action.token_uid
            ) : (
              <Link to={`/token_detail/${action.token_uid}`}>
                {this.getTokenName(action.token_uid)}
                <br />
                <EllipsiCell id={action.token_uid} countBefore={4} countAfter={4} />
              </Link>
            )}
          </td>
          <td>
            {action.amount ? (
              <>
                {hathorLib.numberUtils.prettyValue(action.amount, this.props.decimalPlaces)}{' '}
                {this.getSymbol(action.token_uid)}
              </>
            ) : (
              '-'
            )}
          </td>
          <td>{action.mint ? 'Yes' : 'No'}</td>
          <td>{action.melt ? 'Yes' : 'No'}</td>
        </tr>
      ));
    };

    const renderNCActionsTable = () => (
      <div className="table-responsive nanocontract-actions-table">
        <table className="table-stylized" id="nanocontract-actions-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Token</th>
              <th>Amount</th>
              <th>Mint</th>
              <th>Melt</th>
            </tr>
          </thead>
          <tbody>{renderNCActionsTableBody()}</tbody>
        </table>
      </div>
    );

    const renderNCActions = () => {
      const actionsCount = get(this.props.transaction, 'nc_context.actions.length', 0);
      return (
        <DropDetails title={`Actions (${actionsCount})`}>
          {actionsCount > 0 && renderNCActionsTable()}
        </DropDetails>
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
      const { ncParser } = this.state;
      if (!ncParser) {
        // This should never happen
        return null;
      }
      return (
        <div className="summary-balance-info" style={{ width: '100%' }}>
          <h2 className="details-title">Nano Contract Overview</h2>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Nano id</div>{' '}
            <Link to={`/nano_contract/detail/${this.props.transaction.nc_id}`}>
              {' '}
              {this.props.transaction.nc_id}
            </Link>
          </div>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Address used to sign</div>{' '}
            {ncParser.address.base58}
          </div>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Method</div>{' '}
            <span>{this.props.transaction.nc_method}</span>
          </div>

          <h2 className="details-title">Arguments</h2>

          {renderNCArguments(ncParser.parsedArgs)}

          <div className="mt-3">
            <Link to={`/nano_contract/logs/${this.props.transaction.hash}`}>Execution Logs</Link>
          </div>
        </div>
      );
    };

    const renderNCArguments = args => {
      if (!Array.isArray(args) || args.length === 0) {
        return ' - ';
      }

      return args.map(arg => (
        <div className="summary-balance-info-container" key={arg.name}>
          <div className="address-container-title">{arg.name}:</div>
          {renderArgItem(arg)}
        </div>
      ));
    };

    const renderArgItem = arg => {
      if (arg.type.startsWith('SignedData')) {
        return (
          <div>
            <span>Type: {arg.value.type}</span>
            <br />
            <span>Data: {renderArgValue(arg.value)}</span>
            <br />
            <span>Signature: {arg.value.signature}</span>
          </div>
        );
      }

      return <span>{renderArgValue(arg)}</span>;
    };

    const renderArgValue = arg => {
      if (arg.type === 'Timestamp') {
        return dateFormatter.parseTimestamp(arg.value);
      }

      if (arg.type === 'Amount') {
        return hathorLib.numberUtils.prettyValue(arg.value, this.props.decimalPlaces);
      }

      return hathorLib.bigIntUtils.JSONBigInt.stringify(arg.value);
    };

    const isNFTCreation = () => {
      if (this.props.transaction.version !== hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
        return false;
      }

      const createdToken = this.props.transaction.tokens[0];
      const tokenData = this.state.tokens.find(token => token.uid === createdToken.uid);
      return tokenData && tokenData.meta && tokenData.meta.nft;
    };

    const isBlueprint = () => {
      return this.props.transaction.version === hathorLib.constants.ON_CHAIN_BLUEPRINTS_VERSION;
    };

    const getTxType = () => {
      return hathorLib.transactionUtils.getTxType(this.props.transaction);
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

    const renderTokenInformation = () => {
      if (!this.isTokenCreation()) return null;

      const createdToken = this.props.transaction.tokens[0];
      if (!createdToken) return null;

      const isFeeBased = this.state.tokenCreationInfo?.version === hathorLib.TokenVersion.FEE;

      return (
        <DropDetails startOpen title="Token Information">
          <div className="token-creation-info">
            <div className="summary-balance-info-container">
              <div className="address-container-title">NAME</div>
              <span>{createdToken.name}</span>
            </div>
            <div className="summary-balance-info-container">
              <div className="address-container-title">SYMBOL</div>
              <span>{createdToken.symbol}</span>
            </div>
            <div className="summary-balance-info-container">
              <div className="address-container-title">FEE MODEL</div>
              <span className="info-tooltip-container">
                <div>{isFeeBased ? 'Fee based' : 'Deposit based'}</div>
                <div className="tooltip-info-icon">
                  <InfoIcon />
                  <span className="info-tooltip">
                    {isFeeBased
                      ? 'This token was created without a deposit — each transfer has a small fee.'
                      : "This token was created with a deposit — transfers don't have fees."}
                  </span>
                </div>
              </span>
            </div>
          </div>
        </DropDetails>
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
              {(() => {
                if (hathorLib.transactionUtils.isBlock(this.props.transaction)) {
                  return 'Block';
                }
                return this.props.isMobile ? 'TX' : 'Transaction';
              })()}{' '}
              ID:
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
              <div className="address-container-title">Type</div> {getTxType()}{' '}
              {isNFTCreation() && '(NFT)'}
              {isBlueprint() && (
                <Link to={`/blueprint/detail/${this.props.transaction.hash}`}>
                  &nbsp;(see details)
                </Link>
              )}{' '}
              <TxMarkers tx={this.props.transaction} />
            </div>
            <div className="summary-balance-info-container">
              <div className="address-container-title">Time</div>{' '}
              {dateFormatter.parseTimestamp(this.props.transaction.timestamp)}
            </div>
            <div className="summary-balance-info-container">
              <div className="address-container-title">Nonce</div>{' '}
              <span>{this.props.transaction.nonce}</span>
            </div>

            {!hathorLib.transactionUtils.isBlock(this.props.transaction) && renderFirstBlockDiv()}
            <div className="summary-balance-info-container">
              <div className="address-container-title">Weight</div>{' '}
              {helpers.roundFloat(this.props.transaction.weight)}
            </div>
            {this.props.transaction.signer_id && (
              <div className="summary-balance-info-container">
                <div className="address-container-title">Signer ID</div>{' '}
                {this.props.transaction.signer_id.toLowerCase()}
              </div>
            )}
            {this.props.transaction.signer && (
              <div className="summary-balance-info-container">
                <div className="address-container-title">Signer</div>{' '}
                {helpers.getShortHash(this.props.transaction.signer.toLowerCase())}
              </div>
            )}

            {hathorLib.transactionUtils.isBlock(this.props.transaction) && renderHeight()}
            {hathorLib.transactionUtils.isBlock(this.props.transaction) && renderScore()}
            {!hathorLib.transactionUtils.isBlock(this.props.transaction) && renderAccWeightDiv()}
            {!hathorLib.transactionUtils.isBlock(this.props.transaction) &&
              renderConfirmationLevel()}
            {!hathorLib.transactionUtils.isBlock(this.props.transaction) && renderFeeDiv()}
          </div>
          <div className="details-container-gap">
            {renderTokenInformation()}
            {this.props.transaction.nc_id !== undefined && (
              <div className="d-flex flex-row align-items-start mb-3">{renderNCData()}</div>
            )}

            {this.props.transaction.nc_id !== undefined && (
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
            {this.state.tokens.length > 0 && renderTokenList()}
            <div className="tx-drop-container-div">
              <DropDetails title="Parents:">
                {renderTxListWithSpacer(this.props.transaction.parents)}
              </DropDetails>
              <DropDetails title="Children:">
                {renderTxListWithSpacer(this.props.meta.children)}
              </DropDetails>
            </div>
            {this.state.graphs.map((graph, index) => renderNewUiGraph(index))}

            {hathorLib.transactionUtils.isBlock(this.props.transaction) && (
              <DropDetails
                title="Feature Activation:"
                onToggle={e => this.toggleFeatureActivation(e)}
              >
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
              onToggle={e => this.toggleRaw(e)}
            >
              <p className="mt-3" ref="rawTx" style={{ display: 'none' }}>
                {this.props.transaction.raw}
              </p>
            </DropDetails>
          </div>
        </div>
      );
    };

    return (
      <>
        <div>{loadNewUiTxData()}</div>
        <HathorSnackbar ref={this.snackbarRef} text="Copied to clipboard!" type="success" />
      </>
    );
  }
}

export default connect(mapStateToProps)(TxData);
