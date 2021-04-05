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

const SyncStates = {
  IN_SYNC: 'in-sync',
  BEHIND: 'behind',
  AHEAD: 'ahead',
  UNKNOWN: 'unknown',
};

const SyncStatesDescription = {
  [SyncStates.IN_SYNC]: 'Synchronized',
  [SyncStates.BEHIND]: <span title="Behind of us">Synchronizing... <i class="fa fa-question-circle"></i></span>,
  [SyncStates.AHEAD]: <span title="Ahead of us">Synchronizing... <i class="fa fa-question-circle"></i></span>,
  [SyncStates.UNKNOWN]: 'Unknown'
};

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

  buildSyncDataPolyfill(conn) {
    const { plugins: { "node-sync-timestamp": timestamps } } = conn;
    const first_timestamp = this.state.dag.first_timestamp;
    const latest_timestamp = this.state.dag.latest_timestamp;
    const delta = latest_timestamp - first_timestamp;
    const progress = (timestamps.synced_timestamp - first_timestamp) / delta;
    let state = SyncStates.UNKNOWN;

    if (timestamps.synced_timestamp < latest_timestamp) {
      state = SyncStates.BEHIND;
    } else if (timestamps.synced_timestamp === latest_timestamp) {
      state = SyncStates.IN_SYNC;
    } else if (timestamps.synced_timestamp > latest_timestamp) {
      state = SyncStates.AHEAD;
    }

    return {
      progress,
      state,
      ...timestamps
    };
  }

  getSyncProgressPercent(sync_data) {
    const { progress = 0 } = sync_data;
    const synced_percent = Math.min(100, Math.max(0, progress * 100));
    const general_percent = 100 - synced_percent;
    return { synced_percent, general_percent };
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
        /**
        * Unified sync information
        * { status: string, progress: number, latest_timestamp: number|null|undefined, synced_timestamp: number|null|undefined }
        */
        const sync_data = conn.sync ?
          { ...conn.sync, ...conn.plugins["node-sync-timestamp"] } : this.buildSyncDataPolyfill(conn);
        const { synced_percent, general_percent } = this.getSyncProgressPercent(sync_data);
        const sync_state_description = SyncStatesDescription[sync_data.state] || SyncStatesDescription[SyncStates.UNKNOWN];

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
              Entrypoints: {peer.entrypoints.join(", ")}<br />
              State: {sync_state_description}
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                  <div>
                    {sync_data.synced_timestamp ? (
                      <>Synced timestamp: {dateFormatter.timestampToString(sync_data.synced_timestamp)}<br /></>
                    ) : null}
                    {sync_data.latest_timestamp ? (
                      <>Latest timestamp: {dateFormatter.timestampToString(sync_data.latest_timestamp)}</>
                    ) : null}
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
