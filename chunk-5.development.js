(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[5],{

/***/ "./node_modules/@rdfjs/serializer-ntriples/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/@rdfjs/serializer-ntriples/index.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const SerializerStream = __webpack_require__(/*! ./lib/SerializerStream */ "./node_modules/@rdfjs/serializer-ntriples/lib/SerializerStream.js");
const Sink = __webpack_require__(/*! @rdfjs/sink */ "./node_modules/@rdfjs/sink/index.js");
class Serializer extends Sink {
  constructor() {
    super(SerializerStream);
  }
}
module.exports = Serializer;

/***/ }),

/***/ "./node_modules/@rdfjs/serializer-ntriples/lib/SerializerStream.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@rdfjs/serializer-ntriples/lib/SerializerStream.js ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const quadToNTriples = __webpack_require__(/*! @rdfjs/to-ntriples */ "./node_modules/@rdfjs/to-ntriples/index.js").quadToNTriples;
const ReadableToReadable = __webpack_require__(/*! readable-to-readable */ "./node_modules/readable-to-readable/index.js");
class SerializerStream extends ReadableToReadable {
  constructor(input) {
    super(input, {
      map: quad => quadToNTriples(quad) + '\n'
    });
  }
}
module.exports = SerializerStream;

/***/ })

}]);
//# sourceMappingURL=chunk-5.development.js.map