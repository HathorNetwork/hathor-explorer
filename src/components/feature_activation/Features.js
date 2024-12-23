/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { chunk, orderBy } from 'lodash';
import { numberUtils } from '@hathor/wallet-lib';
import { FEATURE_COUNT } from '../../constants';
import FeatureRow from './FeatureRow';
import colors from '../../index.scss';
import PaginationURL from '../../utils/pagination';
import featureApi from '../../api/featureApi';
import { DropDetails } from '../DropDetails';

class Features extends React.Component {
  constructor(props) {
    super(props);

    this.pagination = new PaginationURL({
      page: { required: false },
    });

    this.state = {
      block_hash: null,
      block_height: null,
      pages: [],
      loaded: false,
      page: 1,
      queryParams: this.pagination.obtainQueryParams(),
      showColumnDescriptions: false,
    };
  }

  componentDidMount() {
    featureApi.getFeatures().then(this.handleFeatures, e => console.error(e));
  }

  componentDidUpdate(_prevProps, _prevState) {
    const { page = 1 } = this.pagination.obtainQueryParams();
    const newPage = parseInt(page, 10);

    if (this.state.page === newPage) {
      return;
    }

    this.setState({ page: newPage });

    if (newPage === 1) {
      this.pagination.clearOptionalQueryParams();
    }
  }

  handleFeatures = response => {
    const { features = [], block_height, block_hash } = response;
    const sortedFeatures = orderBy(features, 'start_height', 'desc');
    const pages = chunk(sortedFeatures, FEATURE_COUNT);

    this.setState({
      pages,
      block_hash,
      block_height,
      loaded: true,
    });
  };

  hasBefore = () => this.state.page > 1;

  hasAfter = () => this.state.page < this.state.pages.length;

  getPageFeatures = () => {
    const { page, pages } = this.state;
    return pages[page - 1] || [];
  };

  getColumnDescriptions = () => [
    {
      name: 'Name',
      description: 'The feature name.',
    },
    {
      name: 'State',
      description: 'The state the feature is currently in.',
    },
    {
      name: 'Acceptance',
      description: 'The acceptance percentage of this feature in the last evaluation interval.',
    },
    {
      name: 'Threshold',
      description: 'The required acceptance percentage for this feature to become active.',
    },
    {
      name: 'Start Height',
      description: "The block height at which this feature's activation process will start.",
    },
    {
      name: 'Minimum Activation Height',
      description: 'The minimum block height at which this feature can become active.',
    },
    {
      name: 'Timeout Height',
      description: "The block height at which this feature's activation process ends.",
    },
    {
      name: 'Lock-in on Timeout',
      description: 'Whether this feature will be locked-in when its activation process times out.',
    },
    {
      name: 'Since Version',
      description: 'The hathor-core version at which this feature was introduced.',
    },
  ];

  toggleColumnDescriptions = e => {
    if (e) {
      e.preventDefault();
    }
    this.setState({ showColumnDescriptions: !this.state.showColumnDescriptions });
  };

  renderUi() {
    const loadPagination = () => {
      if (this.state.pages.length === 0) {
        return null;
      }
      return (
        <nav aria-label="Feature pagination" className="d-flex justify-content-center">
          <ul className="pagination">
            <li
              ref="featurePrevious"
              className={`page-item me-3 ${this.hasBefore() ? '' : 'disabled'}`}
            >
              <Link
                className="page-link"
                to={this.pagination.setURLParameters({ page: this.state.page - 1 })}
              >
                Previous
              </Link>
            </li>
            <li ref="featureNext" className={`page-item ${this.hasAfter() ? '' : 'disabled'}`}>
              <Link
                className="page-link"
                to={this.pagination.setURLParameters({ page: this.state.page + 1 })}
              >
                Next
              </Link>
            </li>
          </ul>
        </nav>
      );
    };

    const loadTable = () => {
      return (
        <div className="table-responsive mt-5">
          <table className="table table-striped" id="features-table">
            <thead>
              <tr>
                <th className="d-lg-table-cell">Name</th>
                <th className="d-lg-table-cell">State</th>
                <th className="d-lg-table-cell">Acceptance</th>
                <th className="d-lg-table-cell">Threshold</th>
                <th className="d-lg-table-cell">Start Height</th>
                <th className="d-lg-table-cell">Minimum Activation Height</th>
                <th className="d-lg-table-cell">Timeout Height</th>
                <th className="d-lg-table-cell">Lock-in on Timeout</th>
                <th className="d-lg-table-cell">Since Version</th>
              </tr>
            </thead>
            <tbody>{loadTableBody()}</tbody>
          </table>
        </div>
      );
    };

    const loadTableBody = () => {
      return this.getPageFeatures().map(feature => {
        return <FeatureRow key={feature.name} feature={feature} />;
      });
    };

    const loadColumnDescriptions = () => {
      return this.getColumnDescriptions().map(({ name, description }) => {
        return (
          <div key={name}>
            <label>{name}</label>
            <p>{description}</p>
          </div>
        );
      });
    };

    const loadFeaturesPage = () => {
      const height = numberUtils.prettyValue(this.state.block_height, 0);
      return (
        <div>
          <div>
            Showing feature states for{' '}
            <Link to={`/transaction/${this.state.block_hash}`}>current best block</Link> at height{' '}
            {height}.
          </div>
          {!this.state.loaded ? (
            <ReactLoading type="spin" color={colors.purpleHathor} delay={500} />
          ) : (
            loadTable()
          )}
          {loadPagination()}
          <div className="f-flex flex-column align-items-start common-div bordered-wrapper mt-3 mt-lg-0 w-100 feature-column-descriptions">
            <div>
              <label>Column descriptions: </label>
              <a href="true" className="ms-1" onClick={e => this.toggleColumnDescriptions(e)}>
                {this.state.showColumnDescriptions ? 'Click to hide' : 'Click to show'}
              </a>
            </div>
            {this.state.showColumnDescriptions && loadColumnDescriptions()}
          </div>
        </div>
      );
    };

    return (
      <div className="w-100">
        {this.props.title}
        {this.state.pages.length !== 0 ? (
          loadFeaturesPage()
        ) : (
          <div>There are currently no features.</div>
        )}
      </div>
    );
  }

