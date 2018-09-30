import React from 'react';
import $ from 'jquery';
import walletApi from '../api/wallet';
import ReactLoading from 'react-loading';


class HDWalletAuth extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      unlocking: false,
      errorMessage: '',
      newWords: null,
      formInvalid: null,
      noWords: true,
      words: null,
      passphrase: '',
    }

    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleChangeWords = this.handleChangeWords.bind(this);
    this.handleChangePassphrase = this.handleChangePassphrase.bind(this);
  }

  unlock = () => {
    // Send POST
    let words = null;
    if (!this.state.noWords) {
      words = this.state.words;
    }
    walletApi.unlockHD(words, this.state.passphrase).then((res) => {
      if (res.success) {
        if (res.words) {
          this.setState({ newWords: res.words });
        } else {
          this.props.unlock();
        }
      } else {
        this.setState({ errorMessage: res.message });
      }
      this.setState({ unlocking: false });
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  handleUnlock = (e) => {
    const formInvalid = !this.refs.formWalletAuth.checkValidity();
    if (formInvalid) {
      this.setState({ formInvalid: formInvalid });
    } else {
      this.setState({ formInvalid: formInvalid, unlocking: true, errorMessage: '' });
      this.unlock();
    }
  }

  handleCheckboxChange(e) {
    const value = e.target.checked;
    this.setState({ noWords: value });
    if (value) {
      $(this.refs.wordsWrapper).hide(400);
    } else {
      $(this.refs.wordsWrapper).show(400);
    }
  }

  handleChangeWords(e) {
    this.setState({ words: e.target.value });
  }

  handleChangePassphrase(e) {
    this.setState({ passphrase: e.target.value });
  }

  render() {
    const renderNewWords = () => {
      return (
        <div>
          <p>Your generated words are: <strong>{this.state.newWords}</strong></p>
          <p>Backup those words because this is the last time you will see them.</p>
          <button onClick={this.props.unlock} type="button" className="btn btn-primary">Ok, I have already saved them!</button>
        </div>
      );
    }

    const renderUnlock = () => {
      return (
        <div>
          <p><strong>Your wallet is locked. Please write your words and passphrase to unlock it</strong></p>
          <form ref="formWalletAuth" className={this.state.formInvalid ? 'was-validated' : ''} onSubmit={(e) => {e.preventDefault(); this.handleUnlock()}} noValidate>
            <div className="form-check checkbox-wrapper">
              <input className="form-check-input" type="checkbox" defaultChecked="true" ref="noWords" id="noWords" onChange={this.handleCheckboxChange} />
              <label className="form-check-label" htmlFor="noWords">
                Choose words automatically
              </label>
            </div>
            <div ref="wordsWrapper" className="words-wrapper mt-3" style={{display: 'none'}}>
              <label htmlFor="words">Words</label>
              <input type="text" ref="words" className="form-control" id="words" onChange={this.handleChangeWords} />
            </div>
            <div className="form-group col-md-4 pl-0 mt-3">
              <label htmlFor="passphrase">Passphrase</label>
              <input type="password" ref="passphrase" className="form-control" id="passphrase" onChange={this.handleChangePassphrase} />
            </div>
            <div className="d-flex align-items-center">
              <button onClick={this.handleUnlock} type="button" className="btn btn-primary mr-3">Unlock</button>
              {this.state.unlocking ? <ReactLoading type='spin' color='#0081af' width={32} height={32} delay={500} /> : null}
            </div>
          </form>
          <p className="text-danger mt-3" id="unlockError" ref="unlockError">{this.state.errorMessage}</p>
        </div>
      );
    }

    return (
      <div>
        {this.state.newWords ? renderNewWords() : renderUnlock()}
      </div>
    )
  }
}

export default HDWalletAuth;