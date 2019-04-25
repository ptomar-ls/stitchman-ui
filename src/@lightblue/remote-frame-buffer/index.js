/**
 * Created by NickHollinghurst on 13/04/2016.
 */



// The KLiveViewer "class" implements the viewer

var KLiveViewer = function (canvas, wsuri, zoomed, debugMode) {
  var self = this;
  //adding a debug mode to be able to turn logging on and off
  /*eslint no-console: ["error", { allow: ["log"] }] */
  if (debugMode) self._log = console.log.bind(console);
  else self._log = function () {
  };

  self._canvas  = canvas;
  self._wsuri   = wsuri;
  self._drawCtx = canvas.getContext('2d');
  if (zoomed) {
    self._zoomedDrawCtx = zoomed.getContext('2d');
  }
  self._msgArr = new Uint8Array(4 + 65536);
  self._msgGot = 0;
  self._width  = 0;
  self._height = 0;
  self._seqnum = [];
  self._log("KLiveViewer: create new WebSocket(" + this._wsuri + ", 'binary')");
  self._unreadyCount = 0;
  self._socket       = new WebSocket(self._wsuri, 'binary');
  self._log("readyState=" + self._socket.readyState);
  self._socket.binaryType = 'arraybuffer';
  self._socket.onopen     = self.start.bind(self);
  self._socket.onmessage  = self._handleMessage.bind(self);
  self._socket.onclose    = self._closeSock.bind(self);
  self._socket.onerror    = self._closeSock.bind(self);
  self._intervalTimer     = setInterval(self._intervalFunction.bind(self), 3000);
  //adding this property to indicate when there is a socket AND it is open
  self.isOpen             = false;
  self.isLoaded           = false;

};

