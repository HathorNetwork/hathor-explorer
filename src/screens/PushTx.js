/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState } from 'react';
import TxTextInput from '../components/tx/TxTextInput';
import txApi from '../api/txApi';

function PushTx() {
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [canForce, setCanForce] = useState(false);
  const [force, setForce] = useState(false);
  const [dataToPush, setDataToPush] = useState('');

  const textRef = useRef();

  async function buttonClicked() {
    setSuccess(false);
    const data = await txApi.pushTx(dataToPush, force);

    setSuccess(!!data.success);
    if (data.success) {
      setErrorMessage(null);
      setCanForce(false);
      setForce(false);
    } else {
      setErrorMessage(data.message);
      setCanForce(data.can_force);
    }
  }

  function handleCheckboxChange(e) {
    setForce(e.target.checked);
  }

  function handleChangeData(e) {
    setDataToPush(e.target.value);
  }

  const renderForceCheckbox = () => {
    return (
      <div className="form-check checkbox-wrapper mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="force"
          onChange={handleCheckboxChange}
        />
        <label className="form-check-label" htmlFor="force">
          Force push
        </label>
      </div>
    );
  };

  return (
    <div className="content-wrapper">
      <TxTextInput
        ref={textRef}
        buttonClicked={buttonClicked}
        action="Push tx"
        onChange={handleChangeData}
        otherAction="decode"
        link="/decode-tx/"
        helpText="Write your transaction in hex value and click the button to send it to the network. (We do not push blocks to the network, only transactions)"
      />
      {canForce ? renderForceCheckbox() : null}
      {success ? (
        <span className="text-success">Transaction pushed to the network with success!</span>
      ) : null}
      {errorMessage ? <span className="text-danger">{errorMessage}</span> : null}
    </div>
  );
}

export default PushTx;
