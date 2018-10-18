import React from 'react';
import dateFormatter from '../utils/date';
import $ from 'jquery';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import helpers from '../utils/helpers';
import HathorAlert from './HathorAlert';


class TxData extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      raw: false
    }
  }

  toggleRaw(e) {
    e.preventDefault();
    this.setState({ raw: !this.state.raw }, () => {
      if (this.state.raw) {
        $(this.refs.rawTx).show(300);
      } else {
        $(this.refs.rawTx).hide(300);
      }
    });
  }

  copied(text, result) {
    if (result) {
      // If copied with success
      helpers.showAlert('alert-copied', 1000);
    }
  }

  render() {

    const renderInputs = (inputs) => {
      return inputs.map((input, idx) => {
        return (
          <li key={`${input.tx_id}${input.index}`}><a target="_blank" href={`/transaction/${input.tx_id}`}>{input.tx_id}</a> ({input.index})</li>
        );
      });
    }

    const renderOutputs = (outputs) => {
      return outputs.map((output, idx) => {
        return (
          <li key={idx}>
            {output.value} -> {output.decoded ? renderDecodedScript(output.decoded) : `${output.script} (unknown script)` }
          </li>
        );
      });
    }

    const renderDecodedScript = (decoded) => {
      switch (decoded.type) {
        case 'P2PKH':
          return `${decoded.address} [P2PKH]`;
        default:
          return 'Unable to decode';
      }
    }

    const renderParents = (parents) => {
      return parents.map((parent, idx) => {
        return (
          <li key={parent}><a target="_blank" href={`/transaction/${parent}`}>{parent}</a></li>
        );
      });
    }

    const loadTxData = () => {
      return (
        <div className="tx-data-wrapper">
          <div><label>Hash:</label> {this.props.transaction.hash}</div>
          <div><label>Type:</label> {helpers.getTxType(this.props.transaction)}</div>
          <div><label>Time:</label> {dateFormatter.parseTimestamp(this.props.transaction.timestamp)}</div>
          <div><label>Nonce:</label> {this.props.transaction.nonce}</div>
          <div><label>Weight:</label> {helpers.roundFloat(this.props.transaction.weight)}</div>
          <div><label>Accumulated weight:</label> {helpers.roundFloat(this.props.transaction.accumulated_weight)}</div>
          <div><label>Height:</label> {this.props.transaction.height}</div>
          <div>
            <label>Inputs:</label>
            <ul>
              {renderInputs(this.props.transaction.inputs)}
            </ul>
          </div>
          <div>
            <label>Outputs:</label>
            <ul>
              {renderOutputs(this.props.transaction.outputs)}
            </ul>
          </div>
          <div>
            <label>Parents:</label>
            <ul>
              {renderParents(this.props.transaction.parents)}
            </ul>
          </div>
          {this.props.showRaw ? showRawWrapper() : null}
        </div>
      );
    }

    const showRawWrapper = () => {
      return (
        <div>
          <a href="" onClick={(e) => this.toggleRaw(e)}>{this.state.raw ? 'Hide raw transaction' : 'Show raw transaction'}</a>
          {this.state.raw ?
            <CopyToClipboard text={this.props.transaction.raw} onCopy={this.copied}>
              <i className="fa fa-clone pointer ml-1" title="Copy raw tx to clipboard"></i>
            </CopyToClipboard>
          : null}
          <p className="mt-3" ref="rawTx" style={{display: 'none'}}>{this.props.transaction.raw}</p>
        </div>
      );
    }

    return (
      <div>
        {loadTxData()}
        <HathorAlert id="alert-copied" text="Copied to clipboard!" type="success" />
      </div>
    );
  }
}

export default TxData;
