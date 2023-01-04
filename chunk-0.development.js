(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ "./node_modules/@rdfjs/parser-jsonld/index.js":
/*!****************************************************!*\
  !*** ./node_modules/@rdfjs/parser-jsonld/index.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const Sink = __webpack_require__(/*! @rdfjs/sink */ "./node_modules/@rdfjs/sink/index.js");
const ParserStream = __webpack_require__(/*! ./lib/ParserStream */ "./node_modules/@rdfjs/parser-jsonld/lib/ParserStream.js");
class Parser extends Sink {
  constructor(options) {
    super(ParserStream, options);
  }
}
module.exports = Parser;

/***/ }),

/***/ "./node_modules/@rdfjs/parser-jsonld/lib/ParserStream.js":
/*!***************************************************************!*\
  !*** ./node_modules/@rdfjs/parser-jsonld/lib/ParserStream.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const rdf = __webpack_require__(/*! @rdfjs/data-model */ "./node_modules/@rdfjs/data-model/index.js");
const {
  JsonLdParser
} = __webpack_require__(/*! jsonld-streaming-parser */ "./node_modules/jsonld-streaming-parser/index.js");
const {
  Transform
} = __webpack_require__(/*! readable-stream */ "./node_modules/readable-stream/readable-browser.js");
const relativeIriProtocol = 'null:';
function termCleanup(factory) {
  return term => {
    if (term.termType !== 'NamedNode') {
      return null;
    }
    if (!term.value.startsWith(relativeIriProtocol)) {
      return null;
    }

    // remove dummy protocol workaround for relative IRIs
    return factory.namedNode(term.value.slice(relativeIriProtocol.length));
  };
}
function quadCleanup(factory) {
  const cleanup = termCleanup(factory);
  return quad => {
    const subject = cleanup(quad.subject);
    const predicate = cleanup(quad.predicate);
    const object = cleanup(quad.object);
    const graph = cleanup(quad.graph);
    if (subject || predicate || object || graph) {
      return factory.quad(subject || quad.subject, predicate || quad.predicate, object || quad.object, graph || quad.graph);
    }
    return quad;
  };
}
class ParserStream {
  constructor(input, {
    baseIRI = relativeIriProtocol,
    context = null,
    factory = rdf
  } = {}) {
    const parser = new JsonLdParser({
      baseIRI,
      context,
      dataFactory: factory,
      streamingProfile: false
    });
    input.pipe(parser);
    const cleanup = quadCleanup(factory);
    const transform = new Transform({
      objectMode: true,
      transform: (quad, encoding, callback) => {
        callback(null, cleanup(quad));
      }
    });
    parser.on('context', context => {
      Object.entries(context).forEach(([prefix, iri]) => {
        transform.emit('prefix', prefix, factory.namedNode(iri));
      });
    });
    parser.on('error', err => transform.destroy(err));
    parser.pipe(transform);
    return transform;
  }
}
module.exports = ParserStream;

/***/ }),

/***/ "./node_modules/canonicalize/lib/canonicalize.js":
/*!*******************************************************!*\
  !*** ./node_modules/canonicalize/lib/canonicalize.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint esversion: 6 */
/* jslint node: true */


module.exports = function serialize(object) {
  if (object === null || typeof object !== 'object' || object.toJSON != null) {
    return JSON.stringify(object);
  }
  if (Array.isArray(object)) {
    return '[' + object.reduce((t, cv, ci) => {
      const comma = ci === 0 ? '' : ',';
      const value = cv === undefined || typeof cv === 'symbol' ? null : cv;
      return t + comma + serialize(value);
    }, '') + ']';
  }
  return '{' + Object.keys(object).sort().reduce((t, cv, ci) => {
    if (object[cv] === undefined || typeof object[cv] === 'symbol') {
      return t;
    }
    const comma = t.length === 0 ? '' : ',';
    return t + comma + serialize(cv) + ':' + serialize(object[cv]);
  }, '') + '}';
};

/***/ }),

/***/ "./node_modules/cross-fetch/dist/browser-polyfill.js":
/*!***********************************************************!*\
  !*** ./node_modules/cross-fetch/dist/browser-polyfill.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function (self) {
  var irrelevant = function (exports) {
    var support = {
      searchParams: 'URLSearchParams' in self,
      iterable: 'Symbol' in self && 'iterator' in Symbol,
      blob: 'FileReader' in self && 'Blob' in self && function () {
        try {
          new Blob();
          return true;
        } catch (e) {
          return false;
        }
      }(),
      formData: 'FormData' in self,
      arrayBuffer: 'ArrayBuffer' in self
    };
    function isDataView(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj);
    }
    if (support.arrayBuffer) {
      var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];
      var isArrayBufferView = ArrayBuffer.isView || function (obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
      };
    }
    function normalizeName(name) {
      if (typeof name !== 'string') {
        name = String(name);
      }
      if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
        throw new TypeError('Invalid character in header field name');
      }
      return name.toLowerCase();
    }
    function normalizeValue(value) {
      if (typeof value !== 'string') {
        value = String(value);
      }
      return value;
    }

    // Build a destructive iterator for the value list
    function iteratorFor(items) {
      var iterator = {
        next: function () {
          var value = items.shift();
          return {
            done: value === undefined,
            value: value
          };
        }
      };
      if (support.iterable) {
        iterator[Symbol.iterator] = function () {
          return iterator;
        };
      }
      return iterator;
    }
    function Headers(headers) {
      this.map = {};
      if (headers instanceof Headers) {
        headers.forEach(function (value, name) {
          this.append(name, value);
        }, this);
      } else if (Array.isArray(headers)) {
        headers.forEach(function (header) {
          this.append(header[0], header[1]);
        }, this);
      } else if (headers) {
        Object.getOwnPropertyNames(headers).forEach(function (name) {
          this.append(name, headers[name]);
        }, this);
      }
    }
    Headers.prototype.append = function (name, value) {
      name = normalizeName(name);
      value = normalizeValue(value);
      var oldValue = this.map[name];
      this.map[name] = oldValue ? oldValue + ', ' + value : value;
    };
    Headers.prototype['delete'] = function (name) {
      delete this.map[normalizeName(name)];
    };
    Headers.prototype.get = function (name) {
      name = normalizeName(name);
      return this.has(name) ? this.map[name] : null;
    };
    Headers.prototype.has = function (name) {
      return this.map.hasOwnProperty(normalizeName(name));
    };
    Headers.prototype.set = function (name, value) {
      this.map[normalizeName(name)] = normalizeValue(value);
    };
    Headers.prototype.forEach = function (callback, thisArg) {
      for (var name in this.map) {
        if (this.map.hasOwnProperty(name)) {
          callback.call(thisArg, this.map[name], name, this);
        }
      }
    };
    Headers.prototype.keys = function () {
      var items = [];
      this.forEach(function (value, name) {
        items.push(name);
      });
      return iteratorFor(items);
    };
    Headers.prototype.values = function () {
      var items = [];
      this.forEach(function (value) {
        items.push(value);
      });
      return iteratorFor(items);
    };
    Headers.prototype.entries = function () {
      var items = [];
      this.forEach(function (value, name) {
        items.push([name, value]);
      });
      return iteratorFor(items);
    };
    if (support.iterable) {
      Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
    }
    function consumed(body) {
      if (body.bodyUsed) {
        return Promise.reject(new TypeError('Already read'));
      }
      body.bodyUsed = true;
    }
    function fileReaderReady(reader) {
      return new Promise(function (resolve, reject) {
        reader.onload = function () {
          resolve(reader.result);
        };
        reader.onerror = function () {
          reject(reader.error);
        };
      });
    }
    function readBlobAsArrayBuffer(blob) {
      var reader = new FileReader();
      var promise = fileReaderReady(reader);
      reader.readAsArrayBuffer(blob);
      return promise;
    }
    function readBlobAsText(blob) {
      var reader = new FileReader();
      var promise = fileReaderReady(reader);
      reader.readAsText(blob);
      return promise;
    }
    function readArrayBufferAsText(buf) {
      var view = new Uint8Array(buf);
      var chars = new Array(view.length);
      for (var i = 0; i < view.length; i++) {
        chars[i] = String.fromCharCode(view[i]);
      }
      return chars.join('');
    }
    function bufferClone(buf) {
      if (buf.slice) {
        return buf.slice(0);
      } else {
        var view = new Uint8Array(buf.byteLength);
        view.set(new Uint8Array(buf));
        return view.buffer;
      }
    }
    function Body() {
      this.bodyUsed = false;
      this._initBody = function (body) {
        this._bodyInit = body;
        if (!body) {
          this._bodyText = '';
        } else if (typeof body === 'string') {
          this._bodyText = body;
        } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
          this._bodyBlob = body;
        } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
          this._bodyFormData = body;
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this._bodyText = body.toString();
        } else if (support.arrayBuffer && support.blob && isDataView(body)) {
          this._bodyArrayBuffer = bufferClone(body.buffer);
          // IE 10-11 can't handle a DataView body.
          this._bodyInit = new Blob([this._bodyArrayBuffer]);
        } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
          this._bodyArrayBuffer = bufferClone(body);
        } else {
          this._bodyText = body = Object.prototype.toString.call(body);
        }
        if (!this.headers.get('content-type')) {
          if (typeof body === 'string') {
            this.headers.set('content-type', 'text/plain;charset=UTF-8');
          } else if (this._bodyBlob && this._bodyBlob.type) {
            this.headers.set('content-type', this._bodyBlob.type);
          } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
            this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
          }
        }
      };
      if (support.blob) {
        this.blob = function () {
          var rejected = consumed(this);
          if (rejected) {
            return rejected;
          }
          if (this._bodyBlob) {
            return Promise.resolve(this._bodyBlob);
          } else if (this._bodyArrayBuffer) {
            return Promise.resolve(new Blob([this._bodyArrayBuffer]));
          } else if (this._bodyFormData) {
            throw new Error('could not read FormData body as blob');
          } else {
            return Promise.resolve(new Blob([this._bodyText]));
          }
        };
        this.arrayBuffer = function () {
          if (this._bodyArrayBuffer) {
            return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
          } else {
            return this.blob().then(readBlobAsArrayBuffer);
          }
        };
      }
      this.text = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }
        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob);
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text');
        } else {
          return Promise.resolve(this._bodyText);
        }
      };
      if (support.formData) {
        this.formData = function () {
          return this.text().then(decode);
        };
      }
      this.json = function () {
        return this.text().then(JSON.parse);
      };
      return this;
    }

    // HTTP methods whose capitalization should be normalized
    var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];
    function normalizeMethod(method) {
      var upcased = method.toUpperCase();
      return methods.indexOf(upcased) > -1 ? upcased : method;
    }
    function Request(input, options) {
      options = options || {};
      var body = options.body;
      if (input instanceof Request) {
        if (input.bodyUsed) {
          throw new TypeError('Already read');
        }
        this.url = input.url;
        this.credentials = input.credentials;
        if (!options.headers) {
          this.headers = new Headers(input.headers);
        }
        this.method = input.method;
        this.mode = input.mode;
        this.signal = input.signal;
        if (!body && input._bodyInit != null) {
          body = input._bodyInit;
          input.bodyUsed = true;
        }
      } else {
        this.url = String(input);
      }
      this.credentials = options.credentials || this.credentials || 'same-origin';
      if (options.headers || !this.headers) {
        this.headers = new Headers(options.headers);
      }
      this.method = normalizeMethod(options.method || this.method || 'GET');
      this.mode = options.mode || this.mode || null;
      this.signal = options.signal || this.signal;
      this.referrer = null;
      if ((this.method === 'GET' || this.method === 'HEAD') && body) {
        throw new TypeError('Body not allowed for GET or HEAD requests');
      }
      this._initBody(body);
    }
    Request.prototype.clone = function () {
      return new Request(this, {
        body: this._bodyInit
      });
    };
    function decode(body) {
      var form = new FormData();
      body.trim().split('&').forEach(function (bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
      return form;
    }
    function parseHeaders(rawHeaders) {
      var headers = new Headers();
      // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
      // https://tools.ietf.org/html/rfc7230#section-3.2
      var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
      preProcessedHeaders.split(/\r?\n/).forEach(function (line) {
        var parts = line.split(':');
        var key = parts.shift().trim();
        if (key) {
          var value = parts.join(':').trim();
          headers.append(key, value);
        }
      });
      return headers;
    }
    Body.call(Request.prototype);
    function Response(bodyInit, options) {
      if (!options) {
        options = {};
      }
      this.type = 'default';
      this.status = options.status === undefined ? 200 : options.status;
      this.ok = this.status >= 200 && this.status < 300;
      this.statusText = 'statusText' in options ? options.statusText : 'OK';
      this.headers = new Headers(options.headers);
      this.url = options.url || '';
      this._initBody(bodyInit);
    }
    Body.call(Response.prototype);
    Response.prototype.clone = function () {
      return new Response(this._bodyInit, {
        status: this.status,
        statusText: this.statusText,
        headers: new Headers(this.headers),
        url: this.url
      });
    };
    Response.error = function () {
      var response = new Response(null, {
        status: 0,
        statusText: ''
      });
      response.type = 'error';
      return response;
    };
    var redirectStatuses = [301, 302, 303, 307, 308];
    Response.redirect = function (url, status) {
      if (redirectStatuses.indexOf(status) === -1) {
        throw new RangeError('Invalid status code');
      }
      return new Response(null, {
        status: status,
        headers: {
          location: url
        }
      });
    };
    exports.DOMException = self.DOMException;
    try {
      new exports.DOMException();
    } catch (err) {
      exports.DOMException = function (message, name) {
        this.message = message;
        this.name = name;
        var error = Error(message);
        this.stack = error.stack;
      };
      exports.DOMException.prototype = Object.create(Error.prototype);
      exports.DOMException.prototype.constructor = exports.DOMException;
    }
    function fetch(input, init) {
      return new Promise(function (resolve, reject) {
        var request = new Request(input, init);
        if (request.signal && request.signal.aborted) {
          return reject(new exports.DOMException('Aborted', 'AbortError'));
        }
        var xhr = new XMLHttpRequest();
        function abortXhr() {
          xhr.abort();
        }
        xhr.onload = function () {
          var options = {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: parseHeaders(xhr.getAllResponseHeaders() || '')
          };
          options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
          var body = 'response' in xhr ? xhr.response : xhr.responseText;
          resolve(new Response(body, options));
        };
        xhr.onerror = function () {
          reject(new TypeError('Network request failed'));
        };
        xhr.ontimeout = function () {
          reject(new TypeError('Network request failed'));
        };
        xhr.onabort = function () {
          reject(new exports.DOMException('Aborted', 'AbortError'));
        };
        xhr.open(request.method, request.url, true);
        if (request.credentials === 'include') {
          xhr.withCredentials = true;
        } else if (request.credentials === 'omit') {
          xhr.withCredentials = false;
        }
        if ('responseType' in xhr && support.blob) {
          xhr.responseType = 'blob';
        }
        request.headers.forEach(function (value, name) {
          xhr.setRequestHeader(name, value);
        });
        if (request.signal) {
          request.signal.addEventListener('abort', abortXhr);
          xhr.onreadystatechange = function () {
            // DONE (success or failure)
            if (xhr.readyState === 4) {
              request.signal.removeEventListener('abort', abortXhr);
            }
          };
        }
        xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
      });
    }
    fetch.polyfill = true;
    if (!self.fetch) {
      self.fetch = fetch;
      self.Headers = Headers;
      self.Request = Request;
      self.Response = Response;
    }
    exports.Headers = Headers;
    exports.Request = Request;
    exports.Response = Response;
    exports.fetch = fetch;
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    return exports;
  }({});
})(typeof self !== 'undefined' ? self : this);

/***/ }),

/***/ "./node_modules/http-link-header/lib/link.js":
/*!***************************************************!*\
  !*** ./node_modules/http-link-header/lib/link.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Buffer) {

var COMPATIBLE_ENCODING_PATTERN = /^utf-?8|ascii|utf-?16-?le|ucs-?2|base-?64|latin-?1$/i;
var WS_TRIM_PATTERN = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
var WS_CHAR_PATTERN = /\s|\uFEFF|\xA0/;
var WS_FOLD_PATTERN = /\r?\n[\x20\x09]+/g;
var DELIMITER_PATTERN = /[;,"]/;
var WS_DELIMITER_PATTERN = /[;,"]|\s/;

/**
 * Token character pattern
 * @type {RegExp}
 * @see https://tools.ietf.org/html/rfc7230#section-3.2.6
 */
var TOKEN_PATTERN = /^[!#$%&'*+\-\.^_`|~\da-zA-Z]+$/;
var STATE = {
  IDLE: 1 << 0,
  URI: 1 << 1,
  ATTR: 1 << 2
};
function trim(value) {
  return value.replace(WS_TRIM_PATTERN, '');
}
function hasWhitespace(value) {
  return WS_CHAR_PATTERN.test(value);
}
function skipWhitespace(value, offset) {
  while (hasWhitespace(value[offset])) {
    offset++;
  }
  return offset;
}
function needsQuotes(value) {
  return WS_DELIMITER_PATTERN.test(value) || !TOKEN_PATTERN.test(value);
}

/**
 * Shallow compares two objects to check if their properties match.
 * @param {object} object1 First object to compare.
 * @param {object} object2 Second object to compare.
 * @returns {boolean} Do the objects have matching properties.
 */
function shallowCompareObjects(object1, object2) {
  return Object.keys(object1).length === Object.keys(object2).length && Object.keys(object1).every(key => key in object2 && object1[key] === object2[key]);
}
class Link {
  /**
   * Link
   * @constructor
   * @param {String} [value]
   * @returns {Link}
   */
  constructor(value) {
    /** @type {Array} URI references */
    this.refs = [];
    if (value) {
      this.parse(value);
    }
  }

  /**
   * Get refs with given relation type
   * @param {String} value
   * @returns {Array<Object>}
   */
  rel(value) {
    var links = [];
    var type = value.toLowerCase();
    for (var i = 0; i < this.refs.length; i++) {
      if (this.refs[i].rel.toLowerCase() === type) {
        links.push(this.refs[i]);
      }
    }
    return links;
  }

  /**
   * Get refs where given attribute has a given value
   * @param {String} attr
   * @param {String} value
   * @returns {Array<Object>}
   */
  get(attr, value) {
    attr = attr.toLowerCase();
    var links = [];
    for (var i = 0; i < this.refs.length; i++) {
      if (this.refs[i][attr] === value) {
        links.push(this.refs[i]);
      }
    }
    return links;
  }

  /** Sets a reference. */
  set(link) {
    this.refs.push(link);
    return this;
  }

  /**
   * Sets a reference if a reference with similar properties isn’t already set.
   */
  setUnique(link) {
    if (!this.refs.some(ref => shallowCompareObjects(ref, link))) {
      this.refs.push(link);
    }
    return this;
  }
  has(attr, value) {
    attr = attr.toLowerCase();
    for (var i = 0; i < this.refs.length; i++) {
      if (this.refs[i][attr] === value) {
        return true;
      }
    }
    return false;
  }
  parse(value, offset) {
    offset = offset || 0;
    value = offset ? value.slice(offset) : value;

    // Trim & unfold folded lines
    value = trim(value).replace(WS_FOLD_PATTERN, '');
    var state = STATE.IDLE;
    var length = value.length;
    var offset = 0;
    var ref = null;
    while (offset < length) {
      if (state === STATE.IDLE) {
        if (hasWhitespace(value[offset])) {
          offset++;
          continue;
        } else if (value[offset] === '<') {
          if (ref != null) {
            ref.rel != null ? this.refs.push(...Link.expandRelations(ref)) : this.refs.push(ref);
          }
          var end = value.indexOf('>', offset);
          if (end === -1) throw new Error('Expected end of URI delimiter at offset ' + offset);
          ref = {
            uri: value.slice(offset + 1, end)
          };
          // this.refs.push( ref )
          offset = end;
          state = STATE.URI;
        } else {
          throw new Error('Unexpected character "' + value[offset] + '" at offset ' + offset);
        }
        offset++;
      } else if (state === STATE.URI) {
        if (hasWhitespace(value[offset])) {
          offset++;
          continue;
        } else if (value[offset] === ';') {
          state = STATE.ATTR;
          offset++;
        } else if (value[offset] === ',') {
          state = STATE.IDLE;
          offset++;
        } else {
          throw new Error('Unexpected character "' + value[offset] + '" at offset ' + offset);
        }
      } else if (state === STATE.ATTR) {
        if (value[offset] === ';' || hasWhitespace(value[offset])) {
          offset++;
          continue;
        }
        var end = value.indexOf('=', offset);
        if (end === -1) throw new Error('Expected attribute delimiter at offset ' + offset);
        var attr = trim(value.slice(offset, end)).toLowerCase();
        var attrValue = '';
        offset = end + 1;
        offset = skipWhitespace(value, offset);
        if (value[offset] === '"') {
          offset++;
          while (offset < length) {
            if (value[offset] === '"') {
              offset++;
              break;
            }
            if (value[offset] === '\\') {
              offset++;
            }
            attrValue += value[offset];
            offset++;
          }
        } else {
          var end = offset + 1;
          while (!DELIMITER_PATTERN.test(value[end]) && end < length) {
            end++;
          }
          attrValue = value.slice(offset, end);
          offset = end;
        }
        if (ref[attr] && Link.isSingleOccurenceAttr(attr)) {
          // Ignore multiples of attributes which may only appear once
        } else if (attr[attr.length - 1] === '*') {
          ref[attr] = Link.parseExtendedValue(attrValue);
        } else {
          attrValue = attr === 'type' ? attrValue.toLowerCase() : attrValue;
          if (ref[attr] != null) {
            if (Array.isArray(ref[attr])) {
              ref[attr].push(attrValue);
            } else {
              ref[attr] = [ref[attr], attrValue];
            }
          } else {
            ref[attr] = attrValue;
          }
        }
        switch (value[offset]) {
          case ',':
            state = STATE.IDLE;
            break;
          case ';':
            state = STATE.ATTR;
            break;
        }
        offset++;
      } else {
        throw new Error('Unknown parser state "' + state + '"');
      }
    }
    if (ref != null) {
      ref.rel != null ? this.refs.push(...Link.expandRelations(ref)) : this.refs.push(ref);
    }
    ref = null;
    return this;
  }
  toString() {
    var refs = [];
    var link = '';
    var ref = null;
    for (var i = 0; i < this.refs.length; i++) {
      ref = this.refs[i];
      link = Object.keys(this.refs[i]).reduce(function (link, attr) {
        if (attr === 'uri') return link;
        return link + '; ' + Link.formatAttribute(attr, ref[attr]);
      }, '<' + ref.uri + '>');
      refs.push(link);
    }
    return refs.join(', ');
  }
}

/**
 * Determines whether an encoding can be
 * natively handled with a `Buffer`
 * @param {String} value
 * @returns {Boolean}
 */
Link.isCompatibleEncoding = function (value) {
  return COMPATIBLE_ENCODING_PATTERN.test(value);
};
Link.parse = function (value, offset) {
  return new Link().parse(value, offset);
};
Link.isSingleOccurenceAttr = function (attr) {
  return attr === 'rel' || attr === 'type' || attr === 'media' || attr === 'title' || attr === 'title*';
};
Link.isTokenAttr = function (attr) {
  return attr === 'rel' || attr === 'type' || attr === 'anchor';
};
Link.escapeQuotes = function (value) {
  return value.replace(/"/g, '\\"');
};
Link.expandRelations = function (ref) {
  var rels = ref.rel.split(' ');
  return rels.map(function (rel) {
    var value = Object.assign({}, ref);
    value.rel = rel;
    return value;
  });
};

/**
 * Parses an extended value and attempts to decode it
 * @internal
 * @param {String} value
 * @return {Object}
 */
Link.parseExtendedValue = function (value) {
  var parts = /([^']+)?(?:'([^']*)')?(.+)/.exec(value);
  return {
    language: parts[2].toLowerCase(),
    encoding: Link.isCompatibleEncoding(parts[1]) ? null : parts[1].toLowerCase(),
    value: Link.isCompatibleEncoding(parts[1]) ? decodeURIComponent(parts[3]) : parts[3]
  };
};

/**
 * Format a given extended attribute and it's value
 * @param {String} attr
 * @param {Object} data
 * @return {String}
 */
Link.formatExtendedAttribute = function (attr, data) {
  var encoding = (data.encoding || 'utf-8').toUpperCase();
  var language = data.language || 'en';
  var encodedValue = '';
  if (Buffer.isBuffer(data.value) && Link.isCompatibleEncoding(encoding)) {
    encodedValue = data.value.toString(encoding);
  } else if (Buffer.isBuffer(data.value)) {
    encodedValue = data.value.toString('hex').replace(/[0-9a-f]{2}/gi, '%$1');
  } else {
    encodedValue = encodeURIComponent(data.value);
  }
  return attr + '=' + encoding + '\'' + language + '\'' + encodedValue;
};

/**
 * Format a given attribute and it's value
 * @param {String} attr
 * @param {String|Object} value
 * @return {String}
 */
Link.formatAttribute = function (attr, value) {
  if (Array.isArray(value)) {
    return value.map(item => {
      return Link.formatAttribute(attr, item);
    }).join('; ');
  }
  if (attr[attr.length - 1] === '*' || typeof value !== 'string') {
    return Link.formatExtendedAttribute(attr, value);
  }
  if (Link.isTokenAttr(attr)) {
    value = needsQuotes(value) ? '"' + Link.escapeQuotes(value) + '"' : Link.escapeQuotes(value);
  } else if (needsQuotes(value)) {
    value = encodeURIComponent(value);
    // We don't need to escape <SP> <,> <;> within quotes
    value = value.replace(/%20/g, ' ').replace(/%2C/g, ',').replace(/%3B/g, ';');
    value = '"' + value + '"';
  }
  return attr + '=' + value;
};
module.exports = Link;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../buffer/index.js */ "./node_modules/buffer/index.js").Buffer))

/***/ }),