  renderNewUi() {
    const loadPagination = () => {
      if (this.state.pages.length === 0) {
        return null;
      }
      return (
        <div className="tx-pagination-btn no-padding">
          <Link
            className={!this.hasBefore() ? 'page-link-btn-disable' : 'page-link-btn-enable'}
            to={this.pagination.setURLParameters({ page: this.state.page - 1 })}
          >
            <button
              className={
                !this.hasBefore() ? 'tx-previous-btn disable-button' : 'tx-next-btn tx-disabled'
              }
              disabled={!this.hasBefore()}
            >
              Previous
            </button>
          </Link>
          <Link
            className={!this.hasAfter() ? 'page-link-btn-disable' : 'page-link-btn-enable'}
            to={this.pagination.setURLParameters({ page: this.state.page + 1 })}
          >
            <button
              className={
                !this.hasAfter() ? 'tx-previous-btn disable-button' : 'tx-next-btn tx-enable'
              }
              disabled={!this.hasAfter()}
            >
              Next
            </button>
          </Link>
        </div>
      );
    };

    const loadTable = () => {
      return (
        <div className="features-table-container">
          <div className="table-responsive">
            <table className=" table-stylized table-features" id="features-table">
              <thead>
                <tr>
                  <th className="d-lg-table-cell">Name</th>
                  <th className="d-lg-table-cell">State</th>
                  <th className="d-lg-table-cell td-mobile">Acceptance</th>
                  <th className="d-lg-table-cell td-mobile">Threshold</th>
                  <th className="d-lg-table-cell td-mobile">Start Height</th>
                  <th className="d-lg-table-cell td-mobile">Minimum Activation Height</th>
                  <th className="d-lg-table-cell td-mobile">Timeout Height</th>
                  <th className="d-lg-table-cell td-mobile">Lock-in on Timeout</th>
                  <th className="d-lg-table-cell td-mobile">Since Version</th>
                  <th className="d-lg-table-cell arrow-td-mobile"></th>
                </tr>
              </thead>
              <tbody>{loadTableBody()}</tbody>
            </table>
          </div>
        </div>
      );
    };

    const loadTableBody = () => {
      return this.getPageFeatures().map(feature => {
        return <FeatureRow key={feature.name} feature={feature} />;
      });
    };

    const loadColumnDescriptions = () => {
      return this.getColumnDescriptions().map(({ name, description }) => {
        return (
          <div key={name} className="summary-balance-info-container">
            <div className="address-container-title">{name}:</div> <span className='address-container-description'>{description}</span>
          </div>
        );
      });
    };

    const loadFeaturesPage = () => {
      const height = numberUtils.prettyValue(this.state.block_height, 0);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            Showing feature states for{' '}
            <Link className="link-uppercase" to={`/transaction/${this.state.block_hash}`}>
              current best block
            </Link>{' '}
            at height {height}.
          </div>
          {!this.state.loaded ? (
            <ReactLoading type="spin" color={colors.purpleHathor} delay={500} />
          ) : (
            loadTable()
          )}

          <DropDetails
            title="Column descriptions:"
            onToggle={e => this.toggleColumnDescriptions(e)}
          >
            <div className="features-page-container">
              {this.state.showColumnDescriptions && loadColumnDescriptions()}
            </div>
          </DropDetails>

          {loadPagination()}
        </div>
      );
    };

    return (
      <div className="w-100">
        <h1 className="title-page">{this.props.title}</h1>
        {this.state.pages.length !== 0 ? (
          loadFeaturesPage()
        ) : (
          <div>There are currently no features.</div>
        )}
      </div>
    );
  }

  render() {
    return this.props.newUiEnabled ? this.renderNewUi() : this.renderUi();
  }
}

export default Features;
