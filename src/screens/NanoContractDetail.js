/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Loading from '../components/Loading';
import TxRow from '../components/tx/TxRow';
import hathorLib from '@hathor/wallet-lib';
import nanoApi from '../api/nanoApi';
import txApi from '../api/txApi';


/**
 * Details of a Nano Contract
 *
 * @memberof Screens
 */
class NanoContractDetail extends React.Component {

  state = {
    loadingDetail: true,
    loadingHistory: true,
    ncState: null,
    history: null,
    errorMessage: null,
  }

  componentDidMount = () => {
    this.loadBlueprintInformation();
    this.loadNCHistory();
  }

  loadBlueprintInformation = async () => {
    this.setState({ loadingDetail: true, data: null });
    try {
      const transactionData = await txApi.getTransaction(this.props.match.params.nc_id);
      if (transactionData.tx.version !== hathorLib.constants.NANO_CONTRACTS_VERSION) {
        this.setState({ errorMessage: 'Transaction is not a nano contract.' });
      }

      const blueprintInformation = await nanoApi.getBlueprintInformation(transactionData.tx.nc_blueprint_id);
      const ncState = await nanoApi.getState(this.props.match.params.nc_id, Object.keys(blueprintInformation.attributes), [], []);
      this.setState({ loadingDetail: false, ncState });
    } catch (e) {
      this.setState({ loadingDetail: false, errorMessage: 'Error getting nano contract state.' });
    }
  }

  loadNCHistory = () => {
    this.setState({ loadingHistory: true, history: null });
    nanoApi.getHistory(this.props.match.params.nc_id).then((data) => {
      this.setState({ loadingHistory: false, history: data.history });
    }, (e) => {
      // Error in request
      this.setState({ loadingHistory: false, errorMessage: 'Error getting nano contract history.' });
    });
  }

  render() {
    if (this.state.errorMessage) {
      return <p className='text-danger mb-4'>{this.state.errorMessage}</p>;
    }

    if (this.state.loadingHistory || this.state.loadingDetail) {
      return <Loading />;
    }

    const loadTable = () => {
      return (
        <div className="table-responsive mt-5">
          <table className="table table-striped" id="tx-table">
            <thead>
              <tr>
                <th className="d-none d-lg-table-cell">Hash</th>
                <th className="d-none d-lg-table-cell">Timestamp</th>
                <th className="d-table-cell d-lg-none" colSpan="2">Hash<br/>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loadTableBody()}
            </tbody>
          </table>
        </div>
      );
    }

    const loadTableBody = () => {
      return this.state.history.map((tx, idx) => {
        // For some reason this API returns tx.hash instead of tx.tx_id like the others
        tx.tx_id = tx.hash;
        return (
          <TxRow key={tx.tx_id} tx={tx} />
        );
      });
    }

    const renderNCAttributes = () => {
      return Object.keys(this.state.ncState.fields).map((field) => (
        <p><strong>{field}: </strong>{this.state.ncState.fields[field].value}</p>
      ));
    }

    // TODO
    //const isTokenNFT = isNFT(this.state.data.nc_data.token);
    return (
      <div className="content-wrapper">
        <h3 className="mt-4">Nano Contract Detail</h3>
        <div className="mt-5">
          <p><strong>Nano Contract ID: </strong>{this.props.match.params.nc_id}</p>
          <p><strong>Blueprint: </strong>{this.state.ncState.blueprint_name}</p>
          <h4 className="mt-5 mb-4">Attributes</h4>
          { renderNCAttributes() }
          <hr />
          <h3 className="mt-4">History</h3>
          {this.state.history && loadTable()}
        </div>
      </div>
    );
  }
}

export default NanoContractDetail;