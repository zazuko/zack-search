(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[1],{

/***/ "./node_modules/rdfxml-streaming-parser/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/rdfxml-streaming-parser/index.js ***!
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
__exportStar(__webpack_require__(/*! ./lib/RdfXmlParser */ "./node_modules/rdfxml-streaming-parser/lib/RdfXmlParser.js"), exports);

/***/ }),

/***/ "./node_modules/rdfxml-streaming-parser/lib/ParseError.js":
/*!****************************************************************!*\
  !*** ./node_modules/rdfxml-streaming-parser/lib/ParseError.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParseError = void 0;
/**
 * An error that includes line and column in the error message.
 */
class ParseError extends Error {
  constructor(parser, message) {
    const saxParser = parser.saxStream._parser;
    super(parser.trackPosition ? `Line ${saxParser.line + 1} column ${saxParser.column + 1}: ${message}` : message);
  }
}
exports.ParseError = ParseError;

/***/ }),

/***/ "./node_modules/rdfxml-streaming-parser/lib/RdfXmlParser.js":
/*!******************************************************************!*\
  !*** ./node_modules/rdfxml-streaming-parser/lib/RdfXmlParser.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParseType = exports.RdfXmlParser = void 0;
const relative_to_absolute_iri_1 = __webpack_require__(/*! relative-to-absolute-iri */ "./node_modules/relative-to-absolute-iri/index.js");
const sax_1 = __webpack_require__(/*! sax */ "./node_modules/sax/lib/sax.js");
const stream_1 = __webpack_require__(/*! stream */ "./node_modules/readable-stream/readable-browser.js");
const ParseError_1 = __webpack_require__(/*! ./ParseError */ "./node_modules/rdfxml-streaming-parser/lib/ParseError.js");
const rdf_data_factory_1 = __webpack_require__(/*! rdf-data-factory */ "./node_modules/rdf-data-factory/index.js");
class RdfXmlParser extends stream_1.Transform {
  constructor(args) {
    super({
      readableObjectMode: true
    });
    this.activeTagStack = [];
    this.nodeIds = {};
    if (args) {
      Object.assign(this, args);
      this.options = args;
    }
    if (!this.dataFactory) {
      this.dataFactory = new rdf_data_factory_1.DataFactory();
    }
    if (!this.baseIRI) {
      this.baseIRI = '';
    }
    if (!this.defaultGraph) {
      this.defaultGraph = this.dataFactory.defaultGraph();
    }
    this.saxStream = sax_1.createStream(this.strict, {
      xmlns: false,
      position: this.trackPosition
    });
    // Workaround for an issue in SAX where non-strict mode either lower- or upper-cases all tags.
    if (!this.strict) {
      this.saxStream._parser.looseCase = 'toString';
    }
    this.attachSaxListeners();
  }
  /**
   * Parse the namespace of the given tag,
   * and take into account the namespace of the parent tag that was already parsed.
   * @param {Tag} tag A tag to parse the namespace from.
   * @param {IActiveTag} parentTag The parent tag, or null if this tag is the root.
   * @return {{[p: string]: string}[]} An array of namespaces,
   *                                   where the last ones have a priority over the first ones.
   */
  static parseNamespace(tag, parentTag) {
    const thisNs = {};
    let hasNs = false;
    for (const attributeKey in tag.attributes) {
      if (attributeKey.startsWith('xmlns')) {
        if (attributeKey.length === 5) {
          // Set default namespace
          hasNs = true;
          thisNs[''] = tag.attributes[attributeKey];
        } else if (attributeKey.charAt(5) === ':') {
          // Definition of a prefix
          hasNs = true;
          thisNs[attributeKey.substr(6)] = tag.attributes[attributeKey];
        }
      }
    }
    const parentNs = parentTag && parentTag.ns ? parentTag.ns : [RdfXmlParser.DEFAULT_NS];
    return hasNs ? parentNs.concat([thisNs]) : parentNs;
  }
  /**
   * Expand the given term value based on the given namespaces.
   * @param {string} term A term value.
   * @param {{[p: string]: string}[]} ns An array of namespaces,
   *                                     where the last ones have a priority over the first ones.
   * @param {RdfXmlParser} parser The RDF/XML parser instance.
   * @return {IExpandedPrefix} An expanded prefix object.
   */
  static expandPrefixedTerm(term, ns, parser) {
    const colonIndex = term.indexOf(':');
    let prefix;
    let local;
    if (colonIndex >= 0) {
      // Prefix is set
      prefix = term.substr(0, colonIndex);
      local = term.substr(colonIndex + 1);
    } else {
      // Prefix is not set, fallback to default namespace
      prefix = '';
      local = term;
    }
    let uri = null;
    let defaultNamespace = null;
    for (let i = ns.length - 1; i >= 0; i--) {
      const nsElement = ns[i][prefix];
      if (nsElement) {
        uri = nsElement;
        break;
      } else if (!defaultNamespace) {
        defaultNamespace = ns[i][''];
      }
    }
    if (!uri) {
      // Error on unbound prefix
      if (prefix && prefix !== 'xmlns') {
        throw new ParseError_1.ParseError(parser, `The prefix '${prefix}' in term '${term}' was not bound.`);
      }
      // Fallback to default namespace if no match was found
      uri = defaultNamespace || '';
    }
    return {
      prefix,
      local,
      uri
    };
  }
  /**
   * Check if the given IRI is valid.
   * @param {string} iri A potential IRI.
   * @return {boolean} If the given IRI is valid.
   */
  static isValidIri(iri) {
    return RdfXmlParser.IRI_REGEX.test(iri);
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
    const parsed = output.pipe(new RdfXmlParser(this.options));
    return parsed;
  }
  _transform(chunk, encoding, callback) {
    try {
      this.saxStream.write(chunk, encoding);
    } catch (e) {
      return callback(e);
    }
    callback();
  }
  /**
   * Create a new parse error instance.
   * @param {string} message An error message.
   * @return {Error} An error instance.
   */
  newParseError(message) {
    return new ParseError_1.ParseError(this, message);
  }
  /**
   * Convert the given value to a IRI by taking into account the baseIRI.
   *
   * This will follow the RDF/XML spec for converting values with baseIRIs to a IRI.
   *
   * @param {string} value The value to convert to an IRI.
   * @param {IActiveTag} activeTag The active tag.
   * @return {NamedNode} an IRI.
   */
  valueToUri(value, activeTag) {
    return this.uriToNamedNode(relative_to_absolute_iri_1.resolve(value, activeTag.baseIRI));
  }
  /**
   * Convert the given value URI string to a named node.
   *
   * This throw an error if the URI is invalid.
   *
   * @param {string} uri A URI string.
   * @return {NamedNode} a named node.
   */
  uriToNamedNode(uri) {
    // Validate URI
    if (!RdfXmlParser.isValidIri(uri)) {
      throw this.newParseError(`Invalid URI: ${uri}`);
    }
    return this.dataFactory.namedNode(uri);
  }
  /**
   * Validate the given value as an NCName: https://www.w3.org/TR/xml-names/#NT-NCName
   * If it is invalid, an error will thrown emitted.
   * @param {string} value A value.
   */
  validateNcname(value) {
    // Validate term as an NCName: https://www.w3.org/TR/xml-names/#NT-NCName
    if (!RdfXmlParser.NCNAME_MATCHER.test(value)) {
      throw this.newParseError(`Not a valid NCName: ${value}`);
    }
  }
  attachSaxListeners() {
    this.saxStream.on('error', error => this.emit('error', error));
    this.saxStream.on('opentag', this.onTag.bind(this));
    this.saxStream.on('text', this.onText.bind(this));
    this.saxStream.on('closetag', this.onCloseTag.bind(this));
    this.saxStream.on('doctype', this.onDoctype.bind(this));
  }
  /**
   * Handle the given tag.
   * @param {QualifiedTag} tag A SAX tag.
   */
  onTag(tag) {
    // Get parent tag
    const parentTag = this.activeTagStack.length ? this.activeTagStack[this.activeTagStack.length - 1] : null;
    let currentParseType = ParseType.RESOURCE;
    if (parentTag) {
      parentTag.hadChildren = true;
      currentParseType = parentTag.childrenParseType;
    }
    // Check if this tag needs to be converted to a string
    if (parentTag && parentTag.childrenStringTags) {
      // Convert this tag to a string
      const tagName = tag.name;
      let attributes = '';
      for (const attributeKey in tag.attributes) {
        attributes += ` ${attributeKey}="${tag.attributes[attributeKey]}"`;
      }
      const tagContents = `${tagName}${attributes}`;
      const tagString = `<${tagContents}>`;
      parentTag.childrenStringTags.push(tagString);
      // Inherit the array, so that deeper tags are appended to this same array
      const stringActiveTag = {
        childrenStringTags: parentTag.childrenStringTags
      };
      stringActiveTag.childrenStringEmitClosingTag = `</${tagName}>`;
      this.activeTagStack.push(stringActiveTag);
      // Halt any further processing
      return;
    }
    const activeTag = {};
    if (parentTag) {
      // Inherit language scope and baseIRI from parent
      activeTag.language = parentTag.language;
      activeTag.baseIRI = parentTag.baseIRI;
    } else {
      activeTag.baseIRI = this.baseIRI;
    }
    this.activeTagStack.push(activeTag);
    activeTag.ns = RdfXmlParser.parseNamespace(tag, parentTag);
    if (currentParseType === ParseType.RESOURCE) {
      this.onTagResource(tag, activeTag, parentTag, !parentTag);
    } else {
      // currentParseType === ParseType.PROPERTY
      this.onTagProperty(tag, activeTag, parentTag);
    }
  }
  /**
   * Handle the given node element in resource-mode.
   * @param {QualifiedTag} tag A SAX tag.
   * @param {IActiveTag} activeTag The currently active tag.
   * @param {IActiveTag} parentTag The parent tag or null.
   * @param {boolean} rootTag If we are currently processing the root tag.
   */
  onTagResource(tag, activeTag, parentTag, rootTag) {
    const tagExpanded = RdfXmlParser.expandPrefixedTerm(tag.name, activeTag.ns, this);
    activeTag.childrenParseType = ParseType.PROPERTY;
    // Assume that the current node is a _typed_ node (2.13), unless we find an rdf:Description as node name
    let typedNode = true;
    if (tagExpanded.uri === RdfXmlParser.RDF) {
      // Check forbidden property element names
      if (!rootTag && RdfXmlParser.FORBIDDEN_NODE_ELEMENTS.indexOf(tagExpanded.local) >= 0) {
        throw this.newParseError(`Illegal node element name: ${tagExpanded.local}`);
      }
      switch (tagExpanded.local) {
        case 'RDF':
          // Tags under <rdf:RDF> must always be resources
          activeTag.childrenParseType = ParseType.RESOURCE;
        case 'Description':
          typedNode = false;
      }
    }
    const predicates = [];
    const objects = [];
    // Collect all attributes as triples
    // Assign subject value only after all attributes have been processed, because baseIRI may change the final val
    let activeSubjectValue = null;
    let claimSubjectNodeId = false;
    let subjectValueBlank = false;
    let explicitType = null;
    for (const attributeKey in tag.attributes) {
      const attributeValue = tag.attributes[attributeKey];
      const attributeKeyExpanded = RdfXmlParser.expandPrefixedTerm(attributeKey, activeTag.ns, this);
      if (parentTag && attributeKeyExpanded.uri === RdfXmlParser.RDF) {
        switch (attributeKeyExpanded.local) {
          case 'about':
            if (activeSubjectValue) {
              throw this.newParseError(`Only one of rdf:about, rdf:nodeID and rdf:ID can be present, \
while ${attributeValue} and ${activeSubjectValue} where found.`);
            }
            activeSubjectValue = attributeValue;
            continue;
          case 'ID':
            if (activeSubjectValue) {
              throw this.newParseError(`Only one of rdf:about, rdf:nodeID and rdf:ID can be present, \
while ${attributeValue} and ${activeSubjectValue} where found.`);
            }
            this.validateNcname(attributeValue);
            activeSubjectValue = '#' + attributeValue;
            claimSubjectNodeId = true;
            continue;
          case 'nodeID':
            if (activeSubjectValue) {
              throw this.newParseError(`Only one of rdf:about, rdf:nodeID and rdf:ID can be present, \
while ${attributeValue} and ${activeSubjectValue} where found.`);
            }
            this.validateNcname(attributeValue);
            activeSubjectValue = attributeValue;
            subjectValueBlank = true;
            continue;
          case 'bagID':
            throw this.newParseError(`rdf:bagID is not supported.`);
          case 'type':
            // Emit the rdf:type later as named node instead of the default literal
            explicitType = attributeValue;
            continue;
          case 'aboutEach':
            throw this.newParseError(`rdf:aboutEach is not supported.`);
          case 'aboutEachPrefix':
            throw this.newParseError(`rdf:aboutEachPrefix is not supported.`);
          case 'li':
            throw this.newParseError(`rdf:li on node elements are not supported.`);
        }
      } else if (attributeKeyExpanded.uri === RdfXmlParser.XML) {
        if (attributeKeyExpanded.local === 'lang') {
          activeTag.language = attributeValue === '' ? null : attributeValue.toLowerCase();
          continue;
        } else if (attributeKeyExpanded.local === 'base') {
          // SAX Parser does not expand xml:base, based on DOCTYPE, so we have to do it manually
          activeTag.baseIRI = relative_to_absolute_iri_1.resolve(attributeValue, activeTag.baseIRI);
          continue;
        }
      }
      // Interpret attributes at this point as properties on this node,
      // but we ignore attributes that have no prefix or known expanded URI
      if (attributeKeyExpanded.prefix !== 'xml' && attributeKeyExpanded.uri) {
        predicates.push(this.uriToNamedNode(attributeKeyExpanded.uri + attributeKeyExpanded.local));
        objects.push(attributeValue);
      }
    }
    // Create the subject value _after_ all attributes have been processed
    if (activeSubjectValue !== null) {
      activeTag.subject = subjectValueBlank ? this.dataFactory.blankNode(activeSubjectValue) : this.valueToUri(activeSubjectValue, activeTag);
      if (claimSubjectNodeId) {
        this.claimNodeId(activeTag.subject);
      }
    }
    // Force the creation of a subject if it doesn't exist yet
    if (!activeTag.subject) {
      activeTag.subject = this.dataFactory.blankNode();
    }
    // Emit the type if we're at a typed node
    if (typedNode) {
      const type = this.uriToNamedNode(tagExpanded.uri + tagExpanded.local);
      this.emitTriple(activeTag.subject, this.dataFactory.namedNode(RdfXmlParser.RDF + 'type'), type, parentTag ? parentTag.reifiedStatementId : null);
    }
    if (parentTag) {
      // If the parent tag defined a predicate, add the current tag as property value
      if (parentTag.predicate) {
        if (parentTag.childrenCollectionSubject) {
          // RDF:List-based properties
          const linkTerm = this.dataFactory.blankNode();
          // Emit <x> <p> <current-chain> OR <previous-chain> <rdf:rest> <current-chain>
          this.emitTriple(parentTag.childrenCollectionSubject, parentTag.childrenCollectionPredicate, linkTerm, parentTag.reifiedStatementId);
          // Emit <current-chain> <rdf:first> value
          this.emitTriple(linkTerm, this.dataFactory.namedNode(RdfXmlParser.RDF + 'first'), activeTag.subject, activeTag.reifiedStatementId);
          // Store <current-chain> in the parent node
          parentTag.childrenCollectionSubject = linkTerm;
          parentTag.childrenCollectionPredicate = this.dataFactory.namedNode(RdfXmlParser.RDF + 'rest');
        } else {
          // !parentTag.predicateEmitted
          // Set-based properties
          this.emitTriple(parentTag.subject, parentTag.predicate, activeTag.subject, parentTag.reifiedStatementId);
          // Emit pending properties on the parent tag that had no defined subject yet.
          for (let i = 0; i < parentTag.predicateSubPredicates.length; i++) {
            this.emitTriple(activeTag.subject, parentTag.predicateSubPredicates[i], parentTag.predicateSubObjects[i], null);
          }
          // Cleanup so we don't emit them again when the parent tag is closed
          parentTag.predicateSubPredicates = [];
          parentTag.predicateSubObjects = [];
          parentTag.predicateEmitted = true;
        }
      }
      // Emit all collected triples
      for (let i = 0; i < predicates.length; i++) {
        const object = this.dataFactory.literal(objects[i], activeTag.datatype || activeTag.language);
        this.emitTriple(activeTag.subject, predicates[i], object, parentTag.reifiedStatementId);
      }
      // Emit the rdf:type as named node instead of literal
      if (explicitType) {
        this.emitTriple(activeTag.subject, this.dataFactory.namedNode(RdfXmlParser.RDF + 'type'), this.uriToNamedNode(explicitType), null);
      }
    }
  }
  /**
   * Handle the given property element in property-mode.
   * @param {QualifiedTag} tag A SAX tag.
   * @param {IActiveTag} activeTag The currently active tag.
   * @param {IActiveTag} parentTag The parent tag or null.
   */
  onTagProperty(tag, activeTag, parentTag) {
    const tagExpanded = RdfXmlParser.expandPrefixedTerm(tag.name, activeTag.ns, this);
    activeTag.childrenParseType = ParseType.RESOURCE;
    activeTag.subject = parentTag.subject; // Inherit parent subject
    if (tagExpanded.uri === RdfXmlParser.RDF && tagExpanded.local === 'li') {
      // Convert rdf:li to rdf:_x
      if (!parentTag.listItemCounter) {
        parentTag.listItemCounter = 1;
      }
      activeTag.predicate = this.uriToNamedNode(tagExpanded.uri + '_' + parentTag.listItemCounter++);
    } else {
      activeTag.predicate = this.uriToNamedNode(tagExpanded.uri + tagExpanded.local);
    }
    // Check forbidden property element names
    if (tagExpanded.uri === RdfXmlParser.RDF && RdfXmlParser.FORBIDDEN_PROPERTY_ELEMENTS.indexOf(tagExpanded.local) >= 0) {
      throw this.newParseError(`Illegal property element name: ${tagExpanded.local}`);
    }
    activeTag.predicateSubPredicates = [];
    activeTag.predicateSubObjects = [];
    let parseType = false;
    let attributedProperty = false;
    // Collect all attributes as triples
    // Assign subject value only after all attributes have been processed, because baseIRI may change the final val
    let activeSubSubjectValue = null;
    let subSubjectValueBlank = true;
    const predicates = [];
    const objects = [];
    for (const propertyAttributeKey in tag.attributes) {
      const propertyAttributeValue = tag.attributes[propertyAttributeKey];
      const propertyAttributeKeyExpanded = RdfXmlParser.expandPrefixedTerm(propertyAttributeKey, activeTag.ns, this);
      if (propertyAttributeKeyExpanded.uri === RdfXmlParser.RDF) {
        switch (propertyAttributeKeyExpanded.local) {
          case 'resource':
            if (activeSubSubjectValue) {
              throw this.newParseError(`Found both rdf:resource (${propertyAttributeValue}) and rdf:nodeID (${activeSubSubjectValue}).`);
            }
            if (parseType) {
              throw this.newParseError(`rdf:parseType is not allowed on property elements with rdf:resource (${propertyAttributeValue})`);
            }
            activeTag.hadChildren = true;
            activeSubSubjectValue = propertyAttributeValue;
            subSubjectValueBlank = false;
            continue;
          case 'datatype':
            if (attributedProperty) {
              throw this.newParseError(`Found both non-rdf:* property attributes and rdf:datatype (${propertyAttributeValue}).`);
            }
            if (parseType) {
              throw this.newParseError(`rdf:parseType is not allowed on property elements with rdf:datatype (${propertyAttributeValue})`);
            }
            activeTag.datatype = this.valueToUri(propertyAttributeValue, activeTag);
            continue;
          case 'nodeID':
            if (attributedProperty) {
              throw this.newParseError(`Found both non-rdf:* property attributes and rdf:nodeID (${propertyAttributeValue}).`);
            }
            if (activeTag.hadChildren) {
              throw this.newParseError(`Found both rdf:resource and rdf:nodeID (${propertyAttributeValue}).`);
            }
            if (parseType) {
              throw this.newParseError(`rdf:parseType is not allowed on property elements with rdf:nodeID (${propertyAttributeValue})`);
            }
            this.validateNcname(propertyAttributeValue);
            activeTag.hadChildren = true;
            activeSubSubjectValue = propertyAttributeValue;
            subSubjectValueBlank = true;
            continue;
          case 'bagID':
            throw this.newParseError(`rdf:bagID is not supported.`);
          case 'parseType':
            // Validation
            if (attributedProperty) {
              throw this.newParseError(`rdf:parseType is not allowed when non-rdf:* property attributes are present`);
            }
            if (activeTag.datatype) {
              throw this.newParseError(`rdf:parseType is not allowed on property elements with rdf:datatype (${activeTag.datatype.value})`);
            }
            if (activeSubSubjectValue) {
              throw this.newParseError(`rdf:parseType is not allowed on property elements with rdf:nodeID or rdf:resource (${activeSubSubjectValue})`);
            }
            if (propertyAttributeValue === 'Resource') {
              parseType = true;
              activeTag.childrenParseType = ParseType.PROPERTY;
              // Turn this property element into a node element
              const nestedBNode = this.dataFactory.blankNode();
              this.emitTriple(activeTag.subject, activeTag.predicate, nestedBNode, activeTag.reifiedStatementId);
              activeTag.subject = nestedBNode;
              activeTag.predicate = null;
            } else if (propertyAttributeValue === 'Collection') {
              parseType = true;
              // Interpret children as being part of an rdf:List
              activeTag.hadChildren = true;
              activeTag.childrenCollectionSubject = activeTag.subject;
              activeTag.childrenCollectionPredicate = activeTag.predicate;
              subSubjectValueBlank = false;
            } else if (propertyAttributeValue === 'Literal') {
              parseType = true;
              // Interpret children as being part of a literal string
              activeTag.childrenTagsToString = true;
              activeTag.childrenStringTags = [];
            }
            continue;
          case 'ID':
            this.validateNcname(propertyAttributeValue);
            activeTag.reifiedStatementId = this.valueToUri('#' + propertyAttributeValue, activeTag);
            this.claimNodeId(activeTag.reifiedStatementId);
            continue;
        }
      } else if (propertyAttributeKeyExpanded.uri === RdfXmlParser.XML && propertyAttributeKeyExpanded.local === 'lang') {
        activeTag.language = propertyAttributeValue === '' ? null : propertyAttributeValue.toLowerCase();
        continue;
      }
      // Interpret attributes at this point as properties via implicit blank nodes on the property,
      // but we ignore attributes that have no prefix or known expanded URI
      if (propertyAttributeKeyExpanded.prefix !== 'xml' && propertyAttributeKeyExpanded.prefix !== 'xmlns' && propertyAttributeKeyExpanded.uri) {
        if (parseType || activeTag.datatype) {
          throw this.newParseError(`Found illegal rdf:* properties on property element with attribute: ${propertyAttributeValue}`);
        }
        activeTag.hadChildren = true;
        attributedProperty = true;
        predicates.push(this.uriToNamedNode(propertyAttributeKeyExpanded.uri + propertyAttributeKeyExpanded.local));
        objects.push(this.dataFactory.literal(propertyAttributeValue, activeTag.datatype || activeTag.language));
      }
    }
    // Create the subject value _after_ all attributes have been processed
    if (activeSubSubjectValue !== null) {
      const subjectParent = activeTag.subject;
      activeTag.subject = subSubjectValueBlank ? this.dataFactory.blankNode(activeSubSubjectValue) : this.valueToUri(activeSubSubjectValue, activeTag);
      this.emitTriple(subjectParent, activeTag.predicate, activeTag.subject, activeTag.reifiedStatementId);
      // Emit our buffered triples
      for (let i = 0; i < predicates.length; i++) {
        this.emitTriple(activeTag.subject, predicates[i], objects[i], null);
      }
      activeTag.predicateEmitted = true;
    } else if (subSubjectValueBlank) {
      // The current property element has no defined subject
      // Let's buffer the properties until the child node defines a subject,
      // or if the tag closes.
      activeTag.predicateSubPredicates = predicates;
      activeTag.predicateSubObjects = objects;
      activeTag.predicateEmitted = false;
    }
  }
  /**
   * Emit the given triple to the stream.
   * @param {Term} subject A subject term.
   * @param {Term} predicate A predicate term.
   * @param {Term} object An object term.
   * @param {Term} statementId An optional resource that identifies the triple.
   *                           If truthy, then the given triple will also be emitted reified.
   */
  emitTriple(subject, predicate, object, statementId) {
    this.push(this.dataFactory.quad(subject, predicate, object, this.defaultGraph));
    // Reify triple
    if (statementId) {
      this.push(this.dataFactory.quad(statementId, this.dataFactory.namedNode(RdfXmlParser.RDF + 'type'), this.dataFactory.namedNode(RdfXmlParser.RDF + 'Statement'), this.defaultGraph));
      this.push(this.dataFactory.quad(statementId, this.dataFactory.namedNode(RdfXmlParser.RDF + 'subject'), subject, this.defaultGraph));
      this.push(this.dataFactory.quad(statementId, this.dataFactory.namedNode(RdfXmlParser.RDF + 'predicate'), predicate, this.defaultGraph));
      this.push(this.dataFactory.quad(statementId, this.dataFactory.namedNode(RdfXmlParser.RDF + 'object'), object, this.defaultGraph));
    }
  }
  /**
   * Register the given term as a node ID.
   * If one was already registered, this will emit an error.
   *
   * This is used to check duplicate occurrences of rdf:ID in scope of the baseIRI.
   * @param {Term} term An RDF term.
   */
  claimNodeId(term) {
    if (!this.allowDuplicateRdfIds) {
      if (this.nodeIds[term.value]) {
        throw this.newParseError(`Found multiple occurrences of rdf:ID='${term.value}'.`);
      }
      this.nodeIds[term.value] = true;
    }
  }
  /**
   * Handle the given text string.
   * @param {string} text A parsed text string.
   */
  onText(text) {
    const activeTag = this.activeTagStack.length ? this.activeTagStack[this.activeTagStack.length - 1] : null;
    if (activeTag) {
      if (activeTag.childrenStringTags) {
        activeTag.childrenStringTags.push(text);
      } else if (activeTag.predicate) {
        activeTag.text = text;
      }
    }
  }
  /**
   * Handle the closing of the last tag.
   */
  onCloseTag() {
    const poppedTag = this.activeTagStack.pop();
    // If we were converting a tag to a string, and the tag was not self-closing, close it here.
    if (poppedTag.childrenStringEmitClosingTag) {
      poppedTag.childrenStringTags.push(poppedTag.childrenStringEmitClosingTag);
    }
    // Set the literal value if we were collecting XML tags to string
    if (poppedTag.childrenTagsToString) {
      poppedTag.datatype = this.dataFactory.namedNode(RdfXmlParser.RDF + 'XMLLiteral');
      poppedTag.text = poppedTag.childrenStringTags.join('');
      poppedTag.hadChildren = false; // Force a literal triple to be emitted hereafter
    }

    if (poppedTag.childrenCollectionSubject) {
      // Terminate the rdf:List
      this.emitTriple(poppedTag.childrenCollectionSubject, poppedTag.childrenCollectionPredicate, this.dataFactory.namedNode(RdfXmlParser.RDF + 'nil'), poppedTag.reifiedStatementId);
    } else if (poppedTag.predicate) {
      if (!poppedTag.hadChildren && poppedTag.childrenParseType !== ParseType.PROPERTY) {
        // Property element contains text
        this.emitTriple(poppedTag.subject, poppedTag.predicate, this.dataFactory.literal(poppedTag.text || '', poppedTag.datatype || poppedTag.language), poppedTag.reifiedStatementId);
      } else if (!poppedTag.predicateEmitted) {
        // Emit remaining properties on an anonymous property element
        const subject = this.dataFactory.blankNode();
        this.emitTriple(poppedTag.subject, poppedTag.predicate, subject, poppedTag.reifiedStatementId);
        for (let i = 0; i < poppedTag.predicateSubPredicates.length; i++) {
          this.emitTriple(subject, poppedTag.predicateSubPredicates[i], poppedTag.predicateSubObjects[i], null);
        }
      }
    }
  }
  /**
   * Fetch local DOCTYPE ENTITY's and make the parser recognise them.
   * @param {string} doctype The read doctype.
   */
  onDoctype(doctype) {
    doctype.replace(/<!ENTITY\s+([^\s]+)\s+["']([^"']+)["']\s*>/g, (match, prefix, uri) => {
      this.saxStream._parser.ENTITIES[prefix] = uri;
      return '';
    });
  }
}
exports.RdfXmlParser = RdfXmlParser;
// Regex for valid IRIs
RdfXmlParser.IRI_REGEX = /^([A-Za-z][A-Za-z0-9+-.]*):[^ "<>{}|\\\[\]`]*$/;
RdfXmlParser.MIME_TYPE = 'application/rdf+xml';
RdfXmlParser.RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
RdfXmlParser.XML = 'http://www.w3.org/XML/1998/namespace';
RdfXmlParser.XMLNS = 'http://www.w3.org/2000/xmlns/';
RdfXmlParser.DEFAULT_NS = {
  xml: RdfXmlParser.XML
};
RdfXmlParser.FORBIDDEN_NODE_ELEMENTS = ['RDF', 'ID', 'about', 'bagID', 'parseType', 'resource', 'nodeID', 'li', 'aboutEach', 'aboutEachPrefix'];
RdfXmlParser.FORBIDDEN_PROPERTY_ELEMENTS = ['Description', 'RDF', 'ID', 'about', 'bagID', 'parseType', 'resource', 'nodeID', 'aboutEach', 'aboutEachPrefix'];
// tslint:disable-next-line:max-line-length
RdfXmlParser.NCNAME_MATCHER = /^([A-Za-z\xC0-\xD6\xD8-\xF6\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}_])([A-Za-z\xC0-\xD6\xD8-\xF6\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}_\-.0-9#xB7\u{0300}-\u{036F}\u{203F}-\u{2040}])*$/u;
var ParseType;
(function (ParseType) {
  ParseType[ParseType["RESOURCE"] = 0] = "RESOURCE";
  ParseType[ParseType["PROPERTY"] = 1] = "PROPERTY";
})(ParseType = exports.ParseType || (exports.ParseType = {}));

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

/***/ }),

