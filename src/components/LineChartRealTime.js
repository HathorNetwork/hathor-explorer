import React from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max, min, extent } from 'd3-array';
import { line } from 'd3-shape';
import { easeLinear } from 'd3-ease';
import { DASHBOARD_CHART_TIME } from '../constants';


class LineChartRealTime extends React.Component {
  constructor(props) {
    super(props);

    this.initChart = this.initChart.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.resizeChart = this.resizeChart.bind(this);

    this.chart = null;
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
    const minDomain = this.props.yDomain[0] ? this.props.yDomain[0] : parseInt(min(this.props.data, (d) => { return this.props.getY(d); })*0.8, 10);
    const maxDomain = this.props.yDomain[1] ? this.props.yDomain[1] : max(this.props.data, (d) => { return this.props.getY(d); });
    return [minDomain, maxDomain];
  }

  updateChart() {
    this.x.domain(extent(this.props.data, (d) => { return this.props.getX(d); }));
    this.y.domain(this.getYDomain());

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

    // define the line
    this.chartLine = line()
        .x((d) => { return this.x(this.props.getX(d)); })
        .y((d) => { return this.y(this.props.getY(d)); });

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

    // Add the valueline path.
    this.path = svg.append("path")
        .data([this.props.data])
        .attr("class", "line")
        .attr("d", this.chartLine);

    this.chart = svg;
  }

  render() {
    return (
      <div ref="chartWrapper" className="d-flex flex-column">
        <p><strong>{this.props.title}: {(this.props.data && this.props.data.length) ? this.props.getY(this.props.data[this.props.data.length - 1]) : ''} {this.props.unit}</strong></p>
        <svg ref={node => this.node = node} />
      </div>
    );
  }
}

/*
 Class props:
 data: list (array of data to fill the chart)
 title: str (title of the chart)
 getY: function (method that returns the yValue from data object)
 getX: function (method that returns the xValue from data object)
 yDomain: list (two element list where first is the minimum and second is the maximum of the y domain)
          defaultValue: [null, null]
*/

LineChartRealTime.defaultProps = {
  yDomain: [null, null],
  unit: '',
}

export default LineChartRealTime;
