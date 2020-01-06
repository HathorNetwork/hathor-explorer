/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max, min, extent } from 'd3-array';
import { easeLinear } from 'd3-ease';
import { DASHBOARD_CHART_TIME } from '../constants';
import helpers from '../utils/helpers';

// This component class is used to create real time chart for d3 (AreaCharts, LineCharts, ...)
// This should never be used directly, only as a child of another component
// When used in another component it's expected to have the props listed in the end of the component

class D3ChartRealTime extends React.Component {
  constructor(props) {
    super(props);

    this.initChart = this.initChart.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.resizeChart = this.resizeChart.bind(this);

    this.chart = null;
    this.chartModel = [];
  }

  componentDidMount() {
    window.addEventListener("resize", this.resizeChart);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeChart);
  }

  componentDidUpdate(prevProps) {
    if (!this.chart && this.props.data.length) {
      this.initChart();
    } else if (this.chart && !document.hidden) {
      this.chart.datum(this.props.data).call(this.updateChart);
    }
  }

  getYDomain() {
    // When min domain is not set, the min yAxis will be 0.8*min_value because otherwise the begining of the chart would look like 0
    const minDomain = this.props.yDomain[0] ? this.props.yDomain[0] : parseInt(min(this.props.data, (d) => { return min(this.props.getY(d)); })*0.8, 10);
    const maxDomain = this.props.yDomain[1] ? this.props.yDomain[1] : max(this.props.data, (d) => { return max(this.props.getY(d)); });
    return [minDomain, maxDomain];
  }

  updateChart() {
    this.x.domain(extent(this.props.data, (d) => { return this.props.getX(d); }));
    this.y.domain(this.getYDomain());

    this.yAxis.call(axisLeft(this.y))

    for (let chart of this.chartModel) {
      chart["path"].data([this.props.data])
        .attr("d", chart["shape"]);
    }

    this.xGrid.call(axisBottom(this.x).ticks(7)
      .tickSize(-this.height)
      .tickFormat("")
    )

    if (this.props.data.length === DASHBOARD_CHART_TIME) {
      // Slide x-axis left
      this.xAxis.transition()
          .duration(500)
          .ease(easeLinear)
          .call(axisBottom(this.x))
    } else {
      this.xAxis.call(axisBottom(this.x));
    }
  }

  resizeChart() {
    if (this.chart) {
      this.chart.remove();
      this.initChart();
    }
  }

  initChart() {
    const maxWidth = Math.min(960, this.refs.chartWrapper.offsetWidth);
    const margin = {top: 20, right: 20, bottom: 30, left: 50};
    const width = maxWidth - margin.left - margin.right;
    this.height = 200 - margin.top - margin.bottom;

    // set the ranges
    this.x = scaleTime().range([0, width]);
    this.y = scaleLinear().range([this.height, 0]);

    // Scale the range of the data
    this.x.domain(extent(this.props.data, (d) => { return this.props.getX(d); }));
    this.y.domain(this.getYDomain());

    var svg = select(this.node)
        .attr("width", width + margin.left + margin.right)
        .attr("height", this.height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Add the X Axis
    this.xAxis = svg.append("g")
        .attr("transform", "translate(0," + this.height + ")")
        .call(axisBottom(this.x).ticks(5));

    // Add the Y Axis
    this.yAxis = svg.append("g")
        .call(axisLeft(this.y));

    svg.append("g")
      .attr("class", "grid")
      .call(axisLeft(this.y).ticks(7)
          .tickSize(-width)
          .tickFormat("")
      )

    this.xGrid = svg.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + this.height + ")")


    for (let i=0; i<this.props.getY(this.props.data[0]).length; i++) {
      let chart = this.props.getChartModel(this.x, this.props.getX, this.y, this.props.getY, i, this.height);

      // Add the chart path.
      let path = this.props.getPath(svg, this.props.data, this.props.colors, chart, i);

      this.chartModel.push({"path": path, "shape": chart});
    }

    this.chart = svg;
  }

  render() {
    const renderTitles = () => {
      const data = this.props.getY(this.props.data[this.props.data.length - 1]);
      return data.map((d, index) => {
        const prettyfied = helpers.divideValueIntoPrefix(d);
        const prettyValue = prettyfied.value;
        const prefix = helpers.getUnitPrefix(prettyfied.divisions);
        return (
          <p key={index} style={{color: this.props.colors[index]}}>{this.props.title[index]}: {prettyValue} {prefix}{this.props.unit}</p>
        );
      });
    }

    return (
      <div ref="chartWrapper" className="d-flex flex-column">
        <div>{(this.props.data && this.props.data.length) ? renderTitles() : ''}</div>
        <svg ref={node => this.node = node} />
      </div>
    );
  }
}

/*
 Class props:
 data: list (array of data to fill the chart)
 title: list (array of titles of the chart)
 unit: str (chart yAxis unit)
 colors: list (array of colors for each data in yAxis)
 getY: function (method that returns the yValue from data object)
 getX: function (method that returns the xValue from data object)
 yDomain: list (two element list where first is the minimum and second is the maximum of the y domain)
          defaultValue: [null, null]
 getPath: function (method to get path to be added in the chart)
 getChartModel: function (method to the chart model depending on the data - area, line, ...)
*/

D3ChartRealTime.defaultProps = {
  yDomain: [null, null],
  unit: '',
  colors: ['steelBlue'],
}

export default D3ChartRealTime;