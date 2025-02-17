import React from 'react';
import SortableTable from '../SortableTable';
import EllipsiCell from '../EllipsiCell';

// XXX We should use function component with SortableTable as a component
// but renderTableHead and renderTableBody are implemented and not
// expected as a props, so it demands a bigger refactor
class BuiltInBlueprintsTable extends SortableTable {
  renderTableHead() {
    return (
      <tr>
        <th className="d-lg-table-cell">BLUEPRINT ID</th>
        <th className="d-lg-table-cell">NAME</th>
      </tr>
    );
  }

  renderTableBody() {
    return this.props.data.map(blueprint => {
      return (
        <tr key={blueprint.id} onClick={_e => this.props.handleClickRow(blueprint.id)}>
          <td className="d-lg-table-cell pe-3">
            {this.props.isMobile ? (
              <EllipsiCell id={blueprint.id} countBefore={10} countAfter={10} />
            ) : (
              blueprint.id
            )}
          </td>
          <td className="d-lg-table-cell pe-3">{blueprint.name}</td>
        </tr>
      );
    });
  }
}

BuiltInBlueprintsTable.propTypes = SortableTable.propTypes;

export default BuiltInBlueprintsTable;
