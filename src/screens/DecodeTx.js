import React from 'react';
import TxTextInput from '../components/TxTextInput';
import TxData from '../components/TxData';
import txApi from '../api/txApi';


class DecodeTx extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      transaction: null,
      success: null
    }

    this.buttonClicked = this.buttonClicked.bind(this);
  }

  txDecoded(data) {
    if (data.success) {
      this.setState({ transaction: data.transaction, success: true });
    } else {
      this.setState({ success: false, transaction: null });
    }
  }

  buttonClicked() {
    txApi.decodeTx(this.child.refs.txInput.value).then((data) => {
      this.txDecoded(data);
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {
    return (
      <div className="content-wrapper">
        <TxTextInput ref={(node) => {this.child = node;}} buttonClicked={this.buttonClicked} action='Decode tx' otherAction='push' link='/push-tx/' helpText='Write your transaction in hex value and click the button to get a human value description' />
        {this.state.transaction ? <TxData transaction={this.state.transaction} showRaw={false} /> : null}
        {this.state.success === false ? <p className="text-danger">Could not decode this data to a transaction</p> : null}
      </div>
    );
  }
}

export default DecodeTx;