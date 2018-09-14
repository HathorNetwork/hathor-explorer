import React from 'react';
import ReactLoading from 'react-loading';
import txApi from '../api/txApi';
import TxData from '../components/TxData';


class TransactionDetail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      transaction: null,
      loaded: false
    }
  }

  componentDidMount() {
    this.getTx();
  }

  getTx() {
    txApi.getTransaction(this.props.match.params.id).then((data) => {
      // TODO handle error in case tx does not exist
      this.setState({ transaction: data, loaded: true });
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  componentDidUpdate() {
    if (this.state.transaction === null || this.state.transaction.hash !== this.props.match.params.id) {
      this.getTx();
    }
  }

  render() {
    return (
      <div className="flex align-items-center content-wrapper">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : <TxData transaction={this.state.transaction} showRaw={true} />}
      </div>
    );
  }
}

export default TransactionDetail;