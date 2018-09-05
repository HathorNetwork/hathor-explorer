import React from 'react';
import ReactLoading from 'react-loading';
import txApi from '../api/txApi';
import dateFormatter from '../utils/date';


class TransactionDetail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      transaction: null,
      loaded: false
    }
  }

  componentWillMount() {
    txApi.getTransaction(this.props.match.params.id).then((data) => {
      console.log(data);
      this.setState({ transaction: data, loaded: true });
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {

    const renderInputs = (inputs) => {
      return inputs.map((input, idx) => {
        return (
          <li key={input.self_id}>{input.self_id} ({input.index})</li>
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
          <div><label>Hash:</label> {this.state.transaction.hash}</div>
          <div><label>Type:</label> {this.state.transaction.inputs.length > 0 ? 'Tx' : 'Block'}</div>
          <div><label>Time:</label> {dateFormatter.parseTimestamp(this.state.transaction.timestamp)}</div>
          <div><label>Nonce:</label> {this.state.transaction.nonce}</div>
          <div><label>Weight:</label> {this.state.transaction.weight}</div>
          <div><label>Height:</label> {this.state.transaction.height}</div>
          <div>
            <label>Inputs:</label>
            <ul>
              {renderInputs(this.state.transaction.inputs)}
            </ul>
          </div>
          <div>
            <label>Outputs:</label>
            <ul>
              {renderOutputs(this.state.transaction.outputs)}
            </ul>
          </div>
          <div>
            <label>Parents:</label>
            <ul>
              {renderParents(this.state.transaction.parents)}
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="flex align-items-center content-wrapper">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : loadTxData()}
      </div>
    );
  }
}

export default TransactionDetail;