KLiveViewer.prototype = {
  updateZoomImage: function (pos) {
    if (pos || this._zoomedDrawCtx) {
      var imgData = this._drawCtx.getImageData(pos.x, pos.y, 100, 100);
      this._zoomedDrawCtx.putImageData(imgData, 0, 0);
      this._zoomedDrawCtx.strokeStyle = "red";
      this._zoomedDrawCtx.beginPath();
      this._zoomedDrawCtx.arc(50, 50, 2, 0, 2 * Math.PI);
      this._zoomedDrawCtx.stroke();
    }
  },

  // send a "Start" message. Happens when a connection is opened, but you may also call this to resume after "Stop".
  start: function () {
    this.isOpen = true;
    this._log("START, socket=" + this._socket);
    if (this._socket) {
      var startMsg = new Uint8Array(12 + this._seqnum.length);
      startMsg[0]  = 0x4B;
      startMsg[1]  = 0x50;
      startMsg[2]  = 8 + this._seqnum.length;
      startMsg[3]  = 0;
      startMsg[4]  = 0;
      startMsg[5]  = 0;
      startMsg[6]  = 0;
      startMsg[7]  = 0;
      startMsg[8]  = 0;
      startMsg[9]  = 0;
      startMsg[10] = 0;
      startMsg[11] = 0;
      if (this._seqnum.length > 0) startMsg.set(this._seqnum, 12);
      this._socket.send(startMsg);
    }
  },

  // Send a "Stop" message. You might want to do this when the LiveView window becomes invisible?
  stop: function () {
    if (this._socket) {
      var stopMsg = new Uint8Array(4);
      stopMsg[0]  = 0x4B;
      stopMsg[1]  = 0x51;
      stopMsg[2]  = 0;
      stopMsg[3]  = 0;
      this._socket.send(stopMsg);
    }
  },

  // Permanently stop this viewer and close its socket.
  close: function () {
    if (this._intervalTimer) {
      clearInterval(this._intervalTimer);
    }
    this._intervalTimer = null;
    this._closeSock();
    this._drawCtx = null;
  },

  // The remaining functions are for internal use.
  _closeSock: function () {
    this.isOpen = false;
    this._log("CLOSE SOCK");
    if (this._socket) {
      this._socket.close();
    }
    this._socket = null;
  },

  _intervalFunction: function () {
    this._log("_intervalFunction, socket=" + this._socket + ", readyState=" + ((this._socket) ? this._socket.readyState : "n/a"));
    if (!(this._drawCtx)) return; // If explicit close() was called, do nothing
    if (this._socket && this._socket.readyState == 1 && this._socket.bufferedAmount < 64) {
      // If socket is open and ready, send a dummy message as a keep-alive
      var dummyMsg = new Uint8Array(4);
      dummyMsg[0]  = 0x4B;
      dummyMsg[1]  = 0x5F;
      dummyMsg[2]  = 0;
      dummyMsg[3]  = 0;
      this._socket.send(dummyMsg);
      this._unreadyCount = 0;
    }
    else if (!this._socket || this._socket.readyState >= 3 || ++this._unreadyCount >= 5) {
      // If socket is closed or failed to connect, try to re-open it
      if (this._socket) this._socket.close();
      this._msgGot = 0;
      this._log("Re-try to create new WebSocket(" + this._wsuri + ", 'binary'");
      this._socket = new WebSocket(this._wsuri, 'binary');
      this._log("readyState=" + this._socket.readyState);
      this._socket.binaryType = 'arraybuffer';
      this._socket.onopen     = this.start.bind(this);
      this._socket.onmessage  = this._handleMessage.bind(this);
      this._socket.onclose    = this._closeSock.bind(this);
      this._socket.onerror    = this._closeSock.bind(this);
      this._unreadyCount      = 0;
    }
  },

  _handleMessage: function (e) {
    var dataPos = 0;
    while (dataPos < e.data.byteLength) {
      var kmsglen = 4;
      if (this._msgGot >= 4) {
        kmsglen += this._msgArr[2] + 256 * this._msgArr[3];
      }
      var n2read = kmsglen - this._msgGot;
      if (dataPos + n2read > e.data.byteLength) n2read = e.data.byteLength - dataPos;
      if (n2read > 0) {
        var a = new Uint8Array(e.data, dataPos, n2read);
        this._msgArr.set(a, this._msgGot);
        this._msgGot += n2read;
        dataPos += n2read;
      }
      kmsglen = 4;
      if (this._msgGot >= 4) {
        kmsglen = 4 + this._msgArr[2] + 256 * this._msgArr[3];
      }
      if (this._msgGot >= kmsglen) {
        this._unreadyCount = 0;
        this._handleCompleteKaptivoMessage(this._msgArr, kmsglen);
        this._msgGot = 0;
      }
    }
  },

  _handleCompleteKaptivoMessage: function (u8array, msglen) {
    var msgType = u8array[1];
    switch (msgType) {
    case 0x60: // Server Init
      this._width  = u8array[12] + 256 * u8array[13];
      this._height = u8array[14] + 256 * u8array[15];
      if (this._canvas.width !== this._width || this._canvas.height !== this._height) {
        this._canvas.width  = this._width;
        this._canvas.height = this._height;
      }
      this._log('Got ServerInit, width=' + this._width + ', height=' + this._height);
      break;

    case 0x62: // End Update
      this.isLoaded = true;
      if (msglen >= 8) {
        var ack = new Uint8Array(8);
        ack[0]  = 0x4B;
        ack[1]  = 0x52;
        ack[2]  = 4;
        ack[3]  = 0;
        ack[4]  = u8array[4];
        ack[5]  = u8array[5];
        ack[6]  = u8array[6];
        ack[7]  = u8array[7];
        this._socket.send(ack);
        this._seqnum = [u8array[4], u8array[5], u8array[6], u8array[7]];
      }
      break;

    case 0x70:
    case 0x71:
    case 0x72: // Tile data
      if (msglen > 6) {
        var pos = 4;
        var tx  = 32 * u8array[pos++];
        var ty  = 32 * u8array[pos++];
        while (pos < msglen && ty < this._height && tx < this._width) {
          var tw = (tx + 32 <= this._width) ? 32 : this._width - tx;
          var th = (ty + 32 <= this._height) ? 32 : this._height - ty;
          if (u8array[pos] === 0x0C) { // Optimize the all-white case
            this._drawCtx.fillStyle = '#FFFFFF';
            this._drawCtx.fillRect(tx, ty, tw, th);
            pos++;
          }
          else {
            pos = this._doTile(tx, ty, tw, th, msgType - 0x70, u8array, pos);
          }
          tx += 32;
          if (tx >= this._width) {
            ty += 32;
            tx = 0;
          }
        }
      }
    }
  },

  _doTile: function (x, y, width, height, mode, u8array, msgPos) {


    var img        = this._drawCtx.createImageData(width, height);
    var u;
    width *= 4;      // width is now width in *bytes*
    var totalBytes = height * width;

    var paletteR = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var paletteG = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var paletteB = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var palWrPos = 0;
    var pixPos   = 0;
    while (pixPos < totalBytes) {
      var code = u8array[msgPos++];
      var end  = code >> 4;
      code     = code & 15;
      if (end == 15) {
        end += u8array[msgPos++];
        if (end >= 267) end += 4 * u8array[msgPos++];
      }
      end = end * 4 + pixPos;
      if (end == pixPos || end > totalBytes) end = totalBytes;
      if (code < 14) {
        var r = 255, g = 255, b = 255;
        if (code < 12) {
          r = paletteR[code];
          g = paletteG[code];
          b = paletteB[code];
        }
        else if (code > 12) {
          if (mode == 1) {
            u = u8array[msgPos++];
            r = 17 * (u & 15);
            g = 17 * (u >> 4);
            u = u8array[msgPos++];
            b = 17 * (u & 15);
          }
          else {
            r = u8array[msgPos++];
            if (mode == 0) {
              g = r;
              b = r;
            }
            else {
              g = u8array[msgPos++];
              b = u8array[msgPos++];
            }
          }
          paletteR[palWrPos] = r;
          paletteG[palWrPos] = g;
          paletteB[palWrPos] = b;
          if (++palWrPos >= 12) palWrPos = 0;
        }
        while (pixPos < end) {
          img.data[pixPos++] = r;
          img.data[pixPos++] = g;
          img.data[pixPos++] = b;
          img.data[pixPos++] = 255;
        }
      }
      else if (code < 15) {
        while (pixPos < width && pixPos < end) {
          img.data[pixPos++] = 255;
        }
        while (pixPos < end) {
          img.data[pixPos] = img.data[pixPos - width];
          pixPos++;
        }
      }
      else {
        if (mode == 1) {
          while (pixPos < end) {
            u                  = u8array[msgPos++];
            img.data[pixPos++] = 17 * (u & 15);
            img.data[pixPos++] = 17 * (u >> 4);
            u                  = u8array[msgPos++];
            img.data[pixPos++] = 17 * (u & 15);
            img.data[pixPos++] = 255;
            if (pixPos >= end) break;
            img.data[pixPos++] = 17 * (u >> 4);
            u                  = u8array[msgPos++];
            img.data[pixPos++] = 17 * (u & 15);
            img.data[pixPos++] = 17 * (u >> 4);
            img.data[pixPos++] = 255;
          }
        }
        else {
          while (pixPos < end) {
            u                  = u8array[msgPos++];
            img.data[pixPos++] = u;
            if (mode == 0) {
              img.data[pixPos++] = u;
              img.data[pixPos++] = u;
            }
            else {
              img.data[pixPos++] = u8array[msgPos++];
              img.data[pixPos++] = u8array[msgPos++];
            }
            img.data[pixPos++] = 255;
          }
        }
      }
    }
    this._drawCtx.putImageData(img, x, y);
    return msgPos;
  }

};

export {
  KLiveViewer,
};