/***/ "./node_modules/sax/lib/sax.js":
/*!*************************************!*\
  !*** ./node_modules/sax/lib/sax.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {;
(function (sax) {
  // wrapper for non-node envs
  sax.parser = function (strict, opt) {
    return new SAXParser(strict, opt);
  };
  sax.SAXParser = SAXParser;
  sax.SAXStream = SAXStream;
  sax.createStream = createStream;

  // When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
  // When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
  // since that's the earliest that a buffer overrun could occur.  This way, checks are
  // as rare as required, but as often as necessary to ensure never crossing this bound.
  // Furthermore, buffers are only tested at most once per write(), so passing a very
  // large string into write() might have undesirable effects, but this is manageable by
  // the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
  // edge case, result in creating at most one complete copy of the string passed in.
  // Set to Infinity to have unlimited buffers.
  sax.MAX_BUFFER_LENGTH = 64 * 1024;
  var buffers = ['comment', 'sgmlDecl', 'textNode', 'tagName', 'doctype', 'procInstName', 'procInstBody', 'entity', 'attribName', 'attribValue', 'cdata', 'script'];
  sax.EVENTS = ['text', 'processinginstruction', 'sgmldeclaration', 'doctype', 'comment', 'opentagstart', 'attribute', 'opentag', 'closetag', 'opencdata', 'cdata', 'closecdata', 'error', 'end', 'ready', 'script', 'opennamespace', 'closenamespace'];
  function SAXParser(strict, opt) {
    if (!(this instanceof SAXParser)) {
      return new SAXParser(strict, opt);
    }
    var parser = this;
    clearBuffers(parser);
    parser.q = parser.c = '';
    parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
    parser.opt = opt || {};
    parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
    parser.looseCase = parser.opt.lowercase ? 'toLowerCase' : 'toUpperCase';
    parser.tags = [];
    parser.closed = parser.closedRoot = parser.sawRoot = false;
    parser.tag = parser.error = null;
    parser.strict = !!strict;
    parser.noscript = !!(strict || parser.opt.noscript);
    parser.state = S.BEGIN;
    parser.strictEntities = parser.opt.strictEntities;
    parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES);
    parser.attribList = [];

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (parser.opt.xmlns) {
      parser.ns = Object.create(rootNS);
    }

    // mostly just for error reporting
    parser.trackPosition = parser.opt.position !== false;
    if (parser.trackPosition) {
      parser.position = parser.line = parser.column = 0;
    }
    emit(parser, 'onready');
  }
  if (!Object.create) {
    Object.create = function (o) {
      function F() {}
      F.prototype = o;
      var newf = new F();
      return newf;
    };
  }
  if (!Object.keys) {
    Object.keys = function (o) {
      var a = [];
      for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
      return a;
    };
  }
  function checkBufferLength(parser) {
    var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
    var maxActual = 0;
    for (var i = 0, l = buffers.length; i < l; i++) {
      var len = parser[buffers[i]].length;
      if (len > maxAllowed) {
        // Text/cdata nodes can get big, and since they're buffered,
        // we can get here under normal conditions.
        // Avoid issues by emitting the text node now,
        // so at least it won't get any bigger.
        switch (buffers[i]) {
          case 'textNode':
            closeText(parser);
            break;
          case 'cdata':
            emitNode(parser, 'oncdata', parser.cdata);
            parser.cdata = '';
            break;
          case 'script':
            emitNode(parser, 'onscript', parser.script);
            parser.script = '';
            break;
          default:
            error(parser, 'Max buffer length exceeded: ' + buffers[i]);
        }
      }
      maxActual = Math.max(maxActual, len);
    }
    // schedule the next check for the earliest possible buffer overrun.
    var m = sax.MAX_BUFFER_LENGTH - maxActual;
    parser.bufferCheckPosition = m + parser.position;
  }
  function clearBuffers(parser) {
    for (var i = 0, l = buffers.length; i < l; i++) {
      parser[buffers[i]] = '';
    }
  }
  function flushBuffers(parser) {
    closeText(parser);
    if (parser.cdata !== '') {
      emitNode(parser, 'oncdata', parser.cdata);
      parser.cdata = '';
    }
    if (parser.script !== '') {
      emitNode(parser, 'onscript', parser.script);
      parser.script = '';
    }
  }
  SAXParser.prototype = {
    end: function () {
      end(this);
    },
    write: write,
    resume: function () {
      this.error = null;
      return this;
    },
    close: function () {
      return this.write(null);
    },
    flush: function () {
      flushBuffers(this);
    }
  };
  var Stream;
  try {
    Stream = __webpack_require__(/*! stream */ "./node_modules/readable-stream/readable-browser.js").Stream;
  } catch (ex) {
    Stream = function () {};
  }
  var streamWraps = sax.EVENTS.filter(function (ev) {
    return ev !== 'error' && ev !== 'end';
  });
  function createStream(strict, opt) {
    return new SAXStream(strict, opt);
  }
  function SAXStream(strict, opt) {
    if (!(this instanceof SAXStream)) {
      return new SAXStream(strict, opt);
    }
    Stream.apply(this);
    this._parser = new SAXParser(strict, opt);
    this.writable = true;
    this.readable = true;
    var me = this;
    this._parser.onend = function () {
      me.emit('end');
    };
    this._parser.onerror = function (er) {
      me.emit('error', er);

      // if didn't throw, then means error was handled.
      // go ahead and clear error, so we can write again.
      me._parser.error = null;
    };
    this._decoder = null;
    streamWraps.forEach(function (ev) {
      Object.defineProperty(me, 'on' + ev, {
        get: function () {
          return me._parser['on' + ev];
        },
        set: function (h) {
          if (!h) {
            me.removeAllListeners(ev);
            me._parser['on' + ev] = h;
            return h;
          }
          me.on(ev, h);
        },
        enumerable: true,
        configurable: false
      });
    });
  }
  SAXStream.prototype = Object.create(Stream.prototype, {
    constructor: {
      value: SAXStream
    }
  });
  SAXStream.prototype.write = function (data) {
    if (typeof Buffer === 'function' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(data)) {
      if (!this._decoder) {
        var SD = __webpack_require__(/*! string_decoder */ "./node_modules/string_decoder/lib/string_decoder.js").StringDecoder;
        this._decoder = new SD('utf8');
      }
      data = this._decoder.write(data);
    }
    this._parser.write(data.toString());
    this.emit('data', data);
    return true;
  };
  SAXStream.prototype.end = function (chunk) {
    if (chunk && chunk.length) {
      this.write(chunk);
    }
    this._parser.end();
    return true;
  };
  SAXStream.prototype.on = function (ev, handler) {
    var me = this;
    if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
      me._parser['on' + ev] = function () {
        var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        args.splice(0, 0, ev);
        me.emit.apply(me, args);
      };
    }
    return Stream.prototype.on.call(me, ev, handler);
  };

  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  var CDATA = '[CDATA[';
  var DOCTYPE = 'DOCTYPE';
  var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
  var XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';
  var rootNS = {
    xml: XML_NAMESPACE,
    xmlns: XMLNS_NAMESPACE
  };

  // http://www.w3.org/TR/REC-xml/#NT-NameStartChar
  // This implementation works on strings, a single character at a time
  // as such, it cannot ever support astral-plane characters (10000-EFFFF)
  // without a significant breaking change to either this  parser, or the
  // JavaScript language.  Implementation of an emoji-capable xml parser
  // is left as an exercise for the reader.
  var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
  var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
  var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
  var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
  function isWhitespace(c) {
    return c === ' ' || c === '\n' || c === '\r' || c === '\t';
  }
  function isQuote(c) {
    return c === '"' || c === '\'';
  }
  function isAttribEnd(c) {
    return c === '>' || isWhitespace(c);
  }
  function isMatch(regex, c) {
    return regex.test(c);
  }
  function notMatch(regex, c) {
    return !isMatch(regex, c);
  }
  var S = 0;
  sax.STATE = {
    BEGIN: S++,
    // leading byte order mark or whitespace
    BEGIN_WHITESPACE: S++,
    // leading whitespace
    TEXT: S++,
    // general stuff
    TEXT_ENTITY: S++,
    // &amp and such.
    OPEN_WAKA: S++,
    // <
    SGML_DECL: S++,
    // <!BLARG
    SGML_DECL_QUOTED: S++,
    // <!BLARG foo "bar
    DOCTYPE: S++,
    // <!DOCTYPE
    DOCTYPE_QUOTED: S++,
    // <!DOCTYPE "//blah
    DOCTYPE_DTD: S++,
    // <!DOCTYPE "//blah" [ ...
    DOCTYPE_DTD_QUOTED: S++,
    // <!DOCTYPE "//blah" [ "foo
    COMMENT_STARTING: S++,
    // <!-
    COMMENT: S++,
    // <!--
    COMMENT_ENDING: S++,
    // <!-- blah -
    COMMENT_ENDED: S++,
    // <!-- blah --
    CDATA: S++,
    // <![CDATA[ something
    CDATA_ENDING: S++,
    // ]
    CDATA_ENDING_2: S++,
    // ]]
    PROC_INST: S++,
    // <?hi
    PROC_INST_BODY: S++,
    // <?hi there
    PROC_INST_ENDING: S++,
    // <?hi "there" ?
    OPEN_TAG: S++,
    // <strong
    OPEN_TAG_SLASH: S++,
    // <strong /
    ATTRIB: S++,
    // <a
    ATTRIB_NAME: S++,
    // <a foo
    ATTRIB_NAME_SAW_WHITE: S++,
    // <a foo _
    ATTRIB_VALUE: S++,
    // <a foo=
    ATTRIB_VALUE_QUOTED: S++,
    // <a foo="bar
    ATTRIB_VALUE_CLOSED: S++,
    // <a foo="bar"
    ATTRIB_VALUE_UNQUOTED: S++,
    // <a foo=bar
    ATTRIB_VALUE_ENTITY_Q: S++,
    // <foo bar="&quot;"
    ATTRIB_VALUE_ENTITY_U: S++,
    // <foo bar=&quot
    CLOSE_TAG: S++,
    // </a
    CLOSE_TAG_SAW_WHITE: S++,
    // </a   >
    SCRIPT: S++,
    // <script> ...
    SCRIPT_ENDING: S++ // <script> ... <
  };

  sax.XML_ENTITIES = {
    'amp': '&',
    'gt': '>',
    'lt': '<',
    'quot': '"',
    'apos': "'"
  };
  sax.ENTITIES = {
    'amp': '&',
    'gt': '>',
    'lt': '<',
    'quot': '"',
    'apos': "'",
    'AElig': 198,
    'Aacute': 193,
    'Acirc': 194,
    'Agrave': 192,
    'Aring': 197,
    'Atilde': 195,
    'Auml': 196,
    'Ccedil': 199,
    'ETH': 208,
    'Eacute': 201,
    'Ecirc': 202,
    'Egrave': 200,
    'Euml': 203,
    'Iacute': 205,
    'Icirc': 206,
    'Igrave': 204,
    'Iuml': 207,
    'Ntilde': 209,
    'Oacute': 211,
    'Ocirc': 212,
    'Ograve': 210,
    'Oslash': 216,
    'Otilde': 213,
    'Ouml': 214,
    'THORN': 222,
    'Uacute': 218,
    'Ucirc': 219,
    'Ugrave': 217,
    'Uuml': 220,
    'Yacute': 221,
    'aacute': 225,
    'acirc': 226,
    'aelig': 230,
    'agrave': 224,
    'aring': 229,
    'atilde': 227,
    'auml': 228,
    'ccedil': 231,
    'eacute': 233,
    'ecirc': 234,
    'egrave': 232,
    'eth': 240,
    'euml': 235,
    'iacute': 237,
    'icirc': 238,
    'igrave': 236,
    'iuml': 239,
    'ntilde': 241,
    'oacute': 243,
    'ocirc': 244,
    'ograve': 242,
    'oslash': 248,
    'otilde': 245,
    'ouml': 246,
    'szlig': 223,
    'thorn': 254,
    'uacute': 250,
    'ucirc': 251,
    'ugrave': 249,
    'uuml': 252,
    'yacute': 253,
    'yuml': 255,
    'copy': 169,
    'reg': 174,
    'nbsp': 160,
    'iexcl': 161,
    'cent': 162,
    'pound': 163,
    'curren': 164,
    'yen': 165,
    'brvbar': 166,
    'sect': 167,
    'uml': 168,
    'ordf': 170,
    'laquo': 171,
    'not': 172,
    'shy': 173,
    'macr': 175,
    'deg': 176,
    'plusmn': 177,
    'sup1': 185,
    'sup2': 178,
    'sup3': 179,
    'acute': 180,
    'micro': 181,
    'para': 182,
    'middot': 183,
    'cedil': 184,
    'ordm': 186,
    'raquo': 187,
    'frac14': 188,
    'frac12': 189,
    'frac34': 190,
    'iquest': 191,
    'times': 215,
    'divide': 247,
    'OElig': 338,
    'oelig': 339,
    'Scaron': 352,
    'scaron': 353,
    'Yuml': 376,
    'fnof': 402,
    'circ': 710,
    'tilde': 732,
    'Alpha': 913,
    'Beta': 914,
    'Gamma': 915,
    'Delta': 916,
    'Epsilon': 917,
    'Zeta': 918,
    'Eta': 919,
    'Theta': 920,
    'Iota': 921,
    'Kappa': 922,
    'Lambda': 923,
    'Mu': 924,
    'Nu': 925,
    'Xi': 926,
    'Omicron': 927,
    'Pi': 928,
    'Rho': 929,
    'Sigma': 931,
    'Tau': 932,
    'Upsilon': 933,
    'Phi': 934,
    'Chi': 935,
    'Psi': 936,
    'Omega': 937,
    'alpha': 945,
    'beta': 946,
    'gamma': 947,
    'delta': 948,
    'epsilon': 949,
    'zeta': 950,
    'eta': 951,
    'theta': 952,
    'iota': 953,
    'kappa': 954,
    'lambda': 955,
    'mu': 956,
    'nu': 957,
    'xi': 958,
    'omicron': 959,
    'pi': 960,
    'rho': 961,
    'sigmaf': 962,
    'sigma': 963,
    'tau': 964,
    'upsilon': 965,
    'phi': 966,
    'chi': 967,
    'psi': 968,
    'omega': 969,
    'thetasym': 977,
    'upsih': 978,
    'piv': 982,
    'ensp': 8194,
    'emsp': 8195,
    'thinsp': 8201,
    'zwnj': 8204,
    'zwj': 8205,
    'lrm': 8206,
    'rlm': 8207,
    'ndash': 8211,
    'mdash': 8212,
    'lsquo': 8216,
    'rsquo': 8217,
    'sbquo': 8218,
    'ldquo': 8220,
    'rdquo': 8221,
    'bdquo': 8222,
    'dagger': 8224,
    'Dagger': 8225,
    'bull': 8226,
    'hellip': 8230,
    'permil': 8240,
    'prime': 8242,
    'Prime': 8243,
    'lsaquo': 8249,
    'rsaquo': 8250,
    'oline': 8254,
    'frasl': 8260,
    'euro': 8364,
    'image': 8465,
    'weierp': 8472,
    'real': 8476,
    'trade': 8482,
    'alefsym': 8501,
    'larr': 8592,
    'uarr': 8593,
    'rarr': 8594,
    'darr': 8595,
    'harr': 8596,
    'crarr': 8629,
    'lArr': 8656,
    'uArr': 8657,
    'rArr': 8658,
    'dArr': 8659,
    'hArr': 8660,
    'forall': 8704,
    'part': 8706,
    'exist': 8707,
    'empty': 8709,
    'nabla': 8711,
    'isin': 8712,
    'notin': 8713,
    'ni': 8715,
    'prod': 8719,
    'sum': 8721,
    'minus': 8722,
    'lowast': 8727,
    'radic': 8730,
    'prop': 8733,
    'infin': 8734,
    'ang': 8736,
    'and': 8743,
    'or': 8744,
    'cap': 8745,
    'cup': 8746,
    'int': 8747,
    'there4': 8756,
    'sim': 8764,
    'cong': 8773,
    'asymp': 8776,
    'ne': 8800,
    'equiv': 8801,
    'le': 8804,
    'ge': 8805,
    'sub': 8834,
    'sup': 8835,
    'nsub': 8836,
    'sube': 8838,
    'supe': 8839,
    'oplus': 8853,
    'otimes': 8855,
    'perp': 8869,
    'sdot': 8901,
    'lceil': 8968,
    'rceil': 8969,
    'lfloor': 8970,
    'rfloor': 8971,
    'lang': 9001,
    'rang': 9002,
    'loz': 9674,
    'spades': 9824,
    'clubs': 9827,
    'hearts': 9829,
    'diams': 9830
  };
  Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key];
    var s = typeof e === 'number' ? String.fromCharCode(e) : e;
    sax.ENTITIES[key] = s;
  });
  for (var s in sax.STATE) {
    sax.STATE[sax.STATE[s]] = s;
  }

  // shorthand
  S = sax.STATE;
  function emit(parser, event, data) {
    parser[event] && parser[event](data);
  }
  function emitNode(parser, nodeType, data) {
    if (parser.textNode) closeText(parser);
    emit(parser, nodeType, data);
  }
  function closeText(parser) {
    parser.textNode = textopts(parser.opt, parser.textNode);
    if (parser.textNode) emit(parser, 'ontext', parser.textNode);
    parser.textNode = '';
  }
  function textopts(opt, text) {
    if (opt.trim) text = text.trim();
    if (opt.normalize) text = text.replace(/\s+/g, ' ');
    return text;
  }
  function error(parser, er) {
    closeText(parser);
    if (parser.trackPosition) {
      er += '\nLine: ' + parser.line + '\nColumn: ' + parser.column + '\nChar: ' + parser.c;
    }
    er = new Error(er);
    parser.error = er;
    emit(parser, 'onerror', er);
    return parser;
  }
  function end(parser) {
    if (parser.sawRoot && !parser.closedRoot) strictFail(parser, 'Unclosed root tag');
    if (parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT) {
      error(parser, 'Unexpected end');
    }
    closeText(parser);
    parser.c = '';
    parser.closed = true;
    emit(parser, 'onend');
    SAXParser.call(parser, parser.strict, parser.opt);
    return parser;
  }
  function strictFail(parser, message) {
    if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
      throw new Error('bad call to strictFail');
    }
    if (parser.strict) {
      error(parser, message);
    }
  }
  function newTag(parser) {
    if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
    var parent = parser.tags[parser.tags.length - 1] || parser;
    var tag = parser.tag = {
      name: parser.tagName,
      attributes: {}
    };

    // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
    if (parser.opt.xmlns) {
      tag.ns = parent.ns;
    }
    parser.attribList.length = 0;
    emitNode(parser, 'onopentagstart', tag);
  }
  function qname(name, attribute) {
    var i = name.indexOf(':');
    var qualName = i < 0 ? ['', name] : name.split(':');
    var prefix = qualName[0];
    var local = qualName[1];

    // <x "xmlns"="http://foo">
    if (attribute && name === 'xmlns') {
      prefix = 'xmlns';
      local = '';
    }
    return {
      prefix: prefix,
      local: local
    };
  }
  function attrib(parser) {
    if (!parser.strict) {
      parser.attribName = parser.attribName[parser.looseCase]();
    }
    if (parser.attribList.indexOf(parser.attribName) !== -1 || parser.tag.attributes.hasOwnProperty(parser.attribName)) {
      parser.attribName = parser.attribValue = '';
      return;
    }
    if (parser.opt.xmlns) {
      var qn = qname(parser.attribName, true);
      var prefix = qn.prefix;
      var local = qn.local;
      if (prefix === 'xmlns') {
        // namespace binding attribute. push the binding into scope
        if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
          strictFail(parser, 'xml: prefix must be bound to ' + XML_NAMESPACE + '\n' + 'Actual: ' + parser.attribValue);
        } else if (local === 'xmlns' && parser.attribValue !== XMLNS_NAMESPACE) {
          strictFail(parser, 'xmlns: prefix must be bound to ' + XMLNS_NAMESPACE + '\n' + 'Actual: ' + parser.attribValue);
        } else {
          var tag = parser.tag;
          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (tag.ns === parent.ns) {
            tag.ns = Object.create(parent.ns);
          }
          tag.ns[local] = parser.attribValue;
        }
      }

      // defer onattribute events until all attributes have been seen
      // so any new bindings can take effect. preserve attribute order
      // so deferred events can be emitted in document order
      parser.attribList.push([parser.attribName, parser.attribValue]);
    } else {
      // in non-xmlns mode, we can emit the event right away
      parser.tag.attributes[parser.attribName] = parser.attribValue;
      emitNode(parser, 'onattribute', {
        name: parser.attribName,
        value: parser.attribValue
      });
    }
    parser.attribName = parser.attribValue = '';
  }
  function openTag(parser, selfClosing) {
    if (parser.opt.xmlns) {
      // emit namespace binding events
      var tag = parser.tag;

      // add namespace info to tag
      var qn = qname(parser.tagName);
      tag.prefix = qn.prefix;
      tag.local = qn.local;
      tag.uri = tag.ns[qn.prefix] || '';
      if (tag.prefix && !tag.uri) {
        strictFail(parser, 'Unbound namespace prefix: ' + JSON.stringify(parser.tagName));
        tag.uri = qn.prefix;
      }
      var parent = parser.tags[parser.tags.length - 1] || parser;
      if (tag.ns && parent.ns !== tag.ns) {
        Object.keys(tag.ns).forEach(function (p) {
          emitNode(parser, 'onopennamespace', {
            prefix: p,
            uri: tag.ns[p]
          });
        });
      }

      // handle deferred onattribute events
      // Note: do not apply default ns to attributes:
      //   http://www.w3.org/TR/REC-xml-names/#defaulting
      for (var i = 0, l = parser.attribList.length; i < l; i++) {
        var nv = parser.attribList[i];
        var name = nv[0];
        var value = nv[1];
        var qualName = qname(name, true);
        var prefix = qualName.prefix;
        var local = qualName.local;
        var uri = prefix === '' ? '' : tag.ns[prefix] || '';
        var a = {
          name: name,
          value: value,
          prefix: prefix,
          local: local,
          uri: uri
        };

        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (prefix && prefix !== 'xmlns' && !uri) {
          strictFail(parser, 'Unbound namespace prefix: ' + JSON.stringify(prefix));
          a.uri = prefix;
        }
        parser.tag.attributes[name] = a;
        emitNode(parser, 'onattribute', a);
      }
      parser.attribList.length = 0;
    }
    parser.tag.isSelfClosing = !!selfClosing;

    // process the tag
    parser.sawRoot = true;
    parser.tags.push(parser.tag);
    emitNode(parser, 'onopentag', parser.tag);
    if (!selfClosing) {
      // special case for <script> in non-strict mode.
      if (!parser.noscript && parser.tagName.toLowerCase() === 'script') {
        parser.state = S.SCRIPT;
      } else {
        parser.state = S.TEXT;
      }
      parser.tag = null;
      parser.tagName = '';
    }
    parser.attribName = parser.attribValue = '';
    parser.attribList.length = 0;
  }
  function closeTag(parser) {
    if (!parser.tagName) {
      strictFail(parser, 'Weird empty close tag.');
      parser.textNode += '</>';
      parser.state = S.TEXT;
      return;
    }
    if (parser.script) {
      if (parser.tagName !== 'script') {
        parser.script += '</' + parser.tagName + '>';
        parser.tagName = '';
        parser.state = S.SCRIPT;
        return;
      }
      emitNode(parser, 'onscript', parser.script);
      parser.script = '';
    }

    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    var t = parser.tags.length;
    var tagName = parser.tagName;
    if (!parser.strict) {
      tagName = tagName[parser.looseCase]();
    }
    var closeTo = tagName;
    while (t--) {
      var close = parser.tags[t];
      if (close.name !== closeTo) {
        // fail the first time in strict mode
        strictFail(parser, 'Unexpected close tag');
      } else {
        break;
      }
    }

    // didn't find it.  we already failed for strict, so just abort.
    if (t < 0) {
      strictFail(parser, 'Unmatched closing tag: ' + parser.tagName);
      parser.textNode += '</' + parser.tagName + '>';
      parser.state = S.TEXT;
      return;
    }
    parser.tagName = tagName;
    var s = parser.tags.length;
    while (s-- > t) {
      var tag = parser.tag = parser.tags.pop();
      parser.tagName = parser.tag.name;
      emitNode(parser, 'onclosetag', parser.tagName);
      var x = {};
      for (var i in tag.ns) {
        x[i] = tag.ns[i];
      }
      var parent = parser.tags[parser.tags.length - 1] || parser;
      if (parser.opt.xmlns && tag.ns !== parent.ns) {
        // remove namespace bindings introduced by tag
        Object.keys(tag.ns).forEach(function (p) {
          var n = tag.ns[p];
          emitNode(parser, 'onclosenamespace', {
            prefix: p,
            uri: n
          });
        });
      }
    }
    if (t === 0) parser.closedRoot = true;
    parser.tagName = parser.attribValue = parser.attribName = '';
    parser.attribList.length = 0;
    parser.state = S.TEXT;
  }
  function parseEntity(parser) {
    var entity = parser.entity;
    var entityLC = entity.toLowerCase();
    var num;
    var numStr = '';
    if (parser.ENTITIES[entity]) {
      return parser.ENTITIES[entity];
    }
    if (parser.ENTITIES[entityLC]) {
      return parser.ENTITIES[entityLC];
    }
    entity = entityLC;
    if (entity.charAt(0) === '#') {
      if (entity.charAt(1) === 'x') {
        entity = entity.slice(2);
        num = parseInt(entity, 16);
        numStr = num.toString(16);
      } else {
        entity = entity.slice(1);
        num = parseInt(entity, 10);
        numStr = num.toString(10);
      }
    }
    entity = entity.replace(/^0+/, '');
    if (isNaN(num) || numStr.toLowerCase() !== entity) {
      strictFail(parser, 'Invalid character entity');
      return '&' + parser.entity + ';';
    }
    return String.fromCodePoint(num);
  }
  function beginWhiteSpace(parser, c) {
    if (c === '<') {
      parser.state = S.OPEN_WAKA;
      parser.startTagPosition = parser.position;
    } else if (!isWhitespace(c)) {
      // have to process this as a text node.
      // weird, but happens.
      strictFail(parser, 'Non-whitespace before first tag.');
      parser.textNode = c;
      parser.state = S.TEXT;
    }
  }
  function charAt(chunk, i) {
    var result = '';
    if (i < chunk.length) {
      result = chunk.charAt(i);
    }
    return result;
  }
  function write(chunk) {
    var parser = this;
    if (this.error) {
      throw this.error;
    }
    if (parser.closed) {
      return error(parser, 'Cannot write after close. Assign an onready handler.');
    }
    if (chunk === null) {
      return end(parser);
    }
    if (typeof chunk === 'object') {
      chunk = chunk.toString();
    }
    var i = 0;
    var c = '';
    while (true) {
      c = charAt(chunk, i++);
      parser.c = c;
      if (!c) {
        break;
      }
      if (parser.trackPosition) {
        parser.position++;
        if (c === '\n') {
          parser.line++;
          parser.column = 0;
        } else {
          parser.column++;
        }
      }
      switch (parser.state) {
        case S.BEGIN:
          parser.state = S.BEGIN_WHITESPACE;
          if (c === '\uFEFF') {
            continue;
          }
          beginWhiteSpace(parser, c);
          continue;
        case S.BEGIN_WHITESPACE:
          beginWhiteSpace(parser, c);
          continue;
        case S.TEXT:
          if (parser.sawRoot && !parser.closedRoot) {
            var starti = i - 1;
            while (c && c !== '<' && c !== '&') {
              c = charAt(chunk, i++);
              if (c && parser.trackPosition) {
                parser.position++;
                if (c === '\n') {
                  parser.line++;
                  parser.column = 0;
                } else {
                  parser.column++;
                }
              }
            }
            parser.textNode += chunk.substring(starti, i - 1);
          }
          if (c === '<' && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
            parser.state = S.OPEN_WAKA;
            parser.startTagPosition = parser.position;
          } else {
            if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
              strictFail(parser, 'Text data outside of root node.');
            }
            if (c === '&') {
              parser.state = S.TEXT_ENTITY;
            } else {
              parser.textNode += c;
            }
          }
          continue;
        case S.SCRIPT:
          // only non-strict
          if (c === '<') {
            parser.state = S.SCRIPT_ENDING;
          } else {
            parser.script += c;
          }
          continue;
        case S.SCRIPT_ENDING:
          if (c === '/') {
            parser.state = S.CLOSE_TAG;
          } else {
            parser.script += '<' + c;
            parser.state = S.SCRIPT;
          }
          continue;
        case S.OPEN_WAKA:
          // either a /, ?, !, or text is coming next.
          if (c === '!') {
            parser.state = S.SGML_DECL;
            parser.sgmlDecl = '';
          } else if (isWhitespace(c)) {
            // wait for it...
          } else if (isMatch(nameStart, c)) {
            parser.state = S.OPEN_TAG;
            parser.tagName = c;
          } else if (c === '/') {
            parser.state = S.CLOSE_TAG;
            parser.tagName = '';
          } else if (c === '?') {
            parser.state = S.PROC_INST;
            parser.procInstName = parser.procInstBody = '';
          } else {
            strictFail(parser, 'Unencoded <');
            // if there was some whitespace, then add that in.
            if (parser.startTagPosition + 1 < parser.position) {
              var pad = parser.position - parser.startTagPosition;
              c = new Array(pad).join(' ') + c;
            }
            parser.textNode += '<' + c;
            parser.state = S.TEXT;
          }
          continue;
        case S.SGML_DECL:
          if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
            emitNode(parser, 'onopencdata');
            parser.state = S.CDATA;
            parser.sgmlDecl = '';
            parser.cdata = '';
          } else if (parser.sgmlDecl + c === '--') {
            parser.state = S.COMMENT;
            parser.comment = '';
            parser.sgmlDecl = '';
          } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
            parser.state = S.DOCTYPE;
            if (parser.doctype || parser.sawRoot) {
              strictFail(parser, 'Inappropriately located doctype declaration');
            }
            parser.doctype = '';
            parser.sgmlDecl = '';
          } else if (c === '>') {
            emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl);
            parser.sgmlDecl = '';
            parser.state = S.TEXT;
          } else if (isQuote(c)) {
            parser.state = S.SGML_DECL_QUOTED;
            parser.sgmlDecl += c;
          } else {
            parser.sgmlDecl += c;
          }
          continue;
        case S.SGML_DECL_QUOTED:
          if (c === parser.q) {
            parser.state = S.SGML_DECL;
            parser.q = '';
          }
          parser.sgmlDecl += c;
          continue;
        case S.DOCTYPE:
          if (c === '>') {
            parser.state = S.TEXT;
            emitNode(parser, 'ondoctype', parser.doctype);
            parser.doctype = true; // just remember that we saw it.
          } else {
            parser.doctype += c;
            if (c === '[') {
              parser.state = S.DOCTYPE_DTD;
            } else if (isQuote(c)) {
              parser.state = S.DOCTYPE_QUOTED;
              parser.q = c;
            }
          }
          continue;
        case S.DOCTYPE_QUOTED:
          parser.doctype += c;
          if (c === parser.q) {
            parser.q = '';
            parser.state = S.DOCTYPE;
          }
          continue;
        case S.DOCTYPE_DTD:
          parser.doctype += c;
          if (c === ']') {
            parser.state = S.DOCTYPE;
          } else if (isQuote(c)) {
            parser.state = S.DOCTYPE_DTD_QUOTED;
            parser.q = c;
          }
          continue;
        case S.DOCTYPE_DTD_QUOTED:
          parser.doctype += c;
          if (c === parser.q) {
            parser.state = S.DOCTYPE_DTD;
            parser.q = '';
          }
          continue;
        case S.COMMENT:
          if (c === '-') {
            parser.state = S.COMMENT_ENDING;
          } else {
            parser.comment += c;
          }
          continue;
        case S.COMMENT_ENDING:
          if (c === '-') {
            parser.state = S.COMMENT_ENDED;
            parser.comment = textopts(parser.opt, parser.comment);
            if (parser.comment) {
              emitNode(parser, 'oncomment', parser.comment);
            }
            parser.comment = '';
          } else {
            parser.comment += '-' + c;
            parser.state = S.COMMENT;
          }
          continue;
        case S.COMMENT_ENDED:
          if (c !== '>') {
            strictFail(parser, 'Malformed comment');
            // allow <!-- blah -- bloo --> in non-strict mode,
            // which is a comment of " blah -- bloo "
            parser.comment += '--' + c;
            parser.state = S.COMMENT;
          } else {
            parser.state = S.TEXT;
          }
          continue;
        case S.CDATA:
          if (c === ']') {
            parser.state = S.CDATA_ENDING;
          } else {
            parser.cdata += c;
          }
          continue;
        case S.CDATA_ENDING:
          if (c === ']') {
            parser.state = S.CDATA_ENDING_2;
          } else {
            parser.cdata += ']' + c;
            parser.state = S.CDATA;
          }
          continue;
        case S.CDATA_ENDING_2:
          if (c === '>') {
            if (parser.cdata) {
              emitNode(parser, 'oncdata', parser.cdata);
            }
            emitNode(parser, 'onclosecdata');
            parser.cdata = '';
            parser.state = S.TEXT;
          } else if (c === ']') {
            parser.cdata += ']';
          } else {
            parser.cdata += ']]' + c;
            parser.state = S.CDATA;
          }
          continue;
        case S.PROC_INST:
          if (c === '?') {
            parser.state = S.PROC_INST_ENDING;
          } else if (isWhitespace(c)) {
            parser.state = S.PROC_INST_BODY;
          } else {
            parser.procInstName += c;
          }
          continue;
        case S.PROC_INST_BODY:
          if (!parser.procInstBody && isWhitespace(c)) {
            continue;
          } else if (c === '?') {
            parser.state = S.PROC_INST_ENDING;
          } else {
            parser.procInstBody += c;
          }
          continue;
        case S.PROC_INST_ENDING:
          if (c === '>') {
            emitNode(parser, 'onprocessinginstruction', {
              name: parser.procInstName,
              body: parser.procInstBody
            });
            parser.procInstName = parser.procInstBody = '';
            parser.state = S.TEXT;
          } else {
            parser.procInstBody += '?' + c;
            parser.state = S.PROC_INST_BODY;
          }
          continue;
        case S.OPEN_TAG:
          if (isMatch(nameBody, c)) {
            parser.tagName += c;
          } else {
            newTag(parser);
            if (c === '>') {
              openTag(parser);
            } else if (c === '/') {
              parser.state = S.OPEN_TAG_SLASH;
            } else {
              if (!isWhitespace(c)) {
                strictFail(parser, 'Invalid character in tag name');
              }
              parser.state = S.ATTRIB;
            }
          }
          continue;
        case S.OPEN_TAG_SLASH:
          if (c === '>') {
            openTag(parser, true);
            closeTag(parser);
          } else {
            strictFail(parser, 'Forward-slash in opening tag not followed by >');
            parser.state = S.ATTRIB;
          }
          continue;
        case S.ATTRIB:
          // haven't read the attribute name yet.
          if (isWhitespace(c)) {
            continue;
          } else if (c === '>') {
            openTag(parser);
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH;
          } else if (isMatch(nameStart, c)) {
            parser.attribName = c;
            parser.attribValue = '';
            parser.state = S.ATTRIB_NAME;
          } else {
            strictFail(parser, 'Invalid attribute name');
          }
          continue;
        case S.ATTRIB_NAME:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE;
          } else if (c === '>') {
            strictFail(parser, 'Attribute without value');
            parser.attribValue = parser.attribName;
            attrib(parser);
            openTag(parser);
          } else if (isWhitespace(c)) {
            parser.state = S.ATTRIB_NAME_SAW_WHITE;
          } else if (isMatch(nameBody, c)) {
            parser.attribName += c;
          } else {
            strictFail(parser, 'Invalid attribute name');
          }
          continue;
        case S.ATTRIB_NAME_SAW_WHITE:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE;
          } else if (isWhitespace(c)) {
            continue;
          } else {
            strictFail(parser, 'Attribute without value');
            parser.tag.attributes[parser.attribName] = '';
            parser.attribValue = '';
            emitNode(parser, 'onattribute', {
              name: parser.attribName,
              value: ''
            });
            parser.attribName = '';
            if (c === '>') {
              openTag(parser);
            } else if (isMatch(nameStart, c)) {
              parser.attribName = c;
              parser.state = S.ATTRIB_NAME;
            } else {
              strictFail(parser, 'Invalid attribute name');
              parser.state = S.ATTRIB;
            }
          }
          continue;
        case S.ATTRIB_VALUE:
          if (isWhitespace(c)) {
            continue;
          } else if (isQuote(c)) {
            parser.q = c;
            parser.state = S.ATTRIB_VALUE_QUOTED;
          } else {
            strictFail(parser, 'Unquoted attribute value');
            parser.state = S.ATTRIB_VALUE_UNQUOTED;
            parser.attribValue = c;
          }
          continue;
        case S.ATTRIB_VALUE_QUOTED:
          if (c !== parser.q) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_Q;
            } else {
              parser.attribValue += c;
            }
            continue;
          }
          attrib(parser);
          parser.q = '';
          parser.state = S.ATTRIB_VALUE_CLOSED;
          continue;
        case S.ATTRIB_VALUE_CLOSED:
          if (isWhitespace(c)) {
            parser.state = S.ATTRIB;
          } else if (c === '>') {
            openTag(parser);
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH;
          } else if (isMatch(nameStart, c)) {
            strictFail(parser, 'No whitespace between attributes');
            parser.attribName = c;
            parser.attribValue = '';
            parser.state = S.ATTRIB_NAME;
          } else {
            strictFail(parser, 'Invalid attribute name');
          }
          continue;
        case S.ATTRIB_VALUE_UNQUOTED:
          if (!isAttribEnd(c)) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_U;
            } else {
              parser.attribValue += c;
            }
            continue;
          }
          attrib(parser);
          if (c === '>') {
            openTag(parser);
          } else {
            parser.state = S.ATTRIB;
          }
          continue;
        case S.CLOSE_TAG:
          if (!parser.tagName) {
            if (isWhitespace(c)) {
              continue;
            } else if (notMatch(nameStart, c)) {
              if (parser.script) {
                parser.script += '</' + c;
                parser.state = S.SCRIPT;
              } else {
                strictFail(parser, 'Invalid tagname in closing tag.');
              }
            } else {
              parser.tagName = c;
            }
          } else if (c === '>') {
            closeTag(parser);
          } else if (isMatch(nameBody, c)) {
            parser.tagName += c;
          } else if (parser.script) {
            parser.script += '</' + parser.tagName;
            parser.tagName = '';
            parser.state = S.SCRIPT;
          } else {
            if (!isWhitespace(c)) {
              strictFail(parser, 'Invalid tagname in closing tag');
            }
            parser.state = S.CLOSE_TAG_SAW_WHITE;
          }
          continue;
        case S.CLOSE_TAG_SAW_WHITE:
          if (isWhitespace(c)) {
            continue;
          }
          if (c === '>') {
            closeTag(parser);
          } else {
            strictFail(parser, 'Invalid characters in closing tag');
          }
          continue;
        case S.TEXT_ENTITY:
        case S.ATTRIB_VALUE_ENTITY_Q:
        case S.ATTRIB_VALUE_ENTITY_U:
          var returnState;
          var buffer;
          switch (parser.state) {
            case S.TEXT_ENTITY:
              returnState = S.TEXT;
              buffer = 'textNode';
              break;
            case S.ATTRIB_VALUE_ENTITY_Q:
              returnState = S.ATTRIB_VALUE_QUOTED;
              buffer = 'attribValue';
              break;
            case S.ATTRIB_VALUE_ENTITY_U:
              returnState = S.ATTRIB_VALUE_UNQUOTED;
              buffer = 'attribValue';
              break;
          }
          if (c === ';') {
            parser[buffer] += parseEntity(parser);
            parser.entity = '';
            parser.state = returnState;
          } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
            parser.entity += c;
          } else {
            strictFail(parser, 'Invalid character in entity name');
            parser[buffer] += '&' + parser.entity + c;
            parser.entity = '';
            parser.state = returnState;
          }
          continue;
        default:
          throw new Error(parser, 'Unknown state: ' + parser.state);
      }
    } // while

    if (parser.position >= parser.bufferCheckPosition) {
      checkBufferLength(parser);
    }
    return parser;
  }

  /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
  /* istanbul ignore next */
  if (!String.fromCodePoint) {
    (function () {
      var stringFromCharCode = String.fromCharCode;
      var floor = Math.floor;
      var fromCodePoint = function fromCodePoint() {
        var MAX_SIZE = 0x4000;
        var codeUnits = [];
        var highSurrogate;
        var lowSurrogate;
        var index = -1;
        var length = arguments.length;
        if (!length) {
          return '';
        }
        var result = '';
        while (++index < length) {
          var codePoint = Number(arguments[index]);
          if (!isFinite(codePoint) ||
          // `NaN`, `+Infinity`, or `-Infinity`
          codePoint < 0 ||
          // not a valid Unicode code point
          codePoint > 0x10FFFF ||
          // not a valid Unicode code point
          floor(codePoint) !== codePoint // not an integer
          ) {
            throw RangeError('Invalid code point: ' + codePoint);
          }
          if (codePoint <= 0xFFFF) {
            // BMP code point
            codeUnits.push(codePoint);
          } else {
            // Astral code point; split in surrogate halves
            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000;
            highSurrogate = (codePoint >> 10) + 0xD800;
            lowSurrogate = codePoint % 0x400 + 0xDC00;
            codeUnits.push(highSurrogate, lowSurrogate);
          }
          if (index + 1 === length || codeUnits.length > MAX_SIZE) {
            result += stringFromCharCode.apply(null, codeUnits);
            codeUnits.length = 0;
          }
        }
        return result;
      };
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(String, 'fromCodePoint', {
          value: fromCodePoint,
          configurable: true,
          writable: true
        });
      } else {
        String.fromCodePoint = fromCodePoint;
      }
    })();
  }
})( false ? undefined : exports);
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../buffer/index.js */ "./node_modules/buffer/index.js").Buffer))

/***/ })

}]);
//# sourceMappingURL=chunk-1.development.js.map