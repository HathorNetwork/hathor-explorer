/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import networkApi from '../api/networkApi';
import Loading from './Loading';
import HathorSelect from './HathorSelect';
import dateFormatter from '../utils/date';
import colors from '../index.scss';
import { ReactComponent as InfoIcon } from '../assets/images/icon-info.svg';

const SyncStates = {
  IN_SYNC: 'in-sync',
  BEHIND: 'behind',
  AHEAD: 'ahead',
  UNKNOWN: 'unknown',
};

const SyncStatesDescription = {
  [SyncStates.IN_SYNC]: 'Synchronized',
  [SyncStates.BEHIND]: (
    <span title="Behind of us">
      Synchronizing... <i className="fa fa-question-circle"></i>
    </span>
  ),
  [SyncStates.AHEAD]: (
    <span title="Ahead of us">
      Synchronizing... <i className="fa fa-question-circle"></i>
    </span>
  ),
  [SyncStates.UNKNOWN]: 'Unknown',
};

class Network extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      connected_peers: [],
      known_peers: [],
      loaded: false,
      isLoading: false,
      peers: [],
      peerId: '',
    };
  }

  componentDidMount() {
    this.loadPeers();
  }

  loadPeers() {
    const { match: params } = this.props;

    networkApi
      .getPeerList()
      .then(peers => {
        if (peers.error === undefined && peers.length === 0) {
          throw new Error('No peers present.');
        }
        this.setState({ peers }, () => {
          let peerId = peers.find(target => target === params.peerId);
          if (!peerId) {
            [peerId] = peers;
          }
          this.onPeerChange(peerId);
        });
      })
      .catch(ex => {
        console.log(ex);
        setTimeout(this.loadPeers.bind(this), 1000);
      });
  }

  onPeerChange(peerId) {
    this.props.history.push(`/network/${peerId}`);
    clearInterval(this.loadTimer);
    this.setState({ peerId, loaded: false }, () => {
      this.loadData();
      this.loadTimer = setInterval(this.loadData.bind(this), 1000);
    });
  }

  loadData() {
    if (this.state.isLoading) return;

    this.setState({ isLoading: true }, () => {
      networkApi.getPeer(this.state.peerId).then(
        peer => {
          this.setState({
            ...peer,
            loaded: true,
            isLoading: false,
          });
        },
        e => {
          // Error in request
          console.log(e);
          this.setState({ isLoading: false });
        }
      );
    });
  }

  isPeerConnected(id) {
    return (
      this.state.connected_peers.filter(peer => {
        return peer.id === id;
      }).length > 0
    );
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
    let state = SyncStates.UNKNOWN;
    const { protocol_version } = conn;

    let progress = 0;
    if (protocol_version.startsWith('sync-v2')) {
      const server_best_block = this.state.best_block;
      const { peer_best_block, synced_block } = conn;

      if (server_best_block && synced_block && peer_best_block) {
        progress = synced_block.height / server_best_block.height;
        if (server_best_block.id === synced_block.id) {
          state = SyncStates.IN_SYNC;
        } else if (peer_best_block.height < server_best_block.height) {
          state = SyncStates.BEHIND;
        } else if (peer_best_block.height > server_best_block.height) {
          state = SyncStates.AHEAD;
        }
      } else {
        state = SyncStates.UNKNOWN;
      }
      return {
        progress,
        state,
        synced_block,
        peer_best_block,
      };
    }
    if (protocol_version.startsWith('sync-v1')) {
      const { first_timestamp, latest_timestamp } = this.state;
      const { sync_timestamp } = conn;
      const delta = latest_timestamp - first_timestamp;
      progress = (sync_timestamp - first_timestamp) / delta;
      if (sync_timestamp < latest_timestamp) {
        state = SyncStates.BEHIND;
      } else if (sync_timestamp === latest_timestamp) {
        state = SyncStates.IN_SYNC;
      } else if (sync_timestamp > latest_timestamp) {
        state = SyncStates.AHEAD;
      }
      return {
        progress,
        state,
        sync_timestamp,
        latest_timestamp: conn.latest_timestamp,
      };
    }
    return {
      state,
    };
  }

  getSyncProgressPercent(sync_data) {
    const { progress = 0 } = sync_data;
    const synced_percent = Math.min(100, Math.max(0, progress * 100));
    const general_percent = 100 - synced_percent;
    return { synced_percent, general_percent };
  }

  getPeerIdAbbrev(peerId) {
    return `${peerId.substr(0, 8)}...${peerId.substr(-8, 8)}`;
  }

  renderNewUi() {
    const loadTable = () => {
      return (
        <div style={{ width: '100%' }}>
          <div className="network-data-top" style={{ marginBottom: '30px' }}>
            <div>
              <span>ID</span>
              <span>{this.state.id}</span>
            </div>
            <div>
              <span>UPTIME</span>
              <span>{dateFormatter.uptimeFormat(this.state.uptime)}</span>
            </div>
            <div>
              <span>VERSION</span>
              <span>{this.state.app_version}</span>
            </div>
            <div>
              <span>
                LATEST
                <br />
                TIMESTAMP
              </span>
              <span>{dateFormatter.timestampToString(this.state.latest_timestamp)}</span>
            </div>
            {this.state.best_block ? (
              <div>
                <span>BEST BLOCK</span>
                <span>
                  {this.state.best_block.height} ({this.state.best_block.id})
                </span>
              </div>
            ) : null}
          </div>
          {loadTableBody()}
        </div>
      );
    };

    const renderConnected = (peer, conn) => {
      /**
       * Unified sync information
       * { status: string, progress: number, latest_timestamp: number|null|undefined, sync_timestamp: number|null|undefined }
       */
      const sync_data = conn.sync ? { ...conn.sync } : this.buildSyncDataPolyfill(conn);
      const { synced_percent, general_percent } = this.getSyncProgressPercent(sync_data);
      const sync_state_description =
        SyncStatesDescription[sync_data.state] || SyncStatesDescription[SyncStates.UNKNOWN];

      const entrypoints = conn.entrypoints || [];

      return (
        <div key={peer} style={{ marginBottom: '30px' }} className="network-card">
          <h6 className="network-card-header">
            <span className="token-peer">{peer}</span>
            <span className="float-right">
              <span className="badge badge-success">Connected</span>
            </span>
          </h6>
          <hr />
          <div className="network-card-body">
            <div>
              <span>UPTIME</span>
              <span>{dateFormatter.uptimeFormat(conn.uptime)}</span>
            </div>
            <div>
              <span>VERSION</span>
              <span>{conn.app_version}</span>
            </div>
            <div>
              <span>PROTOCOL</span>
              <span>{conn.protocol_version}</span>
            </div>
            <div>
              <span>ADDRESS</span>
              <span>{conn.address}</span>
            </div>
            <div>
              <span>ENTRYPOINTS</span>
              <span>{entrypoints.join(', ')}</span>
            </div>
            <div>
              <span>STATE</span>
              <span>{sync_state_description}</span>
            </div>
          </div>
          <hr />
          <div className="network-card-body-bottom">
            {sync_data.sync_timestamp ? (
              <div>
                <span>SYNCED TIMESTAMP</span>
                <span>{dateFormatter.timestampToString(sync_data.sync_timestamp)}</span>
              </div>
            ) : null}
            {sync_data.latest_timestamp ? (
              <div>
                <span>LATEST TIMESTAMP</span>
                <span>{dateFormatter.timestampToString(sync_data.latest_timestamp)}</span>
              </div>
            ) : null}
            {sync_data.synced_block ? (
              <div>
                <span>SYNCED BLOCK</span>
                <span>
                  {sync_data.synced_block.height} ({sync_data.synced_block.id})
                </span>
              </div>
            ) : null}
            {sync_data.peer_best_block ? (
              <div>
                <span>BEST BLOCK</span>
                <span>
                  {sync_data.peer_best_block.height} ({sync_data.peer_best_block.id})
                </span>
              </div>
            ) : null}
            <div className="progress">
              <div
                className="progress-bar bg-success"
                style={{ width: `${synced_percent}%`, borderRadius: '5px' }}
              ></div>
              <div
                className="progress-bar bg-warning"
                style={{ width: `${general_percent}%`, borderRadius: '5px' }}
              ></div>
            </div>
          </div>
        </div>
      );
    };

    const loadTableBody = () => {
      return this.state.known_peers.map((peer, _idx) => {
        const conn = this.getConnection(peer);
        const isConnected = !!conn;
        if (isConnected) {
          return renderConnected(peer, conn);
        }
        return null;
      });
    };

    const renderControls = () => {
      if (!this.state.loaded) {
        return null;
      }

      const selectPeer = () => {
        const selectP = this.state.peers.find(peer => peer === this.state.peerId);
        if (selectP) {
          return {
            key: selectP,
            name: `${this.getPeerIdAbbrev(selectP)}`,
          };
        }

        return null;
      };

      const renderPeerOptions = () => {
        return this.state.peers.map(peer => {
          return {
            key: peer,
            name: `${this.getPeerIdAbbrev(peer)}`,
          };
        });
      };

      return (
        <div className="network-top">
          <div className="peer-info">
            <span>PEER</span>
            <div className="peer-info-icon">
              <InfoIcon />
              <span className="new-info-hover-popover">
                Select a peer to check its network status.
              </span>
            </div>
          </div>
          <div className="network-select-reload">
            <HathorSelect
              value={selectPeer()}
              options={renderPeerOptions()}
              onSelect={e => this.onPeerChange(e)}
              style={{ width: '500px' }}
            />
            <button className="network-reload-btn" onClick={() => this.loadData()}>
              Reload Data
            </button>
          </div>
        </div>
      );
    };

    return (
      <>
        {renderControls()}
        {!this.state.loaded ? (
          <Loading type="spin" color={colors.purpleHathor} delay={500} />
        ) : (
          loadTable()
        )}
      </>
    );
  }

  renderUi() {
    const loadTable = () => {
      return (
        <div style={{ width: '100%' }}>
          <div className="card text-white bg-dark" style={{ marginBottom: '30px' }}>
            <div className="card-body">
              Id: {this.state.id}
              <br />
              Uptime: {dateFormatter.uptimeFormat(this.state.uptime)}
              <br />
              Version: {this.state.app_version}
              <br />
              Latest timestamp: {dateFormatter.timestampToString(this.state.latest_timestamp)}
              <br />
              {this.state.best_block ? (
                <>
                  Best block: {this.state.best_block.height} ({this.state.best_block.id})<br />
                </>
              ) : null}
            </div>
          </div>
          {loadTableBody()}
        </div>
      );
    };

    const renderConnected = (peer, conn) => {
      /**
       * Unified sync information
       * { status: string, progress: number, latest_timestamp: number|null|undefined, sync_timestamp: number|null|undefined }
       */
      const sync_data = conn.sync ? { ...conn.sync } : this.buildSyncDataPolyfill(conn);
      const { synced_percent, general_percent } = this.getSyncProgressPercent(sync_data);
      const sync_state_description =
        SyncStatesDescription[sync_data.state] || SyncStatesDescription[SyncStates.UNKNOWN];

      const entrypoints = conn.entrypoints || [];

      return (
        <div key={peer} style={{ marginBottom: '30px' }} className={'card bg-light border-success'}>
          <h6 className="card-header">
            {peer}
            <span className="float-right">
              <span className="badge badge-success">Connected</span>
            </span>
          </h6>
          <div className="card-body">
            Uptime: {dateFormatter.uptimeFormat(conn.uptime)}
            <br />
            Version: {conn.app_version}
            <br />
            Protocol: {conn.protocol_version}
            <br />
            Address: {conn.address}
            <br />
            Entrypoints: {entrypoints.join(', ')}
            <br />
            State: {sync_state_description}
          </div>
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <div>
                {sync_data.sync_timestamp ? (
                  <>
                    Synced timestamp: {dateFormatter.timestampToString(sync_data.sync_timestamp)}
                    <br />
                  </>
                ) : null}
                {sync_data.latest_timestamp ? (
                  <>
                    Latest timestamp: {dateFormatter.timestampToString(sync_data.latest_timestamp)}
                  </>
                ) : null}
                {sync_data.synced_block ? (
                  <>
                    Synced block: {sync_data.synced_block.height} ({sync_data.synced_block.id})
                    <br />
                  </>
                ) : null}
                {sync_data.peer_best_block ? (
                  <>
                    Best block: {sync_data.peer_best_block.height} ({sync_data.peer_best_block.id})
                    <br />
                  </>
                ) : null}
              </div>
              <div className="progress">
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${synced_percent}%` }}
                ></div>
                <div
                  className="progress-bar bg-warning"
                  style={{ width: `${general_percent}%` }}
                ></div>
              </div>
            </li>
          </ul>
        </div>
      );
    };

    const loadTableBody = () => {
      return this.state.known_peers.map((peer, _idx) => {
        const conn = this.getConnection(peer);
        const isConnected = !!conn;
        if (isConnected) {
          return renderConnected(peer, conn);
        }
        return null;
      });
    };

    const renderControls = () => {
      if (!this.state.loaded) {
        return null;
      }

      return (
        <div className="form-inline mb-3">
          <label>
            Peer:
            <select
              name="peers"
              className="form-control mx-2"
              value={this.state.peerId}
              onChange={event => this.onPeerChange(event.target.value)}
            >
              {this.state.peers.map(peer => {
                return (
                  <option value={peer} key={peer}>
                    {this.getPeerIdAbbrev(peer)}
                  </option>
                );
              })}
            </select>
          </label>
          <button className="info-hover-wrapper float-right btn btn-link">
            <i className="fa fa-info-circle" title="Select a peer"></i>
            <span className="subtitle subtitle info-hover-popover">
              Select a peer to check its network status.
            </span>
          </button>
          <button className="btn btn-hathor ms-auto" onClick={() => this.loadData()}>
            Reload data
          </button>
        </div>
      );
    };

    return (
      <>
        {renderControls()}
        {!this.state.loaded ? (
          <Loading type="spin" color={colors.purpleHathor} delay={500} />
        ) : (
          loadTable()
        )}
      </>
    );
  }

  render() {
    return this.props.newUiEnabled ? this.renderNewUi() : this.renderUi();
  }
}

export default Network;
