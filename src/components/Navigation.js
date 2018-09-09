import React from 'react';
import { NavLink } from 'react-router-dom';


class Navigation extends React.Component {
  render() {
    return (
      <div className="main-nav">
        <nav className="navbar navbar-expand-lg navbar-dark">
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <NavLink to="/" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Network</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/wallet/" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Wallet</NavLink>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    );
  }
};

export default Navigation;