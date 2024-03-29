/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import TxTextInput from '../components/tx/TxTextInput';
import TxData from '../components/tx/TxData';
import helpers from '../utils/helpers';
import txApi from '../api/txApi';


/**
 * Screen used to decode a transaction and show its detail
 *
 * @memberof Screens
 */
class DecodeTx extends React.Component {
  /**
   * transaction {Object} Decoded transaction
   * success {boolean} If had success decoding transaction on the server
   * dataToDecode {string} Text written by the user as the serialized transaction to be decoded
   * meta {Object} Metadata of decoded transaction received from the server
   * spentOutputs {Object} Spent outputs of decoded transaction received from the server
   * confirmationData {Object} Confirmation data of decoded transaction received from the server
   */
  state = {
    transaction: null,
    success: null,
    dataToDecode: '',
    meta: null,
    spentOutputs: null,
    confirmationData: null,
  };

  /**
   * Method called after change on the text area with the encoded hexadecimal
   *
   * @param {Object} e Event called when changing input
   */
  handleChangeData = (e) => {
    this.setState({ dataToDecode: e.target.value });
  }

  /**
   * This method is called after transaction was decoded, then shows its details on the screen
   *
   * @param {Object} data Transaction decoded
   */
  txDecoded = (data) => {
    if (data.success) {
      this.setState({ transaction: data.tx, meta: data.meta, spentOutputs: data.spent_outputs, loaded: true, success: true });
      if (!helpers.isBlock(data.tx)) {
        this.getConfirmationData();
      }
    } else {
      this.setState({ success: false, transaction: null, confirmationData: null, meta: null, spentOutputs: null });
    }
  }

  /**
   * Get data from accumulated weight of the decoded transaction
   */
  getConfirmationData = () => {
    txApi.getConfirmationData(this.state.transaction.hash).then((data) => {
      this.setState({ confirmationData: data });
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }


  /**
   * Called after the 'Decode' button is clicked, so sends hexadecimal to server to be decoded
   */
  buttonClicked = () => {
    txApi.decodeTx(this.state.dataToDecode).then((data) => {
      this.txDecoded(data);
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {
    return (
      <div className="content-wrapper">
        <TxTextInput onChange={this.handleChangeData} buttonClicked={this.buttonClicked} action='Decode tx' otherAction='push' link='/push-tx/' helpText='Write your transaction in hex value and click the button to get a human value description' />
        {this.state.transaction ? <TxData transaction={this.state.transaction} showRaw={false} confirmationData={this.state.confirmationData} spentOutputs={this.state.spentOutputs} meta={this.state.meta} showConflicts={false} /> : null}
        {this.state.success === false ? <p className="text-danger">Could not decode this data to a transaction</p> : null}
      </div>
    );
  }
}

export default DecodeTx;
