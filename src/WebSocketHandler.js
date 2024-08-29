/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import { WS_URL } from './constants';

const HEARTBEAT_TMO = 30000; // 30s

class WS extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.setup = this.setup.bind(this);
    this.sendPing = this.sendPing.bind(this);
    this.sendMessage = this.sendMessage.bind(this);

    this.setup();
  }

  setup() {
    if (this.connected) {
      return;
    }
    console.log('ws setup');
    this.ws = null;
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onerror = this.onError.bind(this);
    this.ws.onclose = this.onClose.bind(this);
  }

  onMessage(evt) {
    const message = JSON.parse(evt.data);
    const _type = message.type.split(':')[0];
    this.emit(_type, message);
  }

  onOpen() {
    this.connected = true;
    console.log('ws connection established');
    this.heartbeat = setInterval(this.sendPing, HEARTBEAT_TMO);
  }

  onClose(evt) {
    this.connected = false;
    if (evt?.code === 1006) {
      console.warn('Abnormal ws connection closure. Are you using a secure ws connection?');
    }
    setTimeout(this.setup, 5000);
    clearInterval(this.heartbeat);
    console.log('ws connection closed');
  }

  onError(evt) {
    console.log('ws error', evt);
  }

  sendMessage(msg) {
    if (!this.connected) {
      console.log('ws not connected, cannot send message');
      return;
    }

    this.ws.send(msg);
  }

  sendPing() {
    const msg = JSON.stringify({ type: 'ping' });
    this.sendMessage(msg);
  }
}

const instance = new WS();

export default instance;
