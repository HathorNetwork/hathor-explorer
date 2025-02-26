import React from 'react';
import SortableTable from '../SortableTable';
import EllipsiCell from '../EllipsiCell';
import dateFormatter from '../../utils/date';

// XXX We should use function component with SortableTable as a component
// but renderTableHead and renderTableBody are implemented and not
// expected as a props, so it demands a bigger refactor
class NanoContractsTable extends SortableTable {
  renderTableHead() {
    return (
      <tr>
        <th className="d-lg-table-cell">NANO CONTRACT ID</th>
        <th className="d-lg-table-cell">BLUEPRINT</th>
        <th className="d-lg-table-cell">LAST TRANSACTION</th>
        <th className="d-lg-table-cell">TOTAL TRANSACTIONS</th>
        <th
          className="d-lg-table-cell sortable"
          onClick={e => this.props.tableHeaderClicked(e, 'created_at')}
        >
          CREATED AT {this.getArrow('created_at')}
        </th>
      </tr>
    );
  }

  renderTableBody() {
    return this.props.data.map(nano => {
      return (
        <tr
          key={nano.nano_contract_id}
          onClick={_e => this.props.handleClickRow(nano.nano_contract_id)}
        >
          <td className="d-lg-table-cell pe-3">
            {this.props.isMobile ? (
              <EllipsiCell id={nano.nano_contract_id} countBefore={10} countAfter={10} />
            ) : (
              nano.nano_contract_id
            )}
          </td>
          <td className="d-lg-table-cell pe-3">{nano.blueprint_name}</td>
          <td className="d-lg-table-cell pe-3">
            {dateFormatter.parseTimestampNewUi(nano.last_tx_timestamp)}
          </td>
          <td className="d-lg-table-cell pe-3">{nano.total_txs}</td>
          <td className="d-lg-table-cell pe-3">
            {dateFormatter.parseTimestampNewUi(nano.created_at)}
          </td>
        </tr>
      );
    });
  }
}

NanoContractsTable.propTypes = SortableTable.propTypes;

export default NanoContractsTable;
