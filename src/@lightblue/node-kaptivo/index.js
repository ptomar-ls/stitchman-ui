
//////////////////////////////////////////////////////////////////////////
//!  node-kaptivo
//!
//!  Kaptivo API wrapper for node.js developers
//!
//! Copyright 2019 Light Blue Optics
//!   author: Nobu Oyama
//!


//////////////////////////////////////////////////////////////////////////
// External dependencies

const axios = require('axios');
const jwtDecode = require('jwt-decode');


//////////////////////////////////////////////////////////////////////////
// Module internal utilities

class ExtendableError extends Error {
  constructor(message, name) {
    super(message);
    if (name) {
      this.name = name;
    } else {
      this.name = this.constructor.name;
    }
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

function queryString(params) {
  let keyVals = []
  for (let key in params) {
    keyVals.push(key + '=' + params[key]);
  }
  return keyVals.length ? ('?' + keyVals.join('&')) : '';
}

function extractHostFromURL(url) {
  let host = null;
  if (url) {
    let tokens = url.split('://');
    if (tokens.length == 2) {
      host = tokens[1].split(':')[0];
    }
  }
  return host;
}

function log(msg) {
  if (g_verbose) {
    console.log(msg);
  }
}

function logRequest({method, url, body}) {
  log('------------------------------------------------------');
  log('  method: ' + method);
  log('     url: ' + url);
  if (body) {
    log('    body: ' + JSON.stringify(body));
  }
  log('------------------------------------------------------');
}

function logResult(result) {
  log('------------------------------------------------------');
  log('  status: ' + result.status);
  log(' headers: ' + JSON.stringify(result.headers));
  log('    body: ' + JSON.stringify(result.data));
  log('------------------------------------------------------');
}


//////////////////////////////////////////////////////////////////////////
// Module private variables

let g_simServer = null;
let g_clientToken = null;
let g_verbose = false;
let g_resolvers = {};


const API_SYMS = () => g_simServer + '/sims';
const API_SYM = id => g_simServer + `/sims/${id}`;
const API_CONTROLPAD = id => g_simServer + `/sims/${id}/controlpad`;
const API_CONTROLPAD_INPUT = id => g_simServer + `/sims/${id}/controlpad/input`;


//////////////////////////////////////////////////////////////////////////
// Authorization API handling

function setExternalResolver(state, {resolve, reject}) {
  g_resolvers[state] = {resolve, reject};
}

function clearExternalResolver(state) {
  if (g_resolvers[state]) {
    delete g_resolvers[state];
  }
}

function externalResolve(state, value) {
  if (g_resolvers[state] && g_resolvers[state].resolve) {
    g_resolvers[state].resolve(value);
  }
  clearExternalResolver(state);
}

function externalReject(state, value) {
  if (g_resolvers[state] && g_resolvers[state].reject) {
    g_resolvers[state].reject(value);
  }
  clearExternalResolver(state);
}

function isWaitingFor(state) {
  return !!g_resolvers[state];
}


function parseAuthResult(url) {
  let response = url.split('#')[1] || ''; //! actual response is behind '#'
  let keyVals = {};
  response.split('&').forEach(item => {
    let keyAndRest = item.split('=');
    let key = keyAndRest[0];
    let val = keyAndRest.slice(1).join('='); //! In case '=' is included in the value
    keyVals[key] = val;
  });
  return keyVals;
}


//////////////////////////////////////////////////////////////////////////
// Exported classes/functions

const PRIVATE = Symbol();

/**
 * Kaptivo wrapper
 */
class NodeKaptivo {

  //! Create a NodeKaptivo instance

  /**
   * @constructor
   * @param {Object} param
   * @param {string} param.kaptivoId kaptivoId This can be omitted if ip is given.
   * @param {string} param.ip (Optional) Private IP address of the Kaptivo, if it is known.
   * @param {number} param.port (Optional) Port number to be used. Mainly for simulator.
   * @param {boolean} param.ssl (Optional) Whether or not to use the SSL connection when relay is not in use. Default: false.
   * @param {string} param.clientToken (Optional) can be omitted if it is globally set via setGlobalClientToken function.
   * @param {string} param.roomPairingToken (Optional) room pairing JWT. Required when using getControlPadStatus/pushControlPadButton
   * @param {function} param.callback (Optional) event receiver callback function
   */
  constructor({ kaptivoId, ip, port=80, ssl=false, clientToken, roomPairingToken, callback }) {
    this[PRIVATE] = {};

    if (!kaptivoId && !ip) {
      new ExtendableError('kaptivoId or ip (with optional port) must be provided', 'MissingParameterError');
    }
    this[PRIVATE].kaptivoId = kaptivoId;
    this[PRIVATE].ip = ip;
    this[PRIVATE].port = port;
    this[PRIVATE].ssl = ssl;
    this[PRIVATE].clientToken = clientToken || g_clientToken;
    this[PRIVATE].roomPairingToken = roomPairingToken;
    this[PRIVATE].callback = (typeof callback === 'function') ? callback : null;
    this[PRIVATE].apiOrigin = null;
  }

  /**
   * A function to destroy the NodeKaptivo instance.
   * Mainly to allow NodeKaptivoSim to destroy the simulation instance.
   * @return {Promise<void>} A promise that gets resolved when the destruction completes.
   */
  async destroy() {
    this[PRIVATE] = {};
  }

  //! Attribute getters/setters

  /**
   * Kaptivo ID getter
   * @return {string} Kaptivo ID
   */
  getKaptivoId() {
    return this[PRIVATE].kaptivoId ? (this[PRIVATE].kaptivoId + '') : '';
  }

  /**
   * Kaptivo ID getter
   * @return {string} Kaptivo ID
   */
  getKaptivoIp() {
    return this[PRIVATE].ip;
  }

  /**
   * API origin getter. NodeKaptivo pick up the best API origin to be used.
   * @return {string} API ogigin used by NodeKaptivo instance
   */
  getApiOrigin() {
    return this[PRIVATE].apiOrigin ? (this[PRIVATE].apiOrigin + '') : '';
  }

  /**
   * Set room pairing token to enable getControlPadStatus/pushControlPadButton methods.
   * This is mainly for test-automation purpose.
   * NodeKaptivo keeps the token if postRoomPairing methods succeeds.
   * @param {string} roomPairingToken room pairing token
   */
  setRoomPairingToken(roomPairingToken) {
    this[PRIVATE].roomPairingToken = roomPairingToken;
  }

  //! Wrappers for frequently used API's

  /**
   * Calls ping API
   * @return {Promise<Object>} a promise that resolves ping API result.
   */
  async ping() {
    return (await this.apiGet({path: '/api/discovery/ping'})).result;
  }

  /**
   * Calls public policy API
   * @return {Promise<Object>} a promise that resolves public policy API result
   */
  async getPublicPolicy() {
    return (await this.apiGet({path: '/api/v2/admin/system/public_policy'})).result;
  }

  /**
   * Starts a new meeting session
   * @param {Object} param
   * @param {string} param.accessToken access token with 'view' or 'local_view' scope
   * @return {Promise<Object>} a promise to resolve the session info containing, participantId, name, role, frameWidth, frameHeight, sessionId, and liveStreamUri
   */
  async startSession({accessToken}) {
    if (!accessToken) {
      throw new ExtendableError('accessToken is required', 'MissingParameterError');
    }

    let sessionData = {};
    sessionData.accessToken = accessToken;

    //! Start a session
    let apiResult = (await this.apiPost({path: '/api/v2/meeting/participants', accessToken, body: {}})).result;
    sessionData.participantId = apiResult.id;  //! ID of the local participant (Control System)
    sessionData.name = apiResult.name; //! Name of the local participant
    sessionData.role = apiResult.role; //! Role of the local participant
    let session = apiResult.session;
    sessionData.frameWidth = session.content_info.pixel_width;  //! Width of a frame (pixels)
    sessionData.frameHeight = session.content_info.pixel_height; //! Height of a frame (pixels)
    sessionData.sessionId = session.id; //! ID of the session

    //! Get live stream URL
    apiResult = (await this.apiGet({path: `/api/v2/sessions/${sessionData.sessionId}/content/liveview`, accessToken})).result;
    sessionData.liveStreamUri = apiResult.websocket_rle_uri;

    return sessionData;
  }

  /**
   * end the ongoing meeting session
   * @param {Object} sessionData
   * @param {Object} sessionData.accessToken access token for the session to be ended
   * @param {number} sessionData.participantId participant id of the local participant
   * @return {Promise<*>} a promise that gets resolved when the session ends
   */
  async endSession({accessToken, participantId}) {
    if (!accessToken || !participantId) {
      throw new ExtendableError('accessToken and participantId are required', 'MissingParameterError');
    }

    let path = `/api/v2/meeting/participants/${participantId}`;
    let body = { status: 'ended' };

    return await this.apiPatch({path, accessToken, body});
  }

  /**
   * pairing instance getter API wrapper
   * @param {Object} param
   * @param {string} param.accessToken access token with 'pair' or 'remote_config' scope
   * @return {Promise<Array>} a promise to resolve an array of existing pairing instances
   */
  async getPairingInstances({accessToken}) {
    return (await this.apiGet({accessToken, path: '/api/v2/admin/pairing/instances'})).result;
  }

  /**
   * delete pairing instance API wrapper
   * @param {Object} param
   * @param {string} param.accessToken access token with 'pair' or 'remote_config' scope
   * @param {number} param.id id of the pairing instance to be deleted
   * @return {Promise<void>} a promise that gets resolved when the pairing instance is delted
   */
  async deletePairingInstance({accessToken, id}) {
    await this.apiDelete({accessToken, path: '/api/v2/admin/pairing/instances/' + id});
  }

  /**
   * Set up a new room type pairing relationship with the Kaptivo
   * @param {Object} param
   * @param {string} param.accessToken access token with 'pair' or 'remote_config' scope
   * @param {string} param.paired_identity Unique id of the paired system. Things can go wrong if this is not unique.
   * @param {string} param.pairing_description Human friendly description of the paired system. Shown on Kaptivo config-app.
   * @param {boolean} param.override (Optional) flag to tell Kaptivo to override the existing room pairing or not. Default: false
   * @return {Promise<string>} a promise that resolves the pairing token
   */
  async postRoomPairing({accessToken, paired_identity, pairing_description, override=false}) {
    if (!paired_identity || !pairing_description) {
      throw new ExtendableError('paired_identity and pairing_description are required', 'MissingParameterError');
    }

    if (!accessToken) {
      accessToken = await this.authorize({scope: 'pair'});
    }

    let path = '/api/v2/admin/pairing/instances';
    let body = {
      pairing_type: 'room',
      enabled: true,
      paired_identity,
      pairing_description,
    };

    try {
      this[PRIVATE].roomPairingToken = (await this.apiPost({path, accessToken, body})).result.pairing_token;
    } catch (err) {
      if (override && err.response && err.response.data && err.response.data.code === 'pair_instance_limit_reached') {
        //! Delete existing 'room' pairing
        let pairings = await this. getPairingInstances({accessToken});
        for (let p of pairings) {
          if (p.pairing_type === 'room') {
            await this.deletePairingInstance({accessToken, id: p.id});
          }
        }
        //! ...and retry
        this[PRIVATE].roomPairingToken = (await this.apiPost({path, accessToken, body})).result.pairing_token;
      } else {
        throw err;
      }
    }
    return this[PRIVATE].roomPairingToken;
  }

  /**
   * Set up a new observer type pairing relationship with the Kaptivo
   * If the paired system supports SSDP, Kaptivo discovers it based on paired_identity and updates ip_addr automatically.
   * @param {Object} param
   * @param {string} param.accessToken access token with 'pair' or 'remote_config' scope
   * @param {string} param.paired_identity Unique id of the paired system. Things can go wrong if this is not unique.
   * @param {string} param.pairing_description Human friendly description of the paired system. Shown on Kaptivo config-app.
   * @param {string} param.ip_addr (Optional) IP address of the paired system. Kaptivo sends its session info to this address.
   * @return {Promise<string>} a promise that resolves the pairing token
   */
  async postObserverPairing({accessToken, paired_identity, pairing_description, ip_addr}) {
    if (!paired_identity || !pairing_description) {
      throw new ExtendableError('paired_identity and pairing_description are required', 'MissingParameterError');
    }

    if (!accessToken) {
      accessToken = await this.authorize({scope: 'pair'});
    }

    let path = '/api/v2/admin/pairing/instances';
    let body = {
      pairing_type: 'observer',
      enabled: true,
      ip_addr,
      paired_identity,
      pairing_description,
    };

    return (await this.apiPost({path, accessToken, body})).result.pairing_token;
  }

  //! auto test runner helper

  /**
   * get the control pad status
   * room pairing token must be set before calling this function.
   * It can be set via contructor,setRoomPairingToken,postRoomPairing.
   * @return {Promise<Object>} a promise that resolves an object containing control pad status
   */
  async getControlPadStatus() {
    if (this[PRIVATE].roomPairingToken) {
      let path = '/api/v2/peripheral/controlpad';
      let accessToken = await this.authorize({scope: 'controlpad', pairing_token: this[PRIVATE].roomPairingToken});
      let ret = await this.apiGet({path, accessToken});
      return ret.result;
    } else {
      new ExtendableError('Room Pairing Token is required', 'MissingParameterError');
    }
  }

  /**
   * push the control pad button programatically
   * room pairing token must be set before calling this function.
   * It can be set via contructor,setRoomPairingToken,postRoomPairing.
   * @return {Promise<*>} a promise that gets resolved then the button is programatically pushed
   */
  async pushControlPadButton() {
    if (this[PRIVATE].roomPairingToken) {
      let path = '/api/v2/peripheral/controlpad/input';
      let accessToken = await this.authorize({scope: 'controlpad', pairing_token: this[PRIVATE].roomPairingToken});
      let body = { trigger: 'toggle_camera_enable' };
      return await this.apiPut({path, accessToken, body});
    } else {
      new ExtendableError('Room Pairing Token is required', 'MissingParameterError');
    }
  }

  //! Generic API wrappers

  /**
   * Generic GET API wrapper
   * @param {Object} param
   * @param {string} param.path API path
   * @param {string} param.accessToken (Optional) access token
   * @return {Promise<Object>} a promise that resolves the API response JSON object
   */
  async apiGet({path, accessToken}) {
    await this._chooseApiOrigin();
    let url = this[PRIVATE].apiOrigin + path;
    if (accessToken) {
      url +=  queryString({ bearer_token: accessToken });
    }
    logRequest({method: 'GET', url});
    let ret = await axios.get(url);
    logResult(ret);
    return ret.data;
  }

  /**
   * Generic POST API wrapper
   * @param {Object} param
   * @param {string} param.path API path
   * @param {string} param.accessToken (Optional) access token
   * @param {Object} param.body API dependent JSON object to be sent in HTTP message body
   * @return {Promise<Object>} a promise that resolves the API response JSON object
   */
  async apiPost({path, accessToken, body}) {
    await this._chooseApiOrigin();
    let url = this[PRIVATE].apiOrigin + path;
    if (accessToken) {
      url +=  queryString({ bearer_token: accessToken });
    }
    logRequest({method: 'POST', url, body});
    let ret = await axios.post(url, body);
    logResult(ret);
    return ret.data;
  }

  /**
   * Generic PATCH API wrapper
   * @param {Object} param
   * @param {string} param.path API path
   * @param {string} param.accessToken (Optional) access token
   * @param {Object} param.body API dependent JSON object to be sent in HTTP message body
   * @return {Promise<Object>} a promise that resolves the API response JSON object
   */
  async apiPatch({path, accessToken, body}) {
    await this._chooseApiOrigin();
    let url = this[PRIVATE].apiOrigin + path;
    if (accessToken) {
      url +=  queryString({ bearer_token: accessToken });
    }
    logRequest({method: 'PATCH', url, body});
    let ret = await axios.patch(url, body);
    logResult(ret);
    return ret.data;
  }

  /**
   * Generic PUT API wrapper
   * @param {Object} param
   * @param {string} param.path API path
   * @param {string} param.accessToken (Optional) access token
   * @param {Object} param.body API dependent JSON object to be sent in HTTP message body
   * @return {Promise<Object>} a promise that resolves the API response JSON object
   */
  async apiPut({path, accessToken, body}) {
    await this._chooseApiOrigin();
    let url = this[PRIVATE].apiOrigin + path;
    if (accessToken) {
      url +=  queryString({ bearer_token: accessToken });
    }
    logRequest({method: 'PUT', url, body});
    let ret = await axios.put(url, body);
    logResult(ret);
    return ret.data;
  }

  /**
   * Generic DELETE API wrapper
   * @param {Object} param
   * @param {string} param.path API path
   * @param {string} param.accessToken (Optional) access token
   * @return {Promise<Object>} a promise that resolves the API response JSON object
   */
  async apiDelete({path, accessToken}) {
    await this._chooseApiOrigin();
    let url = this[PRIVATE].apiOrigin + path;
    if (accessToken) {
      url +=  queryString({ bearer_token: accessToken });
    }
    logRequest({method: 'DELETE', url});
    let ret = await axios.delete(url);
    logResult(ret);
    return ret.data;
  }

  /**
   * authorize API wrapper
   * @param {Object} param
   * @param {string} param.scope scope to be authorized
   * @param {string} param.pairing_token (Optional) pairing token to skip the CP button press
   * @param {string} param.pin (Optional) session PIN when requesting 'view' or 'local_view' scope
   * @param {Array} param.features (Optional) array of features to be authorized in addition to 'view' or 'local_view' scope
   * @param {string} param.admin_name (Optional) Kaptivo admin user name for 'remote_config' scope
   * @param {string} param.admin_password (Optional) Kaptivo admin user password for 'remote_config' scope
   * @param {string} param.user_name local participant's name when requesting 'view' or 'local_view' scope
   * @return {Promise<String>} a promise that resolves the issued access token
   */
  async authorize({scope, pairing_token, pin, features, admin_name, admin_password, user_name}) {
    await this._chooseApiOrigin();

    const API_URL = this[PRIVATE].apiOrigin + '/api/v2/auth/authorize';
    const CALLBACK_URL = this[PRIVATE].apiOrigin + '/api/v2/auth/callback';
    const REDIRECT_URI = jwtDecode(this[PRIVATE].clientToken).client.redirect_uri;

    const state = 'S' + Math.random();  //! Please set an unpredictable random string;
    const params = {
      client_id: this[PRIVATE].clientToken,
      scope: scope,
      state: state,
    };
    if (pairing_token) {
      params['pairing_token'] = pairing_token;
    }
    if (pin) {
      params['pin'] = pin;
    }
    if (features && features.length) {
      params['features'] = features.join(',');
    }
    if (admin_name && admin_password) {
      params['user_pass'] = Buffer.from(admin_name + ':' + admin_password).toString('base64');
    }
    if (user_name) {
      params['user_name'] = user_name; //! view/local_view scope requires username parameter
    }

    log('******************************************************');
    log('** authorization flow start');
    log('  parameters:\n' + JSON.stringify(params, null, 2));

    let redirectCount = 0;
    let accessToken = null;
    let url = API_URL + queryString(params);
    logRequest({method: 'GET', url});

    if (typeof window === "undefined") {
      //! Node.js
      do { //! keep following 303/302 redirect responses until we find REDIRECT_URI
        try {
          log(`URL[${redirectCount}] = ${url}`);
          if (url.indexOf(CALLBACK_URL) === 0) {
            if (this[PRIVATE].callback) {
              this[PRIVATE].callback({event: 'requested', kaptivo: this, params: { scope } });
            } else {
              console.log('PUSH CONTROL PAD BUTTON, PLEASE');  //! Show this message to user when redirecting to callback URL
            }
          }
          await axios.get(url, {maxRedirects: 0});  //! we want to handle redirect by ourselves
        } catch (err) {
          if (err.response && err.response.status === 303 || err.response.status === 302) {
            url = err.response.headers.location;
            if (url.indexOf(REDIRECT_URI) === 0) {
              //! Found the URL starting with REDIRECT_URL
              let keyVals = parseAuthResult(url);

              if (keyVals['error']) {
                throw decodeURI(keyVals['error']);  //! Error is reported as a URI encoded JSON
              } else if (keyVals['access_token']) {
                if (keyVals['state'] === state) {
                  accessToken = keyVals['access_token'];  //! Received the access token
                } else {
                  throw Error('State mismatch'); //! This should never happen
                }
              }
            }
            ++redirectCount;
            if (10 < redirectCount) {
              throw Error('Too many redirects'); //! This should not happen
            }
          } else {
            throw err;
          }
        }
      } while (!accessToken)
    } else {
      //! Browser

      let el = document.getElementById('ifcontainer'); // TODO: pass this from the caller
      let frame = window.document.createElement('iframe');
      frame.width = '0px';
      frame.height = '0px';
      frame.src = url;
      frame.onload = () => {
        setTimeout(() => {
          if (isWaitingFor(state)) {
            externalReject(state, new Error('Unexpected error in authorize API call'));
          }
        }, 500);
      };

      try {
      let prom = new Promise((resolve, reject) => {
        setExternalResolver(state, {resolve, reject});
        el.appendChild(frame);
      });

      accessToken = await prom;
      } finally {
      clearExternalResolver(state);
      frame.remove();
    }
    }

    log('** authorization flow complete');
    log('******************************************************');

    return accessToken;
  }

  _setRelayApiOrigin() {
    if (this[PRIVATE].kaptivoId) {
      this[PRIVATE].apiOrigin = 'https://us.relay.kaptivo.live/devices/' + this[PRIVATE].kaptivoId;
    }
  }

  _setApiOriginFromIp() {
    if (this[PRIVATE].ssl) {
      this[PRIVATE].apiOrigin = 'https://' + this[PRIVATE].ip.replace(/\./g, '-') + '.ip.kaptivo.live';
    } else {
      this[PRIVATE].apiOrigin = 'http://' + this[PRIVATE].ip;
      if (this[PRIVATE].port && this[PRIVATE].port != 80) {
        this[PRIVATE].apiOrigin += ':' + this[PRIVATE].port;
      }
    }
  }

  //! Always call this function before making any API call to Kaptivo
  async _chooseApiOrigin() {
    if (!this[PRIVATE].apiOrigin) {
      let pingSucceed = false;

      //! try direct API origin first, when ip is given
      if (this[PRIVATE].ip) {
        this._setApiOriginFromIp();
        try {
          let pingResult = await this.ping();
          this[PRIVATE].kaptivoId = pingResult.product_id;
          pingSucceed = true;
        } catch (err) {
          console.log('No direct ip access.');
        }
      }

      if (!pingSucceed && this[PRIVATE].kaptivoId) {
        //! when ip is not given by the caller, of if it fails, try relay origin
        this._setRelayApiOrigin();
        try {
          let accessToken = await this.authorize({scope: 'discover'});
          const params = {
            bearer_token: accessToken,
          };
          let url = this[PRIVATE].apiOrigin + '/api/discovery/location' + queryString(params);
          logRequest({method: 'GET', url});
          let ret = await axios.get(url);
          logResult(ret);
          let locations = ret.data.result;
          log(locations);

          let lanLoaction = locations.find(loc => loc.type === 'lan');
          this[PRIVATE].ip = extractHostFromURL(lanLoaction.uri);
          if (this[PRIVATE].ip) {
            this._setApiOriginFromIp(); //! try direct API origin
            try {
              await this.ping();
            } catch (err) {
              this._setRelayApiOrigin(); //! if ip is not reachable, keep using relay API origin
            }
          }
        } catch (e) {
          log(e);
          log('Failed to get the private ip of the kaptivo. Keep doing tunnel access.');
        }
      }
    }
  }
}


/**
 * Kaptivo Simulation Wrapper. Use createSim function to create an instance. You can use it as NodeKaptivo instance.
 */
class NodeKaptivoSim extends NodeKaptivo {

  /**
   * @constructor
   * @param {Object} param
   * @param {string} param.simId simulation id issued by the simulation server
   * @param {string} param.kaptivoId kaptivoId This can be omitted if ip is given.
   * @param {string} param.ip (Optional) Private IP address of the Kaptivo, if it is known.
   * @param {number} param.port (Optional) Port number to be used. Mainly for simulator.
   * @param {string} param.clientToken (Optional) can be omitted if it is globally set via setGlobalClientToken function.
   * @param {function} param.callback (Optional) event receiver callback function
   */  constructor({ simId, kaptivoId, ip, port, clientToken, callback }) {
    super({ kaptivoId, ip, port, ssl:false, clientToken, callback });
    if (simId) {
      this[PRIVATE].simId = simId;
    } else {
      new ExtendableError('simId must be provided', 'MissingParameterError');
    }
  }

  //! Attribute getters
  /**
   * Simulation id getter.
   * Used when creating a clone of NodeKaptivoSim instance by manually calling its ctor.
   * @return {string} simulation id of the simulation wrapped by the NodeKaptivoSim instance
   */
  getSimId() {
    return this[PRIVATE].simId ? (this[PRIVATE].simId + '') : '';
  }

  /**
   * A function to destroy the NodeKaptivo instance.
   * Mainly to allow NodeKaptivoSim to destroy the simulation instance.
   * @return {Promise<void>} A promise that gets resolved when the destruction completes.
   */
  async destroy() {
    if (this[PRIVATE].simId) {
      let id = this[PRIVATE].simId;
      this[PRIVATE].simId = null;
      await axios.delete(API_SYM(id));
    }
    await super.destroy();
  }

  /**
   * get the control pad status
   * Unlike NodeKaptivoS, NodeKaptivoSim does not require room pairing token
   * @return {Promise<Object>} a promise that resolves an object containing control pad status
   */
  async getControlPadStatus() {
    if (this[PRIVATE].simId) {
      let ret = await axios.get(API_CONTROLPAD(this[PRIVATE].simId));
      return ret.data;
    } else {
      new ExtendableError('Simulation has been already destroyed', 'AlreadyDestroyedError');
    }
  }

  /**
   * push the control pad button programatically
   * Unlike NodeKaptivoS, NodeKaptivoSim does not require room pairing token
   * @return {Promise<*>} a promise that gets resolved then the button is programatically pushed
   */
  async pushControlPadButton() {
    if (this[PRIVATE].simId) {
      await axios.put(API_CONTROLPAD_INPUT(this[PRIVATE].simId));
    } else {
      new ExtendableError('Simulation has been already destroyed', 'AlreadyDestroyedError');
    }
  }
}

function wait(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * Push the control pad button of the specified Kaptivo after waitings its status becomes 'requested'
 * @param {Object} param
 * @param {NodeKaptivo} param.kaptivo the target Kaptivo
 * @param {number} param.timeout (Optional) the max time to wait for the control pad to become 'requested' in msec. Default: 30000
 * @param {number} param.interval (Optional) control pad button status polling interval in msec. Default: 500
 * @param {number} param.pushInterval (Optional) wait before pushing the control pad button in msec.
 * (Kaptivo intentionally ignores the operation if the button is pushed too soon after its status becomes 'requested'.) Default: 3000
 * @return {Promise<void>} a promise that resolves whether or not the button is pressed.
 */
async function waitAndPushControlPadButton({kaptivo, timeout=30000, interval=500, pushInterval=3000}) {
  let pushed = false;
  let timeOutTime = Date.now() + timeout;
  while (!pushed && Date.now() < timeOutTime) {
    let buttonState = await kaptivo.getControlPadStatus();
    log('waitAndPushControlPadButton control pad button status polling: ' + buttonState.share_state);
    if (buttonState.share_state === 'requested') {
      await wait(pushInterval);  //! Kaptivo intentionally ignores button push, if it is done too quickly after share state change
      await kaptivo.pushControlPadButton();
      log('waitAndPushControlPadButton pushes control pad button');
      pushed = true;
    } else {
      await wait(interval);
    }
  }
  return pushed;
}

/**
 * Set the client token to access Kaptivo APIs
 * @param {string} clientToken clientToken JWT issued by Kaptivo engineering team
 */
function setGlobalClientToken(clientToken) {
  g_clientToken = clientToken;
}

/**
 * Set the simulation server's origin when using Kaptivo simulation
 * @param {string} simServer the simulation server's origin, e.g. 'http://lbo4.cloud.lightblueoptics.com:5002'
 */
function setSimServer(simServer) {
  g_simServer = simServer;
}

/**
 * Enable/Disable verbose logging
 * @param {boolean} verbose whether or not to put detailed log messages on console
 */
function setVerbose(verbose) {
  g_verbose = verbose;
}

/**
 * Create a Kaptivo simulation instance and a NodeKaptivoSim wrapper around it
 * @param {Object} param
 * @param {string} param.brand (Optional) brand of the simulation. kaptivo|crestron|hp  Default: kaptivo
 * @param {string} param.model Virtual hardware model of the simulation. (e.g. 'KE200')
 * @param {string} param.type (Optional) Firmware type. office|enterprise  Default: enterprise
 * @param {string} param.version Firmware version to be run on the simulation. (e.g. '2.0.0')
 * @param {string} param.tunnel (Optional) 'ngrok' to use ngrok or '' not to use any tunnel. Default: ''
 * @param {string} param.test (Optional) test script name to be run on the simulation.
 * writeAndErase|blankWhiteboard|curve|ciecles Default: writeAndErase
 * @param {string} param.clientToken (Optional) can be omitted if it is globally set via setGlobalClientToken function.
 * @param {function} param.callback (Optional) event receiver callback function
 * @return {Promise<NodeKaptivoSim>} a promise to resolve a NodeKaptivoSim instnace
 */
async function createSim({brand='kaptivo', model, type='enterprise', version, tunnel, test, clientToken, callback}) {
  let kap = null;
  if (g_simServer) {
    let sim = (await axios.post(API_SYMS(), {brand, model, type, version, tunnel, test})).data;
    if (sim) {
      kap = new NodeKaptivoSim({
        simId: sim.id,
        kaptivoId: (tunnel ? sim.product_id : undefined),
        ip: extractHostFromURL(g_simServer),
        port: sim.port,
        clientToken,
        callback
      });
    }
  }
  return kap;
}

function init(cb) {
  const KAPTIVO_LIB_MESSAGE = '__Kaptivo__';
  if (window == window.parent) {
    //! Main window side preparation for authorize API flow callback
    window.onmessage = function(e){
      if (e && e.data && e.data.startsWith && e.data.startsWith(KAPTIVO_LIB_MESSAGE)) {
        let params = {};
        e.data.split('#/')[1].split('&').forEach(keyValue => {
          let tokens = keyValue.split('=');
          params[tokens[0]] = tokens[1];
        });
        if (params.state) {
          if (params.access_token) {
            externalResolve(params.state, params.access_token);
          } else if (params.error) {
            let parsedError = JSON.parse(decodeURIComponent(params.error));
            externalReject(params.state, parsedError || params.error);
          }
          clearExternalResolver(params.state);
        }
      }
    };
    cb();
  } else {
    //! Handle the callback from authorize API flow
    window.parent.postMessage(KAPTIVO_LIB_MESSAGE + window.location.hash, window.location.origin);
  }
}

//////////////////////////////////////////////////////////////////////////
// Exports

export {
  init,
  setGlobalClientToken,
  setSimServer,
  setVerbose,
  createSim,
  NodeKaptivo,
  NodeKaptivoSim,
  waitAndPushControlPadButton,
}
