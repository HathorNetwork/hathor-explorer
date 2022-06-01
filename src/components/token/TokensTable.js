import React from 'react';
import TokenRow from './TokenRow';
import SortableTable from '../SortableTable';

class TokensTable extends SortableTable {

  renderTableHead() {
    return (
      <tr>
        <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, 'uid')}>UID {this.getArrow('uid')}</th>
        <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, 'name')}>Name {this.getArrow('name')}</th>
        <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, 'symbol')}>Symbol {this.getArrow('symbol')}</th>
        <th className="d-lg-table-cell">Type</th>
        <th className="d-lg-table-cell" onClick={(e) => this.props.tableHeaderClicked(e, 'transaction_timestamp')}>Created At {this.getArrow('transaction_timestamp')}</th>
      </tr>
    );
  }

  renderTableBody() {
    return this.props.data.map((token) => {
      return (
        <TokenRow key={token.uid} token={token} />
      );
    });
  }
}

TokensTable.propTypes = SortableTable.propTypes;

export default TokensTable;
