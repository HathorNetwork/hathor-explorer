/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Link } from 'react-router-dom';

class TxTextInput extends React.Component {
  renderNewUi() {
    return (
      <div className="d-flex flex-column tools-gap">
        <span className="text-page">{this.props.helpText}</span>
        <textarea
          className="tools-input"
          ref="txInput"
          rows="5"
          placeholder={this.props.placeholder}
          onChange={this.props.onChange}
        ></textarea>

        <div className="tools-button-container">
          <button className="btn btn-hathor tools-button" onClick={this.props.buttonClicked}>
            {this.props.action}
          </button>
          <span>
            <Link className="underline-link" to={this.props.link}>
              Click here
            </Link>{' '}
            if you want to {this.props.otherAction} this transaction.
          </span>
        </div>
      </div>
    );
  }

  render() {
    return this.renderNewUi();
  }
}

export default TxTextInput;
