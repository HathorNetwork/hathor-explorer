import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../assets/images/hathor-white-logo.png';
import HathorAlert from './HathorAlert';
import helpers from '../utils/helpers';


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
    helpers.showAlert('alert-error', 3000);
  }

  render() {
    return (
      <div className="main-nav">
        <nav className="navbar navbar-expand-lg navbar-dark">
          <Link className="navbar-brand" to="/" href="/">
            <img src={logo} alt="" />
          </Link>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <NavLink to="/" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Network</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/transactions" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Transactions</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/wallet/" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Wallet</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/decode-tx/" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Decode Tx</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/push-tx/" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Push Tx</NavLink>
              </li>
            </ul>
            <div className="navbar-right d-flex flex-row align-items-center navigation-search">
              <input className="form-control mr-sm-2" type="search" placeholder="Search tx" aria-label="Search" ref="txSearch" onKeyUp={this.handleKeyUp} />
              <i className="fa fa-search pointer" onClick={this.search}></i>
            </div>
          </div>
        </nav>
        <HathorAlert id="alert-error" text="Invalid hash format" type="danger" />
      </div>
    );
  }
};

export default Navigation;