/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { line } from 'd3-shape';
import D3ChartRealTime from './D3ChartRealTime';


class LineChartRealTime extends React.Component {
  getChartModel(xValue, getX, yValue, getY, index, height) {
    return line()
          .x((d) => { return xValue(getX(d)); })
          .y((d) => { return yValue(getY(d)[index]); });
  }

  getPath(svg, data, colors, chart, index) {
    return svg.append("path")
          .data([data])
          .attr("class", "line")
          .style("stroke", colors[index])
          .attr("d", chart);
  }

  render() {
    return <D3ChartRealTime getChartModel={this.getChartModel} getPath={this.getPath} {...this.props} />
  }
}

export default LineChartRealTime;
