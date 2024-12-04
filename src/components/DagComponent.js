/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';

// TODO
// Remove old tx/block to release memory
// Timestamp of blocks should go together with tx?
// (A block and a tx with the same timestamp should appear in the same vertical line?)
// Blocks are now in one horizontal line only, we are not considering block fork
// When we have a better control of timestamp in the graph we should change
// the throttle background to cover a timestamp region and not a tx/block

class DagComponent extends React.Component {
  constructor(props) {
    super(props);

    // Tx circle radius and color
    this.txRadius = 8;
    this.txColor = 'steelblue';

    // Block rectangle width, height and color
    this.blockWidth = 20;
    this.blockHeight = 10;
    this.blockColor = 'darkgoldenrod';

    // X distance between txs and blocks
    this.txMargin = 40;

    // X to start showing blocks and txs
    this.startBlockX = this.txMargin;
    this.startTxX = 2 * this.txMargin;

    // Svg height
    this.height = this.props.newUiEnabled ? '100%' : 600;

    // Y position of blocks
    this.blockY = this.height / 2;

    // Last tx timestamp showed in the dag and the index
    this.currentTimestamp = null;
    this.currentTimestampIndex = 0;

    // All graph data (txs and blocks) and its links
    this.graph = {};
    this.links = [];

    // Tx and block indexes
    this.indexTx = -1;
    this.indexBlock = 0;

    // Transform X, Y and Scale to hold last change when zooming of translating
    this.lastZoomX = 0;
    this.lastZoomY = 0;
    this.lastZoomScale = 1;

    // Throttle background
    this.throttleBackground = { size: 2 * this.txRadius + this.txMargin, color: '#eee' };

    this.newTxs = this.newTxs.bind(this);
    this.newBlocks = this.newBlocks.bind(this);
    this.newLinks = this.newLinks.bind(this);
    this.fade = this.fade.bind(this);
    this.zoomed = this.zoomed.bind(this);
    this.getTxY = this.getTxY.bind(this);
    this.translateGraph = this.translateGraph.bind(this);
    this.createTooltip = this.createTooltip.bind(this);
    this.removeTooltip = this.removeTooltip.bind(this);
    this.moveTooltip = this.moveTooltip.bind(this);
    this.addThrottleBackground = this.addThrottleBackground.bind(this);
  }

  componentDidMount() {
    this.tooltip = select('.tooltip').style('opacity', 0);
    this.drawGraph();
  }

  getTxY() {
    // We show same timestamp tx in a vertical axis alternating top and bottom from the block line
    const signal = this.currentTimestampIndex % 2 === 0 ? -1 : 1;
    const multiplier = Math.floor(this.currentTimestampIndex / 2) + 1;
    return this.height / 2 + signal * multiplier * this.txMargin;
  }

  newData(data, isBlock, initialData) {
    /*
     Called for every new block or tx that arrives
     data: object with tx/block data
     isBlock: boolean saying if it's block or tx
     initialData: boolean saying if this is from the first draw or from the websocket
     */
    let x = null;
    const parents = data.parents || [];
    if (isBlock) {
      // Calculate new x value to add this block
      x = this.startBlockX + this.indexBlock * this.txMargin;
      const graphData = {
        id: data.tx_id,
        isBlock: true,
        x,
        y: this.blockY,
        links: [],
        timestamp: data.timestamp,
      };
      this.graph[data.tx_id] = graphData;
      const newLinks = [];
      for (const parent of parents) {
        // Validate if parent is in the data, otherwise no need to add a link
        if (this.graph[parent]) {
          // Creating link for each parent
          const linkData = {
            source: {
              id: data.tx_id,
              x: x + this.blockWidth / 2,
              y: this.blockY + this.blockHeight / 2,
            },
            target: {
              id: parent,
              x: this.graph[parent].x + (this.graph[parent].isBlock ? this.blockWidth / 2 : 0),
              y: this.graph[parent].y + (this.graph[parent].isBlock ? this.blockHeight / 2 : 0),
            },
          };
          this.links.push(linkData);
          newLinks.push(linkData);
          this.graph[parent].links.push(data.tx_id);
          this.graph[data.tx_id].links.push(parent);
        }
      }
      // Add new links to graph
      this.newLinks(newLinks);
      // Add new block to graph
      this.newBlocks([this.graph[data.tx_id]]);
      this.indexBlock += 1;
    } else {
      // Verify if it's the same timestamp as the last one
      if (data.timestamp === this.currentTimestamp) {
        this.currentTimestampIndex += 1;
      } else {
        this.currentTimestamp = data.timestamp;
        this.currentTimestampIndex = 0;
        this.indexTx += 1;
      }
      // Calculate new x value to add this tx
      x = this.startTxX + this.indexTx * this.txMargin;
      const graphData = {
        id: data.tx_id,
        isBlock: false,
        x,
        y: this.getTxY(),
        links: [],
        timestamp: data.timestamp,
      };
      this.graph[data.tx_id] = graphData;
      const newLinks = [];
      for (const parent of parents) {
        // Validate if parent is in the data, otherwise no need to add a link
        if (this.graph[parent]) {
          // Creating link for each parent
          const linkData = {
            source: {
              id: data.tx_id,
              x,
              y: this.getTxY(),
            },
            target: {
              id: parent,
              x: this.graph[parent].x,
              y: this.graph[parent].y,
            },
          };
          this.links.push(linkData);
          this.graph[parent].links.push(data.tx_id);
          this.graph[data.tx_id].links.push(parent);
          newLinks.push(linkData);
        }
      }
      // Adding new links to the graph
      this.newLinks(newLinks);
      // Adding new tx to the graph
      this.newTxs([this.graph[data.tx_id]]);
    }

    if (!initialData) {
      // Translate graph if new element is added in a place that is not appearing
      // In the case of first draw we translate only after adding all elements
      this.translateGraph(x);
    }

    if (data.throttled) {
      this.addThrottleBackground([this.graph[data.tx_id]]);
    }
    return x;
  }