/***/ "./node_modules/jsonld-context-parser/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/jsonld-context-parser/index.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __exportStar = this && this.__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
__exportStar(__webpack_require__(/*! ./lib/ContextParser */ "./node_modules/jsonld-context-parser/lib/ContextParser.js"), exports);
__exportStar(__webpack_require__(/*! ./lib/ErrorCoded */ "./node_modules/jsonld-context-parser/lib/ErrorCoded.js"), exports);
__exportStar(__webpack_require__(/*! ./lib/FetchDocumentLoader */ "./node_modules/jsonld-context-parser/lib/FetchDocumentLoader.js"), exports);
__exportStar(__webpack_require__(/*! ./lib/IDocumentLoader */ "./node_modules/jsonld-context-parser/lib/IDocumentLoader.js"), exports);
__exportStar(__webpack_require__(/*! ./lib/JsonLdContext */ "./node_modules/jsonld-context-parser/lib/JsonLdContext.js"), exports);
__exportStar(__webpack_require__(/*! ./lib/JsonLdContextNormalized */ "./node_modules/jsonld-context-parser/lib/JsonLdContextNormalized.js"), exports);
__exportStar(__webpack_require__(/*! ./lib/Util */ "./node_modules/jsonld-context-parser/lib/Util.js"), exports);

/***/ }),

/***/ "./node_modules/jsonld-context-parser/lib/ContextParser.js":
/*!*****************************************************************!*\
  !*** ./node_modules/jsonld-context-parser/lib/ContextParser.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultExpandOptions = exports.ContextParser = void 0;
__webpack_require__(/*! cross-fetch/polyfill */ "./node_modules/cross-fetch/dist/browser-polyfill.js");
const relative_to_absolute_iri_1 = __webpack_require__(/*! relative-to-absolute-iri */ "./node_modules/relative-to-absolute-iri/index.js");
const ErrorCoded_1 = __webpack_require__(/*! ./ErrorCoded */ "./node_modules/jsonld-context-parser/lib/ErrorCoded.js");
const FetchDocumentLoader_1 = __webpack_require__(/*! ./FetchDocumentLoader */ "./node_modules/jsonld-context-parser/lib/FetchDocumentLoader.js");
const JsonLdContextNormalized_1 = __webpack_require__(/*! ./JsonLdContextNormalized */ "./node_modules/jsonld-context-parser/lib/JsonLdContextNormalized.js");
const Util_1 = __webpack_require__(/*! ./Util */ "./node_modules/jsonld-context-parser/lib/Util.js");
// tslint:disable-next-line:no-var-requires
const canonicalizeJson = __webpack_require__(/*! canonicalize */ "./node_modules/canonicalize/lib/canonicalize.js");
/**
 * Parses JSON-LD contexts.
 */
