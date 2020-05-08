/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactLoading from 'react-loading';
import { connect } from "react-redux";
import colors from '../index.scss';
import helpers from '../utils/helpers';
import economicsApi from '../api/economics';
import hathorLib from '@hathor/wallet-lib';


const mapStateToProps = (state) => {
  return { data: state.data };
};


class Dashboard extends React.Component {
  /**
   * totalSupply {Number} Network total supply from economics API
   * circulatingSupply {Number} Network circulating supply from economics API
   */
  state = {
    totalSupply: 0,
    circulatingSupply: 0,
  }

  componentDidMount() {
    this.updateEconomicsData();
  }

  updateEconomicsData = () => {
    // Update total supply
    economicsApi.getTotalSupply().then((response) => {
      this.setState({ totalSupply: hathorLib.helpers.prettyValue(response) });
    });

    // Update circulating supply
    economicsApi.getCirculatingSupply().then((response) => {
      this.setState({ circulatingSupply: hathorLib.helpers.prettyValue(response) });
    });
  }

  render() {
    if (this.props.data.length === 0) {
      return (
        <div className="content-wrapper">
          <ReactLoading type='spin' color={colors.purpleHathor} delay={500} />
        </div>
      );
    }

    const index = this.props.data.length - 1;
    const blocks = this.props.data[index].blocks;
    const transactions = this.props.data[index].transactions;
    const peers = this.props.data[index].peers;
    const height = this.props.data[index].best_block_height;

    const hashRateValue = parseFloat(this.props.data[index].hash_rate.toFixed(2));
    const prettyfied = helpers.divideValueIntoPrefix(hashRateValue);
    const prettyValue = prettyfied.value;
    const prefix = helpers.getUnitPrefix(prettyfied.divisions);
    const hashRate = `${prettyValue} ${prefix}h/s`;

    return (
      <div className="content-wrapper">
        <p><strong>Blocks: </strong>{blocks}</p>
        <p><strong>Height of the best chain: </strong>{height}</p>
        <p><strong>Transactions: </strong>{transactions}</p>
        <p><strong>Peers: </strong>{peers}</p>
        <p><strong>Hash rate: </strong>{hashRate}</p>
        <p><strong>Circulating supply: </strong>{this.state.circulatingSupply}</p>
        <p><strong>Total supply: </strong>{this.state.totalSupply}</p>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);