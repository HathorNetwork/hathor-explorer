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
import { FEATURE_COUNT } from '../../constants';
import FeatureRow from './FeatureRow';
import colors from '../../index.scss';
import PaginationURL from '../../utils/pagination';
import featureApi from '../../api/featureApi';
import helpers from '../../utils/helpers';


class Features extends React.Component {
  constructor(props) {
    super(props);

    this.pagination = new PaginationURL({
      page: { required: false }
    });

    this.state = {
      block_hash: null,
      block_height: null,
      pages: [],
      loaded: false,
      page: 1,
      queryParams: this.pagination.obtainQueryParams(),
      showColumnDescriptions: false
    }
  }

  componentDidMount() {
    featureApi.getFeatures().then(this.handleFeatures, e => console.error(e));
  }

  componentDidUpdate(prevProps, prevState) {
    const { page = 1 } = this.pagination.obtainQueryParams();
    const newPage = parseInt(page)

    if (this.state.page === newPage) {
      return;
    }

    this.setState({ page: newPage })

    if (newPage === 1) {
      this.pagination.clearOptionalQueryParams()
    }
  }

  handleFeatures = (response) => {
    const { features = [], block_height, block_hash } = response
    const sortedFeatures = orderBy(features, 'start_height', 'desc');
    const pages = chunk(sortedFeatures, FEATURE_COUNT);

    this.setState({
      pages,
      block_hash,
      block_height,
      loaded: true
    });
  }

  hasBefore = () => this.state.page > 1
  hasAfter = () => this.state.page < this.state.pages.length

  getPageFeatures = () => {
    const { page, pages } = this.state
    return pages[page - 1] || []
  }

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
      description: 'The block height at which this feature\'s activation process will start.',
    },
    {
      name: 'Minimum Activation Height',
      description: 'The minimum block height at which this feature can become active.',
    },
    {
      name: 'Timeout Height',
      description: 'The block height at which this feature\'s activation process ends.',
    },
    {
      name: 'Lock-in on Timeout',
      description: 'Whether this feature will be locked-in when its activation process times out.',
    },
    {
      name: 'Since Version',
      description: 'The hathor-core version at which this feature was introduced.',
    },
  ]

  toggleColumnDescriptions = (e) => {
    e.preventDefault();
    this.setState({ showColumnDescriptions: !this.state.showColumnDescriptions });
  }

  render() {
    const loadPagination = () => {
      if (this.state.pages.length === 0) {
        return null;
      }
      return (
        <nav aria-label="Feature pagination" className="d-flex justify-content-center">
          <ul className="pagination">
            <li ref="featurePrevious" className={`page-item mr-3 ${this.hasBefore() ? "" : "disabled"}`}>
              <Link className="page-link" to={this.pagination.setURLParameters({page: this.state.page - 1})}>Previous</Link>
            </li>
            <li ref="featureNext" className={`page-item ${this.hasAfter() ? "" : "disabled"}`}>
              <Link className="page-link" to={this.pagination.setURLParameters({ page: this.state.page + 1})}>Next</Link>
            </li>
          </ul>
        </nav>
      );
    }

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
            <tbody>
              {loadTableBody()}
            </tbody>
          </table>
        </div>
      );
    }

    const loadTableBody = () => {
      return this.getPageFeatures().map((feature) => {
        return (
          <FeatureRow key={feature.name} feature={feature} />
        );
      });
    }

    const loadColumnDescriptions = () => {
      return this.getColumnDescriptions().map(({ name, description }) => {
        return (
          <div>
            <label>{name}</label>
            <p>{description}</p>
          </div>
        )
      })
    }

    const loadFeaturesPage = () => {
      return (
        <div>
          <div>Showing feature states for <Link to={`/transaction/${this.state.block_hash}`}>current best block</Link> at height {helpers.renderValue(this.state.block_height, true)}.</div>
          {!this.state.loaded ? <ReactLoading type='spin' color={colors.purpleHathor} delay={500} /> : loadTable()}
          {loadPagination()}
          <div className="f-flex flex-column align-items-start common-div bordered-wrapper mt-3 mt-lg-0 w-100 feature-column-descriptions">
            <div>
              <label>Column descriptions: </label>
              <a href="true" className="ml-1" onClick={(e) => this.toggleColumnDescriptions(e)}>{this.state.showColumnDescriptions ? 'Click to hide' : 'Click to show'}</a>
            </div>
            {this.state.showColumnDescriptions && loadColumnDescriptions()}
          </div>
        </div>
      )
    }

    return (
      <div className="w-100">
        {this.props.title}
        {this.state.pages.length !== 0 ? loadFeaturesPage() : <div>There are currently no features.</div>}
      </div>
    );
  }
}

export default Features;