class ContextParser {
  constructor(options) {
    options = options || {};
    this.documentLoader = options.documentLoader || new FetchDocumentLoader_1.FetchDocumentLoader();
    this.documentCache = {};
    this.validateContext = !options.skipValidation;
    this.expandContentTypeToBase = !!options.expandContentTypeToBase;
    this.remoteContextsDepthLimit = options.remoteContextsDepthLimit || 32;
    this.redirectSchemaOrgHttps = 'redirectSchemaOrgHttps' in options ? !!options.redirectSchemaOrgHttps : true;
  }
  /**
   * Validate the given @language value.
   * An error will be thrown if it is invalid.
   * @param value An @language value.
   * @param {boolean} strictRange If the string value should be strictly checked against a regex.
   * @param {string} errorCode The error code to emit on errors.
   * @return {boolean} If validation passed.
   *                   Can only be false if strictRange is false and the string value did not pass the regex.
   */
  static validateLanguage(value, strictRange, errorCode) {
    if (typeof value !== 'string') {
      throw new ErrorCoded_1.ErrorCoded(`The value of an '@language' must be a string, got '${JSON.stringify(value)}'`, errorCode);
    }
    if (!Util_1.Util.REGEX_LANGUAGE_TAG.test(value)) {
      if (strictRange) {
        throw new ErrorCoded_1.ErrorCoded(`The value of an '@language' must be a valid language tag, got '${JSON.stringify(value)}'`, errorCode);
      } else {
        return false;
      }
    }
    return true;
  }
  /**
   * Validate the given @direction value.
   * An error will be thrown if it is invalid.
   * @param value An @direction value.
   * @param {boolean} strictValues If the string value should be strictly checked against a regex.
   * @return {boolean} If validation passed.
   *                   Can only be false if strictRange is false and the string value did not pass the regex.
   */
  static validateDirection(value, strictValues) {
    if (typeof value !== 'string') {
      throw new ErrorCoded_1.ErrorCoded(`The value of an '@direction' must be a string, got '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_BASE_DIRECTION);
    }
    if (!Util_1.Util.REGEX_DIRECTION_TAG.test(value)) {
      if (strictValues) {
        throw new ErrorCoded_1.ErrorCoded(`The value of an '@direction' must be 'ltr' or 'rtl', got '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_BASE_DIRECTION);
      } else {
        return false;
      }
    }
    return true;
  }
  /**
   * Add an @id term for all @reverse terms.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   * @return {IJsonLdContextNormalizedRaw} The mutated input context.
   */
  idifyReverseTerms(context) {
    for (const key of Object.keys(context)) {
      const value = context[key];
      if (value && typeof value === 'object') {
        if (value['@reverse'] && !value['@id']) {
          if (typeof value['@reverse'] !== 'string' || Util_1.Util.isValidKeyword(value['@reverse'])) {
            throw new ErrorCoded_1.ErrorCoded(`Invalid @reverse value, must be absolute IRI or blank node: '${value['@reverse']}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
          }
          value['@id'] = value['@reverse'];
          if (Util_1.Util.isPotentialKeyword(value['@reverse'])) {
            delete value['@reverse'];
          } else {
            value['@reverse'] = true;
          }
        }
      }
    }
    return context;
  }
  /**
   * Expand all prefixed terms in the given context.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   * @param {boolean} expandContentTypeToBase If @type inside the context may be expanded
   *                                          via @base if @vocab is set to null.
   */
  expandPrefixedTerms(context, expandContentTypeToBase) {
    const contextRaw = context.getContextRaw();
    for (const key of Object.keys(contextRaw)) {
      // Only expand allowed keys
      if (Util_1.Util.EXPAND_KEYS_BLACKLIST.indexOf(key) < 0 && !Util_1.Util.isReservedInternalKeyword(key)) {
        // Error if we try to alias a keyword to something else.
        const keyValue = contextRaw[key];
        if (Util_1.Util.isPotentialKeyword(key) && Util_1.Util.ALIAS_DOMAIN_BLACKLIST.indexOf(key) >= 0) {
          if (key !== '@type' || typeof contextRaw[key] === 'object' && !(contextRaw[key]['@protected'] || contextRaw[key]['@container'] === '@set')) {
            throw new ErrorCoded_1.ErrorCoded(`Keywords can not be aliased to something else.
Tried mapping ${key} to ${JSON.stringify(keyValue)}`, ErrorCoded_1.ERROR_CODES.KEYWORD_REDEFINITION);
          }
        }
        // Error if we try to alias to an illegal keyword
        if (Util_1.Util.ALIAS_RANGE_BLACKLIST.indexOf(Util_1.Util.getContextValueId(keyValue)) >= 0) {
          throw new ErrorCoded_1.ErrorCoded(`Aliasing to certain keywords is not allowed.
Tried mapping ${key} to ${JSON.stringify(keyValue)}`, ErrorCoded_1.ERROR_CODES.INVALID_KEYWORD_ALIAS);
        }
        // Error if this term was marked as prefix as well
        if (keyValue && Util_1.Util.isPotentialKeyword(Util_1.Util.getContextValueId(keyValue)) && keyValue['@prefix'] === true) {
          throw new ErrorCoded_1.ErrorCoded(`Tried to use keyword aliases as prefix: '${key}': '${JSON.stringify(keyValue)}'`, ErrorCoded_1.ERROR_CODES.INVALID_TERM_DEFINITION);
        }
        // Loop because prefixes might be nested
        while (Util_1.Util.isPrefixValue(contextRaw[key])) {
          const value = contextRaw[key];
          let changed = false;
          if (typeof value === 'string') {
            contextRaw[key] = context.expandTerm(value, true);
            changed = changed || value !== contextRaw[key];
          } else {
            const id = value['@id'];
            const type = value['@type'];
            // If @id is missing, don't allow @id to be added if @prefix: true and key not being a valid IRI.
            const canAddIdEntry = !('@prefix' in value) || Util_1.Util.isValidIri(key);
            if ('@id' in value) {
              // Use @id value for expansion
              if (id !== undefined && id !== null && typeof id === 'string') {
                contextRaw[key]['@id'] = context.expandTerm(id, true);
                changed = changed || id !== contextRaw[key]['@id'];
              }
            } else if (!Util_1.Util.isPotentialKeyword(key) && canAddIdEntry) {
              // Add an explicit @id value based on the expanded key value
              const newId = context.expandTerm(key, true);
              if (newId !== key) {
                // Don't set @id if expansion failed
                contextRaw[key]['@id'] = newId;
                changed = true;
              }
            }
            if (type && typeof type === 'string' && type !== '@vocab' && (!value['@container'] || !value['@container']['@type']) && canAddIdEntry) {
              // First check @vocab, then fallback to @base
              contextRaw[key]['@type'] = context.expandTerm(type, true);
              if (expandContentTypeToBase && type === contextRaw[key]['@type']) {
                contextRaw[key]['@type'] = context.expandTerm(type, false);
              }
              changed = changed || type !== contextRaw[key]['@type'];
            }
          }
          if (!changed) {
            break;
          }
        }
      }
    }
  }
  /**
   * Normalize the @language entries in the given context to lowercase.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   * @param {IParseOptions} parseOptions The parsing options.
   */
  normalize(context, {
    processingMode,
    normalizeLanguageTags
  }) {
    // Lowercase language keys in 1.0
    if (normalizeLanguageTags || processingMode === 1.0) {
      for (const key of Object.keys(context)) {
        if (key === '@language' && typeof context[key] === 'string') {
          context[key] = context[key].toLowerCase();
        } else {
          const value = context[key];
          if (value && typeof value === 'object') {
            if (typeof value['@language'] === 'string') {
              value['@language'] = value['@language'].toLowerCase();
            }
          }
        }
      }
    }
  }
  /**
   * Convert all @container strings and array values to hash-based values.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   */
  containersToHash(context) {
    for (const key of Object.keys(context)) {
      const value = context[key];
      if (value && typeof value === 'object') {
        if (typeof value['@container'] === 'string') {
          value['@container'] = {
            [value['@container']]: true
          };
        } else if (Array.isArray(value['@container'])) {
          const newValue = {};
          for (const containerValue of value['@container']) {
            newValue[containerValue] = true;
          }
          value['@container'] = newValue;
        }
      }
    }
  }
  /**
   * Normalize and apply context-levevl @protected terms onto each term separately.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   * @param {number} processingMode The processing mode.
   */
  applyScopedProtected(context, {
    processingMode
  }) {
    if (processingMode && processingMode >= 1.1) {
      if (context['@protected']) {
        for (const key of Object.keys(context)) {
          if (Util_1.Util.isReservedInternalKeyword(key)) {
            continue;
          }
          if (!Util_1.Util.isPotentialKeyword(key) && !Util_1.Util.isTermProtected(context, key)) {
            const value = context[key];
            if (value && typeof value === 'object') {
              if (!('@protected' in context[key])) {
                // Mark terms with object values as protected if they don't have an @protected: false annotation
                context[key]['@protected'] = true;
              }
            } else {
              // Convert string-based term values to object-based values with @protected: true
              context[key] = {
                '@id': value,
                '@protected': true
              };
            }
          }
        }
        delete context['@protected'];
      }
    }
  }
  /**
   * Check if the given context inheritance does not contain any overrides of protected terms.
   * @param {IJsonLdContextNormalizedRaw} contextBefore The context that may contain some protected terms.
   * @param {IJsonLdContextNormalizedRaw} contextAfter A new context that is being applied on the first one.
   * @param {IExpandOptions} expandOptions Options that are needed for any expansions during this validation.
   */
  validateKeywordRedefinitions(contextBefore, contextAfter, expandOptions) {
    for (const key of Object.keys(contextAfter)) {
      if (Util_1.Util.isTermProtected(contextBefore, key)) {
        // The entry in the context before will always be in object-mode
        // If the new entry is in string-mode, convert it to object-mode
        // before checking if it is identical.
        if (typeof contextAfter[key] === 'string') {
          const isPrefix = Util_1.Util.isSimpleTermDefinitionPrefix(contextAfter[key], expandOptions);
          contextAfter[key] = {
            '@id': contextAfter[key]
          };
          // If the simple term def was a prefix, explicitly mark the term as a prefix in the expanded term definition,
          // because otherwise we loose this information due to JSON-LD interpreting prefixes differently
          // in simple vs expanded term definitions.
          if (isPrefix) {
            contextAfter[key]['@prefix'] = true;
            contextBefore[key]['@prefix'] = true; // Also on before, to make sure the next step still considers them ==
          }
        }
        // Convert term values to strings for each comparison
        const valueBefore = canonicalizeJson(contextBefore[key]);
        // We modify this deliberately,
        // as we need it for the value comparison (they must be identical modulo '@protected')),
        // and for the fact that this new value will override the first one.
        contextAfter[key]['@protected'] = true;
        const valueAfter = canonicalizeJson(contextAfter[key]);
        // Error if they are not identical
        if (valueBefore !== valueAfter) {
          throw new ErrorCoded_1.ErrorCoded(`Attempted to override the protected keyword ${key} from ${JSON.stringify(Util_1.Util.getContextValueId(contextBefore[key]))} to ${JSON.stringify(Util_1.Util.getContextValueId(contextAfter[key]))}`, ErrorCoded_1.ERROR_CODES.PROTECTED_TERM_REDEFINITION);
        }
      }
    }
  }
  /**
   * Validate the entries of the given context.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   * @param {IParseOptions} options The parse options.
   */
  validate(context, {
    processingMode
  }) {
    for (const key of Object.keys(context)) {
      // Ignore reserved internal keywords.
      if (Util_1.Util.isReservedInternalKeyword(key)) {
        continue;
      }
      // Do not allow empty term
      if (key === '') {
        throw new ErrorCoded_1.ErrorCoded(`The empty term is not allowed, got: '${key}': '${JSON.stringify(context[key])}'`, ErrorCoded_1.ERROR_CODES.INVALID_TERM_DEFINITION);
      }
      const value = context[key];
      const valueType = typeof value;
      // First check if the key is a keyword
      if (Util_1.Util.isPotentialKeyword(key)) {
        switch (key.substr(1)) {
          case 'vocab':
            if (value !== null && valueType !== 'string') {
              throw new ErrorCoded_1.ErrorCoded(`Found an invalid @vocab IRI: ${value}`, ErrorCoded_1.ERROR_CODES.INVALID_VOCAB_MAPPING);
            }
            break;
          case 'base':
            if (value !== null && valueType !== 'string') {
              throw new ErrorCoded_1.ErrorCoded(`Found an invalid @base IRI: ${context[key]}`, ErrorCoded_1.ERROR_CODES.INVALID_BASE_IRI);
            }
            break;
          case 'language':
            if (value !== null) {
              ContextParser.validateLanguage(value, true, ErrorCoded_1.ERROR_CODES.INVALID_DEFAULT_LANGUAGE);
            }
            break;
          case 'version':
            if (value !== null && valueType !== 'number') {
              throw new ErrorCoded_1.ErrorCoded(`Found an invalid @version number: ${value}`, ErrorCoded_1.ERROR_CODES.INVALID_VERSION_VALUE);
            }
            break;
          case 'direction':
            if (value !== null) {
              ContextParser.validateDirection(value, true);
            }
            break;
          case 'propagate':
            if (processingMode === 1.0) {
              throw new ErrorCoded_1.ErrorCoded(`Found an illegal @propagate keyword: ${value}`, ErrorCoded_1.ERROR_CODES.INVALID_CONTEXT_ENTRY);
            }
            if (value !== null && valueType !== 'boolean') {
              throw new ErrorCoded_1.ErrorCoded(`Found an invalid @propagate value: ${value}`, ErrorCoded_1.ERROR_CODES.INVALID_PROPAGATE_VALUE);
            }
            break;
        }
        // Don't allow keywords to be overridden
        if (Util_1.Util.isValidKeyword(key) && Util_1.Util.isValidKeyword(Util_1.Util.getContextValueId(value))) {
          throw new ErrorCoded_1.ErrorCoded(`Illegal keyword alias in term value, found: '${key}': '${Util_1.Util.getContextValueId(value)}'`, ErrorCoded_1.ERROR_CODES.KEYWORD_REDEFINITION);
        }
        continue;
      }
      // Otherwise, consider the key a term
      if (value !== null) {
        switch (valueType) {
          case 'string':
            if (Util_1.Util.getPrefix(value, context) === key) {
              throw new ErrorCoded_1.ErrorCoded(`Detected cyclical IRI mapping in context entry: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.CYCLIC_IRI_MAPPING);
            }
            if (Util_1.Util.isValidIriWeak(key)) {
              if (value === '@type') {
                throw new ErrorCoded_1.ErrorCoded(`IRIs can not be mapped to @type, found: '${key}': '${value}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
              } else if (Util_1.Util.isValidIri(value) && value !== new JsonLdContextNormalized_1.JsonLdContextNormalized(context).expandTerm(key)) {
                throw new ErrorCoded_1.ErrorCoded(`IRIs can not be mapped to other IRIs, found: '${key}': '${value}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
              }
            }
            break;
          case 'object':
            if (!Util_1.Util.isCompactIri(key) && !('@id' in value) && (value['@type'] === '@id' ? !context['@base'] : !context['@vocab'])) {
              throw new ErrorCoded_1.ErrorCoded(`Missing @id in context entry: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
            }
            for (const objectKey of Object.keys(value)) {
              const objectValue = value[objectKey];
              if (!objectValue) {
                continue;
              }
              switch (objectKey) {
                case '@id':
                  if (Util_1.Util.isValidKeyword(objectValue) && objectValue !== '@type' && objectValue !== '@id' && objectValue !== '@graph') {
                    throw new ErrorCoded_1.ErrorCoded(`Illegal keyword alias in term value, found: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
                  }
                  if (Util_1.Util.isValidIriWeak(key)) {
                    if (objectValue === '@type') {
                      throw new ErrorCoded_1.ErrorCoded(`IRIs can not be mapped to @type, found: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
                    } else if (Util_1.Util.isValidIri(objectValue) && objectValue !== new JsonLdContextNormalized_1.JsonLdContextNormalized(context).expandTerm(key)) {
                      throw new ErrorCoded_1.ErrorCoded(`IRIs can not be mapped to other IRIs, found: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
                    }
                  }
                  if (typeof objectValue !== 'string') {
                    throw new ErrorCoded_1.ErrorCoded(`Detected non-string @id in context entry: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
                  }
                  if (Util_1.Util.getPrefix(objectValue, context) === key) {
                    throw new ErrorCoded_1.ErrorCoded(`Detected cyclical IRI mapping in context entry: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.CYCLIC_IRI_MAPPING);
                  }
                  break;
                case '@type':
                  if (value['@container'] === '@type' && objectValue !== '@id' && objectValue !== '@vocab') {
                    throw new ErrorCoded_1.ErrorCoded(`@container: @type only allows @type: @id or @vocab, but got: '${key}': '${objectValue}'`, ErrorCoded_1.ERROR_CODES.INVALID_TYPE_MAPPING);
                  }
                  if (typeof objectValue !== 'string') {
                    throw new ErrorCoded_1.ErrorCoded(`The value of an '@type' must be a string, got '${JSON.stringify(valueType)}'`, ErrorCoded_1.ERROR_CODES.INVALID_TYPE_MAPPING);
                  }
                  if (objectValue !== '@id' && objectValue !== '@vocab' && (processingMode === 1.0 || objectValue !== '@json') && (processingMode === 1.0 || objectValue !== '@none') && (objectValue[0] === '_' || !Util_1.Util.isValidIri(objectValue))) {
                    throw new ErrorCoded_1.ErrorCoded(`A context @type must be an absolute IRI, found: '${key}': '${objectValue}'`, ErrorCoded_1.ERROR_CODES.INVALID_TYPE_MAPPING);
                  }
                  break;
                case '@reverse':
                  if (typeof objectValue === 'string' && value['@id'] && value['@id'] !== objectValue) {
                    throw new ErrorCoded_1.ErrorCoded(`Found non-matching @id and @reverse term values in '${key}':\
'${objectValue}' and '${value['@id']}'`, ErrorCoded_1.ERROR_CODES.INVALID_REVERSE_PROPERTY);
                  }
                  if ('@nest' in value) {
                    throw new ErrorCoded_1.ErrorCoded(`@nest is not allowed in the reverse property '${key}'`, ErrorCoded_1.ERROR_CODES.INVALID_REVERSE_PROPERTY);
                  }
                  break;
                case '@container':
                  if (processingMode === 1.0) {
                    if (Object.keys(objectValue).length > 1 || Util_1.Util.CONTAINERS_1_0.indexOf(Object.keys(objectValue)[0]) < 0) {
                      throw new ErrorCoded_1.ErrorCoded(`Invalid term @container for '${key}' ('${Object.keys(objectValue)}') in 1.0, \
must be only one of ${Util_1.Util.CONTAINERS_1_0.join(', ')}`, ErrorCoded_1.ERROR_CODES.INVALID_CONTAINER_MAPPING);
                    }
                  }
                  for (const containerValue of Object.keys(objectValue)) {
                    if (containerValue === '@list' && value['@reverse']) {
                      throw new ErrorCoded_1.ErrorCoded(`Term value can not be @container: @list and @reverse at the same time on '${key}'`, ErrorCoded_1.ERROR_CODES.INVALID_REVERSE_PROPERTY);
                    }
                    if (Util_1.Util.CONTAINERS.indexOf(containerValue) < 0) {
                      throw new ErrorCoded_1.ErrorCoded(`Invalid term @container for '${key}' ('${containerValue}'), \
must be one of ${Util_1.Util.CONTAINERS.join(', ')}`, ErrorCoded_1.ERROR_CODES.INVALID_CONTAINER_MAPPING);
                    }
                  }
                  break;
                case '@language':
                  ContextParser.validateLanguage(objectValue, true, ErrorCoded_1.ERROR_CODES.INVALID_LANGUAGE_MAPPING);
                  break;
                case '@direction':
                  ContextParser.validateDirection(objectValue, true);
                  break;
                case '@prefix':
                  if (objectValue !== null && typeof objectValue !== 'boolean') {
                    throw new ErrorCoded_1.ErrorCoded(`Found an invalid term @prefix boolean in: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_PREFIX_VALUE);
                  }
                  if (!('@id' in value) && !Util_1.Util.isValidIri(key)) {
                    throw new ErrorCoded_1.ErrorCoded(`Invalid @prefix definition for '${key}' ('${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_TERM_DEFINITION);
                  }
                  break;
                case '@index':
                  if (processingMode === 1.0 || !value['@container'] || !value['@container']['@index']) {
                    throw new ErrorCoded_1.ErrorCoded(`Attempt to add illegal key to value object: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_TERM_DEFINITION);
                  }
                  break;
                case '@nest':
                  if (Util_1.Util.isPotentialKeyword(objectValue) && objectValue !== '@nest') {
                    throw new ErrorCoded_1.ErrorCoded(`Found an invalid term @nest value in: '${key}': '${JSON.stringify(value)}'`, ErrorCoded_1.ERROR_CODES.INVALID_NEST_VALUE);
                  }
              }
            }
            break;
          default:
            throw new ErrorCoded_1.ErrorCoded(`Found an invalid term value: '${key}': '${value}'`, ErrorCoded_1.ERROR_CODES.INVALID_TERM_DEFINITION);
        }
      }
    }
  }
  /**
   * Apply the @base context entry to the given context under certain circumstances.
   * @param context A context.
   * @param options Parsing options.
   * @param inheritFromParent If the @base value from the parent context can be inherited.
   * @return The given context.
   */
  applyBaseEntry(context, options, inheritFromParent) {
    // In some special cases, this can be a string, so ignore those.
    if (typeof context === 'string') {
      return context;
    }
    // Give priority to @base in the parent context
    if (inheritFromParent && !('@base' in context) && options.parentContext && typeof options.parentContext === 'object' && '@base' in options.parentContext) {
      context['@base'] = options.parentContext['@base'];
      if (options.parentContext['@__baseDocument']) {
        context['@__baseDocument'] = true;
      }
    }
    // Override the base IRI if provided.
    if (options.baseIRI && !options.external) {
      if (!('@base' in context)) {
        // The context base is the document base
        context['@base'] = options.baseIRI;
        context['@__baseDocument'] = true;
      } else if (context['@base'] !== null && typeof context['@base'] === 'string' && !Util_1.Util.isValidIri(context['@base'])) {
        // The context base is relative to the document base
        context['@base'] = (0, relative_to_absolute_iri_1.resolve)(context['@base'], options.parentContext && options.parentContext['@base'] || options.baseIRI);
      }
    }
    return context;
  }
  /**
   * Resolve relative context IRIs, or return full IRIs as-is.
   * @param {string} contextIri A context IRI.
   * @param {string} baseIRI A base IRI.
   * @return {string} The normalized context IRI.
   */
  normalizeContextIri(contextIri, baseIRI) {
    if (!Util_1.Util.isValidIri(contextIri)) {
      try {
        contextIri = (0, relative_to_absolute_iri_1.resolve)(contextIri, baseIRI);
      } catch (_a) {
        throw new Error(`Invalid context IRI: ${contextIri}`);
      }
    }
    // TODO: Temporary workaround for fixing schema.org CORS issues (https://github.com/schemaorg/schemaorg/issues/2578#issuecomment-652324465)
    if (this.redirectSchemaOrgHttps && contextIri.startsWith('http://schema.org')) {
      contextIri = 'https://schema.org/';
    }
    return contextIri;
  }
  /**
   * Parse scoped contexts in the given context.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   * @param {IParseOptions} options Parsing options.
   * @return {IJsonLdContextNormalizedRaw} The mutated input context.
   */
  async parseInnerContexts(context, options) {
    for (const key of Object.keys(context)) {
      const value = context[key];
      if (value && typeof value === 'object') {
        if ('@context' in value && value['@context'] !== null && !options.ignoreScopedContexts) {
          // Simulate a processing based on the parent context to check if there are any (potential errors).
          // Honestly, I find it a bit weird to do this here, as the context may be unused,
          // and the final effective context may differ based on any other embedded/scoped contexts.
          // But hey, it's part of the spec, so we have no choice...
          // https://w3c.github.io/json-ld-api/#h-note-10
          if (this.validateContext) {
            try {
              const parentContext = Object.assign({}, context);
              parentContext[key] = Object.assign({}, parentContext[key]);
              delete parentContext[key]['@context'];
              await this.parse(value['@context'], Object.assign(Object.assign({}, options), {
                external: false,
                parentContext,
                ignoreProtection: true,
                ignoreRemoteScopedContexts: true,
                ignoreScopedContexts: true
              }));
            } catch (e) {
              throw new ErrorCoded_1.ErrorCoded(e.message, ErrorCoded_1.ERROR_CODES.INVALID_SCOPED_CONTEXT);
            }
          }
          value['@context'] = (await this.parse(value['@context'], Object.assign(Object.assign({}, options), {
            external: false,
            minimalProcessing: true,
            ignoreRemoteScopedContexts: true,
            parentContext: context
          }))).getContextRaw();
        }
      }
    }
    return context;
  }
  /**
   * Parse a JSON-LD context in any form.
   * @param {JsonLdContext} context A context, URL to a context, or an array of contexts/URLs.
   * @param {IParseOptions} options Optional parsing options.
   * @return {Promise<JsonLdContextNormalized>} A promise resolving to the context.
   */
  async parse(context, options = {}) {
    const {
      baseIRI,
      parentContext: parentContextInitial,
      external,
      processingMode = ContextParser.DEFAULT_PROCESSING_MODE,
      normalizeLanguageTags,
      ignoreProtection,
      minimalProcessing
    } = options;
    let parentContext = parentContextInitial;
    const remoteContexts = options.remoteContexts || {};
    // Avoid remote context overflows
    if (Object.keys(remoteContexts).length >= this.remoteContextsDepthLimit) {
      throw new ErrorCoded_1.ErrorCoded('Detected an overflow in remote context inclusions: ' + Object.keys(remoteContexts), ErrorCoded_1.ERROR_CODES.CONTEXT_OVERFLOW);
    }
    if (context === null || context === undefined) {
      // Don't allow context nullification and there are protected terms
      if (!ignoreProtection && parentContext && Util_1.Util.hasProtectedTerms(parentContext)) {
        throw new ErrorCoded_1.ErrorCoded('Illegal context nullification when terms are protected', ErrorCoded_1.ERROR_CODES.INVALID_CONTEXT_NULLIFICATION);
      }
      // Context that are explicitly set to null are empty.
      return new JsonLdContextNormalized_1.JsonLdContextNormalized(this.applyBaseEntry({}, options, false));
    } else if (typeof context === 'string') {
      const contextIri = this.normalizeContextIri(context, baseIRI);
      const overriddenLoad = this.getOverriddenLoad(contextIri, options);
      if (overriddenLoad) {
        return new JsonLdContextNormalized_1.JsonLdContextNormalized(overriddenLoad);
      }
      const parsedStringContext = await this.parse(await this.load(contextIri), Object.assign(Object.assign({}, options), {
        baseIRI: contextIri,
        external: true,
        remoteContexts: Object.assign(Object.assign({}, remoteContexts), {
          [contextIri]: true
        })
      }));
      this.applyBaseEntry(parsedStringContext.getContextRaw(), options, true);
      return parsedStringContext;
    } else if (Array.isArray(context)) {
      // As a performance consideration, first load all external contexts in parallel.
      const contextIris = [];
      const contexts = await Promise.all(context.map((subContext, i) => {
        if (typeof subContext === 'string') {
          const contextIri = this.normalizeContextIri(subContext, baseIRI);
          contextIris[i] = contextIri;
          const overriddenLoad = this.getOverriddenLoad(contextIri, options);
          if (overriddenLoad) {
            return overriddenLoad;
          }
          return this.load(contextIri);
        } else {
          return subContext;
        }
      }));
      // Don't apply inheritance logic on minimal processing
      if (minimalProcessing) {
        return new JsonLdContextNormalized_1.JsonLdContextNormalized(contexts);
      }
      const reducedContexts = await contexts.reduce((accContextPromise, contextEntry, i) => accContextPromise.then(accContext => this.parse(contextEntry, Object.assign(Object.assign({}, options), {
        baseIRI: contextIris[i] || options.baseIRI,
        external: !!contextIris[i] || options.external,
        parentContext: accContext.getContextRaw(),
        remoteContexts: contextIris[i] ? Object.assign(Object.assign({}, remoteContexts), {
          [contextIris[i]]: true
        }) : remoteContexts
      }))), Promise.resolve(new JsonLdContextNormalized_1.JsonLdContextNormalized(parentContext || {})));
      // Override the base IRI if provided.
      this.applyBaseEntry(reducedContexts.getContextRaw(), options, true);
      return reducedContexts;
    } else if (typeof context === 'object') {
      if ('@context' in context) {
        return await this.parse(context['@context'], options);
      }
      // Make a deep clone of the given context, to avoid modifying it.
      context = JSON.parse(JSON.stringify(context)); // No better way in JS at the moment.
      if (parentContext && !minimalProcessing) {
        parentContext = JSON.parse(JSON.stringify(parentContext));
      }
      // We have an actual context object.
      let newContext = {};
      // According to the JSON-LD spec, @base must be ignored from external contexts.
      if (external) {
        delete context['@base'];
      }
      // Override the base IRI if provided.
      this.applyBaseEntry(context, options, true);
      // Hashify container entries
      // Do this before protected term validation as that influences term format
      this.containersToHash(context);
      // Don't perform any other modifications if only minimal processing is needed.
      if (minimalProcessing) {
        return new JsonLdContextNormalized_1.JsonLdContextNormalized(context);
      }
      // In JSON-LD 1.1, load @import'ed context prior to processing.
      let importContext = {};
      if ('@import' in context) {
        if (processingMode >= 1.1) {
          // Only accept string values
          if (typeof context['@import'] !== 'string') {
            throw new ErrorCoded_1.ErrorCoded('An @import value must be a string, but got ' + typeof context['@import'], ErrorCoded_1.ERROR_CODES.INVALID_IMPORT_VALUE);
          }
          // Load context
          importContext = await this.loadImportContext(this.normalizeContextIri(context['@import'], baseIRI));
          delete context['@import'];
        } else {
          throw new ErrorCoded_1.ErrorCoded('Context importing is not supported in JSON-LD 1.0', ErrorCoded_1.ERROR_CODES.INVALID_CONTEXT_ENTRY);
        }
      }
      // Merge different parts of the final context in order
      newContext = Object.assign(Object.assign(Object.assign(Object.assign({}, newContext), typeof parentContext === 'object' ? parentContext : {}), importContext), context);
      const newContextWrapped = new JsonLdContextNormalized_1.JsonLdContextNormalized(newContext);
      // Parse inner contexts with minimal processing
      await this.parseInnerContexts(newContext, options);
      // In JSON-LD 1.1, @vocab can be relative to @vocab in the parent context.
      if ((newContext && newContext['@version'] || ContextParser.DEFAULT_PROCESSING_MODE) >= 1.1 && (context['@vocab'] && typeof context['@vocab'] === 'string' || context['@vocab'] === '') && context['@vocab'].indexOf(':') < 0 && parentContext && '@vocab' in parentContext) {
        newContext['@vocab'] = parentContext['@vocab'] + context['@vocab'];
      }
      // Handle terms (before protection checks)
      this.idifyReverseTerms(newContext);
      this.expandPrefixedTerms(newContextWrapped, this.expandContentTypeToBase);
      // In JSON-LD 1.1, check if we are not redefining any protected keywords
      if (!ignoreProtection && parentContext && processingMode >= 1.1) {
        this.validateKeywordRedefinitions(parentContext, newContext, exports.defaultExpandOptions);
      }
      this.normalize(newContext, {
        processingMode,
        normalizeLanguageTags
      });
      this.applyScopedProtected(newContext, {
        processingMode
      });
      if (this.validateContext) {
        this.validate(newContext, {
          processingMode
        });
      }
      return newContextWrapped;
    } else {
      throw new ErrorCoded_1.ErrorCoded(`Tried parsing a context that is not a string, array or object, but got ${context}`, ErrorCoded_1.ERROR_CODES.INVALID_LOCAL_CONTEXT);
    }
  }
  /**
   * Fetch the given URL as a raw JSON-LD context.
   * @param url An URL.
   * @return A promise resolving to a raw JSON-LD context.
   */
  async load(url) {
    // First try to retrieve the context from cache
    const cached = this.documentCache[url];
    if (cached) {
      return typeof cached === 'string' ? cached : Array.isArray(cached) ? cached.slice() : Object.assign({}, cached);
    }
    // If not in cache, load it
    let document;
    try {
      document = await this.documentLoader.load(url);
    } catch (e) {
      throw new ErrorCoded_1.ErrorCoded(`Failed to load remote context ${url}: ${e.message}`, ErrorCoded_1.ERROR_CODES.LOADING_REMOTE_CONTEXT_FAILED);
    }
    // Validate the context
    if (!('@context' in document)) {
      throw new ErrorCoded_1.ErrorCoded(`Missing @context in remote context at ${url}`, ErrorCoded_1.ERROR_CODES.INVALID_REMOTE_CONTEXT);
    }
    return this.documentCache[url] = document['@context'];
  }
  /**
   * Override the given context that may be loaded.
   *
   * This will check whether or not the url is recursively being loaded.
   * @param url An URL.
   * @param options Parsing options.
   * @return An overridden context, or null.
   *         Optionally an error can be thrown if a cyclic context is detected.
   */
  getOverriddenLoad(url, options) {
    if (url in (options.remoteContexts || {})) {
      if (options.ignoreRemoteScopedContexts) {
        return url;
      } else {
        throw new ErrorCoded_1.ErrorCoded('Detected a cyclic context inclusion of ' + url, ErrorCoded_1.ERROR_CODES.RECURSIVE_CONTEXT_INCLUSION);
      }
    }
    return null;
  }
  /**
   * Load an @import'ed context.
   * @param importContextIri The full URI of an @import value.
   */
  async loadImportContext(importContextIri) {
    // Load the context
    const importContext = await this.load(importContextIri);
    // Require the context to be a non-array object
    if (typeof importContext !== 'object' || Array.isArray(importContext)) {
      throw new ErrorCoded_1.ErrorCoded('An imported context must be a single object: ' + importContextIri, ErrorCoded_1.ERROR_CODES.INVALID_REMOTE_CONTEXT);
    }
    // Error if the context contains another @import
    if ('@import' in importContext) {
      throw new ErrorCoded_1.ErrorCoded('An imported context can not import another context: ' + importContextIri, ErrorCoded_1.ERROR_CODES.INVALID_CONTEXT_ENTRY);
    }
    // Containers have to be converted into hash values the same way as for the importing context
    // Otherwise context validation will fail for container values
    this.containersToHash(importContext);
    return importContext;
  }
}
exports.ContextParser = ContextParser;
ContextParser.DEFAULT_PROCESSING_MODE = 1.1;
exports.defaultExpandOptions = {
  allowPrefixForcing: true,
  allowPrefixNonGenDelims: false,
  allowVocabRelativeToBase: true
};

/***/ }),

/***/ "./node_modules/jsonld-context-parser/lib/ErrorCoded.js":
/*!**************************************************************!*\
  !*** ./node_modules/jsonld-context-parser/lib/ErrorCoded.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ERROR_CODES = exports.ErrorCoded = void 0;
/**
 * An error that has a certain error code.
 *
 * The error code can be any string.
 * All standardized error codes are listed in {@link ERROR_CODES}.
 */
class ErrorCoded extends Error {
  /* istanbul ignore next */
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
exports.ErrorCoded = ErrorCoded;
/**
 * All standardized JSON-LD error codes.
 * @see https://w3c.github.io/json-ld-api/#dom-jsonlderrorcode
 */
// tslint:disable:object-literal-sort-keys
var ERROR_CODES;
(function (ERROR_CODES) {
  ERROR_CODES["COLLIDING_KEYWORDS"] = "colliding keywords";
  ERROR_CODES["CONFLICTING_INDEXES"] = "conflicting indexes";
  ERROR_CODES["CYCLIC_IRI_MAPPING"] = "cyclic IRI mapping";
  ERROR_CODES["INVALID_ID_VALUE"] = "invalid @id value";
  ERROR_CODES["INVALID_INDEX_VALUE"] = "invalid @index value";
  ERROR_CODES["INVALID_NEST_VALUE"] = "invalid @nest value";
  ERROR_CODES["INVALID_PREFIX_VALUE"] = "invalid @prefix value";
  ERROR_CODES["INVALID_PROPAGATE_VALUE"] = "invalid @propagate value";
  ERROR_CODES["INVALID_REVERSE_VALUE"] = "invalid @reverse value";
  ERROR_CODES["INVALID_IMPORT_VALUE"] = "invalid @import value";
  ERROR_CODES["INVALID_VERSION_VALUE"] = "invalid @version value";
  ERROR_CODES["INVALID_BASE_IRI"] = "invalid base IRI";
  ERROR_CODES["INVALID_CONTAINER_MAPPING"] = "invalid container mapping";
  ERROR_CODES["INVALID_CONTEXT_ENTRY"] = "invalid context entry";
  ERROR_CODES["INVALID_CONTEXT_NULLIFICATION"] = "invalid context nullification";
  ERROR_CODES["INVALID_DEFAULT_LANGUAGE"] = "invalid default language";
  ERROR_CODES["INVALID_INCLUDED_VALUE"] = "invalid @included value";
  ERROR_CODES["INVALID_IRI_MAPPING"] = "invalid IRI mapping";
  ERROR_CODES["INVALID_JSON_LITERAL"] = "invalid JSON literal";
  ERROR_CODES["INVALID_KEYWORD_ALIAS"] = "invalid keyword alias";
  ERROR_CODES["INVALID_LANGUAGE_MAP_VALUE"] = "invalid language map value";
  ERROR_CODES["INVALID_LANGUAGE_MAPPING"] = "invalid language mapping";
  ERROR_CODES["INVALID_LANGUAGE_TAGGED_STRING"] = "invalid language-tagged string";
  ERROR_CODES["INVALID_LANGUAGE_TAGGED_VALUE"] = "invalid language-tagged value";
  ERROR_CODES["INVALID_LOCAL_CONTEXT"] = "invalid local context";
  ERROR_CODES["INVALID_REMOTE_CONTEXT"] = "invalid remote context";
  ERROR_CODES["INVALID_REVERSE_PROPERTY"] = "invalid reverse property";
  ERROR_CODES["INVALID_REVERSE_PROPERTY_MAP"] = "invalid reverse property map";
  ERROR_CODES["INVALID_REVERSE_PROPERTY_VALUE"] = "invalid reverse property value";
  ERROR_CODES["INVALID_SCOPED_CONTEXT"] = "invalid scoped context";
  ERROR_CODES["INVALID_SCRIPT_ELEMENT"] = "invalid script element";
  ERROR_CODES["INVALID_SET_OR_LIST_OBJECT"] = "invalid set or list object";
  ERROR_CODES["INVALID_TERM_DEFINITION"] = "invalid term definition";
  ERROR_CODES["INVALID_TYPE_MAPPING"] = "invalid type mapping";
  ERROR_CODES["INVALID_TYPE_VALUE"] = "invalid type value";
  ERROR_CODES["INVALID_TYPED_VALUE"] = "invalid typed value";
  ERROR_CODES["INVALID_VALUE_OBJECT"] = "invalid value object";
  ERROR_CODES["INVALID_VALUE_OBJECT_VALUE"] = "invalid value object value";
  ERROR_CODES["INVALID_VOCAB_MAPPING"] = "invalid vocab mapping";
  ERROR_CODES["IRI_CONFUSED_WITH_PREFIX"] = "IRI confused with prefix";
  ERROR_CODES["KEYWORD_REDEFINITION"] = "keyword redefinition";
  ERROR_CODES["LOADING_DOCUMENT_FAILED"] = "loading document failed";
  ERROR_CODES["LOADING_REMOTE_CONTEXT_FAILED"] = "loading remote context failed";
  ERROR_CODES["MULTIPLE_CONTEXT_LINK_HEADERS"] = "multiple context link headers";
  ERROR_CODES["PROCESSING_MODE_CONFLICT"] = "processing mode conflict";
  ERROR_CODES["PROTECTED_TERM_REDEFINITION"] = "protected term redefinition";
  ERROR_CODES["CONTEXT_OVERFLOW"] = "context overflow";
  ERROR_CODES["INVALID_BASE_DIRECTION"] = "invalid base direction";
  ERROR_CODES["RECURSIVE_CONTEXT_INCLUSION"] = "recursive context inclusion";
  ERROR_CODES["INVALID_STREAMING_KEY_ORDER"] = "invalid streaming key order";
})(ERROR_CODES = exports.ERROR_CODES || (exports.ERROR_CODES = {}));

/***/ }),

/***/ "./node_modules/jsonld-context-parser/lib/FetchDocumentLoader.js":
/*!***********************************************************************!*\
  !*** ./node_modules/jsonld-context-parser/lib/FetchDocumentLoader.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FetchDocumentLoader = void 0;
__webpack_require__(/*! cross-fetch/polyfill */ "./node_modules/cross-fetch/dist/browser-polyfill.js");
const ErrorCoded_1 = __webpack_require__(/*! ./ErrorCoded */ "./node_modules/jsonld-context-parser/lib/ErrorCoded.js");
const http_link_header_1 = __webpack_require__(/*! http-link-header */ "./node_modules/http-link-header/lib/link.js");
const relative_to_absolute_iri_1 = __webpack_require__(/*! relative-to-absolute-iri */ "./node_modules/relative-to-absolute-iri/index.js");
/**
 * Loads documents via the fetch API.
 */
class FetchDocumentLoader {
  constructor(fetcher) {
    this.fetcher = fetcher;
  }
  async load(url) {
    const response = await (this.fetcher || fetch)(url, {
      headers: new Headers({
        accept: 'application/ld+json'
      })
    });
    if (response.ok && response.headers) {
      let mediaType = response.headers.get('Content-Type');
      if (mediaType) {
        const colonPos = mediaType.indexOf(';');
        if (colonPos > 0) {
          mediaType = mediaType.substr(0, colonPos);
        }
      }
      if (mediaType === 'application/ld+json') {
        // Return JSON-LD if proper content type was returned
        return await response.json();
      } else {
        // Check for alternate link for a non-JSON-LD response
        if (response.headers.has('Link')) {
          let alternateUrl;
          response.headers.forEach((value, key) => {
            if (key === 'link') {
              const linkHeader = (0, http_link_header_1.parse)(value);
              for (const link of linkHeader.get('type', 'application/ld+json')) {
                if (link.rel === 'alternate') {
                  if (alternateUrl) {
                    throw new Error('Multiple JSON-LD alternate links were found on ' + url);
                  }
                  alternateUrl = (0, relative_to_absolute_iri_1.resolve)(link.uri, url);
                }
              }
            }
          });
          if (alternateUrl) {
            return this.load(alternateUrl);
          }
        }
        throw new ErrorCoded_1.ErrorCoded(`Unsupported JSON-LD media type ${mediaType}`, ErrorCoded_1.ERROR_CODES.LOADING_DOCUMENT_FAILED);
      }
    } else {
      throw new Error(response.statusText || `Status code: ${response.status}`);
    }
  }
}
exports.FetchDocumentLoader = FetchDocumentLoader;

/***/ }),

/***/ "./node_modules/jsonld-context-parser/lib/IDocumentLoader.js":
/*!*******************************************************************!*\
  !*** ./node_modules/jsonld-context-parser/lib/IDocumentLoader.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

/***/ }),

/***/ "./node_modules/jsonld-context-parser/lib/JsonLdContext.js":
/*!*****************************************************************!*\
  !*** ./node_modules/jsonld-context-parser/lib/JsonLdContext.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// tslint:disable:max-line-length
Object.defineProperty(exports, "__esModule", {
  value: true
});

/***/ }),

/***/ "./node_modules/jsonld-context-parser/lib/JsonLdContextNormalized.js":
/*!***************************************************************************!*\
  !*** ./node_modules/jsonld-context-parser/lib/JsonLdContextNormalized.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JsonLdContextNormalized = void 0;
const relative_to_absolute_iri_1 = __webpack_require__(/*! relative-to-absolute-iri */ "./node_modules/relative-to-absolute-iri/index.js");
const ContextParser_1 = __webpack_require__(/*! ./ContextParser */ "./node_modules/jsonld-context-parser/lib/ContextParser.js");
const ErrorCoded_1 = __webpack_require__(/*! ./ErrorCoded */ "./node_modules/jsonld-context-parser/lib/ErrorCoded.js");
const Util_1 = __webpack_require__(/*! ./Util */ "./node_modules/jsonld-context-parser/lib/Util.js");
/**
 * A class exposing operations over a normalized JSON-LD context.
 */
class JsonLdContextNormalized {
  constructor(contextRaw) {
    this.contextRaw = contextRaw;
  }
  /**
   * @return The raw inner context.
   */
  getContextRaw() {
    return this.contextRaw;
  }
  /**
   * Expand the term or prefix of the given term if it has one,
   * otherwise return the term as-is.
   *
   * This will try to expand the IRI as much as possible.
   *
   * Iff in vocab-mode, then other references to other terms in the context can be used,
   * such as to `myTerm`:
   * ```
   * {
   *   "myTerm": "http://example.org/myLongTerm"
   * }
   * ```
   *
   * @param {string} term A term that is an URL or a prefixed URL.
   * @param {boolean} expandVocab If the term is a predicate or type and should be expanded based on @vocab,
   *                              otherwise it is considered a regular term that is expanded based on @base.
   * @param {IExpandOptions} options Options that define the way how expansion must be done.
   * @return {string} The expanded term, the term as-is, or null if it was explicitly disabled in the context.
   * @throws If the term is aliased to an invalid value (not a string, IRI or keyword).
   */
  expandTerm(term, expandVocab, options = ContextParser_1.defaultExpandOptions) {
    const contextValue = this.contextRaw[term];
    // Immediately return if the term was disabled in the context
    if (contextValue === null || contextValue && contextValue['@id'] === null) {
      return null;
    }
    // Check the @id
    let validIriMapping = true;
    if (contextValue && expandVocab) {
      const value = Util_1.Util.getContextValueId(contextValue);
      if (value && value !== term) {
        if (typeof value !== 'string' || !Util_1.Util.isValidIri(value) && !Util_1.Util.isValidKeyword(value)) {
          // Don't mark this mapping as invalid if we have an unknown keyword, but of the correct form.
          if (!Util_1.Util.isPotentialKeyword(value)) {
            validIriMapping = false;
          }
        } else {
          return value;
        }
      }
    }
    // Check if the term is prefixed
    const prefix = Util_1.Util.getPrefix(term, this.contextRaw);
    const vocab = this.contextRaw['@vocab'];
    const vocabRelative = (!!vocab || vocab === '') && vocab.indexOf(':') < 0;
    const base = this.contextRaw['@base'];
    const potentialKeyword = Util_1.Util.isPotentialKeyword(term);
    if (prefix) {
      const contextPrefixValue = this.contextRaw[prefix];
      const value = Util_1.Util.getContextValueId(contextPrefixValue);
      if (value) {
        if (typeof contextPrefixValue === 'string' || !options.allowPrefixForcing) {
          // If we have a simple term definition,
          // check the last character of the prefix to determine whether or not it is a prefix.
          // Validate that prefix ends with gen-delim character, unless @prefix is true
          if (!Util_1.Util.isSimpleTermDefinitionPrefix(value, options)) {
            // Treat the term as an absolute IRI
            return term;
          }
        } else {
          // If we have an expanded term definition, default to @prefix: false
          if (value[0] !== '_' && !potentialKeyword && !contextPrefixValue['@prefix'] && !(term in this.contextRaw)) {
            // Treat the term as an absolute IRI
            return term;
          }
        }
        return value + term.substr(prefix.length + 1);
      }
    } else if (expandVocab && (vocab || vocab === '' || options.allowVocabRelativeToBase && base && vocabRelative) && !potentialKeyword && !Util_1.Util.isCompactIri(term)) {
      if (vocabRelative) {
        if (options.allowVocabRelativeToBase) {
          return (vocab || base ? (0, relative_to_absolute_iri_1.resolve)(vocab, base) : '') + term;
        } else {
          throw new ErrorCoded_1.ErrorCoded(`Relative vocab expansion for term '${term}' with vocab '${vocab}' is not allowed.`, ErrorCoded_1.ERROR_CODES.INVALID_VOCAB_MAPPING);
        }
      } else {
        return vocab + term;
      }
    } else if (!expandVocab && base && !potentialKeyword && !Util_1.Util.isCompactIri(term)) {
      return (0, relative_to_absolute_iri_1.resolve)(term, base);
    }
    // Return the term as-is, unless we discovered an invalid IRI mapping for this term in the context earlier.
    if (validIriMapping) {
      return term;
    } else {
      throw new ErrorCoded_1.ErrorCoded(`Invalid IRI mapping found for context entry '${term}': '${JSON.stringify(contextValue)}'`, ErrorCoded_1.ERROR_CODES.INVALID_IRI_MAPPING);
    }
  }
  /**
   * Compact the given term using @base, @vocab, an aliased term, or a prefixed term.
   *
   * This will try to compact the IRI as much as possible.
   *
   * @param {string} iri An IRI to compact.
   * @param {boolean} vocab If the term is a predicate or type and should be compacted based on @vocab,
   *                        otherwise it is considered a regular term that is compacted based on @base.
   * @return {string} The compacted term or the IRI as-is.
   */
  compactIri(iri, vocab) {
    // Try @vocab compacting
    if (vocab && this.contextRaw['@vocab'] && iri.startsWith(this.contextRaw['@vocab'])) {
      return iri.substr(this.contextRaw['@vocab'].length);
    }
    // Try @base compacting
    if (!vocab && this.contextRaw['@base'] && iri.startsWith(this.contextRaw['@base'])) {
      return iri.substr(this.contextRaw['@base'].length);
    }
    // Loop over all terms in the context
    // This will try to prefix as short as possible.
    // Once a fully compacted alias is found, return immediately, as we can not go any shorter.
    const shortestPrefixing = {
      prefix: '',
      suffix: iri
    };
    for (const key in this.contextRaw) {
      const value = this.contextRaw[key];
      if (value && !Util_1.Util.isPotentialKeyword(key)) {
        const contextIri = Util_1.Util.getContextValueId(value);
        if (iri.startsWith(contextIri)) {
          const suffix = iri.substr(contextIri.length);
          if (!suffix) {
            if (vocab) {
              // Immediately return on compacted alias
              return key;
            }
          } else if (suffix.length < shortestPrefixing.suffix.length) {
            // Overwrite the shortest prefix
            shortestPrefixing.prefix = key;
            shortestPrefixing.suffix = suffix;
          }
        }
      }
    }
    // Return the shortest prefix
    if (shortestPrefixing.prefix) {
      return shortestPrefixing.prefix + ':' + shortestPrefixing.suffix;
    }
    return iri;
  }
}
exports.JsonLdContextNormalized = JsonLdContextNormalized;

/***/ }),

/***/ "./node_modules/jsonld-context-parser/lib/Util.js":
/*!********************************************************!*\
  !*** ./node_modules/jsonld-context-parser/lib/Util.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Util = void 0;
class Util {
  /**
   * Check if the given term is a valid compact IRI.
   * Otherwise, it may be an IRI.
   * @param {string} term A term.
   * @return {boolean} If it is a compact IRI.
   */
  static isCompactIri(term) {
    return term.indexOf(':') > 0 && !(term && term[0] === '#');
  }
  /**
   * Get the prefix from the given term.
   * @see https://json-ld.org/spec/latest/json-ld/#compact-iris
   * @param {string} term A term that is an URL or a prefixed URL.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   * @return {string} The prefix or null.
   */
  static getPrefix(term, context) {
    // Do not consider relative IRIs starting with a hash as compact IRIs
    if (term && term[0] === '#') {
      return null;
    }
    const separatorPos = term.indexOf(':');
    if (separatorPos >= 0) {
      // Suffix can not begin with two slashes
      if (term.length > separatorPos + 1 && term.charAt(separatorPos + 1) === '/' && term.charAt(separatorPos + 2) === '/') {
        return null;
      }
      const prefix = term.substr(0, separatorPos);
      // Prefix can not be an underscore (this is a blank node)
      if (prefix === '_') {
        return null;
      }
      // Prefix must match a term in the active context
      if (context[prefix]) {
        return prefix;
      }
    }
    return null;
  }
  /**
   * From a given context entry value, get the string value, or the @id field.
   * @param contextValue A value for a term in a context.
   * @return {string} The id value, or null.
   */
  static getContextValueId(contextValue) {
    if (contextValue === null || typeof contextValue === 'string') {
      return contextValue;
    }
    const id = contextValue['@id'];
    return id ? id : null;
  }
  /**
   * Check if the given simple term definition (string-based value of a context term)
   * should be considered a prefix.
   * @param value A simple term definition value.
   * @param options Options that define the way how expansion must be done.
   */
  static isSimpleTermDefinitionPrefix(value, options) {
    return !Util.isPotentialKeyword(value) && (value[0] === '_' || options.allowPrefixNonGenDelims || Util.isPrefixIriEndingWithGenDelim(value));
  }
  /**
   * Check if the given keyword is of the keyword format "@"1*ALPHA.
   * @param {string} keyword A potential keyword.
   * @return {boolean} If the given keyword is of the keyword format.
   */
  static isPotentialKeyword(keyword) {
    return typeof keyword === 'string' && Util.KEYWORD_REGEX.test(keyword);
  }
  /**
   * Check if the given prefix ends with a gen-delim character.
   * @param {string} prefixIri A prefix IRI.
   * @return {boolean} If the given prefix IRI is valid.
   */
  static isPrefixIriEndingWithGenDelim(prefixIri) {
    return Util.ENDS_WITH_GEN_DELIM.test(prefixIri);
  }
  /**
   * Check if the given context value can be a prefix value.
   * @param value A context value.
   * @return {boolean} If it can be a prefix value.
   */
  static isPrefixValue(value) {
    return value && (typeof value === 'string' || value && typeof value === 'object');
  }
  /**
   * Check if the given IRI is valid.
   * @param {string} iri A potential IRI.
   * @return {boolean} If the given IRI is valid.
   */
  static isValidIri(iri) {
    return Boolean(iri && Util.IRI_REGEX.test(iri));
  }
  /**
   * Check if the given IRI is valid, this includes the possibility of being a relative IRI.
   * @param {string} iri A potential IRI.
   * @return {boolean} If the given IRI is valid.
   */
  static isValidIriWeak(iri) {
    return !!iri && iri[0] !== ':' && Util.IRI_REGEX_WEAK.test(iri);
  }
  /**
   * Check if the given keyword is a defined according to the JSON-LD specification.
   * @param {string} keyword A potential keyword.
   * @return {boolean} If the given keyword is valid.
   */
  static isValidKeyword(keyword) {
    return Util.VALID_KEYWORDS[keyword];
  }
  /**
   * Check if the given term is protected in the context.
   * @param {IJsonLdContextNormalizedRaw} context A context.
   * @param {string} key A context term.
   * @return {boolean} If the given term has an @protected flag.
   */
  static isTermProtected(context, key) {
    const value = context[key];
    return !(typeof value === 'string') && value && value['@protected'];
  }
  /**
   * Check if the given context has at least one protected term.
   * @param context A context.
   * @return If the context has a protected term.
   */
  static hasProtectedTerms(context) {
    for (const key of Object.keys(context)) {
      if (Util.isTermProtected(context, key)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check if the given key is an internal reserved keyword.
   * @param key A context key.
   */
  static isReservedInternalKeyword(key) {
    return key.startsWith('@__');
  }
}
exports.Util = Util;
// Regex for valid IRIs
Util.IRI_REGEX = /^([A-Za-z][A-Za-z0-9+-.]*|_):[^ "<>{}|\\\[\]`#]*(#[^#]*)?$/;
// Weaker regex for valid IRIs, this includes relative IRIs
Util.IRI_REGEX_WEAK = /(?::[^:])|\//;
// Regex for keyword form
Util.KEYWORD_REGEX = /^@[a-z]+$/i;
// Regex to see if an IRI ends with a gen-delim character (see RFC 3986)
Util.ENDS_WITH_GEN_DELIM = /[:/?#\[\]@]$/;
// Regex for language tags
Util.REGEX_LANGUAGE_TAG = /^[a-zA-Z]+(-[a-zA-Z0-9]+)*$/;
// Regex for base directions
Util.REGEX_DIRECTION_TAG = /^(ltr)|(rtl)$/;
// All known valid JSON-LD keywords
// @see https://www.w3.org/TR/json-ld11/#keywords
Util.VALID_KEYWORDS = {
  '@base': true,
  '@container': true,
  '@context': true,
  '@direction': true,
  '@graph': true,
  '@id': true,
  '@import': true,
  '@included': true,
  '@index': true,
  '@json': true,
  '@language': true,
  '@list': true,
  '@nest': true,
  '@none': true,
  '@prefix': true,
  '@propagate': true,
  '@protected': true,
  '@reverse': true,
  '@set': true,
  '@type': true,
  '@value': true,
  '@version': true,
  '@vocab': true
};
// Keys in the contexts that will not be expanded based on the base IRI
Util.EXPAND_KEYS_BLACKLIST = ['@base', '@vocab', '@language', '@version', '@direction'];
// Keys in the contexts that may not be aliased from
Util.ALIAS_DOMAIN_BLACKLIST = ['@container', '@graph', '@id', '@index', '@list', '@nest', '@none', '@prefix', '@reverse', '@set', '@type', '@value', '@version'];
// Keys in the contexts that may not be aliased to
Util.ALIAS_RANGE_BLACKLIST = ['@context', '@preserve'];
// All valid @container values
Util.CONTAINERS = ['@list', '@set', '@index', '@language', '@graph', '@id', '@type'];
// All valid @container values under processing mode 1.0
Util.CONTAINERS_1_0 = ['@list', '@set', '@index'];

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/index.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, {
    enumerable: true,
    get: function () {
      return m[k];
    }
  });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __exportStar = this && this.__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
__exportStar(__webpack_require__(/*! ./lib/JsonLdParser */ "./node_modules/jsonld-streaming-parser/lib/JsonLdParser.js"), exports);

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/ContextTree.js":
/*!*****************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/ContextTree.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContextTree = void 0;
/**
 * A tree structure that holds all contexts,
 * based on their position in the JSON object.
 *
 * Positions are identified by a path of keys.
 */
class ContextTree {
  constructor() {
    this.subTrees = {};
  }
  getContext(keys) {
    if (keys.length > 0) {
      const [head, ...tail] = keys;
      const subTree = this.subTrees[head];
      if (subTree) {
        const subContext = subTree.getContext(tail);
        if (subContext) {
          return subContext.then(({
            context,
            depth
          }) => ({
            context,
            depth: depth + 1
          }));
        }
      }
    }
    return this.context ? this.context.then(context => ({
      context,
      depth: 0
    })) : null;
  }
  setContext(keys, context) {
    if (keys.length === 0) {
      this.context = context;
    } else {
      const [head, ...tail] = keys;
      let subTree = this.subTrees[head];
      if (!subTree) {
        subTree = this.subTrees[head] = new ContextTree();
      }
      subTree.setContext(tail, context);
    }
  }
  removeContext(path) {
    this.setContext(path, null);
  }
}
exports.ContextTree = ContextTree;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/JsonLdParser.js":
/*!******************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/JsonLdParser.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JsonLdParser = void 0;
// tslint:disable-next-line:no-var-requires
const Parser = __webpack_require__(/*! jsonparse */ "./node_modules/jsonparse/jsonparse.js");
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const stream_1 = __webpack_require__(/*! stream */ "./node_modules/readable-stream/readable-browser.js");
const EntryHandlerArrayValue_1 = __webpack_require__(/*! ./entryhandler/EntryHandlerArrayValue */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerArrayValue.js");
const EntryHandlerContainer_1 = __webpack_require__(/*! ./entryhandler/EntryHandlerContainer */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerContainer.js");
const EntryHandlerInvalidFallback_1 = __webpack_require__(/*! ./entryhandler/EntryHandlerInvalidFallback */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerInvalidFallback.js");
const EntryHandlerPredicate_1 = __webpack_require__(/*! ./entryhandler/EntryHandlerPredicate */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerPredicate.js");
const EntryHandlerKeywordContext_1 = __webpack_require__(/*! ./entryhandler/keyword/EntryHandlerKeywordContext */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordContext.js");
const EntryHandlerKeywordGraph_1 = __webpack_require__(/*! ./entryhandler/keyword/EntryHandlerKeywordGraph */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordGraph.js");
const EntryHandlerKeywordId_1 = __webpack_require__(/*! ./entryhandler/keyword/EntryHandlerKeywordId */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordId.js");
const EntryHandlerKeywordIncluded_1 = __webpack_require__(/*! ./entryhandler/keyword/EntryHandlerKeywordIncluded */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordIncluded.js");
const EntryHandlerKeywordNest_1 = __webpack_require__(/*! ./entryhandler/keyword/EntryHandlerKeywordNest */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordNest.js");
const EntryHandlerKeywordType_1 = __webpack_require__(/*! ./entryhandler/keyword/EntryHandlerKeywordType */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordType.js");
const EntryHandlerKeywordUnknownFallback_1 = __webpack_require__(/*! ./entryhandler/keyword/EntryHandlerKeywordUnknownFallback */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordUnknownFallback.js");
const EntryHandlerKeywordValue_1 = __webpack_require__(/*! ./entryhandler/keyword/EntryHandlerKeywordValue */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordValue.js");
const ParsingContext_1 = __webpack_require__(/*! ./ParsingContext */ "./node_modules/jsonld-streaming-parser/lib/ParsingContext.js");
const Util_1 = __webpack_require__(/*! ./Util */ "./node_modules/jsonld-streaming-parser/lib/Util.js");
const http_link_header_1 = __webpack_require__(/*! http-link-header */ "./node_modules/http-link-header/lib/link.js");
/**
 * A stream transformer that parses JSON-LD (text) streams to an {@link RDF.Stream}.
 */
class JsonLdParser extends stream_1.Transform {
  constructor(options) {
    super({
      readableObjectMode: true
    });
    options = options || {};
    this.options = options;
    this.parsingContext = new ParsingContext_1.ParsingContext(Object.assign({
      parser: this
    }, options));
    this.util = new Util_1.Util({
      dataFactory: options.dataFactory,
      parsingContext: this.parsingContext
    });
    this.jsonParser = new Parser();
    this.contextJobs = [];
    this.typeJobs = [];
    this.contextAwaitingJobs = [];
    this.lastDepth = 0;
    this.lastKeys = [];
    this.lastOnValueJob = Promise.resolve();
    this.attachJsonParserListeners();
    this.on('end', () => {
      if (typeof this.jsonParser.mode !== 'undefined') {
        this.emit('error', new Error('Unclosed document'));
      }
    });
  }
  /**
   * Construct a JsonLdParser from the given HTTP response.
   *
   * This will throw an error if no valid JSON response is received
   * (application/ld+json, application/json, or something+json).
   *
   * For raw JSON responses, exactly one link header pointing to a JSON-LD context is required.
   *
   * This method is not responsible for handling redirects.
   *
   * @param baseIRI The URI of the received response.
   * @param mediaType The received content type.
   * @param headers Optional HTTP headers.
   * @param options Optional parser options.
   */
  static fromHttpResponse(baseIRI, mediaType, headers, options) {
    let context;
    // Special cases when receiving something else than the JSON-LD media type
    if (mediaType !== 'application/ld+json') {
      // Only accept JSON or JSON extension types
      if (mediaType !== 'application/json' && !mediaType.endsWith('+json')) {
        throw new jsonld_context_parser_1.ErrorCoded(`Unsupported JSON-LD media type ${mediaType}`, jsonld_context_parser_1.ERROR_CODES.LOADING_DOCUMENT_FAILED);
      }
      // We need exactly one JSON-LD context in the link header
      if (headers && headers.has('Link')) {
        headers.forEach((value, key) => {
          if (key === 'link') {
            const linkHeader = http_link_header_1.parse(value);
            for (const link of linkHeader.get('rel', 'http://www.w3.org/ns/json-ld#context')) {
              if (context) {
                throw new jsonld_context_parser_1.ErrorCoded('Multiple JSON-LD context link headers were found on ' + baseIRI, jsonld_context_parser_1.ERROR_CODES.MULTIPLE_CONTEXT_LINK_HEADERS);
              }
              context = link.uri;
            }
          }
        });
      }
      if (!context && !(options === null || options === void 0 ? void 0 : options.ignoreMissingContextLinkHeader)) {
        throw new jsonld_context_parser_1.ErrorCoded(`Missing context link header for media type ${mediaType} on ${baseIRI}`, jsonld_context_parser_1.ERROR_CODES.LOADING_DOCUMENT_FAILED);
      }
    }
    // Check if the streaming profile is present
    let streamingProfile;
    if (headers && headers.has('Content-Type')) {
      const contentType = headers.get('Content-Type');
      const match = /; *profile=([^"]*)/.exec(contentType);
      if (match && match[1] === 'http://www.w3.org/ns/json-ld#streaming') {
        streamingProfile = true;
      }
    }
    return new JsonLdParser(Object.assign({
      baseIRI,
      context,
      streamingProfile
    }, options ? options : {}));
  }
  /**
   * Parses the given text stream into a quad stream.
   * @param {NodeJS.EventEmitter} stream A text stream.
   * @return {RDF.Stream} A quad stream.
   */
  import(stream) {
    const output = new stream_1.PassThrough({
      readableObjectMode: true
    });
    stream.on('error', error => parsed.emit('error', error));
    stream.on('data', data => output.push(data));
    stream.on('end', () => output.push(null));
    const parsed = output.pipe(new JsonLdParser(this.options));
    return parsed;
  }
  _transform(chunk, encoding, callback) {
    this.jsonParser.write(chunk);
    this.lastOnValueJob.then(() => callback(), error => callback(error));
  }
  /**
   * Start a new job for parsing the given value.
   *
   * This will let the first valid {@link IEntryHandler} handle the entry.
   *
   * @param {any[]} keys The stack of keys.
   * @param value The value to parse.
   * @param {number} depth The depth to parse at.
   * @param {boolean} lastDepthCheck If the lastDepth check should be done for buffer draining.
   * @return {Promise<void>} A promise resolving when the job is done.
   */
  async newOnValueJob(keys, value, depth, lastDepthCheck) {
    let flushStacks = true;
    // When we go up the stack, emit all unidentified values
    // We need to do this before the new job, because the new job may require determined values from the flushed jobs.
    if (lastDepthCheck && depth < this.lastDepth) {
      // Check if we had any RDF lists that need to be terminated with an rdf:nil
      const listPointer = this.parsingContext.listPointerStack[this.lastDepth];
      if (listPointer) {
        // Terminate the list if the had at least one value
        if (listPointer.value) {
          this.emit('data', this.util.dataFactory.quad(listPointer.value, this.util.rdfRest, this.util.rdfNil, this.util.getDefaultGraph()));
        }
        // Add the list id to the id stack, so it can be used higher up in the stack
        listPointer.listId.listHead = true;
        this.parsingContext.idStack[listPointer.listRootDepth + 1] = [listPointer.listId];
        this.parsingContext.listPointerStack.splice(this.lastDepth, 1);
      }
      // Flush the buffer for lastDepth
      // If the parent key is a special type of container, postpone flushing until that parent is handled.
      if (await EntryHandlerContainer_1.EntryHandlerContainer.isBufferableContainerHandler(this.parsingContext, this.lastKeys, this.lastDepth)) {
        this.parsingContext.pendingContainerFlushBuffers.push({
          depth: this.lastDepth,
          keys: this.lastKeys.slice(0, this.lastKeys.length)
        });
        flushStacks = false;
      } else {
        await this.flushBuffer(this.lastDepth, this.lastKeys);
      }
    }
    const key = await this.util.unaliasKeyword(keys[depth], keys, depth);
    const parentKey = await this.util.unaliasKeywordParent(keys, depth);
    this.parsingContext.emittedStack[depth] = true;
    let handleKey = true;
    // Keywords inside @reverse is not allowed apart from @context
    if (jsonld_context_parser_1.Util.isValidKeyword(key) && parentKey === '@reverse' && key !== '@context') {
      this.emit('error', new jsonld_context_parser_1.ErrorCoded(`Found the @id '${value}' inside an @reverse property`, jsonld_context_parser_1.ERROR_CODES.INVALID_REVERSE_PROPERTY_MAP));
    }
    // Skip further processing if one of the parent nodes are invalid.
    // We use the validationStack to reuse validation results that were produced before with common key stacks.
    let inProperty = false;
    if (this.parsingContext.validationStack.length > 1) {
      inProperty = this.parsingContext.validationStack[this.parsingContext.validationStack.length - 1].property;
    }
    for (let i = Math.max(1, this.parsingContext.validationStack.length - 1); i < keys.length - 1; i++) {
      const validationResult = this.parsingContext.validationStack[i] || (this.parsingContext.validationStack[i] = await this.validateKey(keys.slice(0, i + 1), i, inProperty));
      if (!validationResult.valid) {
        this.parsingContext.emittedStack[depth] = false;
        handleKey = false;
        break;
      } else if (!inProperty && validationResult.property) {
        inProperty = true;
      }
    }
    // Skip further processing if this node is part of a literal
    if (this.util.isLiteral(depth)) {
      handleKey = false;
    }
    // Get handler
    if (handleKey) {
      for (const entryHandler of JsonLdParser.ENTRY_HANDLERS) {
        const testResult = await entryHandler.test(this.parsingContext, this.util, key, keys, depth);
        if (testResult) {
          // Pass processing over to the handler
          await entryHandler.handle(this.parsingContext, this.util, key, keys, value, depth, testResult);
          // Flag that this depth is processed
          if (entryHandler.isStackProcessor()) {
            this.parsingContext.processingStack[depth] = true;
          }
          break;
        }
      }
    }
    // Validate value indexes on the root.
    if (depth === 0 && Array.isArray(value)) {
      await this.util.validateValueIndexes(value);
    }
    // When we go up the stack, flush the old stack
    if (flushStacks && depth < this.lastDepth) {
      // Reset our stacks
      this.flushStacks(this.lastDepth);
    }
    this.lastDepth = depth;
    this.lastKeys = keys;
    // Clear the keyword cache at this depth, and everything underneath.
    this.parsingContext.unaliasedKeywordCacheStack.splice(depth - 1);
  }
  /**
   * Flush the processing stacks at the given depth.
   * @param {number} depth A depth.
   */
  flushStacks(depth) {
    this.parsingContext.processingStack.splice(depth, 1);
    this.parsingContext.processingType.splice(depth, 1);
    this.parsingContext.emittedStack.splice(depth, 1);
    this.parsingContext.idStack.splice(depth, 1);
    this.parsingContext.graphStack.splice(depth + 1, 1);
    this.parsingContext.graphContainerTermStack.splice(depth, 1);
    this.parsingContext.jsonLiteralStack.splice(depth, 1);
    this.parsingContext.validationStack.splice(depth - 1, 2);
    this.parsingContext.literalStack.splice(depth, this.parsingContext.literalStack.length - depth);
    // TODO: just like the literal stack, splice all other stack until the end as well?
  }
  /**
   * Flush buffers for the given depth.
   *
   * This should be called after the last entry at a given depth was processed.
   *
   * @param {number} depth A depth.
   * @param {any[]} keys A stack of keys.
   * @return {Promise<void>} A promise resolving if flushing is done.
   */
  async flushBuffer(depth, keys) {
    let subjects = this.parsingContext.idStack[depth];
    if (!subjects) {
      subjects = this.parsingContext.idStack[depth] = [this.util.dataFactory.blankNode()];
    }
    // Flush values at this level
    const valueBuffer = this.parsingContext.unidentifiedValuesBuffer[depth];
    if (valueBuffer) {
      for (const subject of subjects) {
        const depthOffsetGraph = await this.util.getDepthOffsetGraph(depth, keys);
        const graphs = this.parsingContext.graphStack[depth] || depthOffsetGraph >= 0 ? this.parsingContext.idStack[depth - depthOffsetGraph - 1] : [await this.util.getGraphContainerValue(keys, depth)];
        if (graphs) {
          for (const graph of graphs) {
            // Flush values to stream if the graph @id is known
            this.parsingContext.emittedStack[depth] = true;
            for (const bufferedValue of valueBuffer) {
              if (bufferedValue.reverse) {
                this.parsingContext.emitQuad(depth, this.util.dataFactory.quad(bufferedValue.object, bufferedValue.predicate, subject, graph));
              } else {
                this.parsingContext.emitQuad(depth, this.util.dataFactory.quad(subject, bufferedValue.predicate, bufferedValue.object, graph));
              }
            }
          }
        } else {
          // Place the values in the graphs buffer if the graph @id is not yet known
          const subGraphBuffer = this.parsingContext.getUnidentifiedGraphBufferSafe(depth - (await this.util.getDepthOffsetGraph(depth, keys)) - 1);
          for (const bufferedValue of valueBuffer) {
            if (bufferedValue.reverse) {
              subGraphBuffer.push({
                object: subject,
                predicate: bufferedValue.predicate,
                subject: bufferedValue.object
              });
            } else {
              subGraphBuffer.push({
                object: bufferedValue.object,
                predicate: bufferedValue.predicate,
                subject
              });
            }
          }
        }
      }
      this.parsingContext.unidentifiedValuesBuffer.splice(depth, 1);
      this.parsingContext.literalStack.splice(depth, 1);
      this.parsingContext.jsonLiteralStack.splice(depth, 1);
    }
    // Flush graphs at this level
    const graphBuffer = this.parsingContext.unidentifiedGraphsBuffer[depth];
    if (graphBuffer) {
      for (const subject of subjects) {
        // A @graph statement at the root without @id relates to the default graph,
        // unless there are top-level properties,
        // others relate to blank nodes.
        const graph = depth === 1 && subject.termType === 'BlankNode' && !this.parsingContext.topLevelProperties ? this.util.getDefaultGraph() : subject;
        this.parsingContext.emittedStack[depth] = true;
        for (const bufferedValue of graphBuffer) {
          this.parsingContext.emitQuad(depth, this.util.dataFactory.quad(bufferedValue.subject, bufferedValue.predicate, bufferedValue.object, graph));
        }
      }
      this.parsingContext.unidentifiedGraphsBuffer.splice(depth, 1);
    }
  }
  /**
   * Check if at least one {@link IEntryHandler} validates the entry to true.
   * @param {any[]} keys A stack of keys.
   * @param {number} depth A depth.
   * @param {boolean} inProperty If the current depth is part of a valid property node.
   * @return {Promise<{ valid: boolean, property: boolean }>} A promise resolving to true or false.
   */
  async validateKey(keys, depth, inProperty) {
    for (const entryHandler of JsonLdParser.ENTRY_HANDLERS) {
      if (await entryHandler.validate(this.parsingContext, this.util, keys, depth, inProperty)) {
        return {
          valid: true,
          property: inProperty || entryHandler.isPropertyHandler()
        };
      }
    }
    return {
      valid: false,
      property: false
    };
  }
  /**
   * Attach all required listeners to the JSON parser.
   *
   * This should only be called once.
   */
  attachJsonParserListeners() {
    // Listen to json parser events
    this.jsonParser.onValue = value => {
      const depth = this.jsonParser.stack.length;
      const keys = new Array(depth + 1).fill(0).map((v, i) => {
        return i === depth ? this.jsonParser.key : this.jsonParser.stack[i].key;
      });
      if (!this.isParsingContextInner(depth)) {
        // Don't parse inner nodes inside @context
        const valueJobCb = () => this.newOnValueJob(keys, value, depth, true);
        if (!this.parsingContext.streamingProfile && !this.parsingContext.contextTree.getContext(keys.slice(0, -1))) {
          // If an out-of-order context is allowed,
          // we have to buffer everything.
          // We store jobs for @context's and @type's separately,
          // because at the end, we have to process them first.
          // We also handle @type because these *could* introduce a type-scoped context.
          if (keys[depth] === '@context') {
            let jobs = this.contextJobs[depth];
            if (!jobs) {
              jobs = this.contextJobs[depth] = [];
            }
            jobs.push(valueJobCb);
          } else if (keys[depth] === '@type' || typeof keys[depth] === 'number' && keys[depth - 1] === '@type') {
            // Also capture @type with array values
            // Remove @type from keys, because we want it to apply to parent later on
            this.typeJobs.push({
              job: valueJobCb,
              keys: keys.slice(0, keys.length - 1)
            });
          } else {
            this.contextAwaitingJobs.push({
              job: valueJobCb,
              keys
            });
          }
        } else {
          // Make sure that our value jobs are chained synchronously
          this.lastOnValueJob = this.lastOnValueJob.then(valueJobCb);
        }
        // Execute all buffered jobs on deeper levels
        if (!this.parsingContext.streamingProfile && depth === 0) {
          this.lastOnValueJob = this.lastOnValueJob.then(() => this.executeBufferedJobs());
        }
      }
    };
    this.jsonParser.onError = error => {
      this.emit('error', error);
    };
  }
  /**
   * Check if the parser is currently parsing an element that is part of an @context entry.
   * @param {number} depth A depth.
   * @return {boolean} A boolean.
   */
  isParsingContextInner(depth) {
    for (let i = depth; i > 0; i--) {
      if (this.jsonParser.stack[i - 1].key === '@context') {
        return true;
      }
    }
    return false;
  }
  /**
   * Execute all buffered jobs.
   * @return {Promise<void>} A promise resolving if all jobs are finished.
   */
  async executeBufferedJobs() {
    // Handle context jobs
    for (const jobs of this.contextJobs) {
      if (jobs) {
        for (const job of jobs) {
          await job();
        }
      }
    }
    // Clear the keyword cache.
    this.parsingContext.unaliasedKeywordCacheStack.splice(0);
    // Handle non-context jobs
    for (const job of this.contextAwaitingJobs) {
      // Check if we have a type (with possible type-scoped context) that should be handled before.
      // We check all possible parent nodes for the current job, from root to leaves.
      if (this.typeJobs.length > 0) {
        // First collect all applicable type jobs
        const applicableTypeJobs = [];
        const applicableTypeJobIds = [];
        for (let i = 0; i < this.typeJobs.length; i++) {
          const typeJob = this.typeJobs[i];
          if (Util_1.Util.isPrefixArray(typeJob.keys, job.keys)) {
            applicableTypeJobs.push(typeJob);
            applicableTypeJobIds.push(i);
          }
        }
        // Next, sort the jobs from short to long key length (to ensure types higher up in the tree to be handled first)
        const sortedTypeJobs = applicableTypeJobs.sort((job1, job2) => job1.keys.length - job2.keys.length);
        // Finally, execute the jobs in order
        for (const typeJob of sortedTypeJobs) {
          await typeJob.job();
        }
        // Remove the executed type jobs
        // Sort first, so we can efficiently splice
        const sortedApplicableTypeJobIds = applicableTypeJobIds.sort().reverse();
        for (const jobId of sortedApplicableTypeJobIds) {
          this.typeJobs.splice(jobId, 1);
        }
      }
      await job.job();
    }
  }
}
exports.JsonLdParser = JsonLdParser;
JsonLdParser.DEFAULT_PROCESSING_MODE = '1.1';
JsonLdParser.ENTRY_HANDLERS = [new EntryHandlerArrayValue_1.EntryHandlerArrayValue(), new EntryHandlerKeywordContext_1.EntryHandlerKeywordContext(), new EntryHandlerKeywordId_1.EntryHandlerKeywordId(), new EntryHandlerKeywordIncluded_1.EntryHandlerKeywordIncluded(), new EntryHandlerKeywordGraph_1.EntryHandlerKeywordGraph(), new EntryHandlerKeywordNest_1.EntryHandlerKeywordNest(), new EntryHandlerKeywordType_1.EntryHandlerKeywordType(), new EntryHandlerKeywordValue_1.EntryHandlerKeywordValue(), new EntryHandlerContainer_1.EntryHandlerContainer(), new EntryHandlerKeywordUnknownFallback_1.EntryHandlerKeywordUnknownFallback(), new EntryHandlerPredicate_1.EntryHandlerPredicate(), new EntryHandlerInvalidFallback_1.EntryHandlerInvalidFallback()];

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/ParsingContext.js":
/*!********************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/ParsingContext.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParsingContext = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const ErrorCoded_1 = __webpack_require__(/*! jsonld-context-parser/lib/ErrorCoded */ "./node_modules/jsonld-context-parser/lib/ErrorCoded.js");
const ContextTree_1 = __webpack_require__(/*! ./ContextTree */ "./node_modules/jsonld-streaming-parser/lib/ContextTree.js");
const JsonLdParser_1 = __webpack_require__(/*! ./JsonLdParser */ "./node_modules/jsonld-streaming-parser/lib/JsonLdParser.js");
/**
 * Data holder for parsing information.
 */
class ParsingContext {
  constructor(options) {
    // Initialize settings
    this.contextParser = new jsonld_context_parser_1.ContextParser({
      documentLoader: options.documentLoader,
      skipValidation: options.skipContextValidation
    });
    this.streamingProfile = !!options.streamingProfile;
    this.baseIRI = options.baseIRI;
    this.produceGeneralizedRdf = !!options.produceGeneralizedRdf;
    this.allowSubjectList = !!options.allowSubjectList;
    this.processingMode = options.processingMode || JsonLdParser_1.JsonLdParser.DEFAULT_PROCESSING_MODE;
    this.strictValues = !!options.strictValues;
    this.validateValueIndexes = !!options.validateValueIndexes;
    this.defaultGraph = options.defaultGraph;
    this.rdfDirection = options.rdfDirection;
    this.normalizeLanguageTags = options.normalizeLanguageTags;
    this.streamingProfileAllowOutOfOrderPlainType = options.streamingProfileAllowOutOfOrderPlainType;
    this.topLevelProperties = false;
    this.activeProcessingMode = parseFloat(this.processingMode);
    // Initialize stacks
    this.processingStack = [];
    this.processingType = [];
    this.emittedStack = [];
    this.idStack = [];
    this.graphStack = [];
    this.graphContainerTermStack = [];
    this.listPointerStack = [];
    this.contextTree = new ContextTree_1.ContextTree();
    this.literalStack = [];
    this.validationStack = [];
    this.unaliasedKeywordCacheStack = [];
    this.jsonLiteralStack = [];
    this.unidentifiedValuesBuffer = [];
    this.unidentifiedGraphsBuffer = [];
    this.pendingContainerFlushBuffers = [];
    this.parser = options.parser;
    if (options.context) {
      this.rootContext = this.parseContext(options.context);
      this.rootContext.then(context => this.validateContext(context));
    } else {
      this.rootContext = Promise.resolve(new jsonld_context_parser_1.JsonLdContextNormalized(this.baseIRI ? {
        '@base': this.baseIRI,
        '@__baseDocument': true
      } : {}));
    }
  }
  /**
   * Parse the given context with the configured options.
   * @param {JsonLdContext} context A context to parse.
   * @param {JsonLdContextNormalized} parentContext An optional parent context.
   * @param {boolean} ignoreProtection If @protected term checks should be ignored.
   * @return {Promise<JsonLdContextNormalized>} A promise resolving to the parsed context.
   */
  async parseContext(context, parentContext, ignoreProtection) {
    return this.contextParser.parse(context, {
      baseIRI: this.baseIRI,
      ignoreProtection,
      normalizeLanguageTags: this.normalizeLanguageTags,
      parentContext,
      processingMode: this.activeProcessingMode
    });
  }
  /**
   * Check if the given context is valid.
   * If not, an error will be thrown.
   * @param {JsonLdContextNormalized} context A context.
   */
  validateContext(context) {
    const activeVersion = context.getContextRaw()['@version'];
    if (activeVersion) {
      if (this.activeProcessingMode && activeVersion > this.activeProcessingMode) {
        throw new ErrorCoded_1.ErrorCoded(`Unsupported JSON-LD version '${activeVersion}' under active processing mode ${this.activeProcessingMode}.`, ErrorCoded_1.ERROR_CODES.PROCESSING_MODE_CONFLICT);
      } else {
        if (this.activeProcessingMode && activeVersion < this.activeProcessingMode) {
          throw new ErrorCoded_1.ErrorCoded(`Invalid JSON-LD version ${activeVersion} under active processing mode ${this.activeProcessingMode}.`, ErrorCoded_1.ERROR_CODES.INVALID_VERSION_VALUE);
        }
        this.activeProcessingMode = activeVersion;
      }
    }
  }
  /**
   * Get the context at the given path.
   * @param {keys} keys The path of keys to get the context at.
   * @param {number} offset The path offset, defaults to 1.
   * @return {Promise<JsonLdContextNormalized>} A promise resolving to a context.
   */
  async getContext(keys, offset = 1) {
    const keysOriginal = keys;
    // Ignore array keys at the end
    while (typeof keys[keys.length - 1] === 'number') {
      keys = keys.slice(0, keys.length - 1);
    }
    // Handle offset on keys
    if (offset) {
      keys = keys.slice(0, -offset);
    }
    // Determine the closest context
    const contextData = await this.getContextPropagationAware(keys);
    const context = contextData.context;
    // Process property-scoped contexts (high-to-low)
    let contextRaw = context.getContextRaw();
    for (let i = contextData.depth; i < keysOriginal.length - offset; i++) {
      const key = keysOriginal[i];
      const contextKeyEntry = contextRaw[key];
      if (contextKeyEntry && typeof contextKeyEntry === 'object' && '@context' in contextKeyEntry) {
        const scopedContext = (await this.parseContext(contextKeyEntry, contextRaw, true)).getContextRaw();
        const propagate = !(key in scopedContext) || scopedContext[key]['@context']['@propagate']; // Propagation is true by default
        if (propagate !== false || i === keysOriginal.length - 1 - offset) {
          contextRaw = scopedContext;
          // Clean up final context
          delete contextRaw['@propagate'];
          contextRaw[key] = Object.assign({}, contextRaw[key]);
          if ('@id' in contextKeyEntry) {
            contextRaw[key]['@id'] = contextKeyEntry['@id'];
          }
          delete contextRaw[key]['@context'];
          if (propagate !== false) {
            this.contextTree.setContext(keysOriginal.slice(0, i + offset), Promise.resolve(new jsonld_context_parser_1.JsonLdContextNormalized(contextRaw)));
          }
        }
      }
    }
    return new jsonld_context_parser_1.JsonLdContextNormalized(contextRaw);
  }
  /**
   * Get the context at the given path.
   * Non-propagating contexts will be skipped,
   * unless the context at that exact depth is retrieved.
   *
   * This ONLY takes into account context propagation logic,
   * so this should usually not be called directly,
   * call {@link #getContext} instead.
   *
   * @param keys The path of keys to get the context at.
   * @return {Promise<{ context: JsonLdContextNormalized, depth: number }>} A context and its depth.
   */
  async getContextPropagationAware(keys) {
    const originalDepth = keys.length;
    let contextData = null;
    let hasApplicablePropertyScopedContext;
    do {
      hasApplicablePropertyScopedContext = false;
      if (contextData && '@__propagateFallback' in contextData.context.getContextRaw()) {
        // If a propagation fallback context has been set,
        // fallback to that context and retry for the same depth.
        contextData.context = new jsonld_context_parser_1.JsonLdContextNormalized(contextData.context.getContextRaw()['@__propagateFallback']);
      } else {
        if (contextData) {
          // If we had a previous iteration, jump to the parent of context depth.
          // We must do this because once we get here, last context had propagation disabled,
          // so we check its first parent instead.
          keys = keys.slice(0, contextData.depth - 1);
        }
        contextData = (await this.contextTree.getContext(keys)) || {
          context: await this.rootContext,
          depth: 0
        };
      }
      // Allow non-propagating contexts to propagate one level deeper
      // if it defines a property-scoped context that is applicable for the current key.
      // @see https://w3c.github.io/json-ld-api/tests/toRdf-manifest#tc012
      const lastKey = keys[keys.length - 1];
      if (lastKey in contextData.context.getContextRaw()) {
        const lastKeyValue = contextData.context.getContextRaw()[lastKey];
        if (lastKeyValue && typeof lastKeyValue === 'object' && '@context' in lastKeyValue) {
          hasApplicablePropertyScopedContext = true;
        }
      }
    } while (contextData.depth > 0 // Root context has a special case
    && contextData.context.getContextRaw()['@propagate'] === false // Stop loop if propagation is true
    && contextData.depth !== originalDepth // Stop loop if requesting exact depth of non-propagating
    && !hasApplicablePropertyScopedContext);
    // Special case for root context that does not allow propagation.
    // Fallback to empty context in that case.
    if (contextData.depth === 0 && contextData.context.getContextRaw()['@propagate'] === false && contextData.depth !== originalDepth) {
      contextData.context = new jsonld_context_parser_1.JsonLdContextNormalized({});
    }
    return contextData;
  }
  /**
   * Start a new job for parsing the given value.
   * @param {any[]} keys The stack of keys.
   * @param value The value to parse.
   * @param {number} depth The depth to parse at.
   * @param {boolean} lastDepthCheck If the lastDepth check should be done for buffer draining.
   * @return {Promise<void>} A promise resolving when the job is done.
   */
  async newOnValueJob(keys, value, depth, lastDepthCheck) {
    await this.parser.newOnValueJob(keys, value, depth, lastDepthCheck);
  }
  /**
   * Flush the pending container flush buffers
   * @return {boolean} If any pending buffers were flushed.
   */
  async handlePendingContainerFlushBuffers() {
    if (this.pendingContainerFlushBuffers.length > 0) {
      for (const pendingFlushBuffer of this.pendingContainerFlushBuffers) {
        await this.parser.flushBuffer(pendingFlushBuffer.depth, pendingFlushBuffer.keys);
        this.parser.flushStacks(pendingFlushBuffer.depth);
      }
      this.pendingContainerFlushBuffers.splice(0, this.pendingContainerFlushBuffers.length);
      return true;
    } else {
      return false;
    }
  }
  /**
   * Emit the given quad into the output stream.
   * @param {number} depth The depth the quad was generated at.
   * @param {Quad} quad A quad to emit.
   */
  emitQuad(depth, quad) {
    if (depth === 1) {
      this.topLevelProperties = true;
    }
    this.parser.push(quad);
  }
  /**
   * Emit the given error into the output stream.
   * @param {Error} error An error to emit.
   */
  emitError(error) {
    this.parser.emit('error', error);
  }
  /**
   * Emit the given context into the output stream under the 'context' event.
   * @param {JsonLdContext} context A context to emit.
   */
  emitContext(context) {
    this.parser.emit('context', context);
  }
  /**
   * Safely get or create the depth value of {@link ParsingContext.unidentifiedValuesBuffer}.
   * @param {number} depth A depth.
   * @return {{predicate: Term; object: Term; reverse: boolean}[]} An element of
   *                                                               {@link ParsingContext.unidentifiedValuesBuffer}.
   */
  getUnidentifiedValueBufferSafe(depth) {
    let buffer = this.unidentifiedValuesBuffer[depth];
    if (!buffer) {
      buffer = [];
      this.unidentifiedValuesBuffer[depth] = buffer;
    }
    return buffer;
  }
  /**
   * Safely get or create the depth value of {@link ParsingContext.unidentifiedGraphsBuffer}.
   * @param {number} depth A depth.
   * @return {{predicate: Term; object: Term; reverse: boolean}[]} An element of
   *                                                               {@link ParsingContext.unidentifiedGraphsBuffer}.
   */
  getUnidentifiedGraphBufferSafe(depth) {
    let buffer = this.unidentifiedGraphsBuffer[depth];
    if (!buffer) {
      buffer = [];
      this.unidentifiedGraphsBuffer[depth] = buffer;
    }
    return buffer;
  }
  /**
   * @return IExpandOptions The expand options for the active processing mode.
   */
  getExpandOptions() {
    return ParsingContext.EXPAND_OPTIONS[this.activeProcessingMode];
  }
  /**
   * Shift the stack at the given offset to the given depth.
   *
   * This will override anything in the stack at `depth`,
   * and this will remove anything at `depth + depthOffset`
   *
   * @param depth The target depth.
   * @param depthOffset The origin depth, relative to `depth`.
   */
  shiftStack(depth, depthOffset) {
    // Copy the id stack value up one level so that the next job can access the id.
    const deeperIdStack = this.idStack[depth + depthOffset];
    if (deeperIdStack) {
      this.idStack[depth] = deeperIdStack;
      this.emittedStack[depth] = true;
      delete this.idStack[depth + depthOffset];
    }
    // Shorten key stack
    if (this.pendingContainerFlushBuffers.length) {
      for (const buffer of this.pendingContainerFlushBuffers) {
        if (buffer.depth >= depth + depthOffset) {
          buffer.depth -= depthOffset;
          buffer.keys.splice(depth, depthOffset);
        }
      }
    }
    // Splice stacks
    if (this.unidentifiedValuesBuffer[depth + depthOffset]) {
      this.unidentifiedValuesBuffer[depth] = this.unidentifiedValuesBuffer[depth + depthOffset];
      delete this.unidentifiedValuesBuffer[depth + depthOffset];
    }
    // TODO: also do the same for other stacks
  }
}

exports.ParsingContext = ParsingContext;
ParsingContext.EXPAND_OPTIONS = {
  1.0: {
    allowPrefixForcing: false,
    allowPrefixNonGenDelims: false,
    allowVocabRelativeToBase: false
  },
  1.1: {
    allowPrefixForcing: true,
    allowPrefixNonGenDelims: false,
    allowVocabRelativeToBase: true
  }
};

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/Util.js":
/*!**********************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/Util.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Util = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const rdf_data_factory_1 = __webpack_require__(/*! rdf-data-factory */ "./node_modules/rdf-data-factory/index.js");
const EntryHandlerContainer_1 = __webpack_require__(/*! ./entryhandler/EntryHandlerContainer */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerContainer.js");
// tslint:disable-next-line:no-var-requires
const canonicalizeJson = __webpack_require__(/*! canonicalize */ "./node_modules/canonicalize/lib/canonicalize.js");
/**
 * Utility functions and methods.
 */
class Util {
  constructor(options) {
    this.parsingContext = options.parsingContext;
    this.dataFactory = options.dataFactory || new rdf_data_factory_1.DataFactory();
    this.rdfFirst = this.dataFactory.namedNode(Util.RDF + 'first');
    this.rdfRest = this.dataFactory.namedNode(Util.RDF + 'rest');
    this.rdfNil = this.dataFactory.namedNode(Util.RDF + 'nil');
    this.rdfType = this.dataFactory.namedNode(Util.RDF + 'type');
    this.rdfJson = this.dataFactory.namedNode(Util.RDF + 'JSON');
  }
  /**
   * Helper function to get the value of a context entry,
   * or fallback to a certain value.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} contextKey A pre-defined JSON-LD key in context entries.
   * @param {string} key A context entry key.
   * @param {string} fallback A fallback value for when the given contextKey
   *                          could not be found in the value with the given key.
   * @return {string} The value of the given contextKey in the entry behind key in the given context,
   *                  or the given fallback value.
   */
  static getContextValue(context, contextKey, key, fallback) {
    const entry = context.getContextRaw()[key];
    if (!entry) {
      return fallback;
    }
    const type = entry[contextKey];
    return type === undefined ? fallback : type;
  }
  /**
   * Get the container type of the given key in the context.
   *
   * Should any context-scoping bugs should occur related to this in the future,
   * it may be required to increase the offset from the depth at which the context is retrieved by one (to 2).
   * This is because containers act 2 levels deep.
   *
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key A context entry key.
   * @return {string} The container type.
   */
  static getContextValueContainer(context, key) {
    return Util.getContextValue(context, '@container', key, {
      '@set': true
    });
  }
  /**
   * Get the value type of the given key in the context.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key A context entry key.
   * @return {string} The node type.
   */
  static getContextValueType(context, key) {
    const valueType = Util.getContextValue(context, '@type', key, null);
    if (valueType === '@none') {
      return null;
    }
    return valueType;
  }
  /**
   * Get the language of the given key in the context.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key A context entry key.
   * @return {string} The node type.
   */
  static getContextValueLanguage(context, key) {
    return Util.getContextValue(context, '@language', key, context.getContextRaw()['@language'] || null);
  }
  /**
   * Get the direction of the given key in the context.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key A context entry key.
   * @return {string} The node type.
   */
  static getContextValueDirection(context, key) {
    return Util.getContextValue(context, '@direction', key, context.getContextRaw()['@direction'] || null);
  }
  /**
   * Check if the given key in the context is a reversed property.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key A context entry key.
   * @return {boolean} If the context value has a @reverse key.
   */
  static isContextValueReverse(context, key) {
    return !!Util.getContextValue(context, '@reverse', key, null);
  }
  /**
   * Get the @index of the given key in the context.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key A context entry key.
   * @return {string} The index.
   */
  static getContextValueIndex(context, key) {
    return Util.getContextValue(context, '@index', key, context.getContextRaw()['@index'] || null);
  }
  /**
   * Check if the given key refers to a reversed property.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key The property key.
   * @param {string} parentKey The parent key.
   * @return {boolean} If the property must be reversed.
   */
  static isPropertyReverse(context, key, parentKey) {
    // '!==' is needed because reversed properties in a @reverse container should cancel each other out.
    return parentKey === '@reverse' !== Util.isContextValueReverse(context, key);
  }
  /**
   * Check if the given IRI is valid.
   * @param {string} iri A potential IRI.
   * @return {boolean} If the given IRI is valid.
   */
  static isValidIri(iri) {
    return iri !== null && jsonld_context_parser_1.Util.isValidIri(iri);
  }
  /**
   * Check if the given first array (needle) is a prefix of the given second array (haystack).
   * @param needle An array to check if it is a prefix.
   * @param haystack An array to look in.
   */
  static isPrefixArray(needle, haystack) {
    if (needle.length > haystack.length) {
      return false;
    }
    for (let i = 0; i < needle.length; i++) {
      if (needle[i] !== haystack[i]) {
        return false;
      }
    }
    return true;
  }
  /**
   * Make sure that @id-@index pairs are equal over all array values.
   * Reject otherwise.
   * @param {any[]} value An array value.
   * @return {Promise<void>} A promise rejecting if conflicts are present.
   */
  async validateValueIndexes(value) {
    if (this.parsingContext.validateValueIndexes) {
      const indexHashes = {};
      for (const entry of value) {
        if (entry && typeof entry === 'object') {
          const id = entry['@id'];
          const index = entry['@index'];
          if (id && index) {
            const existingIndexValue = indexHashes[id];
            if (existingIndexValue && existingIndexValue !== index) {
              throw new jsonld_context_parser_1.ErrorCoded(`Conflicting @index value for ${id}`, jsonld_context_parser_1.ERROR_CODES.CONFLICTING_INDEXES);
            }
            indexHashes[id] = index;
          }
        }
      }
    }
  }
  /**
   * Convert a given JSON value to an RDF term.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key The current JSON key.
   * @param value A JSON value.
   * @param {number} depth The depth the value is at.
   * @param {string[]} keys The path of keys.
   * @return {Promise<RDF.Term[]>} An RDF term array.
   */
  async valueToTerm(context, key, value, depth, keys) {
    // Skip further processing if we have an @type: @json
    if (Util.getContextValueType(context, key) === '@json') {
      return [this.dataFactory.literal(this.valueToJsonString(value), this.rdfJson)];
    }
    const type = typeof value;
    switch (type) {
      case 'object':
        // Skip if we have a null or undefined object
        if (value === null || value === undefined) {
          return [];
        }
        // Special case for arrays
        if (Array.isArray(value)) {
          // We handle arrays at value level so we can emit earlier, so this is handled already when we get here.
          // Empty context-based lists are emitted at this place, because our streaming algorithm doesn't detect those.
          if ('@list' in Util.getContextValueContainer(context, key)) {
            if (value.length === 0) {
              return [this.rdfNil];
            } else {
              return this.parsingContext.idStack[depth + 1] || [];
            }
          }
          await this.validateValueIndexes(value);
          return [];
        }
        // Handle property-scoped contexts
        context = await this.getContextSelfOrPropertyScoped(context, key);
        // Handle local context in the value
        if ('@context' in value) {
          context = await this.parsingContext.parseContext(value['@context'], (await this.parsingContext.getContext(keys, 0)).getContextRaw());
        }
        // In all other cases, we have a hash
        value = await this.unaliasKeywords(value, keys, depth, context); // Un-alias potential keywords in this hash
        if ('@value' in value) {
          let val;
          let valueLanguage;
          let valueDirection;
          let valueType;
          let valueIndex; // We don't use the index, but we need to check its type for spec-compliance
          for (key in value) {
            const subValue = value[key];
            switch (key) {
              case '@value':
                val = subValue;
                break;
              case '@language':
                valueLanguage = subValue;
                break;
              case '@direction':
                valueDirection = subValue;
                break;
              case '@type':
                valueType = subValue;
                break;
              case '@index':
                valueIndex = subValue;
                break;
              default:
                throw new jsonld_context_parser_1.ErrorCoded(`Unknown value entry '${key}' in @value: ${JSON.stringify(value)}`, jsonld_context_parser_1.ERROR_CODES.INVALID_VALUE_OBJECT);
            }
          }
          // Skip further processing if we have an @type: @json
          if ((await this.unaliasKeyword(valueType, keys, depth, true, context)) === '@json') {
            return [this.dataFactory.literal(this.valueToJsonString(val), this.rdfJson)];
          }
          // Validate @value
          if (val === null) {
            return [];
          }
          if (typeof val === 'object') {
            throw new jsonld_context_parser_1.ErrorCoded(`The value of an '@value' can not be an object, got '${JSON.stringify(val)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_VALUE_OBJECT_VALUE);
          }
          // Validate @index
          if (this.parsingContext.validateValueIndexes && valueIndex && typeof valueIndex !== 'string') {
            throw new jsonld_context_parser_1.ErrorCoded(`The value of an '@index' must be a string, got '${JSON.stringify(valueIndex)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_INDEX_VALUE);
          }
          // Validate @language and @direction
          if (valueLanguage) {
            if (typeof val !== 'string') {
              throw new jsonld_context_parser_1.ErrorCoded(`When an '@language' is set, the value of '@value' must be a string, got '${JSON.stringify(val)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_LANGUAGE_TAGGED_VALUE);
            }
            if (!jsonld_context_parser_1.ContextParser.validateLanguage(valueLanguage, this.parsingContext.strictValues, jsonld_context_parser_1.ERROR_CODES.INVALID_LANGUAGE_TAGGED_STRING)) {
              return [];
            }
            // Language tags are always normalized to lowercase in 1.0.
            if (this.parsingContext.normalizeLanguageTags || this.parsingContext.activeProcessingMode === 1.0) {
              valueLanguage = valueLanguage.toLowerCase();
            }
          }
          if (valueDirection) {
            if (typeof val !== 'string') {
              throw new Error(`When an '@direction' is set, the value of '@value' must be a string, got '${JSON.stringify(val)}'`);
            }
            if (!jsonld_context_parser_1.ContextParser.validateDirection(valueDirection, this.parsingContext.strictValues)) {
              return [];
            }
          }
          // Check @language and @direction
          if (valueLanguage && valueDirection && this.parsingContext.rdfDirection) {
            if (valueType) {
              throw new jsonld_context_parser_1.ErrorCoded(`Can not have '@language', '@direction' and '@type' in a value: '${JSON.stringify(value)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_VALUE_OBJECT);
            }
            return this.nullableTermToArray(this.createLanguageDirectionLiteral(depth, val, valueLanguage, valueDirection));
          } else if (valueLanguage) {
            // Check @language
            if (valueType) {
              throw new jsonld_context_parser_1.ErrorCoded(`Can not have both '@language' and '@type' in a value: '${JSON.stringify(value)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_VALUE_OBJECT);
            }
            return [this.dataFactory.literal(val, valueLanguage)];
          } else if (valueDirection && this.parsingContext.rdfDirection) {
            // Check @direction
            if (valueType) {
              throw new jsonld_context_parser_1.ErrorCoded(`Can not have both '@direction' and '@type' in a value: '${JSON.stringify(value)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_VALUE_OBJECT);
            }
            return this.nullableTermToArray(this.createLanguageDirectionLiteral(depth, val, valueLanguage, valueDirection));
          } else if (valueType) {
            // Validate @type
            if (typeof valueType !== 'string') {
              throw new jsonld_context_parser_1.ErrorCoded(`The value of an '@type' must be a string, got '${JSON.stringify(valueType)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_TYPED_VALUE);
            }
            const typeTerm = this.createVocabOrBaseTerm(context, valueType);
            if (!typeTerm) {
              throw new jsonld_context_parser_1.ErrorCoded(`Invalid '@type' value, got '${JSON.stringify(valueType)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_TYPED_VALUE);
            }
            if (typeTerm.termType !== 'NamedNode') {
              throw new jsonld_context_parser_1.ErrorCoded(`Illegal value type (${typeTerm.termType}): ${valueType}`, jsonld_context_parser_1.ERROR_CODES.INVALID_TYPED_VALUE);
            }
            return [this.dataFactory.literal(val, typeTerm)];
          }
          // We don't pass the context, because context-based things like @language should be ignored
          return await this.valueToTerm(new jsonld_context_parser_1.JsonLdContextNormalized({}), key, val, depth, keys);
        } else if ('@set' in value) {
          // No other entries are allow in this value
          if (Object.keys(value).length > 1) {
            throw new jsonld_context_parser_1.ErrorCoded(`Found illegal neighbouring entries next to @set for key: '${key}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_SET_OR_LIST_OBJECT);
          }
          // No need to do anything here, this is handled at the deeper level.
          return [];
        } else if ('@list' in value) {
          // No other entries are allowed in this value
          if (Object.keys(value).length > 1) {
            throw new jsonld_context_parser_1.ErrorCoded(`Found illegal neighbouring entries next to @list for key: '${key}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_SET_OR_LIST_OBJECT);
          }
          const listValue = value["@list"];
          // We handle lists at value level so we can emit earlier, so this is handled already when we get here.
          // Empty anonymous lists are emitted at this place, because our streaming algorithm doesn't detect those.
          if (Array.isArray(listValue)) {
            if (listValue.length === 0) {
              return [this.rdfNil];
            } else {
              return this.parsingContext.idStack[depth + 1] || [];
            }
          } else {
            // We only have a single list element here, so emit this directly as single element
            return await this.valueToTerm(await this.parsingContext.getContext(keys), key, listValue, depth - 1, keys.slice(0, -1));
          }
        } else if ('@reverse' in value && typeof value['@reverse'] === 'boolean') {
          // We handle reverse properties at value level so we can emit earlier,
          // so this is handled already when we get here.
          return [];
        } else if ('@graph' in Util.getContextValueContainer(await this.parsingContext.getContext(keys), key)) {
          // We are processing a graph container
          const graphContainerEntries = this.parsingContext.graphContainerTermStack[depth + 1];
          return graphContainerEntries ? Object.values(graphContainerEntries) : [this.dataFactory.blankNode()];
        } else if ("@id" in value) {
          // Use deeper context if the value node contains other properties next to @id.
          if (Object.keys(value).length > 1) {
            context = await this.parsingContext.getContext(keys, 0);
          }
          // Handle local context in the value
          if ('@context' in value) {
            context = await this.parsingContext.parseContext(value['@context'], context.getContextRaw());
          }
          if (value["@type"] === '@vocab') {
            return this.nullableTermToArray(this.createVocabOrBaseTerm(context, value["@id"]));
          } else {
            return this.nullableTermToArray(this.resourceToTerm(context, value["@id"]));
          }
        } else {
          // Only make a blank node if at least one triple was emitted at the value's level.
          if (this.parsingContext.emittedStack[depth + 1] || value && typeof value === 'object' && Object.keys(value).length === 0) {
            return this.parsingContext.idStack[depth + 1] || (this.parsingContext.idStack[depth + 1] = [this.dataFactory.blankNode()]);
          } else {
            return [];
          }
        }
      case 'string':
        return this.nullableTermToArray(this.stringValueToTerm(depth, await this.getContextSelfOrPropertyScoped(context, key), key, value, null));
      case 'boolean':
        return this.nullableTermToArray(this.stringValueToTerm(depth, await this.getContextSelfOrPropertyScoped(context, key), key, Boolean(value).toString(), this.dataFactory.namedNode(Util.XSD_BOOLEAN)));
      case 'number':
        return this.nullableTermToArray(this.stringValueToTerm(depth, await this.getContextSelfOrPropertyScoped(context, key), key, value, this.dataFactory.namedNode(value % 1 === 0 && value < 1e21 ? Util.XSD_INTEGER : Util.XSD_DOUBLE)));
      default:
        this.parsingContext.emitError(new Error(`Could not determine the RDF type of a ${type}`));
        return [];
    }
  }
  /**
   * If the context defines a property-scoped context for the given key,
   * that context will be returned.
   * Otherwise, the given context will be returned as-is.
   *
   * This should be used for valueToTerm cases that are not objects.
   * @param context A context.
   * @param key A JSON key.
   */
  async getContextSelfOrPropertyScoped(context, key) {
    const contextKeyEntry = context.getContextRaw()[key];
    if (contextKeyEntry && typeof contextKeyEntry === 'object' && '@context' in contextKeyEntry) {
      context = await this.parsingContext.parseContext(contextKeyEntry, context.getContextRaw(), true);
    }
    return context;
  }
  /**
   * If the given term is null, return an empty array, otherwise return an array with the single given term.
   * @param term A term.
   */
  nullableTermToArray(term) {
    return term ? [term] : [];
  }
  /**
   * Convert a given JSON key to an RDF predicate term,
   * based on @vocab.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param key A JSON key.
   * @return {RDF.NamedNode} An RDF named node.
   */
  predicateToTerm(context, key) {
    const expanded = context.expandTerm(key, true, this.parsingContext.getExpandOptions());
    // Immediately return if the predicate was disabled in the context
    if (!expanded) {
      return null;
    }
    // Check if the predicate is a blank node
    if (expanded[0] === '_' && expanded[1] === ':') {
      if (this.parsingContext.produceGeneralizedRdf) {
        return this.dataFactory.blankNode(expanded.substr(2));
      } else {
        return null;
      }
    }
    // Check if the predicate is a valid IRI
    if (Util.isValidIri(expanded)) {
      return this.dataFactory.namedNode(expanded);
    } else {
      if (expanded && this.parsingContext.strictValues) {
        this.parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Invalid predicate IRI: ${expanded}`, jsonld_context_parser_1.ERROR_CODES.INVALID_IRI_MAPPING));
      } else {
        return null;
      }
    }
    return null;
  }
  /**
   * Convert a given JSON key to an RDF resource term or blank node,
   * based on @base.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param key A JSON key.
   * @return {RDF.NamedNode} An RDF named node or null.
   */
  resourceToTerm(context, key) {
    if (key.startsWith('_:')) {
      return this.dataFactory.blankNode(key.substr(2));
    }
    const iri = context.expandTerm(key, false, this.parsingContext.getExpandOptions());
    if (!Util.isValidIri(iri)) {
      if (iri && this.parsingContext.strictValues) {
        this.parsingContext.emitError(new Error(`Invalid resource IRI: ${iri}`));
      } else {
        return null;
      }
    }
    return this.dataFactory.namedNode(iri);
  }
  /**
   * Convert a given JSON key to an RDF resource term.
   * It will do this based on the @vocab,
   * and fallback to @base.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param key A JSON key.
   * @return {RDF.NamedNode} An RDF named node or null.
   */
  createVocabOrBaseTerm(context, key) {
    if (key.startsWith('_:')) {
      return this.dataFactory.blankNode(key.substr(2));
    }
    const expandOptions = this.parsingContext.getExpandOptions();
    let expanded = context.expandTerm(key, true, expandOptions);
    if (expanded === key) {
      expanded = context.expandTerm(key, false, expandOptions);
    }
    if (!Util.isValidIri(expanded)) {
      if (expanded && this.parsingContext.strictValues && !expanded.startsWith('@')) {
        this.parsingContext.emitError(new Error(`Invalid term IRI: ${expanded}`));
      } else {
        return null;
      }
    }
    return this.dataFactory.namedNode(expanded);
  }
  /**
   * Ensure that the given value becomes a string.
   * @param {string | number} value A string or number.
   * @param {NamedNode} datatype The intended datatype.
   * @return {string} The returned string.
   */
  intToString(value, datatype) {
    if (typeof value === 'number') {
      if (Number.isFinite(value)) {
        const isInteger = value % 1 === 0;
        if (isInteger && (!datatype || datatype.value !== Util.XSD_DOUBLE)) {
          return Number(value).toString();
        } else {
          return value.toExponential(15).replace(/(\d)0*e\+?/, '$1E');
        }
      } else {
        return value > 0 ? 'INF' : '-INF';
      }
    } else {
      return value;
    }
  }
  /**
   * Convert a given JSON string value to an RDF term.
   * @param {number} depth The current stack depth.
   * @param {JsonLdContextNormalized} context A JSON-LD context.
   * @param {string} key The current JSON key.
   * @param {string} value A JSON value.
   * @param {NamedNode} defaultDatatype The default datatype for the given value.
   * @return {RDF.Term} An RDF term or null.
   */
  stringValueToTerm(depth, context, key, value, defaultDatatype) {
    // Check the datatype from the context
    const contextType = Util.getContextValueType(context, key);
    if (contextType) {
      if (contextType === '@id') {
        if (!defaultDatatype) {
          return this.resourceToTerm(context, this.intToString(value, defaultDatatype));
        }
      } else if (contextType === '@vocab') {
        if (!defaultDatatype) {
          return this.createVocabOrBaseTerm(context, this.intToString(value, defaultDatatype));
        }
      } else {
        defaultDatatype = this.dataFactory.namedNode(contextType);
      }
    }
    // If we don't find such a datatype, check the language from the context
    if (!defaultDatatype) {
      const contextLanguage = Util.getContextValueLanguage(context, key);
      const contextDirection = Util.getContextValueDirection(context, key);
      if (contextDirection && this.parsingContext.rdfDirection) {
        return this.createLanguageDirectionLiteral(depth, this.intToString(value, defaultDatatype), contextLanguage, contextDirection);
      } else {
        return this.dataFactory.literal(this.intToString(value, defaultDatatype), contextLanguage);
      }
    }
    // If all else fails, make a literal based on the default content type
    return this.dataFactory.literal(this.intToString(value, defaultDatatype), defaultDatatype);
  }
  /**
   * Create a literal for the given value with the given language and direction.
   * Auxiliary quads may be emitted.
   * @param {number} depth The current stack depth.
   * @param {string} value A string value.
   * @param {string} language A language tag.
   * @param {string} direction A direction.
   * @return {Term} An RDF term.
   */
  createLanguageDirectionLiteral(depth, value, language, direction) {
    if (this.parsingContext.rdfDirection === 'i18n-datatype') {
      // Create a datatyped literal, by encoding the language and direction into https://www.w3.org/ns/i18n#.
      if (!language) {
        language = '';
      }
      return this.dataFactory.literal(value, this.dataFactory.namedNode(`https://www.w3.org/ns/i18n#${language}_${direction}`));
    } else {
      // Reify the literal.
      const valueNode = this.dataFactory.blankNode();
      const graph = this.getDefaultGraph();
      this.parsingContext.emitQuad(depth, this.dataFactory.quad(valueNode, this.dataFactory.namedNode(Util.RDF + 'value'), this.dataFactory.literal(value), graph));
      if (language) {
        this.parsingContext.emitQuad(depth, this.dataFactory.quad(valueNode, this.dataFactory.namedNode(Util.RDF + 'language'), this.dataFactory.literal(language), graph));
      }
      this.parsingContext.emitQuad(depth, this.dataFactory.quad(valueNode, this.dataFactory.namedNode(Util.RDF + 'direction'), this.dataFactory.literal(direction), graph));
      return valueNode;
    }
  }
  /**
   * Stringify the given JSON object to a canonical JSON string.
   * @param value Any valid JSON value.
   * @return {string} A canonical JSON string.
   */
  valueToJsonString(value) {
    return canonicalizeJson(value);
  }
  /**
   * If the key is not a keyword, try to check if it is an alias for a keyword,
   * and if so, un-alias it.
   * @param {string} key A key, can be falsy.
   * @param {string[]} keys The path of keys.
   * @param {number} depth The depth to
   * @param {boolean} disableCache If the cache should be disabled
   * @param {JsonLdContextNormalized} context A context to unalias with,
   *                                           will fallback to retrieving the context for the given keys.
   * @return {Promise<string>} A promise resolving to the key itself, or another key.
   */
  async unaliasKeyword(key, keys, depth, disableCache, context) {
    // Numbers can not be an alias
    if (Number.isInteger(key)) {
      return key;
    }
    // Try to grab from cache if it was already un-aliased before.
    if (!disableCache) {
      const cachedUnaliasedKeyword = this.parsingContext.unaliasedKeywordCacheStack[depth];
      if (cachedUnaliasedKeyword) {
        return cachedUnaliasedKeyword;
      }
    }
    if (!jsonld_context_parser_1.Util.isPotentialKeyword(key)) {
      context = context || (await this.parsingContext.getContext(keys));
      let unliased = context.getContextRaw()[key];
      if (unliased && typeof unliased === 'object') {
        unliased = unliased['@id'];
      }
      if (jsonld_context_parser_1.Util.isValidKeyword(unliased)) {
        key = unliased;
      }
    }
    return disableCache ? key : this.parsingContext.unaliasedKeywordCacheStack[depth] = key;
  }
  /**
   * Unalias the keyword of the parent.
   * This adds a safety check if no parent exist.
   * @param {any[]} keys A stack of keys.
   * @param {number} depth The current depth.
   * @return {Promise<any>} A promise resolving to the parent key, or another key.
   */
  async unaliasKeywordParent(keys, depth) {
    return await this.unaliasKeyword(depth > 0 && keys[depth - 1], keys, depth - 1);
  }
  /**
   * Un-alias all keywords in the given hash.
   * @param {{[p: string]: any}} hash A hash object.
   * @param {string[]} keys The path of keys.
   * @param {number} depth The depth.
   * @param {JsonLdContextNormalized} context A context to unalias with,
   *                                           will fallback to retrieving the context for the given keys.
   * @return {Promise<{[p: string]: any}>} A promise resolving to the new hash.
   */
  async unaliasKeywords(hash, keys, depth, context) {
    const newHash = {};
    for (const key in hash) {
      newHash[await this.unaliasKeyword(key, keys, depth + 1, true, context)] = hash[key];
    }
    return newHash;
  }
  /**
   * Check if we are processing a literal (including JSON literals) at the given depth.
   * This will also check higher levels,
   * because if a parent is a literal,
   * then the deeper levels are definitely a literal as well.
   * @param {number} depth The depth.
   * @return {boolean} If we are processing a literal.
   */
  isLiteral(depth) {
    for (let i = depth; i >= 0; i--) {
      if (this.parsingContext.literalStack[i] || this.parsingContext.jsonLiteralStack[i]) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check how many parents should be skipped for checking the @graph for the given node.
   *
   * @param {number} depth The depth of the node.
   * @param {any[]} keys An array of keys.
   * @return {number} The graph depth offset.
   */
  async getDepthOffsetGraph(depth, keys) {
    for (let i = depth - 1; i > 0; i--) {
      if ((await this.unaliasKeyword(keys[i], keys, i)) === '@graph') {
        // Skip further processing if we are already in an @graph-@id or @graph-@index container
        const containers = (await EntryHandlerContainer_1.EntryHandlerContainer.getContainerHandler(this.parsingContext, keys, i)).containers;
        if (EntryHandlerContainer_1.EntryHandlerContainer.isComplexGraphContainer(containers)) {
          return -1;
        }
        return depth - i - 1;
      }
    }
    return -1;
  }
  /**
   * Check if the given subject is of a valid type.
   * This should be called when applying @reverse'd properties.
   * @param {Term} subject A subject.
   */
  validateReverseSubject(subject) {
    if (subject.termType === 'Literal') {
      throw new jsonld_context_parser_1.ErrorCoded(`Found illegal literal in subject position: ${subject.value}`, jsonld_context_parser_1.ERROR_CODES.INVALID_REVERSE_PROPERTY_VALUE);
    }
  }
  /**
   * Get the default graph.
   * @return {Term} An RDF term.
   */
  getDefaultGraph() {
    return this.parsingContext.defaultGraph || this.dataFactory.defaultGraph();
  }
  /**
   * Get the current graph, while taking into account a graph that can be defined via @container: @graph.
   * If not within a graph container, the default graph will be returned.
   * @param keys The current keys.
   * @param depth The current depth.
   */
  async getGraphContainerValue(keys, depth) {
    // Default to default graph
    let graph = this.getDefaultGraph();
    // Check if we are in an @container: @graph.
    const {
      containers,
      depth: depthContainer
    } = await EntryHandlerContainer_1.EntryHandlerContainer.getContainerHandler(this.parsingContext, keys, depth);
    if ('@graph' in containers) {
      // Get the graph from the stack.
      const graphContainerIndex = EntryHandlerContainer_1.EntryHandlerContainer.getContainerGraphIndex(containers, depthContainer, keys);
      const entry = this.parsingContext.graphContainerTermStack[depthContainer];
      graph = entry ? entry[graphContainerIndex] : null;
      // Set the graph in the stack if none has been set yet.
      if (!graph) {
        let graphId = null;
        if ('@id' in containers) {
          const keyUnaliased = await this.getContainerKey(keys[depthContainer], keys, depthContainer);
          if (keyUnaliased !== null) {
            graphId = await this.resourceToTerm(await this.parsingContext.getContext(keys), keyUnaliased);
          }
        }
        if (!graphId) {
          graphId = this.dataFactory.blankNode();
        }
        if (!this.parsingContext.graphContainerTermStack[depthContainer]) {
          this.parsingContext.graphContainerTermStack[depthContainer] = {};
        }
        graph = this.parsingContext.graphContainerTermStack[depthContainer][graphContainerIndex] = graphId;
      }
    }
    return graph;
  }
  /**
   * Get the properties depth for retrieving properties.
   *
   * Typically, the properties depth will be identical to the given depth.
   *
   * The following exceptions apply:
   * * When the parent is @reverse, the depth is decremented by one.
   * * When @nest parents are found, the depth is decremented by the number of @nest parents.
   * If in combination with the exceptions above an intermediary array is discovered,
   * the depth is also decremented by this number of arrays.
   *
   * @param keys The current key chain.
   * @param depth The current depth.
   */
  async getPropertiesDepth(keys, depth) {
    let lastValidDepth = depth;
    for (let i = depth - 1; i > 0; i--) {
      if (typeof keys[i] !== 'number') {
        // Skip array keys
        const parentKey = await this.unaliasKeyword(keys[i], keys, i);
        if (parentKey === '@reverse') {
          return i;
        } else if (parentKey === '@nest') {
          lastValidDepth = i;
        } else {
          return lastValidDepth;
        }
      }
    }
    return lastValidDepth;
  }
  /**
   * Get the key for the current container entry.
   * @param key A key, can be falsy.
   * @param keys The key chain.
   * @param depth The current depth to get the key from.
   * @return Promise resolving to the key.
   *         Null will be returned for @none entries, with aliasing taken into account.
   */
  async getContainerKey(key, keys, depth) {
    const keyUnaliased = await this.unaliasKeyword(key, keys, depth);
    return keyUnaliased === '@none' ? null : keyUnaliased;
  }
}
exports.Util = Util;
Util.XSD = 'http://www.w3.org/2001/XMLSchema#';
Util.XSD_BOOLEAN = Util.XSD + 'boolean';
Util.XSD_INTEGER = Util.XSD + 'integer';
Util.XSD_DOUBLE = Util.XSD + 'double';
Util.RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerIdentifier.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerIdentifier.js ***!
  \*************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContainerHandlerIdentifier = void 0;
/**
 * Container handler for @id.
 *
 * It assumes that the current key is the identifier of the current value.
 * This will add this value to the parent node.
 */
class ContainerHandlerIdentifier {
  canCombineWithGraph() {
    return true;
  }
  async handle(containers, parsingContext, util, keys, value, depth) {
    let id;
    // First check if the child node already has a defined id.
    if (parsingContext.emittedStack[depth + 1] && parsingContext.idStack[depth + 1]) {
      // Use the existing identifier
      id = parsingContext.idStack[depth + 1][0];
    } else {
      // Create the identifier
      const keyUnaliased = await util.getContainerKey(keys[depth], keys, depth);
      const maybeId = keyUnaliased !== null ? await util.resourceToTerm(await parsingContext.getContext(keys), keys[depth]) : util.dataFactory.blankNode();
      // Do nothing if the id is invalid
      if (!maybeId) {
        parsingContext.emittedStack[depth] = false; // Don't emit the predicate owning this container.
        return;
      }
      id = maybeId;
      // Insert the id into the stack so that buffered children can make us of it.
      parsingContext.idStack[depth + 1] = [id];
    }
    // Insert the id into the stack so that parents can make use of it.
    // Insert it as an array because multiple id container entries may exist
    let ids = parsingContext.idStack[depth];
    if (!ids) {
      ids = parsingContext.idStack[depth] = [];
    }
    // Only insert the term if it does not exist yet in the array.
    if (!ids.some(term => term.equals(id))) {
      ids.push(id);
    }
    // Flush any pending flush buffers
    if (!(await parsingContext.handlePendingContainerFlushBuffers())) {
      parsingContext.emittedStack[depth] = false; // Don't emit the predicate owning this container.
    }
  }
}

exports.ContainerHandlerIdentifier = ContainerHandlerIdentifier;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerIndex.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerIndex.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContainerHandlerIndex = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const EntryHandlerPredicate_1 = __webpack_require__(/*! ../entryhandler/EntryHandlerPredicate */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerPredicate.js");
const Util_1 = __webpack_require__(/*! ../Util */ "./node_modules/jsonld-streaming-parser/lib/Util.js");
/**
 * Container handler for @index.
 *
 * This will ignore the current key and add this entry to the parent node.
 */
class ContainerHandlerIndex {
  canCombineWithGraph() {
    return true;
  }
  async handle(containers, parsingContext, util, keys, value, depth) {
    if (!Array.isArray(value)) {
      const graphContainer = ('@graph' in containers);
      // Check if the container is a property-based container by checking if there is a valid @index.
      const context = await parsingContext.getContext(keys);
      const indexKey = keys[depth - 1];
      const indexPropertyRaw = Util_1.Util.getContextValueIndex(context, indexKey);
      if (indexPropertyRaw) {
        // Validate the @index value
        if (jsonld_context_parser_1.Util.isPotentialKeyword(indexPropertyRaw)) {
          throw new jsonld_context_parser_1.ErrorCoded(`Keywords can not be used as @index value, got: ${indexPropertyRaw}`, jsonld_context_parser_1.ERROR_CODES.INVALID_TERM_DEFINITION);
        }
        if (typeof indexPropertyRaw !== 'string') {
          throw new jsonld_context_parser_1.ErrorCoded(`@index values must be strings, got: ${indexPropertyRaw}`, jsonld_context_parser_1.ERROR_CODES.INVALID_TERM_DEFINITION);
        }
        // When @index is used, values must be node values, unless @type: @id is defined in the context
        if (typeof value !== 'object') {
          // Error if we don't have @type: @id
          if (Util_1.Util.getContextValueType(context, indexKey) !== '@id') {
            throw new jsonld_context_parser_1.ErrorCoded(`Property-based index containers require nodes as values or strings with @type: @id, but got: ${value}`, jsonld_context_parser_1.ERROR_CODES.INVALID_VALUE_OBJECT);
          }
          // Add an @id to the stack, so our expanded @index value can make use of it
          const id = util.resourceToTerm(context, value);
          if (id) {
            parsingContext.idStack[depth + 1] = [id];
          }
        }
        // Expand the @index value
        const indexProperty = util.createVocabOrBaseTerm(context, indexPropertyRaw);
        if (indexProperty) {
          const indexValues = await util.valueToTerm(context, indexPropertyRaw, await util.getContainerKey(keys[depth], keys, depth), depth, keys);
          if (graphContainer) {
            // When we're in a graph container, attach the index to the graph identifier
            const graphId = await util.getGraphContainerValue(keys, depth + 1);
            for (const indexValue of indexValues) {
              parsingContext.emitQuad(depth, util.dataFactory.quad(graphId, indexProperty, indexValue, util.getDefaultGraph()));
            }
          } else {
            // Otherwise, attach the index to the node identifier
            for (const indexValue of indexValues) {
              await EntryHandlerPredicate_1.EntryHandlerPredicate.handlePredicateObject(parsingContext, util, keys, depth + 1, indexProperty, indexValue, false);
            }
          }
        }
      }
      const depthOffset = graphContainer ? 2 : 1;
      await parsingContext.newOnValueJob(keys.slice(0, keys.length - depthOffset), value, depth - depthOffset, true);
      // Flush any pending flush buffers
      await parsingContext.handlePendingContainerFlushBuffers();
    }
    parsingContext.emittedStack[depth] = false; // We have emitted a level higher
  }
}

exports.ContainerHandlerIndex = ContainerHandlerIndex;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerLanguage.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerLanguage.js ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContainerHandlerLanguage = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
/**
 * Container handler for @language.
 *
 * It assumes that the current key is the language of the current value.
 * This will add this value to the parent node.
 */
class ContainerHandlerLanguage {
  canCombineWithGraph() {
    return false;
  }
  async handle(containers, parsingContext, util, keys, value, depth) {
    const language = await util.getContainerKey(keys[depth], keys, depth);
    if (Array.isArray(value)) {
      // No type-checking needed, will be handled on each value when this handler is called recursively.
      value = value.map(subValue => ({
        '@value': subValue,
        '@language': language
      }));
    } else {
      if (typeof value !== 'string') {
        throw new jsonld_context_parser_1.ErrorCoded(`Got invalid language map value, got '${JSON.stringify(value)}', but expected string`, jsonld_context_parser_1.ERROR_CODES.INVALID_LANGUAGE_MAP_VALUE);
      }
      value = {
        '@value': value,
        '@language': language
      };
    }
    await parsingContext.newOnValueJob(keys.slice(0, keys.length - 1), value, depth - 1, true);
    parsingContext.emittedStack[depth] = false; // We have emitted a level higher
  }
}

exports.ContainerHandlerLanguage = ContainerHandlerLanguage;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerType.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerType.js ***!
  \*******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContainerHandlerType = void 0;
const EntryHandlerPredicate_1 = __webpack_require__(/*! ../entryhandler/EntryHandlerPredicate */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerPredicate.js");
const Util_1 = __webpack_require__(/*! ../Util */ "./node_modules/jsonld-streaming-parser/lib/Util.js");
/**
 * Container handler for @type.
 *
 * This will add this entry to the parent node, and use the current key as an rdf:type value.
 */
class ContainerHandlerType {
  canCombineWithGraph() {
    return false;
  }
  async handle(containers, parsingContext, util, keys, value, depth) {
    if (!Array.isArray(value)) {
      if (typeof value === 'string') {
        // Determine the @type of the container
        const context = await parsingContext.getContext(keys);
        const containerTypeType = Util_1.Util.getContextValueType(context, keys[depth - 1]);
        // String values refer to node references
        const id = containerTypeType === '@vocab' ? await util.createVocabOrBaseTerm(context, value) : await util.resourceToTerm(context, value);
        if (id) {
          // Handle the value of this node as @id, which will also cause the predicate from above to be emitted.
          const subValue = {
            '@id': id.termType === 'NamedNode' ? id.value : value
          };
          await parsingContext.newOnValueJob(keys.slice(0, keys.length - 1), subValue, depth - 1, true);
          // Set the id in the stack so it can be used for the rdf:type handling later on
          parsingContext.idStack[depth + 1] = [id];
        }
      } else {
        // Other values are handled by handling them as a proper job
        // Check needed for cases where entries don't have an explicit @id
        const entryHasIdentifier = !!parsingContext.idStack[depth + 1];
        // Handle the value of this node, which will also cause the predicate from above to be emitted.
        if (!entryHasIdentifier) {
          delete parsingContext.idStack[depth]; // Force new (blank node) identifier
        }

        await parsingContext.newOnValueJob(keys.slice(0, keys.length - 1), value, depth - 1, true);
        if (!entryHasIdentifier) {
          parsingContext.idStack[depth + 1] = parsingContext.idStack[depth]; // Copy the id to the child node, for @type
        }
      }
      // Identify the type to emit.
      const keyOriginal = await util.getContainerKey(keys[depth], keys, depth);
      const type = keyOriginal !== null ? util.createVocabOrBaseTerm(await parsingContext.getContext(keys), keyOriginal) : null;
      if (type) {
        // Push the type to the stack using the rdf:type predicate
        await EntryHandlerPredicate_1.EntryHandlerPredicate.handlePredicateObject(parsingContext, util, keys, depth + 1, util.rdfType, type, false);
      }
      // Flush any pending flush buffers
      await parsingContext.handlePendingContainerFlushBuffers();
    }
    parsingContext.emittedStack[depth] = false; // Don't emit the predicate owning this container.
  }
}

exports.ContainerHandlerType = ContainerHandlerType;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerArrayValue.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerArrayValue.js ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerArrayValue = void 0;
const Util_1 = __webpack_require__(/*! ../Util */ "./node_modules/jsonld-streaming-parser/lib/Util.js");
/**
 * Handles values that are part of an array.
 */
class EntryHandlerArrayValue {
  isPropertyHandler() {
    return false;
  }
  isStackProcessor() {
    return true;
  }
  async validate(parsingContext, util, keys, depth, inProperty) {
    return this.test(parsingContext, util, null, keys, depth);
  }
  async test(parsingContext, util, key, keys, depth) {
    return typeof keys[depth] === 'number';
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    let parentKey = await util.unaliasKeywordParent(keys, depth);
    // Check if we have an anonymous list
    if (parentKey === '@list') {
      // Our value is part of an array
      // Determine the list root key
      let listRootKey = null;
      let listRootDepth = 0;
      for (let i = depth - 2; i > 0; i--) {
        const keyOption = keys[i];
        if (typeof keyOption === 'string' || typeof keyOption === 'number') {
          listRootDepth = i;
          listRootKey = keyOption;
          break;
        }
      }
      if (listRootKey !== null) {
        // Emit the given objects as list elements
        const values = await util.valueToTerm(await parsingContext.getContext(keys), listRootKey, value, depth, keys);
        for (const object of values) {
          await this.handleListElement(parsingContext, util, object, value, depth, keys.slice(0, listRootDepth), listRootDepth);
        }
        // If no values were found, emit a falsy list element to force an empty RDF list to be emitted.
        if (values.length === 0) {
          await this.handleListElement(parsingContext, util, null, value, depth, keys.slice(0, listRootDepth), listRootDepth);
        }
      }
    } else if (parentKey === '@set') {
      // Our value is part of a set, so we just add it to the parent-parent
      await parsingContext.newOnValueJob(keys.slice(0, -2), value, depth - 2, false);
    } else if (parentKey !== undefined && parentKey !== '@type') {
      // Buffer our value using the parent key as predicate
      // Determine the first parent key that is *not* an array key
      // This is needed in case we have an @list container with nested arrays,
      // where each of them should produce nested RDF lists.
      for (let i = depth - 1; i > 0; i--) {
        if (typeof keys[i] !== 'number') {
          parentKey = await util.unaliasKeyword(keys[i], keys, i);
          break;
        }
      }
      // Check if the predicate is marked as an @list in the context
      const parentContext = await parsingContext.getContext(keys.slice(0, -1));
      if ('@list' in Util_1.Util.getContextValueContainer(parentContext, parentKey)) {
        // Our value is part of an array
        // Emit the given objects as list elements
        parsingContext.emittedStack[depth + 1] = true; // Ensure the creation of bnodes for empty nodes
        const values = await util.valueToTerm(await parsingContext.getContext(keys), parentKey, value, depth, keys);
        for (const object of values) {
          await this.handleListElement(parsingContext, util, object, value, depth, keys.slice(0, -1), depth - 1);
        }
        // If no values were found, emit a falsy list element to force an empty RDF list to be emitted.
        if (values.length === 0) {
          await this.handleListElement(parsingContext, util, null, value, depth, keys.slice(0, -1), depth - 1);
        }
      } else {
        // Copy the stack values up one level so that the next job can access them.
        parsingContext.shiftStack(depth, 1);
        // Execute the job one level higher
        await parsingContext.newOnValueJob(keys.slice(0, -1), value, depth - 1, false);
        // Remove any defined contexts at this level to avoid it to propagate to the next array element.
        parsingContext.contextTree.removeContext(keys.slice(0, -1));
      }
    }
  }
  async handleListElement(parsingContext, util, value, valueOriginal, depth, listRootKeys, listRootDepth) {
    // Buffer our value as an RDF list using the listRootKey as predicate
    let listPointer = parsingContext.listPointerStack[depth];
    if (valueOriginal !== null && (await util.unaliasKeywords(valueOriginal, listRootKeys, depth))['@value'] !== null) {
      if (!listPointer || !listPointer.value) {
        const linkTerm = util.dataFactory.blankNode();
        listPointer = {
          value: linkTerm,
          listRootDepth,
          listId: linkTerm
        };
      } else {
        // rdf:rest links are always emitted before the next element,
        // as the blank node identifier is only created at that point.
        // Because of this reason, the final rdf:nil is emitted when the stack depth is decreased.
        const newLinkTerm = util.dataFactory.blankNode();
        parsingContext.emitQuad(depth, util.dataFactory.quad(listPointer.value, util.rdfRest, newLinkTerm, util.getDefaultGraph()));
        // Update the list pointer for the next element
        listPointer.value = newLinkTerm;
      }
      // Emit a list element for the current value
      // Omit rdf:first if the value is invalid
      if (value) {
        parsingContext.emitQuad(depth, util.dataFactory.quad(listPointer.value, util.rdfFirst, value, util.getDefaultGraph()));
      }
    } else {
      // A falsy list element if found.
      // Mark it as an rdf:nil list until another valid list element comes in
      if (!listPointer) {
        listPointer = {
          listRootDepth,
          listId: util.rdfNil
        };
      }
    }
    parsingContext.listPointerStack[depth] = listPointer;
  }
}
exports.EntryHandlerArrayValue = EntryHandlerArrayValue;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerContainer.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerContainer.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerContainer = void 0;
const ContainerHandlerIdentifier_1 = __webpack_require__(/*! ../containerhandler/ContainerHandlerIdentifier */ "./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerIdentifier.js");
const ContainerHandlerIndex_1 = __webpack_require__(/*! ../containerhandler/ContainerHandlerIndex */ "./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerIndex.js");
const ContainerHandlerLanguage_1 = __webpack_require__(/*! ../containerhandler/ContainerHandlerLanguage */ "./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerLanguage.js");
const ContainerHandlerType_1 = __webpack_require__(/*! ../containerhandler/ContainerHandlerType */ "./node_modules/jsonld-streaming-parser/lib/containerhandler/ContainerHandlerType.js");
const Util_1 = __webpack_require__(/*! ../Util */ "./node_modules/jsonld-streaming-parser/lib/Util.js");
/**
 * Handles values that are part of a container type (like @index),
 * as specified by {@link IContainerHandler}.
 */
class EntryHandlerContainer {
  /**
   * Check fit the given container is a simple @graph container.
   * Concretely, it will check if no @index or @id is active as well.
   * @param containers A container hash.
   */
  static isSimpleGraphContainer(containers) {
    return '@graph' in containers && ('@set' in containers && Object.keys(containers).length === 2 || Object.keys(containers).length === 1);
  }
  /**
   * Check fit the given container is a complex @graph container.
   * Concretely, it will check if @index or @id is active as well next to @graph.
   * @param containers A container hash.
   */
  static isComplexGraphContainer(containers) {
    return '@graph' in containers && ('@set' in containers && Object.keys(containers).length > 2 || !('@set' in containers) && Object.keys(containers).length > 1);
  }
  /**
   * Create an graph container index that can be used for identifying a graph term inside the graphContainerTermStack.
   * @param containers The applicable containers.
   * @param depth The container depth.
   * @param keys The array of keys.
   * @return The graph index.
   */
  static getContainerGraphIndex(containers, depth, keys) {
    let isSimpleGraphContainer = EntryHandlerContainer.isSimpleGraphContainer(containers);
    let index = '';
    for (let i = depth; i < keys.length; i++) {
      if (!isSimpleGraphContainer || typeof keys[i] === 'number') {
        index += ':' + keys[i];
      }
      // Only allow a second 'real' key if in a non-simple graph container.
      if (!isSimpleGraphContainer && typeof keys[i] !== 'number') {
        isSimpleGraphContainer = true;
      }
    }
    return index;
  }
  /**
   * Return the applicable container type at the given depth.
   *
   * This will ignore any arrays in the key chain.
   *
   * @param {ParsingContext} parsingContext A parsing context.
   * @param {any[]} keys The array of keys.
   * @param {number} depth The current depth.
   * @return {Promise<{ containers: {[typeName: string]: boolean}, depth: number, fallback: boolean }>}
   *          All applicable containers for the given depth,
   *          the `depth` of the container root (can change when arrays are in the key chain),
   *          and the `fallback` flag that indicates if the default container type was returned
   *            (i.e., no dedicated container type is defined).
   */
  static async getContainerHandler(parsingContext, keys, depth) {
    const fallback = {
      containers: {
        '@set': true
      },
      depth,
      fallback: true
    };
    // A flag that is enabled when @graph container should be tested in next iteration
    let checkGraphContainer = false;
    // Iterate from deeper to higher
    const context = await parsingContext.getContext(keys, 2);
    for (let i = depth - 1; i >= 0; i--) {
      if (typeof keys[i] !== 'number') {
        // Skip array keys
        // @graph containers without any other types are one level less deep, and require special handling
        const containersSelf = Util_1.Util.getContextValue(context, '@container', keys[i], false);
        if (containersSelf && EntryHandlerContainer.isSimpleGraphContainer(containersSelf)) {
          return {
            containers: containersSelf,
            depth: i + 1,
            fallback: false
          };
        }
        const containersParent = Util_1.Util.getContextValue(context, '@container', keys[i - 1], false);
        if (!containersParent) {
          // If we have the fallback container value
          if (checkGraphContainer) {
            // Return false if we were already expecting a @graph-@id of @graph-@index container
            return fallback;
          }
          // Check parent-parent, we may be in a @graph-@id of @graph-@index container, which have two levels
          checkGraphContainer = true;
        } else {
          // We had an invalid container next iteration, so we now have to check if we were in an @graph container
          const graphContainer = ('@graph' in containersParent);
          // We're in a regular container
          for (const containerHandleName in EntryHandlerContainer.CONTAINER_HANDLERS) {
            if (containersParent[containerHandleName]) {
              if (graphContainer) {
                // Only accept graph containers if their combined handlers can handle them.
                if (EntryHandlerContainer.CONTAINER_HANDLERS[containerHandleName].canCombineWithGraph()) {
                  return {
                    containers: containersParent,
                    depth: i,
                    fallback: false
                  };
                } else {
                  return fallback;
                }
              } else {
                // Only accept if we were not expecting a @graph-@id of @graph-@index container
                if (checkGraphContainer) {
                  return fallback;
                } else {
                  return {
                    containers: containersParent,
                    depth: i,
                    fallback: false
                  };
                }
              }
            }
          }
          // Fail if no valid container handlers were found
          return fallback;
        }
      }
    }
    return fallback;
  }
  /**
   * Check if we are handling a value at the given depth
   * that is part of something that should be handled as a container,
   * AND if this container should be buffered, so that it can be handled by a dedicated container handler.
   *
   * For instance, any container with @graph will NOT be buffered.
   *
   * This will ignore any arrays in the key chain.
   *
   * @param {ParsingContext} parsingContext A parsing context.
   * @param {any[]} keys The array of keys.
   * @param {number} depth The current depth.
   * @return {Promise<boolean>} If we are in the scope of a container handler.
   */
  static async isBufferableContainerHandler(parsingContext, keys, depth) {
    const handler = await EntryHandlerContainer.getContainerHandler(parsingContext, keys, depth);
    return !handler.fallback && !('@graph' in handler.containers);
  }
  isPropertyHandler() {
    return false;
  }
  isStackProcessor() {
    return true;
  }
  async validate(parsingContext, util, keys, depth, inProperty) {
    return !!(await this.test(parsingContext, util, null, keys, depth));
  }
  async test(parsingContext, util, key, keys, depth) {
    const containers = Util_1.Util.getContextValueContainer(await parsingContext.getContext(keys, 2), keys[depth - 1]);
    for (const containerName in EntryHandlerContainer.CONTAINER_HANDLERS) {
      if (containers[containerName]) {
        return {
          containers,
          handler: EntryHandlerContainer.CONTAINER_HANDLERS[containerName]
        };
      }
    }
    return null;
  }
  async handle(parsingContext, util, key, keys, value, depth, testResult) {
    return testResult.handler.handle(testResult.containers, parsingContext, util, keys, value, depth);
  }
}
exports.EntryHandlerContainer = EntryHandlerContainer;
EntryHandlerContainer.CONTAINER_HANDLERS = {
  '@id': new ContainerHandlerIdentifier_1.ContainerHandlerIdentifier(),
  '@index': new ContainerHandlerIndex_1.ContainerHandlerIndex(),
  '@language': new ContainerHandlerLanguage_1.ContainerHandlerLanguage(),
  '@type': new ContainerHandlerType_1.ContainerHandlerType()
};

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerInvalidFallback.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerInvalidFallback.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerInvalidFallback = void 0;
/**
 * A catch-all for properties, that will either emit an error or ignore,
 * depending on whether or not the `strictValues` property is set.
 */
class EntryHandlerInvalidFallback {
  isPropertyHandler() {
    return false;
  }
  isStackProcessor() {
    return true;
  }
  async validate(parsingContext, util, keys, depth, inProperty) {
    return false;
  }
  async test(parsingContext, util, key, keys, depth) {
    return true;
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    parsingContext.emittedStack[depth] = false;
  }
}
exports.EntryHandlerInvalidFallback = EntryHandlerInvalidFallback;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerPredicate.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerPredicate.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerPredicate = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const Util_1 = __webpack_require__(/*! ../Util */ "./node_modules/jsonld-streaming-parser/lib/Util.js");
/**
 * Interprets keys as predicates.
 * The most common case in JSON-LD processing.
 */
class EntryHandlerPredicate {
  /**
   * Handle the given predicate-object by either emitting it,
   * or by placing it in the appropriate stack for later emission when no @graph and/or @id has been defined.
   * @param {ParsingContext} parsingContext A parsing context.
   * @param {Util} util A utility instance.
   * @param {any[]} keys A stack of keys.
   * @param {number} depth The current depth.
   * @param {Term} predicate The predicate.
   * @param {Term} object The object.
   * @param {boolean} reverse If the property is reversed.
   * @return {Promise<void>} A promise resolving when handling is done.
   */
  static async handlePredicateObject(parsingContext, util, keys, depth, predicate, object, reverse) {
    const depthProperties = await util.getPropertiesDepth(keys, depth);
    const depthOffsetGraph = await util.getDepthOffsetGraph(depth, keys);
    const depthPropertiesGraph = depth - depthOffsetGraph;
    const subjects = parsingContext.idStack[depthProperties];
    if (subjects) {
      // Emit directly if the @id was already defined
      for (const subject of subjects) {
        // Check if we're in a @graph context
        const atGraph = depthOffsetGraph >= 0;
        if (atGraph) {
          const graphs = parsingContext.idStack[depthPropertiesGraph - 1];
          if (graphs) {
            for (const graph of graphs) {
              // Emit our quad if graph @id is known
              if (reverse) {
                util.validateReverseSubject(object);
                parsingContext.emitQuad(depth, util.dataFactory.quad(object, predicate, subject, graph));
              } else {
                parsingContext.emitQuad(depth, util.dataFactory.quad(subject, predicate, object, graph));
              }
            }
          } else {
            // Buffer our triple if graph @id is not known yet.
            if (reverse) {
              util.validateReverseSubject(object);
              parsingContext.getUnidentifiedGraphBufferSafe(depthPropertiesGraph - 1).push({
                subject: object,
                predicate,
                object: subject
              });
            } else {
              parsingContext.getUnidentifiedGraphBufferSafe(depthPropertiesGraph - 1).push({
                subject,
                predicate,
                object
              });
            }
          }
        } else {
          // Emit if no @graph was applicable
          const graph = await util.getGraphContainerValue(keys, depthProperties);
          if (reverse) {
            util.validateReverseSubject(object);
            parsingContext.emitQuad(depth, util.dataFactory.quad(object, predicate, subject, graph));
          } else {
            parsingContext.emitQuad(depth, util.dataFactory.quad(subject, predicate, object, graph));
          }
        }
      }
    } else {
      // Buffer until our @id becomes known, or we go up the stack
      if (reverse) {
        util.validateReverseSubject(object);
      }
      parsingContext.getUnidentifiedValueBufferSafe(depthProperties).push({
        predicate,
        object,
        reverse
      });
    }
  }
  isPropertyHandler() {
    return true;
  }
  isStackProcessor() {
    return true;
  }
  async validate(parsingContext, util, keys, depth, inProperty) {
    const key = keys[depth];
    if (key) {
      const context = await parsingContext.getContext(keys);
      if (!parsingContext.jsonLiteralStack[depth] && (await util.predicateToTerm(context, keys[depth]))) {
        // If this valid predicate is of type @json, mark it so in the stack so that no deeper handling of nodes occurs.
        if (Util_1.Util.getContextValueType(context, key) === '@json') {
          parsingContext.jsonLiteralStack[depth + 1] = true;
        }
        return true;
      }
    }
    return false;
  }
  async test(parsingContext, util, key, keys, depth) {
    return keys[depth];
  }
  async handle(parsingContext, util, key, keys, value, depth, testResult) {
    const keyOriginal = keys[depth];
    const context = await parsingContext.getContext(keys);
    const predicate = await util.predicateToTerm(context, key);
    if (predicate) {
      const objects = await util.valueToTerm(context, key, value, depth, keys);
      if (objects.length) {
        for (let object of objects) {
          const reverse = Util_1.Util.isPropertyReverse(context, keyOriginal, await util.unaliasKeywordParent(keys, depth));
          if (value) {
            // Special case if our term was defined as an @list, but does not occur in an array,
            // In that case we just emit it as an RDF list with a single element.
            const listValueContainer = ('@list' in Util_1.Util.getContextValueContainer(context, key));
            if (listValueContainer || value['@list']) {
              if ((listValueContainer && !Array.isArray(value) && !value['@list'] || value['@list'] && !Array.isArray(value['@list'])) && object !== util.rdfNil) {
                const listPointer = util.dataFactory.blankNode();
                parsingContext.emitQuad(depth, util.dataFactory.quad(listPointer, util.rdfRest, util.rdfNil, util.getDefaultGraph()));
                parsingContext.emitQuad(depth, util.dataFactory.quad(listPointer, util.rdfFirst, object, util.getDefaultGraph()));
                object = listPointer;
              }
              // Lists are not allowed in @reverse'd properties
              if (reverse && !parsingContext.allowSubjectList) {
                throw new jsonld_context_parser_1.ErrorCoded(`Found illegal list value in subject position at ${key}`, jsonld_context_parser_1.ERROR_CODES.INVALID_REVERSE_PROPERTY_VALUE);
              }
            }
          }
          await EntryHandlerPredicate.handlePredicateObject(parsingContext, util, keys, depth, predicate, object, reverse);
        }
      }
    }
  }
}
exports.EntryHandlerPredicate = EntryHandlerPredicate;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeyword = void 0;
/**
 * An abstract keyword entry handler.
 */
class EntryHandlerKeyword {
  constructor(keyword) {
    this.keyword = keyword;
  }
  isPropertyHandler() {
    return false;
  }
  isStackProcessor() {
    return true;
  }
  async validate(parsingContext, util, keys, depth, inProperty) {
    return false;
  }
  async test(parsingContext, util, key, keys, depth) {
    return key === this.keyword;
  }
}
exports.EntryHandlerKeyword = EntryHandlerKeyword;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordContext.js":
/*!*****************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordContext.js ***!
  \*****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeywordContext = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const EntryHandlerKeyword_1 = __webpack_require__(/*! ./EntryHandlerKeyword */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js");
/**
 * Handles @context entries.
 */
class EntryHandlerKeywordContext extends EntryHandlerKeyword_1.EntryHandlerKeyword {
  constructor() {
    super('@context');
  }
  isStackProcessor() {
    return false;
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    // Error if an out-of-order context was found when support is not enabled.
    if (parsingContext.streamingProfile && (parsingContext.processingStack[depth] || parsingContext.processingType[depth] || parsingContext.idStack[depth] !== undefined)) {
      parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded('Found an out-of-order context, while streaming is enabled.' + '(disable `streamingProfile`)', jsonld_context_parser_1.ERROR_CODES.INVALID_STREAMING_KEY_ORDER));
    }
    // Find the parent context to inherit from.
    // We actually request a context for the current depth (with fallback to parent)
    // because we want to take into account any property-scoped contexts that are defined for this depth.
    const parentContext = parsingContext.getContext(keys);
    // Set the context for this scope
    const context = parsingContext.parseContext(value, (await parentContext).getContextRaw());
    parsingContext.contextTree.setContext(keys.slice(0, -1), context);
    parsingContext.emitContext(value);
    await parsingContext.validateContext(await context);
  }
}
exports.EntryHandlerKeywordContext = EntryHandlerKeywordContext;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordGraph.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordGraph.js ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeywordGraph = void 0;
const EntryHandlerKeyword_1 = __webpack_require__(/*! ./EntryHandlerKeyword */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js");
/**
 * Handles @graph entries.
 */
class EntryHandlerKeywordGraph extends EntryHandlerKeyword_1.EntryHandlerKeyword {
  constructor() {
    super('@graph');
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    // The current identifier identifies a graph for the deeper level.
    parsingContext.graphStack[depth + 1] = true;
  }
}
exports.EntryHandlerKeywordGraph = EntryHandlerKeywordGraph;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordId.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordId.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeywordId = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const EntryHandlerKeyword_1 = __webpack_require__(/*! ./EntryHandlerKeyword */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js");
/**
 * Handles @id entries.
 */
class EntryHandlerKeywordId extends EntryHandlerKeyword_1.EntryHandlerKeyword {
  constructor() {
    super('@id');
  }
  isStackProcessor() {
    return false;
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    if (typeof value !== 'string') {
      parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found illegal @id '${value}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_ID_VALUE));
    }
    // Determine the canonical place for this id.
    // For example, @nest parents should be ignored.
    const depthProperties = await util.getPropertiesDepth(keys, depth);
    // Error if an @id for this node already existed.
    if (parsingContext.idStack[depthProperties] !== undefined) {
      if (parsingContext.idStack[depthProperties][0].listHead) {
        // Error if an @list was already defined for this node
        parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found illegal neighbouring entries next to @list for key: '${keys[depth - 1]}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_SET_OR_LIST_OBJECT));
      } else {
        // Otherwise, the previous id was just because of an @id entry.
        parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found duplicate @ids '${parsingContext.idStack[depthProperties][0].value}' and '${value}'`, jsonld_context_parser_1.ERROR_CODES.COLLIDING_KEYWORDS));
      }
    }
    // Save our @id on the stack
    parsingContext.idStack[depthProperties] = util.nullableTermToArray(await util.resourceToTerm(await parsingContext.getContext(keys), value));
  }
}
exports.EntryHandlerKeywordId = EntryHandlerKeywordId;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordIncluded.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordIncluded.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeywordIncluded = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const EntryHandlerKeyword_1 = __webpack_require__(/*! ./EntryHandlerKeyword */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js");
/**
 * Handles @included entries.
 */
class EntryHandlerKeywordIncluded extends EntryHandlerKeyword_1.EntryHandlerKeyword {
  constructor() {
    super('@included');
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    if (typeof value !== 'object') {
      parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found illegal @included '${value}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_INCLUDED_VALUE));
    }
    const valueUnliased = await util.unaliasKeywords(value, keys, depth, await parsingContext.getContext(keys));
    if ('@value' in valueUnliased) {
      parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found an illegal @included @value node '${JSON.stringify(value)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_INCLUDED_VALUE));
    }
    if ('@list' in valueUnliased) {
      parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found an illegal @included @list node '${JSON.stringify(value)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_INCLUDED_VALUE));
    }
    parsingContext.emittedStack[depth] = false;
  }
}
exports.EntryHandlerKeywordIncluded = EntryHandlerKeywordIncluded;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordNest.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordNest.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeywordNest = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const EntryHandlerKeyword_1 = __webpack_require__(/*! ./EntryHandlerKeyword */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js");
/**
 * Handles @nest entries.
 */
class EntryHandlerKeywordNest extends EntryHandlerKeyword_1.EntryHandlerKeyword {
  constructor() {
    super('@nest');
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    if (typeof value !== 'object') {
      parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found invalid @nest entry for '${key}': '${value}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_NEST_VALUE));
    }
    if ('@value' in (await util.unaliasKeywords(value, keys, depth, await parsingContext.getContext(keys)))) {
      parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found an invalid @value node for '${key}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_NEST_VALUE));
    }
    parsingContext.emittedStack[depth] = false;
  }
}
exports.EntryHandlerKeywordNest = EntryHandlerKeywordNest;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordType.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordType.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeywordType = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
const Util_1 = __webpack_require__(/*! ../../Util */ "./node_modules/jsonld-streaming-parser/lib/Util.js");
const EntryHandlerPredicate_1 = __webpack_require__(/*! ../EntryHandlerPredicate */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/EntryHandlerPredicate.js");
const EntryHandlerKeyword_1 = __webpack_require__(/*! ./EntryHandlerKeyword */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js");
/**
 * Handles @graph entries.
 */
class EntryHandlerKeywordType extends EntryHandlerKeyword_1.EntryHandlerKeyword {
  constructor() {
    super('@type');
  }
  isStackProcessor() {
    return false;
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    const keyOriginal = keys[depth];
    // The current identifier identifies an rdf:type predicate.
    // But we only emit it once the node closes,
    // as it's possible that the @type is used to identify the datatype of a literal, which we ignore here.
    const context = await parsingContext.getContext(keys);
    const predicate = util.rdfType;
    const reverse = Util_1.Util.isPropertyReverse(context, keyOriginal, await util.unaliasKeywordParent(keys, depth));
    // Handle multiple values if the value is an array
    const elements = Array.isArray(value) ? value : [value];
    for (const element of elements) {
      if (typeof element !== 'string') {
        parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found illegal @type '${element}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_TYPE_VALUE));
      }
      const type = util.createVocabOrBaseTerm(context, element);
      if (type) {
        await EntryHandlerPredicate_1.EntryHandlerPredicate.handlePredicateObject(parsingContext, util, keys, depth, predicate, type, reverse);
      }
    }
    // Collect type-scoped contexts if they exist
    let scopedContext = Promise.resolve(context);
    let hasTypedScopedContext = false;
    for (const element of elements.sort()) {
      // Spec requires lexicographical ordering
      const typeContext = Util_1.Util.getContextValue(context, '@context', element, null);
      if (typeContext) {
        hasTypedScopedContext = true;
        scopedContext = scopedContext.then(c => parsingContext.parseContext(typeContext, c.getContextRaw()));
      }
    }
    // Error if an out-of-order type-scoped context was found when support is not enabled.
    if (parsingContext.streamingProfile && (hasTypedScopedContext || !parsingContext.streamingProfileAllowOutOfOrderPlainType) && (parsingContext.processingStack[depth] || parsingContext.idStack[depth])) {
      parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded('Found an out-of-order type-scoped context, while streaming is enabled.' + '(disable `streamingProfile`)', jsonld_context_parser_1.ERROR_CODES.INVALID_STREAMING_KEY_ORDER));
    }
    // If at least least one type-scoped context applies, set them in the tree.
    if (hasTypedScopedContext) {
      // Do not propagate by default
      scopedContext = scopedContext.then(c => {
        if (!('@propagate' in c.getContextRaw())) {
          c.getContextRaw()['@propagate'] = false;
        }
        // Set the original context at this depth as a fallback
        // This is needed when a context was already defined at the given depth,
        // and this context needs to remain accessible from child nodes when propagation is disabled.
        if (c.getContextRaw()['@propagate'] === false) {
          c.getContextRaw()['@__propagateFallback'] = context.getContextRaw();
        }
        return c;
      });
      // Set the new context in the context tree
      parsingContext.contextTree.setContext(keys.slice(0, keys.length - 1), scopedContext);
    }
    // Flag that type has been processed at this depth
    parsingContext.processingType[depth] = true;
  }
}
exports.EntryHandlerKeywordType = EntryHandlerKeywordType;

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordUnknownFallback.js":
/*!*************************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordUnknownFallback.js ***!
  \*************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeywordUnknownFallback = void 0;
const jsonld_context_parser_1 = __webpack_require__(/*! jsonld-context-parser */ "./node_modules/jsonld-context-parser/index.js");
/**
 * A catch-all for keywords, that will either emit an error or ignore,
 * depending on whether or not the `strictValues` property is set.
 */
class EntryHandlerKeywordUnknownFallback {
  isPropertyHandler() {
    return false;
  }
  isStackProcessor() {
    return true;
  }
  async validate(parsingContext, util, keys, depth, inProperty) {
    const key = await util.unaliasKeyword(keys[depth], keys, depth);
    if (jsonld_context_parser_1.Util.isPotentialKeyword(key)) {
      // Don't emit anything inside free-floating lists
      if (!inProperty) {
        if (key === '@list') {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  async test(parsingContext, util, key, keys, depth) {
    return jsonld_context_parser_1.Util.isPotentialKeyword(key);
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    const keywordType = EntryHandlerKeywordUnknownFallback.VALID_KEYWORDS_TYPES[key];
    if (keywordType !== undefined) {
      if (keywordType && typeof value !== keywordType.type) {
        parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Invalid value type for '${key}' with value '${value}'`, keywordType.errorCode));
      }
    } else if (parsingContext.strictValues) {
      parsingContext.emitError(new Error(`Unknown keyword '${key}' with value '${value}'`));
    }
    parsingContext.emittedStack[depth] = false;
  }
}
exports.EntryHandlerKeywordUnknownFallback = EntryHandlerKeywordUnknownFallback;
EntryHandlerKeywordUnknownFallback.VALID_KEYWORDS_TYPES = {
  '@index': {
    type: 'string',
    errorCode: jsonld_context_parser_1.ERROR_CODES.INVALID_INDEX_VALUE
  },
  '@list': null,
  '@reverse': {
    type: 'object',
    errorCode: jsonld_context_parser_1.ERROR_CODES.INVALID_REVERSE_VALUE
  },
  '@set': null,
  '@value': null
};

/***/ }),

/***/ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordValue.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeywordValue.js ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntryHandlerKeywordValue = void 0;
const EntryHandlerKeyword_1 = __webpack_require__(/*! ./EntryHandlerKeyword */ "./node_modules/jsonld-streaming-parser/lib/entryhandler/keyword/EntryHandlerKeyword.js");
/**
 * Handles @value entries.
 */
class EntryHandlerKeywordValue extends EntryHandlerKeyword_1.EntryHandlerKeyword {
  constructor() {
    super('@value');
  }
  async validate(parsingContext, util, keys, depth, inProperty) {
    // If this is @value, mark it so in the stack so that no deeper handling of nodes occurs.
    const key = keys[depth];
    if (key && !parsingContext.literalStack[depth] && (await this.test(parsingContext, util, key, keys, depth))) {
      parsingContext.literalStack[depth] = true;
    }
    return super.validate(parsingContext, util, keys, depth, inProperty);
  }
  async test(parsingContext, util, key, keys, depth) {
    return (await util.unaliasKeyword(keys[depth], keys.slice(0, keys.length - 1), depth - 1, true)) === '@value';
  }
  async handle(parsingContext, util, key, keys, value, depth) {
    // If the value is valid, indicate that we are processing a literal.
    // The actual value will be determined at the parent level when the @value is part of an object,
    // because we may want to take into account additional entries such as @language.
    // See {@link Util.valueToTerm}
    // Indicate that we are processing a literal, and that no later predicates should be parsed at this depth.
    parsingContext.literalStack[depth] = true;
    // Void any buffers that we may have accumulated up until now
    delete parsingContext.unidentifiedValuesBuffer[depth];
    delete parsingContext.unidentifiedGraphsBuffer[depth];
    // Indicate that we have not emitted at this depth
    parsingContext.emittedStack[depth] = false;
  }
}
exports.EntryHandlerKeywordValue = EntryHandlerKeywordValue;

/***/ }),

/***/ "./node_modules/relative-to-absolute-iri/index.js":
/*!********************************************************!*\
  !*** ./node_modules/relative-to-absolute-iri/index.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, {
    enumerable: true,
    get: function () {
      return m[k];
    }
  });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __exportStar = this && this.__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
__exportStar(__webpack_require__(/*! ./lib/Resolve */ "./node_modules/relative-to-absolute-iri/lib/Resolve.js"), exports);

/***/ }),

/***/ "./node_modules/relative-to-absolute-iri/lib/Resolve.js":
/*!**************************************************************!*\
  !*** ./node_modules/relative-to-absolute-iri/lib/Resolve.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeDotSegmentsOfPath = exports.removeDotSegments = exports.resolve = void 0;
/**
 * Convert the given relative IRI to an absolute IRI
 * by taking into account the given optional baseIRI.
 *
 * @param {string} relativeIRI The relative IRI to convert to an absolute IRI.
 * @param {string} baseIRI The optional base IRI.
 * @return {string} an absolute IRI.
 */
function resolve(relativeIRI, baseIRI) {
  baseIRI = baseIRI || '';
  const baseFragmentPos = baseIRI.indexOf('#');
  // Ignore any fragments in the base IRI
  if (baseFragmentPos > 0) {
    baseIRI = baseIRI.substr(0, baseFragmentPos);
  }
  // Convert empty value directly to base IRI
  if (!relativeIRI.length) {
    // At this point, the baseIRI MUST be absolute, otherwise we error
    if (baseIRI.indexOf(':') < 0) {
      throw new Error(`Found invalid baseIRI '${baseIRI}' for value '${relativeIRI}'`);
    }
    return baseIRI;
  }
  // If the value starts with a query character, concat directly (but strip the existing query)
  if (relativeIRI.startsWith('?')) {
    const baseQueryPos = baseIRI.indexOf('?');
    if (baseQueryPos > 0) {
      baseIRI = baseIRI.substr(0, baseQueryPos);
    }
    return baseIRI + relativeIRI;
  }
  // If the value starts with a fragment character, concat directly
  if (relativeIRI.startsWith('#')) {
    return baseIRI + relativeIRI;
  }
  // Ignore baseIRI if it is empty
  if (!baseIRI.length) {
    const relativeColonPos = relativeIRI.indexOf(':');
    if (relativeColonPos < 0) {
      throw new Error(`Found invalid relative IRI '${relativeIRI}' for a missing baseIRI`);
    }
    return removeDotSegmentsOfPath(relativeIRI, relativeColonPos);
  }
  // Ignore baseIRI if the value is absolute
  const valueColonPos = relativeIRI.indexOf(':');
  if (valueColonPos >= 0) {
    return removeDotSegmentsOfPath(relativeIRI, valueColonPos);
  }
  // At this point, the baseIRI MUST be absolute, otherwise we error
  const baseColonPos = baseIRI.indexOf(':');
  if (baseColonPos < 0) {
    throw new Error(`Found invalid baseIRI '${baseIRI}' for value '${relativeIRI}'`);
  }
  const baseIRIScheme = baseIRI.substr(0, baseColonPos + 1);
  // Inherit the baseIRI scheme if the value starts with '//'
  if (relativeIRI.indexOf('//') === 0) {
    return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
  }
  // Check cases where '://' occurs in the baseIRI, and where there is no '/' after a ':' anymore.
  let baseSlashAfterColonPos;
  if (baseIRI.indexOf('//', baseColonPos) === baseColonPos + 1) {
    // If there is no additional '/' after the '//'.
    baseSlashAfterColonPos = baseIRI.indexOf('/', baseColonPos + 3);
    if (baseSlashAfterColonPos < 0) {
      // If something other than a '/' follows the '://', append the value after a '/',
      // otherwise, prefix the value with only the baseIRI scheme.
      if (baseIRI.length > baseColonPos + 3) {
        return baseIRI + '/' + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
      } else {
        return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
      }
    }
  } else {
    // If there is not even a single '/' after the ':'
    baseSlashAfterColonPos = baseIRI.indexOf('/', baseColonPos + 1);
    if (baseSlashAfterColonPos < 0) {
      // If we don't have a '/' after the ':',
      // prefix the value with only the baseIRI scheme.
      return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
    }
  }
  // If the value starts with a '/', then prefix it with everything before the first effective slash of the base IRI.
  if (relativeIRI.indexOf('/') === 0) {
    return baseIRI.substr(0, baseSlashAfterColonPos) + removeDotSegments(relativeIRI);
  }
  let baseIRIPath = baseIRI.substr(baseSlashAfterColonPos);
  const baseIRILastSlashPos = baseIRIPath.lastIndexOf('/');
  // Ignore everything after the last '/' in the baseIRI path
  if (baseIRILastSlashPos >= 0 && baseIRILastSlashPos < baseIRIPath.length - 1) {
    baseIRIPath = baseIRIPath.substr(0, baseIRILastSlashPos + 1);
    // Also remove the first character of the relative path if it starts with '.' (and not '..' or './')
    // This change is only allowed if there is something else following the path
    if (relativeIRI[0] === '.' && relativeIRI[1] !== '.' && relativeIRI[1] !== '/' && relativeIRI[2]) {
      relativeIRI = relativeIRI.substr(1);
    }
  }
  // Prefix the value with the baseIRI path where
  relativeIRI = baseIRIPath + relativeIRI;
  // Remove dot segment from the IRI
  relativeIRI = removeDotSegments(relativeIRI);
  // Prefix our transformed value with the part of the baseIRI until the first '/' after the first ':'.
  return baseIRI.substr(0, baseSlashAfterColonPos) + relativeIRI;
}
exports.resolve = resolve;
/**
 * Remove dot segments from the given path,
 * as described in https://www.ietf.org/rfc/rfc3986.txt (page 32).
 * @param {string} path An IRI path.
 * @return {string} A path, will always start with a '/'.
 */
function removeDotSegments(path) {
  // Prepare a buffer with segments between each '/.
  // Each segment represents an array of characters.
  const segmentBuffers = [];
  let i = 0;
  while (i < path.length) {
    // Remove '/.' or '/..'
    switch (path[i]) {
      case '/':
        if (path[i + 1] === '.') {
          if (path[i + 2] === '.') {
            // Start a new segment if we find an invalid character after the '.'
            if (!isCharacterAllowedAfterRelativePathSegment(path[i + 3])) {
              segmentBuffers.push([]);
              i++;
              break;
            }
            // Go to parent directory,
            // so we remove a parent segment
            segmentBuffers.pop();
            // Ensure that we end with a slash if there is a trailing '/..'
            if (!path[i + 3]) {
              segmentBuffers.push([]);
            }
            i += 3;
          } else {
            // Start a new segment if we find an invalid character after the '.'
            if (!isCharacterAllowedAfterRelativePathSegment(path[i + 2])) {
              segmentBuffers.push([]);
              i++;
              break;
            }
            // Ensure that we end with a slash if there is a trailing '/.'
            if (!path[i + 2]) {
              segmentBuffers.push([]);
            }
            // Go to the current directory,
            // so we do nothing
            i += 2;
          }
        } else {
          // Start a new segment
          segmentBuffers.push([]);
          i++;
        }
        break;
      case '#':
      case '?':
        // Query and fragment string should be appended unchanged
        if (!segmentBuffers.length) {
          segmentBuffers.push([]);
        }
        segmentBuffers[segmentBuffers.length - 1].push(path.substr(i));
        // Break the while loop
        i = path.length;
        break;
      default:
        // Not a special character, just append it to our buffer
        if (!segmentBuffers.length) {
          segmentBuffers.push([]);
        }
        segmentBuffers[segmentBuffers.length - 1].push(path[i]);
        i++;
        break;
    }
  }
  return '/' + segmentBuffers.map(buffer => buffer.join('')).join('/');
}
exports.removeDotSegments = removeDotSegments;
/**
 * Removes dot segments of the given IRI.
 * @param {string} iri An IRI (or part of IRI).
 * @param {number} colonPosition The position of the first ':' in the IRI.
 * @return {string} The IRI where dot segments were removed.
 */
function removeDotSegmentsOfPath(iri, colonPosition) {
  // Determine where we should start looking for the first '/' that indicates the start of the path
  let searchOffset = colonPosition + 1;
  if (colonPosition >= 0) {
    if (iri[colonPosition + 1] === '/' && iri[colonPosition + 2] === '/') {
      searchOffset = colonPosition + 3;
    }
  } else {
    if (iri[0] === '/' && iri[1] === '/') {
      searchOffset = 2;
    }
  }
  // Determine the path
  const pathSeparator = iri.indexOf('/', searchOffset);
  if (pathSeparator < 0) {
    return iri;
  }
  const base = iri.substr(0, pathSeparator);
  const path = iri.substr(pathSeparator);
  // Remove dot segments from the path
  return base + removeDotSegments(path);
}
exports.removeDotSegmentsOfPath = removeDotSegmentsOfPath;
function isCharacterAllowedAfterRelativePathSegment(character) {
  return !character || character === '#' || character === '?' || character === '/';
}

/***/ })

}]);
//# sourceMappingURL=chunk-0.development.js.map