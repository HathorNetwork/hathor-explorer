import React from 'react';
import dateFormatter from '../utils/date';


class TxData extends React.Component {
  render() {

    const renderInputs = (inputs) => {
      return inputs.map((input, idx) => {
        return (
          <li key={input.tx_id}>{input.tx_id} ({input.index})</li>
        );
      });
    }

    const renderOutputs = (outputs) => {
      return outputs.map((output, idx) => {
        return (
          <li key={idx}>{output.value} -> {output.script}</li>
        );
      });
    }

    const renderParents = (parents) => {
      return parents.map((parent, idx) => {
        return (
          <li key={parent}>{parent}</li>
        );
      });
    }

    const loadTxData = () => {
      return (
        <div className="tx-data-wrapper">
          <div><label>Hash:</label> {this.props.transaction.hash}</div>
          <div><label>Type:</label> {this.props.transaction.inputs.length > 0 ? 'Tx' : 'Block'}</div>
          <div><label>Time:</label> {dateFormatter.parseTimestamp(this.props.transaction.timestamp)}</div>
          <div><label>Nonce:</label> {this.props.transaction.nonce}</div>
          <div><label>Weight:</label> {this.props.transaction.weight}</div>
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
        </div>
      );
    }

    return (
      <div>
        {loadTxData()}
      </div>
    );
  }
}

export default TxData;