import React from 'react';
import PropTypes from 'prop-types';
import TokenBalanceRow from './TokenBalanceRow';
import SortableTable from '../SortableTable';
import NewUiSortableTable from '../NewUiSortableTable';

class NewUiTokenBalancesTable extends NewUiSortableTable {
  renderTableHead() {
    return (
      <tr>
        <th className="d-lg-table-cell">Address</th>
        <th
          className="d-lg-table-cell sortable"
          onClick={e => this.props.tableHeaderClicked(e, 'total')}
        >
          Total {this.getArrow('total')}
        </th>
        <th
          className="d-lg-table-cell sortable th-table-token-mobile"
          onClick={e => this.props.tableHeaderClicked(e, 'unlocked_balance')}
        >
          Unlocked {this.getArrow('unlocked_balance')}
        </th>
        <th
          className="d-lg-table-cell sortable th-table-token-mobile"
          onClick={e => this.props.tableHeaderClicked(e, 'locked_balance')}
        >
          Locked {this.getArrow('locked_balance')}
        </th>
      </tr>
    );
  }

  renderTableBody() {
    return this.props.data.map(tokenBalance => {
      return (
        <TokenBalanceRow
          key={`${tokenBalance.address}_${this.props.token_id}`}
          address={tokenBalance.address}
          unlocked={tokenBalance.unlocked_balance}
          locked={tokenBalance.locked_balance}
          total={tokenBalance.total}
          tokenId={this.props.tokenId}
        />
      );
    });
  }
}

NewUiTokenBalancesTable.propTypes = {
  ...SortableTable.propTypes,
  tokenId: PropTypes.string.isRequired,
};

export default NewUiTokenBalancesTable;