  translateGraph(x) {
    // Translate the graph to show the last added element
    // Get diff from last x to the one that is being added
    const diff = x - ((this.width - this.txMargin) / this.lastZoomScale - this.lastZoomX);
    if (diff > 0) {
      // If diff > 0, means that it's not appearing, so we translate the graph
      this.gDraw
        .transition()
        .duration(300)
        .call(
          this.zoomCall.transform,
          zoomIdentity
            .scale(this.lastZoomScale)
            .translate(this.lastZoomX - diff, this.lastZoomY / this.lastZoomScale)
        );
      // Save new X zoom
      this.lastZoomX -= diff;
    }
  }

  newLinks(links) {
    // Add new links to the svg
    this.gLinks
      .selectAll()
      .data(links)
      .enter()
      .append('g')
      .attr('class', 'link')
      .append('line')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    this.link = this.gLinks.selectAll('line');
  }

  newTxs(txs) {
    // Add new txs to the svg

    // Add g auxiliar element
    const tx = this.gTxs
      .selectAll()
      .data(txs)
      .enter()
      .filter(d => !d.isBlock)
      .append('g')
      .attr('class', 'tx');

    // Add circle with tx data
    tx.append('circle')
      .attr('r', this.txRadius)
      .attr('fill', this.txColor)
      .attr('cx', d => {
        return d.x;
      })
      .attr('cy', d => {
        return d.y;
      });

    // Mouseover event to show/move/remove tooltip
    tx.on('mouseover.tooltip', d => {
      this.createTooltip(d);
    })
      .on('mouseover.fade', this.fade(0.1))
      .on('mouseout.tooltip', e => {
        this.removeTooltip(e);
      })
      .on('mouseout.fade', this.fade(1))
      .on('mousemove', e => {
        this.moveTooltip(e);
      });

    // Add text to show tx info
    tx.append('text')
      .append('tspan')
      .attr('class', 'tx-text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .attr('x', d => {
        return d.x;
      })
      .attr('y', d => {
        return d.y;
      })
      .text(d => d.id.substring(0, 4));

