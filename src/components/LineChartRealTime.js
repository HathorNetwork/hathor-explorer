import React from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max, extent } from 'd3-array';
import { line } from 'd3-shape';
import { easeLinear } from 'd3-ease';
import { DASHBOARD_CHART_TIME } from '../constants';


class LineChartRealTime extends React.Component {
  constructor(props) {
    super(props);

    this.initChart = this.initChart.bind(this);
    this.updateChart = this.updateChart.bind(this);

    this.chart = null;
  }

  componentDidUpdate(prevProps) {
    if (!this.chart && this.props.data.length) {
      this.initChart();
    } else if (this.chart) {
      this.chart.datum(this.props.data).call(this.updateChart);
    }
  }

  updateChart() {
    this.x.domain(extent(this.props.data, (d) => { return d.date; }));
    this.y.domain([0, max(this.props.data, (d) => { return d[this.props.dataKey]; })]);

    this.yAxis.call(axisLeft(this.y))

    this.path.data([this.props.data])
      .attr("class", "line")
      .attr("d", this.chartLine);

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

  initChart() {
    const margin = {top: 20, right: 20, bottom: 30, left: 50};
    const width = 960 - margin.left - margin.right;
    this.height = 200 - margin.top - margin.bottom;

    // set the ranges
    this.x = scaleTime().range([0, width]);
    this.y = scaleLinear().range([this.height, 0]);

    // Scale the range of the data
    this.x.domain(extent(this.props.data, (d) => { return d.date; }));
    this.y.domain([0, max(this.props.data, (d) => { return d[this.props.dataKey]; })]);

    // define the line
    this.chartLine = line()
        .x((d) => { return this.x(d.date); })
        .y((d) => { return this.y(d[this.props.dataKey]); });

    var svg = select(this.node)
        .attr("width", width + margin.left + margin.right)
        .attr("height", this.height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Add the valueline path.
    this.path = svg.append("path")
        .data([this.props.data])
        .attr("class", "line")
        .attr("d", this.chartLine);

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

    this.chart = svg;
  }

  render() {
    return (
      <div>
        <p><strong>{this.props.title}: {(this.props.data && this.props.data.length) ? this.props.data[this.props.data.length - 1][this.props.dataKey] : ''}</strong></p>
        <svg ref={node => this.node = node} />
      </div>
    );
  }
}

export default LineChartRealTime;
