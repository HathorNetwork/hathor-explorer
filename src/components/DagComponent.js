import React from 'react';
import { scaleLinear } from 'd3-scale';
// eslint-disable-next-line
import { transition } from 'd3-transition';
// eslint-disable-next-line
import { select, selectAll, enter, exit } from 'd3-selection';
import { getMax } from '../screens/Dag';

// y component of the blocks. In d3, y is 0 on top and grows to the bottom,
// so this indicates the distance from the top of the svg element
const Y_BLOCKS = 80;

// Possible positions of the transactions, relative to Y_BLOCKS
const Y_TXS = [-30, 30, -60, 60]

// Maximum and minimum sizes of the transaction circle radius. The
// exact value is calculated in getRadius()
const RADIUS_MIN = 4;
const RADIUS_MAX = 10;


class DagComponent extends React.Component {
  componentDidMount() {
    const canvas = this.node.getBoundingClientRect();
    this.yIndex = 0;
    this.xStart = 50;
    this.xEnd = canvas.width - 50;
    this.createDag(this.props.blocks, this.props.txs);
  }

  componentDidUpdate() {
    this.updateDag(this.props.blocks, this.props.txs, this.props.max);
  }

  txId = (tx) => {
    return tx.hash;
  }

  /*
   * Used to add info about a block/tx form screen (usually on mouseover event)
   */
  updateInfo = (d) => {
    const div = document.getElementById("tx-info");

    let p = document.createElement("p");
    let t = document.createTextNode(`Id: ${d.hash}`);
    p.appendChild(t);
    div.appendChild(p);

    p = document.createElement("p");
    t = document.createTextNode(`Timestamp: ${d.timestamp}`);
    p.appendChild(t);
    div.appendChild(p);

    p = document.createElement("p");
    t = document.createTextNode(`Weight: ${d.weight}`);
    p.appendChild(t);
    div.appendChild(p);
  }


  /*
   * Used to remove info about a block/tx form screen (usually on mouseout event)
   */
  removeInfo = () => {
    const div = document.getElementById("tx-info");
    while (div.lastChild) {
      div.removeChild(div.lastChild);
    }
  }

  newScale = (min, max) => {
    return scaleLinear()
      .domain([min, max])
      .range([this.xStart, this.xEnd]);
  }

  /*
   * The tx and block sizes adapt to the time window, restricted 
   * to minimum and maximum values
   */
  getRadius = (interval) => {
    const radius = Math.round(900/interval);
    if (radius > RADIUS_MAX) {
      return RADIUS_MAX;
    } else if (radius < RADIUS_MIN) {
      return RADIUS_MIN;
    } else {
      return radius;
    }
  }


  /*
   * Responsible for updating the drawing when new txs/blocks are sent by this component's
   * parent, usually when a new tx arrives on the websocket. For both blocks and
   * transactions, does the following:
   * 1. Remove elements that are not present anymore;
   * 2. Move elements that are already on the graph to ther new X position,
   * using the newScale function;
   * 3. Add the new elements to the beginning of the graph;
   */
  updateDag = (blocks, txs) => {
    const node = this.node;
    const max = getMax(blocks, txs);
    const min = max - this.props.timeframe;
    const scale = this.newScale(min, max);

    let blocksObj = select(node)
      .select('g.blocks')
      .selectAll('.block')
      .data(blocks, this.txId);
    blocksObj.exit().remove();
    blocksObj.transition()
      .duration(300)
      .attr('class', 'block')
      .attr('x', (d) => {return scale(d.timestamp) - this.txRadius})
    blocksObj.enter().append('rect')
      .attr('class', 'block')
      .attr('x', (d) => {return scale(d.timestamp) - this.txRadius})
      .attr('y', Y_BLOCKS - this.txRadius)
      .on("mouseover", (d, i) => {this.updateInfo(d)})
      .on("mouseout", () => {this.removeInfo()})
      .transition()
      .duration(600)
      .attr('width', this.blockSize)
      .attr('height', this.blockSize);

    let txsObj = select(node)
      .select('g.txs')
      .selectAll('.tx')
      .data(txs, this.txId);
    txsObj.exit().remove();
    txsObj.transition()
      .duration(200)
      .attr('class', 'tx')
      .attr('cx', (d) => {return scale(d.timestamp)})
    txsObj.enter().append('circle')
      .attr('class', 'tx')
      .attr('cx', (d) => {return scale(d.timestamp)})
      .attr('cy', (d) => {this.yIndex = (++this.yIndex) % 4; return Y_BLOCKS + Y_TXS[this.yIndex]})
      .on("mouseover", (d, i) => {this.updateInfo(d)})
      .on("mouseout", () => {this.removeInfo()})
      .transition()
      .duration(300)
      .attr('r', this.txRadius);
  }

  /*
   * Called whenever DagComponent is mounted. This draws the initial line and populates
   * drawings with initial blocks/txs.
   */
  createDag = (blocks, txs) => {
    const node = this.node;
    const max = getMax(blocks, txs);
    const min = max - this.props.timeframe;
    const scale = this.newScale(min, max);
    this.txRadius = this.getRadius(this.props.timeframe);
    this.blockSize = 2 * this.txRadius;

    //create axis lines
    select(node).append('line')
        .attr("x1", this.xStart)
        .attr("y1", Y_BLOCKS)
        .attr("x2", this.xEnd)
        .attr("y2", Y_BLOCKS)

    //blocks
    select(node).append('g').attr('class', 'blocks')
      .selectAll('.block')
      .data(blocks, this.txId)
      .enter()
      .append('rect')
      .attr('class', 'block')
      .attr('x', (d) => {return scale(d.timestamp) - this.txRadius})
      .attr('y', Y_BLOCKS - this.txRadius)
      .attr('width', this.blockSize)
      .attr('height', this.blockSize)
      .on("mouseover", (d, i) => {this.updateInfo(d)})
      .on("mouseout", () => {this.removeInfo()});

    //txs
    select(node).append('g').attr('class', 'txs')
      .selectAll('.tx')
      .data(txs, this.txId)
      .enter()
      .append('circle')
      .attr('class', 'tx')
      .attr('cx', (d) => {return scale(d.timestamp)})
      .attr('cy', () => {this.yIndex = (++this.yIndex) % 4; return Y_BLOCKS + Y_TXS[this.yIndex]})
      .attr('r', this.txRadius)
      .on("mouseover", (d, i) => {this.updateInfo(d)})
      .on("mouseout", () => {this.removeInfo()});
  }

  render() {
    return (
      <div>
        <svg className="svg-wrapper mt-5" ref={node => this.node = node}>
        </svg>
        <div id="tx-info"></div>
      </div>
    )
  }
}

export default DagComponent;
