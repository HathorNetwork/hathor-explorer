import React from 'react';
import walletApi from '../api/wallet';
import helpers from '../utils/helpers';
import { DECIMAL_PLACES } from '../constants';


class NanoContracts extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      success: false,
      errorMessage: '',
      txId: null,
      index: null,
      oracleData: null,
      oracleSignature: null,
      oraclePubkey: null,
      address: null,
      value: null,
    }

    this.send = this.send.bind(this);
  }

  getData() {
    let data = {
      'spent_tx_id': this.state.txId,
      'spent_tx_index': parseInt(this.state.index, 10),
      'oracle_data': this.state.oracleData,
      'oracle_signature': this.state.oracleSignature,
      'oracle_pubkey': this.state.oraclePubkey,
      'address': this.state.address,
      'value': parseInt(this.state.value*(10**DECIMAL_PLACES), 10),
    };

    return data;
  }

  send() {
    this.setState({ errorMessage: '', success: false });
    walletApi.executeNanoContract(this.getData()).then((response) => {
      if (response.success) {
        this.setState({ success: true, errorMessage: null });
      } else {
        this.setState({ errorMessage: response.message, success: false });
      }
    }, (e) => {
      // Error in request
      this.setState({ errorMessage: 'Error contacting the server' });
    });
  }

  handleInputChange = field => e => {
    this.setState({
      [field]: e.target.value
    });
  }

  render() {
    return (
      <div className="content-wrapper flex align-items-center">
        <div className="d-flex flex-column col-12 col-md-10">
          <p className="mb-4 font-italic">Fill the information to create a transaction that executes a nano contract.</p>
          <form id="formSendTokens">
            <div>
              <label>Nano contract transaction</label>
              <div className="input-group mb-3">
                <input type="text" placeholder="Tx id" onChange={this.handleInputChange('txId')} className="form-control output-address col-10 col-md-7" />
                <input type="number" min="0" step="1" placeholder="Index" onChange={this.handleInputChange('index')} className="form-control output-value col-2 ml-2" />
              </div>
              <label>Oracle data</label>
              <div className="input-group mb-3">
                <input type="text" onChange={this.handleInputChange('oracleData')} className="form-control output-address col-12 col-md-9" />
              </div>
              <label>Oracle signature</label>
              <div className="input-group mb-3">
                <input type="text" onChange={this.handleInputChange('oracleSignature')} className="form-control output-address col-12 col-md-9" />
              </div>
              <label>Oracle public key</label>
              <div className="input-group mb-3">
                <input type="text" onChange={this.handleInputChange('oraclePubkey')} className="form-control output-address col-12 col-md-9" />
              </div>
              <label>Winning bet</label>
              <div className="input-group mb-3">
                <input type="text" placeholder="Address" onChange={this.handleInputChange('address')} className="form-control output-address col-9" />
                <input type="number" min="0" placeholder="Contract value" step={helpers.prettyValue(1)} onChange={this.handleInputChange('value')} className="form-control output-value col-3 ml-2" />
              </div>
            </div>

            <button type="button" className="btn btn-primary mt-4" onClick={this.send}>Execute contract</button>
          </form>
          <p className="text-danger mt-3">{this.state.errorMessage}</p>
          {this.state.success && <span className="text-success">Nano contract executed!</span>}
        </div>
      </div>
    );
  }
}

export default NanoContracts;
