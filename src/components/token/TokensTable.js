import React from 'react';
import TokenRow from './TokenRow';
import SortableTable from '../SortableTable';
import { ReactComponent as InfoIcon } from '../../assets/images/icon-info.svg';

class TokensTable extends SortableTable {
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
          onClick={e => this.props.tableHeaderClicked(e, 'version')}
        >
          <span className="table-header-tooltip-container">
            Fee Model {this.getArrow('version')}
            <span className="table-header-tooltip-icon">
              <InfoIcon />
              <span className="table-header-tooltip">
                Deposit-based tokens are feeless, while Fee-based tokens require a small fee in HTR.
              </span>
            </span>
          </span>
        </th>
        <th
          className="d-lg-table-cell sortable th-table-token-mobile"
          onClick={e => this.props.tableHeaderClicked(e, 'transaction_timestamp')}
        >
          Created At {this.getArrow('transaction_timestamp')}
        </th>
      </tr>
    );
  }

  renderTableBody() {
    return this.props.data.map(token => {
      return <TokenRow key={token.uid} token={token} />;
    });
  }
}

TokensTable.propTypes = SortableTable.propTypes;

export default TokensTable;
