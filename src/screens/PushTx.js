/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef, useState } from 'react';
import TxTextInput from '../components/tx/TxTextInput';
import txApi from '../api/txApi';
import { ReactComponent as InfoIcon } from '../assets/images/icon-info.svg';
import NewHathorAlert from '../components/NewHathorAlert';

function PushTx() {
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [canForce, setCanForce] = useState(false);
  const [force, setForce] = useState(false);
  const [dataToPush, setDataToPush] = useState('');

  const textRef = useRef();

  const alertNotFound = useRef(null);

  const showSuccess = () => {
    alertNotFound.current.show(3000);
  };

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
      showSuccess();
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

  const renderNewUi = () => {
    return (
      <div className="section-tables-stylized">
        <h2 className="title-page">
          Push Transaction <InfoIcon style={{ marginLeft: '5px', width: '14px', height: '14px' }} />
        </h2>
        <TxTextInput
          ref={textRef}
          buttonClicked={buttonClicked}
          action="Push Transaction"
          onChange={handleChangeData}
          otherAction="decode"
          link="/decode-tx/"
          placeholder="E.g.: XXXXXXXX"
          helpText={
            <div className="pushtx-helptext">
              <span>
                Write your transaction in hex value and click the button to send it to the network.
              </span>
              <div className="pushtx-note">
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <InfoIcon width={12} height={12} />
                </div>

                <span> We do not push blocks to the network, only transactions</span>
              </div>
            </div>
          }
        />
        {canForce ? renderForceCheckbox() : null}
        {success ? (
          <span className="text-success">Transaction pushed to the network with success!</span>
        ) : null}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: '20px',
          }}
        >
          <NewHathorAlert type="error" text={errorMessage} ref={alertNotFound} />
        </div>
      </div>
    );
  };

  return renderNewUi();
}

export default PushTx;
