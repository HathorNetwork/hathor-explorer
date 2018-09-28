import EventEmitter from 'events';
import { WS_URL } from './constants';

const HEARTBEAT_TMO = 30000;     // 30s


class WS extends EventEmitter {
  constructor(){
    if (!WS.instance) {
      super();
      this.connected = false;
      this.setup();
    }

    return WS.instance;
  }

  setup = () => {
    if (this.connected) {
      return;
    }
    console.log('ws setup');
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = this.onOpen;
    this.ws.onmessage = this.onMessage;
    this.ws.onerror = this.onError;
    this.ws.onclose = this.onClose;
  }

  onMessage = evt => {
    const message = JSON.parse(evt.data)
    const _type = message.type.split(':')[0]
    this.emit(_type, message)
  }

  onOpen = () => {
    this.connected = true;
    console.log('ws connection established');
    this.heartbeat = setInterval(this.sendPing, HEARTBEAT_TMO);
  }

  onClose = () => {
    this.connected = false;
    setTimeout(this.setup, 500);
    clearInterval(this.heartbeat);
    console.log('ws connection closed');
  }

  onError = evt => {
    console.log('ws error', evt);
  }

  sendMessage = (msg) => {
    if (!this.connected) {
      console.log('ws not connected, cannot send message');
      return;
    }
    
    this.ws.send(msg);
  }

  sendPing = () => {
    const msg = JSON.stringify({'type': 'ping'})
    this.sendMessage(msg)
  }

}

const instance = new WS();

export default instance;
