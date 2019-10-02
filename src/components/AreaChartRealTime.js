/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { area } from 'd3-shape';
import D3ChartRealTime from './D3ChartRealTime';


class AreaChartRealTime extends React.Component {
  getChartModel(xValue, getX, yValue, getY, index, height) {
    return area()
          .x((d) => { return xValue(getX(d)); })
          .y0((d) => { return index === 0 ? height : yValue(getY(d)[index-1]) })
          .y1((d) => { return yValue(getY(d)[index]); })
  }

  getPath(svg, data, colors, chart, index) {
    return svg.append("path")
          .datum(data)
          .style("fill", (d) => {return colors[index]})
          .attr("d", chart);
  }

  render() {
    return <D3ChartRealTime getChartModel={this.getChartModel} getPath={this.getPath} {...this.props} />
  }
}

export default AreaChartRealTime;
