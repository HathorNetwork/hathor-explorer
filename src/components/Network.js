import React from 'react';
import networkApi from '../api/networkApi';
import ReactLoading from 'react-loading';


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
      this.setState({ connected_peers: peers.connected_peers, known_peers: peers.known_peers, loaded: true });
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

  render() {
    const loadTable = () => {
      return (
        <table className="table table-striped" id="peer-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Entrypoint</th>
              <th>Connected</th>
            </tr>
          </thead>
          <tbody>
            {loadTableBody()}
          </tbody>
        </table>
      );
    }

    const loadTableBody = () => {
      return this.state.known_peers.map((peer, idx) => {
        return (
          <tr key={peer.id}>
            <td className="pr-3">{peer.id.substring(0, 32)}</td>
            <td className="pr-3">{peer.entrypoints.length ? peer.entrypoints[0] : ''}</td>
            <td>{this.isPeerConnected(peer.id) ? 'Yes' : 'No'}</td>
          </tr>
        );
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