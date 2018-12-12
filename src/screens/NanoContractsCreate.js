import React from 'react';
import walletApi from '../api/wallet';
import helpers from '../utils/helpers';
import { DECIMAL_PLACES } from '../constants';


class NanoContractsCreate extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      errorMessage: '',
      totalValue: null,         // int
      oraclePubkeyHash: null,   // string
      oracleDataId: null,       // string
      fallbackAddress: null,    // string
      minimumTimestamp: null,   // int
      inputValue: null,         // int
      betAddress: null,         // string
      betValue: null,           // int
    }

    this.send = this.send.bind(this);
  }

  getData() {
    let data = {
      'inputs': [],
      'total_value': parseInt(this.state.totalValue*(10**DECIMAL_PLACES), 10),
      'oracle_pubkey_hash': this.state.oraclePubkeyHash,
      'oracle_data_id': this.state.oracleDataId,
      'fallback_address': this.state.fallbackAddress,
      'min_timestamp': parseInt(this.state.minTimestamp, 10),
      'input_value': parseInt(this.state.inputValue*(10**DECIMAL_PLACES), 10),
      'values': [{'address': this.state.betAddress, 'value': parseInt(this.state.betValue, 10)}],
    };

    return data;
  }

  send() {
    this.setState({ errorMessage: '' });
    walletApi.createNanoContract(this.getData()).then((response) => {
      if (response.success) {
        this.setState({ raw: response.hex_tx });
      } else {
        this.setState({ errorMessage: response.message });
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
        <p className="mb-4 font-italic">Fill out the nano contract details and your bet information. After finishing and encoding it, pass the encoded transaction to the other participants.</p>
        <div className="d-flex flex-row flex-wrap">
          <div className="d-flex flex-column d-flex-2 mb-3">
            <form id="formSendTokens">
              <div>
                <label>Oracle public key hash</label>
                <div className="input-group mb-3">
                  <input type="text" onChange={this.handleInputChange('oraclePubkeyHash')} className="form-control output-address col-12 col-md-6" />
                </div>
                <label>Oracle data id</label>
                <div className="input-group mb-3">
                  <input type="text" onChange={this.handleInputChange('oracleDataId')} className="form-control output-address col-12 col-md-6" />
                </div>
                <label>Starting timestamp</label>
                <div className="input-group mb-3">
                  <input type="number" step="1" min="0" onChange={this.handleInputChange('minimumTimestamp')} placeholder="(optional)" className="form-control output-address col-12 col-md-6" />
                </div>
                <label>Fallback address</label>
                <div className="input-group mb-3">
                  <input type="text" onChange={this.handleInputChange('fallbackAddress')} placeholder="(optional)" className="form-control output-address col-12 col-md-6" />
                </div>
              </div>

              <div className="">
                <label>Contract info</label>
                <div className="input-group mb-3 col-12 col-md-9 px-0">
                  <input type="text" onChange={this.handleInputChange('betAddress')} placeholder="Address" className="form-control output-address col-9 mr-3" />
                  <input type="number" min="0" step="1" onChange={this.handleInputChange('betValue')} placeholder="Bet value" className="form-control output-value col-3" />
                </div>
              </div>

            </form>
          </div>
          <div className="wrapper d-flex flex-column d-flex-1">
            <label>Total contract value</label>
            <div className="input-group mb-3">
              <input type="number" min="0" step={helpers.prettyValue(1)} placeholder={helpers.prettyValue(0)} onChange={this.handleInputChange('totalValue')} className="form-control output-value col-6" />
            </div>
            <label>Your input value</label>
            <div className="input-group">
              <input type="number" min="0" onChange={this.handleInputChange('inputValue')} step={helpers.prettyValue(1)} placeholder={helpers.prettyValue(0)} className="form-control output-value col-6" />
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-primary mt-2" onClick={this.send}>Encode</button>
        <p className="text-danger mt-3">{this.state.errorMessage}</p>
        {this.state.raw &&
          <div className="mt-3">
            <p className="mb-0">Encoded transaction</p>
            <p className="mt-2">{this.state.raw}</p>
          </div>
        }
      </div>
    );
  }
}

export default NanoContractsCreate;
