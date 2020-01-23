/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../assets/images/hathor-white-logo.png';
import HathorAlert from './HathorAlert';
import Version from './Version';


class Navigation extends React.Component {
  constructor(props) {
    super(props);

    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.search = this.search.bind(this);
  }

  handleKeyUp(e) {
    if (e.key === 'Enter') {
      this.search();
    }
  }

  search() {
    const hash = this.refs.txSearch.value;

    if (hash) {
      const regex = /[A-Fa-f\d]{64}/g;
      if (regex.test(hash)) {
        this.props.history.push(`/transaction/${hash}`);
      } else {
        this.showError();
      }
    }
  }

  showError() {
    this.refs.alertError.show(3000);
  }

  render() {
    return (
      <div className="main-nav">
        <nav className="navbar navbar-expand-lg navbar-dark pl-3 pl-lg-0">
          <div className="d-flex flex-column align-items-center">
            <Link className="navbar-brand" to="/" href="/">
              <img src={logo} alt="" />
            </Link>
          </div>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <NavLink to="/" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Transactions</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/network" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Network</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/statistics" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Statistics</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/tokens" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Tokens</NavLink>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Tools
                </a>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <NavLink to="/decode-tx/" exact className="nav-link">Decode Tx</NavLink>
                  <NavLink to="/push-tx/" exact className="nav-link">Push Tx</NavLink>
                  <NavLink to="/dag/" exact className="nav-link">DAG</NavLink>
                </div>
              </li>
            </ul>
            <div className="navbar-right d-flex flex-row align-items-center navigation-search">
              <div className="d-flex flex-row align-items-center">
                <input className="form-control mr-2" type="search" placeholder="Search tx" aria-label="Search" ref="txSearch" onKeyUp={this.handleKeyUp} />
                <i className="fa fa-search pointer" onClick={this.search}></i>
              </div>
              <Version />
            </div>
          </div>
        </nav>
        <HathorAlert ref="alertError" text="Invalid hash format" type="danger" />
      </div>
    );
  }
};

export default Navigation;
