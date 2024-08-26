/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import TxTextInput from '../components/tx/TxTextInput';
import TxData from '../components/tx/TxData';
import helpers from '../utils/helpers';
import txApi from '../api/txApi';

/**
 * Screen used to decode a transaction and show its detail
 *
 * @memberof Screens
 */
function DecodeTx() {
  /* transaction {Object} Decoded transaction */
  const [transaction, setTransaction] = useState(null);
  /* success {boolean} If had success decoding transaction on the server */
  const [success, setSuccess] = useState(false);
  /* dataToDecode {string} Text written by the user as the serialized transaction to be decoded */
  const [dataToDecode, setDataToDecode] = useState(null);
  /* meta {Object} Metadata of decoded transaction received from the server */
  const [meta, setMeta] = useState(null);
  /* spentOutputs {Object} Spent outputs of decoded transaction received from the server */
  const [spentOutputs, setSpentOutputs] = useState(null);
  /* confirmationData {Object} Confirmation data of decoded transaction received from the server */
  const [confirmationData, setConfirmationData] = useState(null);

  /**
   * Method called after change on the text area with the encoded hexadecimal
   *
   * @param {Object} e Event called when changing input
   */
  const handleChangeData = e => {
    setDataToDecode(e.target.value);
  };

  /**
   * Called after the 'Decode' button is clicked, so sends hexadecimal to server to be decoded
   */
  const buttonClicked = async () => {
    try {
      const data = await txApi.decodeTx(dataToDecode);
      setSuccess(!!data.success);
      if (!data.success) {
        setTransaction(null);
        setConfirmationData(null);
        setMeta(null);
        setSpentOutputs(null);
        return;
      }
      setTransaction(data.tx);
      setMeta(data.meta);
      setSpentOutputs(data.spent_outputs);
      if (!helpers.isBlock(data.tx)) {
        /* Get data from accumulated weight of the decoded transaction */
        const confirmationResponse = await txApi.getConfirmationData(data.tx.hash);
        setConfirmationData(confirmationResponse);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="content-wrapper">
      <TxTextInput
        onChange={handleChangeData}
        buttonClicked={buttonClicked}
        action="Decode tx"
        otherAction="push"
        link="/push-tx/"
        helpText="Write your transaction in hex value and click the button to get a human value description"
      />
      {transaction ? (
        <TxData
          transaction={transaction}
          showRaw={false}
          confirmationData={confirmationData}
          spentOutputs={spentOutputs}
          meta={meta}
          showConflicts={false}
        />
      ) : null}
      {success === false ? (
        <p className="text-danger">Could not decode this data to a transaction</p>
      ) : null}
    </div>
  );
}

export default DecodeTx;
