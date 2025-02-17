import React from 'react';
import SortableTable from '../SortableTable';
import EllipsiCell from '../EllipsiCell';
import dateFormatter from '../../utils/date';

// XXX We should use function component with SortableTable as a component
// but renderTableHead and renderTableBody are implemented and not
// expected as a props, so it demands a bigger refactor
class OnChainBlueprintsTable extends SortableTable {
  /*
   * Get header of first column. In the mobile we show the element
   * of two columns in one.
  */
  getFirstHeaderName() {
    if (this.props.isMobile) {
      return 'BLUEPRINT ID AND NAME';
    }

    return 'BLUEPRINT ID';
  }

  renderTableHead() {
    return (
      <tr>
        <th className="d-lg-table-cell">{this.getFirstHeaderName()}</th>
        {!this.props.isMobile && <th className="d-lg-table-cell">NAME</th>}
        <th
          className="d-lg-table-cell sortable"
          onClick={e => this.props.tableHeaderClicked(e, 'created_at')}
        >
          CREATED AT {this.getArrow('created_at')}
        </th>
      </tr>
    );
  }

  renderMobileRow(blueprint) {
    return (
      <>
        <td className="d-lg-table-cell pe-3">
          <EllipsiCell id={blueprint.id} countBefore={10} countAfter={10} />
          <p className="mt-2 mb-0">{blueprint.name}</p>
        </td>
        <td className="d-lg-table-cell pe-3">
          {dateFormatter.parseTimestampNewUi(blueprint.created_at)}
        </td>
      </>
    );
  }

  renderDesktopRow(blueprint) {
    return (
      <>
        <td className="d-lg-table-cell pe-3">
          {blueprint.id}
        </td>
        <td className="d-lg-table-cell pe-3">
          {blueprint.name}
        </td>
        <td className="d-lg-table-cell pe-3">
          {dateFormatter.parseTimestampNewUi(blueprint.created_at)}
        </td>
      </>
    );
  }

  renderTableBody() {
    return this.props.data.map(blueprint => {
      return (
        <tr key={blueprint.id} onClick={_e => this.props.handleClickRow(blueprint.id)}>
          {this.props.isMobile ? this.renderMobileRow(blueprint) : this.renderDesktopRow(blueprint)}
        </tr>
      );
    });
  }
}

OnChainBlueprintsTable.propTypes = SortableTable.propTypes;

export default OnChainBlueprintsTable;
