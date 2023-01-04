(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[2],{

/***/ "./node_modules/@lit-labs/virtualizer/layouts/flow.js":
/*!************************************************************!*\
  !*** ./node_modules/@lit-labs/virtualizer/layouts/flow.js ***!
  \************************************************************/
/*! exports provided: flow, FlowLayout */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "flow", function() { return flow; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FlowLayout", function() { return FlowLayout; });
/* harmony import */ var _shared_SizeCache_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shared/SizeCache.js */ "./node_modules/@lit-labs/virtualizer/layouts/shared/SizeCache.js");
/* harmony import */ var _shared_BaseLayout_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shared/BaseLayout.js */ "./node_modules/@lit-labs/virtualizer/layouts/shared/BaseLayout.js");
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */


const flow = config => Object.assign({
  type: FlowLayout
}, config);
function leadingMargin(direction) {
  return direction === 'horizontal' ? 'marginLeft' : 'marginTop';
}
function trailingMargin(direction) {
  return direction === 'horizontal' ? 'marginRight' : 'marginBottom';
}
function offset(direction) {
  return direction === 'horizontal' ? 'xOffset' : 'yOffset';
}
function collapseMargins(a, b) {
  const m = [a, b].sort();
  return m[1] <= 0 ? Math.min(...m) : m[0] >= 0 ? Math.max(...m) : m[0] + m[1];
}
class MetricsCache {
  constructor() {
    this._childSizeCache = new _shared_SizeCache_js__WEBPACK_IMPORTED_MODULE_0__["SizeCache"]();
    this._marginSizeCache = new _shared_SizeCache_js__WEBPACK_IMPORTED_MODULE_0__["SizeCache"]();
    this._metricsCache = new Map();
  }
  update(metrics, direction) {
    var _a, _b;
    const marginsToUpdate = new Set();
    Object.keys(metrics).forEach(key => {
      const k = Number(key);
      this._metricsCache.set(k, metrics[k]);
      this._childSizeCache.set(k, metrics[k][Object(_shared_BaseLayout_js__WEBPACK_IMPORTED_MODULE_1__["dim1"])(direction)]);
      marginsToUpdate.add(k);
      marginsToUpdate.add(k + 1);
    });
    for (const k of marginsToUpdate) {
      const a = ((_a = this._metricsCache.get(k)) === null || _a === void 0 ? void 0 : _a[leadingMargin(direction)]) || 0;
      const b = ((_b = this._metricsCache.get(k - 1)) === null || _b === void 0 ? void 0 : _b[trailingMargin(direction)]) || 0;
      this._marginSizeCache.set(k, collapseMargins(a, b));
    }
  }
  get averageChildSize() {
    return this._childSizeCache.averageSize;
  }
  get totalChildSize() {
    return this._childSizeCache.totalSize;
  }
  get averageMarginSize() {
    return this._marginSizeCache.averageSize;
  }
  get totalMarginSize() {
    return this._marginSizeCache.totalSize;
  }
  getLeadingMarginValue(index, direction) {
    var _a;
    return ((_a = this._metricsCache.get(index)) === null || _a === void 0 ? void 0 : _a[leadingMargin(direction)]) || 0;
  }
  getChildSize(index) {
    return this._childSizeCache.getSize(index);
  }
  getMarginSize(index) {
    return this._marginSizeCache.getSize(index);
  }
  clear() {
    this._childSizeCache.clear();
    this._marginSizeCache.clear();
    this._metricsCache.clear();
  }
}
class FlowLayout extends _shared_BaseLayout_js__WEBPACK_IMPORTED_MODULE_1__["BaseLayout"] {
  constructor() {
    super(...arguments);
    /**
     * Initial estimate of item size
     */
    this._itemSize = {
      width: 100,
      height: 100
    };
    /**
     * Indices of children mapped to their (position and length) in the scrolling
     * direction. Used to keep track of children that are in range.
     */
    this._physicalItems = new Map();
    /**
     * Used in tandem with _physicalItems to track children in range across
     * reflows.
     */
    this._newPhysicalItems = new Map();
    /**
     * Width and height of children by their index.
     */
    this._metricsCache = new MetricsCache();
    /**
     * anchorIdx is the anchor around which we reflow. It is designed to allow
     * jumping to any point of the scroll size. We choose it once and stick with
     * it until stable. _first and _last are deduced around it.
     */
    this._anchorIdx = null;
    /**
     * Position in the scrolling direction of the anchor child.
     */
    this._anchorPos = null;
    /**
     * Whether all children in range were in range during the previous reflow.
     */
    this._stable = true;
    this._measureChildren = true;
    this._estimate = true;
  }
  // protected _defaultConfig: BaseLayoutConfig = Object.assign({}, super._defaultConfig, {
  // })
  // constructor(config: Layout1dConfig) {
  //   super(config);
  // }
  get measureChildren() {
    return this._measureChildren;
  }
  /**
   * Determine the average size of all children represented in the sizes
   * argument.
   */
  updateItemSizes(sizes) {
    this._metricsCache.update(sizes, this.direction);
    // if (this._nMeasured) {
    // this._updateItemSize();
    this._scheduleReflow();
    // }
  }
  /**
   * Set the average item size based on the total length and number of children
   * in range.
   */
  // _updateItemSize() {
  //   // Keep integer values.
  //   this._itemSize[this._sizeDim] = this._metricsCache.averageChildSize;
  // }
  _getPhysicalItem(idx) {
    var _a;
    return (_a = this._newPhysicalItems.get(idx)) !== null && _a !== void 0 ? _a : this._physicalItems.get(idx);
  }
  _getSize(idx) {
    const item = this._getPhysicalItem(idx);
    return item && this._metricsCache.getChildSize(idx);
  }
  _getAverageSize() {
    return this._metricsCache.averageChildSize || this._itemSize[this._sizeDim];
  }
  /**
   * Returns the position in the scrolling direction of the item at idx.
   * Estimates it if the item at idx is not in the DOM.
   */
  _getPosition(idx) {
    var _a;
    const item = this._getPhysicalItem(idx);
    const {
      averageMarginSize
    } = this._metricsCache;
    return idx === 0 ? (_a = this._metricsCache.getMarginSize(0)) !== null && _a !== void 0 ? _a : averageMarginSize : item ? item.pos : averageMarginSize + idx * (averageMarginSize + this._getAverageSize());
  }
  _calculateAnchor(lower, upper) {
    if (lower <= 0) {
      return 0;
    }
    if (upper > this._scrollSize - this._viewDim1) {
      return this._totalItems - 1;
    }
    return Math.max(0, Math.min(this._totalItems - 1, Math.floor((lower + upper) / 2 / this._delta)));
  }
  _getAnchor(lower, upper) {
    if (this._physicalItems.size === 0) {
      return this._calculateAnchor(lower, upper);
    }
    if (this._first < 0) {
      console.error('_getAnchor: negative _first');
      return this._calculateAnchor(lower, upper);
    }
    if (this._last < 0) {
      console.error('_getAnchor: negative _last');
      return this._calculateAnchor(lower, upper);
    }
    const firstItem = this._getPhysicalItem(this._first),
      lastItem = this._getPhysicalItem(this._last),
      firstMin = firstItem.pos,
      lastMin = lastItem.pos,
      lastMax = lastMin + this._metricsCache.getChildSize(this._last);
    if (lastMax < lower) {
      // Window is entirely past physical items, calculate new anchor
      return this._calculateAnchor(lower, upper);
    }
    if (firstMin > upper) {
      // Window is entirely before physical items, calculate new anchor
      return this._calculateAnchor(lower, upper);
    }
    // Window contains a physical item
    // Find one, starting with the one that was previously first visible
    let candidateIdx = this._firstVisible - 1;
    let cMax = -Infinity;
    while (cMax < lower) {
      const candidate = this._getPhysicalItem(++candidateIdx);
      cMax = candidate.pos + this._metricsCache.getChildSize(candidateIdx);
    }
    return candidateIdx;
  }
  /**
   * Updates _first and _last based on items that should be in the current
   * viewed range.
   */
  _getActiveItems() {
    if (this._viewDim1 === 0 || this._totalItems === 0) {
      this._clearItems();
    } else {
      this._getItems();
    }
  }
  /**
   * Sets the range to empty.
   */
  _clearItems() {
    this._first = -1;
    this._last = -1;
    this._physicalMin = 0;
    this._physicalMax = 0;
    const items = this._newPhysicalItems;
    this._newPhysicalItems = this._physicalItems;
    this._newPhysicalItems.clear();
    this._physicalItems = items;
    this._stable = true;
  }
  /*
   * Updates _first and _last based on items that should be in the given range.
   */
  _getItems() {
    var _a, _b;
    const items = this._newPhysicalItems;
    this._stable = true;
    let lower, upper;
    // The anchorIdx is the anchor around which we reflow. It is designed to
    // allow jumping to any point of the scroll size. We choose it once and
    // stick with it until stable. first and last are deduced around it.
    // If we have a scrollToIndex, we anchor on the given
    // index and set the scroll position accordingly
    if (this._scrollToIndex >= 0) {
      this._anchorIdx = Math.min(this._scrollToIndex, this._totalItems - 1);
      this._anchorPos = this._getPosition(this._anchorIdx);
      this._scrollIfNeeded();
    }
    // Determine the lower and upper bounds of the region to be
    // rendered, relative to the viewport
    lower = this._scrollPosition - this._overhang; //leadingOverhang;
    upper = this._scrollPosition + this._viewDim1 + this._overhang; // trailingOverhang;
    if (upper < 0 || lower > this._scrollSize) {
      this._clearItems();
      return;
    }
    // If we are scrolling to a specific index or if we are doing another
    // pass to stabilize a previously started reflow, we will already
    // have an anchor. If not, establish an anchor now.
    if (this._anchorIdx === null || this._anchorPos === null) {
      this._anchorIdx = this._getAnchor(lower, upper);
      this._anchorPos = this._getPosition(this._anchorIdx);
    }
    let anchorSize = this._getSize(this._anchorIdx);
    if (anchorSize === undefined) {
      this._stable = false;
      anchorSize = this._getAverageSize();
    }
    const anchorLeadingMargin = (_a = this._metricsCache.getMarginSize(this._anchorIdx)) !== null && _a !== void 0 ? _a : this._metricsCache.averageMarginSize;
    const anchorTrailingMargin = (_b = this._metricsCache.getMarginSize(this._anchorIdx + 1)) !== null && _b !== void 0 ? _b : this._metricsCache.averageMarginSize;
    if (this._anchorIdx === 0) {
      this._anchorPos = anchorLeadingMargin;
    }
    if (this._anchorIdx === this._totalItems - 1) {
      this._anchorPos = this._scrollSize - anchorTrailingMargin - anchorSize;
    }
    // Anchor might be outside bounds, so prefer correcting the error and keep
    // that anchorIdx.
    let anchorErr = 0;
    if (this._anchorPos + anchorSize + anchorTrailingMargin < lower) {
      anchorErr = lower - (this._anchorPos + anchorSize + anchorTrailingMargin);
    }
    if (this._anchorPos - anchorLeadingMargin > upper) {
      anchorErr = upper - (this._anchorPos - anchorLeadingMargin);
    }
    if (anchorErr) {
      this._scrollPosition -= anchorErr;
      lower -= anchorErr;
      upper -= anchorErr;
      this._scrollError += anchorErr;
    }
    items.set(this._anchorIdx, {
      pos: this._anchorPos,
      size: anchorSize
    });
    this._first = this._last = this._anchorIdx;
    this._physicalMin = this._anchorPos - anchorLeadingMargin;
    this._physicalMax = this._anchorPos + anchorSize + anchorTrailingMargin;
    while (this._physicalMin > lower && this._first > 0) {
      let size = this._getSize(--this._first);
      if (size === undefined) {
        this._stable = false;
        size = this._getAverageSize();
      }
      let margin = this._metricsCache.getMarginSize(this._first);
      if (margin === undefined) {
        this._stable = false;
        margin = this._metricsCache.averageMarginSize;
      }
      this._physicalMin -= size;
      const pos = this._physicalMin;
      items.set(this._first, {
        pos,
        size
      });
      this._physicalMin -= margin;
      if (this._stable === false && this._estimate === false) {
        break;
      }
    }
    while (this._physicalMax < upper && this._last < this._totalItems - 1) {
      let size = this._getSize(++this._last);
      if (size === undefined) {
        this._stable = false;
        size = this._getAverageSize();
      }
      let margin = this._metricsCache.getMarginSize(this._last);
      if (margin === undefined) {
        this._stable = false;
        margin = this._metricsCache.averageMarginSize;
      }
      const pos = this._physicalMax;
      items.set(this._last, {
        pos,
        size
      });
      this._physicalMax += size + margin;
      if (!this._stable && !this._estimate) {
        break;
      }
    }
    // This handles the cases where we were relying on estimated sizes.
    const extentErr = this._calculateError();
    if (extentErr) {
      this._physicalMin -= extentErr;
      this._physicalMax -= extentErr;
      this._anchorPos -= extentErr;
      this._scrollPosition -= extentErr;
      items.forEach(item => item.pos -= extentErr);
      this._scrollError += extentErr;
    }
    if (this._stable) {
      this._newPhysicalItems = this._physicalItems;
      this._newPhysicalItems.clear();
      this._physicalItems = items;
    }
  }
  _calculateError() {
    if (this._first === 0) {
      return this._physicalMin;
    } else if (this._physicalMin <= 0) {
      return this._physicalMin - this._first * this._delta;
    } else if (this._last === this._totalItems - 1) {
      return this._physicalMax - this._scrollSize;
    } else if (this._physicalMax >= this._scrollSize) {
      return this._physicalMax - this._scrollSize + (this._totalItems - 1 - this._last) * this._delta;
    }
    return 0;
  }
  // TODO: Can this be made to inherit from base, with proper hooks?
  _reflow() {
    const {
      _first,
      _last,
      _scrollSize
    } = this;
    this._updateScrollSize();
    this._getActiveItems();
    if (this._scrollSize !== _scrollSize) {
      this._emitScrollSize();
    }
    this._updateVisibleIndices();
    this._emitRange();
    if (this._first === -1 && this._last === -1) {
      this._resetReflowState();
    } else if (this._first !== _first || this._last !== _last) {
      this._emitChildPositions();
      this._emitScrollError();
    } else {
      this._emitChildPositions();
      this._emitScrollError();
      this._resetReflowState();
    }
  }
  _resetReflowState() {
    this._anchorIdx = null;
    this._anchorPos = null;
    this._stable = true;
  }
  _updateScrollSize() {
    const {
      averageMarginSize
    } = this._metricsCache;
    this._scrollSize = Math.max(1, this._totalItems * (averageMarginSize + this._getAverageSize()) + averageMarginSize);
  }
  /**
   * Returns the average size (precise or estimated) of an item in the scrolling direction,
   * including any surrounding space.
   */
  get _delta() {
    const {
      averageMarginSize
    } = this._metricsCache;
    return this._getAverageSize() + averageMarginSize;
  }
  /**
   * Returns the top and left positioning of the item at idx.
   */
  _getItemPosition(idx) {
    var _a;
    return {
      [this._positionDim]: this._getPosition(idx),
      [this._secondaryPositionDim]: 0,
      [offset(this.direction)]: -((_a = this._metricsCache.getLeadingMarginValue(idx, this.direction)) !== null && _a !== void 0 ? _a : this._metricsCache.averageMarginSize)
    };
  }
  /**
   * Returns the height and width of the item at idx.
   */
  _getItemSize(idx) {
    var _a;
    return {
      [this._sizeDim]: (this._getSize(idx) || this._getAverageSize()) + ((_a = this._metricsCache.getMarginSize(idx + 1)) !== null && _a !== void 0 ? _a : this._metricsCache.averageMarginSize),
      [this._secondarySizeDim]: this._itemSize[this._secondarySizeDim]
    };
  }
  _viewDim2Changed() {
    this._scheduleReflow();
  }
}

/***/ }),

