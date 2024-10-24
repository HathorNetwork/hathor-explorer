import React from 'react';
import NewUiSortableTable from '../NewUiSortableTable';
import NewUiTokenRow from './NewUiTokenRow';

class NewUiTokensTable extends NewUiSortableTable {
  renderTableHead() {
    return (
      <tr>
        <th className="d-lg-table-cell">UID</th>
        <th
          className="d-lg-table-cell sortable"
          onClick={e => this.props.tableHeaderClicked(e, 'name')}
        >
          Name {this.getArrow('name')}
        </th>
        <th
          className="d-lg-table-cell sortable th-table-token-mobile"
          onClick={e => this.props.tableHeaderClicked(e, 'symbol')}
        >
          Symbol {this.getArrow('symbol')}
        </th>
        <th className="d-lg-table-cell th-table-token-mobile">Type</th>
        <th
          className="d-lg-table-cell sortable th-table-token-mobile"
          onClick={e => this.props.tableHeaderClicked(e, 'transaction_timestamp')}
        >
          Created At
        </th>
      </tr>
    );
  }

  renderTableBody() {
    return this.props.data.map(token => {
      return <NewUiTokenRow key={token.uid} token={token} />;
    });
  }
}

NewUiTokensTable.propTypes = NewUiSortableTable.propTypes;

export default NewUiTokensTable;
