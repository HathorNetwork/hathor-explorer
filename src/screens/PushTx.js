import React from 'react';
import TxTextInput from '../components/TxTextInput';
import txApi from '../api/txApi';


class PushTx extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      success: false,
    }

    this.buttonClicked = this.buttonClicked.bind(this);
  }

  buttonClicked() {
    this.setState({ success: false });
    txApi.pushTx(this.child.refs.txInput.value).then((data) => {
      if (data.success) {
        this.setState({ success: true });
      }
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {
    return (
      <div className="content-wrapper">
        <TxTextInput ref={(node) => {this.child = node;}} buttonClicked={this.buttonClicked} action='Push tx' otherAction='decode' link='/decode-tx/' helpText='Write your transaction in hex value and click the button to send it to the network' />
        {this.state.success ? <span className="text-success">Transaction pushed to the network with success!</span> : null}
      </div>
    );
  }
}

export default PushTx;