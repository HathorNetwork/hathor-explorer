import React from 'react';
import walletApi from '../api/wallet';
import $ from 'jquery';
import helpers from '../utils/helpers';
import dateFormatter from '../utils/date';
import WalletUnlock from '../components/WalletUnlock';
import ReactLoading from 'react-loading';
import { DECIMAL_PLACES } from '../constants';


class SendTokens extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      locked: null,
      walletType: '',
      errorMessage: '',
      outputCount: 1,
      inputCount: 1,
      loading: false,
    }

    this.send = this.send.bind(this);
    this.moreOutput = this.moreOutput.bind(this);
    this.moreInput = this.moreInput.bind(this);
    this.unlock = this.unlock.bind(this);
    this.lock = this.lock.bind(this);
    this.setType = this.setType.bind(this);
  }

  componentDidMount() {
    helpers.checkWalletLock(this.unlock, this.lock, this.setType);
  }

  setType(type) {
    this.setState({ walletType: type });
  }

  lock() {
    this.setState({ locked: true });
  }

  unlock() {
    this.setState({ locked: false });
  }

  moreOutput() {
    let newCount = this.state.outputCount + 1;
    this.setState({ outputCount: newCount });
  }

  moreInput() {
    let newCount = this.state.inputCount + 1;
    this.setState({ inputCount: newCount });
  }

  getData = () => {
    let data = {'outputs': [], 'inputs': []};
    let _this = this;
    let error = false;
    $('.outputs-wrapper .input-group').each(function(index) {
      let address = $(this).find('.output-address').val();
      let value = $(this).find('.output-value').val();

      if (address && value) {
        var dataOutput = {'address': address, 'value': parseInt(value*(10**DECIMAL_PLACES), 10)};

        let hasTimelock = $(this).find('.has-timelock').prop('checked');
        if (hasTimelock) {
          let timelock = $(this).find('.output-timelock').val()
          if (!timelock) {
            _this.setState({ errorMessage: 'You need to fill a complete date and time' });
            error = true
            return;
          }
          let timestamp = dateFormatter.dateToTimestamp(new Date(timelock));
          dataOutput['timelock'] = timestamp;
        }

        data['outputs'].push(dataOutput);
      }
    });

    if (error) {
      return null;
    }

    const noInputs = this.refs.noInputs.checked;

    if (!noInputs) {
      $('.inputs-wrapper .input-group').each(function(idx) {
        let tx_id = $(this).find('.input-id').val();
        let index = $(this).find('.input-index').val();

        if (tx_id && index) {
          data['inputs'].push({'tx_id': tx_id, 'index': index});
        }
      });
    }

    return data;
  }

  send() {
    let data = this.getData();
    if (data) {
      this.setState({ errorMessage: '', loading: true });
      walletApi.sendTokens(this.getData()).then((response) => {
        if (response.success) {
          this.props.history.push('/wallet');
        } else {
          this.setState({ errorMessage: response.message, loading: false });
        }
      }, (e) => {
        // Error in request
        console.log(e);
        this.setState({ loading: false });
      });
    }
  }

  handleCheckboxChange(e) {
    const value = e.target.checked;
    if (value) {
      $('.inputs-wrapper').hide(400);
    } else {
      $('.inputs-wrapper').show(400);
    }
  }

  handleCheckboxTimelockChange(e) {
    const value = e.target.checked;
    if (value) {
      $(e.target).parent().next().show(400);
    } else {
      $(e.target).parent().next().hide(400);
    }
  }

  onDateChange = (date) => {
    this.setState({ date });
  }

  render() {
    const renderOutputs = () => {
      let outputs = [];
      for (let i=0; i<this.state.outputCount; i++) {
        outputs.push(
          <div className="input-group mb-3" key={i}>
            <input type="text" placeholder="Address" className="form-control output-address col-4" />
            <input type="number" step={helpers.prettyValue(1)} placeholder={helpers.prettyValue(0)} className="form-control output-value col-2" />
            <div className="form-check mr-3 d-flex flex-column justify-content-center">
              <input className="form-check-input mt-0 has-timelock" type="checkbox" onChange={this.handleCheckboxTimelockChange}/>
              <label className="form-check-label">
                Time lock
              </label>
            </div>
            <input type="datetime-local" placeholder="Date and time in GMT" step="1" className="form-control output-timelock col-3" style={{display: 'none'}}/>
            {i === 0 ? <button type="button" className="btn btn-primary" onClick={this.moreOutput}>+</button> : null}
          </div>
        )
      }
      return outputs;
    }

    const renderInputs = () => {
      let inputs = [];
      for (let i=0; i<this.state.inputCount; i++) {
        inputs.push(
          <div className="input-group mb-3" key={i}>
            <input type="text" placeholder="Tx id" className="form-control input-id col-4" />
            <input type="text" placeholder="Index" className="form-control input-index col-4" />
            {i === 0 ? <button type="button" className="btn btn-primary" onClick={this.moreInput}>+</button> : null}
          </div>
        )
      }
      return inputs;
    }

    const renderUnlockedPage = () => {
      return (
        <div>
          <form id="formSendTokens">
            <div className="outputs-wrapper">
              <label>Outputs</label>
              {renderOutputs()}
            </div>
            <div className="form-check checkbox-wrapper">
              <input className="form-check-input" type="checkbox" defaultChecked="true" ref="noInputs" id="noInputs" onChange={this.handleCheckboxChange} />
              <label className="form-check-label" htmlFor="noInputs">
                Choose inputs automatically
              </label>
            </div>
            <div className="inputs-wrapper" style={{display: 'none'}}>
              <label htmlFor="inputs">Inputs</label>
              {renderInputs()}
            </div>
            <button type="button" className="btn btn-primary" onClick={this.send}>Send Tokens</button>
          </form>
          <p className="text-danger mt-3">{this.state.errorMessage}</p>
        </div>
      );
    }

    const isLoading = () => {
      return (
        <div className="d-flex flex-row">
          <p className="mr-3">Please, wait while we solve the proof of work and propagate the transaction</p>
          <ReactLoading type='spin' color='#0081af' width={24} height={24} delay={200} />
        </div>
      )
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {this.state.locked === true ? <WalletUnlock walletType={this.state.walletType} unlock={this.unlock}/> : null}
        {this.state.locked === false ? renderUnlockedPage() : null}
        {this.state.loading ? isLoading() : null}
      </div>
    );
  }
}

export default SendTokens;