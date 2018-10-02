import React from 'react';
import walletApi from '../api/wallet';
import $ from 'jquery';
import helpers from '../utils/helpers';
import WalletUnlock from '../components/WalletUnlock';


class SendTokens extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      locked: null,
      walletType: '',
      errorMessage: ''
    }

    this.send = this.send.bind(this);
    this.moreOutput = this.moreOutput.bind(this);
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
    const htmlOutput = `
      <div class="input-group mb-3">
        <input type="text" placeholder="Address" class="form-control output-address col-4" />
        <input type="text" placeholder="Value" class="form-control output-value col-4" />
      </div>
    `
    $('.outputs-wrapper').append($(htmlOutput));
  }

  moreInput() {
    const htmlInput = `
      <div class="input-group mb-3">
          <input type="text" placeholder="Tx id" class="form-control input-id col-4" />
          <input type="text" placeholder="Index" class="form-control input-index col-4" />
      </div>
    `
    $('.inputs-wrapper').append($(htmlInput));
  }

  getData() {
    let data = {'outputs': [], 'inputs': []};
    $('.outputs-wrapper .input-group').each(function(index) {
      let address = $(this).find('.output-address').val();
      let value = $(this).find('.output-value').val();

      if (address && value) {
        data['outputs'].push({'address': address, 'value': value});
      }
    });

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
    this.setState({ errorMessage: '' });
    walletApi.sendTokens(this.getData()).then((response) => {
      if (response.success) {
        this.props.history.push('/wallet');
      } else {
        this.setState({ errorMessage: response.message });
      }
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  handleCheckboxChange(e) {
    const value = e.target.checked;
    if (value) {
      $('.inputs-wrapper').hide(400);
    } else {
      $('.inputs-wrapper').show(400);
    }
  }

  render() {
    const renderUnlockedPage = () => {
      return (
        <div>
          <form id="formSendTokens">
            <div className="outputs-wrapper">
              <label>Outputs</label>
              <div className="input-group mb-3">
                <input type="text" placeholder="Address" className="form-control output-address col-4" />
                <input type="text" placeholder="Value" className="form-control output-value col-4" />
                <button type="button" className="btn btn-primary" onClick={this.moreOutput}>+</button>
              </div>
            </div>
            <div className="form-check checkbox-wrapper">
              <input className="form-check-input" type="checkbox" defaultChecked="true" ref="noInputs" id="noInputs" onChange={this.handleCheckboxChange} />
              <label className="form-check-label" htmlFor="noInputs">
                Choose inputs automatically
              </label>
            </div>
            <div className="inputs-wrapper" style={{display: 'none'}}>
              <label htmlFor="inputs">Inputs</label>
              <div className="input-group mb-3">
                <input type="text" placeholder="Tx id" className="form-control input-id col-4" />
                <input type="text" placeholder="Index" className="form-control input-index col-4" />
                <button type="button" className="btn btn-primary" onClick={this.moreInput}>+</button>
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={this.send}>Send Tokens</button>
          </form>
          <p className="text-danger mt-3">{this.state.errorMessage}</p>
        </div>
      );
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {this.state.locked === true ? <WalletUnlock walletType={this.state.walletType} unlock={this.unlock}/> : null}
        {this.state.locked === false ? renderUnlockedPage() : null}
      </div>
    );
  }
}

export default SendTokens;