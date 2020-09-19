/**
 * A class that implements a data transfer protocol over MSFS L:Vars. 
 */
class WTBus {

  /**
   * Constructs an instance of the WTBus.
   * @param {Number} address The numeric address of this endpoint on the bus.
   */
  constructor(address) {
    this._address = address;
    this._commandHandlers = {};

    const varPrefix = 'L:WTBus';

    this._addressLine = `${varPrefix}.Address`;
    this._dataLines = [];

    for (var i = 0; i < 128; i++) {
      this._dataLines.push(`${varPrefix}.Data.${i}`); 
    }

    this._recvBuffer = null;
    this._lvarBuffer = null;
    this._currentRecvIndex = 0;

    this._sendBuffers = [];
    this._currentSendIndex = 0;

    this._currentOpcode = -1;
    this._currentLength = -1;

    this._isSending = false;
  }

  /**
   * Registers a command to be handled by this endpoint on the bus.
   * @param {Number} opcode The numeric opcode to be handled by this callback.
   * @param {Function} handler The handler callback of type (payload) => {} to be
   * called when the bus receives the specified command.
   */
  registerCommand(opcode, handler) {
    this._commandHandlers[opcode] = handler;
  }

  /**
   * A method called each frame to process the receiving of data on the bus.
   */
  processRecv() {
    try {
      let currentBusAddress = this._getLVar(this._addressLine);

      //If the bus is hot and indicates our address
      if (currentBusAddress === this._address) {
        
        let lVarIndex = 0;

        //If this is the beginning of a message
        if (this._currentOpcode === -1) {
          this._currentOpcode = this._getLVar(this._dataLines[0]);
          this._currentLength = this._getLVar(this._dataLines[1]);

          const bufferSize = Math.ceil(this._currentLength / 4);
          this._recvBuffer = new ArrayBuffer(bufferSize * 4);
          this._lvarBuffer = new Int16Array(this._recvBuffer);

          lVarIndex = 2;
        }

        //Get up to 128 LVars
        for (var i = lVarIndex; i < 128 && this._currentRecvIndex < this._lvarBuffer.length > 0; i++) {

          const data = this._getLVar(this._dataLines[i]);
          this._lvarBuffer[this._currentRecvIndex] = data;

          this._currentRecvIndex++;
        }

        //If we're done receiving the message
        if (this._currentRecvIndex === this._lvarBuffer.length) {
          const textBuffer = new Uint8Array(this._recvBuffer, 0, this._currentLength);
          
          try {
            const payload = JSON.parse(String.fromCharCode(...textBuffer));
            this._commandHandlers[this._currentOpcode](payload);
          }
          catch (err) {
            console.error(err);
          }
          
          this._recvBuffer = null;
          this._lvarBuffer = null;
          this._currentRecvIndex = 0;
          this._currentOpcode = -1;

          //Reset the address line so the bus is now free
          this._setLVar(this._addressLine, 0);
          currentBusAddress = 0;
        }
      } 
    }
    catch (err) {
      console.error(err);
    }
  }

  /**
   * A method called each frame to process sending messages on the bus.
   */
  processSend() {
    try {
      let currentBusAddress = this._getLVar(this._addressLine);

      //If nobody else is currently sending and we need to, set the sending flag
      //and post the address.
      if (currentBusAddress === 0 && this._sendBuffers.length !== 0) {
        this._isSending = true;
        this._setLVar(this._addressLine, this._sendBuffers[0].address);
      }

      if (this._isSending) {
        for (var i = 0; i < 128 && this._currentSendIndex < this._sendBuffers[0].buffer.length; i++) {
          this._setLVar(this._dataLines[i], this._sendBuffers[0].buffer[this._currentSendIndex]);
          this._currentSendIndex++;
        }

        if (this._currentSendIndex === this._sendBuffers[0].buffer.length) {
          this._isSending = false;
          this._sendBuffers[0].promise.resolve();
    
          this._sendBuffers.shift();
        }
      }
    }
    catch (err) {
      console.error(err);
    }
  }

  /**
   * Sends a message to the specified address, with the opcode and payload provided.
   * @param {Number} address The address to send to.
   * @param {Number} opcode The opcode of the message.
   * @param {*} payload The payload to send.
   * @returns {Promise} A promise that is resolved when the send completes.
   */
  send(address, opcode, payload) {
    const payloadString = JSON.stringify(payload);
    const payloadLength = payloadString.length;

    const payloadBuffer = new ArrayBuffer((Math.ceil(payloadLength / 4) * 4) + 4);
    const int32buffer = new Int16Array(payloadBuffer, 0, 2);

    int32buffer[0] = opcode;
    int32buffer[1] = payloadLength;

    const uintbuffer = new Uint8Array(payloadBuffer, 0);
    for (var i = 0; i < payloadString.length; i++) {
      uintbuffer[i+4] = payloadString.charCodeAt(i);
    }

    let resolve, reject;
    let promise = new Promise((r, rj) => {
      resolve = r;
      reject = rj;
    });

    this._sendBuffers.push({
      address: address,
      buffer: new Int16Array(payloadBuffer),
      promise: {resolve, reject}
    });

    return promise;
  }

  /**
   * Gets a numeric LVar from the sim.
   * @param {String} name The name of the LVar to get the value for.
   * @returns The numeric LVar value.
   */
  _getLVar(name) {
    return SimVar.GetSimVarValue(name, 'number');
  }

  /**
   * Sets a numeric LVar in the sim.
   * @param {String} name The name of the LVar to set.
   * @param {Number} value The numeric value to set the LVar to.
   */
  _setLVar(name, value) {
    SimVar.SetSimVarValue(name, 'number', value);
  }
}