    this.tx = this.gTxs.selectAll('circle');
  }

  newBlocks(blocks) {
    // Add new blocks to the svg

    // Create g auxiliar element
    const block = this.gBlocks
      .selectAll()
      .data(blocks)
      .enter()
      .filter(d => d.isBlock)
      .append('g')
      .attr('class', 'block');

    // Add tooltip events
    block
      .on('mouseover.tooltip', d => {
        this.createTooltip(d);
      })
      .on('mouseover.fade', this.fade(0.1))
      .on('mouseout.tooltip', e => {
        this.removeTooltip(e);
      })
      .on('mouseout.fade', this.fade(1))
      .on('mousemove', e => {
        this.moveTooltip(e);
      });

    // Add rectangle with block data
    block
      .append('rect')
      .attr('fill', this.blockColor)
      .attr('width', this.blockWidth)
      .attr('height', this.blockHeight)
      .attr('x', d => {
        return d.x;
      })
      .attr('y', d => {
        return d.y;
      });

    // Add text to show block info
    block
      .filter(d => d.isBlock)
      .append('text')
      .append('tspan')
      .attr('class', 'block-text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .attr('x', d => {
        return d.x + this.blockWidth / 2;
      })
      .attr('y', d => {
        return d.y + this.blockHeight / 2;
      })
      .text(d => d.id.substring(0, 4));

    this.block = this.gBlocks.selectAll('rect');
  }

  addThrottleBackground(data) {
    this.gThrottleBg
      .selectAll()
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'throttle-bg')
      .append('rect')
      .attr('fill', this.throttleBackground.color)
      .attr('width', this.throttleBackground.size)
      .attr('height', this.throttleBackground.size)
      .attr('x', d => {
        return d.x - this.throttleBackground.size / 2;
      })
      .attr('y', d => {
        return d.y - this.throttleBackground.size / 2;
      });
  }

  drawGraph() {
    // Setting svg width depending on the window size
    this.width = this.props.newUiEnabled ? '100%' : Math.min(960, this.refs.dagWrapper.offsetWidth);

    // Create svg and auxiliar g elements
    this.svg = select(this.props.newUiEnabled ? '#graph' : 'svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.gMain = this.svg.append('g').classed('g-main', true);

    this.gMain
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('fill', 'white');

    this.gDraw = this.gMain.append('g');

    this.gThrottleBg = this.gDraw.append('g');
    this.gLinks = this.gDraw.append('g');
    this.gTxs = this.gDraw.append('g');
    this.gBlocks = this.gDraw.append('g');

    // Adding zoom handler
    this.zoomCall = zoom().on('zoom', this.zoomed);

    this.gMain.call(this.zoomCall);

    // Handle initial data translating in the end to last X
    let maxX = 0;

    for (const tx of this.props.txs) {
      const newX = this.newData(tx, false, true);
      maxX = Math.max(maxX, newX);
    }

    for (const block of this.props.blocks) {
      const newX = this.newData(block, true, true);
      maxX = Math.max(maxX, newX);
    }

    this.translateGraph(maxX);
  }

  fade(opacity) {
    // On mouseover in an element we fade the ones that are not connected
    return mouseEvent => {
      /** Data from the tx being hovered */
      const d = mouseEvent.currentTarget.__data__;
      if (this.tx) {
        this.tx.style('stroke-opacity', function changeStrokeOpacity(o) {
          const thisOpacity = d.links.indexOf(o.id) > -1 || d.id === o.id ? 1 : opacity;
          this.setAttribute('fill-opacity', thisOpacity);
          return thisOpacity;
        });
      }

      if (this.block) {
        this.block.style('stroke-opacity', function changeStrokeOpacity(o) {
          const thisOpacity = d.links.indexOf(o.id) > -1 || d.id === o.id ? 1 : opacity;
          this.setAttribute('fill-opacity', thisOpacity);
          return thisOpacity;
        });
      }

      if (this.link) {
        const linkOpacity = opacity === 1 ? 1 : 0;
        this.link.style('stroke-opacity', o => {
          return o.source.id === d.id || o.target.id === d.id ? 1 : linkOpacity;
        });
      }
    };
  }

  zoomed(event) {
    // TODO
    // I am blocking zoom in right now because I was having a bug to auto translate when zoomed in
    if (event.transform.k > 1) {
      /* eslint-disable no-param-reassign */
      event.transform.x = this.lastZoomX;
      event.transform.y = this.lastZoomY;
      event.transform.k = this.lastZoomScale;
      /* eslint-enable no-param-reassign */
      return;
    }
    this.gDraw.attr('transform', event.transform);
    // Save current zoom for later use
    this.lastZoomX = event.transform.x;
    this.lastZoomY = event.transform.y;
    this.lastZoomScale = event.transform.k;
    // We need to update the __zoom property so we can combine the mouse zoom with the automatic transition
    this.gMain.node().__zoom = event.transform;
  }

  createTooltip(mouseEvent) {
    /** Data from the tx being hovered */
    const data = mouseEvent.currentTarget.__data__;

    // Create tooltip on mouse over in a block or tx to show their info
    this.tooltip
      .transition()
      .duration(300)
      .style('opacity', 1);
    this.tooltip
      .html(`<strong>Hash:</strong>${data.id}<br/><strong>Timestamp: </strong>${data.timestamp}`)
      .style('left', `${mouseEvent.pageX}px`)
      .style('top', `${mouseEvent.pageY + 10}px`);
  }

  removeTooltip() {
    // Remove tooltip when mouse out in a block or tx
    this.tooltip
      .transition()
      .duration(100)
      .style('opacity', 0);
  }

  moveTooltip(event) {
    // Move tooltip when mouse move in a block or tx
    this.tooltip.style('left', `${event.pageX}px`).style('top', `${event.pageY + 10}px`);
  }

  render() {
    return (
      <div ref="dagWrapper" className="dagWrapper">
        <svg id="graph" />
        <div className="tooltip"></div>
      </div>
    );
  }
}

export default DagComponent;
