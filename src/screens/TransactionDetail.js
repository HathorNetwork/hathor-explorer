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
    return (
      <div className="flex align-items-center content-wrapper">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : <TxData transaction={this.state.transaction} />}
      </div>
    );
  }
}

export default TransactionDetail;