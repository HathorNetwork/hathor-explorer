import React from 'react';
import walletApi from '../api/wallet';
import QRCode from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import helpers from '../utils/helpers';
import HathorAlert from './HathorAlert';


class WalletAddress extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      address: null,
      loaded: false
    }

    this.getNewAddress = this.getNewAddress.bind(this);
  }

  componentDidMount() {
    this.requestAddress({new: false});
  }

  getNewAddress(e) {
    e.preventDefault();
    this.requestAddress({new: true});
  }

  requestAddress(data) {
    walletApi.getAddress(data).then((data) => {
      if (!this.state.loaded) {
        this.props.loaded();
      }
      this.setState({address: data.address, loaded: true })
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  downloadQrCode(e) {
    e.currentTarget.href = document.getElementsByTagName('canvas')[0].toDataURL();
    e.currentTarget.download = "QrCode.png";
  }

  copied(text, result) {
    if (result) {
      // If copied with success
      helpers.showAlert('alert-copied', 1000);
    }
  }

  render() {
    const renderAddress = () => {
      return (
        <div className="d-flex flex-column align-items-center address-wrapper">
          <QRCode onClick={this.openQrCode} size={200} value={`hathor:${this.state.address}`} />
          <span ref="address" className="mt-1">
            {this.state.address}
            <CopyToClipboard text={this.state.address} onCopy={this.copied}>
              <i className="fa fa-clone pointer ml-1" title="Copy to clipboard"></i>
            </CopyToClipboard>
          </span> 
          <a className="new-address" href="" onClick={(e) => this.getNewAddress(e)}>Generate new address</a>
          <a className="download-qrcode" href="" onClick={(e) => this.downloadQrCode(e)}>Download</a>
        </div>
      );
    }

    return (
      <div>
        {this.state.loaded ? renderAddress() : null}
        <HathorAlert id="alert-copied" text="Copied to clipboard!" type="success" />
      </div>
    );
  }
}

export default WalletAddress;