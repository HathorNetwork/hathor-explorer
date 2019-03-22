import React from 'react';
import { Link } from 'react-router-dom';


class TxTextInput extends React.Component {
  render() {
    return (
      <div className="d-flex flex-column tx-input-wrapper">
        <span>{this.props.helpText}</span>
        <textarea ref="txInput" rows="5" onChange={this.props.onChange}></textarea>
        <span>Click <Link to={this.props.link}>here</Link> to {this.props.otherAction} this transaction</span>
        <button className="btn btn-hathor" onClick={this.props.buttonClicked}>{this.props.action}</button>
      </div>
    );
  }
}

export default TxTextInput;