import React from 'react';
import walletApi from '../api/wallet';
import $ from 'jquery';


class SendTokens extends React.Component {
  constructor(props) {
    super(props);

    this.send = this.send.bind(this);
    this.moreOutput = this.moreOutput.bind(this);
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

    $('.inputs-wrapper .input-group').each(function(idx) {
      let tx_id = $(this).find('.input-id').val();
      let index = $(this).find('.input-index').val();

      if (tx_id && index) {
        data['inputs'].push({'tx_id': tx_id, 'index': index});
      }
    });

    return data;
  }

  send() {
    walletApi.sendTokens(this.getData()).then((response) => {
      console.log(response);
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {
    return (
      <div className="content-wrapper flex align-items-center">
        <form id="formSendTokens">
          <div className="outputs-wrapper">
            <label>Outputs</label>
            <div className="input-group mb-3">
              <input type="text" placeholder="Address" className="form-control output-address col-4" />
              <input type="text" placeholder="Value" className="form-control output-value col-4" />
              <button type="button" className="btn btn-primary" onClick={this.moreOutput}>+</button>
            </div>
          </div>
          <div className="inputs-wrapper">
            <label htmlFor="inputs">Inputs</label>
            <div className="input-group mb-3">
              <input type="text" placeholder="Tx id" className="form-control input-id col-4" />
              <input type="text" placeholder="Index" className="form-control input-index col-4" />
              <button type="button" className="btn btn-primary" onClick={this.moreInput}>+</button>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={this.send}>Send Tokens</button>
        </form>
      </div>
    );
  }
}

export default SendTokens;