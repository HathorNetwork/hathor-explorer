/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import TxTextInput from '../components/tx/TxTextInput';
import txApi from '../api/txApi';


class PushTx extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      success: false,
      errorMessage: null,
      canForce: false,
      force: false,
      dataToPush: '',
    }

    this.buttonClicked = this.buttonClicked.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleChangeData = this.handleChangeData.bind(this);
  }

  buttonClicked() {
    this.setState({ success: false });
    txApi.pushTx(this.state.dataToPush, this.state.force).then((data) => {
      if (data.success) {
        this.setState({ success: true, errorMessage: null, canForce: false, force: false });
      } else {
        this.setState({ success: false, errorMessage: data.message, canForce: data.can_force })
      }
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  handleCheckboxChange(e) {
    this.setState({ force: e.target.checked });
  }

  handleChangeData(e) {
    this.setState({ dataToPush: e.target.value });
  }

  render() {
    const renderForceCheckbox = () => {
      return (
        <div className="form-check checkbox-wrapper mb-3">
          <input className="form-check-input" type="checkbox" id="force" onChange={this.handleCheckboxChange} />
          <label className="form-check-label" htmlFor="force">
            Force push
          </label>
        </div>
      );
    }

    return (
      <div className="content-wrapper">
        <TxTextInput ref={(node) => {this.child = node;}} buttonClicked={this.buttonClicked} action='Push tx' onChange={this.handleChangeData} otherAction='decode' link='/decode-tx/' helpText='Write your transaction in hex value and click the button to send it to the network. (We do not push blocks to the network, only transactions)' />
        {this.state.canForce ? renderForceCheckbox() : null}
        {this.state.success ? <span className="text-success">Transaction pushed to the network with success!</span> : null}
        {this.state.errorMessage ? <span className="text-danger">{this.state.errorMessage}</span> : null}
      </div>
    );
  }
}

export default PushTx;
