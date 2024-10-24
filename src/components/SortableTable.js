/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Loading from './Loading';
import ErrorMessageWithIcon from './error/ErrorMessageWithIcon';

class SortableTable extends React.Component {
  renderTableBody() {
    return <td></td>;
  }

  renderTableHead() {
    return <tr></tr>;
  }

  renderTable(content) {
    return (
      <table className="table table-striped table-home" id="tx-table">
        {content}
      </table>
    );
  }

  getArrow(field) {
    if (field === this.props.sortBy) {
      if (this.props.order === 'asc') {
        return '↑';
      }
      return '↓';
    }
    return '';
  }

  loadTable() {
    if (this.props.loading) {
      return <Loading />;
    }

    if (this.props.data.length === 0) {
      return <ErrorMessageWithIcon message="No matches for your query." />;
    }
    return (
      <div className="table-responsive col-12 mt-2">
        {this.renderTable(
          <>
            <thead>{this.renderTableHead()}</thead>
            <tbody>{this.renderTableBody()}</tbody>
          </>
        )}
      </div>
    );
  }

  loadPagination() {
    if (this.props.data.length === 0) {
      return null;
    }

    return (
      <div className="d-flex col-sm-12">
        <nav
          aria-label="Paginated table"
          className="d-flex offset-sm-4 col-sm-4 justify-content-center"
        >
          <ul className="pagination">
            <li
              ref="pagePrevious"
              className={
                !this.props.hasBefore || this.props.calculatingPage
                  ? 'page-item me-3 disabled'
                  : 'page-item me-3'
              }
            >
              <button onClick={e => this.props.onPreviousPageClicked(e)} className="page-link">
                Previous
              </button>
            </li>
            <li
              ref="pageNext"
              className={
                !this.props.hasAfter || this.props.calculatingPage
                  ? 'page-item disabled'
                  : 'page-item'
              }
            >
              <button onClick={e => this.props.onNextPageClicked(e)} className="page-link">
                Next
              </button>
            </li>
          </ul>
        </nav>
        <div className="d-flex col-sm-4 page-loader">
          {this.props.calculatingPage ? (
            <Loading width={35} height={35} useLoadingWrapper={false} showSlowLoadMessage={false} />
          ) : null}
        </div>
      </div>
    );
  }

  render() {
    return (
      <>
        {this.loadTable()}
        {this.loadPagination()}
      </>
    );
  }
}

/**
 * data: Array of the data to display
 * hasAfter: Indicates if there is a next page for user to navigate
 * hasBefore: Indicates if there is a previous page for user to navigate
 * onPreviousPageClicked: Callback to be called when the user clicks the Previous button
 * onNextPageClicked: Callback to be called when the user clicks the Next button
 * loading: Initial loading when the component is first displayed
 * sortBy: Which field to sort by
 * order: If sorted field must be ordered asc or desc
 * tableHeaderClicked: This indicates that user wants data to be sorted by a determined field
 * calculatingPage: Indicates if next page is being retrieved from explorer-service
 * tableClasses: Extra classes to add to the table element
 */
SortableTable.propTypes = {
  data: PropTypes.array.isRequired,
  hasBefore: PropTypes.bool.isRequired,
  hasAfter: PropTypes.bool.isRequired,
  onNextPageClicked: PropTypes.func.isRequired,
  onPreviousPageClicked: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  calculatingPage: PropTypes.bool,
  tableHeaderClicked: PropTypes.func,
  sortBy: PropTypes.string,
  order: PropTypes.string,
};

export default SortableTable;
