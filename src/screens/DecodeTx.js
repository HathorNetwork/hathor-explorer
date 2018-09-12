import React from 'react';
import TxTextInput from '../components/TxTextInput';
import TxData from '../components/TxData';
import txApi from '../api/txApi';


class DecodeTx extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      transaction: null
    }

    this.buttonClicked = this.buttonClicked.bind(this);
  }

  buttonClicked() {
    txApi.decodeTx(this.child.refs.txInput.value).then((data) => {
      // TODO handle error in case tx does not exist
      this.setState({ transaction: data.transaction });
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {
    return (
      <div className="content-wrapper">
        <TxTextInput ref={(node) => {this.child = node;}} buttonClicked={this.buttonClicked} action='Decode tx' otherAction='push' link='/push-tx/' helpText='Write your transaction in hex value and click the button to get a human value description' />
        {this.state.transaction ? <TxData transaction={this.state.transaction} /> : null}
      </div>
    );
  }
}

export default DecodeTx;