/***/ "./node_modules/@lit-labs/virtualizer/layouts/shared/BaseLayout.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@lit-labs/virtualizer/layouts/shared/BaseLayout.js ***!
  \*************************************************************************/
/*! exports provided: dim1, dim2, pos1, pos2, BaseLayout */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "dim1", function() { return dim1; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "dim2", function() { return dim2; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pos1", function() { return pos1; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pos2", function() { return pos2; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BaseLayout", function() { return BaseLayout; });
/* harmony import */ var _polyfillLoaders_EventTarget_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../polyfillLoaders/EventTarget.js */ "./node_modules/@lit-labs/virtualizer/polyfillLoaders/EventTarget.js");
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

function dim1(direction) {
  return direction === 'horizontal' ? 'width' : 'height';
}
function dim2(direction) {
  return direction === 'horizontal' ? 'height' : 'width';
}
function pos1(direction) {
  return direction === 'horizontal' ? 'left' : 'top';
}
function pos2(direction) {
  return direction === 'horizontal' ? 'top' : 'left';
}
class BaseLayout {
  constructor(config) {
    /**
     * The last set viewport scroll position.
     */
    this._latestCoords = {
      left: 0,
      top: 0
    };
    /**
     * Scrolling direction.
     */
    this._direction = null;
    /**
     * Dimensions of the viewport.
     */
    this._viewportSize = {
      width: 0,
      height: 0
    };
    /**
     * Flag for debouncing asynchnronous reflow requests.
     */
    this._pendingReflow = false;
    this._pendingLayoutUpdate = false;
    /**
     * Index of the item that has been scrolled to via the public API. When the
     * viewport is otherwise scrolled, this value is set back to -1.
     */
    this._scrollToIndex = -1;
    /**
     * When a child is scrolled to, the offset from the top of the child and the
     * top of the viewport. Value is a proportion of the item size.
     */
    this._scrollToAnchor = 0;
    /**
     * The index of the first item intersecting the viewport.
     */
    this._firstVisible = 0;
    /**
     * The index of the last item intersecting the viewport.
     */
    this._lastVisible = 0;
    this._eventTargetPromise = Object(_polyfillLoaders_EventTarget_js__WEBPACK_IMPORTED_MODULE_0__["default"])().then(Ctor => {
      this._eventTarget = new Ctor();
    });
    /**
     * Pixel offset in the scroll direction of the first child.
     */
    this._physicalMin = 0;
    /**
     * Pixel offset in the scroll direction of the last child.
     */
    this._physicalMax = 0;
    /**
     * Index of the first child.
     */
    this._first = -1;
    /**
     * Index of the last child.
     */
    this._last = -1;
    /**
     * Length in the scrolling direction.
     */
    this._sizeDim = 'height';
    /**
     * Length in the non-scrolling direction.
     */
    this._secondarySizeDim = 'width';
    /**
     * Position in the scrolling direction.
     */
    this._positionDim = 'top';
    /**
     * Position in the non-scrolling direction.
     */
    this._secondaryPositionDim = 'left';
    /**
     * Current scroll offset in pixels.
     */
    this._scrollPosition = 0;
    /**
     * Difference between current scroll offset and scroll offset calculated due
     * to a reflow.
     */
    this._scrollError = 0;
    /**
     * Total number of items that could possibly be displayed. Used to help
     * calculate the scroll size.
     */
    this._totalItems = 0;
    /**
     * The total (estimated) length of all items in the scrolling direction.
     */
    this._scrollSize = 1;
    /**
     * Number of pixels beyond the viewport to still include
     * in the active range of items.
     */
    // TODO (graynorton): Probably want to make this something we calculate based
    // on viewport size, item size, other factors, possibly still with a dial of some kind
    this._overhang = 1000;
    this._eventTarget = null;
    // Delay setting config so that subclasses do setup work first
    Promise.resolve().then(() => this.config = config || this._defaultConfig);
  }
  get _defaultConfig() {
    return {
      direction: 'vertical'
    };
  }
  set config(config) {
    Object.assign(this, Object.assign({}, this._defaultConfig, config));
  }
  get config() {
    return {
      direction: this.direction
    };
  }
  /**
   * Maximum index of children + 1, to help estimate total height of the scroll
   * space.
   */
  get totalItems() {
    return this._totalItems;
  }
  set totalItems(num) {
    const _num = Number(num);
    if (_num !== this._totalItems) {
      this._totalItems = _num;
      this._scheduleReflow();
    }
  }
  /**
   * Primary scrolling direction.
   */
  get direction() {
    return this._direction;
  }
  set direction(dir) {
    // Force it to be either horizontal or vertical.
    dir = dir === 'horizontal' ? dir : 'vertical';
    if (dir !== this._direction) {
      this._direction = dir;
      this._sizeDim = dir === 'horizontal' ? 'width' : 'height';
      this._secondarySizeDim = dir === 'horizontal' ? 'height' : 'width';
      this._positionDim = dir === 'horizontal' ? 'left' : 'top';
      this._secondaryPositionDim = dir === 'horizontal' ? 'top' : 'left';
      this._triggerReflow();
    }
  }
  /**
   * Height and width of the viewport.
   */
  get viewportSize() {
    return this._viewportSize;
  }
  set viewportSize(dims) {
    const {
      _viewDim1,
      _viewDim2
    } = this;
    Object.assign(this._viewportSize, dims);
    if (_viewDim2 !== this._viewDim2) {
      // this._viewDim2Changed();
      this._scheduleLayoutUpdate();
    } else if (_viewDim1 !== this._viewDim1) {
      this._checkThresholds();
    }
  }
  /**
   * Scroll offset of the viewport.
   */
  get viewportScroll() {
    return this._latestCoords;
  }
  set viewportScroll(coords) {
    Object.assign(this._latestCoords, coords);
    const oldPos = this._scrollPosition;
    this._scrollPosition = this._latestCoords[this._positionDim];
    if (oldPos !== this._scrollPosition) {
      this._scrollPositionChanged(oldPos, this._scrollPosition);
      this._updateVisibleIndices({
        emit: true
      });
    }
    this._checkThresholds();
  }
  /**
   * Perform a reflow if one has been scheduled.
   */
  reflowIfNeeded(force = false) {
    if (force || this._pendingReflow) {
      this._pendingReflow = false;
      this._reflow();
    }
  }
  /**
   * Scroll to the child at the given index, and the given position within that
   * child.
   */
  scrollToIndex(index, position = 'start') {
    if (!Number.isFinite(index)) return;
    index = Math.min(this.totalItems, Math.max(0, index));
    this._scrollToIndex = index;
    if (position === 'nearest') {
      position = index > this._first + this._num / 2 ? 'end' : 'start';
    }
    switch (position) {
      case 'start':
        this._scrollToAnchor = 0;
        break;
      case 'center':
        this._scrollToAnchor = 0.5;
        break;
      case 'end':
        this._scrollToAnchor = 1;
        break;
      default:
        throw new TypeError('position must be one of: start, center, end, nearest');
    }
    this._scheduleReflow();
  }
  async dispatchEvent(evt) {
    await this._eventTargetPromise;
    this._eventTarget.dispatchEvent(evt);
  }
  async addEventListener(type, listener, options) {
    await this._eventTargetPromise;
    this._eventTarget.addEventListener(type, listener, options);
  }
  async removeEventListener(type, callback, options) {
    await this._eventTargetPromise;
    this._eventTarget.removeEventListener(type, callback, options);
  }
  _updateLayout() {
    // Override
  }
  // protected _viewDim2Changed(): void {
  //   this._scheduleLayoutUpdate();
  // }
  /**
   * The height or width of the viewport, whichever corresponds to the scrolling direction.
   */
  get _viewDim1() {
    return this._viewportSize[this._sizeDim];
  }
  /**
   * The height or width of the viewport, whichever does NOT correspond to the scrolling direction.
   */
  get _viewDim2() {
    return this._viewportSize[this._secondarySizeDim];
  }
  _scheduleReflow() {
    this._pendingReflow = true;
  }
  _scheduleLayoutUpdate() {
    this._pendingLayoutUpdate = true;
    this._scheduleReflow();
  }
  // For triggering a reflow based on incoming changes to
  // the layout config.
  _triggerReflow() {
    this._scheduleLayoutUpdate();
    // TODO graynorton@: reflowIfNeeded() isn't really supposed
    // to be called internally. Address in larger cleanup
    // of virtualizer / layout interaction pattern.
    // this.reflowIfNeeded(true);
    Promise.resolve().then(() => this.reflowIfNeeded());
  }
  _reflow() {
    if (this._pendingLayoutUpdate) {
      this._updateLayout();
      this._pendingLayoutUpdate = false;
    }
    this._updateScrollSize();
    this._getActiveItems();
    this._scrollIfNeeded();
    this._updateVisibleIndices();
    this._emitScrollSize();
    this._emitRange();
    this._emitChildPositions();
    this._emitScrollError();
  }
  _scrollIfNeeded() {
    if (this._scrollToIndex === -1) {
      return;
    }
    const index = this._scrollToIndex;
    const anchor = this._scrollToAnchor;
    const pos = this._getItemPosition(index)[this._positionDim];
    const size = this._getItemSize(index)[this._sizeDim];
    const curAnchorPos = this._scrollPosition + this._viewDim1 * anchor;
    const newAnchorPos = pos + size * anchor;
    // Ensure scroll position is an integer within scroll bounds.
    const scrollPosition = Math.floor(Math.min(this._scrollSize - this._viewDim1, Math.max(0, this._scrollPosition - curAnchorPos + newAnchorPos)));
    this._scrollError += this._scrollPosition - scrollPosition;
    this._scrollPosition = scrollPosition;
  }
  _emitRange(inProps = undefined) {
    const detail = Object.assign({
      first: this._first,
      last: this._last,
      num: this._num,
      firstVisible: this._firstVisible,
      lastVisible: this._lastVisible
    }, inProps);
    this.dispatchEvent(new CustomEvent('rangechange', {
      detail
    }));
  }
  _emitScrollSize() {
    const detail = {
      [this._sizeDim]: this._scrollSize,
      [this._secondarySizeDim]: null
    };
    this.dispatchEvent(new CustomEvent('scrollsizechange', {
      detail
    }));
  }
  _emitScrollError() {
    if (this._scrollError) {
      const detail = {
        [this._positionDim]: this._scrollError,
        [this._secondaryPositionDim]: 0
      };
      this.dispatchEvent(new CustomEvent('scrollerrorchange', {
        detail
      }));
      this._scrollError = 0;
    }
  }
  /**
   * Get or estimate the top and left positions of items in the current range.
   * Emit an itempositionchange event with these positions.
   */
  _emitChildPositions() {
    const detail = {};
    for (let idx = this._first; idx <= this._last; idx++) {
      detail[idx] = this._getItemPosition(idx);
    }
    this.dispatchEvent(new CustomEvent('itempositionchange', {
      detail
    }));
  }
  /**
   * Number of items to display.
   */
  get _num() {
    if (this._first === -1 || this._last === -1) {
      return 0;
    }
    return this._last - this._first + 1;
  }
  _checkThresholds() {
    if (this._viewDim1 === 0 && this._num > 0) {
      this._scheduleReflow();
    } else {
      const min = Math.max(0, this._scrollPosition - this._overhang);
      const max = Math.min(this._scrollSize, this._scrollPosition + this._viewDim1 + this._overhang);
      if (this._physicalMin > min || this._physicalMax < max) {
        this._scheduleReflow();
      }
    }
  }
  /**
   * Find the indices of the first and last items to intersect the viewport.
   * Emit a visibleindiceschange event when either index changes.
   */
  _updateVisibleIndices(options) {
    if (this._first === -1 || this._last === -1) return;
    let firstVisible = this._first;
    while (firstVisible < this._last && Math.round(this._getItemPosition(firstVisible)[this._positionDim] + this._getItemSize(firstVisible)[this._sizeDim]) <= Math.round(this._scrollPosition)) {
      firstVisible++;
    }
    let lastVisible = this._last;
    while (lastVisible > this._first && Math.round(this._getItemPosition(lastVisible)[this._positionDim]) >= Math.round(this._scrollPosition + this._viewDim1)) {
      lastVisible--;
    }
    if (firstVisible !== this._firstVisible || lastVisible !== this._lastVisible) {
      this._firstVisible = firstVisible;
      this._lastVisible = lastVisible;
      if (options && options.emit) {
        this._emitRange();
      }
    }
  }
  _scrollPositionChanged(oldPos, newPos) {
    // When both values are bigger than the max scroll position, keep the
    // current _scrollToIndex, otherwise invalidate it.
    const maxPos = this._scrollSize - this._viewDim1;
    if (oldPos < maxPos || newPos < maxPos) {
      this._scrollToIndex = -1;
    }
  }
}

/***/ }),

