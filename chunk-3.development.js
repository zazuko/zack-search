(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[3],{

/***/ "./node_modules/@rdfjs/serializer-jsonld/index.js":
/*!********************************************************!*\
  !*** ./node_modules/@rdfjs/serializer-jsonld/index.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const SerializerStream = __webpack_require__(/*! ./lib/SerializerStream */ "./node_modules/@rdfjs/serializer-jsonld/lib/SerializerStream.js");
const Sink = __webpack_require__(/*! @rdfjs/sink */ "./node_modules/@rdfjs/sink/index.js");
class Serializer extends Sink {
  constructor(options) {
    super(SerializerStream, options);
  }
}
module.exports = Serializer;

/***/ }),

/***/ "./node_modules/@rdfjs/serializer-jsonld/lib/ObjectEncoder.js":
/*!********************************************************************!*\
  !*** ./node_modules/@rdfjs/serializer-jsonld/lib/ObjectEncoder.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

class ObjectEncoder {
  constructor(stream) {
    this.stream = stream;
    this.array = [];
  }
  push(jsonld) {
    this.array.push(jsonld);
  }
  end() {
    this.stream.push(this.array);
    this.stream.push(null);
  }
}
module.exports = ObjectEncoder;

/***/ }),

/***/ "./node_modules/@rdfjs/serializer-jsonld/lib/SerializerStream.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@rdfjs/serializer-jsonld/lib/SerializerStream.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const Readable = __webpack_require__(/*! readable-stream */ "./node_modules/readable-stream/readable-browser.js");
const ObjectEncoder = __webpack_require__(/*! ./ObjectEncoder */ "./node_modules/@rdfjs/serializer-jsonld/lib/ObjectEncoder.js");
const StringEncoder = __webpack_require__(/*! ./StringEncoder */ "./node_modules/@rdfjs/serializer-jsonld/lib/StringEncoder.js");
class SerializerStream extends Readable {
  constructor(input, {
    encoding = 'object'
  } = {}) {
    super({
      objectMode: true,
      read: () => {}
    });
    if (encoding === 'object') {
      this.encoder = new ObjectEncoder(this);
    }
    if (encoding === 'string') {
      this.encoder = new StringEncoder(this);
    }
    if (!this.encoder) {
      throw new Error(`unknown encoding: ${encoding}`);
    }
    input.on('data', quad => {
      const jsonld = {};
      let triple = jsonld;
      if (quad.graph.termType !== 'DefaultGraph') {
        jsonld['@id'] = quad.graph.value;
        jsonld['@graph'] = {};
        triple = jsonld['@graph'];
      }
      triple['@id'] = SerializerStream.subjectValue(quad.subject);
      if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        triple['@type'] = SerializerStream.subjectValue(quad.object);
      } else {
        triple[quad.predicate.value] = SerializerStream.objectValue(quad.object);
      }
      this.encoder.push(jsonld);
    });
    input.on('end', () => this.encoder.end());
    input.on('error', err => this.emit('error', err));
  }
  static subjectValue(subject) {
    return subject.termType === 'BlankNode' ? '_:' + subject.value : subject.value;
  }
  static objectValue(object) {
    if (object.termType === 'NamedNode') {
      return {
        '@id': object.value
      };
    }
    if (object.termType === 'BlankNode') {
      return {
        '@id': '_:' + object.value
      };
    }
    if (object.language) {
      return {
        '@language': object.language,
        '@value': object.value
      };
    } else if (object.datatype && object.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
      return {
        '@type': object.datatype.value,
        '@value': object.value
      };
    } else {
      return object.value;
    }
  }
}
module.exports = SerializerStream;

/***/ }),

/***/ "./node_modules/@rdfjs/serializer-jsonld/lib/StringEncoder.js":
/*!********************************************************************!*\
  !*** ./node_modules/@rdfjs/serializer-jsonld/lib/StringEncoder.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

class StringEncoder {
  constructor(stream) {
    this.stream = stream;
    this.first = true;
    this.stream.push('[');
  }
  push(jsonld) {
    if (this.first) {
      this.first = false;
    } else {
      this.stream.push(',');
    }
    this.stream.push(JSON.stringify(jsonld));
  }
  end() {
    this.stream.push(']');
    this.stream.push(null);
  }
}
module.exports = StringEncoder;

/***/ })

}]);
//# sourceMappingURL=chunk-3.development.js.map