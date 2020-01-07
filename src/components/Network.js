/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import networkApi from '../api/networkApi';
import ReactLoading from 'react-loading';
import dateFormatter from '../utils/date';
import colors from '../index.scss';


class Network extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      connected_peers: [],
      known_peers: [],
      loaded: false,
      isLoading: false
    }

    this.loadData = this.loadData.bind(this);
  }

  componentDidMount() {
    this.loadData();
    this.loadTimer = setInterval(this.loadData, 1000);
  }

  loadData() {
    if (this.state.isLoading) return;

    this.setState({ isLoading: true }, () => {
      networkApi.getPeers().then((peers) => {
        this.setState({
          connected_peers: peers.connections.connected_peers,
          known_peers: peers.known_peers,
          server: peers.server,
          dag: peers.dag,
          loaded: true,
          isLoading: false
        });
      }, (e) => {
        // Error in request
        console.log(e);
        this.setState({ isLoading: false });
      });
    });
  }

  isPeerConnected(id) {
    return this.state.connected_peers.filter((peer) => {
      return peer.id === id;
    }).length > 0;
  }

  getConnection(id) {
    for (const conn of this.state.connected_peers) {
      if (conn.id === id) {
        return conn;
      }
    }
    return null;
  }

  render() {
    const loadTable = () => {
      return (
        <div style={{width: "100%"}}>
          <div className="card text-white bg-dark" style={{marginBottom: "30px"}}>
            <div className="card-body">
              Id: {this.state.server.id}<br />
              Uptime: {dateFormatter.uptimeFormat(this.state.server.uptime)}<br />
              Version: {this.state.server.app_version}<br />
              Latest timestamp: {dateFormatter.timestampToString(this.state.dag.latest_timestamp)}<br />
            </div>
          </div>
          {loadTableBody()}
        </div>
      );
    }

    const renderDisconnected = (peer) => {
        return (
          <div key={peer.id} style={{marginBottom: "30px"}} className={"card bg-light border-danger"}>
            <h6 className="card-header">
              {peer.id}
              <span className="float-right">
                <span className="badge badge-danger">Disconnected</span>
              </span>
            </h6>
            {peer.entrypoints.length > 0
            ? (<div className="card-body">
                {peer.entrypoints.join(", ")}
              </div>) 
            : ''}
          </div>
        );
    };

    const renderConnected = (peer, conn) => {
        const sync = conn.plugins["node-sync-timestamp"];
        const first_timestamp = this.state.dag.first_timestamp;
        const latest_timestamp = this.state.dag.latest_timestamp;
        const delta = latest_timestamp - first_timestamp;
        const synced_percent = 100 * (sync.synced_timestamp - first_timestamp) / delta;
        let general_percent = (100 * (sync.latest_timestamp - first_timestamp) / delta) - synced_percent;
        if (general_percent > 100) {
          general_percent = 100;
        }

        return (
          <div key={peer.id} style={{marginBottom: "30px"}} className={"card bg-light border-success"}>
            <h6 className="card-header">
              {peer.id}
              <span className="float-right">
                <span className="badge badge-success">Connected</span>
              </span>
            </h6>
            <div className="card-body">
              Uptime: {dateFormatter.uptimeFormat(conn.uptime)}<br />
              Version: {conn.app_version}<br />
              Address: {conn.address}<br />
              Entrypoints: {peer.entrypoints.join(", ")}
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <div>
                  Synced timestamp: {dateFormatter.timestampToString(sync.synced_timestamp)}<br />
                  Latest timestamp: {dateFormatter.timestampToString(sync.latest_timestamp)}
                </div>
                <div className="progress">
                  <div className="progress-bar bg-success" style={{width: synced_percent + "%"}}></div>
                  <div className="progress-bar bg-warning" style={{width: general_percent + "%"}}></div>
                </div>
              </li>
            </ul>
          </div>
        );
    };

    const loadTableBody = () => {
      return this.state.known_peers.map((peer, idx) => {
        const conn = this.getConnection(peer.id);
        const isConnected = !!conn;
        if (isConnected) {
          return renderConnected(peer, conn);
        } else {
          return null;
        }
      });
    }

    return (
      <div className="d-flex flex-column align-items-end">
        {this.state.loaded ? <button className='btn btn-hathor mb-3' onClick={this.loadData}>Reload data</button> : null}
        {!this.state.loaded ? <ReactLoading type='spin' color={colors.purpleHathor} delay={500} /> : loadTable()}
      </div>
    );
  }
}

export default Network;
