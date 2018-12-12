import React from 'react';
import { Link } from 'react-router-dom';
import walletApi from '../api/wallet';
import helpers from '../utils/helpers';
import ReactLoading from 'react-loading';
import { DECIMAL_PLACES } from '../constants';


class NanoContractsDecode extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      errorMessage: '',
      loading: false,
      totalValue: null,             // int
      oraclePubkeyHash: null,       // string
      oracleDataId: null,           // string
      fallbackAddress: null,        // string
      minimumTimestamp: null,       // int
      inputValue: null,             // int
      dataToDecode: null,           // string
      raw: null,                    // string
      myInputsSigned: false,        // List[Dict]
      otherInputsSigned: false,     // List[Dict]
      betAddress: null,             // string
      betValue: null,               // int
    }

    this.send = this.send.bind(this);
    this.sign = this.sign.bind(this);
  }

  getData() {
    let data = {
      'input_value': parseInt(this.state.inputValue*(10**DECIMAL_PLACES), 10),
      'hex_tx': this.state.dataToDecode,
      'new_values': [{'address': this.state.betAddress, 'value': parseInt(this.state.betValue, 10)}],
    };

    return data;
  }

  send() {
    this.setState({ errorMessage: '' });
    walletApi.updateNanoContract(this.getData()).then((response) => {
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

  sign() {
    this.setState({ errorMessage: '', loading: true });
    walletApi.signTx({'hex_tx': this.state.dataToDecode, 'prepare_to_send': true}).then((response) => {
      if (response.success) {
        this.setState({ raw: response.hex_tx, loading: false });
      } else {
        this.setState({ errorMessage: response.message, loading: false });
      }
    }, (e) => {
      // Error in request
      this.setState({ errorMessage: 'Error contacting the server', loading: false });
    });
  }

  handleInputChange = field => e => {
    this.setState({
      [field]: e.target.value
    });
  }

  onDecodeChange = e => {
    this.setState({ dataToDecode: e.target.value });
  }

  decodeClicked = () => {
    walletApi.decodeNanoContract(this.state.dataToDecode).then((response) => {
      if (response.success) {
        const nanoContract = response['nano_contract']

        const myInputs = response['my_inputs'];
        const otherInputs = response['other_inputs'];

        let myInputsSigned = true && myInputs.length > 0;
        myInputs.forEach(input => {
          if (!input['data'] || input['data'].length === 0) {
            myInputsSigned = false;
          }
        });

        let otherInputsSigned = true && otherInputs.length > 0;
        otherInputs.forEach(input => {
          if (!input['data'] || input['data'].length === 0) {
            otherInputsSigned = false;
          }
        });

        this.setState({
          myInputs: myInputs,
          otherInputs: otherInputs,
          outputs: response['outputs'],
          totalValue: nanoContract['value'],
          oraclePubkeyHash: nanoContract['oracle_pubkey_hash'],
          oracleDataId: nanoContract['oracle_data_id'],
          fallbackAddress: nanoContract['fallback_address'],
          minimumTimestamp: nanoContract['min_timestamp'],
          values: nanoContract['value_dict'],
          myInputsSigned: myInputsSigned,
          otherInputsSigned: otherInputsSigned,
        });
      } else {
        this.setState({ errorMessage: response.message });
      }
    }, (e) => {
      // Error in request
      this.setState({ errorMessage: 'Error contacting the server' });
    });
  }

  render() {
    const getHelperText = () => {
        if (this.state.myInputs.length === 0) {
          return <p className="mb-4 font-italic">Double check the nano contract details and enter yout bet information. After encoding the transaction, pass the encoded transaction to the other participants.</p>
        }

        if (!this.state.myInputsSigned) {
          return <p className="mb-4 font-italic">You already entered all nano contract information. You may now sign the nano contract transaction.</p>
        } else if (!this.state.otherInputsSigned) {
          return <p className="mb-4 font-italic">You already signed all your inputs. Send the encoded transaction to the other participants.</p>
        } else {
          return <p className="mb-4 font-italic">Nano contract transaction is ready. Click <Link to='/push-tx/'>here</Link> to push this transaction.</p>
        }
    }

    const renderContractInfo = () => {
      return (
        <div>
          {getHelperText()}

          <div className="d-flex flex-row flex-wrap">
            <div className="d-flex flex-column d-flex-2 mb-3">
              <div>
                <strong>Total contract value:</strong><p>{helpers.prettyValue(this.state.totalValue)}</p>
                <strong>Oracle public key hash:</strong><p>{this.state.oraclePubkeyHash}</p>
                <strong>Oracle data id:</strong><p>{this.state.oracleDataId}</p>
                <strong>Starting timestamp:</strong><p>{this.state.minimumTimestamp}</p>
                <strong>Fallback address:</strong><p>{this.state.fallbackAddress || '(not set)'}</p>
              </div>

              <form id="formSendTokens">
                <div className="outputs-wrapper">
                  <strong>Contract info</strong>
                  <p className="mt-2 mb-1 font-italic">Existing bets</p>
                  { Object.entries(this.state.values).map(([address, value]) => {return (
                    <div key={address} className="mt-2">
                      <span>{address}</span><span className="ml-4">{value}</span>
                    </div>
                  )})}
                  {this.state.myInputs.length === 0 &&
                    <div>
                      <p className="mt-2 mb-1 font-italic">Your bet</p>
                      <div className="input-group mt-2 col-md-9 px-0">
                        <input type="text" onChange={this.handleInputChange('betAddress')} placeholder="Address" className="form-control output-address col-9" />
                        <input type="number" min="0" step="1" onChange={this.handleInputChange('betValue')} placeholder="Bet value" className="form-control output-value col-3 mr-0" />
                      </div>
                    </div>
                  }
                </div>
              </form>
            </div>
            <div className="d-flex flex-column">
              <YourInputs inputs={this.state.myInputs} onChange={this.handleInputChange('inputValue')} />
              <OtherInputs inputs={this.state.otherInputs} />
              <Outputs outputs={this.state.outputs} />
            </div>
          </div>
          <div className="d-flex flex-row mt-3 align-items-center">
            {this.state.myInputs.length === 0 &&
              <button type="button" className="btn btn-primary" onClick={this.send}>Update</button>}
            {this.state.myInputs.length > 0 && !this.state.myInputsSigned &&
              <button type="button" className="btn btn-primary mr-3" onClick={this.sign}>Sign transaction</button>}
            {this.state.loading && <ReactLoading type='spin' color='#0081af' width={24} height={24} delay={200} />}
          </div>
          <p className="text-danger mt-3">{this.state.errorMessage}</p>
          {this.state.raw &&
            <div className="mt-4">
              <p className="mb-0">Encoded transaction</p>
              <p className="mt-2">{this.state.raw}</p>
            </div>
        }
        </div>
      );
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {this.state.totalValue ? renderContractInfo() :
          <div className="d-flex flex-column tx-input-wrapper">
            <div className="d-flex flex-row"> 
              <Link to='/wallet/nano-contracts-create'>
                <button className="btn btn-primary">Create new</button>
              </Link>
              <Link to='/wallet/nano-contracts-execute'>
                <button className="btn btn-primary ml-4">Execute contract</button>
              </Link>
            </div>
            <span className="mb-3"><strong>OR</strong></span>
            <p className="mb-0">Write an existing transaction in hex value and click the button to decode it.</p>
            <textarea rows="5" onChange={this.onDecodeChange}></textarea>
            <button className="btn btn-primary" onClick={this.decodeClicked}>Decode</button>
          </div>
        }
      </div>
    );
  }
}


const YourInputs = ({inputs, onChange}) => (
  <div className="wrapper">
    {inputs.length === 0 ?
      <div>
        <label>Your input value</label>
        <div className="input-group mb-3">
          <input type="number" min="0" onChange={onChange} step={helpers.prettyValue(1)} placeholder={helpers.prettyValue(0)} className="form-control output-value col-6" />
        </div>
      </div>
        : <strong>Your inputs</strong>
    }
    {inputs.map((elem, index) => {
      return getInput(elem, index)
    })}
  
  </div>
)


const OtherInputs = ({inputs}) => (
  <div className="wrapper mt-5">
    <strong>Other inputs</strong>
    {inputs.map((elem, index) => {
      return getInput(elem, index)
    })}
    {inputs.length === 0 && <p>(empty)</p>}
  </div>
)


const Outputs = ({outputs}) => (
  <div className="wrapper mt-5">
    <strong>Outputs</strong>
    {outputs.map((elem, index) => {return (<div key={index}>{ `${helpers.prettyValue(elem['value'])} -> ${elem['address']}`}</div>)}) }
    {outputs.length === 0 && <p>(empty)</p>}
  </div>
)


const getInput = (elem, index) => {
  return (
    <div key={index}>
      <a href={`/transaction/${elem['tx_id']}`} target="_blank">{elem['tx_id'].substring(0,32)}...</a> ({elem['index']})
      {elem['data'] && elem['data'].length ? 
        <i className="fa fa-check ml-2" title="Input is signed"></i> 
        : <i className="fa fa-times ml-2" title="Input is NOT signed"></i>}
    </div>
  )
}


export default NanoContractsDecode;
