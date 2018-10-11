import React from 'react';
import networkApi from '../api/networkApi';
import ReactLoading from 'react-loading';


function ts_to_string(timestamp) {
  return new Date(timestamp * 1000).toString();
}

function uptime_format(uptime) {
    uptime = Math.floor(uptime);
    const days = Math.floor(uptime / 3600 / 24);
    uptime = uptime % (3600 * 24);
    const hours = Math.floor(uptime / 3600);
    uptime = uptime % 3600;
    const minutes = Math.floor(uptime / 60);
    uptime = uptime % 60;
    const seconds = uptime;
    const pad = (n) => (Math.abs(n) >= 10 ? n : '0' + n);
    const uptime_str = days + ' days, ' + pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
    return uptime_str;
}

class Network extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      connected_peers: [],
      known_peers: [],
      loaded: false
    }
  }

  componentDidMount() {
    networkApi.getPeers().then((peers) => {
      this.setState({
        connected_peers: peers.connections.connected_peers,
        known_peers: peers.known_peers,
        server: peers.server,
        dag: peers.dag,
        loaded: true
      });
    }, (e) => {
      // Error in request
      console.log(e);
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
        <div>
          <div className="card text-white bg-dark" style={{marginBottom: "30px"}}>
            <div className="card-body">
              Id: {this.state.server.id}<br />
              Uptime: {uptime_format(this.state.server.uptime)}<br />
              Version: {this.state.server.app_version}<br />
              Latest timestamp: {ts_to_string(this.state.dag.latest_timestamp)}<br />
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
        let uptime = Math.floor(conn.uptime);
        const days = Math.floor(uptime / 3600 / 24);
        uptime = uptime % (3600 * 24);
        const hours = Math.floor(uptime / 3600);
        uptime = uptime % 3600;
        const minutes = Math.floor(uptime / 60);
        uptime = uptime % 60;
        const seconds = uptime;
        const pad = (n) => (Math.abs(n) >= 10 ? n : '0' + n);
        const uptime_str = days + ' days, ' + pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);

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
              Uptime: {uptime_str}<br />
              Version: {conn.app_version}<br />
              Address: {conn.address}<br />
              Entrypoints: {peer.entrypoints.join(", ")}
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <div>
                  Synced timestamp: {new Date(sync.synced_timestamp * 1000).toString()}<br />
                  Latest timestamp: {new Date(sync.latest_timestamp * 1000).toString()}
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
          return renderDisconnected(peer);
        }
      });
    }

    return (
      <div className="tab-content-wrapper">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : loadTable()}
      </div>
    );
  }
}

export default Network;
