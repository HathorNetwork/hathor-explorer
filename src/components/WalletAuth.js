import React from 'react';
import $ from 'jquery';
import walletApi from '../api/wallet';


class WalletAuth extends React.Component {
  componentDidMount() {
    $(this.refs.password).focus();
  }

  handleUnlock = (e) => {
    if (this.refs.formWalletAuth.checkValidity() === false) {
      this.refs.formWalletAuth.classList.add('was-validated');
    } else {
      this.refs.formWalletAuth.classList.remove('was-validated');
      $(this.refs.unlockError).hide();
      // Send POST
      walletApi.unlock(this.refs.password.value).then((res) => {
        if (res.success) {
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
    $(this.refs.unlockError).show();
  }

  render() {
    return (
      <div>
        <p><strong>Your wallet is locked. Please write your password to unlock it</strong></p>
        <form ref="formWalletAuth" onSubmit={(e) => {e.preventDefault(); this.handleUnlock()}} noValidate>
          <div className="form-group col-md-4 pl-0">
            <label htmlFor="password">Password</label>
            <input type="password" ref="password" className="form-control" id="password" required />
          </div>
          <button onClick={this.handleUnlock} type="button" className="btn btn-primary">Unlock</button>
        </form>
        <p className="text-danger mt-3" id="unlockError" ref="unlockError" style={{display: 'none'}}>Invalid password</p>
      </div>
    )
  }
}

export default WalletAuth;