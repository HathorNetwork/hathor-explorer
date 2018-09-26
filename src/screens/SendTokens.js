import React from 'react';
import walletApi from '../api/wallet';
import $ from 'jquery';
import helpers from '../utils/helpers';
import WalletAuth from '../components/WalletAuth';


class SendTokens extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      locked: null
    }

    this.send = this.send.bind(this);
    this.moreOutput = this.moreOutput.bind(this);
    this.unlock = this.unlock.bind(this);
    this.lock = this.lock.bind(this);
  }

  componentDidMount() {
    helpers.checkWalletLock(this.unlock, this.lock);
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
    walletApi.sendTokens(this.getData()).then((response) => {
      this.props.history.push('/wallet');
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
    const renderLockedPage = () => {
      return (
        <WalletAuth unlock={this.unlock} />
      );
    }

    const renderUnlockedPage = () => {
      return (
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
      );
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {this.state.locked === true ? renderLockedPage() : null}
        {this.state.locked === false ? renderUnlockedPage() : null}
      </div>
    );
  }
}

export default SendTokens;