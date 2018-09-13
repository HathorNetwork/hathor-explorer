import React from 'react';
import $ from 'jquery';
import walletApi from '../api/wallet';


class WalletAuthModal extends React.Component {
  componentDidMount() {
    $("#walletAuthModal").on('shown.bs.modal', (e) => {
      $("#password").focus();
    });
  }

  handleUnlock = (e) => {
    if (this.refs.formWalletAuth.checkValidity() === false) {
      this.refs.formWalletAuth.classList.add('was-validated');
    } else {
      this.refs.formWalletAuth.classList.remove('was-validated');
      $('#unlockError').hide();
      // Send POST
      walletApi.unlock(this.refs.password.value).then((res) => {
        if (res.success) {
          $("#walletAuthModal").modal('hide');
          this.props.unlock();
        } else {
          this.showError();
        }
      }, (e) => {
        // Error in request
        console.log(e);
      });
    }
  }

  showError() {
    $('#unlockError').show();
  }

  render() {
    return (
      <div className="modal fade" id="walletAuthModal" tabIndex="-1" role="dialog" aria-labelledby="walletAuthModal" aria-hidden="true" data-keyboard="false" data-backdrop="static">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Unlock wallet</h5>
            </div>
            <div className="modal-body">
              <form ref="formWalletAuth" onSubmit={(e) => {e.preventDefault(); this.handleUnlock()}} noValidate>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input type="password" ref="password" className="form-control" id="password" required />
                </div>
              </form>
              <p className="text-danger" id="unlockError" style={{display: 'none'}}>Invalid password</p>
            </div>
            <div className="modal-footer">
              <button onClick={this.handleUnlock} type="button" className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default WalletAuthModal;