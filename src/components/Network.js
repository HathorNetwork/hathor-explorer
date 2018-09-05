import React from 'react';
import networkApi from '../api/networkApi';
import ReactLoading from 'react-loading';


class Network extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      peers: [],
      loaded: false
    }
  }

  componentWillMount() {
    networkApi.getPeers().then((peers) => {
      this.setState({ peers: peers.connected_peers, loaded: true });
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {
    const loadTable = () => {
      return (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Address</th>
              <th>Last message</th>
            </tr>
          </thead>
          <tbody>
            {loadTableBody()}
          </tbody>
        </table>
      );
    }

    const loadTableBody = () => {
      return this.state.peers.map((peer, idx) => {
        return (
          <tr key={peer.id}>
            <td className="pr-3">{peer.id}</td>
            <td className="pr-3">{peer.address}</td>
            <td>{peer.last_message}</td>
          </tr>
        );
      });
    }

    return (
      <div className="tab-content-wrapper">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : null}
        {this.state.loaded ? loadTable() : null}
      </div>
    );
  }
}

export default Network;