/***/ "./node_modules/@lit-labs/virtualizer/layouts/shared/SizeCache.js":
/*!************************************************************************!*\
  !*** ./node_modules/@lit-labs/virtualizer/layouts/shared/SizeCache.js ***!
  \************************************************************************/
/*! exports provided: SizeCache */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SizeCache", function() { return SizeCache; });
class SizeCache {
  constructor(config) {
    this._map = new Map();
    this._roundAverageSize = true;
    this.totalSize = 0;
    if ((config === null || config === void 0 ? void 0 : config.roundAverageSize) === false) {
      this._roundAverageSize = false;
    }
  }
  set(index, value) {
    const prev = this._map.get(index) || 0;
    this._map.set(index, value);
    this.totalSize += value - prev;
  }
  get averageSize() {
    if (this._map.size > 0) {
      const average = this.totalSize / this._map.size;
      return this._roundAverageSize ? Math.round(average) : average;
    }
    return 0;
  }
  getSize(index) {
    return this._map.get(index);
  }
  clear() {
    this._map.clear();
    this.totalSize = 0;
  }
}

/***/ }),

/***/ "./node_modules/@lit-labs/virtualizer/polyfillLoaders/EventTarget.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@lit-labs/virtualizer/polyfillLoaders/EventTarget.js ***!
  \***************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return EventTarget; });
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let _ET;
let ET;
async function EventTarget() {
  return ET || init();
}
async function init() {
  _ET = window.EventTarget;
  try {
    new _ET();
  } catch (_unused) {
    _ET = (await __webpack_require__.e(/*! import() */ 7).then(__webpack_require__.t.bind(null, /*! event-target-shim */ "./node_modules/event-target-shim/index.js", 7))).EventTarget;
  }
  return ET = _ET;
}

/***/ })

}]);
//# sourceMappingURL=chunk-2.development.js.map