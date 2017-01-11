(this.nativeLog || function(s) {console.log(s)})('START WEEX HTML5: 0.2.23 Build 20160705');
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/* global lib, WebSocket */
	
	'use strict';
	
	__webpack_require__(1);
	
	__webpack_require__(71);
	
	__webpack_require__(75);
	
	var config = __webpack_require__(78);
	var Loader = __webpack_require__(79);
	var utils = __webpack_require__(80);
	var protocol = __webpack_require__(81);
	var ComponentManager = __webpack_require__(82);
	var Component = __webpack_require__(89);
	var Sender = __webpack_require__(93);
	var receiver = __webpack_require__(94);
	
	// Components and apis.
	var components = __webpack_require__(95);
	var api = __webpack_require__(157);
	__webpack_require__(191);
	__webpack_require__(169);
	
	// gesture
	__webpack_require__(118);
	
	var WEAPP_STYLE_ID = 'weapp-style';
	
	var DEFAULT_DESIGN_WIDTH = 750;
	var DEFAULT_SCALE = window.innerWidth / DEFAULT_DESIGN_WIDTH;
	var DEFAULT_ROOT_ID = 'weex';
	var DEFAULT_JSONP_CALLBACK_NAME = 'weexJsonpCallback';
	
	window.WXEnvironment = {
	  weexVersion: config.weexVersion,
	  appName: lib.env.aliapp ? lib.env.aliapp.appname : null,
	  appVersion: lib.env.aliapp ? lib.env.aliapp.version.val : null,
	  platform: 'Web',
	  osName: lib.env.browser ? lib.env.browser.name : null,
	  osVersion: lib.env.browser ? lib.env.browser.version.val : null,
	  deviceWidth: DEFAULT_DESIGN_WIDTH,
	  deviceHeight: window.innerHeight / DEFAULT_SCALE
	};
	
	var _instanceMap = {};
	var _downgrades = {};
	
	var downgradable = ['list', 'scroller'];
	
	function initializeWithUrlParams() {
	  // in casperjs the protocol is file.
	  if (location.protocol.match(/file/)) {
	    return;
	  }
	
	  var params = lib.httpurl(location.href).params;
	  for (var k in params) {
	    // Get global _downgrades from url's params.
	    var match = k.match(/downgrade_(\w+)/);
	    if (!match || !match[1]) {
	      continue;
	    }
	    if (params[k] !== true && params[k] !== 'true') {
	      continue;
	    }
	    var downk = match[1];
	    if (downk && downgradable.indexOf(downk) !== -1) {
	      _downgrades[downk] = true;
	    }
	  }
	
	  // set global 'debug' config to true if there's a debug flag in current url.
	  var debug = params['debug'];
	  if (debug === true || debug === 'true') {
	    config.debug = true;
	  }
	}
	
	initializeWithUrlParams();
	
	var logger = __webpack_require__(97);
	logger.init();
	
	function Weex(options) {
	  if (!(this instanceof Weex)) {
	    return new Weex(options);
	  }
	
	  // Width of the root container. Default is window.innerWidth.
	  this.width = options.width || window.innerWidth;
	  this.bundleUrl = options.bundleUrl || location.href;
	  this.instanceId = options.appId;
	  this.rootId = options.rootId || DEFAULT_ROOT_ID + utils.getRandom(10);
	  this.designWidth = options.designWidth || DEFAULT_DESIGN_WIDTH;
	  this.jsonpCallback = options.jsonpCallback || DEFAULT_JSONP_CALLBACK_NAME;
	  this.source = options.source;
	  this.loader = options.loader;
	  this.embed = options.embed;
	
	  this.data = options.data;
	
	  this.initDowngrades(options.downgrade);
	  this.initScale();
	  this.initComponentManager();
	  this.initBridge();
	  Weex.addInstance(this);
	
	  protocol.injectWeexInstance(this);
	
	  this.loadBundle(function (err, appCode) {
	    if (!err) {
	      this.createApp(config, appCode);
	    } else {
	      console.error('load bundle err:', err);
	    }
	  }.bind(this));
	}
	
	Weex.init = function (options) {
	  if (utils.isArray(options)) {
	    options.forEach(function (config) {
	      new Weex(config);
	    });
	  } else if (utils.getType(options) === 'object') {
	    new Weex(options);
	  }
	};
	
	Weex.addInstance = function (instance) {
	  _instanceMap[instance.instanceId] = instance;
	};
	
	Weex.getInstance = function (instanceId) {
	  return _instanceMap[instanceId];
	};
	
	Weex.prototype = {
	
	  initDowngrades: function initDowngrades(dg) {
	    this.downgrades = utils.extend({}, _downgrades);
	    // Get downgrade component type from user's specification
	    // in weex's init options.
	    if (!utils.isArray(dg)) {
	      return;
	    }
	    for (var i = 0, l = dg.length; i < l; i++) {
	      var downk = dg[i];
	      if (downgradable.indexOf(downk) !== -1) {
	        this.downgrades[downk] = true;
	      }
	    }
	  },
	
	  initBridge: function initBridge() {
	    receiver.init(this);
	    this.sender = new Sender(this);
	  },
	
	  loadBundle: function loadBundle(cb) {
	    Loader.load({
	      jsonpCallback: this.jsonpCallback,
	      source: this.source,
	      loader: this.loader
	    }, cb);
	  },
	
	  createApp: function createApp(config, appCode) {
	    var root = document.querySelector('#' + this.rootId);
	    if (!root) {
	      root = document.createElement('div');
	      root.id = this.rootId;
	      document.body.appendChild(root);
	    }
	
	    var promise = window.createInstance(this.instanceId, appCode, {
	      bundleUrl: this.bundleUrl,
	      debug: config.debug
	    }, this.data);
	
	    if (Promise && promise instanceof Promise) {
	      promise.then(function () {
	        // Weex._instances[this.instanceId] = this.root
	      }).catch(function (err) {
	        if (err && config.debug) {
	          console.error(err);
	        }
	      });
	    }
	
	    // Do not destroy instance here, because in most browser
	    // press back button to back to this page will not refresh
	    // the window and the instance will not be recreated then.
	    // window.addEventListener('beforeunload', function (e) {
	    // })
	  },
	
	  initScale: function initScale() {
	    this.scale = this.width / this.designWidth;
	  },
	
	  initComponentManager: function initComponentManager() {
	    this._componentManager = new ComponentManager(this);
	  },
	
	  getComponentManager: function getComponentManager() {
	    return this._componentManager;
	  },
	
	  getRoot: function getRoot() {
	    return document.querySelector('#' + this.rootId);
	  }
	};
	
	Weex.appendStyle = function (css) {
	  utils.appendStyle(css, WEAPP_STYLE_ID);
	};
	
	// Register a new component with the specified name.
	Weex.registerComponent = function (name, comp) {
	  ComponentManager.registerComponent(name, comp);
	};
	
	// Register a new api module.
	// If the module already exists, just add methods from the
	// new module to the old one.
	Weex.registerApiModule = function (name, module, meta) {
	  if (!protocol.apiModule[name]) {
	    protocol.apiModule[name] = module;
	  } else {
	    for (var key in module) {
	      if (module.hasOwnProperty(key)) {
	        protocol.apiModule[name][key] = module[key];
	      }
	    }
	  }
	  // register API module's meta info to jsframework
	  if (meta) {
	    protocol.setApiModuleMeta(meta);
	    window.registerModules(protocol.getApiModuleMeta(name), true);
	  }
	};
	
	// Register a new api method for the specified module.
	// opts:
	//  - args: type of arguments the API method takes such
	//    as ['string', 'function']
	Weex.registerApi = function (moduleName, name, method, args) {
	  if (typeof method !== 'function') {
	    return;
	  }
	  if (!protocol.apiModule[moduleName]) {
	    protocol.apiModule[moduleName] = {};
	    protocol._meta[moduleName] = [];
	  }
	  protocol.apiModule[moduleName][name] = method;
	  if (!args) {
	    return;
	  }
	  // register API meta info to jsframework
	  protocol.setApiMeta(moduleName, {
	    name: name,
	    args: args
	  });
	  window.registerModules(protocol.getApiModuleMeta(moduleName), true);
	};
	
	// Register a new weex-bundle-loader.
	Weex.registerLoader = function (name, loaderFunc) {
	  Loader.registerLoader(name, loaderFunc);
	};
	
	// To install components and plugins.
	Weex.install = function (mod) {
	  mod.init(Weex);
	};
	
	Weex.stopTheWorld = function () {
	  for (var instanceId in _instanceMap) {
	    if (_instanceMap.hasOwnProperty(instanceId)) {
	      window.destroyInstance(instanceId);
	    }
	  }
	};
	
	function startRefreshController() {
	  if (location.protocol.match(/file/)) {
	    return;
	  }
	  if (location.search.indexOf('hot-reload_controller') === -1) {
	    return;
	  }
	  if (typeof WebSocket === 'undefined') {
	    console.info('auto refresh need WebSocket support');
	    return;
	  }
	  var host = location.hostname;
	  var port = 8082;
	  var client = new WebSocket('ws://' + host + ':' + port + '/', 'echo-protocol');
	  client.onerror = function () {
	    console.log('refresh controller websocket connection error');
	  };
	  client.onmessage = function (e) {
	    console.log('Received: \'' + e.data + '\'');
	    if (e.data === 'refresh') {
	      location.reload();
	    }
	  };
	}
	
	startRefreshController();
	
	// Weex.install(require('weex-components'))
	Weex.install(components);
	Weex.install(api);
	
	Weex.Component = Component;
	Weex.ComponentManager = ComponentManager;
	Weex.utils = utils;
	Weex.config = config;
	
	global.weex = Weex;
	module.exports = Weex;
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	__webpack_require__(2);
	
	var _runtime = __webpack_require__(44);
	
	var _runtime2 = _interopRequireDefault(_runtime);
	
	var _package = __webpack_require__(69);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var native = _package.subversion.native;
	var transformer = _package.subversion.transformer;
	
	var _loop = function _loop(methodName) {
	  global[methodName] = function () {
	    var ret = _runtime2.default[methodName].apply(_runtime2.default, arguments);
	    if (ret instanceof Error) {
	      console.error(ret.toString());
	    }
	    return ret;
	  };
	};
	
	for (var methodName in _runtime2.default) {
	  _loop(methodName);
	}
	
	Object.assign(global, {
	  frameworkVersion: native,
	  needTransformerVersion: transformer
	});
	
	/**
	 * register methods
	 */
	var methods = __webpack_require__(70);
	var _global = global;
	var registerMethods = _global.registerMethods;
	
	registerMethods(methods);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(3);
	
	__webpack_require__(41);
	
	__webpack_require__(42);
	
	__webpack_require__(43);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(4);

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(5);
	module.exports = __webpack_require__(8).Object.assign;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// 19.1.3.1 Object.assign(target, source)
	var $export = __webpack_require__(6);
	
	$export($export.S + $export.F, 'Object', { assign: __webpack_require__(24) });

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var global = __webpack_require__(7),
	    core = __webpack_require__(8),
	    hide = __webpack_require__(9),
	    redefine = __webpack_require__(19),
	    ctx = __webpack_require__(22),
	    PROTOTYPE = 'prototype';
	
	var $export = function $export(type, name, source) {
	  var IS_FORCED = type & $export.F,
	      IS_GLOBAL = type & $export.G,
	      IS_STATIC = type & $export.S,
	      IS_PROTO = type & $export.P,
	      IS_BIND = type & $export.B,
	      target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE],
	      exports = IS_GLOBAL ? core : core[name] || (core[name] = {}),
	      expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {}),
	      key,
	      own,
	      out,
	      exp;
	  if (IS_GLOBAL) source = name;
	  for (key in source) {
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    // export native or passed
	    out = (own ? target : source)[key];
	    // bind timers to global for call from export context
	    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // extend global
	    if (target) redefine(target, key, out, type & $export.U);
	    // export
	    if (exports[key] != out) hide(exports, key, exp);
	    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
	  }
	};
	global.core = core;
	// type bitmap
	$export.F = 1; // forced
	$export.G = 2; // global
	$export.S = 4; // static
	$export.P = 8; // proto
	$export.B = 16; // bind
	$export.W = 32; // wrap
	$export.U = 64; // safe
	$export.R = 128; // real proto method for `library`
	module.exports = $export;

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';
	
	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';
	
	var core = module.exports = { version: '2.4.0' };
	if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var dP = __webpack_require__(10),
	    createDesc = __webpack_require__(18);
	module.exports = __webpack_require__(14) ? function (object, key, value) {
	  return dP.f(object, key, createDesc(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var anObject = __webpack_require__(11),
	    IE8_DOM_DEFINE = __webpack_require__(13),
	    toPrimitive = __webpack_require__(17),
	    dP = Object.defineProperty;
	
	exports.f = __webpack_require__(14) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
	  anObject(O);
	  P = toPrimitive(P, true);
	  anObject(Attributes);
	  if (IE8_DOM_DEFINE) try {
	    return dP(O, P, Attributes);
	  } catch (e) {/* empty */}
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var isObject = __webpack_require__(12);
	module.exports = function (it) {
	  if (!isObject(it)) throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	module.exports = function (it) {
	  return (typeof it === 'undefined' ? 'undefined' : _typeof(it)) === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	module.exports = !__webpack_require__(14) && !__webpack_require__(15)(function () {
	  return Object.defineProperty(__webpack_require__(16)('div'), 'a', { get: function get() {
	      return 7;
	    } }).a != 7;
	});

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(15)(function () {
	  return Object.defineProperty({}, 'a', { get: function get() {
	      return 7;
	    } }).a != 7;
	});

/***/ },
/* 15 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function (exec) {
	  try {
	    return !!exec();
	  } catch (e) {
	    return true;
	  }
	};

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var isObject = __webpack_require__(12),
	    document = __webpack_require__(7).document
	// in old IE typeof document.createElement is 'object'
	,
	    is = isObject(document) && isObject(document.createElement);
	module.exports = function (it) {
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// 7.1.1 ToPrimitive(input [, PreferredType])
	var isObject = __webpack_require__(12);
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	module.exports = function (it, S) {
	  if (!isObject(it)) return it;
	  var fn, val;
	  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
	  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
	  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};

/***/ },
/* 18 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var global = __webpack_require__(7),
	    hide = __webpack_require__(9),
	    has = __webpack_require__(20),
	    SRC = __webpack_require__(21)('src'),
	    TO_STRING = 'toString',
	    $toString = Function[TO_STRING],
	    TPL = ('' + $toString).split(TO_STRING);
	
	__webpack_require__(8).inspectSource = function (it) {
	  return $toString.call(it);
	};
	
	(module.exports = function (O, key, val, safe) {
	  var isFunction = typeof val == 'function';
	  if (isFunction) has(val, 'name') || hide(val, 'name', key);
	  if (O[key] === val) return;
	  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
	  if (O === global) {
	    O[key] = val;
	  } else {
	    if (!safe) {
	      delete O[key];
	      hide(O, key, val);
	    } else {
	      if (O[key]) O[key] = val;else hide(O, key, val);
	    }
	  }
	  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
	})(Function.prototype, TO_STRING, function toString() {
	  return typeof this == 'function' && this[SRC] || $toString.call(this);
	});

/***/ },
/* 20 */
/***/ function(module, exports) {

	"use strict";
	
	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function (it, key) {
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 21 */
/***/ function(module, exports) {

	'use strict';
	
	var id = 0,
	    px = Math.random();
	module.exports = function (key) {
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// optional / simple context binding
	var aFunction = __webpack_require__(23);
	module.exports = function (fn, that, length) {
	  aFunction(fn);
	  if (that === undefined) return fn;
	  switch (length) {
	    case 1:
	      return function (a) {
	        return fn.call(that, a);
	      };
	    case 2:
	      return function (a, b) {
	        return fn.call(that, a, b);
	      };
	    case 3:
	      return function (a, b, c) {
	        return fn.call(that, a, b, c);
	      };
	  }
	  return function () /* ...args */{
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 23 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function (it) {
	  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// 19.1.2.1 Object.assign(target, source, ...)
	
	var getKeys = __webpack_require__(25),
	    gOPS = __webpack_require__(38),
	    pIE = __webpack_require__(39),
	    toObject = __webpack_require__(40),
	    IObject = __webpack_require__(28),
	    $assign = Object.assign;
	
	// should work with symbols and should have deterministic property order (V8 bug)
	module.exports = !$assign || __webpack_require__(15)(function () {
	  var A = {},
	      B = {},
	      S = Symbol(),
	      K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function (k) {
	    B[k] = k;
	  });
	  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
	}) ? function assign(target, source) {
	  // eslint-disable-line no-unused-vars
	  var T = toObject(target),
	      aLen = arguments.length,
	      index = 1,
	      getSymbols = gOPS.f,
	      isEnum = pIE.f;
	  while (aLen > index) {
	    var S = IObject(arguments[index++]),
	        keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S),
	        length = keys.length,
	        j = 0,
	        key;
	    while (length > j) {
	      if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
	    }
	  }return T;
	} : $assign;

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	var $keys = __webpack_require__(26),
	    enumBugKeys = __webpack_require__(37);
	
	module.exports = Object.keys || function keys(O) {
	  return $keys(O, enumBugKeys);
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var has = __webpack_require__(20),
	    toIObject = __webpack_require__(27),
	    arrayIndexOf = __webpack_require__(31)(false),
	    IE_PROTO = __webpack_require__(35)('IE_PROTO');
	
	module.exports = function (object, names) {
	  var O = toIObject(object),
	      i = 0,
	      result = [],
	      key;
	  for (key in O) {
	    if (key != IE_PROTO) has(O, key) && result.push(key);
	  } // Don't enum bug & hidden keys
	  while (names.length > i) {
	    if (has(O, key = names[i++])) {
	      ~arrayIndexOf(result, key) || result.push(key);
	    }
	  }return result;
	};

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(28),
	    defined = __webpack_require__(30);
	module.exports = function (it) {
	  return IObject(defined(it));
	};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(29);
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 29 */
/***/ function(module, exports) {

	"use strict";
	
	var toString = {}.toString;
	
	module.exports = function (it) {
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 30 */
/***/ function(module, exports) {

	"use strict";
	
	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// false -> Array#indexOf
	// true  -> Array#includes
	var toIObject = __webpack_require__(27),
	    toLength = __webpack_require__(32),
	    toIndex = __webpack_require__(34);
	module.exports = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = toIObject($this),
	        length = toLength(O.length),
	        index = toIndex(fromIndex, length),
	        value;
	    // Array#includes uses SameValueZero equality algorithm
	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++];
	      if (value != value) return true;
	      // Array#toIndex ignores holes, Array#includes - not
	    } else for (; length > index; index++) {
	        if (IS_INCLUDES || index in O) {
	          if (O[index] === el) return IS_INCLUDES || index || 0;
	        }
	      }return !IS_INCLUDES && -1;
	  };
	};

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// 7.1.15 ToLength
	var toInteger = __webpack_require__(33),
	    min = Math.min;
	module.exports = function (it) {
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 33 */
/***/ function(module, exports) {

	"use strict";
	
	// 7.1.4 ToInteger
	var ceil = Math.ceil,
	    floor = Math.floor;
	module.exports = function (it) {
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var toInteger = __webpack_require__(33),
	    max = Math.max,
	    min = Math.min;
	module.exports = function (index, length) {
	  index = toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var shared = __webpack_require__(36)('keys'),
	    uid = __webpack_require__(21);
	module.exports = function (key) {
	  return shared[key] || (shared[key] = uid(key));
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var global = __webpack_require__(7),
	    SHARED = '__core-js_shared__',
	    store = global[SHARED] || (global[SHARED] = {});
	module.exports = function (key) {
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 37 */
/***/ function(module, exports) {

	'use strict';
	
	// IE 8- don't enum bug keys
	module.exports = 'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'.split(',');

/***/ },
/* 38 */
/***/ function(module, exports) {

	"use strict";
	
	exports.f = Object.getOwnPropertySymbols;

/***/ },
/* 39 */
/***/ function(module, exports) {

	"use strict";
	
	exports.f = {}.propertyIsEnumerable;

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(30);
	module.exports = function (it) {
	  return Object(defined(it));
	};

/***/ },
/* 41 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	var _global = global;
	var setTimeout = _global.setTimeout;
	var setTimeoutNative = _global.setTimeoutNative;
	
	
	var MSG = 'Use "global.setTimeout"  is unexpected, ' + 'please use require("@weex-module").setTimeout instead.';
	
	// fix no setTimeout on Android V8
	/* istanbul ignore if */
	if (typeof setTimeout === 'undefined' && typeof setTimeoutNative === 'function') {
	  (function () {
	    var timeoutMap = {};
	    var timeoutId = 0;
	    global.setTimeout = function (cb, time) {
	      console.warn(MSG);
	      timeoutMap[++timeoutId] = cb;
	      setTimeoutNative(timeoutId.toString(), time);
	    };
	    global.setTimeoutCallback = function (id) {
	      if (typeof timeoutMap[id] === 'function') {
	        timeoutMap[id]();
	        delete timeoutMap[id];
	      }
	    };
	  })();
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 42 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	var OriginPromise = global.Promise || function () {};
	var MSG = 'Using "Promise" is unexpected';
	
	var UnexpectedPromise = function UnexpectedPromise() {
	  console.warn(MSG);
	
	  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	    args[_key] = arguments[_key];
	  }
	
	  return new (Function.prototype.bind.apply(OriginPromise, [null].concat(args)))();
	};
	
	var fn = ['all', 'race', 'resolve', 'reject'];
	fn.forEach(function (n) {
	  UnexpectedPromise[n] = function () {
	    console.warn(MSG);
	    return OriginPromise[n] && OriginPromise[n].apply(OriginPromise, arguments);
	  };
	});
	
	global.Promise = UnexpectedPromise;
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 43 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	var _global = global;
	var console = _global.console;
	var nativeLog = _global.nativeLog;
	
	var LEVELS = ['error', 'warn', 'info', 'log', 'debug'];
	var levelMap = {};
	
	generateLevelMap();
	
	/* istanbul ignore if */
	if (typeof console === 'undefined' || // Android
	global.WXEnvironment && global.WXEnvironment.platform === 'iOS' // iOS
	) {
	    global.console = {
	      debug: function debug() {
	        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	          args[_key] = arguments[_key];
	        }
	
	        if (checkLevel('debug')) {
	          nativeLog.apply(undefined, _toConsumableArray(format(args)).concat(['__DEBUG']));
	        }
	      },
	      log: function log() {
	        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	          args[_key2] = arguments[_key2];
	        }
	
	        if (checkLevel('log')) {
	          nativeLog.apply(undefined, _toConsumableArray(format(args)).concat(['__LOG']));
	        }
	      },
	      info: function info() {
	        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	          args[_key3] = arguments[_key3];
	        }
	
	        if (checkLevel('info')) {
	          nativeLog.apply(undefined, _toConsumableArray(format(args)).concat(['__INFO']));
	        }
	      },
	      warn: function warn() {
	        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	          args[_key4] = arguments[_key4];
	        }
	
	        if (checkLevel('warn')) {
	          nativeLog.apply(undefined, _toConsumableArray(format(args)).concat(['__WARN']));
	        }
	      },
	      error: function error() {
	        for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
	          args[_key5] = arguments[_key5];
	        }
	
	        if (checkLevel('error')) {
	          nativeLog.apply(undefined, _toConsumableArray(format(args)).concat(['__ERROR']));
	        }
	      }
	    };
	  } else {
	  // HTML5
	  var debug = console.debug;
	  var log = console.log;
	  var info = console.info;
	  var warn = console.warn;
	  var error = console.error;
	
	  console.__ori__ = { debug: debug, log: log, info: info, warn: warn, error: error };
	  console.debug = function () {
	    for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
	      args[_key6] = arguments[_key6];
	    }
	
	    if (checkLevel('debug')) {
	      console.__ori__.debug.apply(console, args);
	    }
	  };
	  console.log = function () {
	    for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
	      args[_key7] = arguments[_key7];
	    }
	
	    if (checkLevel('log')) {
	      console.__ori__.log.apply(console, args);
	    }
	  };
	  console.info = function () {
	    for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
	      args[_key8] = arguments[_key8];
	    }
	
	    if (checkLevel('info')) {
	      console.__ori__.info.apply(console, args);
	    }
	  };
	  console.warn = function () {
	    for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
	      args[_key9] = arguments[_key9];
	    }
	
	    if (checkLevel('warn')) {
	      console.__ori__.warn.apply(console, args);
	    }
	  };
	  console.error = function () {
	    for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
	      args[_key10] = arguments[_key10];
	    }
	
	    if (checkLevel('error')) {
	      console.__ori__.error.apply(console, args);
	    }
	  };
	}
	
	function generateLevelMap() {
	  LEVELS.forEach(function (level) {
	    var levelIndex = LEVELS.indexOf(level);
	    levelMap[level] = {};
	    LEVELS.forEach(function (type) {
	      var typeIndex = LEVELS.indexOf(type);
	      if (typeIndex <= levelIndex) {
	        levelMap[level][type] = true;
	      }
	    });
	  });
	}
	
	function normalize(v) {
	  var type = Object.prototype.toString.call(v);
	  if (type.toLowerCase() === '[object object]') {
	    v = JSON.stringify(v);
	  } else {
	    v = String(v);
	  }
	  return v;
	}
	
	function checkLevel(type) {
	  var logLevel = global.WXEnvironment && global.WXEnvironment.logLevel || 'log';
	  return levelMap[logLevel] && levelMap[logLevel][type];
	}
	
	function format(args) {
	  return args.map(function (v) {
	    return normalize(v);
	  });
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.createInstance = createInstance;
	
	var _frameworks = __webpack_require__(45);
	
	var _frameworks2 = _interopRequireDefault(_frameworks);
	
	var _vdom = __webpack_require__(67);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var config = {
	  Document: _vdom.Document, Element: _vdom.Element, Comment: _vdom.Comment,
	  sendTasks: function sendTasks() {
	    var _global;
	
	    (_global = global).callNative.apply(_global, arguments);
	  }
	};
	
	for (var name in _frameworks2.default) {
	  var framework = _frameworks2.default[name];
	  framework.init(config);
	}
	
	var versionRegExp = /^\/\/ *(\{[^\}]*\}) *\r?\n/;
	
	function checkVersion(code) {
	  var info = void 0;
	  var result = versionRegExp.exec(code);
	  if (result) {
	    try {
	      info = JSON.parse(result[1]);
	    } catch (e) {}
	  }
	  return info;
	}
	
	var instanceMap = {};
	
	function createInstance(id, code, config, data) {
	  var info = instanceMap[id];
	  if (!info) {
	    info = checkVersion(code) || {};
	    if (!_frameworks2.default[info.framework]) {
	      info.framework = 'Weex';
	    }
	    instanceMap[id] = info;
	    config = config || {};
	    config.bundleVersion = info.version;
	    return _frameworks2.default[info.framework].createInstance(id, code, config, data);
	  }
	  return new Error('invalid instance id "' + id + '"');
	}
	
	var methods = {
	  createInstance: createInstance
	};
	
	function genInit(methodName) {
	  methods[methodName] = function () {
	    for (var _name in _frameworks2.default) {
	      var _framework = _frameworks2.default[_name];
	      if (_framework && _framework[methodName]) {
	        _framework[methodName].apply(_framework, arguments);
	      }
	    }
	  };
	}
	
	['registerComponents', 'registerModules', 'registerMethods'].forEach(genInit);
	
	function genInstance(methodName) {
	  methods[methodName] = function () {
	    var id = arguments.length <= 0 ? undefined : arguments[0];
	    var info = instanceMap[id];
	    if (info && _frameworks2.default[info.framework]) {
	      var _frameworks$info$fram;
	
	      return (_frameworks$info$fram = _frameworks2.default[info.framework])[methodName].apply(_frameworks$info$fram, arguments);
	    }
	    return new Error('invalid instance id "' + id + '"');
	  };
	}
	
	['destroyInstance', 'refreshInstance', 'callJS', 'getRoot'].forEach(genInstance);
	
	methods.receiveTasks = methods.callJS;
	
	exports.default = methods;
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _default = __webpack_require__(46);
	
	var Weex = _interopRequireWildcard(_default);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	exports.default = {
	  Weex: Weex
	};

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /**
	                                                                                                                                                                                                                                                   * @fileOverview Main entry, instance manager
	                                                                                                                                                                                                                                                   *
	                                                                                                                                                                                                                                                   * - createInstance(instanceId, code, options, data)
	                                                                                                                                                                                                                                                   * - refreshInstance(instanceId, data)
	                                                                                                                                                                                                                                                   * - destroyInstance(instanceId)
	                                                                                                                                                                                                                                                   * - registerComponents(components)
	                                                                                                                                                                                                                                                   * - registerModules(modules)
	                                                                                                                                                                                                                                                   * - getRoot(instanceId)
	                                                                                                                                                                                                                                                   * - instanceMap
	                                                                                                                                                                                                                                                   * - callJS(instanceId, tasks)
	                                                                                                                                                                                                                                                   *   - fireEvent(ref, type, data)
	                                                                                                                                                                                                                                                   *   - callback(funcId, data)
	                                                                                                                                                                                                                                                   */
	
	exports.init = init;
	exports.createInstance = createInstance;
	exports.refreshInstance = refreshInstance;
	exports.destroyInstance = destroyInstance;
	exports.registerComponents = registerComponents;
	exports.registerModules = registerModules;
	exports.registerMethods = registerMethods;
	exports.getRoot = getRoot;
	exports.callJS = callJS;
	
	var _config = __webpack_require__(47);
	
	var _config2 = _interopRequireDefault(_config);
	
	var _app = __webpack_require__(48);
	
	var _app2 = _interopRequireDefault(_app);
	
	var _vm = __webpack_require__(53);
	
	var _vm2 = _interopRequireDefault(_vm);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	var nativeComponentMap = _config2.default.nativeComponentMap;
	
	var instanceMap = {};
	
	function init(cfg) {
	  _config2.default.Document = cfg.Document;
	  _config2.default.Element = cfg.Element;
	  _config2.default.Comment = cfg.Comment;
	  _config2.default.sendTasks = cfg.sendTasks;
	}
	
	/**
	 * create a Weex instance
	 *
	 * @param  {string} instanceId
	 * @param  {string} code
	 * @param  {object} [options] option `HAS_LOG` enable print log
	 * @param  {object} [data]
	 */
	function createInstance(instanceId, code, options, data) {
	  var instance = instanceMap[instanceId];
	  options = options || {};
	
	  _config2.default.debug = options.debug;
	
	  var result = void 0;
	  if (!instance) {
	    instance = new _app2.default(instanceId, options);
	    instanceMap[instanceId] = instance;
	    result = instance.init(code, data);
	  } else {
	    result = new Error('invalid instance id "' + instanceId + '"');
	  }
	
	  return result;
	}
	
	/**
	 * refresh a Weex instance
	 *
	 * @param  {string} instanceId
	 * @param  {object} data
	 */
	function refreshInstance(instanceId, data) {
	  var instance = instanceMap[instanceId];
	  var result = void 0;
	  if (instance) {
	    result = instance.refreshData(data);
	  } else {
	    result = new Error('invalid instance id "' + instanceId + '"');
	  }
	  return result;
	}
	
	/**
	 * destroy a Weex instance
	 * @param  {string} instanceId
	 */
	function destroyInstance(instanceId) {
	  var instance = instanceMap[instanceId];
	  if (!instance) {
	    return new Error('invalid instance id "' + instanceId + '"');
	  }
	
	  instance.destroy();
	  delete instanceMap[instanceId];
	  return instanceMap;
	}
	
	/**
	 * register the name of each native component
	 * @param  {array} components array of name
	 */
	function registerComponents(components) {
	  if (Array.isArray(components)) {
	    components.forEach(function register(name) {
	      /* istanbul ignore if */
	      if (!name) {
	        return;
	      }
	      if (typeof name === 'string') {
	        nativeComponentMap[name] = true;
	      } else if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object' && typeof name.type === 'string') {
	        nativeComponentMap[name.type] = name;
	      }
	    });
	  }
	}
	
	/**
	 * register the name and methods of each module
	 * @param  {object} modules a object of modules
	 */
	function registerModules(modules) {
	  if ((typeof modules === 'undefined' ? 'undefined' : _typeof(modules)) === 'object') {
	    _vm2.default.registerModules(modules);
	  }
	}
	
	/**
	 * register the name and methods of each api
	 * @param  {object} apis a object of apis
	 */
	function registerMethods(apis) {
	  if ((typeof apis === 'undefined' ? 'undefined' : _typeof(apis)) === 'object') {
	    _vm2.default.registerMethods(apis);
	  }
	}
	
	/**
	 * get a whole element tree of an instance
	 * for debugging
	 * @param  {string} instanceId
	 * @return {object} a virtual dom tree
	 */
	function getRoot(instanceId) {
	  var instance = instanceMap[instanceId];
	  var result = void 0;
	  if (instance) {
	    result = instance.getRootElement();
	  } else {
	    result = new Error('invalid instance id "' + instanceId + '"');
	  }
	  return result;
	}
	
	var jsHandlers = {
	  fireEvent: function fireEvent(instanceId, ref, type, data, domChanges) {
	    var instance = instanceMap[instanceId];
	    return instance.fireEvent(ref, type, data, domChanges);
	  },
	
	  callback: function callback(instanceId, funcId, data, ifLast) {
	    var instance = instanceMap[instanceId];
	    return instance.callback(funcId, data, ifLast);
	  }
	};
	
	/**
	 * accept calls from native (event or callback)
	 *
	 * @param  {string} instanceId
	 * @param  {array} tasks list with `method` and `args`
	 */
	function callJS(instanceId, tasks) {
	  var instance = instanceMap[instanceId];
	  if (instance && Array.isArray(tasks)) {
	    var _ret = function () {
	      var results = [];
	      tasks.forEach(function (task) {
	        var handler = jsHandlers[task.method];
	        var args = [].concat(_toConsumableArray(task.args));
	        if (typeof handler === 'function') {
	          args.unshift(instanceId);
	          results.push(handler.apply(undefined, _toConsumableArray(args)));
	        }
	      });
	      return {
	        v: results
	      };
	    }();
	
	    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	  }
	  return new Error('invalid instance id "' + instanceId + '" or tasks');
	}

/***/ },
/* 47 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = {
	  nativeComponentMap: {
	    text: true,
	    image: true,
	    container: true,
	    slider: {
	      type: 'slider',
	      append: 'tree'
	    },
	    cell: {
	      type: 'cell',
	      append: 'tree'
	    }
	  },
	  customComponentMap: {},
	  debug: false
	};

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = AppInstance;
	
	var _util = __webpack_require__(49);
	
	var _bundle = __webpack_require__(50);
	
	var bundle = _interopRequireWildcard(_bundle);
	
	var _ctrl = __webpack_require__(65);
	
	var ctrl = _interopRequireWildcard(_ctrl);
	
	var _differ = __webpack_require__(66);
	
	var _differ2 = _interopRequireDefault(_differ);
	
	var _config = __webpack_require__(47);
	
	var _config2 = _interopRequireDefault(_config);
	
	var _register = __webpack_require__(63);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	/**
	 * @fileOverview
	 * Weex instance constructor & definition
	 */
	
	function AppInstance(instanceId, options) {
	  this.id = instanceId;
	  this.options = options || {};
	  this.vm = null;
	  this.customComponentMap = {};
	  this.callbacks = {};
	  this.doc = new _config2.default.Document(instanceId, this.options.bundleUrl);
	  this.differ = new _differ2.default(instanceId);
	  this.uid = 0;
	}
	
	function normalize(app, v) {
	  var type = (0, _util.typof)(v);
	
	  switch (type) {
	    case 'undefined':
	    case 'null':
	      return '';
	    case 'regexp':
	      return v.toString();
	    case 'date':
	      return v.toISOString();
	    case 'number':
	    case 'string':
	    case 'boolean':
	    case 'array':
	    case 'object':
	      if (v instanceof _config2.default.Element) {
	        return v.ref;
	      }
	      return v;
	    case 'function':
	      app.callbacks[++app.uid] = v;
	      return app.uid.toString();
	    default:
	      return JSON.stringify(v);
	  }
	}
	
	AppInstance.prototype.callTasks = function (tasks) {
	  var _this = this;
	
	  if ((0, _util.typof)(tasks) !== 'array') {
	    tasks = [tasks];
	  }
	
	  tasks.forEach(function (task) {
	    task.args = task.args.map(function (arg) {
	      return normalize(_this, arg);
	    });
	  });
	
	  _config2.default.sendTasks(this.id, tasks, '-1');
	};
	
	(0, _util.extend)(AppInstance.prototype, bundle, ctrl, {
	  registerComponent: _register.registerComponent,
	  requireComponent: _register.requireComponent,
	  requireModule: _register.requireModule
	});

/***/ },
/* 49 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	exports.isReserved = isReserved;
	exports.def = def;
	exports.remove = remove;
	exports.hasOwn = hasOwn;
	exports.cached = cached;
	exports.bind = bind;
	exports.toArray = toArray;
	exports.extend = extend;
	exports.isObject = isObject;
	exports.isPlainObject = isPlainObject;
	exports.stringify = stringify;
	exports.typof = typof;
	exports.normalize = normalize;
	exports.error = error;
	exports.warn = warn;
	exports.info = info;
	exports.debug = debug;
	exports.log = log;
	/* global MutationObserver */
	
	// / lang.js
	
	/**
	 * Check if a string starts with $ or _
	 *
	 * @param {String} str
	 * @return {Boolean}
	 */
	
	function isReserved(str) {
	  var c = (str + '').charCodeAt(0);
	  return c === 0x24 || c === 0x5F;
	}
	
	/**
	 * Define a property.
	 *
	 * @param {Object} obj
	 * @param {String} key
	 * @param {*} val
	 * @param {Boolean} [enumerable]
	 */
	
	function def(obj, key, val, enumerable) {
	  Object.defineProperty(obj, key, {
	    value: val,
	    enumerable: !!enumerable,
	    writable: true,
	    configurable: true
	  });
	}
	
	// / env.js
	
	// can we use __proto__?
	var hasProto = exports.hasProto = '__proto__' in {};
	
	// Browser environment sniffing
	var inBrowser = exports.inBrowser = typeof window !== 'undefined' && Object.prototype.toString.call(window) !== '[object Object]';
	
	// detect devtools
	var devtools = exports.devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
	
	// UA sniffing for working around browser-specific quirks
	var UA = inBrowser && window.navigator.userAgent.toLowerCase();
	var isIos = UA && /(iphone|ipad|ipod|ios)/i.test(UA);
	var isWechat = UA && UA.indexOf('micromessenger') > 0;
	
	/**
	 * Defer a task to execute it asynchronously. Ideally this
	 * should be executed as a microtask, so we leverage
	 * MutationObserver if it's available, and fallback to
	 * setTimeout(0).
	 *
	 * @param {Function} cb
	 * @param {Object} ctx
	 */
	
	var nextTick = exports.nextTick = function () {
	  var callbacks = [];
	  var pending = false;
	  var timerFunc = void 0;
	  function nextTickHandler() {
	    pending = false;
	    var copies = callbacks.slice(0);
	    callbacks = [];
	    for (var i = 0; i < copies.length; i++) {
	      copies[i]();
	    }
	  }
	
	  /* istanbul ignore if */
	  if (typeof MutationObserver !== 'undefined' && !(isWechat && isIos)) {
	    (function () {
	      var counter = 1;
	      var observer = new MutationObserver(nextTickHandler);
	      var textNode = document.createTextNode(counter);
	      observer.observe(textNode, {
	        characterData: true
	      });
	      timerFunc = function timerFunc() {
	        counter = (counter + 1) % 2;
	        textNode.data = counter;
	      };
	    })();
	  } else {
	    // webpack attempts to inject a shim for setImmediate
	    // if it is used as a global, so we have to work around that to
	    // avoid bundling unnecessary code.
	    var context = inBrowser ? window : typeof global !== 'undefined' ? global : {};
	    timerFunc = context.setImmediate || setTimeout;
	  }
	  return function (cb, ctx) {
	    var func = ctx ? function () {
	      cb.call(ctx);
	    } : cb;
	    callbacks.push(func);
	    if (pending) return;
	    pending = true;
	    timerFunc(nextTickHandler, 0);
	  };
	}();
	
	var _Set = void 0;
	/* istanbul ignore if */
	if (typeof Set !== 'undefined' && Set.toString().match(/native code/)) {
	  // use native Set when available.
	  exports._Set = _Set = Set;
	} else {
	  // a non-standard Set polyfill that only works with primitive keys.
	  exports._Set = _Set = function _Set() {
	    this.set = Object.create(null);
	  };
	  _Set.prototype.has = function (key) {
	    return this.set[key] !== undefined;
	  };
	  _Set.prototype.add = function (key) {
	    this.set[key] = 1;
	  };
	  _Set.prototype.clear = function () {
	    this.set = Object.create(null);
	  };
	}
	
	exports._Set = _Set;
	
	// / shared
	
	/**
	 * Remove an item from an array
	 *
	 * @param {Array} arr
	 * @param {*} item
	 */
	
	function remove(arr, item) {
	  if (arr.length) {
	    var index = arr.indexOf(item);
	    if (index > -1) {
	      return arr.splice(index, 1);
	    }
	  }
	}
	
	/**
	 * Check whether the object has the property.
	 *
	 * @param {Object} obj
	 * @param {String} key
	 * @return {Boolean}
	 */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function hasOwn(obj, key) {
	  return hasOwnProperty.call(obj, key);
	}
	
	/**
	 * Create a cached version of a pure function.
	 *
	 * @param {Function} fn
	 * @return {Function}
	 */
	
	function cached(fn) {
	  var cache = Object.create(null);
	  return function cachedFn(str) {
	    var hit = cache[str];
	    return hit || (cache[str] = fn(str));
	  };
	}
	
	/**
	 * Camelize a hyphen-delmited string.
	 *
	 * @param {String} str
	 * @return {String}
	 */
	
	var camelizeRE = /-(\w)/g;
	var camelize = exports.camelize = cached(function (str) {
	  return str.replace(camelizeRE, toUpper);
	});
	
	function toUpper(_, c) {
	  return c ? c.toUpperCase() : '';
	}
	
	/**
	 * Hyphenate a camelCase string.
	 *
	 * @param {String} str
	 * @return {String}
	 */
	
	var hyphenateRE = /([a-z\d])([A-Z])/g;
	var hyphenate = exports.hyphenate = cached(function (str) {
	  return str.replace(hyphenateRE, '$1-$2').toLowerCase();
	});
	
	/**
	 * Simple bind, faster than native
	 *
	 * @param {Function} fn
	 * @param {Object} ctx
	 * @return {Function}
	 */
	
	function bind(fn, ctx) {
	  return function (a) {
	    var l = arguments.length;
	    return l ? l > 1 ? fn.apply(ctx, arguments) : fn.call(ctx, a) : fn.call(ctx);
	  };
	}
	
	/**
	 * Convert an Array-like object to a real Array.
	 *
	 * @param {Array-like} list
	 * @param {Number} [start] - start index
	 * @return {Array}
	 */
	
	function toArray(list, start) {
	  start = start || 0;
	  var i = list.length - start;
	  var ret = new Array(i);
	  while (i--) {
	    ret[i] = list[i + start];
	  }
	  return ret;
	}
	
	/**
	 * Mix properties into target object.
	 *
	 * @param {Object} to
	 * @param {Object} from
	 */
	
	function extend(target) {
	  for (var _len = arguments.length, src = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	    src[_key - 1] = arguments[_key];
	  }
	
	  if (typeof Object.assign === 'function') {
	    Object.assign.apply(Object, [target].concat(src));
	  } else {
	    var first = src.shift();
	    for (var key in first) {
	      target[key] = first[key];
	    }
	    if (src.length) {
	      extend.apply(undefined, [target].concat(src));
	    }
	  }
	  return target;
	}
	
	/**
	 * Quick object check - this is primarily used to tell
	 * Objects from primitive values when we know the value
	 * is a JSON-compliant type.
	 *
	 * @param {*} obj
	 * @return {Boolean}
	 */
	
	function isObject(obj) {
	  return obj !== null && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
	}
	
	/**
	 * Strict object type check. Only returns true
	 * for plain JavaScript objects.
	 *
	 * @param {*} obj
	 * @return {Boolean}
	 */
	
	var toString = Object.prototype.toString;
	var OBJECT_STRING = '[object Object]';
	function isPlainObject(obj) {
	  return toString.call(obj) === OBJECT_STRING;
	}
	
	/**
	 * Array type check.
	 *
	 * @param {*} obj
	 * @return {Boolean}
	 */
	
	var isArray = exports.isArray = Array.isArray;
	
	// / other
	
	function stringify(x) {
	  return typeof x === 'undefined' || x === null || typeof x === 'function' ? '' : (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object' ? x instanceof RegExp ? x.toString() : x instanceof Date ? JSON.parse(JSON.stringify(x)) : JSON.stringify(x) : x.toString();
	}
	
	function typof(v) {
	  var s = Object.prototype.toString.call(v);
	  return s.substring(8, s.length - 1).toLowerCase();
	}
	
	function normalize(v) {
	  var type = typof(v);
	
	  switch (type) {
	    case 'undefined':
	    case 'null':
	      return '';
	    case 'regexp':
	      return v.toString();
	    case 'date':
	      return v.toISOString();
	    case 'number':
	    case 'string':
	    case 'boolean':
	    case 'array':
	    case 'object':
	    case 'function':
	      return v;
	  }
	}
	
	var enableLog = typeof console !== 'undefined' && global.IS_PRODUCT !== true;
	
	/**
	 * @param {String} msg
	 */
	function error() {
	  var _console;
	
	  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	    args[_key2] = arguments[_key2];
	  }
	
	  enableLog && console.error && (_console = console).error.apply(_console, ['[JS Framework]'].concat(args));
	}
	
	/**
	 * @param {String} msg
	 */
	function warn() {
	  var _console2;
	
	  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	    args[_key3] = arguments[_key3];
	  }
	
	  enableLog && console.warn && (_console2 = console).warn.apply(_console2, ['[JS Framework]'].concat(args));
	}
	
	/**
	 * @param {String} msg
	 */
	function info() {
	  var _console3;
	
	  for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	    args[_key4] = arguments[_key4];
	  }
	
	  enableLog && console.info && (_console3 = console).info.apply(_console3, ['[JS Framework]'].concat(args));
	}
	
	/**
	 * @param {String} msg
	 */
	function debug() {
	  var _console4;
	
	  for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
	    args[_key5] = arguments[_key5];
	  }
	
	  enableLog && console.debug && (_console4 = console).debug.apply(_console4, ['[JS Framework]'].concat(args));
	}
	
	/**
	 * @param {String} msg
	 */
	function log() {
	  var _console5;
	
	  for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
	    args[_key6] = arguments[_key6];
	  }
	
	  enableLog && console.log && (_console5 = console).log.apply(_console5, ['[JS Framework]'].concat(args));
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.require = exports.define = undefined;
	exports.clearCommonModules = clearCommonModules;
	exports.bootstrap = bootstrap;
	exports.register = register;
	exports.render = render;
	
	var _semver = __webpack_require__(51);
	
	var _semver2 = _interopRequireDefault(_semver);
	
	var _util = __webpack_require__(49);
	
	var _ = _interopRequireWildcard(_util);
	
	var _vm = __webpack_require__(53);
	
	var _vm2 = _interopRequireDefault(_vm);
	
	var _downgrade = __webpack_require__(64);
	
	var downgrade = _interopRequireWildcard(_downgrade);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
	                                                                                                                                                                                                                   * @fileOverview
	                                                                                                                                                                                                                   * api that invoked by js bundle code
	                                                                                                                                                                                                                   *
	                                                                                                                                                                                                                   * - define(name, factory): define a new composed component type
	                                                                                                                                                                                                                   * - bootstrap(type, config, data): require a certain type &
	                                                                                                                                                                                                                   *         render with (optional) data
	                                                                                                                                                                                                                   *
	                                                                                                                                                                                                                   * deprecated:
	                                                                                                                                                                                                                   * - register(type, options): register a new composed component type
	                                                                                                                                                                                                                   * - render(type, data): render by a certain type with (optional) data
	                                                                                                                                                                                                                   * - require(type)(data): require a type then render with data
	                                                                                                                                                                                                                   */
	
	var WEEX_COMPONENT_REG = /^@weex-component\//;
	var WEEX_MODULE_REG = /^@weex-module\//;
	var NORMAL_MODULE_REG = /^\.{1,2}\//;
	var JS_SURFIX_REG = /\.js$/;
	
	var isWeexComponent = function isWeexComponent(name) {
	  return !!name.match(WEEX_COMPONENT_REG);
	};
	var isWeexModule = function isWeexModule(name) {
	  return !!name.match(WEEX_MODULE_REG);
	};
	var isNormalModule = function isNormalModule(name) {
	  return !!name.match(NORMAL_MODULE_REG);
	};
	var isNpmModule = function isNpmModule(name) {
	  return !isWeexComponent(name) && !isWeexModule(name) && !isNormalModule(name);
	};
	
	function removeWeexPrefix(str) {
	  return str.replace(WEEX_COMPONENT_REG, '').replace(WEEX_MODULE_REG, '');
	}
	
	function removeJSSurfix(str) {
	  return str.replace(JS_SURFIX_REG, '');
	}
	
	var commonModules = {};
	
	function clearCommonModules() {
	  commonModules = {};
	}
	
	// define(name, factory) for primary usage
	// or
	// define(name, deps, factory) for compatibility
	// Notice: DO NOT use function define() {},
	// it will cause error after builded by webpack
	var define = exports.define = function define(name, deps, factory) {
	  var _this = this;
	
	  _.debug('define a component', name);
	
	  if (_.typof(deps) === 'function') {
	    factory = deps;
	    deps = [];
	  }
	
	  var _require = function _require(name) {
	    var cleanName = void 0;
	
	    if (isWeexComponent(name)) {
	      cleanName = removeWeexPrefix(name);
	      return _this.requireComponent(cleanName);
	    }
	    if (isWeexModule(name)) {
	      cleanName = removeWeexPrefix(name);
	      return _this.requireModule(cleanName);
	    }
	    if (isNormalModule(name)) {
	      cleanName = removeJSSurfix(name);
	      return commonModules[name];
	    }
	    if (isNpmModule(name)) {
	      cleanName = removeJSSurfix(name);
	      return commonModules[name];
	    }
	  };
	  var _module = { exports: {} };
	
	  var cleanName = void 0;
	  if (isWeexComponent(name)) {
	    cleanName = removeWeexPrefix(name);
	
	    factory(_require, _module.exports, _module);
	
	    this.registerComponent(cleanName, _module.exports);
	  } else if (isWeexModule(name)) {
	    cleanName = removeWeexPrefix(name);
	
	    factory(_require, _module.exports, _module);
	
	    _vm2.default.registerModules(_defineProperty({}, cleanName, _module.exports));
	  } else if (isNormalModule(name)) {
	    cleanName = removeJSSurfix(name);
	
	    factory(_require, _module.exports, _module);
	
	    commonModules[cleanName] = _module.exports;
	  } else if (isNpmModule(name)) {
	    cleanName = removeJSSurfix(name);
	
	    factory(_require, _module.exports, _module);
	
	    var exports = _module.exports;
	    if (exports.template || exports.style || exports.methods) {
	      // downgrade to old define method (define('componentName', factory))
	      // the exports contain one key of template, style or methods
	      // but it has risk!!!
	      this.registerComponent(cleanName, exports);
	    } else {
	      commonModules[cleanName] = _module.exports;
	    }
	  }
	};
	
	function bootstrap(name, config, data) {
	  _.debug('bootstrap for ' + name);
	
	  var cleanName = void 0;
	
	  if (isWeexComponent(name)) {
	    cleanName = removeWeexPrefix(name);
	  } else if (isNpmModule(name)) {
	    cleanName = removeJSSurfix(name);
	    // check if define by old 'define' method
	    /* istanbul ignore if */
	    if (!this.customComponentMap[cleanName]) {
	      return new Error('It\'s not a component: ' + name);
	    }
	  } else {
	    return new Error('Wrong component name: ' + name);
	  }
	
	  config = _.isPlainObject(config) ? config : {};
	
	  if (typeof config.transformerVersion === 'string' && typeof global.needTransformerVersion === 'string' && !_semver2.default.satisfies(config.transformerVersion, global.needTransformerVersion)) {
	    return new Error('JS Bundle version: ' + config.transformerVersion + ' ' + ('not compatible with ' + global.needTransformerVersion));
	  }
	
	  var _checkDowngrade = downgrade.check(config.downgrade);
	  /* istanbul ignore if */
	  if (_checkDowngrade.isDowngrade) {
	    this.callTasks([{
	      module: 'instanceWrap',
	      method: 'error',
	      args: [_checkDowngrade.errorType, _checkDowngrade.code, _checkDowngrade.errorMessage]
	    }]);
	    return new Error('Downgrade[' + _checkDowngrade.code + ']: ' + _checkDowngrade.errorMessage);
	  }
	
	  this.vm = new _vm2.default(cleanName, null, { _app: this }, null, data);
	}
	
	/**
	 * @deprecated
	 */
	function register(type, options) {
	  _.warn('Register is deprecated, please install lastest transformer.');
	  this.registerComponent(type, options);
	}
	
	/**
	 * @deprecated
	 */
	function render(type, data) {
	  _.warn('Render is deprecated, please install lastest transformer.');
	  return this.bootstrap(type, {}, data);
	}
	
	/**
	 * @deprecated
	 */
	function _require2(type) {
	  var _this2 = this;
	
	  _.warn('Require is deprecated, please install lastest transformer.');
	  return function (data) {
	    return _this2.bootstrap(type, {}, data);
	  };
	}
	exports.require = _require2;
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	exports = module.exports = SemVer;
	
	// The debug function is excluded entirely from the minified version.
	/* nomin */var debug;
	/* nomin */if ((typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' &&
	/* nomin */process.env &&
	/* nomin */process.env.NODE_DEBUG &&
	/* nomin *//\bsemver\b/i.test(process.env.NODE_DEBUG))
	  /* nomin */debug = function debug() {
	    /* nomin */var args = Array.prototype.slice.call(arguments, 0);
	    /* nomin */args.unshift('SEMVER');
	    /* nomin */console.log.apply(console, args);
	    /* nomin */
	  };
	  /* nomin */else
	  /* nomin */debug = function debug() {};
	
	// Note: this is the semver.org version of the spec that it implements
	// Not necessarily the package version of this code.
	exports.SEMVER_SPEC_VERSION = '2.0.0';
	
	var MAX_LENGTH = 256;
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
	
	// The actual regexps go on exports.re
	var re = exports.re = [];
	var src = exports.src = [];
	var R = 0;
	
	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.
	
	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.
	
	var NUMERICIDENTIFIER = R++;
	src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
	var NUMERICIDENTIFIERLOOSE = R++;
	src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';
	
	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.
	
	var NONNUMERICIDENTIFIER = R++;
	src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';
	
	// ## Main Version
	// Three dot-separated numeric identifiers.
	
	var MAINVERSION = R++;
	src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' + '(' + src[NUMERICIDENTIFIER] + ')\\.' + '(' + src[NUMERICIDENTIFIER] + ')';
	
	var MAINVERSIONLOOSE = R++;
	src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' + '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' + '(' + src[NUMERICIDENTIFIERLOOSE] + ')';
	
	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.
	
	var PRERELEASEIDENTIFIER = R++;
	src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] + '|' + src[NONNUMERICIDENTIFIER] + ')';
	
	var PRERELEASEIDENTIFIERLOOSE = R++;
	src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] + '|' + src[NONNUMERICIDENTIFIER] + ')';
	
	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.
	
	var PRERELEASE = R++;
	src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] + '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';
	
	var PRERELEASELOOSE = R++;
	src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] + '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';
	
	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.
	
	var BUILDIDENTIFIER = R++;
	src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';
	
	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.
	
	var BUILD = R++;
	src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] + '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';
	
	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.
	
	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.
	
	var FULL = R++;
	var FULLPLAIN = 'v?' + src[MAINVERSION] + src[PRERELEASE] + '?' + src[BUILD] + '?';
	
	src[FULL] = '^' + FULLPLAIN + '$';
	
	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] + src[PRERELEASELOOSE] + '?' + src[BUILD] + '?';
	
	var LOOSE = R++;
	src[LOOSE] = '^' + LOOSEPLAIN + '$';
	
	var GTLT = R++;
	src[GTLT] = '((?:<|>)?=?)';
	
	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	var XRANGEIDENTIFIERLOOSE = R++;
	src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
	var XRANGEIDENTIFIER = R++;
	src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';
	
	var XRANGEPLAIN = R++;
	src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' + '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' + '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' + '(?:' + src[PRERELEASE] + ')?' + src[BUILD] + '?' + ')?)?';
	
	var XRANGEPLAINLOOSE = R++;
	src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' + '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' + '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' + '(?:' + src[PRERELEASELOOSE] + ')?' + src[BUILD] + '?' + ')?)?';
	
	var XRANGE = R++;
	src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
	var XRANGELOOSE = R++;
	src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';
	
	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	var LONETILDE = R++;
	src[LONETILDE] = '(?:~>?)';
	
	var TILDETRIM = R++;
	src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
	re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
	var tildeTrimReplace = '$1~';
	
	var TILDE = R++;
	src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
	var TILDELOOSE = R++;
	src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';
	
	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	var LONECARET = R++;
	src[LONECARET] = '(?:\\^)';
	
	var CARETTRIM = R++;
	src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
	re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
	var caretTrimReplace = '$1^';
	
	var CARET = R++;
	src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
	var CARETLOOSE = R++;
	src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';
	
	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	var COMPARATORLOOSE = R++;
	src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
	var COMPARATOR = R++;
	src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';
	
	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	var COMPARATORTRIM = R++;
	src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] + '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';
	
	// this one has to use the /g flag
	re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
	var comparatorTrimReplace = '$1$2$3';
	
	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	var HYPHENRANGE = R++;
	src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' + '\\s+-\\s+' + '(' + src[XRANGEPLAIN] + ')' + '\\s*$';
	
	var HYPHENRANGELOOSE = R++;
	src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' + '\\s+-\\s+' + '(' + src[XRANGEPLAINLOOSE] + ')' + '\\s*$';
	
	// Star ranges basically just allow anything at all.
	var STAR = R++;
	src[STAR] = '(<|>)?=?\\s*\\*';
	
	// Compile to actual regexp objects.
	// All are flag-free, unless they were created above with a flag.
	for (var i = 0; i < R; i++) {
	  debug(i, src[i]);
	  if (!re[i]) re[i] = new RegExp(src[i]);
	}
	
	exports.parse = parse;
	function parse(version, loose) {
	  if (version instanceof SemVer) return version;
	
	  if (typeof version !== 'string') return null;
	
	  if (version.length > MAX_LENGTH) return null;
	
	  var r = loose ? re[LOOSE] : re[FULL];
	  if (!r.test(version)) return null;
	
	  try {
	    return new SemVer(version, loose);
	  } catch (er) {
	    return null;
	  }
	}
	
	exports.valid = valid;
	function valid(version, loose) {
	  var v = parse(version, loose);
	  return v ? v.version : null;
	}
	
	exports.clean = clean;
	function clean(version, loose) {
	  var s = parse(version.trim().replace(/^[=v]+/, ''), loose);
	  return s ? s.version : null;
	}
	
	exports.SemVer = SemVer;
	
	function SemVer(version, loose) {
	  if (version instanceof SemVer) {
	    if (version.loose === loose) return version;else version = version.version;
	  } else if (typeof version !== 'string') {
	    throw new TypeError('Invalid Version: ' + version);
	  }
	
	  if (version.length > MAX_LENGTH) throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters');
	
	  if (!(this instanceof SemVer)) return new SemVer(version, loose);
	
	  debug('SemVer', version, loose);
	  this.loose = loose;
	  var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);
	
	  if (!m) throw new TypeError('Invalid Version: ' + version);
	
	  this.raw = version;
	
	  // these are actually numbers
	  this.major = +m[1];
	  this.minor = +m[2];
	  this.patch = +m[3];
	
	  if (this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError('Invalid major version');
	
	  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError('Invalid minor version');
	
	  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError('Invalid patch version');
	
	  // numberify any prerelease numeric ids
	  if (!m[4]) this.prerelease = [];else this.prerelease = m[4].split('.').map(function (id) {
	    if (/^[0-9]+$/.test(id)) {
	      var num = +id;
	      if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
	    }
	    return id;
	  });
	
	  this.build = m[5] ? m[5].split('.') : [];
	  this.format();
	}
	
	SemVer.prototype.format = function () {
	  this.version = this.major + '.' + this.minor + '.' + this.patch;
	  if (this.prerelease.length) this.version += '-' + this.prerelease.join('.');
	  return this.version;
	};
	
	SemVer.prototype.toString = function () {
	  return this.version;
	};
	
	SemVer.prototype.compare = function (other) {
	  debug('SemVer.compare', this.version, this.loose, other);
	  if (!(other instanceof SemVer)) other = new SemVer(other, this.loose);
	
	  return this.compareMain(other) || this.comparePre(other);
	};
	
	SemVer.prototype.compareMain = function (other) {
	  if (!(other instanceof SemVer)) other = new SemVer(other, this.loose);
	
	  return compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
	};
	
	SemVer.prototype.comparePre = function (other) {
	  if (!(other instanceof SemVer)) other = new SemVer(other, this.loose);
	
	  // NOT having a prerelease is > having one
	  if (this.prerelease.length && !other.prerelease.length) return -1;else if (!this.prerelease.length && other.prerelease.length) return 1;else if (!this.prerelease.length && !other.prerelease.length) return 0;
	
	  var i = 0;
	  do {
	    var a = this.prerelease[i];
	    var b = other.prerelease[i];
	    debug('prerelease compare', i, a, b);
	    if (a === undefined && b === undefined) return 0;else if (b === undefined) return 1;else if (a === undefined) return -1;else if (a === b) continue;else return compareIdentifiers(a, b);
	  } while (++i);
	};
	
	// preminor will bump the version up to the next minor release, and immediately
	// down to pre-release. premajor and prepatch work the same way.
	SemVer.prototype.inc = function (release, identifier) {
	  switch (release) {
	    case 'premajor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor = 0;
	      this.major++;
	      this.inc('pre', identifier);
	      break;
	    case 'preminor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor++;
	      this.inc('pre', identifier);
	      break;
	    case 'prepatch':
	      // If this is already a prerelease, it will bump to the next version
	      // drop any prereleases that might already exist, since they are not
	      // relevant at this point.
	      this.prerelease.length = 0;
	      this.inc('patch', identifier);
	      this.inc('pre', identifier);
	      break;
	    // If the input is a non-prerelease version, this acts the same as
	    // prepatch.
	    case 'prerelease':
	      if (this.prerelease.length === 0) this.inc('patch', identifier);
	      this.inc('pre', identifier);
	      break;
	
	    case 'major':
	      // If this is a pre-major version, bump up to the same major version.
	      // Otherwise increment major.
	      // 1.0.0-5 bumps to 1.0.0
	      // 1.1.0 bumps to 2.0.0
	      if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) this.major++;
	      this.minor = 0;
	      this.patch = 0;
	      this.prerelease = [];
	      break;
	    case 'minor':
	      // If this is a pre-minor version, bump up to the same minor version.
	      // Otherwise increment minor.
	      // 1.2.0-5 bumps to 1.2.0
	      // 1.2.1 bumps to 1.3.0
	      if (this.patch !== 0 || this.prerelease.length === 0) this.minor++;
	      this.patch = 0;
	      this.prerelease = [];
	      break;
	    case 'patch':
	      // If this is not a pre-release version, it will increment the patch.
	      // If it is a pre-release it will bump up to the same patch version.
	      // 1.2.0-5 patches to 1.2.0
	      // 1.2.0 patches to 1.2.1
	      if (this.prerelease.length === 0) this.patch++;
	      this.prerelease = [];
	      break;
	    // This probably shouldn't be used publicly.
	    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
	    case 'pre':
	      if (this.prerelease.length === 0) this.prerelease = [0];else {
	        var i = this.prerelease.length;
	        while (--i >= 0) {
	          if (typeof this.prerelease[i] === 'number') {
	            this.prerelease[i]++;
	            i = -2;
	          }
	        }
	        if (i === -1) // didn't increment anything
	          this.prerelease.push(0);
	      }
	      if (identifier) {
	        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
	        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
	        if (this.prerelease[0] === identifier) {
	          if (isNaN(this.prerelease[1])) this.prerelease = [identifier, 0];
	        } else this.prerelease = [identifier, 0];
	      }
	      break;
	
	    default:
	      throw new Error('invalid increment argument: ' + release);
	  }
	  this.format();
	  this.raw = this.version;
	  return this;
	};
	
	exports.inc = inc;
	function inc(version, release, loose, identifier) {
	  if (typeof loose === 'string') {
	    identifier = loose;
	    loose = undefined;
	  }
	
	  try {
	    return new SemVer(version, loose).inc(release, identifier).version;
	  } catch (er) {
	    return null;
	  }
	}
	
	exports.diff = diff;
	function diff(version1, version2) {
	  if (eq(version1, version2)) {
	    return null;
	  } else {
	    var v1 = parse(version1);
	    var v2 = parse(version2);
	    if (v1.prerelease.length || v2.prerelease.length) {
	      for (var key in v1) {
	        if (key === 'major' || key === 'minor' || key === 'patch') {
	          if (v1[key] !== v2[key]) {
	            return 'pre' + key;
	          }
	        }
	      }
	      return 'prerelease';
	    }
	    for (var key in v1) {
	      if (key === 'major' || key === 'minor' || key === 'patch') {
	        if (v1[key] !== v2[key]) {
	          return key;
	        }
	      }
	    }
	  }
	}
	
	exports.compareIdentifiers = compareIdentifiers;
	
	var numeric = /^[0-9]+$/;
	function compareIdentifiers(a, b) {
	  var anum = numeric.test(a);
	  var bnum = numeric.test(b);
	
	  if (anum && bnum) {
	    a = +a;
	    b = +b;
	  }
	
	  return anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : a > b ? 1 : 0;
	}
	
	exports.rcompareIdentifiers = rcompareIdentifiers;
	function rcompareIdentifiers(a, b) {
	  return compareIdentifiers(b, a);
	}
	
	exports.major = major;
	function major(a, loose) {
	  return new SemVer(a, loose).major;
	}
	
	exports.minor = minor;
	function minor(a, loose) {
	  return new SemVer(a, loose).minor;
	}
	
	exports.patch = patch;
	function patch(a, loose) {
	  return new SemVer(a, loose).patch;
	}
	
	exports.compare = compare;
	function compare(a, b, loose) {
	  return new SemVer(a, loose).compare(b);
	}
	
	exports.compareLoose = compareLoose;
	function compareLoose(a, b) {
	  return compare(a, b, true);
	}
	
	exports.rcompare = rcompare;
	function rcompare(a, b, loose) {
	  return compare(b, a, loose);
	}
	
	exports.sort = sort;
	function sort(list, loose) {
	  return list.sort(function (a, b) {
	    return exports.compare(a, b, loose);
	  });
	}
	
	exports.rsort = rsort;
	function rsort(list, loose) {
	  return list.sort(function (a, b) {
	    return exports.rcompare(a, b, loose);
	  });
	}
	
	exports.gt = gt;
	function gt(a, b, loose) {
	  return compare(a, b, loose) > 0;
	}
	
	exports.lt = lt;
	function lt(a, b, loose) {
	  return compare(a, b, loose) < 0;
	}
	
	exports.eq = eq;
	function eq(a, b, loose) {
	  return compare(a, b, loose) === 0;
	}
	
	exports.neq = neq;
	function neq(a, b, loose) {
	  return compare(a, b, loose) !== 0;
	}
	
	exports.gte = gte;
	function gte(a, b, loose) {
	  return compare(a, b, loose) >= 0;
	}
	
	exports.lte = lte;
	function lte(a, b, loose) {
	  return compare(a, b, loose) <= 0;
	}
	
	exports.cmp = cmp;
	function cmp(a, op, b, loose) {
	  var ret;
	  switch (op) {
	    case '===':
	      if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object') a = a.version;
	      if ((typeof b === 'undefined' ? 'undefined' : _typeof(b)) === 'object') b = b.version;
	      ret = a === b;
	      break;
	    case '!==':
	      if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object') a = a.version;
	      if ((typeof b === 'undefined' ? 'undefined' : _typeof(b)) === 'object') b = b.version;
	      ret = a !== b;
	      break;
	    case '':case '=':case '==':
	      ret = eq(a, b, loose);break;
	    case '!=':
	      ret = neq(a, b, loose);break;
	    case '>':
	      ret = gt(a, b, loose);break;
	    case '>=':
	      ret = gte(a, b, loose);break;
	    case '<':
	      ret = lt(a, b, loose);break;
	    case '<=':
	      ret = lte(a, b, loose);break;
	    default:
	      throw new TypeError('Invalid operator: ' + op);
	  }
	  return ret;
	}
	
	exports.Comparator = Comparator;
	function Comparator(comp, loose) {
	  if (comp instanceof Comparator) {
	    if (comp.loose === loose) return comp;else comp = comp.value;
	  }
	
	  if (!(this instanceof Comparator)) return new Comparator(comp, loose);
	
	  debug('comparator', comp, loose);
	  this.loose = loose;
	  this.parse(comp);
	
	  if (this.semver === ANY) this.value = '';else this.value = this.operator + this.semver.version;
	
	  debug('comp', this);
	}
	
	var ANY = {};
	Comparator.prototype.parse = function (comp) {
	  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
	  var m = comp.match(r);
	
	  if (!m) throw new TypeError('Invalid comparator: ' + comp);
	
	  this.operator = m[1];
	  if (this.operator === '=') this.operator = '';
	
	  // if it literally is just '>' or '' then allow anything.
	  if (!m[2]) this.semver = ANY;else this.semver = new SemVer(m[2], this.loose);
	};
	
	Comparator.prototype.toString = function () {
	  return this.value;
	};
	
	Comparator.prototype.test = function (version) {
	  debug('Comparator.test', version, this.loose);
	
	  if (this.semver === ANY) return true;
	
	  if (typeof version === 'string') version = new SemVer(version, this.loose);
	
	  return cmp(version, this.operator, this.semver, this.loose);
	};
	
	exports.Range = Range;
	function Range(range, loose) {
	  if (range instanceof Range && range.loose === loose) return range;
	
	  if (!(this instanceof Range)) return new Range(range, loose);
	
	  this.loose = loose;
	
	  // First, split based on boolean or ||
	  this.raw = range;
	  this.set = range.split(/\s*\|\|\s*/).map(function (range) {
	    return this.parseRange(range.trim());
	  }, this).filter(function (c) {
	    // throw out any that are not relevant for whatever reason
	    return c.length;
	  });
	
	  if (!this.set.length) {
	    throw new TypeError('Invalid SemVer Range: ' + range);
	  }
	
	  this.format();
	}
	
	Range.prototype.format = function () {
	  this.range = this.set.map(function (comps) {
	    return comps.join(' ').trim();
	  }).join('||').trim();
	  return this.range;
	};
	
	Range.prototype.toString = function () {
	  return this.range;
	};
	
	Range.prototype.parseRange = function (range) {
	  var loose = this.loose;
	  range = range.trim();
	  debug('range', range, loose);
	  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
	  range = range.replace(hr, hyphenReplace);
	  debug('hyphen replace', range);
	  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
	  debug('comparator trim', range, re[COMPARATORTRIM]);
	
	  // `~ 1.2.3` => `~1.2.3`
	  range = range.replace(re[TILDETRIM], tildeTrimReplace);
	
	  // `^ 1.2.3` => `^1.2.3`
	  range = range.replace(re[CARETTRIM], caretTrimReplace);
	
	  // normalize spaces
	  range = range.split(/\s+/).join(' ');
	
	  // At this point, the range is completely trimmed and
	  // ready to be split into comparators.
	
	  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
	  var set = range.split(' ').map(function (comp) {
	    return parseComparator(comp, loose);
	  }).join(' ').split(/\s+/);
	  if (this.loose) {
	    // in loose mode, throw out any that are not valid comparators
	    set = set.filter(function (comp) {
	      return !!comp.match(compRe);
	    });
	  }
	  set = set.map(function (comp) {
	    return new Comparator(comp, loose);
	  });
	
	  return set;
	};
	
	// Mostly just for testing and legacy API reasons
	exports.toComparators = toComparators;
	function toComparators(range, loose) {
	  return new Range(range, loose).set.map(function (comp) {
	    return comp.map(function (c) {
	      return c.value;
	    }).join(' ').trim().split(' ');
	  });
	}
	
	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	function parseComparator(comp, loose) {
	  debug('comp', comp);
	  comp = replaceCarets(comp, loose);
	  debug('caret', comp);
	  comp = replaceTildes(comp, loose);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, loose);
	  debug('xrange', comp);
	  comp = replaceStars(comp, loose);
	  debug('stars', comp);
	  return comp;
	}
	
	function isX(id) {
	  return !id || id.toLowerCase() === 'x' || id === '*';
	}
	
	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
	function replaceTildes(comp, loose) {
	  return comp.trim().split(/\s+/).map(function (comp) {
	    return replaceTilde(comp, loose);
	  }).join(' ');
	}
	
	function replaceTilde(comp, loose) {
	  var r = loose ? re[TILDELOOSE] : re[TILDE];
	  return comp.replace(r, function (_, M, m, p, pr) {
	    debug('tilde', comp, _, M, m, p, pr);
	    var ret;
	
	    if (isX(M)) ret = '';else if (isX(m)) ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';else if (isX(p))
	      // ~1.2 == >=1.2.0- <1.3.0-
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';else if (pr) {
	      debug('replaceTilde pr', pr);
	      if (pr.charAt(0) !== '-') pr = '-' + pr;
	      ret = '>=' + M + '.' + m + '.' + p + pr + ' <' + M + '.' + (+m + 1) + '.0';
	    } else
	      // ~1.2.3 == >=1.2.3 <1.3.0
	      ret = '>=' + M + '.' + m + '.' + p + ' <' + M + '.' + (+m + 1) + '.0';
	
	    debug('tilde return', ret);
	    return ret;
	  });
	}
	
	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
	// ^1.2.3 --> >=1.2.3 <2.0.0
	// ^1.2.0 --> >=1.2.0 <2.0.0
	function replaceCarets(comp, loose) {
	  return comp.trim().split(/\s+/).map(function (comp) {
	    return replaceCaret(comp, loose);
	  }).join(' ');
	}
	
	function replaceCaret(comp, loose) {
	  debug('caret', comp, loose);
	  var r = loose ? re[CARETLOOSE] : re[CARET];
	  return comp.replace(r, function (_, M, m, p, pr) {
	    debug('caret', comp, _, M, m, p, pr);
	    var ret;
	
	    if (isX(M)) ret = '';else if (isX(m)) ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';else if (isX(p)) {
	      if (M === '0') ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';else ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (pr.charAt(0) !== '-') pr = '-' + pr;
	      if (M === '0') {
	        if (m === '0') ret = '>=' + M + '.' + m + '.' + p + pr + ' <' + M + '.' + m + '.' + (+p + 1);else ret = '>=' + M + '.' + m + '.' + p + pr + ' <' + M + '.' + (+m + 1) + '.0';
	      } else ret = '>=' + M + '.' + m + '.' + p + pr + ' <' + (+M + 1) + '.0.0';
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') ret = '>=' + M + '.' + m + '.' + p + ' <' + M + '.' + m + '.' + (+p + 1);else ret = '>=' + M + '.' + m + '.' + p + ' <' + M + '.' + (+m + 1) + '.0';
	      } else ret = '>=' + M + '.' + m + '.' + p + ' <' + (+M + 1) + '.0.0';
	    }
	
	    debug('caret return', ret);
	    return ret;
	  });
	}
	
	function replaceXRanges(comp, loose) {
	  debug('replaceXRanges', comp, loose);
	  return comp.split(/\s+/).map(function (comp) {
	    return replaceXRange(comp, loose);
	  }).join(' ');
	}
	
	function replaceXRange(comp, loose) {
	  comp = comp.trim();
	  var r = loose ? re[XRANGELOOSE] : re[XRANGE];
	  return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    var xM = isX(M);
	    var xm = xM || isX(m);
	    var xp = xm || isX(p);
	    var anyX = xp;
	
	    if (gtlt === '=' && anyX) gtlt = '';
	
	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // replace X with 0
	      if (xm) m = 0;
	      if (xp) p = 0;
	
	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        // >1.2.3 => >= 1.2.4
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else if (xp) {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) M = +M + 1;else m = +m + 1;
	      }
	
	      ret = gtlt + M + '.' + m + '.' + p;
	    } else if (xm) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (xp) {
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    }
	
	    debug('xRange return', ret);
	
	    return ret;
	  });
	}
	
	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	function replaceStars(comp, loose) {
	  debug('replaceStars', comp, loose);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp.trim().replace(re[STAR], '');
	}
	
	// This function is passed to string.replace(re[HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0
	function hyphenReplace($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) {
	
	  if (isX(fM)) from = '';else if (isX(fm)) from = '>=' + fM + '.0.0';else if (isX(fp)) from = '>=' + fM + '.' + fm + '.0';else from = '>=' + from;
	
	  if (isX(tM)) to = '';else if (isX(tm)) to = '<' + (+tM + 1) + '.0.0';else if (isX(tp)) to = '<' + tM + '.' + (+tm + 1) + '.0';else if (tpr) to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;else to = '<=' + to;
	
	  return (from + ' ' + to).trim();
	}
	
	// if ANY of the sets match ALL of its comparators, then pass
	Range.prototype.test = function (version) {
	  if (!version) return false;
	
	  if (typeof version === 'string') version = new SemVer(version, this.loose);
	
	  for (var i = 0; i < this.set.length; i++) {
	    if (testSet(this.set[i], version)) return true;
	  }
	  return false;
	};
	
	function testSet(set, version) {
	  for (var i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) return false;
	  }
	
	  if (version.prerelease.length) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (var i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === ANY) continue;
	
	      if (set[i].semver.prerelease.length > 0) {
	        var allowed = set[i].semver;
	        if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) return true;
	      }
	    }
	
	    // Version has a -pre, but it's not one of the ones we like.
	    return false;
	  }
	
	  return true;
	}
	
	exports.satisfies = satisfies;
	function satisfies(version, range, loose) {
	  try {
	    range = new Range(range, loose);
	  } catch (er) {
	    return false;
	  }
	  return range.test(version);
	}
	
	exports.maxSatisfying = maxSatisfying;
	function maxSatisfying(versions, range, loose) {
	  return versions.filter(function (version) {
	    return satisfies(version, range, loose);
	  }).sort(function (a, b) {
	    return rcompare(a, b, loose);
	  })[0] || null;
	}
	
	exports.validRange = validRange;
	function validRange(range, loose) {
	  try {
	    // Return '*' instead of '' so that truthiness works.
	    // This will throw if it's invalid anyway
	    return new Range(range, loose).range || '*';
	  } catch (er) {
	    return null;
	  }
	}
	
	// Determine if version is less than all the versions possible in the range
	exports.ltr = ltr;
	function ltr(version, range, loose) {
	  return outside(version, range, '<', loose);
	}
	
	// Determine if version is greater than all the versions possible in the range.
	exports.gtr = gtr;
	function gtr(version, range, loose) {
	  return outside(version, range, '>', loose);
	}
	
	exports.outside = outside;
	function outside(version, range, hilo, loose) {
	  version = new SemVer(version, loose);
	  range = new Range(range, loose);
	
	  var gtfn, ltefn, ltfn, comp, ecomp;
	  switch (hilo) {
	    case '>':
	      gtfn = gt;
	      ltefn = lte;
	      ltfn = lt;
	      comp = '>';
	      ecomp = '>=';
	      break;
	    case '<':
	      gtfn = lt;
	      ltefn = gte;
	      ltfn = gt;
	      comp = '<';
	      ecomp = '<=';
	      break;
	    default:
	      throw new TypeError('Must provide a hilo val of "<" or ">"');
	  }
	
	  // If it satisifes the range it is not outside
	  if (satisfies(version, range, loose)) {
	    return false;
	  }
	
	  // From now on, variable terms are as if we're in "gtr" mode.
	  // but note that everything is flipped for the "ltr" function.
	
	  for (var i = 0; i < range.set.length; ++i) {
	    var comparators = range.set[i];
	
	    var high = null;
	    var low = null;
	
	    comparators.forEach(function (comparator) {
	      if (comparator.semver === ANY) {
	        comparator = new Comparator('>=0.0.0');
	      }
	      high = high || comparator;
	      low = low || comparator;
	      if (gtfn(comparator.semver, high.semver, loose)) {
	        high = comparator;
	      } else if (ltfn(comparator.semver, low.semver, loose)) {
	        low = comparator;
	      }
	    });
	
	    // If the edge version comparator has a operator then our version
	    // isn't outside it
	    if (high.operator === comp || high.operator === ecomp) {
	      return false;
	    }
	
	    // If the lowest version comparator has an operator and our version
	    // is less than it then it isn't higher than the range
	    if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
	      return false;
	    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
	      return false;
	    }
	  }
	  return true;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(52)))

/***/ },
/* 52 */
/***/ function(module, exports) {

	'use strict';
	
	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while (len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () {
	    return '/';
	};
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function () {
	    return 0;
	};

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = Vm;
	
	var _util = __webpack_require__(49);
	
	var _ = _interopRequireWildcard(_util);
	
	var _state = __webpack_require__(54);
	
	var state = _interopRequireWildcard(_state);
	
	var _compiler = __webpack_require__(59);
	
	var compiler = _interopRequireWildcard(_compiler);
	
	var _directive = __webpack_require__(60);
	
	var directive = _interopRequireWildcard(_directive);
	
	var _domHelper = __webpack_require__(61);
	
	var domHelper = _interopRequireWildcard(_domHelper);
	
	var _events = __webpack_require__(62);
	
	var events = _interopRequireWildcard(_events);
	
	var _register = __webpack_require__(63);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function callOldReadyEntry(vm, component) {
	  if (component.methods && component.methods.ready) {
	    _.warn('"exports.methods.ready" is deprecated, ' + 'please use "exports.created" instead');
	    component.methods.ready.call(vm);
	  }
	}
	
	/**
	 * ViewModel constructor
	 *
	 * @param {string} type
	 * @param {object} options    component options
	 * @param {object} parentVm   which contains _app
	 * @param {object} parentEl   root element or frag block
	 * @param {object} mergedData external data
	 * @param {object} externalEvents external events
	 */
	/**
	 * @fileOverview
	 * ViewModel Constructor & definition
	 */
	
	function Vm(type, options, parentVm, parentEl, mergedData, externalEvents) {
	  this._parent = parentVm._realParent ? parentVm._realParent : parentVm;
	  this._app = parentVm._app;
	  parentVm._childrenVms && parentVm._childrenVms.push(this);
	
	  if (!options) {
	    options = this._app.customComponentMap[type] || {};
	  }
	  var data = options.data || {};
	
	  this._options = options;
	  this._methods = options.methods || {};
	  this._computed = options.computed || {};
	  this._css = options.style || {};
	  this._ids = {};
	  this._vmEvents = {};
	  this._childrenVms = [];
	  this._type = type;
	
	  // bind events and lifecycles
	  this._initEvents(externalEvents);
	
	  _.debug('"init" lifecycle in Vm(' + this._type + ')');
	  this.$emit('hook:init');
	  this._inited = true;
	  // proxy data and methods
	  // observe data and add this to vms
	  this._data = typeof data === 'function' ? data() : data;
	  if (mergedData) {
	    _.extend(this._data, mergedData);
	  }
	  this._initState();
	
	  _.debug('"created" lifecycle in Vm(' + this._type + ')');
	  this.$emit('hook:created');
	  this._created = true;
	  // backward old ready entry
	  callOldReadyEntry(this, options);
	
	  // if no parentElement then specify the documentElement
	  this._parentEl = parentEl || this._app.doc.documentElement;
	  this._build();
	}
	
	_.extend(Vm.prototype, state, compiler, directive, domHelper, events);
	_.extend(Vm, {
	  registerModules: _register.registerModules,
	  registerMethods: _register.registerMethods
	});

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports._initState = _initState;
	exports._initData = _initData;
	exports._initComputed = _initComputed;
	exports._initMethods = _initMethods;
	
	var _watcher = __webpack_require__(55);
	
	var _watcher2 = _interopRequireDefault(_watcher);
	
	var _dep = __webpack_require__(56);
	
	var _dep2 = _interopRequireDefault(_dep);
	
	var _observer = __webpack_require__(57);
	
	var _util = __webpack_require__(49);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/* eslint-disable */
	
	function _initState() {
	  var vm = this;
	  vm._watchers = [];
	  vm._initData();
	  vm._initComputed();
	  vm._initMethods();
	}
	
	function _initData() {
	  var vm = this;
	  var data = vm._data;
	
	  if (!(0, _util.isPlainObject)(data)) {
	    data = {};
	  }
	  // proxy data on instance
	  var keys = Object.keys(data);
	  var i = keys.length;
	  while (i--) {
	    (0, _observer.proxy)(vm, keys[i]);
	  }
	  // observe data
	  (0, _observer.observe)(data, vm);
	}
	
	function noop() {}
	
	function _initComputed() {
	  var vm = this;
	  var computed = vm._computed;
	  if (computed) {
	    for (var key in computed) {
	      var userDef = computed[key];
	      var def = {
	        enumerable: true,
	        configurable: true
	      };
	      if (typeof userDef === 'function') {
	        def.get = makeComputedGetter(userDef, vm);
	        def.set = noop;
	      } else {
	        def.get = userDef.get ? userDef.cache !== false ? makeComputedGetter(userDef.get, vm) : (0, _util.bind)(userDef.get, vm) : noop;
	        def.set = userDef.set ? (0, _util.bind)(userDef.set, vm) : noop;
	      }
	      Object.defineProperty(vm, key, def);
	    }
	  }
	}
	
	function makeComputedGetter(getter, owner) {
	  var watcher = new _watcher2.default(owner, getter, null, {
	    lazy: true
	  });
	  return function computedGetter() {
	    if (watcher.dirty) {
	      watcher.evaluate();
	    }
	    if (_dep2.default.target) {
	      watcher.depend();
	    }
	    return watcher.value;
	  };
	}
	
	function _initMethods() {
	  var vm = this;
	  var methods = vm._methods;
	  if (methods) {
	    for (var key in methods) {
	      vm[key] = (0, _util.bind)(methods[key], vm);
	    }
	  }
	}

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = Watcher;
	
	var _dep = __webpack_require__(56);
	
	var _dep2 = _interopRequireDefault(_dep);
	
	var _util = __webpack_require__(49);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/* eslint-disable */
	
	var uid = 0;
	// import { pushWatcher } from './batcher'
	
	var prevTarget = void 0;
	
	/**
	 * A watcher parses an expression, collects dependencies,
	 * and fires callback when the expression value changes.
	 * This is used for both the $watch() api and directives.
	 *
	 * @param {Vue} vm
	 * @param {String|Function} expOrFn
	 * @param {Function} cb
	 * @param {Object} options
	 *                 - {Array} filters
	 *                 - {Boolean} twoWay
	 *                 - {Boolean} deep
	 *                 - {Boolean} user
	 *                 - {Boolean} sync
	 *                 - {Boolean} lazy
	 *                 - {Function} [preProcess]
	 *                 - {Function} [postProcess]
	 * @constructor
	 */
	
	function Watcher(vm, expOrFn, cb, options) {
	  // mix in options
	  if (options) {
	    (0, _util.extend)(this, options);
	  }
	  var isFn = typeof expOrFn === 'function';
	  this.vm = vm;
	  vm._watchers.push(this);
	  this.expression = expOrFn;
	  this.cb = cb;
	  this.id = ++uid; // uid for batching
	  this.active = true;
	  this.dirty = this.lazy; // for lazy watchers
	  this.deps = [];
	  this.newDeps = [];
	  this.depIds = new _util._Set();
	  this.newDepIds = new _util._Set();
	  // parse expression for getter
	  if (isFn) {
	    this.getter = expOrFn;
	  } else {
	    this.getter = (0, _util.parsePath)(expOrFn);
	    if (!this.getter) {
	      this.getter = function () {};
	      process.env.NODE_ENV !== 'production' && (0, _util.warn)('Failed watching path: ' + expOrFn + 'Watcher only accepts simple dot-delimited paths. ' + 'For full control, use a function instead.', vm);
	    }
	  }
	  this.value = this.lazy ? undefined : this.get();
	  // state for avoiding false triggers for deep and Array
	  // watchers during vm._digest()
	  this.queued = this.shallow = false;
	}
	
	/**
	 * Evaluate the getter, and re-collect dependencies.
	 */
	
	Watcher.prototype.get = function () {
	  this.beforeGet();
	  var value = this.getter.call(this.vm, this.vm);
	  // "touch" every property so they are all tracked as
	  // dependencies for deep watching
	  if (this.deep) {
	    traverse(value);
	  }
	  this.afterGet();
	  return value;
	};
	
	/**
	 * Prepare for dependency collection.
	 */
	
	Watcher.prototype.beforeGet = function () {
	  prevTarget = _dep2.default.target;
	  _dep2.default.target = this;
	};
	
	/**
	 * Add a dependency to this directive.
	 *
	 * @param {Dep} dep
	 */
	
	Watcher.prototype.addDep = function (dep) {
	  var id = dep.id;
	  if (!this.newDepIds.has(id)) {
	    this.newDepIds.add(id);
	    this.newDeps.push(dep);
	    if (!this.depIds.has(id)) {
	      dep.addSub(this);
	    }
	  }
	};
	
	/**
	 * Clean up for dependency collection.
	 */
	
	Watcher.prototype.afterGet = function () {
	  _dep2.default.target = prevTarget;
	  var i = this.deps.length;
	  while (i--) {
	    var dep = this.deps[i];
	    if (!this.newDepIds.has(dep.id)) {
	      dep.removeSub(this);
	    }
	  }
	  var tmp = this.depIds;
	  this.depIds = this.newDepIds;
	  this.newDepIds = tmp;
	  this.newDepIds.clear();
	  tmp = this.deps;
	  this.deps = this.newDeps;
	  this.newDeps = tmp;
	  this.newDeps.length = 0;
	};
	
	/**
	 * Subscriber interface.
	 * Will be called when a dependency changes.
	 *
	 * @param {Boolean} shallow
	 */
	
	Watcher.prototype.update = function (shallow) {
	  if (this.lazy) {
	    this.dirty = true;
	  } else {
	    this.run();
	  }
	  // } else if (this.sync) {
	  //   this.run()
	  // } else {
	  //   // if queued, only overwrite shallow with non-shallow,
	  //   // but not the other way around.
	  //   this.shallow = this.queued
	  //     ? shallow
	  //       ? this.shallow
	  //       : false
	  //     : !!shallow
	  //   this.queued = true
	  //   pushWatcher(this)
	  // }
	};
	
	/**
	 * Batcher job interface.
	 * Will be called by the batcher.
	 */
	
	Watcher.prototype.run = function () {
	  if (this.active) {
	    var value = this.get();
	    if (value !== this.value ||
	    // Deep watchers and watchers on Object/Arrays should fire even
	    // when the value is the same, because the value may
	    // have mutated; but only do so if this is a
	    // non-shallow update (caused by a vm digest).
	    ((0, _util.isObject)(value) || this.deep) && !this.shallow) {
	      // set new value
	      var oldValue = this.value;
	      this.value = value;
	      this.cb.call(this.vm, value, oldValue);
	    }
	    this.queued = this.shallow = false;
	  }
	};
	
	/**
	 * Evaluate the value of the watcher.
	 * This only gets called for lazy watchers.
	 */
	
	Watcher.prototype.evaluate = function () {
	  // avoid overwriting another watcher that is being
	  // collected.
	  var current = _dep2.default.target;
	  this.value = this.get();
	  this.dirty = false;
	  _dep2.default.target = current;
	};
	
	/**
	 * Depend on all deps collected by this watcher.
	 */
	
	Watcher.prototype.depend = function () {
	  var i = this.deps.length;
	  while (i--) {
	    this.deps[i].depend();
	  }
	};
	
	/**
	 * Remove self from all dependencies' subcriber list.
	 */
	
	Watcher.prototype.teardown = function () {
	  if (this.active) {
	    // remove self from vm's watcher list
	    // this is a somewhat expensive operation so we skip it
	    // if the vm is being destroyed or is performing a v-for
	    // re-render (the watcher list is then filtered by v-for).
	    if (!this.vm._isBeingDestroyed && !this.vm._vForRemoving) {
	      (0, _util.remove)(this.vm._watchers, this);
	    }
	    var i = this.deps.length;
	    while (i--) {
	      this.deps[i].removeSub(this);
	    }
	    this.active = false;
	    this.vm = this.cb = this.value = null;
	  }
	};
	
	/**
	 * Recrusively traverse an object to evoke all converted
	 * getters, so that every nested property inside the object
	 * is collected as a "deep" dependency.
	 *
	 * @param {*} val
	 * @param {Set} seen
	 */
	
	var seenObjects = new _util._Set();
	function traverse(val, seen) {
	  var i = void 0,
	      keys = void 0,
	      isA = void 0,
	      isO = void 0;
	  if (!seen) {
	    seen = seenObjects;
	    seen.clear();
	  }
	  isA = (0, _util.isArray)(val);
	  isO = (0, _util.isObject)(val);
	  if (isA || isO) {
	    if (val.__ob__) {
	      var depId = val.__ob__.dep.id;
	      if (seen.has(depId)) {
	        return;
	      } else {
	        seen.add(depId);
	      }
	    }
	    if (isA) {
	      i = val.length;
	      while (i--) {
	        traverse(val[i], seen);
	      }
	    } else if (isO) {
	      keys = Object.keys(val);
	      i = keys.length;
	      while (i--) {
	        traverse(val[keys[i]], seen);
	      }
	    }
	  }
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(52)))

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = Dep;
	
	var _util = __webpack_require__(49);
	
	var uid = 0;
	
	/**
	 * A dep is an observable that can have multiple
	 * directives subscribing to it.
	 *
	 * @constructor
	 */
	
	/* eslint-disable */
	
	function Dep() {
	  this.id = uid++;
	  this.subs = [];
	}
	
	// the current target watcher being evaluated.
	// this is globally unique because there could be only one
	// watcher being evaluated at any time.
	Dep.target = null;
	
	/**
	 * Add a directive subscriber.
	 *
	 * @param {Directive} sub
	 */
	
	Dep.prototype.addSub = function (sub) {
	  this.subs.push(sub);
	};
	
	/**
	 * Remove a directive subscriber.
	 *
	 * @param {Directive} sub
	 */
	
	Dep.prototype.removeSub = function (sub) {
	  (0, _util.remove)(this.subs, sub);
	};
	
	/**
	 * Add self as a dependency to the target watcher.
	 */
	
	Dep.prototype.depend = function () {
	  Dep.target.addDep(this);
	};
	
	/**
	 * Notify all subscribers of a new value.
	 */
	
	Dep.prototype.notify = function () {
	  // stablize the subscriber list first
	  var subs = this.subs.slice();
	  for (var i = 0, l = subs.length; i < l; i++) {
	    subs[i].update();
	  }
	};

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Observer = Observer;
	exports.observe = observe;
	exports.defineReactive = defineReactive;
	exports.set = set;
	exports.del = del;
	exports.proxy = proxy;
	exports.unproxy = unproxy;
	
	var _dep = __webpack_require__(56);
	
	var _dep2 = _interopRequireDefault(_dep);
	
	var _array = __webpack_require__(58);
	
	var _util = __webpack_require__(49);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var arrayKeys = Object.getOwnPropertyNames(_array.arrayMethods);
	
	/**
	 * Observer class that are attached to each observed
	 * object. Once attached, the observer converts target
	 * object's property keys into getter/setters that
	 * collect dependencies and dispatches updates.
	 *
	 * @param {Array|Object} value
	 * @constructor
	 */
	
	/* eslint-disable */
	
	function Observer(value) {
	  this.value = value;
	  this.dep = new _dep2.default();
	  (0, _util.def)(value, '__ob__', this);
	  if ((0, _util.isArray)(value)) {
	    var augment = _util.hasProto ? protoAugment : copyAugment;
	    augment(value, _array.arrayMethods, arrayKeys);
	    this.observeArray(value);
	  } else {
	    this.walk(value);
	  }
	}
	
	// Instance methods
	
	/**
	 * Walk through each property and convert them into
	 * getter/setters. This method should only be called when
	 * value type is Object.
	 *
	 * @param {Object} obj
	 */
	
	Observer.prototype.walk = function (obj) {
	  for (var key in obj) {
	    this.convert(key, obj[key]);
	  }
	};
	
	/**
	 * Observe a list of Array items.
	 *
	 * @param {Array} items
	 */
	
	Observer.prototype.observeArray = function (items) {
	  for (var i = 0, l = items.length; i < l; i++) {
	    observe(items[i]);
	  }
	};
	
	/**
	 * Convert a property into getter/setter so we can emit
	 * the events when the property is accessed/changed.
	 *
	 * @param {String} key
	 * @param {*} val
	 */
	
	Observer.prototype.convert = function (key, val) {
	  defineReactive(this.value, key, val);
	};
	
	/**
	 * Add an owner vm, so that when $set/$delete mutations
	 * happen we can notify owner vms to proxy the keys and
	 * digest the watchers. This is only called when the object
	 * is observed as an instance's root $data.
	 *
	 * @param {Vue} vm
	 */
	
	Observer.prototype.addVm = function (vm) {
	  (this.vms || (this.vms = [])).push(vm);
	};
	
	/**
	 * Remove an owner vm. This is called when the object is
	 * swapped out as an instance's $data object.
	 *
	 * @param {Vue} vm
	 */
	
	Observer.prototype.removeVm = function (vm) {
	  (0, _util.remove)(this.vms, vm);
	};
	
	// helpers
	
	/**
	 * Augment an target Object or Array by intercepting
	 * the prototype chain using __proto__
	 *
	 * @param {Object|Array} target
	 * @param {Object} src
	 */
	
	function protoAugment(target, src) {
	  /* eslint-disable no-proto */
	  target.__proto__ = src;
	  /* eslint-enable no-proto */
	}
	
	/**
	 * Augment an target Object or Array by defining
	 * hidden properties.
	 *
	 * @param {Object|Array} target
	 * @param {Object} proto
	 */
	
	function copyAugment(target, src, keys) {
	  for (var i = 0, l = keys.length; i < l; i++) {
	    var key = keys[i];
	    (0, _util.def)(target, key, src[key]);
	  }
	}
	
	/**
	 * Attempt to create an observer instance for a value,
	 * returns the new observer if successfully observed,
	 * or the existing observer if the value already has one.
	 *
	 * @param {*} value
	 * @param {Vue} [vm]
	 * @return {Observer|undefined}
	 * @static
	 */
	
	function observe(value, vm) {
	  if (!(0, _util.isObject)(value)) {
	    return;
	  }
	  var ob = void 0;
	  if ((0, _util.hasOwn)(value, '__ob__') && value.__ob__ instanceof Observer) {
	    ob = value.__ob__;
	  } else if (((0, _util.isArray)(value) || (0, _util.isPlainObject)(value)) && Object.isExtensible(value) && !value._isVue) {
	    ob = new Observer(value);
	  }
	  if (ob && vm) {
	    ob.addVm(vm);
	  }
	  return ob;
	}
	
	/**
	 * Define a reactive property on an Object.
	 *
	 * @param {Object} obj
	 * @param {String} key
	 * @param {*} val
	 */
	
	function defineReactive(obj, key, val) {
	  var dep = new _dep2.default();
	
	  var property = Object.getOwnPropertyDescriptor(obj, key);
	  if (property && property.configurable === false) {
	    return;
	  }
	
	  // cater for pre-defined getter/setters
	  var getter = property && property.get;
	  var setter = property && property.set;
	
	  var childOb = observe(val);
	  Object.defineProperty(obj, key, {
	    enumerable: true,
	    configurable: true,
	    get: function reactiveGetter() {
	      var value = getter ? getter.call(obj) : val;
	      if (_dep2.default.target) {
	        dep.depend();
	        if (childOb) {
	          childOb.dep.depend();
	        }
	        if ((0, _util.isArray)(value)) {
	          for (var e, i = 0, l = value.length; i < l; i++) {
	            e = value[i];
	            e && e.__ob__ && e.__ob__.dep.depend();
	          }
	        }
	      }
	      return value;
	    },
	    set: function reactiveSetter(newVal) {
	      var value = getter ? getter.call(obj) : val;
	      if (newVal === value) {
	        return;
	      }
	      if (setter) {
	        setter.call(obj, newVal);
	      } else {
	        val = newVal;
	      }
	      childOb = observe(newVal);
	      dep.notify();
	    }
	  });
	}
	
	/**
	 * Set a property on an object. Adds the new property and
	 * triggers change notification if the property doesn't
	 * already exist.
	 *
	 * @param {Object} obj
	 * @param {String} key
	 * @param {*} val
	 * @public
	 */
	
	function set(obj, key, val) {
	  if ((0, _util.isArray)(obj)) {
	    return obj.splice(key, 1, val);
	  }
	  if ((0, _util.hasOwn)(obj, key)) {
	    obj[key] = val;
	    return;
	  }
	  if (obj._isVue) {
	    set(obj._data, key, val);
	    return;
	  }
	  var ob = obj.__ob__;
	  if (!ob) {
	    obj[key] = val;
	    return;
	  }
	  ob.convert(key, val);
	  ob.dep.notify();
	  if (ob.vms) {
	    var i = ob.vms.length;
	    while (i--) {
	      var vm = ob.vms[i];
	      proxy(vm, key);
	      vm.$forceUpdate();
	    }
	  }
	  return val;
	}
	
	/**
	 * Delete a property and trigger change if necessary.
	 *
	 * @param {Object} obj
	 * @param {String} key
	 */
	
	function del(obj, key) {
	  if (!(0, _util.hasOwn)(obj, key)) {
	    return;
	  }
	  delete obj[key];
	  var ob = obj.__ob__;
	
	  if (!ob) {
	    if (obj._isVue) {
	      delete obj._data[key];
	      obj.$forceUpdate();
	    }
	    return;
	  }
	  ob.dep.notify();
	  if (ob.vms) {
	    var i = ob.vms.length;
	    while (i--) {
	      var vm = ob.vms[i];
	      unproxy(vm, key);
	      vm.$forceUpdate();
	    }
	  }
	}
	
	var KEY_WORDS = ['$index', '$value', '$event'];
	function proxy(vm, key) {
	  if (KEY_WORDS.indexOf(key) > -1 || !(0, _util.isReserved)(key)) {
	    Object.defineProperty(vm, key, {
	      configurable: true,
	      enumerable: true,
	      get: function proxyGetter() {
	        return vm._data[key];
	      },
	      set: function proxySetter(val) {
	        vm._data[key] = val;
	      }
	    });
	  }
	}
	
	function unproxy(vm, key) {
	  if (!(0, _util.isReserved)(key)) {
	    delete vm[key];
	  }
	}

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.arrayMethods = undefined;
	
	var _util = __webpack_require__(49);
	
	var arrayProto = Array.prototype; /* eslint-disable */
	
	var arrayMethods = exports.arrayMethods = Object.create(arrayProto)
	
	/**
	 * Intercept mutating methods and emit events
	 */
	
	;['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(function (method) {
	  // cache original method
	  var original = arrayProto[method];
	  (0, _util.def)(arrayMethods, method, function mutator() {
	    // avoid leaking arguments:
	    // http://jsperf.com/closure-with-arguments
	    var i = arguments.length;
	    var args = new Array(i);
	    while (i--) {
	      args[i] = arguments[i];
	    }
	    var result = original.apply(this, args);
	    var ob = this.__ob__;
	    var inserted = void 0;
	    switch (method) {
	      case 'push':
	        inserted = args;
	        break;
	      case 'unshift':
	        inserted = args;
	        break;
	      case 'splice':
	        inserted = args.slice(2);
	        break;
	    }
	    if (inserted) ob.observeArray(inserted);
	    // notify change
	    ob.dep.notify();
	    return result;
	  });
	});
	
	/**
	 * Swap the element at the given index with a new value
	 * and emits corresponding event.
	 *
	 * @param {Number} index
	 * @param {*} val
	 * @return {*} - replaced element
	 */
	
	(0, _util.def)(arrayProto, '$set', function $set(index, val) {
	  if (index >= this.length) {
	    this.length = index + 1;
	  }
	  return this.splice(index, 1, val)[0];
	});
	
	/**
	 * Convenience method to remove the element at given index.
	 *
	 * @param {Number} index
	 * @param {*} val
	 */
	
	(0, _util.def)(arrayProto, '$remove', function $remove(index) {
	  /* istanbul ignore if */
	  if (!this.length) return;
	  if (typeof index !== 'number') {
	    index = this.indexOf(index);
	  }
	  if (index > -1) {
	    this.splice(index, 1);
	  }
	});

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /**
	                                                                                                                                                                                                                                                   * @fileOverview
	                                                                                                                                                                                                                                                   * ViewModel template parser & data-binding process
	                                                                                                                                                                                                                                                   *
	                                                                                                                                                                                                                                                   * required:
	                                                                                                                                                                                                                                                   * index.js: Vm
	                                                                                                                                                                                                                                                   * dom-helper.js: _createElement, _createBlock
	                                                                                                                                                                                                                                                   * dom-helper.js: _attachTarget, _moveTarget, _removeTarget
	                                                                                                                                                                                                                                                   * directive.js: _bindElement, _bindSubVm, _watch
	                                                                                                                                                                                                                                                   * events.js: $on
	                                                                                                                                                                                                                                                   */
	
	exports._build = _build;
	exports._compile = _compile;
	exports._targetIsFragment = _targetIsFragment;
	exports._targetIsContent = _targetIsContent;
	exports._targetNeedCheckRepeat = _targetNeedCheckRepeat;
	exports._targetNeedCheckShown = _targetNeedCheckShown;
	exports._targetNeedCheckType = _targetNeedCheckType;
	exports._targetIsComposed = _targetIsComposed;
	exports._compileFragment = _compileFragment;
	exports._compileRepeat = _compileRepeat;
	exports._compileShown = _compileShown;
	exports._compileType = _compileType;
	exports._compileCustomComponent = _compileCustomComponent;
	exports._compileNativeComponent = _compileNativeComponent;
	exports._compileChildren = _compileChildren;
	exports._bindRepeat = _bindRepeat;
	exports._bindShown = _bindShown;
	exports._watchBlock = _watchBlock;
	exports._mergeContext = _mergeContext;
	
	var _util = __webpack_require__(49);
	
	var _ = _interopRequireWildcard(_util);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	/**
	 * build(externalDirs)
	 *   createVm()
	 *   merge(externalDirs, dirs)
	 *   compile(template, parentNode)
	 *     if (type is content) create contentNode
	 *     else if (dirs have v-for) foreach -> create context
	 *       -> compile(templateWithoutFor, parentNode): diff(list) onchange
	 *     else if (dirs have v-if) assert
	 *       -> compile(templateWithoutIf, parentNode): toggle(shown) onchange
	 *     else if (type is native)
	 *       set(dirs): update(id/attr/style/class) onchange
	 *       append(template, parentNode)
	 *       foreach childNodes -> compile(childNode, template)
	 *     else if (type is custom)
	 *       addChildVm(vm, parentVm)
	 *       build(externalDirs)
	 *       foreach childNodes -> compile(childNode, template)
	 */
	function _build() {
	  var opt = this._options || {};
	  var template = opt.template || {};
	
	  if (opt.replace) {
	    if (template.children && template.children.length === 1) {
	      this._compile(template.children[0], this._parentEl);
	    } else {
	      this._compile(template.children, this._parentEl);
	    }
	  } else {
	    this._compile(template, this._parentEl);
	  }
	
	  _.debug('"ready" lifecycle in Vm(' + this._type + ')');
	  this.$emit('hook:ready');
	  this._ready = true;
	}
	
	/**
	 * Generate elements by child or children and append to parent elements.
	 * Root element info would be merged if has. The first argument may be an array
	 * if the root element with options.replace has not only one child.
	 *
	 * @param {object|array} target
	 * @param {object}       dest
	 * @param {object}       meta
	 */
	function _compile(target, dest, meta) {
	  var context = this;
	  if (context._targetIsFragment(target)) {
	    context._compileFragment(target, dest, meta);
	    return;
	  }
	  meta = meta || {};
	  if (context._targetIsContent(target)) {
	    _.debug('compile "content" block by', target);
	    context._content = context._createBlock(dest);
	    return;
	  }
	
	  if (context._targetNeedCheckRepeat(target, meta)) {
	    _.debug('compile "repeat" logic by', target);
	    context._compileRepeat(target, dest);
	    return;
	  }
	  if (context._targetNeedCheckShown(target, meta)) {
	    _.debug('compile "if" logic by', target);
	    context._compileShown(target, dest, meta);
	    return;
	  }
	  var typeGetter = meta.type || target.type;
	  if (context._targetNeedCheckType(typeGetter, meta)) {
	    context._compileType(target, dest, typeGetter, meta);
	    return;
	  }
	  var type = typeGetter;
	  var component = context._targetIsComposed(target, type);
	  if (component) {
	    _.debug('compile composed component by', target);
	    context._compileCustomComponent(component, target, dest, type, meta);
	    return;
	  }
	  _.debug('compile native component by', target);
	  context._compileNativeComponent(target, dest, type);
	}
	
	/**
	 * Check if target is a fragment (an array).
	 *
	 * @param  {object}  target
	 * @return {boolean}
	 */
	function _targetIsFragment(target) {
	  return Array.isArray(target);
	}
	
	/**
	 * Check if target type is content/slot.
	 *
	 * @param  {object}  target
	 * @return {boolean}
	 */
	function _targetIsContent(target) {
	  return target.type === 'content' || target.type === 'slot';
	}
	
	/**
	 * Check if target need to compile by a list.
	 *
	 * @param  {object}  target
	 * @param  {object}  meta
	 * @return {boolean}
	 */
	function _targetNeedCheckRepeat(target, meta) {
	  return !meta.hasOwnProperty('repeat') && target.repeat;
	}
	
	/**
	 * Check if target need to compile by a boolean value.
	 *
	 * @param  {object}  target
	 * @param  {object}  meta
	 * @return {boolean}
	 */
	function _targetNeedCheckShown(target, meta) {
	  return !meta.hasOwnProperty('shown') && target.shown;
	}
	
	/**
	 * Check if target need to compile by a dynamic type.
	 *
	 * @param  {string|function} typeGetter
	 * @param  {object}          meta
	 * @return {boolean}
	 */
	function _targetNeedCheckType(typeGetter, meta) {
	  return typeof typeGetter === 'function' && !meta.hasOwnProperty('type');
	}
	
	/**
	 * Check if this kind of component is composed.
	 *
	 * @param  {string}  type
	 * @return {boolean}
	 */
	function _targetIsComposed(target, type) {
	  var component = void 0;
	  if (this._app && this._app.customComponentMap) {
	    component = this._app.customComponentMap[type];
	  }
	  if (this._options && this._options.components) {
	    component = this._options.components[type];
	  }
	  if (target.component) {
	    component = component || {};
	  }
	  return component;
	}
	
	/**
	 * Compile a list of targets.
	 *
	 * @param {object} target
	 * @param {object} dest
	 * @param {object} meta
	 */
	function _compileFragment(target, dest, meta) {
	  var _this = this;
	
	  var fragBlock = this._createBlock(dest);
	  target.forEach(function (child) {
	    _this._compile(child, fragBlock, meta);
	  });
	}
	
	/**
	 * Compile a target with repeat directive.
	 *
	 * @param {object} target
	 * @param {object} dest
	 */
	function _compileRepeat(target, dest) {
	  var repeat = target.repeat;
	  var oldStyle = typeof repeat === 'function';
	  var getter = repeat.getter || repeat.expression || repeat;
	  if (typeof getter !== 'function') {
	    getter = function getter() {
	      return [];
	    };
	  }
	  var key = repeat.key || '$index';
	  var value = repeat.value || '$value';
	  var trackBy = repeat.trackBy || target.trackBy || target.attr && target.attr.trackBy || key;
	
	  var fragBlock = this._createBlock(dest);
	  fragBlock.children = [];
	  fragBlock.data = [];
	  fragBlock.vms = [];
	
	  this._bindRepeat(target, fragBlock, { getter: getter, key: key, value: value, trackBy: trackBy, oldStyle: oldStyle });
	}
	
	/**
	 * Compile a target with if directive.
	 *
	 * @param {object} target
	 * @param {object} dest
	 * @param {object} meta
	 */
	function _compileShown(target, dest, meta) {
	  var newMeta = { shown: true };
	  var fragBlock = this._createBlock(dest);
	
	  if (dest.element && dest.children) {
	    dest.children.push(fragBlock);
	  }
	
	  if (meta.repeat) {
	    newMeta.repeat = meta.repeat;
	  }
	
	  this._bindShown(target, fragBlock, newMeta);
	}
	
	/**
	 * Compile a target with dynamic component type.
	 *
	 * @param {object}   target
	 * @param {object}   dest
	 * @param {function} typeGetter
	 */
	function _compileType(target, dest, typeGetter, meta) {
	  var _this2 = this;
	
	  var type = typeGetter.call(this);
	  var newMeta = Object.assign({ type: type }, meta);
	  var fragBlock = this._createBlock(dest);
	
	  if (dest.element && dest.children) {
	    dest.children.push(fragBlock);
	  }
	
	  this._watch(typeGetter, function (value) {
	    var newMeta = Object.assign({ type: value }, meta);
	    _this2._removeBlock(fragBlock, true);
	    _this2._compile(target, fragBlock, newMeta);
	  });
	
	  this._compile(target, fragBlock, newMeta);
	}
	
	/**
	 * Compile a composed component.
	 *
	 * @param {object} target
	 * @param {object} dest
	 * @param {string} type
	 */
	function _compileCustomComponent(component, target, dest, type, meta) {
	  var Vm = this.constructor;
	  var context = this;
	  var subVm = new Vm(type, component, context, dest, undefined, {
	    'hook:init': function hookInit() {
	      context._setId(target.id, null, this);
	    },
	    'hook:created': function hookCreated() {
	      context._bindSubVm(this, target, meta.repeat);
	    },
	    'hook:ready': function hookReady() {
	      if (this._content) {
	        context._compileChildren(target, this._content);
	      }
	    }
	  });
	  this._bindSubVmAfterInitialized(subVm, target);
	}
	
	/**
	 * Generate element from template and attach to the dest if needed.
	 * The time to attach depends on whether the mode status is node or tree.
	 *
	 * @param {object} template
	 * @param {object} dest
	 * @param {string} type
	 */
	function _compileNativeComponent(template, dest, type) {
	  this._applyNaitveComponentOptions(template);
	
	  var element = void 0;
	  if (dest.ref === '_documentElement') {
	    // if its parent is documentElement then it's a body
	    _.debug('compile to create body for', type);
	    element = this._createBody(type);
	  } else {
	    _.debug('compile to create element for', type);
	    element = this._createElement(type);
	  }
	  // TODO it was a root element when not in a fragment
	  if (!this._rootEl) {
	    this._rootEl = element;
	  }
	
	  this._bindElement(element, template);
	
	  if (template.attr && template.attr.append) {
	    // backward, append prop in attr
	    template.append = template.attr.append;
	  }
	
	  if (template.append) {
	    // give the append attribute for ios adaptation
	    element.attr = element.attr || {};
	    element.attr.append = template.append;
	  }
	
	  var treeMode = template.append === 'tree';
	  if (!treeMode) {
	    _.debug('compile to append single node for', element);
	    this._attachTarget(element, dest);
	  }
	  this._compileChildren(template, element);
	  if (treeMode) {
	    _.debug('compile to append whole tree for', element);
	    this._attachTarget(element, dest);
	  }
	}
	
	/**
	 * Set all children to a certain parent element.
	 *
	 * @param {object} template
	 * @param {object} dest
	 */
	function _compileChildren(template, dest) {
	  var _this3 = this;
	
	  var children = template.children;
	  if (children && children.length) {
	    children.forEach(function (child) {
	      _this3._compile(child, dest);
	    });
	  }
	}
	
	/**
	 * Watch the list update and refresh the changes.
	 *
	 * @param {object} target
	 * @param {object} fragBlock {vms, data, children}
	 * @param {object} info      {getter, key, value, trackBy, oldStyle}
	 */
	function _bindRepeat(target, fragBlock, info) {
	  var _this4 = this;
	
	  var vms = fragBlock.vms;
	  var children = fragBlock.children;
	  var getter = info.getter;
	  var trackBy = info.trackBy;
	  var oldStyle = info.oldStyle;
	
	  var keyName = info.key;
	  var valueName = info.value;
	
	  function compileItem(item, index, context) {
	    var mergedData = void 0;
	    if (oldStyle) {
	      mergedData = item;
	      if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object') {
	        mergedData[keyName] = index;
	        if (!mergedData.hasOwnProperty('INDEX')) {
	          Object.defineProperty(mergedData, 'INDEX', {
	            value: function value() {
	              _.warn('"INDEX" in repeat is deprecated,' + ' please use "$index" instead');
	            }
	          });
	        }
	      }
	    } else {
	      mergedData = {};
	      mergedData[keyName] = index;
	      mergedData[valueName] = item;
	    }
	    context = context._mergeContext(mergedData);
	    vms.push(context);
	    context._compile(target, fragBlock, { repeat: item });
	  }
	
	  var list = this._watchBlock(fragBlock, getter, 'repeat', function (data) {
	    _.debug('the "repeat" item has changed', data);
	
	    if (!fragBlock) {
	      return;
	    }
	
	    var oldChildren = children.slice();
	    var oldVms = vms.slice();
	    var oldData = fragBlock.data.slice();
	    // 1. collect all new refs track by
	    var trackMap = {};
	    var reusedMap = {};
	    data.forEach(function (item, index) {
	      var key = trackBy ? item[trackBy] : index;
	      /* istanbul ignore if */
	      if (key == null || key === '') {
	        return;
	      }
	      trackMap[key] = item;
	    });
	
	    // 2. remove unused element foreach old item
	    var reusedList = [];
	    oldData.forEach(function (item, index) {
	      var key = trackBy ? item[trackBy] : index;
	      if (trackMap.hasOwnProperty(key)) {
	        reusedMap[key] = {
	          item: item, index: index, key: key,
	          target: oldChildren[index],
	          vm: oldVms[index]
	        };
	        reusedList.push(item);
	      } else {
	        _this4._removeTarget(oldChildren[index]);
	      }
	    });
	
	    // 3. create new element foreach new item
	    children.length = 0;
	    vms.length = 0;
	    fragBlock.data = data.slice();
	    fragBlock.updateMark = fragBlock.start;
	
	    data.forEach(function (item, index) {
	      var key = trackBy ? item[trackBy] : index;
	      var reused = reusedMap[key];
	      if (reused) {
	        if (reused.item === reusedList[0]) {
	          reusedList.shift();
	        } else {
	          reusedList.$remove(reused.item);
	          _this4._moveTarget(reused.target, fragBlock.updateMark, true);
	        }
	        children.push(reused.target);
	        vms.push(reused.vm);
	        reused.vm[keyName] = index;
	        fragBlock.updateMark = reused.target;
	      } else {
	        compileItem(item, index, _this4);
	      }
	    });
	
	    delete fragBlock.updateMark;
	  });
	
	  fragBlock.data = list.slice(0);
	  list.forEach(function (item, index) {
	    compileItem(item, index, _this4);
	  });
	}
	
	/**
	 * Watch the display update and add/remove the element.
	 *
	 * @param  {object} target
	 * @param  {object} fragBlock
	 * @param  {object} context
	 */
	function _bindShown(target, fragBlock, meta) {
	  var _this5 = this;
	
	  var display = this._watchBlock(fragBlock, target.shown, 'shown', function (display) {
	    _.debug('the "if" item was changed', display);
	
	    if (!fragBlock || !!fragBlock.display === !!display) {
	      return;
	    }
	    fragBlock.display = !!display;
	    if (display) {
	      _this5._compile(target, fragBlock, meta);
	    } else {
	      _this5._removeBlock(fragBlock, true);
	    }
	  });
	
	  fragBlock.display = !!display;
	  if (display) {
	    this._compile(target, fragBlock, meta);
	  }
	}
	
	/**
	 * Watch calc value changes and append certain type action to differ.
	 * It is used for if or repeat data-binding generator.
	 *
	 * @param  {object}   fragBlock
	 * @param  {function} calc
	 * @param  {string}   type
	 * @param  {function} handler
	 * @return {any}      init value of calc
	 */
	function _watchBlock(fragBlock, calc, type, handler) {
	  var differ = this && this._app && this._app.differ;
	  var config = {};
	  var depth = (fragBlock.element.depth || 0) + 1;
	
	  return this._watch(calc, function (value) {
	    config.latestValue = value;
	    if (differ && !config.recorded) {
	      differ.append(type, depth, fragBlock.blockId, function () {
	        var latestValue = config.latestValue;
	        handler(latestValue);
	        config.recorded = false;
	        config.latestValue = undefined;
	      });
	    }
	    config.recorded = true;
	  });
	}
	
	/**
	 * Clone a context and merge certain data.
	 *
	 * @param  {object} mergedData
	 * @return {object}
	 */
	function _mergeContext(mergedData) {
	  var context = Object.create(this);
	  context._data = mergedData;
	  context._initData();
	  context._initComputed();
	  context._realParent = this;
	  return context;
	}

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /**
	                                                                                                                                                                                                                                                   * @fileOverview
	                                                                                                                                                                                                                                                   * Directive Parser
	                                                                                                                                                                                                                                                   */
	
	exports._applyNaitveComponentOptions = _applyNaitveComponentOptions;
	exports._bindElement = _bindElement;
	exports._bindSubVm = _bindSubVm;
	exports._bindSubVmAfterInitialized = _bindSubVmAfterInitialized;
	exports._setId = _setId;
	exports._setAttr = _setAttr;
	exports._setClass = _setClass;
	exports._setStyle = _setStyle;
	exports._setEvent = _setEvent;
	exports._bindEvents = _bindEvents;
	exports._bindDir = _bindDir;
	exports._bindKey = _bindKey;
	exports._watch = _watch;
	
	var _util = __webpack_require__(49);
	
	var _ = _interopRequireWildcard(_util);
	
	var _watcher = __webpack_require__(55);
	
	var _watcher2 = _interopRequireDefault(_watcher);
	
	var _config = __webpack_require__(47);
	
	var _config2 = _interopRequireDefault(_config);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var nativeComponentMap = _config2.default.nativeComponentMap;
	
	
	var SETTERS = {
	  attr: 'setAttr',
	  style: 'setStyle',
	  event: 'addEvent'
	};
	
	/**
	 * apply the native component's options(specified by template.type)
	 * to the template
	 */
	function _applyNaitveComponentOptions(template) {
	  var type = template.type;
	
	  var options = nativeComponentMap[type];
	
	  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
	    for (var key in options) {
	      if (template[key] == null) {
	        template[key] = options[key];
	      } else if (_.typof(template[key]) === 'object' && _.typof(options[key]) === 'object') {
	        for (var subkey in options[key]) {
	          if (template[key][subkey] == null) {
	            template[key][subkey] = options[key][subkey];
	          }
	        }
	      }
	    }
	  }
	}
	
	/**
	 * bind all id, attr, classnames, style, events to an element
	 */
	function _bindElement(el, template) {
	  this._setId(template.id, el, this);
	  this._setAttr(el, template.attr);
	  this._setClass(el, template.classList);
	  this._setStyle(el, template.style);
	  this._bindEvents(el, template.events);
	}
	
	/**
	 * bind all props to sub vm and bind all style, events to the root element
	 * of the sub vm if it doesn't have a replaced multi-node fragment
	 */
	function _bindSubVm(subVm, template, repeatItem) {
	  subVm = subVm || {};
	  template = template || {};
	
	  var options = subVm._options || {};
	
	  // bind props
	  var props = options.props;
	
	  if (Array.isArray(props)) {
	    props = props.reduce(function (result, value) {
	      result[value] = true;
	      return result;
	    }, {});
	  }
	
	  mergeProps(repeatItem, props, this, subVm);
	  mergeProps(template.attr, props, this, subVm);
	}
	
	function _bindSubVmAfterInitialized(subVm, template) {
	  mergeClassStyle(template.classList, this, subVm);
	  mergeStyle(template.style, this, subVm);
	  mergeEvent(template.events, this, subVm);
	}
	
	function mergeProps(target, props, vm, subVm) {
	  if (!target) {
	    return;
	  }
	
	  var _loop = function _loop(key) {
	    if (!props || props[key]) {
	      var value = target[key];
	      if (typeof value === 'function') {
	        var returnValue = vm._watch(value, function (v) {
	          subVm[key] = v;
	        });
	        subVm[key] = returnValue;
	      } else {
	        subVm[key] = value;
	      }
	    }
	  };
	
	  for (var key in target) {
	    _loop(key);
	  }
	}
	
	function mergeStyle(target, vm, subVm) {
	  var _loop2 = function _loop2(key) {
	    var value = target[key];
	    if (typeof value === 'function') {
	      var returnValue = vm._watch(value, function (v) {
	        if (subVm._rootEl) {
	          subVm._rootEl.setStyle(key, v);
	        }
	      });
	      subVm._rootEl.setStyle(key, returnValue);
	    } else {
	      if (subVm._rootEl) {
	        subVm._rootEl.setStyle(key, value);
	      }
	    }
	  };
	
	  for (var key in target) {
	    _loop2(key);
	  }
	}
	
	function mergeClassStyle(target, vm, subVm) {
	  var css = vm._options && vm._options.style || {};
	
	  /* istanbul ignore if */
	  if (!subVm._rootEl) {
	    return;
	  }
	
	  if (typeof target === 'function') {
	    var _value = vm._watch(target, function (v) {
	      setClassStyle(subVm._rootEl, css, v);
	    });
	    setClassStyle(subVm._rootEl, css, _value);
	  } else if (target != null) {
	    setClassStyle(subVm._rootEl, css, target);
	  }
	}
	
	function mergeEvent(target, vm, subVm) {
	  if (target && subVm._rootEl) {
	    for (var type in target) {
	      var handler = vm[target[type]];
	      if (handler) {
	        subVm._rootEl.addEvent(type, _.bind(handler, vm));
	      }
	    }
	  }
	}
	
	/**
	 * bind id to an element
	 * each id is unique in a whole vm
	 */
	function _setId(id, el, vm) {
	  var _this = this;
	
	  var map = Object.create(null);
	
	  Object.defineProperties(map, {
	    vm: {
	      value: vm,
	      writable: false,
	      configurable: false
	    },
	    el: {
	      get: function get() {
	        return el || vm._rootEl;
	      },
	      configurable: false
	    }
	  });
	
	  if (typeof id === 'function') {
	    var handler = id;
	    id = handler.call(this);
	    if (id) {
	      this._ids[id] = map;
	    }
	    this._watch(handler, function (newId) {
	      if (newId) {
	        _this._ids[newId] = map;
	      }
	    });
	  } else if (id && typeof id === 'string') {
	    this._ids[id] = map;
	  }
	}
	
	/**
	 * bind attr to an element
	 */
	function _setAttr(el, attr) {
	  this._bindDir(el, 'attr', attr);
	}
	
	function setClassStyle(el, css, classList) {
	  var classStyle = {};
	  var length = classList.length;
	
	  for (var i = 0; i < length; i++) {
	    var style = css[classList[i]];
	    if (style) {
	      for (var key in style) {
	        classStyle[key] = style[key];
	      }
	    }
	  }
	  el.setClassStyle(classStyle);
	}
	
	/**
	 * bind classnames to an element
	 */
	function _setClass(el, classList) {
	  if (typeof classList !== 'function' && !Array.isArray(classList)) {
	    return;
	  }
	  if (Array.isArray(classList) && !classList.length) {
	    el.setClassStyle({});
	    return;
	  }
	
	  var style = this._options && this._options.style || {};
	  if (typeof classList === 'function') {
	    var _value2 = this._watch(classList, function (v) {
	      setClassStyle(el, style, v);
	    });
	    setClassStyle(el, style, _value2);
	  } else {
	    setClassStyle(el, style, classList);
	  }
	}
	
	/**
	 * bind style to an element
	 */
	function _setStyle(el, style) {
	  this._bindDir(el, 'style', style);
	}
	
	/**
	 * add an event type and handler to an element and generate a dom update
	 */
	function _setEvent(el, type, handler) {
	  el.addEvent(type, _.bind(handler, this));
	}
	
	/**
	 * add all events of an element
	 */
	function _bindEvents(el, events) {
	  if (!events) {
	    return;
	  }
	  var keys = Object.keys(events);
	  var i = keys.length;
	  while (i--) {
	    var key = keys[i];
	    var handler = events[key];
	    if (typeof handler === 'string') {
	      handler = this[handler];
	      /* istanbul ignore if */
	      if (!handler) {
	        _.error('The method "' + handler + '" is not defined.');
	      }
	    }
	    this._setEvent(el, key, handler);
	  }
	}
	
	/**
	 * set a series of members as a kind of an element
	 * for example: style, attr, ...
	 * if the value is a function then bind the data changes
	 */
	function _bindDir(el, name, data) {
	  if (!data) {
	    return;
	  }
	  var keys = Object.keys(data);
	  var i = keys.length;
	  while (i--) {
	    var key = keys[i];
	    var _value3 = data[key];
	    if (typeof _value3 === 'function') {
	      this._bindKey(el, name, key, _value3);
	    } else {
	      el[SETTERS[name]](key, _value3);
	    }
	  }
	}
	
	/**
	 * bind data changes to a certain key to a name series in an element
	 */
	function _bindKey(el, name, key, calc) {
	  var _this2 = this;
	
	  var methodName = SETTERS[name];
	  // watch the calc, and returns a value by calc.call()
	  var value = this._watch(calc, function (value) {
	    function handler() {
	      el[methodName](key, value);
	    }
	    var differ = _this2 && _this2._app && _this2._app.differ;
	    if (differ) {
	      differ.append('element', el.depth, el.ref, handler);
	    } else {
	      handler();
	    }
	  });
	
	  el[methodName](key, value);
	}
	
	/**
	 * watch a calc function and callback if the calc value changes
	 */
	function _watch(calc, callback) {
	  var watcher = new _watcher2.default(this, calc, function (value, oldValue) {
	    /* istanbul ignore if */
	    if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object' && value === oldValue) {
	      return;
	    }
	    callback(value);
	  });
	
	  return watcher.value;
	}

/***/ },
/* 61 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports._createBody = _createBody;
	exports._createElement = _createElement;
	exports._createBlock = _createBlock;
	exports._createBlockStart = _createBlockStart;
	exports._createBlockEnd = _createBlockEnd;
	exports._attachTarget = _attachTarget;
	exports._moveTarget = _moveTarget;
	exports._moveElement = _moveElement;
	exports._moveBlock = _moveBlock;
	exports._removeTarget = _removeTarget;
	exports._removeElement = _removeElement;
	exports._removeBlock = _removeBlock;
	/**
	 * @fileOverview Document & Element Helpers.
	 *
	 * required:
	 * Document#: createElement, createComment, getRef
	 * Element#: appendChild, insertBefore, removeChild, nextSibling
	 */
	
	/**
	 * Create a body by type
	 * Using this._app.doc
	 *
	 * @param  {string} type
	 */
	function _createBody(type) {
	  var doc = this._app.doc;
	  return doc.createBody(type);
	}
	
	/**
	 * Create an element by type
	 * Using this._app.doc
	 *
	 * @param  {string} type
	 */
	function _createElement(type) {
	  var doc = this._app.doc;
	  return doc.createElement(type);
	}
	
	/**
	 * Create and return a frag block for an element.
	 * The frag block has a starter, ender and the element itself.
	 *
	 * @param  {object} element
	 */
	function _createBlock(element) {
	  var start = this._createBlockStart();
	  var end = this._createBlockEnd();
	  var blockId = lastestBlockId++;
	  if (element.element) {
	    element.element.insertBefore(start, element.end);
	    element.element.insertBefore(end, element.end);
	    element = element.element;
	  } else {
	    element.appendChild(start);
	    element.appendChild(end);
	  }
	  return { start: start, end: end, element: element, blockId: blockId };
	}
	
	var lastestBlockId = 1;
	
	/**
	 * Create and return a block starter.
	 * Using this._app.doc
	 */
	function _createBlockStart() {
	  var doc = this._app.doc;
	  var anchor = doc.createComment('start');
	  return anchor;
	}
	
	/**
	 * Create and return a block ender.
	 * Using this._app.doc
	 */
	function _createBlockEnd() {
	  var doc = this._app.doc;
	  var anchor = doc.createComment('end');
	  return anchor;
	}
	
	/**
	 * Attach target to a certain dest using appendChild by default.
	 * If the dest is a frag block then insert before the ender.
	 * If the target is a frag block then attach the starter and ender in order.
	 *
	 * @param  {object} target
	 * @param  {object} dest
	 */
	function _attachTarget(target, dest) {
	  if (dest.element) {
	    var before = dest.end;
	    var after = dest.updateMark;
	    // push new target for watch list update later
	    if (dest.children) {
	      dest.children.push(target);
	    }
	    // for check repeat case
	    if (after) {
	      this._moveTarget(target, after);
	      dest.updateMark = target.element ? target.end : target;
	    } else if (target.element) {
	      dest.element.insertBefore(target.start, before);
	      dest.element.insertBefore(target.end, before);
	    } else {
	      dest.element.insertBefore(target, before);
	    }
	  } else {
	    if (target.element) {
	      dest.appendChild(target.start);
	      dest.appendChild(target.end);
	    } else {
	      dest.appendChild(target);
	    }
	  }
	}
	
	/**
	 * Move target before a certain element. The target maybe block or element.
	 *
	 * @param  {object} target
	 * @param  {object} before
	 */
	function _moveTarget(target, after) {
	  if (target.element) {
	    this._moveBlock(target, after);
	  } else {
	    this._moveElement(target, after);
	  }
	}
	
	/**
	 * Move element before a certain element.
	 *
	 * @param  {object} element
	 * @param  {object} before
	 */
	function _moveElement(element, after) {
	  var parent = after.parentNode;
	  if (parent) {
	    parent.insertAfter(element, after);
	  }
	}
	
	/**
	 * Move all elements of the block before a certain element.
	 *
	 * @param  {object} fragBlock
	 * @param  {object} before
	 */
	function _moveBlock(fragBlock, after) {
	  var parent = after.parentNode;
	
	  if (parent) {
	    (function () {
	      var el = fragBlock.start;
	      var group = [el];
	
	      while (el && el !== fragBlock.end) {
	        el = el.nextSibling;
	        group.push(el);
	      }
	
	      var temp = after;
	      group.forEach(function (el) {
	        parent.insertAfter(el, temp);
	        temp = el;
	      });
	    })();
	  }
	}
	
	/**
	 * Remove target from DOM tree.
	 * If the target is a frag block then call _removeBlock
	 *
	 * @param  {object} target
	 */
	function _removeTarget(target) {
	  if (target.element) {
	    this._removeBlock(target);
	  } else {
	    this._removeElement(target);
	  }
	}
	
	/**
	 * Remove a certain element.
	 * Using this._app.doc
	 *
	 * @param  {object} target
	 */
	function _removeElement(target) {
	  var parent = target.parentNode;
	
	  if (parent) {
	    parent.removeChild(target);
	  }
	}
	
	/**
	 * Remove a frag block.
	 * The second param decides whether the block self should be removed too.
	 *
	 * @param  {object}  fragBlock
	 * @param  {Boolean} preserveBlock=false
	 */
	function _removeBlock(fragBlock) {
	  var _this = this;
	
	  var preserveBlock = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
	
	  var result = [];
	  var el = fragBlock.start.nextSibling;
	
	  while (el && el !== fragBlock.end) {
	    result.push(el);
	    el = el.nextSibling;
	  }
	
	  if (!preserveBlock) {
	    this._removeElement(fragBlock.start);
	  }
	  result.forEach(function (el) {
	    _this._removeElement(el);
	  });
	  if (!preserveBlock) {
	    this._removeElement(fragBlock.end);
	  }
	}

/***/ },
/* 62 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.$emit = $emit;
	exports.$dispatch = $dispatch;
	exports.$broadcast = $broadcast;
	exports.$on = $on;
	exports.$off = $off;
	exports._initEvents = _initEvents;
	function Evt(type, detail) {
	  if (detail instanceof Evt) {
	    return detail;
	  }
	
	  this.timestamp = Date.now();
	  this.detail = detail;
	  this.type = type;
	
	  var shouldStop = false;
	  this.stop = function () {
	    shouldStop = true;
	  };
	  this.hasStopped = function () {
	    return shouldStop;
	  };
	}
	
	function $emit(type, detail) {
	  var _this = this;
	
	  var events = this._vmEvents;
	  var handlerList = events[type];
	  if (handlerList) {
	    (function () {
	      var evt = new Evt(type, detail);
	      handlerList.forEach(function (handler) {
	        handler.call(_this, evt);
	      });
	    })();
	  }
	}
	
	function $dispatch(type, detail) {
	  var evt = new Evt(type, detail);
	  this.$emit(type, evt);
	
	  if (!evt.hasStopped() && this._parent && this._parent.$dispatch) {
	    this._parent.$dispatch(type, evt);
	  }
	}
	
	function $broadcast(type, detail) {
	  var evt = new Evt(type, detail);
	  this.$emit(type, evt);
	
	  if (!evt.hasStopped() && this._childrenVms) {
	    this._childrenVms.forEach(function (subVm) {
	      subVm.$broadcast(type, evt);
	    });
	  }
	}
	
	function $on(type, handler) {
	  if (!type || typeof handler !== 'function') {
	    return;
	  }
	  var events = this._vmEvents;
	  var handlerList = events[type] || [];
	  handlerList.push(handler);
	  events[type] = handlerList;
	
	  // fixed old version lifecycle design
	  if (type === 'hook:ready' && this._ready) {
	    this.$emit('hook:ready');
	  }
	}
	
	function $off(type, handler) {
	  if (!type) {
	    return;
	  }
	  var events = this._vmEvents;
	  if (!handler) {
	    delete events[type];
	    return;
	  }
	  var handlerList = events[type];
	  if (!handlerList) {
	    return;
	  }
	  handlerList.$remove(handler);
	}
	
	var LIFE_CYCLE_TYPES = ['init', 'created', 'ready'];
	
	function _initEvents(externalEvents) {
	  var _this2 = this;
	
	  var options = this._options || {};
	  var events = options.events || {};
	  for (var type1 in events) {
	    this.$on(type1, events[type1]);
	  }
	  for (var type2 in externalEvents) {
	    this.$on(type2, externalEvents[type2]);
	  }
	  LIFE_CYCLE_TYPES.forEach(function (type) {
	    _this2.$on('hook:' + type, options[type]);
	  });
	}

/***/ },
/* 63 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.clearModules = clearModules;
	exports.getModule = getModule;
	exports.requireModule = requireModule;
	exports.registerModules = registerModules;
	exports.registerMethods = registerMethods;
	exports.requireComponent = requireComponent;
	exports.registerComponent = registerComponent;
	var nativeModules = {};
	
	function assignModules(modules, ifReplace) {
	  var _loop = function _loop(moduleName) {
	    // init `modules[moduleName][]`
	    var methods = nativeModules[moduleName];
	    if (!methods) {
	      methods = {};
	      nativeModules[moduleName] = methods;
	    }
	
	    // push each non-existed new method
	    modules[moduleName].forEach(function (method) {
	      if (typeof method === 'string') {
	        method = {
	          name: method
	        };
	      }
	
	      if (!methods[method.name] || ifReplace) {
	        methods[method.name] = method;
	      }
	    });
	  };
	
	  for (var moduleName in modules) {
	    _loop(moduleName);
	  }
	}
	
	function assignApis(Ctor, apis) {
	  var p = Ctor.prototype;
	
	  for (var apiName in apis) {
	    if (!p.hasOwnProperty(apiName)) {
	      p[apiName] = apis[apiName];
	    }
	  }
	}
	
	function clearModules() {
	  nativeModules = {};
	}
	
	function getModule(moduleName) {
	  return nativeModules[moduleName];
	}
	
	/**
	 * @context a instance of AppInstance
	 */
	function requireModule(moduleName) {
	  var _this = this;
	
	  var methods = nativeModules[moduleName];
	  var target = {};
	
	  var _loop2 = function _loop2(methodName) {
	    target[methodName] = function () {
	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }
	
	      return _this.callTasks({
	        module: moduleName,
	        method: methodName,
	        args: args
	      });
	    };
	  };
	
	  for (var methodName in methods) {
	    _loop2(methodName);
	  }
	
	  return target;
	}
	
	/**
	 * @context Vm
	 */
	function registerModules(modules, ifReplace) {
	  assignModules(modules, ifReplace);
	}
	
	/**
	 * @context Vm
	 */
	function registerMethods(apis) {
	  assignApis(this, apis);
	}
	
	/**
	 * @context a instance of AppInstance
	 */
	function requireComponent(name) {
	  var customComponentMap = this.customComponentMap;
	
	  return customComponentMap[name];
	}
	
	/**
	 * @context a instance of AppInstance
	 */
	function registerComponent(name, exports) {
	  var customComponentMap = this.customComponentMap;
	
	
	  if (customComponentMap[name]) {
	    throw new Error('define a component(' + name + ') that already exists');
	  }
	
	  customComponentMap[name] = exports;
	}

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.normalizeVersion = normalizeVersion;
	exports.getError = getError;
	exports.check = check;
	
	var _semver = __webpack_require__(51);
	
	var _semver2 = _interopRequireDefault(_semver);
	
	var _util = __webpack_require__(49);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * [normalizeVersion description]
	 * @param  {String} Version. ie: 1, 1.0, 1.0.0
	 * @return {String} Version
	 */
	function normalizeVersion(v) {
	  var isValid = _semver2.default.valid(v);
	  if (isValid) {
	    return v;
	  }
	
	  v = typeof v === 'string' ? v : '';
	  var split = v.split('.');
	  var i = 0;
	  var result = [];
	
	  while (i < 3) {
	    var s = typeof split[i] === 'string' && split[i] ? split[i] : '0';
	    result.push(s);
	    i++;
	  }
	
	  return result.join('.');
	}
	
	function getError(key, val, criteria) {
	  var result = {
	    isDowngrade: true,
	    errorType: 1,
	    code: 1000
	  };
	  var getMsg = function getMsg(key, val, criteria) {
	    return 'Downgrade[' + key + '] :: deviceInfo ' + val + ' matched criteria ' + criteria;
	  };
	  var _key = key.toLowerCase();
	
	  result.errorMessage = getMsg(key, val, criteria);
	
	  if (_key.indexOf('osversion') >= 0) {
	    result.code = 1001;
	  } else if (_key.indexOf('appversion') >= 0) {
	    result.code = 1002;
	  } else if (_key.indexOf('weexversion') >= 0) {
	    result.code = 1003;
	  } else if (_key.indexOf('devicemodel') >= 0) {
	    result.code = 1004;
	  }
	
	  return result;
	}
	
	/**
	 * WEEX framework input(deviceInfo)
	 * {
	 *   platform: 'iOS' or 'android'
	 *   osVersion: '1.0.0' or '1.0' or '1'
	 *   appVersion: '1.0.0' or '1.0' or '1'
	 *   weexVersion: '1.0.0' or '1.0' or '1'
	 *   dDeviceModel: 'MODEL_NAME'
	 * }
	 *
	 * downgrade config(config)
	 * {
	 *   ios: {
	 *     osVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
	 *     appVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
	 *     weexVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
	 *     deviceModel: ['modelA', 'modelB', ...]
	 *   },
	 *   android: {
	 *     osVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
	 *     appVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
	 *     weexVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
	 *     deviceModel: ['modelA', 'modelB', ...]
	 *   }
	 * }
	 *
	 *
	 * @param  {object} deviceInfo Weex SDK framework input
	 * @param  {object} config     user input
	 * @return {Object}            { isDowngrade: true/false, errorMessage... }
	 */
	function check(config, deviceInfo) {
	  deviceInfo = deviceInfo || global.WXEnvironment;
	  deviceInfo = (0, _util.isPlainObject)(deviceInfo) ? deviceInfo : {};
	
	  var result = {
	    isDowngrade: false // defautl is pass
	  };
	
	  if ((0, _util.typof)(config) === 'function') {
	    var customDowngrade = config.call(this, deviceInfo, {
	      semver: _semver2.default,
	      normalizeVersion: this.normalizeVersion
	    });
	
	    customDowngrade = !!customDowngrade;
	
	    result = customDowngrade ? this.getError('custom', '', 'custom params') : result;
	  } else {
	    config = (0, _util.isPlainObject)(config) ? config : {};
	
	    var platform = deviceInfo.platform || 'unknow';
	    var dPlatform = platform.toLowerCase();
	    var cObj = config[dPlatform] || {};
	
	    for (var i in deviceInfo) {
	      var key = i;
	      var keyLower = key.toLowerCase();
	      var val = deviceInfo[i];
	      var isVersion = keyLower.indexOf('version') >= 0;
	      var isDeviceModel = keyLower.indexOf('devicemodel') >= 0;
	      var criteria = cObj[i];
	
	      if (criteria && isVersion) {
	        var c = this.normalizeVersion(criteria);
	        var d = this.normalizeVersion(deviceInfo[i]);
	
	        if (_semver2.default.satisfies(d, c)) {
	          result = this.getError(key, val, criteria);
	          break;
	        }
	      } else if (isDeviceModel) {
	        var _criteria = (0, _util.typof)(criteria) === 'array' ? criteria : [criteria];
	        if (_criteria.indexOf(val) >= 0) {
	          result = this.getError(key, val, criteria);
	          break;
	        }
	      }
	    }
	  }
	
	  return result;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.updateActions = updateActions;
	exports.init = init;
	exports.destroy = destroy;
	exports.getRootElement = getRootElement;
	exports.fireEvent = fireEvent;
	exports.callback = callback;
	exports.refreshData = refreshData;
	
	var _util = __webpack_require__(49);
	
	var _ = _interopRequireWildcard(_util);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /**
	                                                                                                                                                                                                     * @fileOverview
	                                                                                                                                                                                                     * instance controls from native
	                                                                                                                                                                                                     *
	                                                                                                                                                                                                     * - init bundle
	                                                                                                                                                                                                     * - fire event
	                                                                                                                                                                                                     * - callback
	                                                                                                                                                                                                     * - destroy
	                                                                                                                                                                                                     *
	                                                                                                                                                                                                     * corresponded with the API of instance manager (framework.js)
	                                                                                                                                                                                                     */
	
	function updateActions() {
	  this.differ.flush();
	  var tasks = [];
	  if (this.doc && this.doc.listener && this.doc.listener.updates.length) {
	    tasks.push.apply(tasks, _toConsumableArray(this.doc.listener.updates));
	    this.doc.listener.updates = [];
	  }
	  if (tasks.length) {
	    this.callTasks(tasks);
	  }
	}
	
	function init(code, data) {
	  var _this = this;
	
	  _.debug('Intialize an instance with:\n', code, data);
	
	  var result = void 0;
	  // @see: lib/app/bundle.js
	  var define = _.bind(this.define, this);
	  var bootstrap = function bootstrap(name, config, _data) {
	    result = _this.bootstrap(name, config, _data || data);
	    _this.updateActions();
	    _this.doc.listener.createFinish();
	    _this.doc.close();
	    _.debug('After intialized an instance(' + _this.id + ')');
	  };
	
	  // backward(register/render)
	  var register = _.bind(this.register, this);
	  var render = function render(name, _data) {
	    result = _this.bootstrap(name, {}, _data);
	  };
	
	  var require = function require(name) {
	    return function (_data) {
	      result = _this.bootstrap(name, {}, _data);
	    };
	  };
	
	  var document = this.doc;
	
	  var functionBody = void 0;
	  /* istanbul ignore if */
	  if (typeof code === 'function') {
	    // `function () {...}` -> `{...}`
	    // not very strict
	    functionBody = code.toString().substr(12);
	  } else if (code) {
	    functionBody = code.toString();
	  }
	
	  var fn = new Function('define', 'require', 'document', 'bootstrap', 'register', 'render', '__weex_define__', // alias for define
	  '__weex_bootstrap__', // alias for bootstrap
	  functionBody);
	
	  fn(define, require, document, bootstrap, register, render, define, bootstrap);
	
	  return result;
	}
	
	function destroy() {
	  _.debug('Destory an instance(' + this.id + ')');
	
	  this.id = '';
	  this.options = null;
	  this.blocks = null;
	  this.vm = null;
	  this.doc = null;
	  this.customComponentMap = null;
	  this.callbacks = null;
	}
	
	function getRootElement() {
	  var doc = this.doc || {};
	  var body = doc.body || {};
	  return body.toJSON ? body.toJSON() : {};
	}
	
	function fireEvent(ref, type, e, domChanges) {
	  var _this2 = this;
	
	  _.debug('Fire a "' + type + '" event on an element(' + ref + ')', 'in instance(' + this.id + ')');
	
	  if (Array.isArray(ref)) {
	    ref.some(function (ref) {
	      return _this2.fireEvent(ref, type, e) !== false;
	    });
	    return;
	  }
	
	  var el = this.doc.getRef(ref);
	
	  if (el) {
	    var result = this.doc.fireEvent(el, type, e, domChanges);
	    this.updateActions();
	    this.doc.listener.updateFinish();
	    return result;
	  }
	
	  return new Error('invalid element reference "' + ref + '"');
	}
	
	function callback(callbackId, data, ifKeepAlive) {
	  _.debug('Invoke a callback(' + callbackId + ') with', data, 'in instance(' + this.id + ')');
	
	  var callback = this.callbacks[callbackId];
	
	  if (typeof callback === 'function') {
	    callback(data); // data is already a object, @see: lib/runtime/index.js
	
	    if (typeof ifKeepAlive === 'undefined' || ifKeepAlive === false) {
	      this.callbacks[callbackId] = undefined;
	    }
	
	    this.updateActions();
	    this.doc.listener.updateFinish();
	    return;
	  }
	
	  return new Error('invalid callback id "' + callbackId + '"');
	}
	
	function refreshData(data) {
	  _.debug('Refresh with', data, 'in instance[' + this.id + ']');
	
	  var vm = this.vm;
	
	  if (vm && data) {
	    if (typeof vm.refreshData === 'function') {
	      vm.refreshData(data);
	    } else {
	      _.extend(vm, data);
	    }
	    this.updateActions();
	    this.doc.listener.refreshFinish();
	    return;
	  }
	
	  return new Error('invalid data "' + data + '"');
	}

/***/ },
/* 66 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Differ = function () {
	  function Differ(id) {
	    _classCallCheck(this, Differ);
	
	    this.id = id;
	    this.map = [];
	    this.hooks = [];
	  }
	
	  _createClass(Differ, [{
	    key: 'isEmpty',
	    value: function isEmpty() {
	      return this.map.length === 0;
	    }
	  }, {
	    key: 'append',
	    value: function append(type, depth, ref, handler) {
	      var map = this.map;
	      if (!map[depth]) {
	        map[depth] = {};
	      }
	      var group = map[depth];
	      if (!group[type]) {
	        group[type] = {};
	      }
	      if (type === 'element') {
	        if (!group[type][ref]) {
	          group[type][ref] = [];
	        }
	        group[type][ref].push(handler);
	      } else {
	        group[type][ref] = handler;
	      }
	    }
	  }, {
	    key: 'flush',
	    value: function flush() {
	      var map = this.map.slice();
	      this.map.length = 0;
	      map.forEach(function (group) {
	        callTypeMap(group, 'repeat');
	        callTypeMap(group, 'shown');
	        callTypeList(group, 'element');
	      });
	
	      var hooks = this.hooks.slice();
	      this.hooks.length = 0;
	      hooks.forEach(function (fn) {
	        fn();
	      });
	
	      if (!this.isEmpty()) {
	        this.flush();
	      }
	    }
	  }, {
	    key: 'then',
	    value: function then(fn) {
	      this.hooks.push(fn);
	    }
	  }]);
	
	  return Differ;
	}();
	
	exports.default = Differ;
	
	
	function callTypeMap(group, type) {
	  var map = group[type];
	  for (var ref in map) {
	    map[ref]();
	  }
	}
	
	function callTypeList(group, type) {
	  var map = group[type];
	  for (var ref in map) {
	    var list = map[ref];
	    list.forEach(function (handler) {
	      handler();
	    });
	  }
	}

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.instanceMap = undefined;
	exports.Document = Document;
	exports.Node = Node;
	exports.Element = Element;
	exports.Comment = Comment;
	
	var _listener4 = __webpack_require__(68);
	
	var _listener5 = _interopRequireDefault(_listener4);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var DEFAULT_TAG_NAME = 'div'; /**
	                               * @fileOverview
	                               * A simple virtual dom implementation
	                               */
	
	var instanceMap = exports.instanceMap = {};
	var nextNodeRef = 1;
	
	function Document(id, url, handler) {
	  id = id ? id.toString() : '';
	  this.id = id;
	  this.URL = url;
	
	  instanceMap[id] = this;
	  this.nodeMap = {};
	  this.listener = new _listener5.default(id, handler || genCallTasks(id));
	  this.createDocumentElement();
	}
	
	function genCallTasks(id) {
	  return function (tasks) {
	    if (!Array.isArray(tasks)) {
	      tasks = [tasks];
	    }
	    callNative(id, tasks, '-1');
	  };
	}
	
	Document.prototype.destroy = function () {
	  delete this.listener;
	  delete this.nodeMap;
	  delete instanceMap[this.id];
	};
	
	Document.prototype.open = function () {
	  this.listener.batched = false;
	};
	
	Document.prototype.close = function () {
	  this.listener.batched = true;
	};
	
	Document.prototype.createDocumentElement = function () {
	  var _this = this;
	
	  if (!this.documentElement) {
	    var el = new Element('document');
	    el.docId = this.id;
	    el.ownerDocument = this;
	    el.role = 'documentElement';
	    el.depth = 0;
	    el.ref = '_documentElement';
	    this.nodeMap._documentElement = el;
	    this.documentElement = el;
	    el.appendChild = function (node) {
	      appendBody(_this, node);
	    };
	    el.insertBefore = function (node, before) {
	      appendBody(_this, node, before);
	    };
	  }
	
	  return this.documentElement;
	};
	
	function appendBody(doc, node, before) {
	  var documentElement = doc.documentElement;
	
	
	  if (documentElement.pureChildren.length > 0 || node.parentNode) {
	    return;
	  }
	  var children = documentElement.children;
	  var beforeIndex = children.indexOf(before);
	  if (beforeIndex < 0) {
	    children.push(node);
	  } else {
	    children.splice(beforeIndex, 0, node);
	  }
	
	  if (node.nodeType === 1) {
	    if (node.role === 'body') {
	      node.docId = doc.id;
	      node.ownerDocument = doc;
	      node.parentNode = documentElement;
	    } else {
	      node.children.forEach(function (child) {
	        child.parentNode = node;
	      });
	      setBody(doc, node);
	      node.docId = doc.id;
	      node.ownerDocument = doc;
	      linkParent(node, documentElement);
	      delete doc.nodeMap[node.nodeId];
	    }
	    documentElement.pureChildren.push(node);
	    doc.listener.createBody(node);
	  } else {
	    node.parentNode = documentElement;
	    doc.nodeMap[node.ref] = node;
	  }
	}
	
	function setBody(doc, el) {
	  el.role = 'body';
	  el.depth = 1;
	  delete doc.nodeMap[el.nodeId];
	  el.ref = '_root';
	  doc.nodeMap._root = el;
	  doc.body = el;
	}
	
	Document.prototype.createBody = function (type, props) {
	  if (!this.body) {
	    var el = new Element(type, props);
	    setBody(this, el);
	  }
	
	  return this.body;
	};
	
	Document.prototype.createElement = function (tagName, props) {
	  return new Element(tagName, props);
	};
	
	Document.prototype.createComment = function (text) {
	  return new Comment(text);
	};
	
	Document.prototype.fireEvent = function (el, type, e, domChanges) {
	  if (!el) {
	    return;
	  }
	  e = e || {};
	  e.type = type;
	  e.target = el;
	  e.timestamp = Date.now();
	  if (domChanges) {
	    updateElement(el, domChanges);
	  }
	  return el.fireEvent(type, e);
	};
	
	Document.prototype.getRef = function (ref) {
	  return this.nodeMap[ref];
	};
	
	function updateElement(el, changes) {
	  var attrs = changes.attrs || {};
	  for (var name in attrs) {
	    el.setAttr(name, attrs[name], true);
	  }
	  var style = changes.style || {};
	  for (var _name in style) {
	    el.setStyle(_name, style[_name], true);
	  }
	}
	
	function Node() {
	  this.nodeId = (nextNodeRef++).toString();
	  this.ref = this.nodeId;
	  this.children = [];
	  this.pureChildren = [];
	  this.parentNode = null;
	  this.nextSibling = null;
	  this.previousSibling = null;
	}
	
	Node.prototype.destroy = function () {
	  var doc = instanceMap[this.docId];
	  if (doc) {
	    delete this.docId;
	    delete doc.nodeMap[this.nodeId];
	  }
	  this.children.forEach(function (child) {
	    child.destroy();
	  });
	};
	
	function Element() {
	  var type = arguments.length <= 0 || arguments[0] === undefined ? DEFAULT_TAG_NAME : arguments[0];
	  var props = arguments[1];
	
	  props = props || {};
	  this.nodeType = 1;
	  this.nodeId = (nextNodeRef++).toString();
	  this.ref = this.nodeId;
	  this.type = type;
	  this.attr = props.attr || {};
	  this.classStyle = props.classStyle || {};
	  this.style = props.style || {};
	  this.event = {};
	  this.children = [];
	  this.pureChildren = [];
	}
	
	Element.prototype = new Node();
	
	Element.prototype.appendChild = function (node) {
	  if (node.parentNode && node.parentNode !== this) {
	    return;
	  }
	  if (!node.parentNode) {
	    linkParent(node, this);
	    insertIndex(node, this.children, this.children.length, true);
	    if (this.docId) {
	      registerNode(this.docId, node);
	    }
	    if (node.nodeType === 1) {
	      insertIndex(node, this.pureChildren, this.pureChildren.length);
	      if (this.docId) {
	        var listener = instanceMap[this.docId].listener;
	        listener.addElement(node, this.ref, -1);
	      }
	    }
	  } else {
	    moveIndex(node, this.children, this.children.length, true);
	    if (node.nodeType === 1) {
	      var index = moveIndex(node, this.pureChildren, this.pureChildren.length);
	      if (this.docId && index >= 0) {
	        var _listener = instanceMap[this.docId].listener;
	        _listener.moveElement(node.ref, this.ref, index);
	      }
	    }
	  }
	};
	
	Element.prototype.insertBefore = function (node, before) {
	  if (node.parentNode && node.parentNode !== this) {
	    return;
	  }
	  if (node === before || node.nextSibling === before) {
	    return;
	  }
	  if (!node.parentNode) {
	    linkParent(node, this);
	    insertIndex(node, this.children, this.children.indexOf(before), true);
	    if (this.docId) {
	      registerNode(this.docId, node);
	    }
	    if (node.nodeType === 1) {
	      var pureBefore = nextElement(before);
	      var index = insertIndex(node, this.pureChildren, pureBefore ? this.pureChildren.indexOf(pureBefore) : this.pureChildren.length);
	      if (this.docId) {
	        var listener = instanceMap[this.docId].listener;
	        listener.addElement(node, this.ref, index);
	      }
	    }
	  } else {
	    moveIndex(node, this.children, this.children.indexOf(before), true);
	    if (node.nodeType === 1) {
	      var _pureBefore = nextElement(before);
	      var _index = moveIndex(node, this.pureChildren, _pureBefore ? this.pureChildren.indexOf(_pureBefore) : this.pureChildren.length);
	      if (this.docId && _index >= 0) {
	        var _listener2 = instanceMap[this.docId].listener;
	        _listener2.moveElement(node.ref, this.ref, _index);
	      }
	    }
	  }
	};
	
	Element.prototype.insertAfter = function (node, after) {
	  if (node.parentNode && node.parentNode !== this) {
	    return;
	  }
	  if (node === after || node.previousSibling === after) {
	    return;
	  }
	  if (!node.parentNode) {
	    linkParent(node, this);
	    insertIndex(node, this.children, this.children.indexOf(after) + 1, true);
	    if (this.docId) {
	      registerNode(this.docId, node);
	    }
	    if (node.nodeType === 1) {
	      var index = insertIndex(node, this.pureChildren, this.pureChildren.indexOf(previousElement(after)) + 1);
	      if (this.docId) {
	        var listener = instanceMap[this.docId].listener;
	        listener.addElement(node, this.ref, index);
	      }
	    }
	  } else {
	    moveIndex(node, this.children, this.children.indexOf(after) + 1, true);
	    if (node.nodeType === 1) {
	      var _index2 = moveIndex(node, this.pureChildren, this.pureChildren.indexOf(previousElement(after)) + 1);
	      if (this.docId && _index2 >= 0) {
	        var _listener3 = instanceMap[this.docId].listener;
	        _listener3.moveElement(node.ref, this.ref, _index2);
	      }
	    }
	  }
	};
	
	Element.prototype.removeChild = function (node, preserved) {
	  if (node.parentNode) {
	    removeIndex(node, this.children, true);
	    if (node.nodeType === 1) {
	      removeIndex(node, this.pureChildren);
	      if (this.docId) {
	        var listener = instanceMap[this.docId].listener;
	        listener.removeElement(node.ref);
	      }
	    }
	  }
	  if (!preserved) {
	    node.destroy();
	  }
	};
	
	Element.prototype.clear = function () {
	  var _this2 = this;
	
	  if (this.docId) {
	    (function () {
	      var listener = instanceMap[_this2.docId].listener;
	      _this2.pureChildren.forEach(function (node) {
	        listener.removeElement(node.ref);
	      });
	    })();
	  }
	  this.children.forEach(function (node) {
	    node.destroy();
	  });
	  this.children.length = 0;
	  this.pureChildren.length = 0;
	};
	
	function nextElement(node) {
	  while (node) {
	    if (node.nodeType === 1) {
	      return node;
	    }
	    node = node.nextSibling;
	  }
	}
	
	function previousElement(node) {
	  while (node) {
	    if (node.nodeType === 1) {
	      return node;
	    }
	    node = node.previousSibling;
	  }
	}
	
	function linkParent(node, parent) {
	  node.parentNode = parent;
	  if (parent.docId) {
	    node.docId = parent.docId;
	    node.ownerDocument = parent.ownerDocument;
	    node.ownerDocument.nodeMap[node.nodeId] = node;
	    node.depth = parent.depth + 1;
	  }
	  node.children.forEach(function (child) {
	    linkParent(child, node);
	  });
	}
	
	function registerNode(docId, node) {
	  var doc = instanceMap[docId];
	  doc.nodeMap[node.nodeId] = node;
	}
	
	function insertIndex(target, list, newIndex, changeSibling) {
	  if (newIndex < 0) {
	    newIndex = 0;
	  }
	  var before = list[newIndex - 1];
	  var after = list[newIndex];
	  list.splice(newIndex, 0, target);
	  if (changeSibling) {
	    before && (before.nextSibling = target);
	    target.previousSibling = before;
	    target.nextSibling = after;
	    after && (after.previousSibling = target);
	  }
	  return newIndex;
	}
	
	function moveIndex(target, list, newIndex, changeSibling) {
	  var index = list.indexOf(target);
	  if (index < 0) {
	    return -1;
	  }
	  if (changeSibling) {
	    var before = list[index - 1];
	    var after = list[index + 1];
	    before && (before.nextSibling = after);
	    after && (after.previousSibling = before);
	  }
	  list.splice(index, 1);
	  var newIndexAfter = newIndex;
	  if (index <= newIndex) {
	    newIndexAfter = newIndex - 1;
	  }
	  var beforeNew = list[newIndexAfter - 1];
	  var afterNew = list[newIndexAfter];
	  list.splice(newIndexAfter, 0, target);
	  if (changeSibling) {
	    beforeNew && (beforeNew.nextSibling = target);
	    target.previousSibling = beforeNew;
	    target.nextSibling = afterNew;
	    afterNew && (afterNew.previousSibling = target);
	  }
	  if (index === newIndexAfter) {
	    return -1;
	  }
	  return newIndex;
	}
	
	function removeIndex(target, list, changeSibling) {
	  var index = list.indexOf(target);
	  if (index < 0) {
	    return;
	  }
	  if (changeSibling) {
	    var before = list[index - 1];
	    var after = list[index + 1];
	    before && (before.nextSibling = after);
	    after && (after.previousSibling = before);
	  }
	  list.splice(index, 1);
	}
	
	Element.prototype.setAttr = function (key, value, silent) {
	  if (this.attr[key] === value) {
	    return;
	  }
	  this.attr[key] = value;
	  if (!silent && this.docId) {
	    var listener = instanceMap[this.docId].listener;
	    listener.setAttr(this.ref, key, value);
	  }
	};
	
	Element.prototype.setStyle = function (key, value, silent) {
	  if (this.style[key] === value) {
	    return;
	  }
	  this.style[key] = value;
	  if (!silent && this.docId) {
	    var listener = instanceMap[this.docId].listener;
	    listener.setStyle(this.ref, key, value);
	  }
	};
	
	Element.prototype.setClassStyle = function (classStyle) {
	  this.classStyle = classStyle;
	  if (this.docId) {
	    var listener = instanceMap[this.docId].listener;
	    listener.setStyles(this.ref, this.toStyle());
	  }
	};
	
	Element.prototype.addEvent = function (type, handler) {
	  if (!this.event[type]) {
	    this.event[type] = handler;
	    if (this.docId) {
	      var listener = instanceMap[this.docId].listener;
	      listener.addEvent(this.ref, type);
	    }
	  }
	};
	
	Element.prototype.removeEvent = function (type) {
	  if (this.event[type]) {
	    delete this.event[type];
	    if (this.docId) {
	      var listener = instanceMap[this.docId].listener;
	      listener.removeEvent(this.ref, type);
	    }
	  }
	};
	
	Element.prototype.fireEvent = function (type, e) {
	  var handler = this.event[type];
	  if (handler) {
	    return handler.call(this, e);
	  }
	};
	
	Element.prototype.toStyle = function () {
	  return Object.assign({}, this.classStyle, this.style);
	};
	
	Element.prototype.toJSON = function () {
	  var result = {
	    ref: this.ref.toString(),
	    type: this.type,
	    attr: this.attr,
	    style: this.toStyle()
	  };
	  var event = Object.keys(this.event);
	  if (event.length) {
	    result.event = event;
	  }
	  if (this.pureChildren.length) {
	    result.children = this.pureChildren.map(function (child) {
	      return child.toJSON();
	    });
	  }
	  return result;
	};
	
	Element.prototype.toString = function () {
	  return '<' + this.type + ' attr=' + JSON.stringify(this.attr) + ' style=' + JSON.stringify(this.toStyle()) + '>' + this.pureChildren.map(function (child) {
	    return child.toString();
	  }).join('') + '</' + this.type + '>';
	};
	
	function Comment(value) {
	  this.nodeType = 8;
	  this.nodeId = (nextNodeRef++).toString();
	  this.ref = this.nodeId;
	  this.type = 'comment';
	  this.value = value;
	  this.children = [];
	  this.pureChildren = [];
	}
	
	Comment.prototype = new Node();
	
	Comment.prototype.toString = function () {
	  return '<!-- ' + this.value + ' -->';
	};

/***/ },
/* 68 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = Listener;
	exports.createAction = createAction;
	function Listener(id, handler) {
	  this.id = id;
	  this.batched = false;
	  this.updates = [];
	  if (typeof handler === 'function') {
	    this.handler = handler;
	  }
	}
	
	Listener.prototype.createFinish = function (callback) {
	  var handler = this.handler;
	  handler([createAction('createFinish', [])], callback);
	};
	
	Listener.prototype.updateFinish = function (callback) {
	  var handler = this.handler;
	  handler([createAction('updateFinish', [])], callback);
	};
	
	Listener.prototype.refreshFinish = function (callback) {
	  var handler = this.handler;
	  handler([createAction('refreshFinish', [])], callback);
	};
	
	Listener.prototype.createBody = function (element) {
	  var body = element.toJSON();
	  var children = body.children;
	  delete body.children;
	  var actions = [createAction('createBody', [body])];
	  if (children) {
	    actions.push.apply(actions, children.map(function (child) {
	      return createAction('addElement', [body.ref, child, -1]);
	    }));
	  }
	  this.addActions(actions);
	};
	
	Listener.prototype.addElement = function (element, ref, index) {
	  if (!(index >= 0)) {
	    index = -1;
	  }
	  this.addActions(createAction('addElement', [ref, element.toJSON(), index]));
	};
	
	Listener.prototype.removeElement = function (ref) {
	  if (Array.isArray(ref)) {
	    var actions = ref.map(function (r) {
	      return createAction('removeElement', [r]);
	    });
	    this.addActions(actions);
	  } else {
	    this.addActions(createAction('removeElement', [ref]));
	  }
	};
	
	Listener.prototype.moveElement = function (targetRef, parentRef, index) {
	  this.addActions(createAction('moveElement', [targetRef, parentRef, index]));
	};
	
	Listener.prototype.setAttr = function (ref, key, value) {
	  var result = {};
	  result[key] = value;
	  this.addActions(createAction('updateAttrs', [ref, result]));
	};
	
	Listener.prototype.setStyle = function (ref, key, value) {
	  var result = {};
	  result[key] = value;
	  this.addActions(createAction('updateStyle', [ref, result]));
	};
	
	Listener.prototype.setStyles = function (ref, style) {
	  this.addActions(createAction('updateStyle', [ref, style]));
	};
	
	Listener.prototype.addEvent = function (ref, type) {
	  this.addActions(createAction('addEvent', [ref, type]));
	};
	
	Listener.prototype.removeEvent = function (ref, type) {
	  this.addActions(createAction('removeEvent', [ref, type]));
	};
	
	Listener.prototype.handler = function (actions, cb) {
	  cb && cb();
	};
	
	Listener.prototype.addActions = function (actions) {
	  var updates = this.updates;
	  var handler = this.handler;
	
	  if (!Array.isArray(actions)) {
	    actions = [actions];
	  }
	
	  if (this.batched) {
	    updates.push.apply(updates, actions);
	  } else {
	    handler(actions);
	  }
	};
	
	function createAction(name, args) {
	  return { module: 'dom', method: name, args: args };
	}

/***/ },
/* 69 */
/***/ function(module, exports) {

	module.exports = {
		"name": "weex",
		"version": "0.4.0",
		"description": "A framework for building Mobile cross-platform UI",
		"license": "Apache-2.0",
		"repository": {
			"type": "git",
			"url": "git@github.com:alibaba/weex.git"
		},
		"homepage": "http://alibaba.github.io/weex/",
		"bugs": {
			"url": "https://github.com/alibaba/weex/issues"
		},
		"private": "true",
		"keywords": [
			"weex",
			"hybrid",
			"webcomponent",
			"appframework",
			"mvvm",
			"javascript",
			"webkit",
			"v8",
			"jscore",
			"html5",
			"android",
			"ios",
			"yunos"
		],
		"engines": {
			"node": ">=4"
		},
		"scripts": {
			"postinstall": "bash ./bin/install-hooks.sh",
			"build:browser": "webpack --config build/webpack.browser.config.js",
			"build:native": "webpack --config build/webpack.native.config.js",
			"build:examples": "webpack --config build/webpack.examples.config.js",
			"build:test": "webpack --config build/webpack.test.config.js",
			"dist:browser": "npm run build:browser && bash ./bin/dist-browser.sh",
			"dist": "npm run dist:browser",
			"dev:browser": "webpack --watch --config build/webpack.browser.config.js",
			"dev:native": "webpack --watch --config build/webpack.native.config.js",
			"dev:examples": "webpack --watch --config build/webpack.examples.config.js",
			"dev:test": "webpack --watch --config build/webpack.test.config.js",
			"build": "npm run build:native && npm run build:browser && npm run build:examples && npm run build:test",
			"lint": "eslint html5",
			"test:unit": "mocha --compilers js:babel-core/register html5/test/unit/*/*.js html5/test/unit/*/*/*.js",
			"test:cover": "babel-node node_modules/isparta/bin/isparta cover --report text node_modules/mocha/bin/_mocha -- --reporter dot html5/test/unit/*/*.js html5/test/unit/*/*/*.js",
			"test:e2e": "node html5/test/e2e/runner.js",
			"test": "npm run lint && npm run test:cover && npm run test:e2e",
			"serve": "serve ./ -p 12580",
			"clean:examples": "echo \"\\033[36;1m[Clean]\\033[0m \\033[33mexamples\\033[0m\" && rm -vrf examples/build/*",
			"clean:test": "echo \"\\033[36;1m[Clean]\\033[0m \\033[33mtest\\033[0m\" && rm -vrf test/build/*",
			"clean": "npm run clean:examples && npm run clean:test",
			"copy:js": "cp -vf ./dist/native.js ./android/sdk/assets/main.js",
			"copy:examples": "rm -rf ./android/playground/app/src/main/assets/* && cp -vrf ./examples/build/* ./android/playground/app/src/main/assets/",
			"copy": "npm run copy:js && npm run copy:examples"
		},
		"subversion": {
			"browser": "0.2.23",
			"framework": "0.10.13",
			"transformer": ">=0.1.5 <0.4"
		},
		"dependencies": {
			"animationjs": "^0.1.5",
			"carrousel": "^0.1.11",
			"core-js": "^2.4.0",
			"cubicbezier": "^0.1.1",
			"envd": "^0.1.1",
			"fixedsticky": "^0.1.0",
			"httpurl": "^0.1.1",
			"kountdown": "^0.1.2",
			"lazyimg": "^0.1.2",
			"lie": "^3.0.4",
			"modals": "^0.1.5",
			"scroll-to": "0.0.2",
			"semver": "^5.1.0",
			"transitionize": "0.0.3",
			"weex-components": "^0.1.3"
		},
		"devDependencies": {
			"babel-cli": "~6.4.5",
			"babel-loader": "^6.2.4",
			"babel-preset-es2015": "^6.9.0",
			"chai": "^3.5.0",
			"chromedriver": "^2.21.2",
			"cross-spawn": "^4.0.0",
			"css-loader": "^0.23.1",
			"eslint": "^2.11.1",
			"http-server": "^0.9.0",
			"isparta": "^4.0.0",
			"istanbul": "^0.4.3",
			"json-loader": "^0.5.4",
			"mocha": "^2.5.3",
			"nightwatch": "^0.9.4",
			"phantomjs-prebuilt": "^2.1.7",
			"selenium-server": "^2.53.0",
			"serve": "^1.4.0",
			"sinon": "^1.17.4",
			"sinon-chai": "^2.8.0",
			"style-loader": "^0.13.1",
			"uglify-js": "^2.6.4",
			"webpack": "^1.13.1",
			"weex-loader": "^0.2.0"
		}
	};

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.$ = $;
	exports.$el = $el;
	exports.$vm = $vm;
	exports.$renderThen = $renderThen;
	exports.$scrollTo = $scrollTo;
	exports.$transition = $transition;
	exports.$getConfig = $getConfig;
	exports.$sendHttp = $sendHttp;
	exports.$openURL = $openURL;
	exports.$setTitle = $setTitle;
	exports.$call = $call;
	
	var _util = __webpack_require__(49);
	
	var _ = _interopRequireWildcard(_util);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	/**
	 * ==========================================================
	 * common
	 * ==========================================================
	 */
	
	/**
	 * @deprecated use $vm instead
	 * find the vm by id
	 * Note: there is only one id in whole component
	 * @param  {string} id
	 * @return {Vm}
	 */
	function $(id) {
	  _.warn('Vm#$ is deprecated, please use Vm#$vm instead');
	  var info = this._ids[id];
	  if (info) {
	    return info.vm;
	  }
	}
	
	/**
	 * find the element by id
	 * Note: there is only one id in whole component
	 * @param  {string} id
	 * @return {Element}
	 */
	/**
	 * @fileOverview The api for invoking with "$" prefix
	 */
	function $el(id) {
	  var info = this._ids[id];
	  if (info) {
	    return info.el;
	  }
	}
	
	/**
	 * find the vm of the custom component by id
	 * Note: there is only one id in whole component
	 * @param  {string} id
	 * @return {Vm}
	 */
	function $vm(id) {
	  var info = this._ids[id];
	  if (info) {
	    return info.vm;
	  }
	}
	
	/**
	 * Fire when differ rendering finished
	 *
	 * @param  {Function} fn
	 */
	function $renderThen(fn) {
	  var app = this._app;
	  var differ = app.differ;
	  return differ.then(function () {
	    fn();
	  });
	}
	
	/**
	 * scroll an element specified by id into view,
	 * moreover specify a number of offset optionally
	 * @param  {string} id
	 * @param  {number} offset
	 */
	function $scrollTo(id, offset) {
	  _.warn('Vm#$scrollTo is deprecated, ' + 'please use "require(\'@weex-module/dom\')' + '.scrollTo(el, options)" instead');
	  var el = this.$el(id);
	  if (el) {
	    var dom = this._app.requireModule('dom');
	    dom.scrollToElement(el.ref, { offset: offset });
	  }
	}
	
	/**
	 * perform transition animation on an element specified by id
	 * @param  {string}   id
	 * @param  {object}   options
	 * @param  {object}   options.styles
	 * @param  {object}   options.duration(ms)
	 * @param  {object}   [options.timingFunction]
	 * @param  {object}   [options.delay=0(ms)]
	 * @param  {Function} callback
	 */
	function $transition(id, options, callback) {
	  var _this = this;
	
	  var el = this.$el(id);
	  if (el && options && options.styles) {
	    var animation = this._app.requireModule('animation');
	    animation.transition(el.ref, options, function () {
	      _this._setStyle(el, options.styles);
	      callback && callback.apply(undefined, arguments);
	    });
	  }
	}
	
	/**
	 * get some config
	 * @return {object} some config for app instance
	 * @property {string} bundleUrl
	 * @property {boolean} debug
	 * @property {object} env
	 * @property {string} env.weexVersion(ex. 1.0.0)
	 * @property {string} env.appName(ex. TB/TM)
	 * @property {string} env.appVersion(ex. 5.0.0)
	 * @property {string} env.platform(ex. iOS/Android)
	 * @property {string} env.osVersion(ex. 7.0.0)
	 * @property {string} env.deviceModel **native only**
	 * @property {number} env.[deviceWidth=750]
	 * @property {number} env.deviceHeight
	 */
	function $getConfig(callback) {
	  var config = _.extend({
	    env: global.WXEnvironment || {}
	  }, this._app.options);
	  if (_.typof(callback) === 'function') {
	    _.warn('the callback of Vm#$getConfig(callback) is deprecated, ' + 'this api now can directly RETURN config info.');
	    callback(config);
	  }
	  return config;
	}
	
	/**
	 * @deprecated
	 * request network via http protocol
	 * @param  {object}   params
	 * @param  {Function} callback
	 */
	function $sendHttp(params, callback) {
	  _.warn('Vm#$sendHttp is deprecated, ' + 'please use "require(\'@weex-module/stream\')' + '.sendHttp(params, callback)" instead');
	  var stream = this._app.requireModule('stream');
	  stream.sendHttp(params, callback);
	}
	
	/**
	 * @deprecated
	 * open a url
	 * @param  {string} url
	 */
	function $openURL(url) {
	  _.warn('Vm#$openURL is deprecated, ' + 'please use "require(\'@weex-module/event\')' + '.openURL(url)" instead');
	  var event = this._app.requireModule('event');
	  event.openURL(url);
	}
	
	/**
	 * @deprecated
	 * set a title for page
	 * @param  {string} title
	 */
	function $setTitle(title) {
	  _.warn('Vm#$setTitle is deprecated, ' + 'please use "require(\'@weex-module/pageInfo\')' + '.setTitle(title)" instead');
	  var pageInfo = this._app.requireModule('pageInfo');
	  pageInfo.setTitle(title);
	}
	
	/**
	 * @deprecated use "require('@weex-module/moduleName') instead"
	 * invoke a native method by specifing the name of module and method
	 * @param  {string} moduleName
	 * @param  {string} methodName
	 * @param  {...*} the rest arguments
	 */
	function $call(moduleName, methodName) {
	  _.warn('Vm#$call is deprecated, ' + 'please use "require(\'@weex-module/moduleName\')" instead');
	  var module = this._app.requireModule(moduleName);
	  if (module && module[methodName]) {
	    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
	      args[_key - 2] = arguments[_key];
	    }
	
	    module[methodName].apply(module, args);
	  }
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(72);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./base.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./base.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, "* {\n  margin: 0;\n  padding: 0;\n  text-size-adjust: none;\n}\n\nul, ol {\n  list-style: none;\n}\n", ""]);
	
	// exports


/***/ },
/* 73 */
/***/ function(module, exports) {

	"use strict";
	
	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function () {
		var list = [];
	
		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for (var i = 0; i < this.length; i++) {
				var item = this[i];
				if (item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};
	
		// import a list of modules into the list
		list.i = function (modules, mediaQuery) {
			if (typeof modules === "string") modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for (var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if (typeof id === "number") alreadyImportedModules[id] = true;
			}
			for (i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if (typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if (mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if (mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];
	
	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}
	
		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();
	
		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";
	
		var styles = listToStyles(list);
		addStylesToDom(styles, options);
	
		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}
	
	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}
	
	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}
	
	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}
	
	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}
	
	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}
	
	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}
	
	function addStyle(obj, options) {
		var styleElement, update, remove;
	
		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}
	
		update(obj);
	
		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}
	
	var replaceText = (function () {
		var textStore = [];
	
		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();
	
	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;
	
		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}
	
	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
	
		if(media) {
			styleElement.setAttribute("media", media)
		}
	
		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}
	
	function updateLink(linkElement, obj) {
		var css = obj.css;
		var sourceMap = obj.sourceMap;
	
		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}
	
		var blob = new Blob([css], { type: "text/css" });
	
		var oldSrc = linkElement.href;
	
		linkElement.href = URL.createObjectURL(blob);
	
		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	global.Promise = __webpack_require__(76);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var immediate = __webpack_require__(77);
	
	/* istanbul ignore next */
	function INTERNAL() {}
	
	var handlers = {};
	
	var REJECTED = ['REJECTED'];
	var FULFILLED = ['FULFILLED'];
	var PENDING = ['PENDING'];
	/* istanbul ignore else */
	if (!process.browser) {
	  // in which we actually take advantage of JS scoping
	  var UNHANDLED = ['UNHANDLED'];
	}
	
	module.exports = Promise;
	
	function Promise(resolver) {
	  if (typeof resolver !== 'function') {
	    throw new TypeError('resolver must be a function');
	  }
	  this.state = PENDING;
	  this.queue = [];
	  this.outcome = void 0;
	  /* istanbul ignore else */
	  if (!process.browser) {
	    this.handled = UNHANDLED;
	  }
	  if (resolver !== INTERNAL) {
	    safelyResolveThenable(this, resolver);
	  }
	}
	
	Promise.prototype.catch = function (onRejected) {
	  return this.then(null, onRejected);
	};
	Promise.prototype.then = function (onFulfilled, onRejected) {
	  if (typeof onFulfilled !== 'function' && this.state === FULFILLED || typeof onRejected !== 'function' && this.state === REJECTED) {
	    return this;
	  }
	  var promise = new this.constructor(INTERNAL);
	  /* istanbul ignore else */
	  if (!process.browser) {
	    if (this.handled === UNHANDLED) {
	      this.handled = null;
	    }
	  }
	  if (this.state !== PENDING) {
	    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
	    unwrap(promise, resolver, this.outcome);
	  } else {
	    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
	  }
	
	  return promise;
	};
	function QueueItem(promise, onFulfilled, onRejected) {
	  this.promise = promise;
	  if (typeof onFulfilled === 'function') {
	    this.onFulfilled = onFulfilled;
	    this.callFulfilled = this.otherCallFulfilled;
	  }
	  if (typeof onRejected === 'function') {
	    this.onRejected = onRejected;
	    this.callRejected = this.otherCallRejected;
	  }
	}
	QueueItem.prototype.callFulfilled = function (value) {
	  handlers.resolve(this.promise, value);
	};
	QueueItem.prototype.otherCallFulfilled = function (value) {
	  unwrap(this.promise, this.onFulfilled, value);
	};
	QueueItem.prototype.callRejected = function (value) {
	  handlers.reject(this.promise, value);
	};
	QueueItem.prototype.otherCallRejected = function (value) {
	  unwrap(this.promise, this.onRejected, value);
	};
	
	function unwrap(promise, func, value) {
	  immediate(function () {
	    var returnValue;
	    try {
	      returnValue = func(value);
	    } catch (e) {
	      return handlers.reject(promise, e);
	    }
	    if (returnValue === promise) {
	      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
	    } else {
	      handlers.resolve(promise, returnValue);
	    }
	  });
	}
	
	handlers.resolve = function (self, value) {
	  var result = tryCatch(getThen, value);
	  if (result.status === 'error') {
	    return handlers.reject(self, result.value);
	  }
	  var thenable = result.value;
	
	  if (thenable) {
	    safelyResolveThenable(self, thenable);
	  } else {
	    self.state = FULFILLED;
	    self.outcome = value;
	    var i = -1;
	    var len = self.queue.length;
	    while (++i < len) {
	      self.queue[i].callFulfilled(value);
	    }
	  }
	  return self;
	};
	handlers.reject = function (self, error) {
	  self.state = REJECTED;
	  self.outcome = error;
	  /* istanbul ignore else */
	  if (!process.browser) {
	    if (self.handled === UNHANDLED) {
	      immediate(function () {
	        if (self.handled === UNHANDLED) {
	          process.emit('unhandledRejection', error, self);
	        }
	      });
	    }
	  }
	  var i = -1;
	  var len = self.queue.length;
	  while (++i < len) {
	    self.queue[i].callRejected(error);
	  }
	  return self;
	};
	
	function getThen(obj) {
	  // Make sure we only access the accessor once as required by the spec
	  var then = obj && obj.then;
	  if (obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && typeof then === 'function') {
	    return function appyThen() {
	      then.apply(obj, arguments);
	    };
	  }
	}
	
	function safelyResolveThenable(self, thenable) {
	  // Either fulfill, reject or reject with error
	  var called = false;
	  function onError(value) {
	    if (called) {
	      return;
	    }
	    called = true;
	    handlers.reject(self, value);
	  }
	
	  function onSuccess(value) {
	    if (called) {
	      return;
	    }
	    called = true;
	    handlers.resolve(self, value);
	  }
	
	  function tryToUnwrap() {
	    thenable(onSuccess, onError);
	  }
	
	  var result = tryCatch(tryToUnwrap);
	  if (result.status === 'error') {
	    onError(result.value);
	  }
	}
	
	function tryCatch(func, value) {
	  var out = {};
	  try {
	    out.value = func(value);
	    out.status = 'success';
	  } catch (e) {
	    out.status = 'error';
	    out.value = e;
	  }
	  return out;
	}
	
	Promise.resolve = resolve;
	function resolve(value) {
	  if (value instanceof this) {
	    return value;
	  }
	  return handlers.resolve(new this(INTERNAL), value);
	}
	
	Promise.reject = reject;
	function reject(reason) {
	  var promise = new this(INTERNAL);
	  return handlers.reject(promise, reason);
	}
	
	Promise.all = all;
	function all(iterable) {
	  var self = this;
	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
	    return this.reject(new TypeError('must be an array'));
	  }
	
	  var len = iterable.length;
	  var called = false;
	  if (!len) {
	    return this.resolve([]);
	  }
	
	  var values = new Array(len);
	  var resolved = 0;
	  var i = -1;
	  var promise = new this(INTERNAL);
	
	  while (++i < len) {
	    allResolver(iterable[i], i);
	  }
	  return promise;
	  function allResolver(value, i) {
	    self.resolve(value).then(resolveFromAll, function (error) {
	      if (!called) {
	        called = true;
	        handlers.reject(promise, error);
	      }
	    });
	    function resolveFromAll(outValue) {
	      values[i] = outValue;
	      if (++resolved === len && !called) {
	        called = true;
	        handlers.resolve(promise, values);
	      }
	    }
	  }
	}
	
	Promise.race = race;
	function race(iterable) {
	  var self = this;
	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
	    return this.reject(new TypeError('must be an array'));
	  }
	
	  var len = iterable.length;
	  var called = false;
	  if (!len) {
	    return this.resolve([]);
	  }
	
	  var i = -1;
	  var promise = new this(INTERNAL);
	
	  while (++i < len) {
	    resolver(iterable[i]);
	  }
	  return promise;
	  function resolver(value) {
	    self.resolve(value).then(function (response) {
	      if (!called) {
	        called = true;
	        handlers.resolve(promise, response);
	      }
	    }, function (error) {
	      if (!called) {
	        called = true;
	        handlers.reject(promise, error);
	      }
	    });
	  }
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(52)))

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {'use strict';
	
	var Mutation = global.MutationObserver || global.WebKitMutationObserver;
	
	var scheduleDrain;
	
	if (process.browser) {
	  if (Mutation) {
	    var called = 0;
	    var observer = new Mutation(nextTick);
	    var element = global.document.createTextNode('');
	    observer.observe(element, {
	      characterData: true
	    });
	    scheduleDrain = function scheduleDrain() {
	      element.data = called = ++called % 2;
	    };
	  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
	    var channel = new global.MessageChannel();
	    channel.port1.onmessage = nextTick;
	    scheduleDrain = function scheduleDrain() {
	      channel.port2.postMessage(0);
	    };
	  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
	    scheduleDrain = function scheduleDrain() {
	
	      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	      var scriptEl = global.document.createElement('script');
	      scriptEl.onreadystatechange = function () {
	        nextTick();
	
	        scriptEl.onreadystatechange = null;
	        scriptEl.parentNode.removeChild(scriptEl);
	        scriptEl = null;
	      };
	      global.document.documentElement.appendChild(scriptEl);
	    };
	  } else {
	    scheduleDrain = function scheduleDrain() {
	      setTimeout(nextTick, 0);
	    };
	  }
	} else {
	  scheduleDrain = function scheduleDrain() {
	    process.nextTick(nextTick);
	  };
	}
	
	var draining;
	var queue = [];
	//named nextTick for less confusing stack traces
	function nextTick() {
	  draining = true;
	  var i, oldQueue;
	  var len = queue.length;
	  while (len) {
	    oldQueue = queue;
	    queue = [];
	    i = -1;
	    while (++i < len) {
	      oldQueue[i]();
	    }
	    len = queue.length;
	  }
	  draining = false;
	}
	
	module.exports = immediate;
	function immediate(task) {
	  if (queue.push(task) === 1 && !draining) {
	    scheduleDrain();
	  }
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(52)))

/***/ },
/* 78 */
/***/ function(module, exports) {

	'use strict';
	
	var config = {
	
	  weexVersion: '0.5.0',
	
	  debug: false
	
	};
	
	module.exports = config;

/***/ },
/* 79 */
/***/ function(module, exports) {

	/* global XMLHttpRequest */
	
	'use strict';
	
	function loadByXHR(config, callback) {
	  if (!config.source) {
	    callback(new Error('xhr loader: missing config.source.'));
	  }
	  var xhr = new XMLHttpRequest();
	  xhr.open('GET', config.source);
	  xhr.onload = function () {
	    callback(null, this.responseText);
	  };
	  xhr.onerror = function (error) {
	    callback(error);
	  };
	  xhr.send();
	}
	
	function loadByJsonp(config, callback) {
	  if (!config.source) {
	    callback(new Error('jsonp loader: missing config.source.'));
	  }
	  var callbackName = config.jsonpCallback || 'weexJsonpCallback';
	  window[callbackName] = function (code) {
	    if (code) {
	      callback(null, code);
	    } else {
	      callback(new Error('load by jsonp error'));
	    }
	  };
	  var script = document.createElement('script');
	  script.src = decodeURIComponent(config.source);
	  script.type = 'text/javascript';
	  document.body.appendChild(script);
	}
	
	function loadBySourceCode(config, callback) {
	  // src is the jsbundle.
	  // no need to fetch from anywhere.
	  if (config.source) {
	    callback(null, config.source);
	  } else {
	    callback(new Error('source code laoder: missing config.source.'));
	  }
	}
	
	var callbackMap = {
	  xhr: loadByXHR,
	  jsonp: loadByJsonp,
	  source: loadBySourceCode
	};
	
	function load(options, callback) {
	  var loadFn = callbackMap[options.loader];
	  loadFn(options, callback);
	}
	
	function registerLoader(name, loaderFunc) {
	  if (typeof loaderFunc === 'function') {
	    callbackMap[name] = loaderFunc;
	  }
	}
	
	module.exports = {
	  load: load,
	  registerLoader: registerLoader
	};

/***/ },
/* 80 */
/***/ function(module, exports) {

	/* global Image */
	
	'use strict';
	
	// const WEAPP_STYLE_ID = 'weapp-style'
	
	var _isWebpSupported = false;(function isSupportWebp() {
	  try {
	    (function () {
	      var webP = new Image();
	      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdA' + 'SoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
	      webP.onload = function () {
	        if (webP.height === 2) {
	          _isWebpSupported = true;
	        }
	      };
	    })();
	  } catch (e) {
	    // do nothing.
	  }
	})();
	
	function extend(to, from) {
	  for (var key in from) {
	    to[key] = from[key];
	  }
	  return to;
	}
	
	function isArray(arr) {
	  return Array.isArray ? Array.isArray(arr) : Object.prototype.toString.call(arr) === '[object Array]';
	}
	
	function isPlainObject(obj) {
	  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object';
	}
	
	function getType(obj) {
	  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
	}
	
	function appendStyle(css, styleId, replace) {
	  var style = document.getElementById(styleId);
	  if (style && replace) {
	    style.parentNode.removeChild(style);
	    style = null;
	  }
	  if (!style) {
	    style = document.createElement('style');
	    style.type = 'text/css';
	    styleId && (style.id = styleId);
	    document.getElementsByTagName('head')[0].appendChild(style);
	  }
	  style.appendChild(document.createTextNode(css));
	}
	
	function getUniqueFromArray(arr) {
	  if (!isArray(arr)) {
	    return [];
	  }
	  var res = [];
	  var unique = {};
	  var val = void 0;
	  for (var i = 0, l = arr.length; i < l; i++) {
	    val = arr[i];
	    if (unique[val]) {
	      continue;
	    }
	    unique[val] = true;
	    res.push(val);
	  }
	  return res;
	}
	
	function transitionize(element, props) {
	  var transitions = [];
	  for (var key in props) {
	    transitions.push(key + ' ' + props[key]);
	  }
	  element.style.transition = transitions.join(', ');
	  element.style.webkitTransition = transitions.join(', ');
	}
	
	function detectWebp() {
	  return _isWebpSupported;
	}
	
	function getRandom(num) {
	  var _defaultNum = 10;
	  if (typeof num !== 'number' || num <= 0) {
	    num = _defaultNum;
	  }
	  var _max = Math.pow(10, num);
	  return Math.floor(Date.now() + Math.random() * _max) % _max;
	}
	
	function getRgb(color) {
	  var match = void 0;
	  color = color + '';
	  match = color.match(/#(\d{2})(\d{2})(\d{2})/);
	  if (match) {
	    return {
	      r: parseInt(match[1], 16),
	      g: parseInt(match[2], 16),
	      b: parseInt(match[3], 16)
	    };
	  }
	  match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
	  if (match) {
	    return {
	      r: parseInt(match[1]),
	      g: parseInt(match[2]),
	      b: parseInt(match[3])
	    };
	  }
	}
	
	// direction: 'l' | 'r', default is 'r'
	// num: how many times to loop, should be a positive integer
	function loopArray(arr, num, direction) {
	  if (!isArray(arr)) {
	    return;
	  }
	  var isLeft = (direction + '').toLowerCase() === 'l';
	  var len = arr.length;
	  num = num % len;
	  if (num < 0) {
	    num = -num;
	    isLeft = !isLeft;
	  }
	  if (num === 0) {
	    return arr;
	  }
	  var lp = void 0,
	      rp = void 0;
	  if (isLeft) {
	    lp = arr.slice(0, num);
	    rp = arr.slice(num);
	  } else {
	    lp = arr.slice(0, len - num);
	    rp = arr.slice(len - num);
	  }
	  return rp.concat(lp);
	}
	
	module.exports = {
	  extend: extend,
	  isArray: isArray,
	  isPlainObject: isPlainObject,
	  getType: getType,
	  appendStyle: appendStyle,
	  getUniqueFromArray: getUniqueFromArray,
	  transitionize: transitionize,
	  detectWebp: detectWebp,
	  getRandom: getRandom,
	  getRgb: getRgb,
	  loopArray: loopArray
	};

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// const extend = require('./utils').extend
	
	var isArray = __webpack_require__(80).isArray;
	// const ComponentManager = require('./componentManager')
	
	// for jsframework to register modules.
	var _registerModules = function _registerModules(config) {
	  if (isArray(config)) {
	    for (var i = 0, l = config.length; i < l; i++) {
	      window.registerModules(config[i]);
	    }
	  } else {
	    window.registerModules(config);
	  }
	};
	
	var protocol = {
	
	  // weex instances
	  _instances: {},
	
	  // api meta info
	  _meta: {},
	
	  // Weex.registerApiModule used this to register and access apiModules.
	  apiModule: {},
	
	  injectWeexInstance: function injectWeexInstance(instance) {
	    this._instances[instance.instanceId] = instance;
	  },
	
	  getWeexInstance: function getWeexInstance(instanceId) {
	    return this._instances[instanceId];
	  },
	
	  // get the api method meta info array for the module.
	  getApiModuleMeta: function getApiModuleMeta(moduleName) {
	    var metaObj = {};
	    metaObj[moduleName] = this._meta[moduleName];
	    return metaObj;
	  },
	
	  // Set meta info for a api module.
	  // If there is a same named api, just replace it.
	  // opts:
	  // - metaObj: meta object like
	  // {
	  //    dom: [{
	  //      name: 'addElement',
	  //      args: ['string', 'object']
	  //    }]
	  // }
	  setApiModuleMeta: function setApiModuleMeta(metaObj) {
	    var moduleName = void 0;
	    for (var k in metaObj) {
	      if (metaObj.hasOwnProperty(k)) {
	        moduleName = k;
	      }
	    }
	    var metaArray = this._meta[moduleName];
	    if (!metaArray) {
	      this._meta[moduleName] = metaObj[moduleName];
	    } else {
	      (function () {
	        var nameObj = {};
	        metaObj[moduleName].forEach(function (api) {
	          nameObj[api.name] = api;
	        });
	        metaArray.forEach(function (api, i) {
	          if (nameObj[api.name]) {
	            metaArray[i] = nameObj[api.name];
	            delete nameObj[api.name];
	          }
	        });
	        for (var _k in metaObj) {
	          if (metaObj.hasOwnProperty(_k)) {
	            metaArray.push(metaObj[_k]);
	          }
	        }
	      })();
	    }
	    this._meta[moduleName] = metaObj[moduleName];
	  },
	
	  // Set meta info for a single api.
	  // opts:
	  //  - moduleName: api module name.
	  //  - meta: a meta object like:
	  //  {
	  //    name: 'addElement',
	  //    args: ['string', 'object']
	  //  }
	  setApiMeta: function setApiMeta(moduleName, meta) {
	    var metaArray = this._meta[moduleName];
	    if (!metaArray) {
	      this._meta[moduleName] = [meta];
	    } else {
	      var metaIdx = -1;
	      metaArray.forEach(function (api, i) {
	        var name = void 0; // todo
	        if (meta.name === name) {
	          metaIdx = i;
	        }
	      });
	      if (metaIdx !== -1) {
	        metaArray[metaIdx] = meta;
	      } else {
	        metaArray.push(meta);
	      }
	    }
	  }
	};
	
	_registerModules([{
	  modal: [{
	    name: 'toast',
	    args: ['object', 'function']
	  }, {
	    name: 'alert',
	    args: ['object', 'function']
	  }, {
	    name: 'confirm',
	    args: ['object', 'function']
	  }, {
	    name: 'prompt',
	    args: ['object', 'function']
	  }]
	}, {
	  animation: [{
	    name: 'transition',
	    args: ['string', 'object', 'function']
	  }]
	}]);
	
	module.exports = protocol;

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	/* global Event */
	
	'use strict';
	
	var FrameUpdater = __webpack_require__(83);
	var AppearWatcher = __webpack_require__(84);
	var utils = __webpack_require__(80);
	var LazyLoad = __webpack_require__(85);
	var animation = __webpack_require__(88);
	
	var RENDERING_INDENT = 800;
	
	var _instanceMap = {};
	var typeMap = {};
	var scrollableTypes = ['scroller', 'hscroller', 'vscroller', 'list', 'hlist', 'vlist'];
	
	function ComponentManager(instance) {
	  this.instanceId = instance.instanceId;
	  this.weexInstance = instance;
	  this.componentMap = {};
	  _instanceMap[this.instanceId] = this;
	}
	
	ComponentManager.getInstance = function (instanceId) {
	  return _instanceMap[instanceId];
	};
	
	ComponentManager.getWeexInstance = function (instanceId) {
	  return _instanceMap[instanceId].weexInstance;
	};
	
	ComponentManager.registerComponent = function (type, definition) {
	  typeMap[type] = definition;
	};
	
	ComponentManager.getScrollableTypes = function () {
	  return scrollableTypes;
	};
	
	ComponentManager.prototype = {
	
	  // Fire a event 'renderbegin'/'renderend' on body element.
	  rendering: function rendering() {
	    function _renderingEnd() {
	      // get weex instance root
	      window.dispatchEvent(new Event('renderend'));
	      this._renderingTimer = null;
	    }
	    if (this._renderingTimer) {
	      clearTimeout(this._renderingTimer);
	      this._renderingTimer = setTimeout(_renderingEnd.bind(this), RENDERING_INDENT);
	    } else {
	      window.dispatchEvent(new Event('renderbegin'));
	      this._renderingTimer = setTimeout(_renderingEnd.bind(this), RENDERING_INDENT);
	    }
	  },
	
	  getElementByRef: function getElementByRef(ref) {
	    return this.componentMap[ref];
	  },
	
	  removeElementByRef: function removeElementByRef(ref) {
	    var self = this;
	    if (!ref || !this.componentMap[ref]) {
	      return;
	    }
	    // remove from this.componentMap cursively
	    (function _removeCursively(_ref) {
	      var child = self.componentMap[_ref];
	      var listeners = child._listeners;
	      var children = child.data.children;
	      if (children && children.length) {
	        for (var i = 0, l = children.length; i < l; i++) {
	          _removeCursively(children[i].ref);
	        }
	      }
	      // remove events from _ref component
	      if (listeners) {
	        for (var type in listeners) {
	          child.node.removeEventListener(type, listeners[type]);
	        }
	      }
	      delete child._listeners;
	      delete child.node._listeners;
	      // remove _ref component
	      delete self.componentMap[_ref];
	    })(ref);
	  },
	
	  createElement: function createElement(data, nodeType) {
	    var ComponentType = typeMap[data.type];
	    if (!ComponentType) {
	      ComponentType = typeMap['container'];
	    }
	
	    var ref = data.ref;
	    var component = new ComponentType(data, nodeType);
	
	    this.componentMap[ref] = component;
	    component.node.setAttribute('data-ref', ref);
	
	    return component;
	  },
	
	  /**
	   * createBody: generate root component
	   * @param  {object} element
	   */
	  createBody: function createBody(element) {
	    // TODO: creatbody on document.body
	    // no need to create a extra div
	    if (this.componentMap['_root']) {
	      return;
	    }
	
	    var nodeType = element.type;
	    element.type = 'root';
	    element.rootId = this.weexInstance.rootId;
	    element.ref = '_root';
	
	    var root = this.createElement(element, nodeType);
	    var body = document.querySelector('#' + this.weexInstance.rootId) || document.body;
	    body.appendChild(root.node);
	    root._appended = true;
	
	    this.handleAppend(root);
	  },
	
	  appendChild: function appendChild(parentRef, data) {
	    var parent = this.componentMap[parentRef];
	
	    if (this.componentMap[data.ref] || !parent) {
	      return;
	    }
	
	    if (parentRef === '_root' && !parent) {
	      parent = this.createElement({
	        type: 'root',
	        rootId: this.weexInstance.rootId,
	        ref: '_root'
	      });
	      parent._appended = true;
	    }
	
	    var child = parent.appendChild(data);
	
	    // In some parent component the implementation of method
	    // appendChild didn't return the component at all, therefor
	    // child maybe a undefined object.
	    if (child) {
	      child.parentRef = parentRef;
	    }
	
	    if (child && parent._appended) {
	      this.handleAppend(child);
	    }
	  },
	
	  appendChildren: function appendChildren(ref, elements) {
	    for (var i = 0; i < elements.length; i++) {
	      this.appendChild(ref, elements[i]);
	    }
	  },
	
	  removeElement: function removeElement(ref) {
	    var component = this.componentMap[ref];
	
	    // fire event for rendering dom on body elment.
	    this.rendering();
	
	    if (component && component.parentRef) {
	      var parent = this.componentMap[component.parentRef];
	      component.onRemove && component.onRemove();
	      parent.removeChild(component);
	    } else {
	      console.warn('ref: ', ref);
	    }
	  },
	
	  moveElement: function moveElement(ref, parentRef, index) {
	    var component = this.componentMap[ref];
	    var newParent = this.componentMap[parentRef];
	    var oldParentRef = component.parentRef;
	    var children = void 0,
	        before = void 0,
	        i = void 0,
	        l = void 0;
	    if (!component || !newParent) {
	      console.warn('ref: ', ref);
	      return;
	    }
	
	    // fire event for rendering.
	    this.rendering();
	
	    if (index < -1) {
	      index = -1;
	      console.warn('index cannot be less than -1.');
	    }
	
	    children = newParent.data.children;
	    if (children && children.length && index !== -1 && index < children.length) {
	      before = this.componentMap[newParent.data.children[index].ref];
	    }
	
	    // remove from oldParent.data.children
	    if (oldParentRef && this.componentMap[oldParentRef]) {
	      children = this.componentMap[oldParentRef].data.children;
	      if (children && children.length) {
	        for (i = 0, l = children.length; i < l; i++) {
	          if (children[i].ref === ref) {
	            break;
	          }
	        }
	        if (l > i) {
	          children.splice(i, 1);
	        }
	      }
	    }
	
	    newParent.insertBefore(component, before);
	
	    component.onMove && component.onMove(parentRef, index);
	  },
	
	  insertBefore: function insertBefore(ref, data) {
	    var child = void 0,
	        parent = void 0;
	    var before = this.componentMap[ref];
	    child = this.componentMap[data.ref];
	    before && (parent = this.componentMap[before.parentRef]);
	    if (child || !parent || !before) {
	      return;
	    }
	
	    child = this.createElement(data);
	    if (child) {
	      child.parentRef = before.parentRef;
	      parent.insertBefore(child, before);
	    } else {
	      return;
	    }
	
	    if (this.componentMap[before.parentRef]._appended) {
	      this.handleAppend(child);
	    }
	  },
	
	  /**
	   * addElement
	   * If index is larget than any child's index, the
	   * element will be appended behind.
	   * @param {string} parentRef
	   * @param {obj} element (data of the component)
	   * @param {number} index
	   */
	  addElement: function addElement(parentRef, element, index) {
	    // fire event for rendering dom on body elment.
	    this.rendering();
	
	    var parent = this.componentMap[parentRef];
	    if (!parent) {
	      return;
	    }
	    var children = parent.data.children;
	    // -1 means append as the last.
	    if (index < -1) {
	      index = -1;
	      console.warn('index cannot be less than -1.');
	    }
	    if (children && children.length && children.length > index && index !== -1) {
	      this.insertBefore(children[index].ref, element);
	    } else {
	      this.appendChild(parentRef, element);
	    }
	  },
	
	  clearChildren: function clearChildren(ref) {
	    var component = this.componentMap[ref];
	    if (component) {
	      component.node.innerHTML = '';
	      if (component.data) {
	        component.data.children = null;
	      }
	    }
	  },
	
	  addEvent: function addEvent(ref, type, func) {
	    var _this = this;
	
	    var component = void 0;
	    if (typeof ref === 'string' || typeof ref === 'number') {
	      component = this.componentMap[ref];
	    } else if (utils.getType(ref) === 'object') {
	      component = ref;
	      ref = component.data.ref;
	    }
	    if (component && component.node) {
	      (function () {
	        var sender = _this.weexInstance.sender;
	        var listener = function listener(e) {
	          var evt = utils.extend({}, e);
	          evt.target = component.data;
	          sender.fireEvent(ref, type, func || {}, evt);
	        };
	        component.node.addEventListener(type, listener, false, false);
	        var listeners = component._listeners;
	        if (!listeners) {
	          listeners = component._listeners = {};
	          component.node._listeners = {};
	        }
	        listeners[type] = listener;
	        component.node._listeners[type] = listener;
	      })();
	    }
	  },
	
	  removeEvent: function removeEvent(ref, type) {
	    var component = this.componentMap[ref];
	    var listener = component._listeners[type];
	    if (component && listener) {
	      component.node.removeEventListener(type, listener);
	      component._listeners[type] = null;
	      component.node._listeners[type] = null;
	    }
	  },
	
	  updateAttrs: function updateAttrs(ref, attr) {
	    var component = this.componentMap[ref];
	    if (component) {
	      component.updateAttrs(attr);
	      if (component.data.type === 'image' && attr.src) {
	        LazyLoad.startIfNeeded(component);
	      }
	    }
	  },
	
	  updateStyle: function updateStyle(ref, style) {
	    var component = this.componentMap[ref];
	    if (component) {
	      component.updateStyle(style);
	    }
	  },
	
	  updateFullAttrs: function updateFullAttrs(ref, attr) {
	    var component = this.componentMap[ref];
	    if (component) {
	      component.clearAttr();
	      component.updateAttrs(attr);
	      if (component.data.type === 'image' && attr.src) {
	        LazyLoad.startIfNeeded(component);
	      }
	    }
	  },
	
	  updateFullStyle: function updateFullStyle(ref, style) {
	    var component = this.componentMap[ref];
	    if (component) {
	      component.clearStyle();
	      component.updateStyle(style);
	    }
	  },
	
	  handleAppend: function handleAppend(component) {
	    component._appended = true;
	    component.onAppend && component.onAppend();
	
	    // invoke onAppend on children recursively
	    var children = component.data.children;
	    if (children) {
	      for (var i = 0; i < children.length; i++) {
	        var child = this.componentMap[children[i].ref];
	        if (child) {
	          this.handleAppend(child);
	        }
	      }
	    }
	
	    // watch appear/disappear of the component if needed
	    AppearWatcher.watchIfNeeded(component);
	
	    // do lazyload if needed
	    LazyLoad.startIfNeeded(component);
	  },
	
	  transition: function transition(ref, config, callback) {
	    var component = this.componentMap[ref];
	    animation.transitionOnce(component, config, callback);
	  },
	
	  renderFinish: function renderFinish() {
	    FrameUpdater.pause();
	  }
	};
	
	module.exports = ComponentManager;

/***/ },
/* 83 */
/***/ function(module, exports) {

	'use strict';
	
	var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function (calllback) {
	  setTimeout(calllback, 16);
	};
	
	var rafId = void 0;
	var observers = [];
	var paused = false;
	
	var FrameUpdater = {
	  start: function start() {
	    if (rafId) {
	      return;
	    }
	
	    rafId = raf(function runLoop() {
	      if (!paused) {
	        for (var i = 0; i < observers.length; i++) {
	          observers[i]();
	        }
	        raf(runLoop);
	      }
	    });
	  },
	
	  isActive: function isActive() {
	    return !paused;
	  },
	
	  pause: function pause() {
	    paused = true;
	    rafId = undefined;
	  },
	
	  resume: function resume() {
	    paused = false;
	    this.start();
	  },
	
	  addUpdateObserver: function addUpdateObserver(observeMethod) {
	    observers.push(observeMethod);
	  }
	};
	
	module.exports = FrameUpdater;

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(80);
	
	var componentsInScroller = [];
	var componentsOutOfScroller = [];
	var listened = false;
	var direction = 'up';
	var scrollY = 0;
	
	var AppearWatcher = {
	  watchIfNeeded: function watchIfNeeded(component) {
	    if (needWatch(component)) {
	      if (component.isInScrollable()) {
	        componentsInScroller.push(component);
	      } else {
	        componentsOutOfScroller.push(component);
	      }
	      if (!listened) {
	        listened = true;
	        // const handler = throttle(onScroll, 25)
	        var handler = throttle(onScroll, 100);
	        window.addEventListener('scroll', handler, false);
	      }
	    }
	  }
	};
	
	function needWatch(component) {
	  var events = component.data.event;
	  if (events && (events.indexOf('appear') !== -1 || events.indexOf('disappear') !== -1)) {
	    return true;
	  }
	  return false;
	}
	
	function onScroll(e) {
	  // If the scroll event is dispatched from a scrollable component
	  // implemented through scrollerjs, then the appear/disappear events
	  // should be treated specially by handleScrollerScroll.
	  if (e.originalType === 'scrolling') {
	    handleScrollerScroll(e);
	  } else {
	    handleWindowScroll();
	  }
	}
	
	function handleScrollerScroll(e) {
	  var cmps = componentsInScroller;
	  var len = cmps.length;
	  direction = e.direction;
	  for (var i = 0; i < len; i++) {
	    var component = cmps[i];
	    var appear = isComponentInScrollerAppear(component);
	    if (appear && !component._appear) {
	      component._appear = true;
	      fireEvent(component, 'appear');
	    } else if (!appear && component._appear) {
	      component._appear = false;
	      fireEvent(component, 'disappear');
	    }
	  }
	}
	
	function handleWindowScroll() {
	  var y = window.scrollY;
	  direction = y >= scrollY ? 'up' : 'down';
	  scrollY = y;
	
	  var len = componentsOutOfScroller.length;
	  if (len === 0) {
	    return;
	  }
	  for (var i = 0; i < len; i++) {
	    var component = componentsOutOfScroller[i];
	    var appear = isComponentInWindow(component);
	    if (appear && !component._appear) {
	      component._appear = true;
	      fireEvent(component, 'appear');
	    } else if (!appear && component._appear) {
	      component._appear = false;
	      fireEvent(component, 'disappear');
	    }
	  }
	}
	
	function isComponentInScrollerAppear(component) {
	  var parentScroller = component._parentScroller;
	  var cmpRect = component.node.getBoundingClientRect();
	  if (!isComponentInWindow(component)) {
	    return false;
	  }
	  while (parentScroller) {
	    var parentRect = parentScroller.node.getBoundingClientRect();
	    if (!(cmpRect.right > parentRect.left && cmpRect.left < parentRect.right && cmpRect.bottom > parentRect.top && cmpRect.top < parentRect.bottom)) {
	      return false;
	    }
	    parentScroller = parentScroller._parentScroller;
	  }
	  return true;
	}
	
	function isComponentInWindow(component) {
	  var rect = component.node.getBoundingClientRect();
	  return rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight;
	}
	
	function fireEvent(component, type) {
	  var evt = document.createEvent('HTMLEvents');
	  var data = { direction: direction };
	  evt.initEvent(type, false, false);
	  evt.data = data;
	  utils.extend(evt, data);
	  component.node.dispatchEvent(evt);
	}
	
	function throttle(func, wait) {
	  var context = void 0,
	      args = void 0,
	      result = void 0;
	  var timeout = null;
	  var previous = 0;
	  var later = function later() {
	    previous = Date.now();
	    timeout = null;
	    result = func.apply(context, args);
	  };
	  return function () {
	    var now = Date.now();
	    var remaining = wait - (now - previous);
	    context = this;
	    args = arguments;
	    if (remaining <= 0) {
	      clearTimeout(timeout);
	      timeout = null;
	      previous = now;
	      result = func.apply(context, args);
	    } else if (!timeout) {
	      timeout = setTimeout(later, remaining);
	    }
	    return result;
	  };
	}
	
	module.exports = AppearWatcher;

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	/* global lib */
	
	'use strict';
	
	__webpack_require__(86);
	
	var lazyloadTimer = void 0;
	
	var LazyLoad = {
	  makeImageLazy: function makeImageLazy(image, src) {
	    image.removeAttribute('img-src');
	    image.removeAttribute('i-lazy-src');
	    image.removeAttribute('src');
	    image.setAttribute('img-src', src);
	    // should replace 'src' with 'img-src'. but for now lib.img.fire is
	    // not working for the situation that the appear event has been
	    // already triggered.
	    // image.setAttribute('src', src)
	    // image.setAttribute('img-src', src)
	    this.fire();
	  },
	
	  // we don't know when all image are appended
	  // just use setTimeout to do delay lazyload
	  //
	  // -- actually everytime we add a element or update styles,
	  // the component manager will call startIfNeed to fire
	  // lazyload once again in the handleAppend function. so there
	  // is no way that any image element can miss it. See source
	  // code in componentMangager.js.
	  startIfNeeded: function startIfNeeded(component) {
	    var that = this;
	    if (component.data.type === 'image') {
	      if (!lazyloadTimer) {
	        lazyloadTimer = setTimeout(function () {
	          that.fire();
	          clearTimeout(lazyloadTimer);
	          lazyloadTimer = null;
	        }, 16);
	      }
	    }
	  },
	
	  loadIfNeeded: function loadIfNeeded(elementScope) {
	    var notPreProcessed = elementScope.querySelectorAll('[img-src]');
	    var that = this;
	    // image elements which have attribute 'i-lazy-src' were elements
	    // that had been preprocessed by lib-img-core, but not loaded yet, and
	    // must be loaded when 'appear' events were fired. It turns out the
	    // 'appear' event was not fired correctly in the css-translate-transition
	    // situation, so 'i-lazy-src' must be checked and lazyload must be
	    // fired manually.
	    var preProcessed = elementScope.querySelectorAll('[i-lazy-src]');
	    if (notPreProcessed.length > 0 || preProcessed.length > 0) {
	      that.fire();
	    }
	  },
	
	  // fire lazyload.
	  fire: function fire() {
	    lib.img.fire();
	  }
	
	};
	
	module.exports = LazyLoad;

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/*
	    lib-img-adpter 
	    Author: kongshi.wl@alibaba-inc.com 
	    Date:   Dec,2015
	*/
	;
	
	(function (win, lib) {
	    __webpack_require__(87);
	
	    var adapter = {};
	    var appearInstance;
	    var runtimeFlags = {};
	
	    var config = {
	        'dataSrc': 'img-src', //指定图片地址的attribute名, 兼做lazy-class的作用
	        'lazyHeight': 0, //以此高度提前触发懒加载
	        'lazyWidth': 0 //以此宽度提前触发懒加载
	    };
	
	    function extendStrict(main, sub) {
	        var ret = {};
	        for (var k in main) {
	            if (main.hasOwnProperty(k)) {
	                ret[k] = sub.hasOwnProperty(k) ? sub[k] : main[k];
	            }
	        }
	        return ret;
	    }
	
	    function applySrc(item, processedSrc) {
	        if (!processedSrc) {
	            return;
	        }
	        if (item.nodeName.toUpperCase() == 'IMG') {
	            item.setAttribute('src', processedSrc);
	        } else {
	            item.style.backgroundImage = 'url("' + processedSrc + '")';
	        }
	    }
	
	    function init() {
	        appearInstance = lib.appear.init({
	            cls: 'imgtmp', //可选，需要遍历的元素
	            once: true, //可选，是否只触发一次
	            x: config.lazyWidth, //可选，容器右边距离x以内的元素加载，默认为0
	            y: config.lazyHeight, //可选，容器底部距离y以内的元素加载，默认为0
	            onAppear: function onAppear(evt) {
	                var item = this;
	                applySrc(item, item.getAttribute('i-lazy-src'));
	                item.removeAttribute('i-lazy-src');
	            }
	        });
	    }
	
	    adapter.logConfig = function () {
	        console.log('lib-img Config\n', config);
	    };
	
	    adapter.fire = function () {
	
	        if (!appearInstance) {
	            init();
	        }
	
	        var label = 'i_' + Date.now() % 100000;
	        var domList = document.querySelectorAll('[' + config.dataSrc + ']');
	
	        [].forEach.call(domList, function (item) {
	            if (item.dataset.lazy == 'false' && item.dataset.lazy != 'true') {
	                applySrc(item, processSrc(item, item.getAttribute(config.dataSrc)));
	            } else {
	                item.classList.add(label);
	                item.setAttribute('i-lazy-src', item.getAttribute(config.dataSrc));
	            }
	            item.removeAttribute(config.dataSrc);
	        });
	
	        appearInstance.bind('.' + label);
	        appearInstance.fire();
	    };
	
	    adapter.defaultSrc = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==';
	
	    lib.img = adapter;
	
	    module.exports = adapter;
	})(window, window['lib'] || (window['lib'] = {}));

/***/ },
/* 87 */
/***/ function(module, exports) {

	"use strict";
	
	;
	(function (win, lib) {
	  var doc = document;
	  var appearEvt;
	  var disappearEvt;
	
	  function createEvent() {
	    appearEvt = doc.createEvent("HTMLEvents"); //创建自定义显示事件 
	    disappearEvt = doc.createEvent("HTMLEvents"); //创建自定义消失事件 
	    appearEvt.initEvent('_appear', false, true);
	    disappearEvt.initEvent('_disappear', false, true);
	  }
	
	  /**
	   * [throttle 节流函数]
	   * @param  {[function]} func [执行函数]
	   * @param  {[int]} wait [等待时长]
	   * @return {[type]}      [description]
	   */
	  function throttle(func, wait) {
	    var latest = Date.now(),
	        previous = 0,
	        //上次执行的时间
	    timeout = null,
	        //setTimout任务
	    context,
	        //上下文
	    args,
	        //参数
	    result; //结果
	    var later = function later() {
	      previous = Date.now();
	      timeout = null; //清空计时器
	      func.apply(context, args);
	    };
	    return function () {
	      var now = Date.now();
	      context = this;
	      args = arguments;
	
	      var remaining = wait - (now - previous);
	      if (remaining <= 0 || remaining >= wait) {
	        //如果没有剩余时间，或者存在修改过系统时间导致剩余时间增大的情况，则执行
	        clearTimeout(timeout);
	        timeout = null;
	        result = func.apply(context, args);
	      } else if (timeout == null) {
	        timeout = setTimeout(later, remaining);
	      }
	      return result;
	    };
	  }
	
	  /**
	   * [getOffset 获取边距尺寸]
	   * @param  {[type]} el   [description]
	   * @param  {[type]} param [description]
	   * @return {[type]}       [description]
	   */
	  function getOffset(el, param) {
	    var el, l, r, b, t;
	    if (!el) {
	      return;
	    }
	    if (!param) {
	      param = { x: 0, y: 0 };
	    }
	
	    if (el != window) {
	      el = el.getBoundingClientRect();
	      l = el.left;
	      t = el.top;
	      r = el.right;
	      b = el.bottom;
	    } else {
	      l = 0;
	      t = 0;
	      r = l + el.innerWidth;
	      b = t + el.innerHeight;
	    }
	    return {
	      'left': l,
	      'top': t,
	      'right': r + param.x,
	      'bottom': b + param.y
	    };
	  }
	  //元素位置比较
	  function compareOffset(d1, d2) {
	    var left = d2.right > d1.left && d2.left < d1.right;
	    var top = d2.bottom > d1.top && d2.top < d1.bottom;
	    return left && top;
	  }
	  //获取移动方向
	  function getDirection(beforeOffset, nowOffset) {
	    var direction = 'none';
	    var horizental = beforeOffset.left - nowOffset.left;
	    var vertical = beforeOffset.top - nowOffset.top;
	    if (vertical == 0) {
	      if (horizental != 0) {
	        direction = horizental > 0 ? 'left' : 'right';
	      } else {
	        direction = 'none';
	      }
	    }
	    if (horizental == 0) {
	      if (vertical != 0) {
	        direction = vertical > 0 ? 'up' : 'down';
	      } else {
	        direction = 'none';
	      }
	    }
	    return direction;
	  }
	
	  function extend(target, el) {
	    for (var k in el) {
	      if (el.hasOwnProperty(k)) {
	        target[k] = el[k];
	      }
	    }
	    return target;
	  }
	
	  /**
	   * [__bindEvent 绑定事件，包括滚动、touchmove、transform、resize等]
	   * @return {[type]}      [description]
	   */
	  function __bindEvent() {
	    var self = this;
	    var handle = throttle(function () {
	      __fire.apply(self, arguments);
	    }, this.options.wait);
	    if (this.__handle) {
	      //避免重复绑定
	      this.container.removeEventListener('scroll', this.__handle);
	      this.__handle = null;
	    }
	    this.__handle = handle;
	    this.container.addEventListener('scroll', handle, false);
	    this.container.addEventListener('resize', function (ev) {
	      __fire.apply(self, arguments);
	    }, false);
	    this.container.addEventListener('animationEnd', function () {
	      __fire.apply(self, arguments);
	    }, false);
	    // android4.0以下
	    this.container.addEventListener('webkitAnimationEnd', function () {
	      __fire.apply(self, arguments);
	    }, false);
	    this.container.addEventListener('transitionend', function () {
	      __fire.apply(self, arguments);
	    }, false);
	  }
	
	  //获取容器内所有的加载元素
	  function __getElements(selector) {
	    var self = this;
	    //获取容器
	    var container = this.options.container;
	    if (typeof container == 'string') {
	      //如果是字符串，则选择器
	      this.container = doc.querySelector(container);
	    } else {
	      //对象传值
	      this.container = container;
	    }
	    //获取容器内的所有目标元素
	    if (this.container == window) {
	      var appearWatchElements = doc.querySelectorAll(selector);
	    } else {
	      var appearWatchElements = this.container.querySelectorAll(selector);
	    }
	    var appearWatchElements = [].slice.call(appearWatchElements, null);
	
	    appearWatchElements = appearWatchElements.filter(function (ele) {
	      // 如果已经绑定过，清除appear状态，不再加入到数组里
	      if (ele.dataset['bind'] == '1') {
	        delete ele._hasAppear;
	        delete ele._hasDisAppear;
	        delete ele._appear;
	        ele.classList.remove(self.options.cls);
	        return false;
	      } else {
	        return true;
	      }
	    });
	
	    return appearWatchElements;
	  }
	
	  function __initBoundingRect(elements) {
	    var self = this;
	    if (elements && elements.length > 0) {
	      [].forEach.call(elements, function (ele) {
	        ele._eleOffset = getOffset(ele);
	        //移除类名
	        ele.classList.remove(self.options.cls);
	        // 标志已经绑定
	        ele.dataset['bind'] = 1;
	      });
	    }
	  }
	
	  // 触发加载
	  function __fire() {
	    var container = this.container,
	        elements = this.appearWatchElements,
	        appearCallback = this.options.onAppear,
	        //appear的执行函数
	    disappearCallback = this.options.onDisappear,
	        //disappear的执行函数
	    containerOffset = getOffset(container, {
	      x: this.options.x,
	      y: this.options.y
	    }),
	        isOnce = this.options.once,
	        //是否只执行一次
	    ev = arguments[0] || {};
	    if (elements && elements.length > 0) {
	      [].forEach.call(elements, function (ele, i) {
	        //获取左右距离
	        var eleOffset = getOffset(ele);
	        var direction = getDirection(ele._eleOffset, eleOffset);
	        //保存上个时段的位置信息
	        ele._eleOffset = eleOffset;
	        //查看是否在可视区域范围内
	        var isInView = compareOffset(containerOffset, eleOffset);
	        var appear = ele._appear;
	        var _hasAppear = ele._hasAppear;
	        var _hasDisAppear = ele._hasDisAppear;
	        appearEvt.data = {
	          direction: direction
	        };
	        disappearEvt.data = {
	          direction: direction
	        };
	        if (isInView && !appear) {
	          if (isOnce && !_hasAppear || !isOnce) {
	            //如果只触发一次并且没有触发过或者允许触发多次
	            //如果在可视区域内，并且是从disppear进入appear，则执行回调
	            appearCallback && appearCallback.call(ele, ev);
	            //触发自定义事件
	            ele.dispatchEvent(appearEvt);
	            ele._hasAppear = true;
	            ele._appear = true;
	          }
	        } else if (!isInView && appear) {
	          if (isOnce && !_hasDisAppear || !isOnce) {
	            //如果不在可视区域内，并且是从appear进入disappear，执行disappear回调
	            disappearCallback && disappearCallback.call(ele, ev);
	            //触发自定义事件
	            ele.dispatchEvent(disappearEvt);
	            ele._hasDisAppear = true;
	            ele._appear = false;
	          }
	        }
	      });
	    }
	  }
	
	  // proto = extend(proto, listener);
	
	  function __init(opts) {
	    //扩展参数
	    extend(this.options, opts || (opts = {}));
	    //获取目标元素
	    this.appearWatchElements = this.appearWatchElements || __getElements.call(this, '.' + this.options.cls);
	    //初始化位置信息
	    __initBoundingRect.call(this, this.appearWatchElements);
	    //绑定事件
	    __bindEvent.call(this);
	  }
	
	  var Appear = function Appear() {
	    __init.apply(this, arguments);
	  };
	
	  var appear = {
	    instances: [],
	    init: function init(opts) {
	      var proto = {
	        //默认参数
	        options: {
	          container: window,
	          wait: 100,
	          x: 0,
	          y: 0,
	          cls: 'lib-appear',
	          once: false,
	          onReset: function onReset() {},
	          onAppear: function onAppear() {},
	          onDisappear: function onDisappear() {}
	        },
	        container: null,
	        appearWatchElements: null,
	        bind: function bind(node) {
	          var cls = this.options.cls;
	          // 添加需要绑定的appear元素
	          if (typeof node == 'string') {
	            var elements = __getElements.call(this, node);
	            [].forEach.call(elements, function (ele, i) {
	              if (!ele.classList.contains(cls)) {
	                ele.classList.add(cls);
	              }
	            });
	          } else if (node.nodeType == 1 && this.container.contains(node)) {
	            //如果传入的是元素并且在包含在容器中，直接添加类名
	            if (!node.classList.contains(cls)) {
	              //添加类名
	              node.classList.add(cls);
	            }
	          } else {
	            return this;
	          }
	          //新增的子元素
	          var newElements = __getElements.call(this, '.' + this.options.cls);
	          //对缓存的子元素做增量
	          this.appearWatchElements = this.appearWatchElements.concat(newElements);
	          //初始化新子元素的位置信息
	          __initBoundingRect.call(this, newElements);
	          return this;
	        },
	        // 重置函数
	        reset: function reset(opts) {
	          __init.call(this, opts);
	          this.appearWatchElements.forEach(function (ele) {
	            delete ele._hasAppear;
	            delete ele._hasDisAppear;
	            delete ele._appear;
	          });
	          return this;
	        },
	        fire: function fire() {
	          if (!this.appearWatchElements) {
	            this.appearWatchElements = [];
	          }
	          var newElements = __getElements.call(this, '.' + this.options.cls);
	          this.appearWatchElements = this.appearWatchElements.concat(newElements);
	          //初始化位置信息
	          __initBoundingRect.call(this, newElements);
	          __fire.call(this);
	          return this;
	        }
	      };
	      Appear.prototype = proto;
	      var instance = new Appear(opts);
	      this.instances.push(instance);
	      return instance;
	    },
	    fireAll: function fireAll() {
	      var instances = this.instances;
	      instances.forEach(function (instance) {
	        instance.fire();
	      });
	    }
	  };
	  //注册事件
	  createEvent();
	
	  lib.appear = appear;
	})(window, window.lib || (window.lib = {}));

/***/ },
/* 88 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = {
	
	  /**
	   * config:
	   *   - styles
	   *   - duration [Number] milliseconds(ms)
	   *   - timingFunction [string]
	   *   - dealy [Number] milliseconds(ms)
	   */
	  transitionOnce: function transitionOnce(comp, config, callback) {
	    var styles = config.styles || {};
	    var duration = config.duration || 1000; // ms
	    var timingFunction = config.timingFunction || 'ease';
	    var delay = config.delay || 0; // ms
	    var transitionValue = 'all ' + duration + 'ms ' + timingFunction + ' ' + delay + 'ms';
	    var dom = comp.node;
	    var transitionEndHandler = function transitionEndHandler(e) {
	      e.stopPropagation();
	      dom.removeEventListener('webkitTransitionEnd', transitionEndHandler);
	      dom.removeEventListener('transitionend', transitionEndHandler);
	      dom.style.transition = '';
	      dom.style.webkitTransition = '';
	      callback();
	    };
	    dom.style.transition = transitionValue;
	    dom.style.webkitTransition = transitionValue;
	    dom.addEventListener('webkitTransitionEnd', transitionEndHandler);
	    dom.addEventListener('transitionend', transitionEndHandler);
	    comp.updateStyle(styles);
	  }
	
	};

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	/* global lib */
	
	'use strict';
	
	// const config = require('../config')
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var utils = __webpack_require__(80);
	var ComponentManager = __webpack_require__(82);
	var flexbox = __webpack_require__(90);
	var valueFilter = __webpack_require__(91);
	__webpack_require__(92);
	
	function Component(data, nodeType) {
	  this.data = data;
	  this.node = this.create(nodeType);
	
	  this.createChildren();
	  this.updateAttrs(this.data.attr);
	  // issue: when add element to a list in lifetime hook 'ready', the
	  // styles is set to the classStyle, not style. This is a issue
	  // that jsframework should do something about.
	  var classStyle = this.data.classStyle;
	  classStyle && this.updateStyle(this.data.classStyle);
	  this.updateStyle(this.data.style);
	  this.bindEvents(this.data.event);
	}
	
	Component.prototype = {
	
	  create: function create(nodeType) {
	    var node = document.createElement(nodeType || 'div');
	    return node;
	  },
	
	  getComponentManager: function getComponentManager() {
	    return ComponentManager.getInstance(this.data.instanceId);
	  },
	
	  getParent: function getParent() {
	    return this.getComponentManager().componentMap[this.parentRef];
	  },
	
	  getParentScroller: function getParentScroller() {
	    if (this.isInScrollable()) {
	      return this._parentScroller;
	    }
	    return null;
	  },
	
	  getRootScroller: function getRootScroller() {
	    if (this.isInScrollable()) {
	      var scroller = this._parentScroller;
	      var parent = scroller._parentScroller;
	      while (parent) {
	        scroller = parent;
	        parent = scroller._parentScroller;
	      }
	      return scroller;
	    }
	    return null;
	  },
	
	  getRootContainer: function getRootContainer() {
	    var root = this.getComponentManager().weexInstance.getRoot() || document.body;
	    return root;
	  },
	
	  isScrollable: function isScrollable() {
	    var t = this.data.type;
	    return ComponentManager.getScrollableTypes().indexOf(t) !== -1;
	  },
	
	  isInScrollable: function isInScrollable() {
	    if (typeof this._isInScrollable === 'boolean') {
	      return this._isInScrollable;
	    }
	    var parent = this.getParent();
	    if (parent && typeof parent._isInScrollable !== 'boolean' && !parent.isScrollable()) {
	      if (parent.data.ref === '_root') {
	        this._isInScrollable = false;
	        return false;
	      }
	      this._isInScrollable = parent.isInScrollable();
	      this._parentScroller = parent._parentScroller;
	      return this._isInScrollable;
	    }
	    if (parent && typeof parent._isInScrollable === 'boolean') {
	      this._isInScrollable = parent._isInScrollable;
	      this._parentScroller = parent._parentScroller;
	      return this._isInScrollable;
	    }
	    if (parent && parent.isScrollable()) {
	      this._isInScrollable = true;
	      this._parentScroller = parent;
	      return true;
	    }
	    if (!parent) {
	      console && console.error('isInScrollable - parent not exist.');
	      return;
	    }
	  },
	
	  createChildren: function createChildren() {
	    var children = this.data.children;
	    var parentRef = this.data.ref;
	    var componentManager = this.getComponentManager();
	    if (children && children.length) {
	      var fragment = document.createDocumentFragment();
	      var isFlex = false;
	      for (var i = 0; i < children.length; i++) {
	        children[i].instanceId = this.data.instanceId;
	        children[i].scale = this.data.scale;
	        var child = componentManager.createElement(children[i]);
	        fragment.appendChild(child.node);
	        child.parentRef = parentRef;
	        if (!isFlex && child.data.style && child.data.style.hasOwnProperty('flex')) {
	          isFlex = true;
	        }
	      }
	      this.node.appendChild(fragment);
	    }
	  },
	
	  // @todo: changed param data to child
	  appendChild: function appendChild(data) {
	    var children = this.data.children;
	    var componentManager = this.getComponentManager();
	    var child = componentManager.createElement(data);
	    this.node.appendChild(child.node);
	    // update this.data.children
	    if (!children || !children.length) {
	      this.data.children = [data];
	    } else {
	      children.push(data);
	    }
	
	    return child;
	  },
	
	  insertBefore: function insertBefore(child, before) {
	    var children = this.data.children;
	    var i = 0;
	    var l = void 0;
	    var isAppend = false;
	
	    // update this.data.children
	    if (!children || !children.length || !before) {
	      isAppend = true;
	    } else {
	      for (l = children.length; i < l; i++) {
	        if (children[i].ref === before.data.ref) {
	          break;
	        }
	      }
	      if (i === l) {
	        isAppend = true;
	      }
	    }
	
	    if (isAppend) {
	      this.node.appendChild(child.node);
	      children.push(child.data);
	    } else {
	      if (before.fixedPlaceholder) {
	        this.node.insertBefore(child.node, before.fixedPlaceholder);
	      } else {
	        this.node.insertBefore(child.node, before.node);
	      }
	      children.splice(i, 0, child.data);
	    }
	  },
	
	  removeChild: function removeChild(child) {
	    var children = this.data.children;
	    // remove from this.data.children
	    var i = 0;
	    var componentManager = this.getComponentManager();
	    if (children && children.length) {
	      var l = void 0;
	      for (l = children.length; i < l; i++) {
	        if (children[i].ref === child.data.ref) {
	          break;
	        }
	      }
	      if (i < l) {
	        children.splice(i, 1);
	      }
	    }
	    // remove from componentMap recursively
	    componentManager.removeElementByRef(child.data.ref);
	    if (child.fixedPlaceholder) {
	      this.node.removeChild(child.fixedPlaceholder);
	    }
	    child.node.parentNode.removeChild(child.node);
	  },
	
	  updateAttrs: function updateAttrs(attrs) {
	    // Note：attr must be injected into the dom element because
	    // it will be accessed from the outside developer by event.target.attr.
	    if (!this.node.attr) {
	      this.node.attr = {};
	    }
	    for (var key in attrs) {
	      var value = attrs[key];
	      var attrSetter = this.attr[key];
	      if (typeof attrSetter === 'function') {
	        attrSetter.call(this, value);
	      } else {
	        if (typeof value === 'boolean') {
	          this.node[key] = value;
	        } else {
	          this.node.setAttribute(key, value);
	        }
	        this.node.attr[key] = value;
	      }
	    }
	  },
	
	  updateStyle: function updateStyle(style) {
	    for (var key in style) {
	      var value = style[key];
	      var styleSetter = this.style[key];
	      if (typeof styleSetter === 'function') {
	        styleSetter.call(this, value);
	        continue;
	      }
	      var parser = valueFilter.getFilters(key, { scale: this.data.scale })[typeof value === 'undefined' ? 'undefined' : _typeof(value)];
	      if (typeof parser === 'function') {
	        value = parser(value);
	      }
	      this.node.style[key] = value;
	    }
	  },
	
	  bindEvents: function bindEvents(evts) {
	    var componentManager = this.getComponentManager();
	    if (evts && utils.isArray(evts)) {
	      for (var i = 0, l = evts.length; i < l; i++) {
	        var evt = evts[i];
	        var func = this.event[evt] || {};
	        var setter = func.setter;
	        if (setter) {
	          this.node.addEventListener(evt, setter);
	          continue;
	        }
	        componentManager.addEvent(this, evt, func && {
	          extra: func.extra && func.extra.bind(this),
	          updator: func.updator && func.updator.bind(this)
	        });
	      }
	    }
	  },
	
	  // dispatch a specified event on this.node
	  //  - type: event type
	  //  - data: event data
	  //  - config: event config object
	  //     - bubbles
	  //     - cancelable
	  dispatchEvent: function dispatchEvent(type, data, config) {
	    var event = document.createEvent('HTMLEvents');
	    config = config || {};
	    event.initEvent(type, config.bubbles || false, config.cancelable || false);
	    !data && (data = {});
	    event.data = utils.extend({}, data);
	    utils.extend(event, data);
	    this.node.dispatchEvent(event);
	  },
	
	  updateRecursiveAttr: function updateRecursiveAttr(data) {
	    this.updateAttrs(data.attr);
	    var componentManager = this.getComponentManager();
	    var children = this.data.children;
	    if (children) {
	      for (var i = 0; i < children.length; i++) {
	        var child = componentManager.getElementByRef(children[i].ref);
	        if (child) {
	          child.updateRecursiveAttr(data.children[i]);
	        }
	      }
	    }
	  },
	
	  updateRecursiveStyle: function updateRecursiveStyle(data) {
	    this.updateStyle(data.style);
	    var componentManager = this.getComponentManager();
	    var children = this.data.children;
	    if (children) {
	      for (var i = 0; i < children.length; i++) {
	        var child = componentManager.getElementByRef(children[i].ref);
	        if (child) {
	          child.updateRecursiveStyle(data.children[i]);
	        }
	      }
	    }
	  },
	
	  updateRecursiveAll: function updateRecursiveAll(data) {
	    this.updateAttrs(data.attr);
	    this.updateStyle(data.style);
	    var componentManager = this.getComponentManager();
	
	    // const oldRef = this.data.ref
	    // if (componentMap[oldRef]) {
	    //   delete componentMap[oldRef]
	    // }
	    // this.data.ref = data.ref
	    // componentMap[data.ref] = this
	
	    var children = this.data.children;
	    if (children) {
	      for (var i = 0; i < children.length; i++) {
	        var child = componentManager.getElementByRef(children[i].ref);
	        if (child) {
	          child.updateRecursiveAll(data.children[i]);
	        }
	      }
	    }
	  },
	
	  attr: {}, // attr setters
	
	  style: Object.create(flexbox), // style setters
	
	  // event funcs
	  //  - 1. 'updator' for updating attrs or styles with out triggering messages.
	  //  - 2. 'extra' for binding extra data.
	  //  - 3. 'setter' set a specified event handler.
	  // funcs should be functions like this: (take 'change' event as a example)
	  // {
	  //   change: {
	  //     updator () {
	  //       return {
	  //         attrs: {
	  //           checked: this.checked
	  //         }
	  //       }
	  //     },
	  //     extra () {
	  //       return {
	  //         value: this.checked
	  //       }
	  //     }
	  //   }
	  // }
	  event: {},
	
	  clearAttr: function clearAttr() {},
	
	  clearStyle: function clearStyle() {
	    this.node.cssText = '';
	  }
	};
	
	Component.prototype.style.position = function (value) {
	  var _this = this;
	
	  // For the elements who are fixed elements before, now
	  // are not fixed: the fixedPlaceholder has to be replaced
	  // by this element.
	  // This is a peace of hacking to fix the problem about
	  // mixing fixed and transform. See 'http://stackoverflo
	  // w.com/questions/15194313/webkit-css-transform3d-posi
	  // tion-fixed-issue' for more info.
	  if (value !== 'fixed') {
	    if (this.fixedPlaceholder) {
	      var parent = this.fixedPlaceholder.parentNode;
	      parent.insertBefore(this.node, this.fixedPlaceholder);
	      parent.removeChild(this.fixedPlaceholder);
	      this.fixedPlaceholder = null;
	    }
	  } else {
	    var _ret = function () {
	      // value === 'fixed'
	      // For the elements who are fixed: this fixedPlaceholder
	      // shoud be inserted, and the fixed element itself should
	      // be placed out in root container.
	      _this.node.style.position = 'fixed';
	      var parent = _this.node.parentNode;
	      var replaceWithFixedPlaceholder = function () {
	        this.fixedPlaceholder = document.createElement('div');
	        this.fixedPlaceholder.classList.add('weex-fixed-placeholder');
	        this.fixedPlaceholder.style.display = 'none';
	        this.fixedPlaceholder.style.width = '0px';
	        this.fixedPlaceholder.style.height = '0px';
	        parent.insertBefore(this.fixedPlaceholder, this.node);
	        this.getRootContainer().appendChild(this.node);
	      }.bind(_this);
	      if (!parent) {
	        (function () {
	          var pre = void 0;
	          if (_this.onAppend) {
	            pre = _this.onAppend.bind(_this);
	          }
	          _this.onAppend = function () {
	            parent = this.node.parentNode;
	            replaceWithFixedPlaceholder();
	            pre && pre();
	          }.bind(_this);
	        })();
	      } else {
	        replaceWithFixedPlaceholder();
	      }
	      return {
	        v: void 0
	      };
	    }();
	
	    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	  }
	
	  if (value === 'sticky') {
	    this.node.style.zIndex = 100;
	    setTimeout(function () {
	      var Sticky = lib.sticky;
	      this.sticky = new Sticky(this.node, {
	        top: 0
	      });
	    }.bind(this), 0);
	  } else {
	    this.node.style.position = value;
	  }
	};
	
	module.exports = Component;

/***/ },
/* 90 */
/***/ function(module, exports) {

	'use strict';
	
	// Flexbox polyfill
	
	var flexboxSetters = function () {
	  var BOX_ALIGN = {
	    stretch: 'stretch',
	    'flex-start': 'start',
	    'flex-end': 'end',
	    center: 'center'
	  };
	  var BOX_ORIENT = {
	    row: 'horizontal',
	    column: 'vertical'
	  };
	  var BOX_PACK = {
	    'flex-start': 'start',
	    'flex-end': 'end',
	    center: 'center',
	    'space-between': 'justify',
	    'space-around': 'justify' // Just same as `space-between`
	  };
	  return {
	    flex: function flex(value) {
	      this.node.style.webkitBoxFlex = value;
	      this.node.style.webkitFlex = value;
	      this.node.style.flex = value;
	    },
	    alignItems: function alignItems(value) {
	      this.node.style.webkitBoxAlign = BOX_ALIGN[value];
	      this.node.style.webkitAlignItems = value;
	      this.node.style.alignItems = value;
	    },
	    alignSelf: function alignSelf(value) {
	      this.node.style.webkitAlignSelf = value;
	      this.node.style.alignSelf = value;
	    },
	    flexDirection: function flexDirection(value) {
	      this.node.style.webkitBoxOrient = BOX_ORIENT[value];
	      this.node.style.webkitFlexDirection = value;
	      this.node.style.flexDirection = value;
	    },
	    justifyContent: function justifyContent(value) {
	      this.node.style.webkitBoxPack = BOX_PACK[value];
	      this.node.style.webkitJustifyContent = value;
	      this.node.style.justifyContent = value;
	    }
	  };
	}();
	
	module.exports = flexboxSetters;

/***/ },
/* 91 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var NOT_PX_NUMBER_PROPERTIES = ['flex', 'opacity', 'zIndex', 'fontWeight'];
	
	var valueFilter = {
	
	  filterStyles: function filterStyles(styles, config) {
	    for (var key in styles) {
	      var value = styles[key];
	      var parser = this.getFilters(key, config)[typeof value === 'undefined' ? 'undefined' : _typeof(value)];
	      if (typeof parser === 'function') {
	        styles[key] = parser(value);
	      }
	    }
	  },
	
	  getFilters: function getFilters(key, config) {
	    if (NOT_PX_NUMBER_PROPERTIES.indexOf(key) !== -1) {
	      return {};
	    }
	    return {
	      number: function number(val) {
	        return val * config.scale + 'px';
	      },
	      string: function string(val) {
	        // string of a pure number or a number suffixed with a 'px' unit
	        if (val.match(/^\-?\d*\.?\d+(?:px)?$/)) {
	          return parseFloat(val) * config.scale + 'px';
	        }
	        if (key.match(/transform/) && val.match(/translate/)) {
	          return val.replace(/\d*\.?\d+px/g, function (match) {
	            return parseInt(parseFloat(match) * config.scale) + 'px';
	          });
	        }
	        return val;
	      }
	    };
	  }
	};
	
	module.exports = valueFilter;

/***/ },
/* 92 */
/***/ function(module, exports) {

	"use strict";
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	typeof window === 'undefined' && (window = { ctrl: {}, lib: {} });!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function (a, b, c) {
	  function d(a) {
	    return null != a && "object" == (typeof a === "undefined" ? "undefined" : _typeof(a)) && Object.getPrototypeOf(a) == Object.prototype;
	  }function e(a, b) {
	    var c,
	        d,
	        e,
	        f = null,
	        g = 0,
	        h = function h() {
	      g = Date.now(), f = null, e = a.apply(c, d);
	    };return function () {
	      var i = Date.now(),
	          j = b - (i - g);return c = this, d = arguments, 0 >= j ? (clearTimeout(f), f = null, g = i, e = a.apply(c, d)) : f || (f = setTimeout(h, j)), e;
	    };
	  }function f(a) {
	    var b = "";return Object.keys(a).forEach(function (c) {
	      b += c + ":" + a[c] + ";";
	    }), b;
	  }function g(a, c) {
	    !c && d(a) && (c = a, a = c.element), c = c || {}, a.nodeType != b.ELEMENT_NODE && "string" == typeof a && (a = b.querySelector(a));var e = this;e.element = a, e.top = c.top || 0, e.withinParent = void 0 == c.withinParent ? !1 : c.withinParent, e.init();
	  }var h = a.parseInt,
	      i = navigator.userAgent,
	      j = !!i.match(/Firefox/i),
	      k = !!i.match(/IEMobile/i),
	      l = j ? "-moz-" : k ? "-ms-" : "-webkit-",
	      m = j ? "Moz" : k ? "ms" : "webkit",
	      n = function () {
	    var a = b.createElement("div"),
	        c = a.style;return c.cssText = "position:" + l + "sticky;position:sticky;", -1 != c.position.indexOf("sticky");
	  }();g.prototype = { constructor: g, init: function init() {
	      var a = this,
	          b = a.element,
	          c = b.style;c[m + "Transform"] = "translateZ(0)", c.transform = "translateZ(0)", a._originCssText = c.cssText, n ? (c.position = l + "sticky", c.position = "sticky", c.top = a.top + "px") : (a._simulateSticky(), a._bindResize());
	    }, _bindResize: function _bindResize() {
	      var b = this,
	          c = /android/gi.test(navigator.appVersion),
	          d = b._resizeEvent = "onorientationchange" in a ? "orientationchange" : "resize",
	          e = b._resizeHandler = function () {
	        setTimeout(function () {
	          b.refresh();
	        }, c ? 200 : 0);
	      };a.addEventListener(d, e, !1);
	    }, refresh: function refresh() {
	      var a = this;n || (a._detach(), a._simulateSticky());
	    }, _addPlaceholder: function _addPlaceholder(a) {
	      var c,
	          d = this,
	          e = d.element,
	          g = a.position;if (-1 != ["static", "relative"].indexOf(g)) {
	        c = d._placeholderElement = b.createElement("div");var i = h(a.width) + h(a.marginLeft) + h(a.marginRight),
	            j = h(a.height);"border-box" != a.boxSizing && (i += h(a.borderLeftWidth) + h(a.borderRightWidth) + h(a.paddingLeft) + h(a.paddingRight), j += h(a.borderTopWidth) + h(a.borderBottomWidth) + h(a.paddingTop) + h(a.paddingBottom)), c.style.cssText = f({ display: "none", visibility: "hidden", width: i + "px", height: j + "px", margin: 0, "margin-top": a.marginTop, "margin-bottom": a.marginBottom, border: 0, padding: 0, "float": a["float"] || a.cssFloat }), e.parentNode.insertBefore(c, e);
	      }return c;
	    }, _simulateSticky: function _simulateSticky() {
	      var c = this,
	          d = c.element,
	          g = c.top,
	          i = d.style,
	          j = d.getBoundingClientRect(),
	          k = getComputedStyle(d, ""),
	          l = d.parentNode,
	          m = getComputedStyle(l, ""),
	          n = c._addPlaceholder(k),
	          o = c.withinParent,
	          p = c._originCssText,
	          q = j.top - g + a.pageYOffset,
	          r = l.getBoundingClientRect().bottom - h(m.paddingBottom) - h(m.borderBottomWidth) - h(k.marginBottom) - j.height - g + a.pageYOffset,
	          s = p + f({ position: "fixed", top: g + "px", width: k.width, "margin-top": 0 }),
	          t = p + f({ position: "absolute", top: r + "px", width: k.width }),
	          u = 1,
	          v = c._scrollHandler = e(function () {
	        var b = a.pageYOffset;q > b ? 1 != u && (i.cssText = p, n && (n.style.display = "none"), u = 1) : !o && b >= q || o && b >= q && r > b ? 2 != u && (i.cssText = s, n && 3 != u && (n.style.display = "block"), u = 2) : o && 3 != u && (i.cssText = t, n && 2 != u && (n.style.display = "block"), u = 3);
	      }, 100);if (a.addEventListener("scroll", v, !1), a.pageYOffset >= q) {
	        var w = b.createEvent("HTMLEvents");w.initEvent("scroll", !0, !0), a.dispatchEvent(w);
	      }
	    }, _detach: function _detach() {
	      var b = this,
	          c = b.element;if (c.style.cssText = b._originCssText, !n) {
	        var d = b._placeholderElement;d && c.parentNode.removeChild(d), a.removeEventListener("scroll", b._scrollHandler, !1);
	      }
	    }, destroy: function destroy() {
	      var b = this;b._detach();var c = b.element.style;c.removeProperty(l + "transform"), c.removeProperty("transform"), n || a.removeEventListener(b._resizeEvent, b._resizeHandler, !1);
	    } }, c.sticky = g;
	}(window, document, window.lib || (window.lib = {}));;module.exports = window.lib['sticky'];

/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(80);
	
	var _senderMap = {};
	
	function Sender(instance) {
	  if (!(this instanceof Sender)) {
	    return new Sender(instance);
	  }
	  this.instanceId = instance.instanceId;
	  this.weexInstance = instance;
	  _senderMap[this.instanceId] = this;
	}
	
	function _send(instanceId, msg) {
	  callJS(instanceId, [msg]);
	}
	
	Sender.getSender = function (instanceId) {
	  return _senderMap[instanceId];
	};
	
	Sender.prototype = {
	
	  // perform a callback to jsframework.
	  performCallback: function performCallback(callbackId, data, keepAlive) {
	    var args = [callbackId];
	    data && args.push(data);
	    keepAlive && args.push(keepAlive);
	    _send(this.instanceId, {
	      method: 'callback',
	      args: args
	    });
	  },
	
	  fireEvent: function fireEvent(ref, type, func, event) {
	    if (event._alreadyFired) {
	      // stop bubbling up in virtual dom tree.
	      return;
	    }
	    // do not prevent default, otherwise the touchstart
	    // event will no longer trigger a click event
	    event._alreadyFired = true;
	    func.extra && utils.extend(event, func.extra());
	    _send(this.instanceId, {
	      method: 'fireEvent',
	      args: [ref, type, event, func.updator && func.updator()]
	    });
	  }
	
	};
	
	module.exports = Sender;

/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	var config = __webpack_require__(78);
	var utils = __webpack_require__(80);
	var protocol = __webpack_require__(81);
	var FrameUpdater = __webpack_require__(83);
	var Sender = __webpack_require__(93);
	
	var callQueue = [];
	// Need a task counter?
	// When FrameUpdater is not activated, tasks will not be push
	// into callQueue and there will be no trace for situation of
	// execution of tasks.
	
	// give 10ms for call handling, and rest 6ms for others
	var MAX_TIME_FOR_EACH_FRAME = 10;
	
	// callNative: jsFramework will call this method to talk to
	// this renderer.
	// params:
	//  - instanceId: string.
	//  - tasks: array of object.
	//  - callbackId: number.
	function callNative(instanceId, tasks, callbackId) {
	  var calls = [];
	  if (typeof tasks === 'string') {
	    try {
	      calls = JSON.parse(tasks);
	    } catch (e) {
	      console.error('invalid tasks:', tasks);
	    }
	  } else if (utils.isArray(tasks)) {
	    calls = tasks;
	  }
	  var len = calls.length;
	  calls[len - 1].callbackId = !callbackId && callbackId !== 0 ? -1 : callbackId;
	  // To solve the problem of callapp, the two-way time loop rule must
	  // be replaced by calling directly except the situation of page loading.
	  // 2015-11-03
	  for (var i = 0; i < len; i++) {
	    if (FrameUpdater.isActive()) {
	      callQueue.push({
	        instanceId: instanceId,
	        call: calls[i]
	      });
	    } else {
	      processCall(instanceId, calls[i]);
	    }
	  }
	}
	
	function processCallQueue() {
	  var len = callQueue.length;
	  if (len === 0) {
	    return;
	  }
	  var start = Date.now();
	  var elapsed = 0;
	
	  while (--len >= 0 && elapsed < MAX_TIME_FOR_EACH_FRAME) {
	    var callObj = callQueue.shift();
	    processCall(callObj.instanceId, callObj.call);
	    elapsed = Date.now() - start;
	  }
	}
	
	function processCall(instanceId, call) {
	  var moduleName = call.module;
	  var methodName = call.method;
	  var module = void 0,
	      method = void 0;
	  var args = call.args || call.arguments || [];
	
	  if (!(module = protocol.apiModule[moduleName])) {
	    return;
	  }
	  if (!(method = module[methodName])) {
	    return;
	  }
	
	  method.apply(protocol.getWeexInstance(instanceId), args);
	
	  var callbackId = call.callbackId;
	  if ((callbackId || callbackId === 0 || callbackId === '0') && callbackId !== '-1' && callbackId !== -1) {
	    performNextTick(instanceId, callbackId);
	  }
	}
	
	function performNextTick(instanceId, callbackId) {
	  Sender.getSender(instanceId).performCallback(callbackId);
	}
	
	function nativeLog() {
	  if (config.debug) {
	    if (arguments[0].match(/^perf/)) {
	      console.info.apply(console, arguments);
	      return;
	    }
	    console.debug.apply(console, arguments);
	  }
	}
	
	function exportsBridgeMethodsToGlobal() {
	  global.callNative = callNative;
	  global.nativeLog = nativeLog;
	}
	
	module.exports = {
	  init: function init() {
	    // process callQueue every 16 milliseconds.
	    FrameUpdater.addUpdateObserver(processCallQueue);
	    FrameUpdater.start();
	
	    // exports methods to global(window).
	    exportsBridgeMethodsToGlobal();
	  }
	};
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var RootComponent = __webpack_require__(96);
	var Container = __webpack_require__(98);
	var Image = __webpack_require__(101);
	var Text = __webpack_require__(105);
	var Vlist = __webpack_require__(106);
	var Hlist = __webpack_require__(112);
	var Countdown = __webpack_require__(113);
	var Marquee = __webpack_require__(115);
	var Slider = __webpack_require__(116);
	var Indicator = __webpack_require__(126);
	var Tabheader = __webpack_require__(129);
	var Scroller = __webpack_require__(132);
	var Input = __webpack_require__(135);
	var Select = __webpack_require__(136);
	var Datepicker = __webpack_require__(137);
	var Timepicker = __webpack_require__(138);
	var Video = __webpack_require__(139);
	var Switch = __webpack_require__(142);
	var A = __webpack_require__(145);
	var Embed = __webpack_require__(146);
	var Refresh = __webpack_require__(147);
	var Loading = __webpack_require__(150);
	var Spinner = __webpack_require__(153);
	var Web = __webpack_require__(156);
	
	var components = {
	  init: function init(Weex) {
	    Weex.registerComponent('root', RootComponent);
	    Weex.registerComponent('container', Container);
	    Weex.registerComponent('div', Container);
	    Weex.registerComponent('image', Image);
	    Weex.registerComponent('text', Text);
	    Weex.registerComponent('list', Vlist);
	    Weex.registerComponent('vlist', Vlist);
	    Weex.registerComponent('hlist', Hlist);
	    Weex.registerComponent('countdown', Countdown);
	    Weex.registerComponent('marquee', Marquee);
	    Weex.registerComponent('slider', Slider);
	    Weex.registerComponent('indicator', Indicator);
	    Weex.registerComponent('tabheader', Tabheader);
	    Weex.registerComponent('scroller', Scroller);
	    Weex.registerComponent('input', Input);
	    Weex.registerComponent('select', Select);
	    Weex.registerComponent('datepicker', Datepicker);
	    Weex.registerComponent('timepicker', Timepicker);
	    Weex.registerComponent('video', Video);
	    Weex.registerComponent('switch', Switch);
	    Weex.registerComponent('a', A);
	    Weex.registerComponent('embed', Embed);
	    Weex.registerComponent('refresh', Refresh);
	    Weex.registerComponent('loading', Loading);
	    Weex.registerComponent('spinner', Spinner);
	    Weex.registerComponent('loading-indicator', Spinner);
	    Weex.registerComponent('web', Web);
	  }
	};
	
	module.exports = components;

/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var ComponentManager = __webpack_require__(82);
	var Component = __webpack_require__(89);
	// const utils = require('../utils')
	var logger = __webpack_require__(97);
	
	var rootCandidates = ['div', 'list', 'vlist', 'scroller'];
	
	function RootComponent(data, nodeType) {
	  var id = data.rootId + '-root';
	  var componentManager = ComponentManager.getInstance(data.instanceId);
	
	  // If nodeType is in the downgrades map, just ignore it and
	  // replace it with a div component.
	  var downgrades = componentManager.weexInstance.downgrades;
	  this.data = data;
	
	  // In some situation the root component should be implemented as
	  // its own type, otherwise it has to be a div component as a root.
	  if (!nodeType) {
	    nodeType = 'div';
	  } else if (rootCandidates.indexOf(nodeType) === -1) {
	    logger.warn('the root component type \'' + nodeType + '\' is not one of ' + 'the types in [' + rootCandidates + '] list. It is auto downgraded ' + 'to \'div\'.');
	    nodeType = 'div';
	  } else if (downgrades[nodeType]) {
	    logger.warn('Thanks to the downgrade flags for [' + Object.keys(downgrades) + '], the root component type \'' + nodeType + '\' is auto downgraded to \'div\'.');
	    nodeType = 'div';
	  } else {
	    // If the root component is not a embed element in a webpage, then
	    // the html and body height should be fixed to the max height
	    // of viewport.
	    if (!componentManager.weexInstance.embed) {
	      window.addEventListener('renderend', function () {
	        this.detectRootHeight();
	      }.bind(this));
	    }
	    if (nodeType !== 'div') {
	      logger.warn('the root component type \'' + nodeType + '\' may have ' + 'some performance issue on some of the android devices when there ' + 'is a huge amount of dom elements. Try to add downgrade ' + 'flags by adding param \'downgrade_' + nodeType + '=true\' in the ' + 'url or setting downgrade config to a array contains \'' + nodeType + '\' in the \'weex.init\' function. This will downgrade the root \'' + nodeType + '\' to a \'div\', and may elevate the level of ' + 'performance, although it has some other issues.');
	    }
	    !this.data.style.height && (this.data.style.height = '100%');
	  }
	
	  data.type = nodeType;
	  var cmp = componentManager.createElement(data);
	  cmp.node.id = id;
	  return cmp;
	}
	
	RootComponent.prototype = Object.create(Component.prototype);
	
	RootComponent.prototype.detectRootHeight = function () {
	  var rootQuery = '#' + this.getComponentManager().weexInstance.rootId;
	  var rootContainer = document.querySelector(rootQuery) || document.body;
	  var height = rootContainer.getBoundingClientRect().height;
	  if (height > window.innerHeight) {
	    logger.warn(['for scrollable root like \'list\' and \'scroller\', the height of ', 'the root container must be a user-specified value. Otherwise ', 'the scrollable element may not be able to work correctly. ', 'Current height of the root element \'' + rootQuery + '\' is ', height + 'px, and mostly its height should be less than the ', 'viewport\'s height ' + window.innerHeight + 'px. Please ', 'make sure the height is correct.'].join(''));
	  }
	};
	
	module.exports = RootComponent;

/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var config = __webpack_require__(78);
	var utils = __webpack_require__(80);
	
	var _initialized = false;
	
	var logger = {
	  log: function log() {},
	  warn: function warn() {},
	  error: function error() {}
	};
	
	function hijack(k) {
	  if (utils.isArray(k)) {
	    k.forEach(function (key) {
	      hijack(key);
	    });
	  } else {
	    if (console[k]) {
	      logger[k] = function () {
	        console[k].apply(console, ['[h5-render]'].concat(Array.prototype.slice.call(arguments, 0)));
	      };
	    }
	  }
	}
	
	logger.init = function () {
	  if (_initialized) {
	    return;
	  }
	  _initialized = true;
	  if (config.debug && console) {
	    hijack(['log', 'warn', 'error']);
	  }
	};
	
	module.exports = logger;

/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(99);
	
	var Component = __webpack_require__(89);
	
	function Container(data, nodeType) {
	  Component.call(this, data, nodeType);
	  this.node.classList.add('weex-container');
	}
	
	Container.prototype = Object.create(Component.prototype);
	
	module.exports = Container;

/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(100);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./container.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./container.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-container {\n  box-sizing: border-box;\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n  flex-shrink: 0;\n  align-items: stretch;\n  box-align: stretch;\n  align-content: flex-start;\n  position: relative;\n  border: 0 solid black;\n  margin: 0;\n  padding: 0;\n  min-width: 0;\n}\n\n.weex-element {\n  box-sizing: border-box;\n  position: relative;\n  flex-shrink: 0;\n  border: 0 solid black;\n  margin: 0;\n  padding: 0;\n  min-width: 0;\n}\n", ""]);
	
	// exports


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	/* global lib */
	
	'use strict';
	
	var Atomic = __webpack_require__(102);
	var LazyLoad = __webpack_require__(85);
	// const config = require('../config')
	var utils = __webpack_require__(80);
	
	__webpack_require__(103);
	
	var DEFAULT_SIZE = 200;
	var RESIZE_MODES = ['stretch', 'cover', 'contain'];
	var DEFAULT_RESIZE_MODE = 'stretch';
	
	/**
	 * resize: 'cover' | 'contain' | 'stretch', default is 'stretch'
	 * src: url
	 */
	
	function Image(data) {
	  this.resize = DEFAULT_RESIZE_MODE;
	  Atomic.call(this, data);
	}
	
	Image.prototype = Object.create(Atomic.prototype);
	
	Image.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('weex-img', 'weex-element');
	  return node;
	};
	
	Image.prototype.attr = {
	  src: function src(val) {
	    if (!this.src) {
	      this.src = lib.img.defaultSrc;
	      this.node.style.backgroundImage = 'url(' + this.src + ')';
	    }
	    LazyLoad.makeImageLazy(this.node, val);
	  },
	
	  resize: function resize(val) {
	    if (RESIZE_MODES.indexOf(val) === -1) {
	      val = 'stretch';
	    }
	    this.node.style.backgroundSize = val === 'stretch' ? '100% 100%' : val;
	  }
	};
	
	Image.prototype.style = utils.extend(Object.create(Atomic.prototype.style), {
	  width: function width(val) {
	    val = parseFloat(val) * this.data.scale;
	    if (val < 0 || isNaN(val)) {
	      val = DEFAULT_SIZE;
	    }
	    this.node.style.width = val + 'px';
	  },
	
	  height: function height(val) {
	    val = parseFloat(val) * this.data.scale;
	    if (val < 0 || isNaN(val)) {
	      val = DEFAULT_SIZE;
	    }
	    this.node.style.height = val + 'px';
	  }
	});
	
	Image.prototype.clearAttr = function () {
	  this.src = '';
	  this.node.style.backgroundImage = '';
	};
	
	module.exports = Image;

/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Component = __webpack_require__(89);
	
	// Component which can have no subcomponents.
	// This component should not be instantiated directly, since
	// it is designed to be used as a base class to extend from.
	function Atomic(data) {
	  Component.call(this, data);
	}
	
	Atomic.prototype = Object.create(Component.prototype);
	
	Atomic.prototype.appendChild = function (data) {
	  // do nothing
	  return;
	};
	
	Atomic.prototype.insertBefore = function (child, before) {
	  // do nothing
	  return;
	};
	
	Atomic.prototype.removeChild = function (child) {
	  // do nothing
	  return;
	};
	
	module.exports = Atomic;

/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(104);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./image.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./image.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-img {\n  background-repeat: no-repeat;\n  background-size: 100% 100%;\n  background-position: 50%;\n}", ""]);
	
	// exports


/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(89);
	var utils = __webpack_require__(80);
	
	var DEFAULT_FONT_SIZE = 32;
	var DEFAULT_TEXT_OVERFLOW = 'ellipsis';
	
	// attr
	//  - value: text content.
	//  - lines: maximum lines of the text.
	function Text(data) {
	  Atomic.call(this, data);
	}
	
	Text.prototype = Object.create(Atomic.prototype);
	
	Text.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('weex-container');
	  node.style.fontSize = DEFAULT_FONT_SIZE * this.data.scale + 'px';
	  this.textNode = document.createElement('span');
	  // Give the developers the ability to control space
	  // and line-breakers.
	  this.textNode.style.whiteSpace = 'pre-wrap';
	  this.textNode.style.wordWrap = 'break-word';
	  this.textNode.style.display = '-webkit-box';
	  this.textNode.style.webkitBoxOrient = 'vertical';
	  this.style.lines.call(this, this.data.style.lines);
	  node.appendChild(this.textNode);
	  return node;
	};
	
	Text.prototype.attr = {
	  value: function value(_value) {
	    var span = this.node.firstChild;
	    span.innerHTML = '';
	    if (_value == null || _value === '') {
	      return;
	    }
	    span.textContent = _value;
	    /**
	     * Developers are supposed to have the ability to break text
	     * lines manually. Using ``&nbsp;`` to replace text space is
	     * not compatible with the ``-webkit-line-clamp``. Therefor
	     * we use ``white-space: no-wrap`` instead (instead of the
	     * code bellow).
	       const frag = document.createDocumentFragment()
	        text.split(' ').forEach(function(str) {
	          const textNode = document.createTextNode(str)
	          const space = document.createElement('i')
	          space.innerHTML = '&nbsp;'
	          frag.appendChild(space)
	          frag.appendChild(textNode)
	        })
	        frag.removeChild(frag.firstChild)
	        span.appendChild(document.createElement('br'))
	        span.appendChild(frag)
	      })
	      span.removeChild(span.firstChild)
	     */
	  }
	};
	
	Text.prototype.clearAttr = function () {
	  this.node.firstChild.textContent = '';
	};
	
	Text.prototype.style = utils.extend(Object.create(Atomic.prototype.style), {
	
	  lines: function lines(val) {
	    val = parseInt(val);
	    if (isNaN(val)) {
	      return;
	    }
	    if (val <= 0) {
	      this.textNode.style.textOverflow = '';
	      this.textNode.style.overflow = 'visible';
	      this.textNode.style.webkitLineClamp = '';
	    } else {
	      var style = this.data ? this.data.style : null;
	      this.textNode.style.overflow = 'hidden';
	      this.textNode.style.textOverflow = style ? style.textOverflow : DEFAULT_TEXT_OVERFLOW;
	      this.textNode.style.webkitLineClamp = val;
	    }
	  },
	
	  textOverflow: function textOverflow(val) {
	    this.textNode.style.textOverflow = val;
	  }
	
	});
	
	module.exports = Text;

/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var List = __webpack_require__(107);
	
	function Vlist(data, nodeType) {
	  data.attr.direction = 'v';
	  List.call(this, data, nodeType);
	}
	
	Vlist.prototype = Object.create(List.prototype);
	
	module.exports = Vlist;

/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	/* global lib */
	
	'use strict';
	
	__webpack_require__(108);
	__webpack_require__(110);
	
	var Component = __webpack_require__(89);
	
	var DEFAULT_LOAD_MORE_OFFSET = 0;
	
	var directionMap = {
	  h: ['row', 'horizontal', 'h', 'x'],
	  v: ['column', 'vertical', 'v', 'y']
	};
	
	// direction: 'v' or 'h', default is 'v'
	function List(data, nodeType) {
	  this.loadmoreoffset = DEFAULT_LOAD_MORE_OFFSET;
	  this.isAvailableToFireloadmore = true;
	  this.direction = directionMap.h.indexOf(data.attr.direction) === -1 ? 'v' : 'h';
	  Component.call(this, data, nodeType);
	}
	
	List.prototype = Object.create(Component.prototype);
	
	List.prototype.create = function (nodeType) {
	  var Scroll = lib.scroll;
	  var node = Component.prototype.create.call(this, nodeType);
	  node.classList.add('weex-container', 'list-wrap');
	  this.listElement = document.createElement('div');
	  this.listElement.classList.add('weex-container', 'list-element', this.direction + '-list');
	
	  this.listElement.style.webkitBoxOrient = directionMap[this.direction][1];
	  this.listElement.style.webkitFlexDirection = directionMap[this.direction][0];
	  this.listElement.style.flexDirection = directionMap[this.direction][0];
	
	  node.appendChild(this.listElement);
	  this.scroller = new Scroll({
	    // if the direction is x, then the bounding rect of the scroll element
	    // should be got by the 'Range' API other than the 'getBoundingClientRect'
	    // API, because the width outside the viewport won't be count in by
	    // 'getBoundingClientRect'.
	    // Otherwise should use the element rect in case there is a child scroller
	    // or list in this scroller. If using 'Range', the whole scroll element
	    // including the hiding part will be count in the rect.
	    useElementRect: this.direction === 'v',
	    scrollElement: this.listElement,
	    direction: this.direction === 'h' ? 'x' : 'y'
	  });
	  this.scroller.init();
	  this.offset = 0;
	  return node;
	};
	
	List.prototype.bindEvents = function (evts) {
	  Component.prototype.bindEvents.call(this, evts);
	  // to enable lazyload for Images.
	  this.scroller.addEventListener('scrolling', function (e) {
	    var so = e.scrollObj;
	    var scrollTop = so.getScrollTop();
	    var scrollLeft = so.getScrollLeft();
	    var offset = this.direction === 'v' ? scrollTop : scrollLeft;
	    var diff = offset - this.offset;
	    var dir = void 0;
	    if (diff >= 0) {
	      dir = this.direction === 'v' ? 'up' : 'left';
	    } else {
	      dir = this.direction === 'v' ? 'down' : 'right';
	    }
	    this.dispatchEvent('scroll', {
	      originalType: 'scrolling',
	      scrollTop: so.getScrollTop(),
	      scrollLeft: so.getScrollLeft(),
	      offset: offset,
	      direction: dir
	    }, {
	      bubbles: true
	    });
	    this.offset = offset;
	
	    // fire loadmore event.
	    var leftDist = Math.abs(so.maxScrollOffset) - this.offset;
	    if (leftDist <= this.loadmoreoffset && this.isAvailableToFireloadmore) {
	      this.isAvailableToFireloadmore = false;
	      this.dispatchEvent('loadmore');
	    } else if (leftDist > this.loadmoreoffset && !this.isAvailableToFireloadmore) {
	      this.isAvailableToFireloadmore = true;
	    }
	  }.bind(this));
	};
	
	List.prototype.createChildren = function () {
	  var children = this.data.children;
	  var parentRef = this.data.ref;
	  var componentManager = this.getComponentManager();
	  if (children && children.length) {
	    var fragment = document.createDocumentFragment();
	    var isFlex = false;
	    for (var i = 0; i < children.length; i++) {
	      children[i].instanceId = this.data.instanceId;
	      children[i].scale = this.data.scale;
	      var child = componentManager.createElement(children[i]);
	      fragment.appendChild(child.node);
	      child.parentRef = parentRef;
	      if (!isFlex && child.data.style && child.data.style.hasOwnProperty('flex')) {
	        isFlex = true;
	      }
	    }
	    this.listElement.appendChild(fragment);
	  }
	  // wait for fragment to appended on listElement on UI thread.
	  setTimeout(function () {
	    this.scroller.refresh();
	  }.bind(this), 0);
	};
	
	List.prototype.appendChild = function (data) {
	  var children = this.data.children;
	  var componentManager = this.getComponentManager();
	  var child = componentManager.createElement(data);
	  this.listElement.appendChild(child.node);
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh();
	  }.bind(this), 0);
	
	  // update this.data.children
	  if (!children || !children.length) {
	    this.data.children = [data];
	  } else {
	    children.push(data);
	  }
	
	  return child;
	};
	
	List.prototype.insertBefore = function (child, before) {
	  var children = this.data.children;
	  var i = 0;
	  var isAppend = false;
	
	  // update this.data.children
	  if (!children || !children.length || !before) {
	    isAppend = true;
	  } else {
	    var l = void 0;
	    for (l = children.length; i < l; i++) {
	      if (children[i].ref === before.data.ref) {
	        break;
	      }
	    }
	    if (i === l) {
	      isAppend = true;
	    }
	  }
	
	  if (isAppend) {
	    this.listElement.appendChild(child.node);
	    children.push(child.data);
	  } else {
	    var refreshLoadingPlaceholder = before.refreshPlaceholder || before.loadingPlaceholder;
	    if (refreshLoadingPlaceholder) {
	      this.listElement.insertBefore(child.node, refreshLoadingPlaceholder);
	    } else if (before.fixedPlaceholder) {
	      this.listElement.insertBefore(child.node, before.fixedPlaceholder);
	    } else {
	      this.listElement.insertBefore(child.node, before.node);
	    }
	    children.splice(i, 0, child.data);
	  }
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh();
	  }.bind(this), 0);
	};
	
	List.prototype.removeChild = function (child) {
	  var children = this.data.children;
	  // remove from this.data.children
	  var i = 0;
	  var componentManager = this.getComponentManager();
	  if (children && children.length) {
	    var l = void 0;
	    for (l = children.length; i < l; i++) {
	      if (children[i].ref === child.data.ref) {
	        break;
	      }
	    }
	    if (i < l) {
	      children.splice(i, 1);
	    }
	  }
	  // remove from componentMap recursively
	  componentManager.removeElementByRef(child.data.ref);
	  var refreshLoadingPlaceholder = child.refreshPlaceholder || child.loadingPlaceholder;
	  if (child.refreshPlaceholder) {
	    this.listElement.removeChild(refreshLoadingPlaceholder);
	  }
	  if (child.fixedPlaceholder) {
	    this.listElement.removeChild(child.fixedPlaceholder);
	  }
	  child.node.parentNode.removeChild(child.node);
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh();
	  }.bind(this), 0);
	};
	
	List.prototype.onAppend = function () {
	  this._refreshWhenDomRenderend();
	};
	
	List.prototype.onRemove = function () {
	  this._removeEvents();
	};
	
	List.prototype._refreshWhenDomRenderend = function () {
	  var self = this;
	  if (!this.renderendHandler) {
	    this.renderendHandler = function () {
	      self.scroller.refresh();
	    };
	  }
	  window.addEventListener('renderend', this.renderendHandler);
	};
	
	List.prototype._removeEvents = function () {
	  if (this.renderendHandler) {
	    window.removeEventListener('renderend', this.renderendHandler);
	  }
	};
	
	List.prototype.attr = {
	  loadmoreoffset: function loadmoreoffset(val) {
	    val = parseFloat(val);
	    if (val < 0 || isNaN(val)) {
	      return;
	    }
	    this.loadmoreoffset = val;
	  }
	};
	
	module.exports = List;

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(109);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./list.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./list.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".list-wrap {\n  display: block;\n  overflow: hidden;\n}\n\n.list-element {\n  -webkit-box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n}\n", ""]);
	
	// exports


/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	/* eslint-disable */
	
	__webpack_require__(111);
	
	var logger = __webpack_require__(97);
	
	var doc = window.document;
	var ua = window.navigator.userAgent;
	var scrollObjs = {};
	var plugins = {};
	var dpr = window.dpr || (!!window.navigator.userAgent.match(/iPhone|iPad|iPod/) ? document.documentElement.clientWidth / window.screen.availWidth : 1);
	var inertiaCoefficient = {
	  normal: [2 * dpr, 0.0015 * dpr],
	  slow: [1.5 * dpr, 0.003 * dpr],
	  veryslow: [1.5 * dpr, 0.005 * dpr]
	};
	var timeFunction = {
	  ease: [.25, .1, .25, 1],
	  liner: [0, 0, 1, 1],
	  'ease-in': [.42, 0, 1, 1],
	  'ease-out': [0, 0, .58, 1],
	  'ease-in-out': [.42, 0, .58, 1]
	};
	var Firefox = !!ua.match(/Firefox/i);
	var IEMobile = !!ua.match(/IEMobile/i);
	var cssPrefix = Firefox ? '-moz-' : IEMobile ? '-ms-' : '-webkit-';
	var stylePrefix = Firefox ? 'Moz' : IEMobile ? 'ms' : 'webkit';
	
	function debugLog() {
	  if (lib.scroll.outputDebugLog) {
	    logger.log.apply(logger, arguments);
	  }
	}
	
	function getBoundingClientRect(el) {
	  var rect = el.getBoundingClientRect();
	  if (!rect) {
	    rect = {};
	    rect.width = el.offsetWidth;
	    rect.height = el.offsetHeight;
	
	    rect.left = el.offsetLeft;
	    rect.top = el.offsetTop;
	    var parent = el.offsetParent;
	    while (parent) {
	      rect.left += parent.offsetLeft;
	      rect.top += parent.offsetTop;
	      parent = parent.offsetParent;
	    }
	
	    rect.right = rect.left + rect.width;
	    rect.bottom = rect.top + rect.height;
	  }
	  return rect;
	}
	
	function getMinScrollOffset(scrollObj) {
	  return 0 - scrollObj.options[scrollObj.axis + 'PaddingTop'];
	}
	
	function getMaxScrollOffset(scrollObj) {
	  var rect = getBoundingClientRect(scrollObj.element);
	  var pRect = getBoundingClientRect(scrollObj.viewport);
	  var min = getMinScrollOffset(scrollObj);
	  if (scrollObj.axis === 'y') {
	    var max = 0 - rect.height + pRect.height;
	  } else {
	    var max = 0 - rect.width + pRect.width;
	  }
	  return Math.min(max + scrollObj.options[scrollObj.axis + 'PaddingBottom'], min);
	}
	
	function _getBoundaryOffset(scrollObj, offset) {
	  if (offset > scrollObj.minScrollOffset) {
	    return offset - scrollObj.minScrollOffset;
	  }
	  if (offset < scrollObj.maxScrollOffset) {
	    return offset - scrollObj.maxScrollOffset;
	  }
	}
	
	function touchBoundary(scrollObj, offset) {
	  if (offset > scrollObj.minScrollOffset) {
	    offset = scrollObj.minScrollOffset;
	  } else if (offset < scrollObj.maxScrollOffset) {
	    offset = scrollObj.maxScrollOffset;
	  }
	  return offset;
	}
	
	function fireEvent(scrollObj, eventName, extra) {
	  debugLog(scrollObj.element.scrollId, eventName, extra);
	  var event = doc.createEvent('HTMLEvents');
	  event.initEvent(eventName, false, true);
	  event.scrollObj = scrollObj;
	  if (extra) {
	    for (var key in extra) {
	      event[key] = extra[key];
	    }
	  }
	  scrollObj.element.dispatchEvent(event);
	  scrollObj.viewport.dispatchEvent(event);
	}
	
	function getTransformOffset(scrollObj) {
	  var offset = { x: 0, y: 0 };
	  var transform = getComputedStyle(scrollObj.element)[stylePrefix + 'Transform'];
	  var matched;
	  var reg1 = new RegExp('^matrix3d' + '\\((?:[-\\d.]+,\\s*){12}([-\\d.]+),' + '\\s*([-\\d.]+)(?:,\\s*[-\\d.]+){2}\\)');
	  var reg2 = new RegExp('^matrix' + '\\((?:[-\\d.]+,\\s*){4}([-\\d.]+),\\s*([-\\d.]+)\\)$');
	  if (transform !== 'none') {
	    if (matched = transform.match(reg1) || transform.match(reg2)) {
	      offset.x = parseFloat(matched[1]) || 0;
	      offset.y = parseFloat(matched[2]) || 0;
	    }
	  }
	
	  return offset;
	}
	
	var CSSMatrix = IEMobile ? 'MSCSSMatrix' : 'WebKitCSSMatrix';
	var has3d = !!Firefox || CSSMatrix in window && 'm11' in new window[CSSMatrix]();
	function getTranslate(x, y) {
	  x = parseFloat(x);
	  y = parseFloat(y);
	
	  if (x != 0) {
	    x += 'px';
	  }
	
	  if (y != 0) {
	    y += 'px';
	  }
	
	  if (has3d) {
	    return 'translate3d(' + x + ', ' + y + ', 0)';
	  }
	  return 'translate(' + x + ', ' + y + ')';
	}
	
	function setTransitionStyle(scrollObj, duration, timingFunction) {
	  if (duration === '' && timingFunction === '') {
	    scrollObj.element.style[stylePrefix + 'Transition'] = '';
	  } else {
	    scrollObj.element.style[stylePrefix + 'Transition'] = cssPrefix + 'transform ' + duration + ' ' + timingFunction + ' 0s';
	  }
	}
	
	function setTransformStyle(scrollObj, offset) {
	  var x = 0;
	  var y = 0;
	  if ((typeof offset === 'undefined' ? 'undefined' : _typeof(offset)) === 'object') {
	    x = offset.x;
	    y = offset.y;
	  } else {
	    if (scrollObj.axis === 'y') {
	      y = offset;
	    } else {
	      x = offset;
	    }
	  }
	  scrollObj.element.style[stylePrefix + 'Transform'] = getTranslate(x, y);
	}
	
	var panning = false;
	doc.addEventListener('touchmove', function (e) {
	  if (panning) {
	    e.preventDefault();
	    return false;
	  }
	  return true;
	}, false);
	
	function Scroll(element, options) {
	  var that = this;
	
	  options = options || {};
	  options.noBounce = !!options.noBounce;
	  options.padding = options.padding || {};
	
	  if (options.isPrevent == null) {
	    options.isPrevent = true;
	  } else {
	    options.isPrevent = !!options.isPrevent;
	  }
	
	  if (options.isFixScrollendClick == null) {
	    options.isFixScrollendClick = true;
	  } else {
	    options.isFixScrollendClick = !!options.isFixScrollendClick;
	  }
	
	  if (options.padding) {
	    options.yPaddingTop = -options.padding.top || 0;
	    options.yPaddingBottom = -options.padding.bottom || 0;
	    options.xPaddingTop = -options.padding.left || 0;
	    options.xPaddingBottom = -options.padding.right || 0;
	  } else {
	    options.yPaddingTop = 0;
	    options.yPaddingBottom = 0;
	    options.xPaddingTop = 0;
	    options.xPaddingBottom = 0;
	  }
	
	  options.direction = options.direction || 'y';
	  options.inertia = options.inertia || 'normal';
	
	  this.options = options;
	  that.axis = options.direction;
	  this.element = element;
	  this.viewport = element.parentNode;
	  this.plugins = {};
	
	  this.element.scrollId = setTimeout(function () {
	    scrollObjs[that.element.scrollId + ''] = that;
	  }, 1);
	
	  this.viewport.addEventListener('touchstart', touchstartHandler, false);
	  this.viewport.addEventListener('touchend', touchendHandler, false);
	  this.viewport.addEventListener('touchcancel', touchendHandler, false);
	  this.viewport.addEventListener('panstart', panstartHandler, false);
	  this.viewport.addEventListener('panmove', panHandler, false);
	  this.viewport.addEventListener('panend', panendHandler, false);
	
	  if (options.isPrevent) {
	    this.viewport.addEventListener('touchstart', function (e) {
	      panning = true;
	    }, false);
	    that.viewport.addEventListener('touchend', function (e) {
	      panning = false;
	    }, false);
	  }
	
	  // if (options.isPrevent) {
	  //   var d = this.axis === 'y'?'vertical':'horizontal'
	  //   this.viewport.addEventListener(d + 'panstart', function (e) {
	  //     panning = true
	  //   }, false)
	  //   that.viewport.addEventListener('panend', function (e) {
	  //     panning = false
	  //   }, false)
	  // }
	
	  if (options.isFixScrollendClick) {
	    var preventScrollendClickHandler = function preventScrollendClickHandler(e) {
	      if (preventScrollendClick || isScrolling) {
	        e.preventDefault();
	        e.stopPropagation();
	        return false;
	      }
	      return true;
	    };
	
	    var fireNiceTapEventHandler = function fireNiceTapEventHandler(e) {
	      if (!preventScrollendClick && !isScrolling) {
	        setTimeout(function () {
	          var niceTapEvent = document.createEvent('HTMLEvents');
	          niceTapEvent.initEvent('niceclick', true, true);
	          e.target.dispatchEvent(niceTapEvent);
	        }, 300);
	      }
	    };
	
	    var preventScrollendClick;
	    var fixScrollendClickTimeoutId;
	
	    this.viewport.addEventListener('scrolling', function () {
	      preventScrollendClick = true;
	      fixScrollendClickTimeoutId && clearTimeout(fixScrollendClickTimeoutId);
	      fixScrollendClickTimeoutId = setTimeout(function (e) {
	        preventScrollendClick = false;
	      }, 400);
	    }, false);
	
	    this.viewport.addEventListener('click', preventScrollendClickHandler);
	    this.viewport.addEventListener('tap', fireNiceTapEventHandler);
	  }
	
	  function setTransitionEndHandler(h, t) {
	    if (options.useFrameAnimation) {
	      return;
	    }
	    transitionEndHandler = null;
	    clearTimeout(transitionEndTimeoutId);
	
	    transitionEndTimeoutId = setTimeout(function () {
	      if (transitionEndHandler) {
	        transitionEndHandler = null;
	        lib.animation.requestFrame(h);
	      }
	    }, t || 400);
	
	    transitionEndHandler = h;
	  }
	
	  if (options.useFrameAnimation) {
	    var scrollAnimation;
	
	    Object.defineProperty(this, 'animation', {
	      get: function get() {
	        return scrollAnimation;
	      }
	    });
	  } else {
	    var transitionEndHandler;
	    var transitionEndTimeoutId = 0;
	
	    element.addEventListener(Firefox ? 'transitionend' : stylePrefix + 'TransitionEnd', function (e) {
	      if (transitionEndHandler) {
	        var handler = transitionEndHandler;
	
	        transitionEndHandler = null;
	        clearTimeout(transitionEndTimeoutId);
	
	        lib.animation.requestFrame(function () {
	          handler(e);
	        });
	      }
	    }, false);
	  }
	
	  var panFixRatio;
	  var isScrolling;
	  var isFlickScrolling;
	  var cancelScrollEnd;
	
	  Object.defineProperty(this, 'isScrolling', {
	    get: function get() {
	      return !!isScrolling;
	    }
	  });
	
	  function isEnabled(e) {
	    if (!that.enabled) {
	      return false;
	    }
	
	    if (typeof e.isVertical != 'undefined') {
	      if (that.axis === 'y' && e.isVertical || that.axis === 'x' && !e.isVertical) {
	        // gesture in same direction, stop bubbling up
	        e.stopPropagation();
	      } else {
	        // gesture in different direction, bubbling up
	        // to the top, without any other process
	        return false;
	      }
	    }
	
	    return true;
	  }
	
	  function touchstartHandler(e) {
	    if (!isEnabled(e)) {
	      return;
	    }
	
	    if (isScrolling) {
	      scrollEnd();
	    }
	
	    if (options.useFrameAnimation) {
	      scrollAnimation && scrollAnimation.stop();
	      scrollAnimation = null;
	    } else {
	      var transform = getTransformOffset(that);
	      setTransformStyle(that, transform);
	      setTransitionStyle(that, '', '');
	      transitionEndHandler = null;
	      clearTimeout(transitionEndTimeoutId);
	    }
	  }
	
	  function touchendHandler(e) {
	    if (!isEnabled(e)) {
	      return;
	    }
	
	    var s0 = getTransformOffset(that)[that.axis];
	    var boundaryOffset = _getBoundaryOffset(that, s0);
	
	    if (boundaryOffset) {
	      // dragging out of boundray, bounce is needed
	      var s1 = touchBoundary(that, s0);
	
	      if (options.useFrameAnimation) {
	        // frame
	        var _s = s1 - s0;
	        scrollAnimation = new lib.animation(400, lib.cubicbezier.ease, 0, function (i1, i2) {
	          var offset = (s0 + _s * i2).toFixed(2);
	          setTransformStyle(that, offset);
	          fireEvent(that, 'scrolling');
	        });
	        scrollAnimation.onend(scrollEnd);
	        scrollAnimation.play();
	      } else {
	        // css
	        var offset = s1.toFixed(0);
	        setTransitionEndHandler(scrollEnd, 400);
	        setTransitionStyle(that, '0.4s', 'ease');
	        setTransformStyle(that, offset);
	
	        lib.animation.requestFrame(function doScroll() {
	          if (isScrolling && that.enabled) {
	            fireEvent(that, 'scrolling');
	            lib.animation.requestFrame(doScroll);
	          }
	        });
	      }
	
	      if (boundaryOffset > 0) {
	        fireEvent(that, that.axis === 'y' ? 'pulldownend' : 'pullrightend');
	      } else if (boundaryOffset < 0) {
	        fireEvent(that, that.axis === 'y' ? 'pullupend' : 'pullleftend');
	      }
	    } else if (isScrolling) {
	      // without exceeding the boundary, just end it
	      scrollEnd();
	    }
	  }
	
	  var lastDisplacement;
	  function panstartHandler(e) {
	    if (!isEnabled(e)) {
	      return;
	    }
	
	    that.transformOffset = getTransformOffset(that);
	    that.minScrollOffset = getMinScrollOffset(that);
	    that.maxScrollOffset = getMaxScrollOffset(that);
	    panFixRatio = 2.5;
	    cancelScrollEnd = true;
	    isScrolling = true;
	    isFlickScrolling = false;
	    fireEvent(that, 'scrollstart');
	
	    lastDisplacement = e['displacement' + that.axis.toUpperCase()];
	  }
	
	  function panHandler(e) {
	    if (!isEnabled(e)) {
	      return;
	    }
	
	    // finger move less than 5 px. just ignore that.
	    var displacement = e['displacement' + that.axis.toUpperCase()];
	    if (Math.abs(displacement - lastDisplacement) < 5) {
	      e.stopPropagation();
	      return;
	    }
	    lastDisplacement = displacement;
	
	    var offset = that.transformOffset[that.axis] + displacement;
	    if (offset > that.minScrollOffset) {
	      offset = that.minScrollOffset + (offset - that.minScrollOffset) / panFixRatio;
	      panFixRatio *= 1.003;
	    } else if (offset < that.maxScrollOffset) {
	      offset = that.maxScrollOffset - (that.maxScrollOffset - offset) / panFixRatio;
	      panFixRatio *= 1.003;
	    }
	    if (panFixRatio > 4) {
	      panFixRatio = 4;
	    }
	
	    // tell whether or not reach the fringe
	    var boundaryOffset = _getBoundaryOffset(that, offset);
	    if (boundaryOffset) {
	      fireEvent(that, boundaryOffset > 0 ? that.axis === 'y' ? 'pulldown' : 'pullright' : that.axis === 'y' ? 'pullup' : 'pullleft', {
	        boundaryOffset: Math.abs(boundaryOffset)
	      });
	      if (that.options.noBounce) {
	        offset = touchBoundary(that, offset);
	      }
	    }
	
	    setTransformStyle(that, offset.toFixed(2));
	    fireEvent(that, 'scrolling');
	  }
	
	  function panendHandler(e) {
	    if (!isEnabled(e)) {
	      return;
	    }
	
	    if (e.isSwipe) {
	      flickHandler(e);
	    }
	  }
	
	  function flickHandler(e) {
	    cancelScrollEnd = true;
	
	    var v0, a0, t0, s0, s, motion0;
	    var v1, a1, t1, s1, motion1, sign;
	    var v2, a2, t2, s2, motion2, ft;
	
	    s0 = getTransformOffset(that)[that.axis];
	    var boundaryOffset0 = _getBoundaryOffset(that, s0);
	    if (!boundaryOffset0) {
	      // when fingers left the range of screen, let touch end handler
	      // to deal with it.
	      // when fingers left the screen, but still in the range of
	      // screen, calculate the intertia.
	      v0 = e['velocity' + that.axis.toUpperCase()];
	
	      var maxV = 2;
	      var friction = 0.0015;
	      if (options.inertia && inertiaCoefficient[options.inertia]) {
	        maxV = inertiaCoefficient[options.inertia][0];
	        friction = inertiaCoefficient[options.inertia][1];
	      }
	
	      if (v0 > maxV) {
	        v0 = maxV;
	      }
	      if (v0 < -maxV) {
	        v0 = -maxV;
	      }
	      a0 = friction * (v0 / Math.abs(v0));
	      motion0 = new lib.motion({
	        v: v0,
	        a: -a0
	      });
	      t0 = motion0.t;
	      s = s0 + motion0.s;
	
	      var boundaryOffset1 = _getBoundaryOffset(that, s);
	      if (boundaryOffset1) {
	        debugLog('inertial calculation has exceeded the boundary', boundaryOffset1);
	
	        v1 = v0;
	        a1 = a0;
	        if (boundaryOffset1 > 0) {
	          s1 = that.minScrollOffset;
	          sign = 1;
	        } else {
	          s1 = that.maxScrollOffset;
	          sign = -1;
	        }
	        motion1 = new lib.motion({
	          v: sign * v1,
	          a: -sign * a1,
	          s: Math.abs(s1 - s0)
	        });
	        t1 = motion1.t;
	        var timeFunction1 = motion1.generateCubicBezier();
	
	        v2 = v1 - a1 * t1;
	        a2 = 0.03 * (v2 / Math.abs(v2));
	        motion2 = new lib.motion({
	          v: v2,
	          a: -a2
	        });
	        t2 = motion2.t;
	        s2 = s1 + motion2.s;
	        var timeFunction2 = motion2.generateCubicBezier();
	
	        if (options.noBounce) {
	          debugLog('no bounce effect');
	
	          if (s0 !== s1) {
	            if (options.useFrameAnimation) {
	              // frame
	              var _s = s1 - s0;
	              var bezier = lib.cubicbezier(timeFunction1[0][0], timeFunction1[0][1], timeFunction1[1][0], timeFunction1[1][1]);
	              scrollAnimation = new lib.animation(t1.toFixed(0), bezier, 0, function (i1, i2) {
	                var offset = s0 + _s * i2;
	                getTransformOffset(that, offset.toFixed(2));
	                fireEvent(that, 'scrolling', {
	                  afterFlick: true
	                });
	              });
	
	              scrollAnimation.onend(scrollEnd);
	
	              scrollAnimation.play();
	            } else {
	              // css
	              var offset = s1.toFixed(0);
	              setTransitionEndHandler(scrollEnd, (t1 / 1000).toFixed(2) * 1000);
	              setTransitionStyle(that, (t1 / 1000).toFixed(2) + 's', 'cubic-bezier(' + timeFunction1 + ')');
	              setTransformStyle(that, offset);
	            }
	          } else {
	            scrollEnd();
	          }
	        } else if (s0 !== s2) {
	          debugLog('scroll for inertia', 's=' + s2.toFixed(0), 't=' + ((t1 + t2) / 1000).toFixed(2));
	
	          if (options.useFrameAnimation) {
	            var _s = s2 - s0;
	            var bezier = lib.cubicbezier.easeOut;
	            scrollAnimation = new lib.animation((t1 + t2).toFixed(0), bezier, 0, function (i1, i2) {
	              var offset = s0 + _s * i2;
	              setTransformStyle(that, offset.toFixed(2));
	              fireEvent(that, 'scrolling', {
	                afterFlick: true
	              });
	            });
	
	            scrollAnimation.onend(function () {
	              if (!that.enabled) {
	                return;
	              }
	
	              var _s = s1 - s2;
	              var bezier = lib.cubicbezier.ease;
	              scrollAnimation = new lib.animation(400, bezier, 0, function (i1, i2) {
	                var offset = s2 + _s * i2;
	                setTransformStyle(that, offset.toFixed(2));
	                fireEvent(that, 'scrolling', {
	                  afterFlick: true
	                });
	              });
	
	              scrollAnimation.onend(scrollEnd);
	
	              scrollAnimation.play();
	            });
	
	            scrollAnimation.play();
	          } else {
	            var offset = s2.toFixed(0);
	            setTransitionEndHandler(function (e) {
	              if (!that.enabled) {
	                return;
	              }
	
	              debugLog('inertial bounce', 's=' + s1.toFixed(0), 't=400');
	
	              if (s2 !== s1) {
	                var offset = s1.toFixed(0);
	                setTransitionStyle(that, '0.4s', 'ease');
	                setTransformStyle(that, offset);
	                setTransitionEndHandler(scrollEnd, 400);
	              } else {
	                scrollEnd();
	              }
	            }, ((t1 + t2) / 1000).toFixed(2) * 1000);
	
	            setTransitionStyle(that, ((t1 + t2) / 1000).toFixed(2) + 's', 'ease-out');
	            setTransformStyle(that, offset);
	          }
	        } else {
	          scrollEnd();
	        }
	      } else {
	        debugLog('inertial calculation hasn\'t exceeded the boundary');
	        var timeFunction = motion0.generateCubicBezier();
	
	        if (options.useFrameAnimation) {
	          // frame
	          var _s = s - s0;
	          var bezier = lib.cubicbezier(timeFunction[0][0], timeFunction[0][1], timeFunction[1][0], timeFunction[1][1]);
	          scrollAnimation = new lib.animation(t0.toFixed(0), bezier, 0, function (i1, i2) {
	            var offset = (s0 + _s * i2).toFixed(2);
	            setTransformStyle(that, offset);
	            fireEvent(that, 'scrolling', {
	              afterFlick: true
	            });
	          });
	
	          scrollAnimation.onend(scrollEnd);
	
	          scrollAnimation.play();
	        } else {
	          // css
	          var offset = s.toFixed(0);
	          setTransitionEndHandler(scrollEnd, (t0 / 1000).toFixed(2) * 1000);
	          setTransitionStyle(that, (t0 / 1000).toFixed(2) + 's', 'cubic-bezier(' + timeFunction + ')');
	          setTransformStyle(that, offset);
	        }
	      }
	
	      isFlickScrolling = true;
	      if (!options.useFrameAnimation) {
	        lib.animation.requestFrame(function doScroll() {
	          if (isScrolling && isFlickScrolling && that.enabled) {
	            fireEvent(that, 'scrolling', {
	              afterFlick: true
	            });
	            lib.animation.requestFrame(doScroll);
	          }
	        });
	      }
	    }
	  }
	
	  function scrollEnd() {
	    if (!that.enabled) {
	      return;
	    }
	
	    cancelScrollEnd = false;
	
	    setTimeout(function () {
	      if (!cancelScrollEnd && isScrolling) {
	        isScrolling = false;
	        isFlickScrolling = false;
	
	        if (options.useFrameAnimation) {
	          scrollAnimation && scrollAnimation.stop();
	          scrollAnimation = null;
	        } else {
	          setTransitionStyle(that, '', '');
	        }
	        fireEvent(that, 'scrollend');
	      }
	    }, 50);
	  }
	
	  var proto = {
	    init: function init() {
	      this.enable();
	      this.refresh();
	      this.scrollTo(0);
	      return this;
	    },
	
	    enable: function enable() {
	      this.enabled = true;
	      return this;
	    },
	
	    disable: function disable() {
	      var el = this.element;
	      this.enabled = false;
	
	      if (this.options.useFrameAnimation) {
	        scrollAnimation && scrollAnimation.stop();
	      } else {
	        lib.animation.requestFrame(function () {
	          el.style[stylePrefix + 'Transform'] = getComputedStyle(el)[stylePrefix + 'Transform'];
	        });
	      }
	
	      return this;
	    },
	
	    getScrollWidth: function getScrollWidth() {
	      return getBoundingClientRect(this.element).width;
	    },
	
	    getScrollHeight: function getScrollHeight() {
	      return getBoundingClientRect(this.element).height;
	    },
	
	    getScrollLeft: function getScrollLeft() {
	      return -getTransformOffset(this).x - this.options.xPaddingTop;
	    },
	
	    getScrollTop: function getScrollTop() {
	      return -getTransformOffset(this).y - this.options.yPaddingTop;
	    },
	
	    getMaxScrollLeft: function getMaxScrollLeft() {
	      return -that.maxScrollOffset - this.options.xPaddingTop;
	    },
	
	    getMaxScrollTop: function getMaxScrollTop() {
	      return -that.maxScrollOffset - this.options.yPaddingTop;
	    },
	
	    getBoundaryOffset: function getBoundaryOffset() {
	      return Math.abs(_getBoundaryOffset(this, getTransformOffset(this)[this.axis]) || 0);
	    },
	
	    refresh: function refresh() {
	      var el = this.element;
	      var isVertical = this.axis === 'y';
	      var type = isVertical ? 'height' : 'width';
	      var size, rect, extraSize;
	
	      function getExtraSize(el, isVertical) {
	        var extraType = isVertical ? ['top', 'bottom'] : ['left', 'right'];
	        return parseFloat(getComputedStyle(el.firstElementChild)['margin-' + extraType[0]]) + parseFloat(getComputedStyle(el.lastElementChild)['margin-' + extraType[1]]);
	      }
	
	      if (this.options[type] != null) {
	        // use options
	        size = this.options[type];
	      } else if (el.childElementCount <= 0) {
	        el.style[type] = 'auto';
	        size = null;
	      } else if (!!this.options.useElementRect) {
	        el.style[type] = 'auto';
	        rect = getBoundingClientRect(el);
	        size = rect[type];
	        size += getExtraSize(el, isVertical);
	      } else {
	        var range, rect;
	        var firstEl = el.firstElementChild;
	        var lastEl = el.lastElementChild;
	
	        if (document.createRange && !this.options.ignoreOverflow) {
	          // use range
	          range = document.createRange();
	          range.selectNodeContents(el);
	          rect = getBoundingClientRect(range);
	        }
	
	        if (rect) {
	          size = rect[type];
	        } else {
	          // use child offsets
	          while (firstEl) {
	            if (getBoundingClientRect(firstEl)[type] === 0 && firstEl.nextElementSibling) {
	              firstEl = firstEl.nextElementSibling;
	            } else {
	              break;
	            }
	          }
	
	          while (lastEl && lastEl !== firstEl) {
	            if (getBoundingClientRect(lastEl)[type] === 0 && lastEl.previousElementSibling) {
	              lastEl = lastEl.previousElementSibling;
	            } else {
	              break;
	            }
	          }
	
	          size = getBoundingClientRect(lastEl)[isVertical ? 'bottom' : 'right'] - getBoundingClientRect(firstEl)[isVertical ? 'top' : 'left'];
	        }
	
	        size += getExtraSize(el, isVertical);
	      }
	
	      el.style[type] = size ? size + 'px' : 'auto';
	
	      this.transformOffset = getTransformOffset(this);
	      this.minScrollOffset = getMinScrollOffset(this);
	      this.maxScrollOffset = getMaxScrollOffset(this);
	
	      this.scrollTo(-this.transformOffset[this.axis] - this.options[this.axis + 'PaddingTop']);
	      fireEvent(this, 'contentrefresh');
	
	      return this;
	    },
	
	    offset: function offset(childEl) {
	      var elRect = getBoundingClientRect(this.element);
	      var childRect = getBoundingClientRect(childEl);
	      if (this.axis === 'y') {
	        var offsetRect = {
	          top: childRect.top - elRect.top - this.options.yPaddingTop,
	          left: childRect.left - elRect.left,
	          right: elRect.right - childRect.right,
	          width: childRect.width,
	          height: childRect.height
	        };
	
	        offsetRect.bottom = offsetRect.top + offsetRect.height;
	      } else {
	        var offsetRect = {
	          top: childRect.top - elRect.top,
	          bottom: elRect.bottom - childRect.bottom,
	          left: childRect.left - elRect.left - this.options.xPaddingTop,
	          width: childRect.width,
	          height: childRect.height
	        };
	
	        offsetRect.right = offsetRect.left + offsetRect.width;
	      }
	      return offsetRect;
	    },
	
	    getRect: function getRect(childEl) {
	      var viewRect = getBoundingClientRect(this.viewport);
	      var childRect = getBoundingClientRect(childEl);
	      if (this.axis === 'y') {
	        var offsetRect = {
	          top: childRect.top - viewRect.top,
	          left: childRect.left - viewRect.left,
	          right: viewRect.right - childRect.right,
	          width: childRect.width,
	          height: childRect.height
	        };
	
	        offsetRect.bottom = offsetRect.top + offsetRect.height;
	      } else {
	        var offsetRect = {
	          top: childRect.top - viewRect.top,
	          bottom: viewRect.bottom - childRect.bottom,
	          left: childRect.left - viewRect.left,
	          width: childRect.width,
	          height: childRect.height
	        };
	
	        offsetRect.right = offsetRect.left + offsetRect.width;
	      }
	      return offsetRect;
	    },
	
	    isInView: function isInView(childEl) {
	      var viewRect = this.getRect(this.viewport);
	      var childRect = this.getRect(childEl);
	      if (this.axis === 'y') {
	        return viewRect.top < childRect.bottom && viewRect.bottom > childRect.top;
	      }
	      return viewRect.left < childRect.right && viewRect.right > childRect.left;
	    },
	
	    scrollTo: function scrollTo(offset, isSmooth) {
	      var that = this;
	      var element = this.element;
	
	      offset = -offset - this.options[this.axis + 'PaddingTop'];
	      offset = touchBoundary(this, offset);
	
	      isScrolling = true;
	      if (isSmooth === true) {
	        if (this.options.useFrameAnimation) {
	          var s0 = getTransformOffset(that)[this.axis];
	          var _s = offset - s0;
	          scrollAnimation = new lib.animation(400, lib.cubicbezier.easeInOut, 0, function (i1, i2) {
	            var offset = (s0 + _s * i2).toFixed(2);
	            setTransformStyle(that, offset);
	            fireEvent(that, 'scrolling');
	          });
	
	          scrollAnimation.onend(scrollEnd);
	
	          scrollAnimation.play();
	        } else {
	          setTransitionEndHandler(scrollEnd, 400);
	          setTransitionStyle(that, '0.4s', 'ease-in-out');
	          setTransformStyle(that, offset);
	
	          lib.animation.requestFrame(function () {
	            if (isScrolling && that.enabled) {
	              fireEvent(that, 'scrolling');
	              lib.animation.requestFrame(arguments.callee);
	            }
	          });
	        }
	      } else {
	        if (!this.options.useFrameAnimation) {
	          setTransitionStyle(that, '', '');
	        }
	        setTransformStyle(that, offset);
	        scrollEnd();
	      }
	
	      return this;
	    },
	
	    scrollToElement: function scrollToElement(childEl, isSmooth, topOffset) {
	      var offset = this.offset(childEl);
	      offset = offset[this.axis === 'y' ? 'top' : 'left'];
	      topOffset && (offset += topOffset);
	      return this.scrollTo(offset, isSmooth);
	    },
	
	    getViewWidth: function getViewWidth() {
	      return getBoundingClientRect(this.viewport).width;
	    },
	
	    getViewHeight: function getViewHeight() {
	      return getBoundingClientRect(this.viewport).height;
	    },
	
	    addPulldownHandler: function addPulldownHandler(handler) {
	      var that = this;
	      this.element.addEventListener('pulldownend', function (e) {
	        that.disable();
	        handler.call(that, e, function () {
	          that.scrollTo(0, true);
	          that.refresh();
	          that.enable();
	        });
	      }, false);
	
	      return this;
	    },
	
	    addPullupHandler: function addPullupHandler(handler) {
	      var that = this;
	
	      this.element.addEventListener('pullupend', function (e) {
	        that.disable();
	        handler.call(that, e, function () {
	          that.scrollTo(that.getScrollHeight(), true);
	          that.refresh();
	          that.enable();
	        });
	      }, false);
	
	      return this;
	    },
	
	    addScrollstartHandler: function addScrollstartHandler(handler) {
	      var that = this;
	      this.element.addEventListener('scrollstart', function (e) {
	        handler.call(that, e);
	      }, false);
	
	      return this;
	    },
	
	    addScrollingHandler: function addScrollingHandler(handler) {
	      var that = this;
	      this.element.addEventListener('scrolling', function (e) {
	        handler.call(that, e);
	      }, false);
	
	      return this;
	    },
	
	    addScrollendHandler: function addScrollendHandler(handler) {
	      var that = this;
	      this.element.addEventListener('scrollend', function (e) {
	        handler.call(that, e);
	      }, false);
	
	      return this;
	    },
	
	    addContentrenfreshHandler: function addContentrenfreshHandler(handler) {
	      var that = this;
	      this.element.addEventListener('contentrefresh', function (e) {
	        handler.call(that, e);
	      }, false);
	    },
	
	    addEventListener: function addEventListener(name, handler, useCapture) {
	      var that = this;
	      this.element.addEventListener(name, function (e) {
	        handler.call(that, e);
	      }, !!useCapture);
	    },
	
	    removeEventListener: function removeEventListener(name, handler) {
	      var that = this;
	      this.element.removeEventListener(name, function (e) {
	        handler.call(that, e);
	      });
	    },
	
	    enablePlugin: function enablePlugin(name, options) {
	      var plugin = plugins[name];
	      if (plugin && !this.plugins[name]) {
	        this.plugins[name] = true;
	        options = options || {};
	        plugin.call(this, name, options);
	      }
	      return this;
	    }
	  };
	
	  for (var k in proto) {
	    this[k] = proto[k];
	  }
	  // delete proto
	}
	
	lib.scroll = function (el, options) {
	  if (arguments.length === 1 && !(arguments[0] instanceof HTMLElement)) {
	    options = arguments[0];
	    if (options.scrollElement) {
	      el = options.scrollElement;
	    } else if (options.scrollWrap) {
	      el = options.scrollWrap.firstElementChild;
	    } else {
	      throw new Error('no scroll element');
	    }
	  }
	
	  if (!el.parentNode) {
	    throw new Error('wrong dom tree');
	  }
	  if (options && options.direction && ['x', 'y'].indexOf(options.direction) < 0) {
	    throw new Error('wrong direction');
	  }
	
	  var scroll;
	  if (options.downgrade === true && lib.scroll.downgrade) {
	    scroll = lib.scroll.downgrade(el, options);
	  } else {
	    if (el.scrollId) {
	      scroll = scrollObjs[el.scrollId];
	    } else {
	      scroll = new Scroll(el, options);
	    }
	  }
	  return scroll;
	};
	
	lib.scroll.plugin = function (name, constructor) {
	  if (constructor) {
	    name = name.split(',');
	    name.forEach(function (n) {
	      plugins[n] = constructor;
	    });
	  } else {
	    return plugins[name];
	  }
	};

/***/ },
/* 111 */
/***/ function(module, exports) {

	/* global lib: true */
	
	'use strict';
	
	/**
	 * transfer Quadratic Bezier Curve to Cubic Bezier Curve
	 *
	 * @param  {number} a abscissa of p1
	 * @param  {number} b ordinate of p1
	 * @return {Array} parameter matrix for cubic bezier curve
	 *   like [[p1x, p1y], [p2x, p2y]]
	 */
	
	function quadratic2cubicBezier(a, b) {
	  return [[(a / 3 + (a + b) / 3 - a) / (b - a), (a * a / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)], [(b / 3 + (a + b) / 3 - a) / (b - a), (b * b / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)]];
	}
	
	/**
	 * derive position data from knowing motion parameters
	 * base on Newton's second law: s = vt + at^2/2
	 *
	 * @param {object} config object of { v, a, s, t }
	 *   - v: initial velocity
	 *   - a: accelerate speed
	 *   - t: time
	 *   - s: shifting
	 */
	function Motion(config) {
	  this.v = config.v || 0;
	  this.a = config.a || 0;
	
	  if (typeof config.t !== 'undefined') {
	    this.t = config.t;
	  }
	
	  if (typeof config.s !== 'undefined') {
	    this.s = config.s;
	  }
	
	  // derive time from shifting
	  if (typeof this.t === 'undefined') {
	    if (typeof this.s === 'undefined') {
	      this.t = -this.v / this.a;
	    } else {
	      var t1 = (Math.sqrt(this.v * this.v + 2 * this.a * this.s) - this.v) / this.a;
	      var t2 = (-Math.sqrt(this.v * this.v + 2 * this.a * this.s) - this.v) / this.a;
	      this.t = Math.min(t1, t2);
	    }
	  }
	
	  // derive shifting from time
	  if (typeof this.s === 'undefined') {
	    this.s = this.a * this.t * this.t / 2 + this.v * this.t;
	  }
	}
	
	/**
	 * derive cubic bezier parameters from motion parameters
	 * @return {Array} parameter matrix for cubic bezier curve
	 *   like [[p1x, p1y], [p2x, p2y]]
	 */
	Motion.prototype.generateCubicBezier = function () {
	  return quadratic2cubicBezier(this.v / this.a, this.t + this.v / this.a);
	};
	
	!lib && (lib = {});
	lib.motion = Motion;
	
	module.exports = Motion;

/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var List = __webpack_require__(107);
	
	function Hlist(data, nodeType) {
	  data.attr.direction = 'h';
	  List.call(this, data, nodeType);
	}
	
	Hlist.prototype = Object.create(List.prototype);
	
	module.exports = Hlist;

/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(102);
	var Kountdown = __webpack_require__(114);
	
	var FORMATTER_REGEXP = /(\\)?(dd*|hh?|mm?|ss?)/gi;
	
	function formatDateTime(data, formatter, timeColor) {
	  return formatter.replace(FORMATTER_REGEXP, function (m) {
	    var len = m.length;
	    var firstChar = m.charAt(0);
	    // escape character
	    if (firstChar === '\\') {
	      return m.replace('\\', '');
	    }
	    var value = (firstChar === 'd' ? data.days : firstChar === 'h' ? data.hours : firstChar === 'm' ? data.minutes : firstChar === 's' ? data.seconds : 0) + '';
	
	    // 5 zero should be enough
	    return '<span style="margin:4px;color:' + timeColor + '" >' + ('00000' + value).substr(-Math.max(value.length, len)) + '</span>';
	  });
	}
	
	function Countdown(data) {
	  Atomic.call(this, data);
	}
	
	Countdown.prototype = Object.create(Atomic.prototype);
	
	Countdown.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('weex-element');
	  var data = this.data;
	  var time = Number(data.attr.countdownTime) || 0;
	  var endTime = Date.now() / 1000 + time;
	  Kountdown({
	    endDate: endTime,
	    onUpdate: function onUpdate(time) {
	      var timeColor = data.style.timeColor || '#000';
	      var result = formatDateTime(time, data.attr.formatterValue, timeColor);
	      node.innerHTML = result;
	    },
	    onEnd: function onEnd() {}
	  }).start();
	
	  return node;
	};
	
	Countdown.prototype.style = {
	  textColor: function textColor(value) {
	    this.node.style.color = value;
	  }
	};
	
	module.exports = Countdown;

/***/ },
/* 114 */
/***/ function(module, exports) {

	'use strict';
	
	var DAY_SECONDS = 86400,
	    HOUR_SECONDS = 3600,
	    MINUTE_SECONDS = 60,
	    FORMATTER_DEFAULT = 'd天hh时mm分ss秒',
	    FORMATTER_REGEXP = /(\\)?(dd*|hh?|mm?|ss?)/gi;
	
	/**
	 * 倒计时。此类无法直接实例化，请使用 lib.countdown(options) 进行实例化。
	 * @class CountDown
	 * @param {Object} options 倒计时参数。
	 * @param {CountDown~DateSource} options.endDate 倒计时的结束时间点。倒计时必需有此属性，否则会抛错。
	 * @param {CountDown~StringFormatter} options.stringFormatter 倒计时数据的字符串格式。
	 * @param {Int} options.interval 倒计时更新的间隔频率。单位为毫秒。 默认值为：1000，即1秒。
	 * @param {Int} options.correctDateOffset 修正倒计时的时间偏差值。单位为秒。此属性可用来修正服务端与客户端的时间差。
	 * @param {CountDown~onUpdate} options.onUpdate 倒计时每次更新的回调函数。
	 * @param {HTMLElement} options.updateElement 倒计时的更新元素。可快捷的把倒计时结果通过innerHTML更新到此元素中。
	 * @param {Function} options.onEnd 倒计时结束时的回调函数。
	 */
	var CountDown = function CountDown(options) {
	    options = options || {};
	
	    //parse end date
	    var me = this,
	        endDate = parseDate(options.endDate);
	    if (!endDate || !endDate.getTime()) {
	        throw new Error('Invalid endDate');
	    } else {
	        me.endDate = endDate;
	    }
	
	    me.onUpdate = options.onUpdate;
	    me.onEnd = options.onEnd;
	    me.interval = options.interval || 1000;
	    me.stringFormatter = options.stringFormatter || FORMATTER_DEFAULT;
	    me.correctDateOffset = options.correctDateOffset || 0;
	    me.updateElement = options.updateElement;
	
	    //internal use
	    me._data = { days: 0, hours: 0, minutes: 0, seconds: 0 };
	};
	
	CountDown.prototype = {
	    /**
	     * 启动倒计时。
	     * @memberOf CountDown.prototype
	     */
	    start: function start() {
	        var me = this;
	        me.stop();
	
	        if (me._update()) {
	            me._intervalId = setInterval(function () {
	                me._update();
	            }, me.interval);
	        }
	
	        return me;
	    },
	
	    /**
	     * @private
	     */
	    _update: function _update() {
	        var me = this,
	            data = me._data,
	            elem = me.updateElement,
	            callback,
	            now = +new Date() + me.correctDateOffset * 1000,
	            diff = Math.max(0, Math.round((me.endDate.getTime() - now) / 1000)),
	            ended = diff <= 0;
	
	        //calc diff segment
	        data.totalSeconds = diff;
	        diff -= (data.days = Math.floor(diff / DAY_SECONDS)) * DAY_SECONDS;
	        diff -= (data.hours = Math.floor(diff / HOUR_SECONDS)) * HOUR_SECONDS;
	        diff -= (data.minutes = Math.floor(diff / MINUTE_SECONDS)) * MINUTE_SECONDS;
	        data.seconds = diff;
	
	        //format string value
	        data.stringValue = formatDateTime(data, me.stringFormatter);
	
	        //simple way to update element's content
	        if (elem) elem.innerHTML = data.stringValue;
	
	        //callback
	        (callback = me.onUpdate) && callback.call(me, data);
	        if (ended) {
	            me.stop();
	            (callback = me.onEnd) && callback.call(me);
	            return false;
	        }
	
	        return true;
	    },
	
	    /**
	     * 停止计时器。
	     * @memberOf CountDown.prototype
	     */
	    stop: function stop() {
	        var me = this;
	        if (me._intervalId) {
	            clearInterval(me._intervalId);
	            me._intervalId = null;
	        }
	        return me;
	    },
	
	    /**
	     * 设置结束时间。
	     * @memberOf CountDown.prototype
	     * @param {CountDown~DateSource} date 要设置的结束时间。 
	     */
	    setEndDate: function setEndDate(date) {
	        var me = this;
	        me.endDate = parseDate(date);
	        return me;
	    }
	};
	
	function parseDate(source) {
	    var date;
	
	    if (typeof source === 'number') {
	        date = new Date(source * 1000);
	    } else if (typeof source === 'string') {
	        var firstChar = source.charAt(0),
	            plus = firstChar === '+',
	            minus = firstChar === '-';
	
	        if (plus || minus) {
	            //offset date formate
	            var value = source.substr(1),
	                offsetValue,
	                arr = value.split(':'),
	                time = [0, 0, 0, 0],
	                index = 4;
	
	            while (arr.length && --index >= 0) {
	                time[index] = parseInt(arr.pop()) || 0;
	            }
	            offsetValue = DAY_SECONDS * time[0] + HOUR_SECONDS * time[1] + MINUTE_SECONDS * time[2] + time[3];
	
	            date = new Date();
	            date.setSeconds(date.getSeconds() + offsetValue * (minus ? -1 : 1));
	            date.setMilliseconds(0);
	        }
	    }
	
	    if (!date) date = new Date(source);
	
	    return date;
	}
	
	function formatDateTime(data, formatter) {
	    return formatter.replace(FORMATTER_REGEXP, function (m) {
	        var len = m.length,
	            firstChar = m.charAt(0);
	        //escape character
	        if (firstChar === '\\') return m.replace('\\', '');
	        var value = (firstChar === 'd' ? data.days : firstChar === 'h' ? data.hours : firstChar === 'm' ? data.minutes : firstChar === 's' ? data.seconds : 0) + '';
	
	        //5 zero should be enough
	        return ('00000' + value).substr(-Math.max(value.length, len));
	    });
	}
	
	/**
	 * 倒计时的日期源数据。
	 * @typedef {(Date|String|Number)} CountDown~DateSource
	 * @desc 当日期源数据类型为：
	 * <ul>
	 * <li>Date - 标准值。</li>
	 * <li>Number - 表示结束时间点相对于January 1, 1970, 00:00:00 UTC的绝对值，单位是秒。比如：new Date('2014-12-30 23:00:00').getTime() / 1000。</li>
	 * <li>String - 当为字符串时，则：
	 * <ul>
	 * <li>若以+或-开始，则结束时间点以当前时间即new Date()为相对时间点，再加上或减去字符串后半部分所表示的时长。后半部分，若是一个数值则为秒数，或为字符串，则会按照日:小时:分钟:秒的格式进行解析。</li>
	 * <li>其他，则尝试直接通过new Date(endDate)转换为Date。</li>
	 * </ul></li>
	 * <li>其他情况，则尝试直接通过new Date(endDate)转换为Date。</li>
	 * </ul>
	 */
	
	/**
	 * 倒计时数据的字符串格式。
	 * @typedef {String} CountDown~StringFormatter
	 * @desc 跟大多数语言的日期格式化类似，比如：dd:hh:mm:ss。 此字串中的特殊字符有：
	 * <ul>
	 * <li>d - 天数。</li>
	 * <li>h - 小时。</li>
	 * <li>m - 分钟。</li>
	 * <li>s - 秒。</li>
	 * </ul>
	 * 其中，多个相同的字符表示数值的位数，若最高位不够，则用0补齐。注意：若要格式字串里加入特殊字符，需要用\\进行转义。比如：d\\day\\s, hh\\hour\\s, mm\\minute\\s, ss\\secon\\d\\s。 默认值为：d天hh时mm分ss秒。
	 */
	
	/**
	 * 倒计时每次更新的回调函数。
	 * @callback CountDown~onUpdate
	 * @param {Object} data 更新回调的参数。
	 * @param {String} data.stringValue 通过stringFormatter格式化后的倒计时字符串值。
	 * @param {Int} data.totalSeconds 倒计时的总秒数。
	 * @param {Int} data.days 倒计时的天数部分。
	 * @param {Int} data.hours 倒计时的小时部分。
	 * @param {Int} data.minutes 倒计时的分钟部分。
	 * @param {Int} data.seconds 倒计时的秒数部分。
	 */
	
	/**
	 * 返回一个倒计时 {@link CountDown} 对象。
	 * @memberOf lib
	 * @function
	 * @param {Object} options 倒计时参数，与 {@link CountDown} 构造函数参数一致。
	 * @example
	 * var cd = lib.countdown({
	 *   endDate: '2014-12-30 23:00:00',
	 *   stringFormatter: 'd天 hh小时mm分ss秒',
	 *   onUpdate: function(data){
	 *     elem.innerHTML = data.stringValue;
	 *   },
	 *   onEnd: function(){
	 *       console.log('countdown ended');
	 *   }
	 * }).start();
	 */
	if (typeof window.lib === 'undefined') {
	    lib = {};
	}
	lib.countdown = function (options) {
	    return new CountDown(options);
	};
	
	module.exports = lib.countdown;

/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// const config = require('../config')
	
	var Component = __webpack_require__(89);
	var ComponentManager = __webpack_require__(82);
	var LazyLoad = __webpack_require__(85);
	
	function Marquee(data) {
	  this.interval = Number(data.attr.interval) || 5 * 1000;
	  this.transitionDuration = Number(data.attr.transitionDuration) || 500;
	  this.delay = Number(data.attr.delay) || 0;
	  Component.call(this, data);
	}
	
	Marquee.prototype = Object.create(Component.prototype);
	
	Marquee.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('weex-container');
	  node.style.overflow = 'hidden';
	  // fix page shaking during slider's playing
	  node.style.webkitTransform = 'translate3D(0,0,0)';
	  node.addEventListener('webkitTransitionEnd', this.end.bind(this), false);
	  return node;
	};
	
	Marquee.prototype.createChildren = function () {
	  // first run:
	  // - create each child
	  // - append to parentNode
	  // - find current and next
	  // - set current and next shown and others hidden
	  var children = this.data.children;
	  var parentRef = this.data.ref;
	  var instanceId = this.data.instanceId;
	  var items = [];
	  var componentManager = this.getComponentManager();
	
	  var fragment = void 0,
	      isFlex = void 0,
	      child = void 0,
	      i = void 0;
	
	  if (children && children.length) {
	    fragment = document.createDocumentFragment();
	    isFlex = false;
	    for (i = 0; i < children.length; i++) {
	      children[i].scale = this.data.scale;
	      children[i].instanceId = instanceId;
	      child = componentManager.createElement(children[i]);
	      child.parentRef = parentRef;
	      this.initChild(child);
	      // append and push
	      items.push(child);
	      fragment.appendChild(child.node);
	      if (!isFlex && child.data.style.hasOwnProperty('flex')) {
	        isFlex = true;
	      }
	    }
	    this.node.appendChild(fragment);
	  }
	
	  // set items
	  this.items = items;
	
	  // reset the clock for first transition
	  this.reset();
	};
	
	Marquee.prototype.initChild = function (child) {
	  var node = child.node;
	  node.style.position = 'absolute';
	  node.style.top = '0';
	  node.style.left = '0';
	};
	
	Marquee.prototype.appendChild = function (data) {
	  // dom + items
	  var componentManager = ComponentManager.getInstance(this.data.instanceId);
	  var child = componentManager.createElement(data);
	  this.initChild(child);
	  this.node.appendChild(child.node);
	  this.items.push(child);
	  this.reset();
	  return child; // @todo redesign Component#appendChild(component)
	};
	
	Marquee.prototype.insertBefore = function (child, before) {
	  // dom + items
	  var index = this.items.indexOf(before);
	  this.items.splice(index, 0, child);
	  this.initChild(child);
	  this.node.insertBefore(child.node, before.node);
	  this.reset();
	};
	
	Marquee.prototype.removeChild = function (child) {
	  // dom + items
	  var index = this.items.indexOf(child);
	  this.items.splice(index, 1);
	  this.node.removeChild(child.node);
	  this.reset();
	};
	
	/**
	 * status: {
	 *   current: {translateY: 0, shown: true},
	 *   next: {translateY: height, shown: true},
	 *   others[]: {shown: false}
	 *   index: index
	 * }
	 */
	Marquee.prototype.reset = function () {
	  var interval = this.interval - 0;
	  var delay = this.delay - 0;
	  var items = this.items;
	  var self = this;
	
	  var loop = function loop() {
	    self.next();
	    self.timerId = setTimeout(loop, self.interval);
	  };
	
	  // reset display and transform
	  items.forEach(function (item, index) {
	    var node = item.node;
	    // set non-current(0)|next(1) item hidden
	    node.style.display = index > 1 ? 'none' : '';
	    // set next(1) item translateY
	    // TODO: it supposed to use item.data.style
	    // but somehow the style object is empty.
	    // This problem relies on jsframework's bugfix.
	
	    // node.style.transform = index === 1
	    //     ? 'translate3D(0,' + config.scale * item.data.style.height + 'px,0)'
	    //     : ''
	    // node.style.webkitTransform = index === 1
	    //     ? 'translate3D(0,' + config.scale * item.data.style.height + 'px,0)'
	    //     : ''
	    node.style.transform = index === 1 ? 'translate3D(0,' + self.data.scale * self.data.style.height + 'px,0)' : '';
	    node.style.webkitTransform = index === 1 ? 'translate3D(0,' + self.data.scale * self.data.style.height + 'px,0)' : '';
	  });
	
	  setTimeout(function () {
	    // reset current, next, index
	    self.currentItem = items[0];
	    self.nextItem = items[1];
	    self.currentIndex = 0;
	
	    items.forEach(function (item, index) {
	      var node = item.node;
	      // set transition
	      node.style.transition = 'transform ' + self.transitionDuration + 'ms ease';
	      node.style.webkitTransition = '-webkit-transform ' + self.transitionDuration + 'ms ease';
	    });
	
	    clearTimeout(self.timerId);
	
	    if (items.length > 1) {
	      self.timerId = setTimeout(loop, delay + interval);
	    }
	  }, 13);
	};
	
	/**
	 * next:
	 * - current: {translateY: -height}
	 * - next: {translateY: 0}
	 */
	Marquee.prototype.next = function () {
	  // - update state
	  //   - set current and next transition
	  //   - hide current when transition end
	  //   - set next to current
	  //   - find new next
	  var next = this.nextItem.node;
	  var current = this.currentItem.node;
	  this.transitionIndex = this.currentIndex;
	
	  // Use setTimeout to fix the problem that when the
	  // page recover from backstage, the slider will
	  // not work any longer.
	  setTimeout(function () {
	    next.style.transform = 'translate3D(0,0,0)';
	    next.style.webkitTransform = 'translate3D(0,0,0)';
	    current.style.transform = 'translate3D(0,-' + this.data.scale * this.data.style.height + 'px,0)';
	    current.style.webkitTransform = 'translate3D(0,-' + this.data.scale * this.data.style.height + 'px,0)';
	    this.fireEvent('change');
	  }.bind(this), 300);
	};
	
	Marquee.prototype.fireEvent = function (type) {
	  var length = this.items.length;
	  var nextIndex = (this.currentIndex + 1) % length;
	  var evt = document.createEvent('HTMLEvents');
	  evt.initEvent(type, false, false);
	  evt.data = {
	    prevIndex: this.currentIndex,
	    index: nextIndex
	  };
	  this.node.dispatchEvent(evt);
	};
	
	/**
	 * end:
	 * - old current: {shown: false}
	 * - old current: {translateY: 0}
	 * - index++ % length
	 * - new current = old next
	 * - new next = items[index+1 % length]
	 * - new next: {translateY: height}
	 * - new next: {shown: true}
	 */
	Marquee.prototype.end = function (e) {
	  var items = this.items;
	  var length = items.length;
	  var currentIndex = void 0;
	
	  currentIndex = this.transitionIndex;
	
	  if (isNaN(currentIndex)) {
	    return;
	  }
	  delete this.transitionIndex;
	
	  var current = this.currentItem.node;
	  current.style.display = 'none';
	  current.style.webkitTransform = '';
	
	  currentIndex = (currentIndex + 1) % length;
	  var nextIndex = (currentIndex + 1) % length;
	
	  this.currentIndex = currentIndex;
	  this.currentItem = this.nextItem;
	  this.nextItem = items[nextIndex];
	
	  setTimeout(function () {
	    var next = this.nextItem.node;
	    // TODO: it supposed to use this.nextItem.data.style
	    // but somehow the style object is empty.
	    // This problem relies on jsframework's bugfix.
	
	    next.style.webkitTransform = 'translate3D(0,' + this.data.scale * this.data.style.height + 'px,0)';
	    next.style.display = '';
	    LazyLoad.loadIfNeeded(next);
	  }.bind(this));
	};
	
	Marquee.prototype.attr = {
	  interval: function interval(value) {
	    this.interval = value;
	  },
	  transitionDuration: function transitionDuration(value) {
	    this.transitionDuration = value;
	  },
	  delay: function delay(value) {
	    this.delay = value;
	  }
	};
	
	Marquee.prototype.clearAttr = function () {
	  this.interval = 5 * 1000;
	  this.transitionDuration = 500;
	  this.delay = 0;
	};
	
	module.exports = Marquee;

/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	/* global lib */
	
	'use strict';
	
	var extend = __webpack_require__(80).extend;
	// const config = require('../config')
	var Component = __webpack_require__(89);
	// const ComponentManager = require('../componentManager')
	// const LazyLoad = require('../lazyLoad')
	__webpack_require__(117);
	__webpack_require__(124);
	
	var DEFAULT_INTERVAL = 3000;
	
	function Slider(data) {
	  this.autoPlay = false; // default value is false.
	  this.interval = DEFAULT_INTERVAL;
	  this.direction = 'row'; // 'column' is not temporarily supported.
	  this.children = [];
	  this.isPageShow = true;
	  this.isDomRendering = true;
	
	  // bind event 'pageshow', 'pagehide' and 'visibilitychange' on window.
	  this._idleWhenPageDisappear();
	  // bind event 'renderBegin' and 'renderEnd' on window.
	  this._idleWhenDomRendering();
	
	  Component.call(this, data);
	}
	
	Slider.prototype = Object.create(Component.prototype);
	
	Slider.prototype._idleWhenPageDisappear = function () {
	  var _this = this;
	  function handlePageShow() {
	    _this.isPageShow = true;
	    _this.autoPlay && !_this.isDomRendering && _this.play();
	  }
	  function handlePageHide() {
	    _this.isPageShow = false;
	    _this.stop();
	  }
	  window.addEventListener('pageshow', handlePageShow);
	  window.addEventListener('pagehide', handlePageHide);
	  document.addEventListener('visibilitychange', function () {
	    if (document.visibilityState === 'visible') {
	      handlePageShow();
	    } else if (document.visibilityState === 'hidden') {
	      handlePageHide();
	    }
	  });
	};
	
	Slider.prototype._idleWhenDomRendering = function () {
	  var _this = this;
	  window.addEventListener('renderend', function () {
	    _this.isDomRendering = false;
	    _this.autoPlay && _this.isPageShow && _this.play();
	  });
	  window.addEventListener('renderbegin', function () {
	    _this.isDomRendering = true;
	    _this.stop();
	  });
	};
	
	Slider.prototype.attr = {
	  interval: function interval(val) {
	    this.interval = parseInt(val) || DEFAULT_INTERVAL;
	    if (this.carrousel) {
	      this.carrousel.playInterval = this.interval;
	    }
	  },
	
	  playstatus: function playstatus(val) {
	    this.playstatus = val && val !== 'false';
	    this.autoPlay = this.playstatus;
	    if (this.carrousel) {
	      if (this.playstatus) {
	        this.play();
	      } else {
	        this.stop();
	      }
	    }
	  },
	
	  // support playstatus' alias auto-play for compatibility
	  autoPlay: function autoPlay(val) {
	    this.attr.playstatus.call(this, val);
	  }
	};
	
	Slider.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('slider');
	  node.style.position = 'relative';
	  node.style.overflow = 'hidden';
	  return node;
	};
	
	Slider.prototype._doRender = function () {
	  var _this = this;
	  _this.createChildren();
	  _this.onAppend();
	};
	
	Slider.prototype.removeChild = function (child) {
	  var children = this.data.children;
	  if (children) {
	    for (var i = 0; i < children.length; i++) {
	      if (child.data.ref === children[i].ref) {
	        children.splice(i, 1);
	        break;
	      }
	    }
	  }
	
	  this._doRender();
	};
	
	Slider.prototype.insertBefore = function (child, before) {
	  var children = this.data.children;
	  var childIndex = -1;
	  for (var i = 0, l = children.length; i < l; i++) {
	    if (children[i].ref === before.data.ref) {
	      childIndex = i;
	      break;
	    }
	  }
	  children.splice(childIndex, 0, child.data);
	
	  this._doRender();
	  if (this.children.length > 0) {
	    return this.children[this.children.length - 1];
	  }
	};
	
	Slider.prototype.appendChild = function (data) {
	  var children = this.data.children || (this.data.children = []);
	  children.push(data);
	  this._doRender();
	  if (this.children.length > 0) {
	    return this.children[this.children.length - 1];
	  }
	};
	
	Slider.prototype.createChildren = function () {
	  var componentManager = this.getComponentManager();
	
	  // recreate slider container.
	  if (this.sliderContainer) {
	    this.node.removeChild(this.sliderContainer);
	  }
	  if (this.indicator) {
	    this.indicator.node.parentNode.removeChild(this.indicator.node);
	  }
	  this.children = [];
	
	  var sliderContainer = document.createElement('ul');
	  sliderContainer.style.listStyle = 'none';
	  this.node.appendChild(sliderContainer);
	  this.sliderContainer = sliderContainer;
	
	  var children = this.data.children;
	  var scale = this.data.scale;
	  var fragment = document.createDocumentFragment();
	  var indicatorData = void 0,
	      width = void 0,
	      height = void 0;
	  var childWidth = 0;
	  var childHeight = 0;
	
	  if (children && children.length) {
	    for (var i = 0; i < children.length; i++) {
	      var child = void 0;
	      children[i].scale = this.data.scale;
	      children[i].instanceId = this.data.instanceId;
	      if (children[i].type === 'indicator') {
	        indicatorData = extend(children[i], {
	          extra: {
	            amount: children.length - 1,
	            index: 0
	          }
	        });
	      } else {
	        child = componentManager.createElement(children[i], 'li');
	        this.children.push(child);
	        fragment.appendChild(child.node);
	        width = child.data.style.width || 0;
	        height = child.data.style.height || 0;
	        width > childWidth && (childWidth = width);
	        height > childHeight && (childHeight = height);
	        child.parentRef = this.data.ref;
	      }
	    }
	    // append indicator
	    if (indicatorData) {
	      indicatorData.extra.width = this.data.style.width || childWidth;
	      indicatorData.extra.height = this.data.style.height || childHeight;
	      this.indicator = componentManager.createElement(indicatorData);
	      this.indicator.parentRef = this.data.ref;
	      this.indicator.slider = this;
	      this.node.appendChild(this.indicator.node);
	    }
	
	    sliderContainer.style.height = scale * this.data.style.height + 'px';
	    sliderContainer.appendChild(fragment);
	  }
	};
	
	Slider.prototype.onAppend = function () {
	  if (this.carrousel) {
	    this.carrousel.removeEventListener('change', this._getSliderChangeHandler());
	    this.carrousel.stop();
	    this.carrousel = null;
	  }
	  var Carrousel = lib.carrousel;
	  this.carrousel = new Carrousel(this.sliderContainer, {
	    autoplay: this.autoPlay,
	    useGesture: true
	  });
	
	  this.carrousel.playInterval = this.interval;
	  this.carrousel.addEventListener('change', this._getSliderChangeHandler());
	  this.currentIndex = 0;
	
	  // preload all images for slider
	  // because:
	  // 1. lib-img doesn't listen to event transitionend
	  // 2. even if we fire lazy load in slider's change event handler,
	  //    the next image still won't be preloaded utill the moment it
	  //    slides into the view, which is too late.
	  if (this.preloadImgsTimer) {
	    clearTimeout(this.preloadImgsTimer);
	  }
	  // The time just before the second slide appear and enough
	  // for all child elements to append is ok.
	  var preloadTime = 0.8;
	  this.preloadImgsTimer = setTimeout(function () {
	    var imgs = this.carrousel.element.querySelectorAll('.weex-img');
	    for (var i = 0, l = imgs.length; i < l; i++) {
	      var img = imgs[i];
	      var iLazySrc = img.getAttribute('i-lazy-src');
	      var imgSrc = img.getAttribute('img-src');
	      if (iLazySrc) {
	        img.style.backgroundImage = 'url(' + iLazySrc + ')';
	      } else if (imgSrc) {
	        img.style.backgroundImage = 'url(' + imgSrc + ')';
	      }
	      img.removeAttribute('i-lazy-src');
	      img.removeAttribute('img-src');
	    }
	  }.bind(this), preloadTime * 1000);
	
	  // avoid page scroll when panning
	  var panning = false;
	  this.carrousel.element.addEventListener('panstart', function (e) {
	    if (!e.isVertical) {
	      panning = true;
	    }
	  });
	  this.carrousel.element.addEventListener('panend', function (e) {
	    if (!e.isVertical) {
	      panning = false;
	    }
	  });
	
	  document.addEventListener('touchmove', function (e) {
	    if (panning) {
	      e.preventDefault();
	      return false;
	    }
	    return true;
	  });
	};
	
	Slider.prototype._updateIndicators = function () {
	  this.indicator && this.indicator.setIndex(this.currentIndex);
	};
	
	Slider.prototype._getSliderChangeHandler = function (e) {
	  if (!this.sliderChangeHandler) {
	    this.sliderChangeHandler = function (e) {
	      var index = this.carrousel.items.index;
	      this.currentIndex = index;
	
	      // updateIndicators
	      this._updateIndicators();
	
	      this.dispatchEvent('change', { index: index });
	    }.bind(this);
	  }
	  return this.sliderChangeHandler;
	};
	
	Slider.prototype.play = function () {
	  this.carrousel.play();
	};
	
	Slider.prototype.stop = function () {
	  this.carrousel.stop();
	};
	
	Slider.prototype.slideTo = function (index) {
	  var offset = index - this.currentIndex;
	  this.carrousel.items.slide(offset);
	};
	
	module.exports = Slider;

/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	/* eslint-disable */
	
	'use strict';
	
	__webpack_require__(118);
	__webpack_require__(119);
	__webpack_require__(120);
	__webpack_require__(121);
	
	var doc = window.document;
	var ua = window.navigator.userAgent;
	var Firefox = !!ua.match(/Firefox/i);
	var IEMobile = !!ua.match(/IEMobile/i);
	var cssPrefix = Firefox ? '-moz-' : IEMobile ? '-ms-' : '-webkit-';
	var stylePrefix = Firefox ? 'Moz' : IEMobile ? 'ms' : 'webkit';
	
	var timer = __webpack_require__(123);
	var setTimeout = timer.setTimeout;
	var clearTimeout = timer.clearTimeout;
	
	function getTransformOffset(element) {
	  var offset = { x: 0, y: 0 };
	  var transform = getComputedStyle(element)[stylePrefix + 'Transform'];
	  var regMatrix3d = new RegExp('^matrix3d\\((?:[-\\d.]+,\\s*){12}([-\\d.]+),' + '\\s*([-\\d.]+)(?:,\\s*[-\\d.]+){2}\\)');
	  var regMatrix = /^matrix\((?:[-\d.]+,\s*){4}([-\d.]+),\s*([-\d.]+)\)$/;
	  var matched;
	
	  if (transform !== 'none') {
	    if (matched = transform.match(regMatrix3d) || transform.match(regMatrix)) {
	      offset.x = parseFloat(matched[1]) || 0;
	      offset.y = parseFloat(matched[2]) || 0;
	    }
	  }
	
	  return offset;
	}
	
	var CSSMatrix = IEMobile ? 'MSCSSMatrix' : 'WebKitCSSMatrix';
	var has3d = !!Firefox || CSSMatrix in window && 'm11' in new window[CSSMatrix]();
	function getTranslate(x, y) {
	  x = parseFloat(x);
	  y = parseFloat(y);
	
	  if (x != 0) {
	    x += 'px';
	  }
	
	  if (y != 0) {
	    y += 'px';
	  }
	
	  if (has3d) {
	    return 'translate3d(' + x + ', ' + y + ', 0)';
	  }
	
	  return 'translate(' + x + ', ' + y + ')';
	}
	
	var slice = Array.prototype.slice;
	function ArrayFrom(a) {
	  return slice.call(a);
	}
	
	var incId = 0;
	function Carrousel(element, options) {
	  var that = this;
	  var views = [];
	  var pages = {};
	  var id = Date.now() + '-' + ++incId;
	  var root = document.createDocumentFragment();
	
	  if (arguments.length === 1 && !(arguments[0] instanceof HTMLElement)) {
	    options = arguments[0];
	    element = null;
	  }
	
	  if (!element) {
	    element = document.createElement('ul');
	    root.appendChild(element);
	  }
	  options = options || {};
	
	  element.setAttribute('data-ctrl-name', 'carrousel');
	  element.setAttribute('data-ctrl-id', id);
	
	  function fireEvent(name, extra) {
	    var ev = doc.createEvent('HTMLEvents');
	    ev.initEvent(name, false, false);
	    if (extra) {
	      for (var key in extra) {
	        ev[key] = extra[key];
	      }
	    }
	    root.dispatchEvent(ev);
	  }
	
	  element.style.position = 'relative';
	  element.style[stylePrefix + 'Transform'] = getTranslate(0, 0);
	
	  var transformOffset = 0;
	  var items = {};
	  var itemLength = 0;
	  var itemStep = options.step || element.getBoundingClientRect().width;
	  var itemIndex = 0;
	
	  items.add = function (html) {
	    var li = document.createElement('li');
	    li.style.display = 'none';
	    li.style.float = 'left';
	    li.index = itemLength;
	    if (typeof html === 'string') {
	      li.innerHTML = html;
	    } else if (html instanceof HTMLElement) {
	      li.appendChild(html);
	    }
	    element.appendChild(li);
	
	    Object.defineProperty(items, itemLength + '', {
	      get: function get() {
	        return li;
	      }
	    });
	
	    itemLength++;
	    return li;
	  };
	
	  function normalizeIndex(index) {
	    while (index < 0) {
	      index += itemLength;
	    }
	
	    while (index >= itemLength) {
	      index -= itemLength;
	    }
	
	    return index;
	  }
	
	  items.get = function (index) {
	    return items[normalizeIndex(index)];
	  };
	
	  items.getCloned = function (index) {
	    var index = normalizeIndex(index);
	    var item = element.querySelector('[cloned="cloned-' + index + '"]');
	    var originalItem = items[index];
	
	    // If there a _listeners attribute on the dom element
	    // then clone the _listeners as well for the events' binding
	    function cloneEvents(origin, clone, deep) {
	      var listeners = origin._listeners;
	      if (listeners) {
	        clone._listeners = listeners;
	        for (var type in listeners) {
	          clone.addEventListener(type, listeners[type]);
	        }
	      }
	      if (deep && origin.children && origin.children.length) {
	        for (var i = 0, l = origin.children.length; i < l; i++) {
	          cloneEvents(origin.children[i], clone.children[i], deep);
	        }
	      }
	    }
	
	    if (!item) {
	      item = originalItem.cloneNode(true);
	      cloneEvents(originalItem, item, true);
	
	      element.appendChild(item);
	      item.setAttribute('cloned', 'cloned-' + index);
	      item.index = index;
	    }
	
	    return item;
	  };
	
	  function activate(index) {
	    if (itemLength === 0) {
	      return;
	    }
	
	    var curItem = items.get(index);
	    var prevItem;
	    var nextItem;
	
	    if (itemLength > 1) {
	      prevItem = items.get(index - 1);
	
	      if (itemLength === 2) {
	        nextItem = items.getCloned(index + 1);
	      } else {
	        nextItem = items.get(index + 1);
	      }
	
	      curItem.style.left = -transformOffset + 'px';
	      prevItem.style.left = -transformOffset - itemStep + 'px';
	      nextItem.style.left = -transformOffset + itemStep + 'px';
	    }
	
	    itemIndex = curItem.index;
	
	    fireEvent('change', {
	      prevItem: prevItem,
	      curItem: curItem,
	      nextItem: nextItem
	    });
	  }
	
	  items.slide = function (index) {
	    if (itemLength === 0) {
	      return;
	    }
	
	    if (itemLength === 1) {
	      index = 0;
	    }
	
	    var startOffset = getTransformOffset(element).x;
	    var endOffset = transformOffset + itemStep * -index;
	    var interOffset = endOffset - startOffset;
	
	    if (interOffset === 0) {
	      return;
	    }
	
	    var anim = new lib.animation(400, lib.cubicbezier.ease, function (i1, i2) {
	      element.style[stylePrefix + 'Transform'] = getTranslate(startOffset + interOffset * i2, 0);
	    }).play().then(function () {
	      transformOffset = endOffset;
	      element.style[stylePrefix + 'Transform'] = getTranslate(endOffset, 0);
	      index && activate(itemIndex + index);
	    });
	  };
	
	  items.next = function () {
	    items.slide(1);
	  };
	
	  items.prev = function () {
	    items.slide(-1);
	  };
	
	  ArrayFrom(element.children).forEach(function (el) {
	    el.style.position = 'absolute';
	    el.style.top = '0';
	    el.style.left = itemLength * itemStep + 'px';
	    el.style.float = 'left';
	    el.index = itemLength;
	    Object.defineProperty(items, itemLength + '', {
	      get: function get() {
	        return el;
	      }
	    });
	
	    itemLength++;
	  });
	
	  Object.defineProperty(this, 'items', {
	    get: function get() {
	      return items;
	    }
	  });
	
	  Object.defineProperty(items, 'length', {
	    get: function get() {
	      return itemLength;
	    }
	  });
	
	  Object.defineProperty(items, 'index', {
	    get: function get() {
	      return itemIndex;
	    }
	  });
	
	  Object.defineProperty(items, 'step', {
	    get: function get() {
	      return itemStep;
	    },
	
	    set: function set(v) {
	      itemStep = v;
	    }
	  });
	
	  var starting = false;
	  var playing = false;
	  var isSliding = false;
	  this.play = function () {
	    if (!starting) {
	      starting = true;
	      return activate(0);
	    }
	
	    if (!!playing) {
	      return;
	    }
	
	    playing = setTimeout(function play() {
	      isSliding = true;
	      items.next();
	      setTimeout(function () {
	        isSliding = false;
	      }, 500);
	      playing = setTimeout(play, 400 + playInterval);
	    }, 400 + playInterval);
	  };
	
	  this.stop = function () {
	    if (!playing) {
	      return;
	    }
	    clearTimeout(playing);
	    setTimeout(function () {
	      playing = false;
	    }, 500);
	  };
	
	  var autoplay = false;
	  var readyToPlay = false;
	  Object.defineProperty(this, 'autoplay', {
	    get: function get() {
	      return autoplay;
	    },
	    set: function set(v) {
	      autoplay = !!v;
	      if (readyToPlay) {
	        clearTimeout(readyToPlay);
	        readyToPlay = false;
	      }
	      if (autoplay) {
	        readyToPlay = setTimeout(function () {
	          that.play();
	        }, 2000);
	      } else {
	        that.stop();
	      }
	    }
	  });
	  this.autoplay = !!options.autoplay;
	
	  var playInterval = 1500;
	  Object.defineProperty(this, 'playInterval', {
	    get: function get() {
	      return playInterval;
	    },
	    set: function set(n) {
	      playInterval = n;
	    }
	  });
	  this.playInterval = !!options.playInterval || 1500;
	
	  if (options.useGesture) {
	    var panning = false;
	    var displacement;
	    element.addEventListener('panstart', function (e) {
	      if (!e.isVertical && !(panning && isSliding)) {
	        e.preventDefault();
	        e.stopPropagation();
	
	        if (autoplay) {
	          that.stop();
	        }
	
	        displacement = 0;
	        panning = true;
	      }
	    });
	
	    element.addEventListener('panmove', function (e) {
	      if (!e.isVertical && panning) {
	        e.preventDefault();
	        e.stopPropagation();
	        displacement = e.displacementX;
	        element.style[stylePrefix + 'Transform'] = getTranslate(transformOffset + displacement, 0);
	      }
	    });
	
	    element.addEventListener('panend', function (e) {
	      if (!e.isVertical && panning) {
	        e.preventDefault();
	        e.stopPropagation();
	        panning = false;
	        if (e.isSwipe) {
	          if (displacement < 0) {
	            items.next();
	          } else {
	            items.prev();
	          }
	        } else {
	          if (Math.abs(displacement) < itemStep / 2) {
	            items.slide(0);
	          } else {
	            items.slide(displacement < 0 ? 1 : -1);
	          }
	        }
	
	        if (autoplay) {
	          setTimeout(function () {
	            that.play();
	          }, 2000);
	        }
	      }
	    }, false);
	
	    element.addEventListener('swipe', function (e) {
	      if (!e.isVertical) {
	        e.preventDefault();
	        e.stopPropagation();
	      }
	    });
	  }
	
	  this.addEventListener = function (name, handler) {
	    this.root.addEventListener(name, handler, false);
	  };
	
	  this.removeEventListener = function (name, handler) {
	    this.root.removeEventListener(name, handler, false);
	  };
	
	  this.root = root;
	  this.element = element;
	}
	
	!lib && (lib = {});
	lib.carrousel = Carrousel;

/***/ },
/* 118 */
/***/ function(module, exports) {

	/* eslint-disable */
	
	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var isInitialized = false;
	
	// major events supported:
	//   panstart
	//   panmove
	//   panend
	//   swipe
	//   longpress
	// extra events supported:
	//   dualtouchstart
	//   dualtouch
	//   dualtouchend
	//   tap
	//   doubletap
	//   pressend
	
	var doc = window.document;
	var docEl = doc.documentElement;
	var slice = Array.prototype.slice;
	var gestures = {};
	var lastTap = null;
	
	/**
	 * find the closest common ancestor
	 * if there's no one, return null
	 *
	 * @param  {Element} el1 first element
	 * @param  {Element} el2 second element
	 * @return {Element}     common ancestor
	 */
	function getCommonAncestor(el1, el2) {
	  var el = el1;
	  while (el) {
	    if (el.contains(el2) || el == el2) {
	      return el;
	    }
	    el = el.parentNode;
	  }
	  return null;
	}
	
	/**
	 * fire a HTMLEvent
	 *
	 * @param  {Element} element which element to fire a event on
	 * @param  {string}  type    type of event
	 * @param  {object}  extra   extra data for the event object
	 */
	function fireEvent(element, type, extra) {
	  var event = doc.createEvent('HTMLEvents');
	  event.initEvent(type, true, true);
	
	  if ((typeof extra === 'undefined' ? 'undefined' : _typeof(extra)) === 'object') {
	    for (var p in extra) {
	      event[p] = extra[p];
	    }
	  }
	
	  element.dispatchEvent(event);
	}
	
	/**
	 * calc the transform
	 * assume 4 points ABCD on the coordinate system
	 * > rotate：angle rotating from AB to CD
	 * > scale：scale ratio from AB to CD
	 * > translate：translate shift from A to C
	 *
	 * @param  {number} x1 abscissa of A
	 * @param  {number} y1 ordinate of A
	 * @param  {number} x2 abscissa of B
	 * @param  {number} y2 ordinate of B
	 * @param  {number} x3 abscissa of C
	 * @param  {number} y3 ordinate of C
	 * @param  {number} x4 abscissa of D
	 * @param  {number} y4 ordinate of D
	 * @return {object}    transform object like
	 *   {rotate, scale, translate[2], matrix[3][3]}
	 */
	function calc(x1, y1, x2, y2, x3, y3, x4, y4) {
	  var rotate = Math.atan2(y4 - y3, x4 - x3) - Math.atan2(y2 - y1, x2 - x1);
	  var scale = Math.sqrt((Math.pow(y4 - y3, 2) + Math.pow(x4 - x3, 2)) / (Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2)));
	  var translate = [x3 - scale * x1 * Math.cos(rotate) + scale * y1 * Math.sin(rotate), y3 - scale * y1 * Math.cos(rotate) - scale * x1 * Math.sin(rotate)];
	
	  return {
	    rotate: rotate,
	    scale: scale,
	    translate: translate,
	    matrix: [[scale * Math.cos(rotate), -scale * Math.sin(rotate), translate[0]], [scale * Math.sin(rotate), scale * Math.cos(rotate), translate[1]], [0, 0, 1]]
	  };
	}
	
	/**
	 * take over the touchstart events. Add new touches to the gestures.
	 * If there is no previous records, then bind touchmove, tochend
	 * and touchcancel events.
	 * new touches initialized with state 'tapping', and within 500 milliseconds
	 * if the state is still tapping, then trigger gesture 'press'.
	 * If there are two touche points, then the 'dualtouchstart' is triggerd. The
	 * node of the touch gesture is their cloest common ancestor.
	 *
	 * @event
	 * @param  {event} event
	 */
	function touchstartHandler(event) {
	
	  if (Object.keys(gestures).length === 0) {
	    docEl.addEventListener('touchmove', touchmoveHandler, false);
	    docEl.addEventListener('touchend', touchendHandler, false);
	    docEl.addEventListener('touchcancel', touchcancelHandler, false);
	  }
	
	  // record every touch
	  for (var i = 0; i < event.changedTouches.length; i++) {
	    var touch = event.changedTouches[i];
	    var touchRecord = {};
	
	    for (var p in touch) {
	      touchRecord[p] = touch[p];
	    }
	
	    var gesture = {
	      startTouch: touchRecord,
	      startTime: Date.now(),
	      status: 'tapping',
	      element: event.srcElement || event.target,
	      pressingHandler: setTimeout(function (element, touch) {
	        return function () {
	          if (gesture.status === 'tapping') {
	            gesture.status = 'pressing';
	
	            fireEvent(element, 'longpress', {
	              // add touch data for weex
	              touch: touch,
	              touches: event.touches,
	              changedTouches: event.changedTouches,
	              touchEvent: event
	            });
	          }
	
	          clearTimeout(gesture.pressingHandler);
	          gesture.pressingHandler = null;
	        };
	      }(event.srcElement || event.target, event.changedTouches[i]), 500)
	    };
	    gestures[touch.identifier] = gesture;
	  }
	
	  if (Object.keys(gestures).length == 2) {
	    var elements = [];
	
	    for (var p in gestures) {
	      elements.push(gestures[p].element);
	    }
	
	    fireEvent(getCommonAncestor(elements[0], elements[1]), 'dualtouchstart', {
	      touches: slice.call(event.touches),
	      touchEvent: event
	    });
	  }
	}
	
	/**
	 * take over touchmove events, and handle pan and dual related gestures.
	 *
	 * 1. traverse every touch point：
	 * > if 'tapping' and the shift is over 10 pixles, then it's a 'panning'.
	 * 2. if there are two touch points, then calc the tranform and trigger
	 *   'dualtouch'.
	 *
	 * @event
	 * @param  {event} event
	 */
	function touchmoveHandler(event) {
	  for (var i = 0; i < event.changedTouches.length; i++) {
	    var touch = event.changedTouches[i];
	    var gesture = gestures[touch.identifier];
	
	    if (!gesture) {
	      return;
	    }
	
	    if (!gesture.lastTouch) {
	      gesture.lastTouch = gesture.startTouch;
	    }
	    if (!gesture.lastTime) {
	      gesture.lastTime = gesture.startTime;
	    }
	    if (!gesture.velocityX) {
	      gesture.velocityX = 0;
	    }
	    if (!gesture.velocityY) {
	      gesture.velocityY = 0;
	    }
	    if (!gesture.duration) {
	      gesture.duration = 0;
	    }
	
	    var time = Date.now() - gesture.lastTime;
	    var vx = (touch.clientX - gesture.lastTouch.clientX) / time;
	    var vy = (touch.clientY - gesture.lastTouch.clientY) / time;
	
	    var RECORD_DURATION = 70;
	    if (time > RECORD_DURATION) {
	      time = RECORD_DURATION;
	    }
	    if (gesture.duration + time > RECORD_DURATION) {
	      gesture.duration = RECORD_DURATION - time;
	    }
	
	    gesture.velocityX = (gesture.velocityX * gesture.duration + vx * time) / (gesture.duration + time);
	    gesture.velocityY = (gesture.velocityY * gesture.duration + vy * time) / (gesture.duration + time);
	    gesture.duration += time;
	
	    gesture.lastTouch = {};
	
	    for (var p in touch) {
	      gesture.lastTouch[p] = touch[p];
	    }
	    gesture.lastTime = Date.now();
	
	    var displacementX = touch.clientX - gesture.startTouch.clientX;
	    var displacementY = touch.clientY - gesture.startTouch.clientY;
	    var distance = Math.sqrt(Math.pow(displacementX, 2) + Math.pow(displacementY, 2));
	    var isVertical = !(Math.abs(displacementX) > Math.abs(displacementY));
	    var direction = isVertical ? displacementY >= 0 ? 'down' : 'up' : displacementX >= 0 ? 'right' : 'left';
	
	    // magic number 10: moving 10px means pan, not tap
	    if ((gesture.status === 'tapping' || gesture.status === 'pressing') && distance > 10) {
	      gesture.status = 'panning';
	      gesture.isVertical = isVertical;
	      gesture.direction = direction;
	
	      fireEvent(gesture.element, 'panstart', {
	        touch: touch,
	        touches: event.touches,
	        changedTouches: event.changedTouches,
	        touchEvent: event,
	        isVertical: gesture.isVertical,
	        direction: direction
	      });
	    }
	
	    if (gesture.status === 'panning') {
	      gesture.panTime = Date.now();
	
	      fireEvent(gesture.element, 'panmove', {
	        displacementX: displacementX,
	        displacementY: displacementY,
	        touch: touch,
	        touches: event.touches,
	        changedTouches: event.changedTouches,
	        touchEvent: event,
	        isVertical: gesture.isVertical,
	        direction: direction
	      });
	    }
	  }
	
	  if (Object.keys(gestures).length == 2) {
	    var position = [];
	    var current = [];
	    var elements = [];
	    var transform;
	
	    for (var i = 0; i < event.touches.length; i++) {
	      var touch = event.touches[i];
	      var gesture = gestures[touch.identifier];
	      position.push([gesture.startTouch.clientX, gesture.startTouch.clientY]);
	      current.push([touch.clientX, touch.clientY]);
	    }
	
	    for (var p in gestures) {
	      elements.push(gestures[p].element);
	    }
	
	    transform = calc(position[0][0], position[0][1], position[1][0], position[1][1], current[0][0], current[0][1], current[1][0], current[1][1]);
	    fireEvent(getCommonAncestor(elements[0], elements[1]), 'dualtouch', {
	      transform: transform,
	      touches: event.touches,
	      touchEvent: event
	    });
	  }
	}
	
	/**
	 * handle touchend event
	 *
	 * 1. if there are tow touch points, then trigger 'dualtouchend'如
	 *
	 * 2. traverse every touch piont：
	 * > if tapping, then trigger 'tap'.
	 * If there is a tap 300 milliseconds before, then it's a 'doubletap'.
	 * > if padding, then decide to trigger 'panend' or 'swipe'
	 * > if pressing, then trigger 'pressend'.
	 *
	 * 3. remove listeners.
	 *
	 * @event
	 * @param  {event} event
	 */
	function touchendHandler(event) {
	
	  if (Object.keys(gestures).length == 2) {
	    var elements = [];
	    for (var p in gestures) {
	      elements.push(gestures[p].element);
	    }
	    fireEvent(getCommonAncestor(elements[0], elements[1]), 'dualtouchend', {
	      touches: slice.call(event.touches),
	      touchEvent: event
	    });
	  }
	
	  for (var i = 0; i < event.changedTouches.length; i++) {
	    var touch = event.changedTouches[i];
	    var id = touch.identifier;
	    var gesture = gestures[id];
	
	    if (!gesture) {
	      continue;
	    }
	
	    if (gesture.pressingHandler) {
	      clearTimeout(gesture.pressingHandler);
	      gesture.pressingHandler = null;
	    }
	
	    if (gesture.status === 'tapping') {
	      gesture.timestamp = Date.now();
	      fireEvent(gesture.element, 'tap', {
	        touch: touch,
	        touchEvent: event
	      });
	
	      if (lastTap && gesture.timestamp - lastTap.timestamp < 300) {
	        fireEvent(gesture.element, 'doubletap', {
	          touch: touch,
	          touchEvent: event
	        });
	      }
	
	      lastTap = gesture;
	    }
	
	    if (gesture.status === 'panning') {
	      var now = Date.now();
	      var duration = now - gesture.startTime;
	      var displacementX = touch.clientX - gesture.startTouch.clientX;
	      var displacementY = touch.clientY - gesture.startTouch.clientY;
	
	      var velocity = Math.sqrt(gesture.velocityY * gesture.velocityY + gesture.velocityX * gesture.velocityX);
	      var isSwipe = velocity > 0.5 && now - gesture.lastTime < 100;
	      var extra = {
	        duration: duration,
	        isSwipe: isSwipe,
	        velocityX: gesture.velocityX,
	        velocityY: gesture.velocityY,
	        displacementX: displacementX,
	        displacementY: displacementY,
	        touch: touch,
	        touches: event.touches,
	        changedTouches: event.changedTouches,
	        touchEvent: event,
	        isVertical: gesture.isVertical,
	        direction: gesture.direction
	      };
	
	      fireEvent(gesture.element, 'panend', extra);
	      if (isSwipe) {
	        fireEvent(gesture.element, 'swipe', extra);
	      }
	    }
	
	    if (gesture.status === 'pressing') {
	      fireEvent(gesture.element, 'pressend', {
	        touch: touch,
	        touchEvent: event
	      });
	    }
	
	    delete gestures[id];
	  }
	
	  if (Object.keys(gestures).length === 0) {
	    docEl.removeEventListener('touchmove', touchmoveHandler, false);
	    docEl.removeEventListener('touchend', touchendHandler, false);
	    docEl.removeEventListener('touchcancel', touchcancelHandler, false);
	  }
	}
	
	/**
	 * handle touchcancel
	 *
	 * 1. if there are two touch points, then trigger 'dualtouchend'
	 *
	 * 2. traverse everty touch point:
	 * > if pannnig, then trigger 'panend'
	 * > if pressing, then trigger 'pressend'
	 *
	 * 3. remove listeners
	 *
	 * @event
	 * @param  {event} event
	 */
	function touchcancelHandler(event) {
	
	  if (Object.keys(gestures).length == 2) {
	    var elements = [];
	    for (var p in gestures) {
	      elements.push(gestures[p].element);
	    }
	    fireEvent(getCommonAncestor(elements[0], elements[1]), 'dualtouchend', {
	      touches: slice.call(event.touches),
	      touchEvent: event
	    });
	  }
	
	  for (var i = 0; i < event.changedTouches.length; i++) {
	    var touch = event.changedTouches[i];
	    var id = touch.identifier;
	    vargesture = gestures[id];
	
	    if (!gesture) {
	      continue;
	    }
	
	    if (gesture.pressingHandler) {
	      clearTimeout(gesture.pressingHandler);
	      gesture.pressingHandler = null;
	    }
	
	    if (gesture.status === 'panning') {
	      fireEvent(gesture.element, 'panend', {
	        touch: touch,
	        touches: event.touches,
	        changedTouches: event.changedTouches,
	        touchEvent: event
	      });
	    }
	    if (gesture.status === 'pressing') {
	      fireEvent(gesture.element, 'pressend', {
	        touch: touch,
	        touchEvent: event
	      });
	    }
	    delete gestures[id];
	  }
	
	  if (Object.keys(gestures).length === 0) {
	    docEl.removeEventListener('touchmove', touchmoveHandler, false);
	    docEl.removeEventListener('touchend', touchendHandler, false);
	    docEl.removeEventListener('touchcancel', touchcancelHandler, false);
	  }
	}
	
	if (!isInitialized) {
	  docEl.addEventListener('touchstart', touchstartHandler, false);
	  isInitialized = true;
	}

/***/ },
/* 119 */
/***/ function(module, exports) {

	'use strict';
	
	typeof window === 'undefined' && (window = { ctrl: {}, lib: {} });!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function (a, b) {
	  function c(a, b, c, d) {
	    function e(a) {
	      return (3 * k * a + 2 * l) * a + m;
	    }function f(a) {
	      return ((k * a + l) * a + m) * a;
	    }function g(a) {
	      return ((n * a + o) * a + p) * a;
	    }function h(a) {
	      for (var b, c, d = a, g = 0; 8 > g; g++) {
	        if (c = f(d) - a, Math.abs(c) < j) return d;if (b = e(d), Math.abs(b) < j) break;d -= c / b;
	      }var h = 1,
	          i = 0;for (d = a; h > i;) {
	        if (c = f(d) - a, Math.abs(c) < j) return d;c > 0 ? h = d : i = d, d = (h + i) / 2;
	      }return d;
	    }function i(a) {
	      return g(h(a));
	    }var j = 1e-6,
	        k = 3 * a - 3 * c + 1,
	        l = 3 * c - 6 * a,
	        m = 3 * a,
	        n = 3 * b - 3 * d + 1,
	        o = 3 * d - 6 * b,
	        p = 3 * b;return i;
	  }b.cubicbezier = c, b.cubicbezier.linear = c(0, 0, 1, 1), b.cubicbezier.ease = c(.25, .1, .25, 1), b.cubicbezier.easeIn = c(.42, 0, 1, 1), b.cubicbezier.easeOut = c(0, 0, .58, 1), b.cubicbezier.easeInOut = c(.42, 0, .58, 1);
	}(window, window.lib || (window.lib = {}));;module.exports = window.lib['cubicbezier'];

/***/ },
/* 120 */
/***/ function(module, exports) {

	"use strict";
	
	typeof window === 'undefined' && (window = { ctrl: {}, lib: {} });!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function (a, b) {
	  function c(a) {
	    return setTimeout(a, l);
	  }function d(a) {
	    clearTimeout(a);
	  }function e() {
	    var a = {},
	        b = new m(function (b, c) {
	      a.resolve = b, a.reject = c;
	    });return a.promise = b, a;
	  }function f(a, b) {
	    return ["then", "catch"].forEach(function (c) {
	      b[c] = function () {
	        return a[c].apply(a, arguments);
	      };
	    }), b;
	  }function g(b) {
	    var c,
	        d,
	        h = !1;this.request = function () {
	      h = !1;var g = arguments;return c = e(), f(c.promise, this), d = n(function () {
	        h || c && c.resolve(b.apply(a, g));
	      }), this;
	    }, this.cancel = function () {
	      return d && (h = !0, o(d), c && c.reject("CANCEL")), this;
	    }, this.clone = function () {
	      return new g(b);
	    };
	  }function h(a, b) {
	    "function" == typeof b && (b = { 0: b });for (var c = a / l, d = 1 / c, e = [], f = Object.keys(b).map(function (a) {
	      return parseInt(a);
	    }), h = 0; c > h; h++) {
	      var i = f[0],
	          j = d * h;if (null != i && 100 * j >= i) {
	        var k = b["" + i];k instanceof g || (k = new g(k)), e.push(k), f.shift();
	      } else e.length && e.push(e[e.length - 1].clone());
	    }return e;
	  }function i(a) {
	    var c;return "string" == typeof a || a instanceof Array ? b.cubicbezier ? "string" == typeof a ? b.cubicbezier[a] && (c = b.cubicbezier[a]) : a instanceof Array && 4 === a.length && (c = b.cubicbezier.apply(b.cubicbezier, a)) : console.error("require lib.cubicbezier") : "function" == typeof a && (c = a), c;
	  }function j(a, b, c) {
	    var d,
	        g = h(a, c),
	        j = 1 / (a / l),
	        k = 0,
	        m = i(b);if (!m) throw new Error("unexcept timing function");var n = !1;this.play = function () {
	      function a() {
	        var c = j * (k + 1).toFixed(10),
	            e = g[k];e.request(c.toFixed(10), b(c).toFixed(10)).then(function () {
	          n && (k === g.length - 1 ? (n = !1, d && d.resolve("FINISH"), d = null) : (k++, a()));
	        }, function () {});
	      }if (!n) return n = !0, d || (d = e(), f(d.promise, this)), a(), this;
	    }, this.stop = function () {
	      return n ? (n = !1, g[k] && g[k].cancel(), this) : void 0;
	    };
	  }var k = 60,
	      l = 1e3 / k,
	      m = a.Promise || b.promise && b.promise.ES6Promise,
	      n = window.requestAnimationFrame || window.msRequestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || c,
	      o = window.cancelAnimationFrame || window.msCancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || d;(n === c || o === d) && (n = c, o = d), b.animation = function (a, b, c) {
	    return new j(a, b, c);
	  }, b.animation.frame = function (a) {
	    return new g(a);
	  }, b.animation.requestFrame = function (a) {
	    var b = new g(a);return b.request();
	  };
	}(window, window.lib || (window.lib = {}));;module.exports = window.lib['animation'];

/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(122);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./carrousel.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./carrousel.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, "[data-ctrl-name=\"carrousel\"] {\n  position: relative;\n  -webkit-transform: translateZ(1px);\n  -ms-transform: translateZ(1px);\n  transform: translateZ(1px);\n}", ""]);
	
	// exports


/***/ },
/* 123 */
/***/ function(module, exports) {

	/* eslint-disable */
	
	'use strict';
	
	var _fallback = false;
	
	var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
	if (!raf) {
	  _fallback = true;
	  raf = function raf(callback) {
	    return setTimeout(callback, 16);
	  };
	}
	var caf = window.cancelAnimationFrame || window.webkitCancelAnimationFrame;
	if (!caf && _fallback) {
	  caf = function caf(id) {
	    return clearTimeout(id);
	  };
	} else if (!caf) {
	  caf = function caf() {};
	}
	
	var MAX = (Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1) - 1;
	
	var _idMap = {};
	var _globalId = 0;
	
	function _getGlobalId() {
	  _globalId = (_globalId + 1) % MAX;
	  if (_idMap[_globalId]) {
	    return _getGlobalId();
	  }
	  return _globalId;
	}
	
	var timer = {
	
	  setTimeout: function setTimeout(cb, ms) {
	    var id = _getGlobalId();
	    var start = Date.now();
	    _idMap[id] = raf(function loop() {
	      if (!_idMap[id] && _idMap[id] !== 0) {
	        return;
	      }
	      var ind = Date.now() - start;
	      if (ind < ms) {
	        _idMap[id] = raf(loop);
	      } else {
	        delete _idMap[id];
	        cb();
	      }
	    });
	    return id;
	  },
	
	  clearTimeout: function clearTimeout(id) {
	    var tid = _idMap[id];
	    tid && caf(tid);
	    delete _idMap[id];
	  }
	
	};
	
	module.exports = timer;

/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(125);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./slider.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./slider.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".slider {\n  position: relative;\n}\n\n.slider .indicator-container {\n  position: absolute;\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-align: center;\n  box-align: center;\n  -webkit-align-items: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  box-pack: center;\n  -webkit-justify-content: center;\n  justify-content: center;\n  font-size: 0;\n}\n.slider .indicator-container .indicator {\n  border-radius: 50%;\n}\n.slider .indicator-container.row {\n  -webkit-box-orient: horizontal;\n  box-orient: horizontal;\n  -webkit-flex-direction: row;\n  flex-direction: row;\n}\n.slider .indicator-container.column {\n  -webkit-box-orient: vertical;\n  box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n}\n", ""]);
	
	// exports


/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var extend = __webpack_require__(80).extend;
	// const config = require('../config')
	var Atomic = __webpack_require__(102);
	// const Component = require('./component')
	
	__webpack_require__(127);
	
	var DEFAULT_ITEM_COLOR = '#999';
	var DEFAULT_ITEM_SELECTED_COLOR = '#0000ff';
	var DEFAULT_ITEM_SIZE = 20;
	var DEFAULT_MARGIN_SIZE = 10;
	
	// Style supported:
	//   position: (default - absolute)
	//   itemColor: color of indicator dots
	//   itemSelectedColor: color of the selected indicator dot
	//   itemSize: size of indicators
	//   other layout styles
	function Indicator(data) {
	  this.direction = 'row'; // 'column' is not temporarily supported.
	  this.amount = data.extra.amount;
	  this.index = data.extra.index;
	  this.sliderWidth = data.extra.width;
	  this.sliderHeight = data.extra.height;
	  var styles = data.style || {};
	  this.data = data;
	  this.style.width.call(this, styles.width);
	  this.style.height.call(this, styles.height);
	  this.itemColor = styles.itemColor || DEFAULT_ITEM_COLOR;
	  this.itemSelectedColor = styles.itemSelectedColor || DEFAULT_ITEM_SELECTED_COLOR;
	  this.items = [];
	  Atomic.call(this, data);
	}
	
	Indicator.prototype = Object.create(Atomic.prototype);
	
	Indicator.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('weex-indicators');
	  node.classList.add('weex-element');
	  node.style.position = 'absolute';
	  this.node = node;
	  this.style.itemSize.call(this, 0);
	  this.updateStyle({
	    left: 0,
	    top: 0,
	    itemSize: 0
	  });
	  return node;
	};
	
	Indicator.prototype.createChildren = function () {
	  var root = document.createDocumentFragment();
	  for (var i = 0; i < this.amount; i++) {
	    var indicator = document.createElement('div');
	    indicator.classList.add('weex-indicator');
	    indicator.style.boxSizing = 'border-box';
	    indicator.style.margin = '0 ' + DEFAULT_MARGIN_SIZE * this.data.scale + 'px';
	    indicator.style.width = this.itemSize + 'px';
	    indicator.style.height = this.itemSize + 'px';
	    indicator.setAttribute('index', i);
	    if (this.index === i) {
	      indicator.classList.add('active');
	      indicator.style.backgroundColor = this.itemSelectedColor;
	    } else {
	      indicator.style.backgroundColor = this.itemColor;
	    }
	    indicator.addEventListener('click', this._clickHandler.bind(this, i));
	    this.items[i] = indicator;
	    root.appendChild(indicator);
	  }
	  this.node.appendChild(root);
	};
	
	Indicator.prototype.resetColor = function () {
	  var len = this.items.length;
	  if (typeof this.index !== 'undefined' && len > this.index) {
	    for (var i = 0; i < len; i++) {
	      var item = this.items[i];
	      if (this.index === i) {
	        item.classList.add('active');
	        item.style.backgroundColor = this.itemSelectedColor;
	      } else {
	        item.style.backgroundColor = this.itemColor;
	      }
	    }
	  }
	};
	
	Indicator.prototype.style = extend(Object.create(Atomic.prototype.style), {
	  itemColor: function itemColor(val) {
	    this.itemColor = val || DEFAULT_ITEM_COLOR;
	    this.resetColor();
	  },
	
	  itemSelectedColor: function itemSelectedColor(val) {
	    this.itemSelectedColor = val || DEFAULT_ITEM_SELECTED_COLOR;
	    this.resetColor();
	  },
	
	  itemSize: function itemSize(val) {
	    val = parseInt(val) * this.data.scale || DEFAULT_ITEM_SIZE * this.data.scale;
	    this.itemSize = val;
	    this.node.style.height = val + 'px';
	    for (var i = 0, l = this.items.length; i < l; i++) {
	      this.items[i].style.width = val + 'px';
	      this.items[i].style.height = val + 'px';
	    }
	  },
	
	  width: function width(val) {
	    val = parseInt(val) * this.data.scale || parseInt(this.sliderWidth);
	    this.virtualWrapperWidth = val;
	  },
	
	  height: function height(val) {
	    val = parseInt(val) * this.data.scale || parseInt(this.sliderHeight);
	    this.virtualWrapperHeight = val;
	  },
	
	  top: function top(val) {
	    val = this.virtualWrapperHeight / 2 - this.itemSize / 2 + val * this.data.scale;
	    this.node.style.bottom = '';
	    this.node.style.top = val + 'px';
	  },
	
	  bottom: function bottom(val) {
	    val = this.virtualWrapperHeight / 2 - this.itemSize / 2 + val * this.data.scale;
	    this.node.style.top = '';
	    this.node.style.bottom = val + 'px';
	  },
	
	  left: function left(val) {
	    val = this.virtualWrapperWidth / 2 - (this.itemSize + 2 * DEFAULT_MARGIN_SIZE * this.data.scale) * this.amount / 2 + val * this.data.scale;
	    this.node.style.right = '';
	    this.node.style.left = val + 'px';
	  },
	
	  right: function right(val) {
	    val = this.virtualWrapperWidth / 2 - (this.itemSize + 2 * DEFAULT_MARGIN_SIZE * this.data.scale) * this.amount / 2 + val * this.data.scale;
	    this.node.style.left = '';
	    this.node.style.right = val + 'px';
	  }
	});
	
	Indicator.prototype.setIndex = function (idx) {
	  if (idx >= this.amount) {
	    return;
	  }
	  var prev = this.items[this.index];
	  var cur = this.items[idx];
	  prev.classList.remove('active');
	  prev.style.backgroundColor = this.itemColor;
	  cur.classList.add('active');
	  cur.style.backgroundColor = this.itemSelectedColor;
	  this.index = idx;
	};
	
	Indicator.prototype._clickHandler = function (idx) {
	  this.slider.slideTo(idx);
	};
	
	module.exports = Indicator;

/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(128);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./indicator.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./indicator.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-indicators {\n  position: absolute;\n  white-space: nowrap;\n}\n.weex-indicators .weex-indicator {\n  float: left;\n  border-radius: 50%;\n}\n", ""]);
	
	// exports


/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(102);
	// const config = require('../config')
	var utils = __webpack_require__(80);
	
	// TODO: refactor this scss code since this is strongly
	// dependent on lib.flexible other than the value of
	// scale.
	__webpack_require__(130);
	
	function TabHeader(data) {
	  Atomic.call(this, data);
	}
	
	var proto = TabHeader.prototype = Object.create(Atomic.prototype);
	
	proto.create = function () {
	  // outside container.
	  var node = document.createElement('div');
	  node.className = 'tab-header';
	  // tip on the top.
	  var bar = document.createElement('div');
	  bar.className = 'header-bar';
	  bar.textContent = 'CHANGE FLOOR';
	  // middle layer.
	  var body = document.createElement('div');
	  body.className = 'header-body';
	  var box = document.createElement('ul');
	  box.className = 'tabheader';
	
	  body.appendChild(box);
	  node.appendChild(bar);
	  node.appendChild(body);
	  this._bar = bar;
	  this._body = body;
	  this.box = box;
	  this.node = node;
	  // init events.
	  this._initFoldBtn();
	  this._initEvent();
	  return node;
	};
	
	proto._initFoldBtn = function () {
	  var _this = this;
	  var node = this.node;
	  var btn = document.createElement('span');
	  btn.className = 'fold-toggle iconfont';
	  btn.innerHTML = '&#xe661;';
	  node.appendChild(btn);
	
	  btn.addEventListener('click', function () {
	    if (_this.unfolding) {
	      _this._folding();
	    } else {
	      _this._unfolding();
	    }
	  });
	};
	
	proto._initMask = function () {
	  var mask = document.createElement('div');
	  mask.className = 'tabheader-mask';
	  this.mask = mask;
	  // stop default behavior: page moving.
	  mask.addEventListener('touchmove', function (evt) {
	    evt.preventDefault();
	  });
	  // click to unfold.
	  var _this = this;
	  mask.addEventListener('click', function () {
	    _this._folding();
	  });
	
	  document.body.appendChild(mask);
	};
	
	proto._unfolding = function () {
	  // mark the initial posiiton of tabheader
	  if (!this.flag) {
	    var flag = document.createComment('tabheader');
	    this.flag = flag;
	    this.node.parentNode.insertBefore(flag, this.node);
	  }
	  if (!this.mask) {
	    this._initMask();
	  }
	
	  // record the scroll position.
	  this._scrollVal = this._body.scrollLeft;
	  // record the position in document.
	  this._topVal = this.node.getBoundingClientRect().top;
	  this._styleTop = this.node.style.top;
	
	  document.body.appendChild(this.node);
	  this.node.classList.add('unfold-header');
	  this.node.style.height = 'auto';
	  // recalc the position when it is unfolded.
	  var thHeight = this.node.getBoundingClientRect().height;
	  if (thHeight + this._topVal > window.innerHeight) {
	    this._topVal = this._topVal + (window.innerHeight - thHeight - this._topVal);
	  }
	
	  this.node.style.top = this._topVal + 'px';
	  // process mask style
	  this.mask.classList.add('unfold-header');
	  this.mask.style.height = window.innerHeight + 'px';
	  this.unfolding = true;
	};
	
	proto._folding = function () {
	  if (this.unfolding !== true) {
	    return;
	  }
	
	  this.mask.classList.remove('unfold-header');
	  this.node.classList.remove('unfold-header');
	
	  this.node.style.height = '';
	  this.node.style.top = this._styleTop;
	
	  // recover the position of tabheader.
	  this.flag.parentNode.insertBefore(this.node, this.flag);
	  // recover the position of scoller.
	  this._body.scrollLeft = this._scrollVal;
	
	  this._scrollToView();
	  this.unfolding = false;
	};
	
	proto._initEvent = function () {
	  this._initClickEvent();
	  this._initSelectEvent();
	};
	
	// init events.
	proto._initClickEvent = function () {
	  var box = this.box;
	  var _this = this;
	
	  box.addEventListener('click', function (evt) {
	    var target = evt.target;
	    if (target.nodeName === 'UL') {
	      return;
	    }
	
	    if (target.parentNode.nodeName === 'LI') {
	      target = target.parentNode;
	    }
	
	    var floor = target.getAttribute('data-floor');
	    /* eslint-disable eqeqeq */
	    if (_this.data.attr.selectedIndex == floor) {
	      // Duplicated clicking, not to trigger select event.
	      return;
	    }
	    /* eslint-enable eqeqeq */
	
	    fireEvent(target, 'select', { index: floor });
	  });
	};
	
	proto._initSelectEvent = function () {
	  var node = this.node;
	  var _this = this;
	  node.addEventListener('select', function (evt) {
	    var index = void 0;
	    if (evt.index !== undefined) {
	      index = evt.index;
	    } else if (evt.data && evt.data.index !== undefined) {
	      index = evt.data.index;
	    }
	
	    if (index === undefined) {
	      return;
	    }
	
	    _this.attr.selectedIndex.call(_this, index);
	  });
	};
	
	proto.attr = {
	  highlightIcon: function highlightIcon() {
	    return createHighlightIcon();
	  },
	  data: function data() {
	    var attr = this.data.attr;
	    // Ensure there is a default selected value.
	    if (attr.selectedIndex === undefined) {
	      attr.selectedIndex = 0;
	    }
	
	    var list = attr.data || [];
	    var curItem = attr.selectedIndex;
	
	    var ret = [];
	    var itemTmpl = '<li class="th-item" data-floor="{{floor}}">' + '{{hlIcon}}{{floorName}}</li>';
	
	    list.forEach(function (item, idx) {
	      var html = itemTmpl.replace('{{floor}}', idx);
	      /* eslint-disable eqeqeq */
	      if (curItem == idx) {
	        html = html.replace('{{hlIcon}}', createHighlightIcon());
	      } else {
	        html = html.replace('{{hlIcon}}', '');
	      }
	      /* eslint-enable eqeqeq */
	
	      html = html.replace('{{floorName}}', item);
	
	      ret.push(html);
	    }, this);
	
	    this.box.innerHTML = ret.join('');
	  },
	  selectedIndex: function selectedIndex(val) {
	    var attr = this.data.attr;
	
	    if (val === undefined) {
	      val = 0;
	    }
	
	    // if (val == attr.selectedIndex) {
	    //   return
	    // }
	
	    attr.selectedIndex = val;
	
	    this.attr.data.call(this);
	
	    this._folding();
	    this.style.textHighlightColor.call(this, this.textHighlightColor);
	  }
	};
	
	proto.style = Object.create(Atomic.prototype.style);
	
	proto.style.opacity = function (val) {
	  if (val === undefined || val < 0 || val > 1) {
	    val = 1;
	  }
	
	  this.node.style.opacity = val;
	};
	
	proto.style.textColor = function (val) {
	  if (!isValidColor(val)) {
	    return;
	  }
	
	  this.node.style.color = val;
	};
	
	proto.style.textHighlightColor = function (val) {
	  if (!isValidColor(val)) {
	    return;
	  }
	  this.textHighlightColor = val;
	  var attr = this.data.attr;
	
	  var node = this.node.querySelector('[data-floor="' + attr.selectedIndex + '"]');
	  if (node) {
	    node.style.color = val;
	    this._scrollToView(node);
	  }
	};
	
	proto._scrollToView = function (node) {
	  if (!node) {
	    var attr = this.data.attr;
	    node = this.node.querySelector('[data-floor="' + attr.selectedIndex + '"]');
	  }
	  if (!node) {
	    return;
	  }
	
	  // const defaultVal = this._body.scrollLeft
	  // const leftVal = defaultVal - node.offsetLeft + 300
	
	  var scrollVal = getScrollVal(this._body.getBoundingClientRect(), node);
	  doScroll(this._body, scrollVal);
	};
	
	// scroll the tabheader.
	// positive val means to scroll right.
	// negative val means to scroll left.
	function doScroll(node, val, finish) {
	  if (!val) {
	    return;
	  }
	  if (finish === undefined) {
	    finish = Math.abs(val);
	  }
	
	  if (finish <= 0) {
	    return;
	  }
	
	  setTimeout(function () {
	    if (val > 0) {
	      node.scrollLeft += 2;
	    } else {
	      node.scrollLeft -= 2;
	    }
	    finish -= 2;
	
	    doScroll(node, val, finish);
	  });
	}
	
	// get scroll distance.
	function getScrollVal(rect, node) {
	  var left = node.previousSibling;
	  var right = node.nextSibling;
	  var scrollVal = void 0;
	
	  // process left-side element first.
	  if (left) {
	    var leftRect = left.getBoundingClientRect();
	    // only need to compare the value of left.
	    if (leftRect.left < rect.left) {
	      scrollVal = leftRect.left;
	      return scrollVal;
	    }
	  }
	
	  if (right) {
	    var rightRect = right.getBoundingClientRect();
	    // compare the value of right.
	    if (rightRect.right > rect.right) {
	      scrollVal = rightRect.right - rect.right;
	      return scrollVal;
	    }
	  }
	
	  // process current node, from left to right.
	  var nodeRect = node.getBoundingClientRect();
	  if (nodeRect.left < rect.left) {
	    scrollVal = nodeRect.left;
	  } else if (nodeRect.right > rect.right) {
	    scrollVal = nodeRect.right - rect.right;
	  }
	
	  return scrollVal;
	}
	
	// trigger and broadcast events.
	function fireEvent(element, type, data) {
	  var evt = document.createEvent('Event');
	  evt.data = data;
	  utils.extend(evt, data);
	  // need bubble.
	  evt.initEvent(type, true, true);
	
	  element.dispatchEvent(evt);
	}
	
	function createHighlightIcon(code) {
	  var html = '<i class="hl-icon iconfont">' + '&#xe650' + '</i>';
	  return html;
	}
	
	function isValidColor(color) {
	  if (!color) {
	    return false;
	  }
	
	  if (color.charAt(0) !== '#') {
	    return false;
	  }
	
	  if (color.length !== 7) {
	    return false;
	  }
	
	  return true;
	}
	
	module.exports = TabHeader;

/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(131);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./tabheader.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./tabheader.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".tab-header {\n  position: relative;\n  width: 10rem;\n  font-size: 14px;\n  color: #333;\n}\n.tab-header .header-bar {\n  height: 1.17rem;\n  line-height: 1.17rem;\n  display: none;\n  color: #999;\n  padding-left: 0.4rem;\n}\n.tab-header .header-body {\n  margin-right: 1.07rem;\n  overflow-x: auto;\n  overflow-y: hidden;\n}\n.tab-header .header-body::-webkit-scrollbar {\n  width: 0;\n  height: 0;\n  overflow: hidden;\n}\n.tab-header .fold-toggle {\n  position: absolute;\n  top: 0.59rem;\n  -webkit-transform: translateY(-50%);\n  right: 0.29rem;\n  width: 0.48rem;\n  height: 0.48rem;\n  line-height: 0.48rem;\n  text-align: center;\n  z-index: 99;\n  font-size: 14px;\n}\n.tab-header.unfold-header {\n  position: fixed !important;\n  top: 0;\n  left: 0;\n  overflow: hidden;\n}\n\n.tabheader {\n  list-style: none;\n  white-space: nowrap;\n  height: 1.17rem;\n  line-height: 1.17rem;\n}\n.tabheader .th-item {\n  padding-left: 0.72rem;\n  position: relative;\n  display: inline-block;\n}\n.tabheader .hl-icon {\n  width: 0.4rem;\n  height: 0.4rem;\n  line-height: 0.4rem;\n  text-align: center;\n  position: absolute;\n  top: 50%;\n  -webkit-transform: translateY(-50%);\n  left: 0.24rem;\n  font-size: 14px;\n}\n\n.unfold-header .header-bar {\n  display: block;\n}\n.unfold-header .fold-toggle {\n  -webkit-transform: translateY(-50%) rotate(180deg);\n}\n.unfold-header .header-body {\n  margin-right: 0;\n  padding: 0.24rem;\n}\n.unfold-header .tabheader {\n  display: block;\n  height: auto;\n}\n.unfold-header .th-item {\n  box-sizing: border-box;\n  float: left;\n  width: 33.3333%;\n  height: 1.01rem;\n  line-height: 1.01rem;\n}\n.unfold-header .hl-icon {\n  margin-right: 0;\n  position: absolute;\n}\n.unfold-header.tabheader-mask {\n  display: block;\n  width: 100%;\n  height: 100%;\n  background-color: rgba(0, 0, 0, 0.6);\n}\n\n.tabheader-mask {\n  display: none;\n  position: fixed;\n  left: 0;\n  top: 0;\n}\n\n@font-face {\n  font-family: \"iconfont\";\n  src: url(\"data:application/x-font-ttf;charset=utf-8;base64,AAEAAAAPAIAAAwBwRkZUTXBD98UAAAD8AAAAHE9TLzJXL1zIAAABGAAAAGBjbWFws6IHbgAAAXgAAAFaY3Z0IAyV/swAAApQAAAAJGZwZ20w956VAAAKdAAACZZnYXNwAAAAEAAACkgAAAAIZ2x5ZuxoPFIAAALUAAAEWGhlYWQHA5h3AAAHLAAAADZoaGVhBzIDcgAAB2QAAAAkaG10eAs2AW0AAAeIAAAAGGxvY2EDcAQeAAAHoAAAABBtYXhwASkKKwAAB7AAAAAgbmFtZQl/3hgAAAfQAAACLnBvc3Tm7f0bAAAKAAAAAEhwcmVwpbm+ZgAAFAwAAACVAAAAAQAAAADMPaLPAAAAANIDKnoAAAAA0gMqewAEA/oB9AAFAAACmQLMAAAAjwKZAswAAAHrADMBCQAAAgAGAwAAAAAAAAAAAAEQAAAAAAAAAAAAAABQZkVkAMAAeObeAyz/LABcAxgAlAAAAAEAAAAAAxgAAAAAACAAAQAAAAMAAAADAAAAHAABAAAAAABUAAMAAQAAABwABAA4AAAACgAIAAIAAgB45lDmYebe//8AAAB45lDmYebe////ixm0GaQZKAABAAAAAAAAAAAAAAAAAQYAAAEAAAAAAAAAAQIAAAACAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACACIAAAEyAqoAAwAHAClAJgAAAAMCAANXAAIBAQJLAAICAU8EAQECAUMAAAcGBQQAAwADEQUPKzMRIREnMxEjIgEQ7szMAqr9ViICZgAAAAUALP/hA7wDGAAWADAAOgBSAF4Bd0uwE1BYQEoCAQANDg0ADmYAAw4BDgNeAAEICAFcEAEJCAoGCV4RAQwGBAYMXgALBAtpDwEIAAYMCAZYAAoHBQIECwoEWRIBDg4NUQANDQoOQhtLsBdQWEBLAgEADQ4NAA5mAAMOAQ4DXgABCAgBXBABCQgKCAkKZhEBDAYEBgxeAAsEC2kPAQgABgwIBlgACgcFAgQLCgRZEgEODg1RAA0NCg5CG0uwGFBYQEwCAQANDg0ADmYAAw4BDgNeAAEICAFcEAEJCAoICQpmEQEMBgQGDARmAAsEC2kPAQgABgwIBlgACgcFAgQLCgRZEgEODg1RAA0NCg5CG0BOAgEADQ4NAA5mAAMOAQ4DAWYAAQgOAQhkEAEJCAoICQpmEQEMBgQGDARmAAsEC2kPAQgABgwIBlgACgcFAgQLCgRZEgEODg1RAA0NCg5CWVlZQChTUzs7MjEXF1NeU15bWDtSO1JLQzc1MToyOhcwFzBRETEYESgVQBMWKwEGKwEiDgIdASE1NCY1NC4CKwEVIQUVFBYUDgIjBiYrASchBysBIiciLgI9ARciBhQWMzI2NCYXBgcOAx4BOwYyNicuAScmJwE1ND4COwEyFh0BARkbGlMSJRwSA5ABChgnHoX+SgKiARUfIw4OHw4gLf5JLB0iFBkZIBMIdwwSEgwNEhKMCAYFCwQCBA8OJUNRUEAkFxYJBQkFBQb+pAUPGhW8HykCHwEMGScaTCkQHAQNIBsSYYg0Fzo6JRcJAQGAgAETGyAOpz8RGhERGhF8GhYTJA4QDQgYGg0jERMUAXfkCxgTDB0m4wAAAgCg/2wDYALsABIAGgAhQB4AAAADAgADWQACAQECTQACAgFRAAECAUUTFjkQBBIrACAGFRQeAxcWOwEyPwESNTQAIiY0NjIWFAKS/tzORFVvMRAJDgEOCW3b/uKEXl6EXgLszpI1lXyJNhEKC30BDIyS/s5ehF5ehAAAAAEAggBJA4QB6AAdABtAGBIRAgEAAUAFAQA+AAABAGgAAQFfEx8CECsBJgcGBwkBLgEGBwYUFwEwMxcVFjI3AT4DLgIDehEWAwP+uP60BhEQBgoKAWEBAQoaCQFeAwQCAQECBAHhEg0DAv61AUkHBAUGCRsJ/qIBAQkJAWICBwYHCAYGAAEAfwCLA4ECJwAhAB1AGhYPAgEAAUAFAQA+AAABAGgCAQEBXyQuEwMRKyUBMCcjNSYHBgcBDgEUFhceAjMyNwkBFjMyNjc+Ai4BA3f+nwEBEhUEAv6iBQUFBQMHCAQOCQFIAUwKDQYMBQMFAQEFwwFeAQERDQID/p8FDAwMBAMEAgkBS/62CQUFAwoJCgkAAAEAAAABAAALIynoXw889QALBAAAAAAA0gMqewAAAADSAyp7ACL/bAO8AxgAAAAIAAIAAAAAAAAAAQAAAxj/bABcBAAAAAAAA7wAAQAAAAAAAAAAAAAAAAAAAAUBdgAiAAAAAAFVAAAD6QAsBAAAoACCAH8AAAAoACgAKAFkAaIB5AIsAAEAAAAHAF8ABQAAAAAAAgAmADQAbAAAAIoJlgAAAAAAAAAMAJYAAQAAAAAAAQAIAAAAAQAAAAAAAgAGAAgAAQAAAAAAAwAkAA4AAQAAAAAABAAIADIAAQAAAAAABQBGADoAAQAAAAAABgAIAIAAAwABBAkAAQAQAIgAAwABBAkAAgAMAJgAAwABBAkAAwBIAKQAAwABBAkABAAQAOwAAwABBAkABQCMAPwAAwABBAkABgAQAYhpY29uZm9udE1lZGl1bUZvbnRGb3JnZSAyLjAgOiBpY29uZm9udCA6IDI2LTgtMjAxNWljb25mb250VmVyc2lvbiAxLjAgOyB0dGZhdXRvaGludCAodjAuOTQpIC1sIDggLXIgNTAgLUcgMjAwIC14IDE0IC13ICJHIiAtZiAtc2ljb25mb250AGkAYwBvAG4AZgBvAG4AdABNAGUAZABpAHUAbQBGAG8AbgB0AEYAbwByAGcAZQAgADIALgAwACAAOgAgAGkAYwBvAG4AZgBvAG4AdAAgADoAIAAyADYALQA4AC0AMgAwADEANQBpAGMAbwBuAGYAbwBuAHQAVgBlAHIAcwBpAG8AbgAgADEALgAwACAAOwAgAHQAdABmAGEAdQB0AG8AaABpAG4AdAAgACgAdgAwAC4AOQA0ACkAIAAtAGwAIAA4ACAALQByACAANQAwACAALQBHACAAMgAwADAAIAAtAHgAIAAxADQAIAAtAHcAIAAiAEcAIgAgAC0AZgAgAC0AcwBpAGMAbwBuAGYAbwBuAHQAAAACAAAAAAAA/4MAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAABAAIAWwECAQMBBAd1bmlFNjUwB3VuaUU2NjEHdW5pRTZERQABAAH//wAPAAAAAAAAAAAAAAAAAAAAAAAyADIDGP/hAxj/bAMY/+EDGP9ssAAssCBgZi2wASwgZCCwwFCwBCZasARFW1ghIyEbilggsFBQWCGwQFkbILA4UFghsDhZWSCwCkVhZLAoUFghsApFILAwUFghsDBZGyCwwFBYIGYgiophILAKUFhgGyCwIFBYIbAKYBsgsDZQWCGwNmAbYFlZWRuwACtZWSOwAFBYZVlZLbACLCBFILAEJWFkILAFQ1BYsAUjQrAGI0IbISFZsAFgLbADLCMhIyEgZLEFYkIgsAYjQrIKAAIqISCwBkMgiiCKsAArsTAFJYpRWGBQG2FSWVgjWSEgsEBTWLAAKxshsEBZI7AAUFhlWS2wBCywCCNCsAcjQrAAI0KwAEOwB0NRWLAIQyuyAAEAQ2BCsBZlHFktsAUssABDIEUgsAJFY7ABRWJgRC2wBiywAEMgRSCwACsjsQQEJWAgRYojYSBkILAgUFghsAAbsDBQWLAgG7BAWVkjsABQWGVZsAMlI2FERC2wByyxBQVFsAFhRC2wCCywAWAgILAKQ0qwAFBYILAKI0JZsAtDSrAAUlggsAsjQlktsAksILgEAGIguAQAY4ojYbAMQ2AgimAgsAwjQiMtsAosS1RYsQcBRFkksA1lI3gtsAssS1FYS1NYsQcBRFkbIVkksBNlI3gtsAwssQANQ1VYsQ0NQ7ABYUKwCStZsABDsAIlQrIAAQBDYEKxCgIlQrELAiVCsAEWIyCwAyVQWLAAQ7AEJUKKiiCKI2GwCCohI7ABYSCKI2GwCCohG7AAQ7ACJUKwAiVhsAgqIVmwCkNHsAtDR2CwgGIgsAJFY7ABRWJgsQAAEyNEsAFDsAA+sgEBAUNgQi2wDSyxAAVFVFgAsA0jQiBgsAFhtQ4OAQAMAEJCimCxDAQrsGsrGyJZLbAOLLEADSstsA8ssQENKy2wECyxAg0rLbARLLEDDSstsBIssQQNKy2wEyyxBQ0rLbAULLEGDSstsBUssQcNKy2wFiyxCA0rLbAXLLEJDSstsBgssAcrsQAFRVRYALANI0IgYLABYbUODgEADABCQopgsQwEK7BrKxsiWS2wGSyxABgrLbAaLLEBGCstsBsssQIYKy2wHCyxAxgrLbAdLLEEGCstsB4ssQUYKy2wHyyxBhgrLbAgLLEHGCstsCEssQgYKy2wIiyxCRgrLbAjLCBgsA5gIEMjsAFgQ7ACJbACJVFYIyA8sAFgI7ASZRwbISFZLbAkLLAjK7AjKi2wJSwgIEcgILACRWOwAUViYCNhOCMgilVYIEcgILACRWOwAUViYCNhOBshWS2wJiyxAAVFVFgAsAEWsCUqsAEVMBsiWS2wJyywByuxAAVFVFgAsAEWsCUqsAEVMBsiWS2wKCwgNbABYC2wKSwAsANFY7ABRWKwACuwAkVjsAFFYrAAK7AAFrQAAAAAAEQ+IzixKAEVKi2wKiwgPCBHILACRWOwAUViYLAAQ2E4LbArLC4XPC2wLCwgPCBHILACRWOwAUViYLAAQ2GwAUNjOC2wLSyxAgAWJSAuIEewACNCsAIlSYqKRyNHI2EgWGIbIVmwASNCsiwBARUUKi2wLiywABawBCWwBCVHI0cjYbAGRStlii4jICA8ijgtsC8ssAAWsAQlsAQlIC5HI0cjYSCwBCNCsAZFKyCwYFBYILBAUVizAiADIBuzAiYDGllCQiMgsAlDIIojRyNHI2EjRmCwBEOwgGJgILAAKyCKimEgsAJDYGQjsANDYWRQWLACQ2EbsANDYFmwAyWwgGJhIyAgsAQmI0ZhOBsjsAlDRrACJbAJQ0cjRyNhYCCwBEOwgGJgIyCwACsjsARDYLAAK7AFJWGwBSWwgGKwBCZhILAEJWBkI7ADJWBkUFghGyMhWSMgILAEJiNGYThZLbAwLLAAFiAgILAFJiAuRyNHI2EjPDgtsDEssAAWILAJI0IgICBGI0ewACsjYTgtsDIssAAWsAMlsAIlRyNHI2GwAFRYLiA8IyEbsAIlsAIlRyNHI2EgsAUlsAQlRyNHI2GwBiWwBSVJsAIlYbABRWMjIFhiGyFZY7ABRWJgIy4jICA8ijgjIVktsDMssAAWILAJQyAuRyNHI2EgYLAgYGawgGIjICA8ijgtsDQsIyAuRrACJUZSWCA8WS6xJAEUKy2wNSwjIC5GsAIlRlBYIDxZLrEkARQrLbA2LCMgLkawAiVGUlggPFkjIC5GsAIlRlBYIDxZLrEkARQrLbA3LLAuKyMgLkawAiVGUlggPFkusSQBFCstsDgssC8riiAgPLAEI0KKOCMgLkawAiVGUlggPFkusSQBFCuwBEMusCQrLbA5LLAAFrAEJbAEJiAuRyNHI2GwBkUrIyA8IC4jOLEkARQrLbA6LLEJBCVCsAAWsAQlsAQlIC5HI0cjYSCwBCNCsAZFKyCwYFBYILBAUVizAiADIBuzAiYDGllCQiMgR7AEQ7CAYmAgsAArIIqKYSCwAkNgZCOwA0NhZFBYsAJDYRuwA0NgWbADJbCAYmGwAiVGYTgjIDwjOBshICBGI0ewACsjYTghWbEkARQrLbA7LLAuKy6xJAEUKy2wPCywLyshIyAgPLAEI0IjOLEkARQrsARDLrAkKy2wPSywABUgR7AAI0KyAAEBFRQTLrAqKi2wPiywABUgR7AAI0KyAAEBFRQTLrAqKi2wPyyxAAEUE7ArKi2wQCywLSotsEEssAAWRSMgLiBGiiNhOLEkARQrLbBCLLAJI0KwQSstsEMssgAAOistsEQssgABOistsEUssgEAOistsEYssgEBOistsEcssgAAOystsEgssgABOystsEkssgEAOystsEossgEBOystsEsssgAANystsEwssgABNystsE0ssgEANystsE4ssgEBNystsE8ssgAAOSstsFAssgABOSstsFEssgEAOSstsFIssgEBOSstsFMssgAAPCstsFQssgABPCstsFUssgEAPCstsFYssgEBPCstsFcssgAAOCstsFgssgABOCstsFkssgEAOCstsFossgEBOCstsFsssDArLrEkARQrLbBcLLAwK7A0Ky2wXSywMCuwNSstsF4ssAAWsDArsDYrLbBfLLAxKy6xJAEUKy2wYCywMSuwNCstsGEssDErsDUrLbBiLLAxK7A2Ky2wYyywMisusSQBFCstsGQssDIrsDQrLbBlLLAyK7A1Ky2wZiywMiuwNistsGcssDMrLrEkARQrLbBoLLAzK7A0Ky2waSywMyuwNSstsGossDMrsDYrLbBrLCuwCGWwAyRQeLABFTAtAABLuADIUlixAQGOWbkIAAgAYyCwASNEILADI3CwDkUgIEu4AA5RS7AGU1pYsDQbsChZYGYgilVYsAIlYbABRWMjYrACI0SzCgkFBCuzCgsFBCuzDg8FBCtZsgQoCUVSRLMKDQYEK7EGAUSxJAGIUViwQIhYsQYDRLEmAYhRWLgEAIhYsQYBRFlZWVm4Af+FsASNsQUARAAAAA==\") format(\"truetype\");\n}\n.iconfont {\n  font-family: iconfont !important;\n  font-size: 16px;\n  font-style: normal;\n  -webkit-font-smoothing: antialiased;\n  -webkit-text-stroke-width: 0.2px;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n[data-dpr=\"2\"] .tab-header {\n  font-size: 28px;\n}\n\n[data-dpr=\"3\"] .tab-header {\n  font-size: 42px;\n}\n\n[data-dpr=\"2\"] .tabheader .hl-icon {\n  font-size: 28px;\n}\n\n[data-dpr=\"3\"] .tabheader .hl-icon {\n  font-size: 42px;\n}\n\n[data-dpr=\"2\"] .tab-header .fold-toggle {\n  font-size: 28px;\n}\n\n[data-dpr=\"3\"] .tab-header .fold-toggle {\n  font-size: 42px;\n}\n", ""]);
	
	// exports


/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	/* global lib */
	
	'use strict';
	
	__webpack_require__(133);
	__webpack_require__(110);
	
	// lib.scroll events:
	//  - scrollstart
	//  - scrolling
	//  - pulldownend
	//  - pullupend
	//  - pullleftend
	//  - pullrightend
	//  - pulldown
	//  - pullup
	//  - pullleft
	//  - pullright
	//  - contentrefresh
	
	var Component = __webpack_require__(89);
	// const utils = require('../utils')
	
	var directionMap = {
	  h: ['row', 'horizontal', 'h', 'x'],
	  v: ['column', 'vertical', 'v', 'y']
	};
	
	var DEFAULT_DIRECTION = 'column';
	
	// attrs:
	//  - scroll-direciton: none|vertical|horizontal (default is vertical)
	//  - show-scrollbar: true|false (default is true)
	function Scroller(data, nodeType) {
	  var attrs = data.attr || {};
	  var direction = attrs.scrollDirection || attrs.direction || DEFAULT_DIRECTION;
	  this.direction = directionMap.h.indexOf(direction) === -1 ? 'v' : 'h';
	  this.showScrollbar = attrs.showScrollbar || true;
	  Component.call(this, data, nodeType);
	}
	
	Scroller.prototype = Object.create(Component.prototype);
	
	Scroller.prototype.create = function (nodeType) {
	  var Scroll = lib.scroll;
	  var node = Component.prototype.create.call(this, nodeType);
	  node.classList.add('weex-container', 'scroll-wrap');
	  this.scrollElement = document.createElement('div');
	  this.scrollElement.classList.add('weex-container', 'scroll-element', this.direction + '-scroller');
	
	  this.scrollElement.style.webkitBoxOrient = directionMap[this.direction][1];
	  this.scrollElement.style.webkitFlexDirection = directionMap[this.direction][0];
	  this.scrollElement.style.flexDirection = directionMap[this.direction][0];
	
	  node.appendChild(this.scrollElement);
	  this.scroller = new Scroll({
	    // if the direction is x, then the bounding rect of the scroll element
	    // should be got by the 'Range' API other than the 'getBoundingClientRect'
	    // API, because the width outside the viewport won't be count in by
	    // 'getBoundingClientRect'.
	    // Otherwise should use the element rect in case there is a child scroller
	    // or list in this scroller. If using 'Range', the whole scroll element
	    // including the hiding part will be count in the rect.
	    useElementRect: this.direction === 'v',
	    scrollElement: this.scrollElement,
	    direction: this.direction === 'h' ? 'x' : 'y'
	  });
	  this.scroller.init();
	  this.offset = 0;
	  return node;
	};
	
	Scroller.prototype.bindEvents = function (evts) {
	  Component.prototype.bindEvents.call(this, evts);
	  // to enable lazyload for Images
	  this.scroller.addEventListener('scrolling', function (e) {
	    var so = e.scrollObj;
	    var scrollTop = so.getScrollTop();
	    var scrollLeft = so.getScrollLeft();
	    var offset = this.direction === 'v' ? scrollTop : scrollLeft;
	    var diff = offset - this.offset;
	    var dir = void 0;
	    if (diff >= 0) {
	      dir = this.direction === 'v' ? 'up' : 'left';
	    } else {
	      dir = this.direction === 'v' ? 'down' : 'right';
	    }
	    this.dispatchEvent('scroll', {
	      originalType: 'scrolling',
	      scrollTop: so.getScrollTop(),
	      scrollLeft: so.getScrollLeft(),
	      offset: offset,
	      direction: dir
	    }, {
	      bubbles: true
	    });
	    this.offset = offset;
	  }.bind(this));
	
	  var pullendEvent = 'pull' + { v: 'up', h: 'left' }[this.direction] + 'end';
	  this.scroller.addEventListener(pullendEvent, function (e) {
	    this.dispatchEvent('loadmore');
	  }.bind(this));
	};
	
	Scroller.prototype.createChildren = function () {
	  var children = this.data.children;
	  var parentRef = this.data.ref;
	  var componentManager = this.getComponentManager();
	  if (children && children.length) {
	    var fragment = document.createDocumentFragment();
	    var isFlex = false;
	    for (var i = 0; i < children.length; i++) {
	      children[i].instanceId = this.data.instanceId;
	      children[i].scale = this.data.scale;
	      var child = componentManager.createElement(children[i]);
	      fragment.appendChild(child.node);
	      child.parentRef = parentRef;
	      if (!isFlex && child.data.style && child.data.style.hasOwnProperty('flex')) {
	        isFlex = true;
	      }
	    }
	    this.scrollElement.appendChild(fragment);
	  }
	  // wait for fragment to appended on scrollElement on UI thread.
	  setTimeout(function () {
	    this.scroller.refresh();
	  }.bind(this), 0);
	};
	
	Scroller.prototype.appendChild = function (data) {
	  var children = this.data.children;
	  var componentManager = this.getComponentManager();
	  var child = componentManager.createElement(data);
	  this.scrollElement.appendChild(child.node);
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh();
	  }.bind(this), 0);
	
	  // update this.data.children
	  if (!children || !children.length) {
	    this.data.children = [data];
	  } else {
	    children.push(data);
	  }
	
	  return child;
	};
	
	Scroller.prototype.insertBefore = function (child, before) {
	  var children = this.data.children;
	  var i = 0;
	  var isAppend = false;
	
	  // update this.data.children
	  if (!children || !children.length || !before) {
	    isAppend = true;
	  } else {
	    var l = void 0;
	    for (l = children.length; i < l; i++) {
	      if (children[i].ref === before.data.ref) {
	        break;
	      }
	    }
	    if (i === l) {
	      isAppend = true;
	    }
	  }
	
	  if (isAppend) {
	    this.scrollElement.appendChild(child.node);
	    children.push(child.data);
	  } else {
	    var refreshLoadingPlaceholder = before.refreshPlaceholder || before.loadingPlaceholder;
	    if (refreshLoadingPlaceholder) {
	      this.scrollElement.insertBefore(child.node, refreshLoadingPlaceholder);
	    } else if (before.fixedPlaceholder) {
	      this.scrollElement.insertBefore(child.node, before.fixedPlaceholder);
	    } else {
	      this.scrollElement.insertBefore(child.node, before.node);
	    }
	    children.splice(i, 0, child.data);
	  }
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh();
	  }.bind(this), 0);
	};
	
	Scroller.prototype.removeChild = function (child) {
	  var children = this.data.children;
	  // remove from this.data.children
	  var i = 0;
	  var componentManager = this.getComponentManager();
	  if (children && children.length) {
	    var l = void 0;
	    for (l = children.length; i < l; i++) {
	      if (children[i].ref === child.data.ref) {
	        break;
	      }
	    }
	    if (i < l) {
	      children.splice(i, 1);
	    }
	  }
	  // remove from componentMap recursively
	  componentManager.removeElementByRef(child.data.ref);
	  var refreshLoadingPlaceholder = child.refreshPlaceholder || child.loadingPlaceholder;
	  if (refreshLoadingPlaceholder) {
	    this.scrollElement.removeChild(refreshLoadingPlaceholder);
	  }
	  if (child.fixedPlaceholder) {
	    this.scrollElement.removeChild(child.fixedPlaceholder);
	  }
	  child.node.parentNode.removeChild(child.node);
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh();
	  }.bind(this), 0);
	};
	
	Scroller.prototype.onAppend = function () {
	  this._refreshWhenDomRenderend();
	};
	
	Scroller.prototype.onRemove = function () {
	  this._removeEvents();
	};
	
	Scroller.prototype._refreshWhenDomRenderend = function () {
	  var self = this;
	  if (!this.renderendHandler) {
	    this.renderendHandler = function () {
	      self.scroller.refresh();
	    };
	  }
	  window.addEventListener('renderend', this.renderendHandler);
	};
	
	Scroller.prototype._removeEvents = function () {
	  if (this.renderendHandler) {
	    window.removeEventListener('renderend', this.renderendHandler);
	  }
	};
	
	module.exports = Scroller;

/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(134);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./scroller.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./scroller.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".scroll-wrap {\n  display: block;\n  overflow: hidden;\n}\n\n.scroll-element.horizontal {\n  -webkit-box-orient: horizontal;\n  -webkit-flex-direction: row;\n  flex-direction: row;\n}\n.scroll-element.vertical {\n  -webkit-box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n}\n", ""]);
	
	// exports


/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(102);
	var utils = __webpack_require__(80);
	
	// attrs:
	//   - type: text|password|tel|email|url
	//   - value
	//   - placeholder
	//   - disabled
	//   - autofocus
	function Input(data) {
	  var attrs = data.attr || {};
	  this.type = attrs.type || 'text';
	  this.value = attrs.value;
	  this.placeholder = attrs.placeholder;
	  this.autofocus = attrs.autofocus && attrs.autofocus !== 'false';
	  Atomic.call(this, data);
	}
	
	Input.prototype = Object.create(Atomic.prototype);
	
	Input.prototype.create = function () {
	  var node = document.createElement('input');
	  var uuid = Math.floor(10000000000000 * Math.random()) + Date.now();
	  this.className = 'weex-ipt-' + uuid;
	  this.styleId = 'weex-style-' + uuid;
	  node.classList.add(this.className);
	  node.setAttribute('type', this.type);
	  node.type = this.type;
	  // For the consistency of input component's width.
	  // The date and time type of input will have a bigger width
	  // when the 'box-sizing' is not set to 'border-box'
	  node.classList.add('weex-element');
	  this.value && (node.value = this.value);
	  this.placeholder && (node.placeholder = this.placeholder);
	  return node;
	};
	
	Input.prototype.updateStyle = function (style) {
	  Atomic.prototype.updateStyle.call(this, style);
	  if (style && style.placeholderColor) {
	    this.placeholderColor = style.placeholderColor;
	    this.setPlaceholderColor();
	  }
	};
	
	Input.prototype.attr = {
	  disabled: function disabled(val) {
	    this.node.disabled = val && val !== 'false';
	  }
	};
	
	Input.prototype.event = {
	  input: {
	    updator: function updator() {
	      return {
	        attrs: {
	          value: this.node.value
	        }
	      };
	    },
	    extra: function extra() {
	      return {
	        value: this.node.value,
	        timestamp: Date.now()
	      };
	    }
	  },
	
	  change: {
	    updator: function updator() {
	      return {
	        attrs: {
	          value: this.node.value
	        }
	      };
	    },
	    extra: function extra() {
	      return {
	        value: this.node.value,
	        timestamp: Date.now()
	      };
	    }
	  }
	};
	
	Input.prototype.setPlaceholderColor = function () {
	  if (!this.placeholderColor) {
	    return;
	  }
	  var vendors = ['::-webkit-input-placeholder', ':-moz-placeholder', '::-moz-placeholder', ':-ms-input-placeholder', ':placeholder-shown'];
	  var css = '';
	  var cssRule = 'color: ' + this.placeholderColor + ';';
	  for (var i = 0, l = vendors.length; i < l; i++) {
	    css += '.' + this.className + vendors[i] + '{' + cssRule + '}';
	  }
	  utils.appendStyle(css, this.styleId, true);
	};
	
	module.exports = Input;

/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(89);
	var sender = __webpack_require__(93);
	var utils = __webpack_require__(80);
	
	// attrs:
	//   - options: the options to be listed, as a array of strings.
	//   - selectedIndex: the selected options' index number.
	//   - disabled
	function Select(data) {
	  this.options = [];
	  this.selectedIndex = 0;
	  Atomic.call(this, data);
	}
	
	Select.prototype = Object.create(Atomic.prototype);
	
	Select.prototype.create = function () {
	  var node = document.createElement('select');
	  var uuid = Math.floor(10000000000000 * Math.random()) + Date.now();
	  this.className = 'weex-slct-' + uuid;
	  this.styleId = 'weex-style-' + uuid;
	  node.classList.add(this.className);
	  // For the consistency of input component's width.
	  // The date and time type of input will have a bigger width
	  // when the 'box-sizing' is not set to 'border-box'
	  node.style['box-sizing'] = 'border-box';
	  return node;
	};
	
	Select.prototype.attr = {
	  disabled: function disabled(val) {
	    this.node.disabled = val && val !== 'false';
	  },
	  options: function options(val) {
	    if (!utils.isArray(val)) {
	      return;
	    }
	    this.options = val;
	    this.node.innerHTML = '';
	    this.createOptions(val);
	  },
	  selectedIndex: function selectedIndex(val) {
	    val = parseInt(val);
	    if (typeof val !== 'number' || isNaN(val) || val >= this.options.length) {
	      return;
	    }
	    this.node.value = this.options[val];
	  }
	};
	
	Select.prototype.bindEvents = function (evts) {
	  var isListenToChange = false;
	  Atomic.prototype.bindEvents.call(this, evts.filter(function (val) {
	    var pass = val !== 'change';
	    !pass && (isListenToChange = true);
	    return pass;
	  }));
	  if (isListenToChange) {
	    this.node.addEventListener('change', function (e) {
	      e.index = this.options.indexOf(this.node.value);
	      sender.fireEvent(this.data.ref, 'change', e);
	    }.bind(this));
	  }
	};
	
	Select.prototype.createOptions = function (opts) {
	  var optDoc = document.createDocumentFragment();
	  for (var i = 0, l = opts.length; i < l; i++) {
	    var opt = document.createElement('option');
	    opt.appendChild(document.createTextNode(opts[i]));
	    optDoc.appendChild(opt);
	  }
	  this.node.appendChild(optDoc);
	};
	
	module.exports = Select;

/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(102);
	
	// attrs:
	//   - value
	//   - disabled
	function Datepicker(data) {
	  Atomic.call(this, data);
	}
	
	Datepicker.prototype = Object.create(Atomic.prototype);
	
	Datepicker.prototype.create = function () {
	  var node = document.createElement('input');
	  var uuid = Math.floor(10000000000000 * Math.random()) + Date.now();
	  this.className = 'weex-ipt-' + uuid;
	  this.styleId = 'weex-style-' + uuid;
	  node.classList.add(this.className);
	  node.setAttribute('type', 'date');
	  node.type = 'date';
	  // For the consistency of input component's width.
	  // The date and time type of input will have a bigger width
	  // when the 'box-sizing' is not set to 'border-box'
	  node.classList.add('weex-element');
	  return node;
	};
	
	Datepicker.prototype.attr = {
	  disabled: function disabled(val) {
	    this.node.disabled = val && val !== 'false';
	  }
	};
	
	module.exports = Datepicker;

/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(102);
	
	// attrs:
	//   - value
	//   - disabled
	function Timepicker(data) {
	  Atomic.call(this, data);
	}
	
	Timepicker.prototype = Object.create(Atomic.prototype);
	
	Timepicker.prototype.create = function () {
	  var node = document.createElement('input');
	  var uuid = Math.floor(10000000000000 * Math.random()) + Date.now();
	  this.className = 'weex-ipt-' + uuid;
	  this.styleId = 'weex-style-' + uuid;
	  node.classList.add(this.className);
	  node.setAttribute('type', 'time');
	  node.type = 'time';
	  // For the consistency of input component's width.
	  // The date and time type of input will have a bigger width
	  // when the 'box-sizing' is not set to 'border-box'
	  node.classList.add('weex-element');
	  return node;
	};
	
	Timepicker.prototype.attr = {
	  disabled: function disabled(val) {
	    this.node.disabled = val && val !== 'false';
	  }
	};
	
	module.exports = Timepicker;

/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(102);
	// const utils = require('../utils')
	__webpack_require__(140);
	
	// attrs:
	//   - autoPlay: true | false (default: false)
	//   - playStatus: play | pause | stop
	//   - src: {string}
	//   - poster: {string}
	//   - loop: true | false (default: false)
	//   - muted: true | false (default: false)
	// events:
	//   - start
	//   - pause
	//   - finish
	//   - fail
	function Video(data) {
	  var autoPlay = data.attr.autoPlay;
	  var playStatus = data.attr.playStatus;
	  this.autoPlay = autoPlay === true || autoPlay === 'true';
	  if (playStatus !== 'play' && playStatus !== 'stop' && playStatus !== 'pause') {
	    this.playStatus = 'pause';
	  } else {
	    this.playStatus = playStatus;
	  }
	  Atomic.call(this, data);
	}
	
	Video.prototype = Object.create(Atomic.prototype);
	
	Video.prototype.attr = {
	  playStatus: function playStatus(val) {
	    if (val !== 'play' && val !== 'stop' && val !== 'pause') {
	      val = 'pause';
	    }
	    if (this.playStatus === val) {
	      return;
	    }
	    this.playStatus = val;
	    this.node.setAttribute('play-status', val);
	    this[this.playStatus]();
	  },
	  autoPlay: function autoPlay(val) {
	    // DO NOTHING
	  }
	};
	
	Video.prototype.create = function () {
	  var node = document.createElement('video');
	  node.classList.add('weex-video', 'weex-element');
	  node.controls = true;
	  node.autoplay = this.autoPlay;
	  node.setAttribute('play-status', this.playStatus);
	  this.node = node;
	  if (this.autoPlay && this.playStatus === 'play') {
	    this.play();
	  }
	  return node;
	};
	
	Video.prototype.bindEvents = function (evts) {
	  Atomic.prototype.bindEvents.call(this, evts);
	
	  // convert w3c-video events to weex-video events.
	  var evtsMap = {
	    start: 'play',
	    finish: 'ended',
	    fail: 'error'
	  };
	  for (var evtName in evtsMap) {
	    this.node.addEventListener(evtsMap[evtName], function (type, e) {
	      this.dispatchEvent(type, e.data);
	    }.bind(this, evtName));
	  }
	};
	
	Video.prototype.play = function () {
	  var src = this.node.getAttribute('src');
	  if (!src) {
	    src = this.node.getAttribute('data-src');
	    src && this.node.setAttribute('src', src);
	  }
	  this.node.play();
	};
	
	Video.prototype.pause = function () {
	  this.node.pause();
	};
	
	Video.prototype.stop = function () {
	  this.node.pause();
	  this.node.autoplay = false;
	  this.node.setAttribute('data-src', this.node.src);
	  this.node.src = '';
	};
	
	module.exports = Video;

/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(141);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./video.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./video.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-video {\n\tbackground-color: #000;\n}", ""]);
	
	// exports


/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(102);
	var utils = __webpack_require__(80);
	__webpack_require__(143);
	
	var defaults = {
	  color: '#64bd63',
	  secondaryColor: '#dfdfdf',
	  jackColor: '#fff',
	  jackSecondaryColor: null,
	  className: 'weex-switch',
	  disabledOpacity: 0.5,
	  speed: '0.4s',
	  width: 100,
	  height: 60,
	  // is width and height scalable ?
	  scalable: false
	};
	
	// attrs:
	//   - checked: if is checked.
	//   - disabled: if true, this component is not available for interaction.
	function Switch(data) {
	  this.options = utils.extend({}, defaults);
	  this.checked = data.attr.checked && data.attr.checked !== 'false';
	  this.data = data;
	  this.width = this.options.width * data.scale;
	  this.height = this.options.height * data.scale;
	  Atomic.call(this, data);
	}
	
	Switch.prototype = Object.create(Atomic.prototype);
	
	Switch.prototype.create = function () {
	  var node = document.createElement('span');
	  this.jack = document.createElement('small');
	  node.appendChild(this.jack);
	  node.className = this.options.className;
	  this.node = node;
	  this.attr.disabled.call(this, this.data.attr.disabled);
	  return node;
	};
	
	Switch.prototype.onAppend = function () {
	  this.setSize();
	  this.setPosition();
	};
	
	Switch.prototype.attr = {
	  disabled: function disabled(val) {
	    this.disabled = val && val !== 'false';
	    this.disabled ? this.disable() : this.enable();
	  }
	};
	
	Switch.prototype.setSize = function () {
	  var min = Math.min(this.width, this.height);
	  var max = Math.max(this.width, this.height);
	  this.node.style.width = max + 'px';
	  this.node.style.height = min + 'px';
	  this.node.style.borderRadius = min / 2 + 'px';
	  this.jack.style.width = this.jack.style.height = min + 'px';
	};
	
	Switch.prototype.setPosition = function (clicked) {
	  var checked = this.checked;
	  var node = this.node;
	  var jack = this.jack;
	
	  if (clicked && checked) {
	    checked = false;
	  } else if (clicked && !checked) {
	    checked = true;
	  }
	
	  if (checked === true) {
	    this.checked = true;
	
	    if (window.getComputedStyle) {
	      jack.style.left = parseInt(window.getComputedStyle(node).width) - parseInt(window.getComputedStyle(jack).width) + 'px';
	    } else {
	      jack.style.left = parseInt(node.currentStyle['width']) - parseInt(jack.currentStyle['width']) + 'px';
	    }
	
	    this.options.color && this.colorize();
	    this.setSpeed();
	  } else {
	    this.checked = false;
	    jack.style.left = 0;
	    node.style.boxShadow = 'inset 0 0 0 0 ' + this.options.secondaryColor;
	    node.style.borderColor = this.options.secondaryColor;
	    node.style.backgroundColor = this.options.secondaryColor !== defaults.secondaryColor ? this.options.secondaryColor : '#fff';
	    jack.style.backgroundColor = this.options.jackSecondaryColor !== this.options.jackColor ? this.options.jackSecondaryColor : this.options.jackColor;
	    this.setSpeed();
	  }
	};
	
	Switch.prototype.colorize = function () {
	  var nodeHeight = this.node.offsetHeight / 2;
	
	  this.node.style.backgroundColor = this.options.color;
	  this.node.style.borderColor = this.options.color;
	  this.node.style.boxShadow = 'inset 0 0 0 ' + nodeHeight + 'px ' + this.options.color;
	  this.jack.style.backgroundColor = this.options.jackColor;
	};
	
	Switch.prototype.setSpeed = function () {
	  var switcherProp = {};
	  var jackProp = {
	    'background-color': this.options.speed,
	    left: this.options.speed.replace(/[a-z]/, '') / 2 + 's'
	  };
	
	  if (this.checked) {
	    switcherProp = {
	      border: this.options.speed,
	      'box-shadow': this.options.speed,
	      'background-color': this.options.speed.replace(/[a-z]/, '') * 3 + 's'
	    };
	  } else {
	    switcherProp = {
	      border: this.options.speed,
	      'box-shadow': this.options.speed
	    };
	  }
	
	  utils.transitionize(this.node, switcherProp);
	  utils.transitionize(this.jack, jackProp);
	};
	
	Switch.prototype.disable = function () {
	  !this.disabled && (this.disabled = true);
	  this.node.style.opacity = defaults.disabledOpacity;
	  this.node.removeEventListener('click', this.getClickHandler());
	};
	
	Switch.prototype.enable = function () {
	  this.disabled && (this.disabled = false);
	  this.node.style.opacity = 1;
	  this.node.addEventListener('click', this.getClickHandler());
	};
	
	Switch.prototype.getClickHandler = function () {
	  if (!this._clickHandler) {
	    this._clickHandler = function () {
	      this.setPosition(true);
	      this.dispatchEvent('change', {
	        value: this.checked
	      });
	    }.bind(this);
	  }
	  return this._clickHandler;
	};
	
	Switch.prototype.style = utils.extend(Object.create(Atomic.prototype.style), {
	  width: function width(val) {
	    if (!this.options.scalable) {
	      return;
	    }
	    val = parseFloat(val);
	    if (isNaN(val) || val < 0) {
	      val = this.options.width;
	    }
	    this.width = val * this.data.scale;
	    this.setSize();
	  },
	
	  height: function height(val) {
	    if (!this.options.scalable) {
	      return;
	    }
	    val = parseFloat(val);
	    if (isNaN(val) || val < 0) {
	      val = this.options.height;
	    }
	    this.height = val * this.data.scale;
	    this.setSize();
	  }
	});
	
	Switch.prototype.event = {
	  change: {
	    updator: function updator() {
	      return {
	        attrs: {
	          checked: this.checked
	        }
	      };
	    },
	    extra: function extra() {
	      return {
	        value: this.checked
	      };
	    }
	  }
	};
	
	module.exports = Switch;

/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(144);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./switch.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./switch.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, "/* switch defaults. */\n.weex-switch {\n  background-color: #fff;\n  border: 1px solid #dfdfdf;\n  cursor: pointer;\n  display: inline-block;\n  position: relative;\n  vertical-align: middle;\n  -moz-user-select: none;\n  -khtml-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  box-sizing: content-box;\n  background-clip: content-box;\n}\n\n.weex-switch > small {\n  background: #fff;\n  border-radius: 100%;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);\n  position: absolute;\n  top: 0;\n}\n", ""]);
	
	// exports


/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var logger = __webpack_require__(97);
	var Component = __webpack_require__(89);
	
	// attrs:
	//   - href
	function A(data) {
	  Component.call(this, data);
	}
	
	A.prototype = Object.create(Component.prototype);
	
	A.prototype.create = function () {
	  var node = document.createElement('a');
	  node.classList.add('weex-container');
	  node.style.textDecoration = 'none';
	  return node;
	};
	
	A.prototype.attr = {
	  href: function href(val) {
	    if (!val) {
	      return logger.warn('href of <a> should not be a null value.');
	    }
	    this.href = val;
	    this.node.setAttribute('data-href', val);
	  }
	};
	
	A.prototype.bindEvents = function (evts) {
	  // event handler for click event will be processed
	  // before the url redirection.
	  Component.prototype.bindEvents.call(this, evts);
	  this.node.addEventListener('click', function (evt) {
	    if (evt._alreadyFired && evt.target !== this.node) {
	      // if the event target is this.node, then this is
	      // just another click event handler for the same
	      // target, not a handler for a bubbling up event,
	      // otherwise it is a bubbling up event, and it
	      // should be disregarded.
	      return;
	    }
	    evt._alreadyFired = true;
	    location.href = this.href;
	  }.bind(this));
	};
	
	module.exports = A;

/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Component = __webpack_require__(89);
	var utils = __webpack_require__(80);
	
	var ID_PREFIX = 'weex_embed_';
	
	function _generateId() {
	  return ID_PREFIX + utils.getRandom(10);
	}
	
	function Embed(data, nodeType) {
	  var attr = data.attr;
	  if (attr) {
	    this.source = attr.src;
	    this.loader = attr.loader || 'xhr';
	    this.jsonpCallback = attr.jsonpCallback;
	  }
	  Component.call(this, data, nodeType);
	}
	
	Embed.prototype = Object.create(Component.prototype);
	
	Embed.prototype.create = function () {
	  var node = document.createElement('div');
	  node.id = this.id;
	  node.style.overflow = 'scroll';
	  return node;
	};
	
	Embed.prototype.initWeex = function () {
	  this.id = _generateId();
	  this.node.id = this.id;
	  var config = {
	    appId: this.id,
	    source: this.source,
	    bundleUrl: this.source,
	    loader: this.loader,
	    jsonpCallback: this.jsonpCallback,
	    width: this.node.getBoundingClientRect().width,
	    rootId: this.id,
	    embed: true
	  };
	  window.weex.init(config);
	};
	
	Embed.prototype.destroyWeex = function () {
	  this.id && window.destroyInstance(this.id);
	  // TODO: unbind events and clear doms.
	  this.node.innerHTML = '';
	};
	
	Embed.prototype.reloadWeex = function () {
	  if (this.id) {
	    this.destroyWeex();
	    this.id = null;
	    this.node.id = null;
	    this.node.innerHTML = '';
	  }
	  this.initWeex();
	};
	
	// not recommended, because of the leak of memory.
	Embed.prototype.attr = {
	  src: function src(value) {
	    this.source = value;
	    this.reloadWeex();
	  }
	};
	
	module.exports = Embed;

/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Component = __webpack_require__(89);
	var utils = __webpack_require__(80);
	var logger = __webpack_require__(97);
	
	__webpack_require__(148);
	
	var parents = ['scroller', 'list', 'vlist'];
	
	// Only if pulldown offset is larger than this value can this
	// component trigger the 'refresh' event, otherwise just recover
	// to the start point.
	var DEFAULT_CLAMP = 130;
	var DEFAULT_ALIGN_ITEMS = 'center';
	var DEFAULT_JUSTIFY_CONTENT = 'center';
	
	function Refresh(data) {
	  this.isRefreshing = false;
	  this.clamp = (data.style.height || DEFAULT_CLAMP) * data.scale;
	  !data.style.alignItems && (data.style.alignItems = DEFAULT_ALIGN_ITEMS);
	  !data.style.justifyContent && (data.style.justifyContent = DEFAULT_JUSTIFY_CONTENT);
	  Component.call(this, data);
	}
	
	Refresh.prototype = Object.create(Component.prototype);
	
	Refresh.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('weex-container', 'weex-refresh');
	  return node;
	};
	
	Refresh.prototype.onAppend = function () {
	  var parent = this.getParent();
	  var self = this;
	  if (parents.indexOf(parent.data.type) === -1) {
	    // not in a scroller or a list
	    return;
	  }
	  this.refreshPlaceholder = document.createElement('div');
	  this.refreshPlaceholder.classList.add('weex-refresh-placeholder');
	  this.refreshPlaceholder.style.display = 'none';
	  this.refreshPlaceholder.style.width = '0px';
	  this.refreshPlaceholder.style.height = '0px';
	  var scrollElement = parent.scrollElement || parent.listElement;
	  scrollElement.insertBefore(this.refreshPlaceholder, this.node);
	  parent.node.appendChild(this.node);
	  parent.scroller.addEventListener('pulldown', function (e) {
	    if (self.isRefreshing) {
	      return;
	    }
	    self.adjustHeight(Math.abs(e.scrollObj.getScrollTop()));
	    if (!self.display) {
	      self.show();
	    }
	  });
	  parent.scroller.addEventListener('pulldownend', function (e) {
	    if (self.isRefreshing) {
	      return;
	    }
	    var top = Math.abs(e.scrollObj.getScrollTop());
	    if (top > self.clamp) {
	      self.handleRefresh(e);
	    } else {
	      self.hide();
	    }
	  });
	};
	
	Refresh.prototype.adjustHeight = function (val) {
	  this.node.style.height = val + 'px';
	};
	
	Refresh.prototype.adJustPosition = function (val) {
	  this.node.style.top = -val + 'px';
	};
	
	Refresh.prototype.handleRefresh = function (e) {
	  this.node.style.height = this.clamp + 'px';
	  this.dispatchEvent('refresh');
	  this.isRefreshing = true;
	};
	
	Refresh.prototype.show = function () {
	  this.display = true;
	  this.node.style.display = '-webkit-box';
	  this.node.style.display = '-webkit-flex';
	  this.node.style.display = 'flex';
	};
	
	Refresh.prototype.hide = function () {
	  this.display = false;
	  this.node.style.display = 'none';
	  this.isRefreshing = false;
	};
	
	Refresh.prototype.attr = {
	  display: function display(val) {
	    if (val === 'show') {
	      setTimeout(function () {
	        this.show();
	      }.bind(this), 0);
	    } else if (val === 'hide') {
	      setTimeout(function () {
	        this.hide();
	      }.bind(this), 0);
	    } else {
	      logger.error('attr \'display\' of <refresh>\': value ' + val + ' is invalid. Should be \'show\' or \'hide\'');
	    }
	  }
	};
	
	Refresh.prototype.style = utils.extend(Object.create(Component.prototype.style), {
	  height: function height(val) {
	    val = parseFloat(val);
	    if (isNaN(val) || val < 0) {
	      return logger.warn('<refresh>\'s height (' + val + ') is invalid.');
	    }
	    this.clamp = val * this.data.scale;
	  }
	});
	
	module.exports = Refresh;

/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(149);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./refresh.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./refresh.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 149 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-refresh {\n  // -webkit-box-align: center;\n  // -webkit-align-items: center;\n  // align-items: center;\n  // -webkit-box-pack: center;\n  // -webkit-justify-content: center;\n  // justify-content: center;\n  overflow: hidden;\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 0;\n  z-index: 999999;\n  background-color: #666;\n}", ""]);
	
	// exports


/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Component = __webpack_require__(89);
	var utils = __webpack_require__(80);
	var logger = __webpack_require__(97);
	
	__webpack_require__(151);
	
	var parents = ['scroller', 'list', 'vlist'];
	
	var DEFAULT_CLAMP = 130;
	var DEFAULT_ALIGN_ITEMS = 'center';
	var DEFAULT_JUSTIFY_CONTENT = 'center';
	
	function Loading(data) {
	  this.clamp = (data.style.height || DEFAULT_CLAMP) * data.scale;
	  !data.style.alignItems && (data.style.alignItems = DEFAULT_ALIGN_ITEMS);
	  !data.style.justifyContent && (data.style.justifyContent = DEFAULT_JUSTIFY_CONTENT);
	  Component.call(this, data);
	}
	
	Loading.prototype = Object.create(Component.prototype);
	
	Loading.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('weex-container', 'weex-loading');
	  return node;
	};
	
	Loading.prototype.onAppend = function () {
	  var parent = this.getParent();
	  var self = this;
	  var scrollWrapHeight = parent.node.getBoundingClientRect().height;
	  if (parents.indexOf(parent.data.type) === -1) {
	    // not in a scroller or a list
	    return;
	  }
	  this.loadingPlaceholder = document.createElement('div');
	  this.loadingPlaceholder.classList.add('weex-loading-placeholder');
	  this.loadingPlaceholder.style.display = 'none';
	  this.loadingPlaceholder.style.width = '0px';
	  this.loadingPlaceholder.style.height = '0px';
	  var scrollElement = parent.scrollElement || parent.listElement;
	  scrollElement.insertBefore(this.loadingPlaceholder, this.node);
	  parent.node.appendChild(this.node);
	  parent.scroller.addEventListener('pullup', function (e) {
	    if (self.isLoading) {
	      return;
	    }
	    var obj = e.scrollObj;
	    self.adjustHeight(Math.abs(obj.getScrollHeight() - obj.getScrollTop() - scrollWrapHeight));
	    if (!self.display) {
	      self.show();
	    }
	  });
	  parent.scroller.addEventListener('pullupend', function (e) {
	    if (self.isLoading) {
	      return;
	    }
	    self.handleLoading(e);
	  });
	};
	
	Loading.prototype.adjustHeight = function (val) {
	  this.node.style.height = val + 'px';
	};
	
	Loading.prototype.handleLoading = function (e) {
	  this.node.style.height = this.clamp + 'px';
	  this.dispatchEvent('loading');
	  this.isLoading = true;
	};
	
	Loading.prototype.show = function () {
	  this.display = true;
	  this.node.style.display = '-webkit-box';
	  this.node.style.display = '-webkit-flex';
	  this.node.style.display = 'flex';
	};
	
	Loading.prototype.hide = function () {
	  this.display = false;
	  this.node.style.display = 'none';
	  this.isLoading = false;
	};
	
	Loading.prototype.attr = {
	  display: function display(val) {
	    if (val === 'show') {
	      setTimeout(function () {
	        this.show();
	      }.bind(this), 0);
	    } else if (val === 'hide') {
	      setTimeout(function () {
	        this.hide();
	      }.bind(this), 0);
	    } else {
	      logger.error('attr \'display\' of <refresh>\': value ' + val + ' is invalid. Should be \'show\' or \'hide\'');
	    }
	  }
	};
	
	Loading.prototype.style = utils.extend(Object.create(Component.prototype.style), {
	  height: function height(val) {
	    val = parseFloat(val);
	    if (Number.isNaN(val) || val < 0) {
	      return logger.warn('<loading>\'s height (' + val + ') is invalid.');
	    }
	    this.clamp = val * this.data.scale;
	  }
	});
	
	module.exports = Loading;

/***/ },
/* 151 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(152);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./loading.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./loading.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-loading {\n  // -webkit-box-align: center;\n  // -webkit-align-items: center;\n  // align-items: center;\n  // -webkit-box-pack: center;\n  // -webkit-justify-content: center;\n  // justify-content: center;\n  overflow: hidden;\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  height: 0;\n  background-color: #666;\n}", ""]);
	
	// exports


/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	/* global CSSRule */
	
	'use strict';
	
	var Atomic = __webpack_require__(102);
	var utils = __webpack_require__(80);
	
	__webpack_require__(154);
	
	function Spinner(data) {
	  Atomic.call(this, data);
	}
	
	Spinner.prototype = Object.create(Atomic.prototype);
	
	Spinner.prototype.create = function () {
	  var node = document.createElement('div');
	  node.classList.add('weex-container', 'weex-spinner-wrap');
	  this.spinner = document.createElement('div');
	  this.spinner.classList.add('weex-element', 'weex-spinner');
	  node.appendChild(this.spinner);
	  return node;
	};
	
	Spinner.prototype.updateStyle = function (style) {
	  Atomic.prototype.updateStyle.call(this, style);
	  if (style && style.color) {
	    this.setKeyframeColor(utils.getRgb(this.node.style.color));
	  }
	};
	
	Spinner.prototype.getStyleSheet = function () {
	  if (this.styleSheet) {
	    return;
	  }
	  var styles = document.styleSheets;
	  var i = void 0,
	      l = void 0,
	      j = void 0,
	      m = void 0;
	  /* eslint-disable no-labels */
	  outer: for (i = 0, l = styles.length; i < l; i++) {
	    var rules = styles[i].rules;
	    for (j = 0, m = rules.length; j < m; j++) {
	      var item = rules.item(j);
	      if ((item.type === CSSRule.KEYFRAMES_RULE || item.type === CSSRule.WEBKIT_KEYFRAMES_RULE) && item.name === 'spinner') {
	        break outer;
	      }
	    }
	  }
	  /* eslint-enable no-labels */
	  this.styleSheet = styles[i];
	};
	
	Spinner.prototype.setKeyframeColor = function (val) {
	  this.getStyleSheet();
	  var keyframeRules = this.computeKeyFrameRules(val);
	  var rules = this.styleSheet.rules;
	  for (var i = 0, l = rules.length; i < l; i++) {
	    var item = rules.item(i);
	    if ((item.type === CSSRule.KEYFRAMES_RULE || item.type === CSSRule.WEBKIT_KEYFRAMES_RULE) && item.name === 'spinner') {
	      var cssRules = item.cssRules;
	      for (var j = 0, m = cssRules.length; j < m; j++) {
	        var keyframe = cssRules[j];
	        if (keyframe.type === CSSRule.KEYFRAME_RULE || keyframe.type === CSSRule.WEBKIT_KEYFRAME_RULE) {
	          keyframe.style.boxShadow = keyframeRules[j];
	        }
	      }
	    }
	  }
	};
	
	Spinner.prototype.computeKeyFrameRules = function (rgb) {
	  if (!rgb) {
	    return;
	  }
	  var scaleArr = ['0em -2.6em 0em 0em', '1.8em -1.8em 0 0em', '2.5em 0em 0 0em', '1.75em 1.75em 0 0em', '0em 2.5em 0 0em', '-1.8em 1.8em 0 0em', '-2.6em 0em 0 0em', '-1.8em -1.8em 0 0em'];
	  var colorArr = ['1', '0.2', '0.2', '0.2', '0.2', '0.2', '0.5', '0.7'].map(function (e) {
	    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + e + ')';
	  });
	  var rules = [];
	
	  var _loop = function _loop(i) {
	    var tmpColorArr = utils.loopArray(colorArr, i, 'r');
	    rules.push(scaleArr.map(function (scaleStr, i) {
	      return scaleStr + ' ' + tmpColorArr[i];
	    }).join(', '));
	  };
	
	  for (var i = 0; i < scaleArr.length; i++) {
	    _loop(i);
	  }
	  return rules;
	};
	
	module.exports = Spinner;

/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(155);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./spinner.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./spinner.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-spinner-wrap {\n  width: 1.013333rem; /* 76px */\n  height: 1.013333rem;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  -webkit-justify-content: center;\n  justify-content: center;\n  overflow: visible;\n}\n\n.weex-spinner {\n  font-size: 0.16rem; /* 12px */\n  width: 1em;\n  height: 1em;\n  border-radius: 50%;\n  position: relative;\n  text-indent: -9999em;\n  -webkit-animation: spinner 1.1s infinite ease;\n  animation: spinner 1.1s infinite ease;\n  -webkit-transform: translateZ(0);\n  -ms-transform: translateZ(0);\n  transform: translateZ(0);\n}\n@-webkit-keyframes spinner {\n  0%,\n  100% {\n    box-shadow: 0em -2.6em 0em 0em #ffffff, 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.5), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7);\n  }\n  12.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.7), 1.8em -1.8em 0 0em #ffffff, 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5);\n  }\n  25% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.5), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7), 2.5em 0em 0 0em #ffffff, 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  37.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5), 2.5em 0em 0 0em rgba(255, 255, 255, 0.7), 1.75em 1.75em 0 0em #ffffff, 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  50% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.5), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.7), 0em 2.5em 0 0em #ffffff, -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  62.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.5), 0em 2.5em 0 0em rgba(255, 255, 255, 0.7), -1.8em 1.8em 0 0em #ffffff, -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  75% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.5), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.7), -2.6em 0em 0 0em #ffffff, -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  87.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.5), -2.6em 0em 0 0em rgba(255, 255, 255, 0.7), -1.8em -1.8em 0 0em #ffffff;\n  }\n}\n@keyframes spinner {\n  0%,\n  100% {\n    box-shadow: 0em -2.6em 0em 0em #ffffff, 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.5), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7);\n  }\n  12.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.7), 1.8em -1.8em 0 0em #ffffff, 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5);\n  }\n  25% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.5), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7), 2.5em 0em 0 0em #ffffff, 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  37.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5), 2.5em 0em 0 0em rgba(255, 255, 255, 0.7), 1.75em 1.75em 0 0em #ffffff, 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  50% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.5), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.7), 0em 2.5em 0 0em #ffffff, -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  62.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.5), 0em 2.5em 0 0em rgba(255, 255, 255, 0.7), -1.8em 1.8em 0 0em #ffffff, -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  75% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.5), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.7), -2.6em 0em 0 0em #ffffff, -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  87.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.5), -2.6em 0em 0 0em rgba(255, 255, 255, 0.7), -1.8em -1.8em 0 0em #ffffff;\n  }\n}\n", ""]);
	
	// exports


/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Atomic = __webpack_require__(102);
	var utils = __webpack_require__(80);
	var logger = __webpack_require__(97);
	
	// A component to import web pages, which works like
	// a iframe element or a webview.
	// attrs:
	//   - src
	// events:
	//   - pagestart
	//   - pagefinish
	//   - error
	function Web(data) {
	  Atomic.call(this, data);
	}
	
	Web.prototype = Object.create(Atomic.prototype);
	
	Web.prototype.create = function () {
	  // Iframe's defect: can't use position:absolute and top, left, right,
	  // bottom all setting to zero and use margin to leave specified
	  // height for a blank area, and have to use 100% to fill the parent
	  // container, otherwise it will use a unwanted default size instead.
	  // Therefore a div as a iframe wrapper is needed here.
	  var node = document.createElement('div');
	  node.classList.add('weex-container');
	  this.web = document.createElement('iframe');
	  node.appendChild(this.web);
	  this.web.classList.add('weex-element');
	  this.web.style.width = '100%';
	  this.web.style.height = '100%';
	  this.web.style.border = 'none';
	  return node;
	};
	
	Web.prototype.bindEvents = function (evts) {
	  Atomic.prototype.bindEvents.call(this, evts);
	  var that = this;
	  this.web.addEventListener('load', function (e) {
	    that.dispatchEvent('pagefinish', utils.extend({
	      url: that.web.src
	    }));
	  });
	  window.addEventListener('message', this.msgHandler.bind(this));
	};
	
	Web.prototype.msgHandler = function (evt) {
	  var msg = evt.data;
	  if (typeof msg === 'string') {
	    try {
	      msg = JSON.parse(msg);
	    } catch (e) {}
	  }
	  if (!msg) {
	    return;
	  }
	  if (msg.type === 'weex') {
	    if (!utils.isArray(msg.content)) {
	      return logger.error('weex msg received by web component. msg.content' + ' should be a array:', msg.content);
	    }
	    callNative(this.getComponentManager().instanceId, msg.content);
	  }
	};
	
	Web.prototype.attr = {
	  src: function src(val) {
	    this.web.src = val;
	    setTimeout(function () {
	      this.dispatchEvent('pagestart', { url: val });
	    }.bind(this), 0);
	  }
	};
	
	Web.prototype.goBack = function () {
	  this.web.contentWindow.history.back();
	};
	
	Web.prototype.goForward = function () {
	  this.web.contentWindow.history.forward();
	};
	
	Web.prototype.reload = function () {
	  this.web.contentWindow.location.reload();
	};
	
	module.exports = Web;

/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var dom = __webpack_require__(158);
	var event = __webpack_require__(166);
	var pageInfo = __webpack_require__(167);
	var stream = __webpack_require__(168);
	var modal = __webpack_require__(170);
	var animation = __webpack_require__(187);
	var webview = __webpack_require__(188);
	var timer = __webpack_require__(189);
	var navigator = __webpack_require__(190);
	var storage = __webpack_require__(192);
	
	var api = {
	  init: function init(Weex) {
	    Weex.registerApiModule('dom', dom, dom._meta);
	    Weex.registerApiModule('event', event, event._meta);
	    Weex.registerApiModule('pageInfo', pageInfo, pageInfo._meta);
	    Weex.registerApiModule('stream', stream, stream._meta);
	    Weex.registerApiModule('modal', modal, modal._meta);
	    Weex.registerApiModule('animation', animation, animation._meta);
	    Weex.registerApiModule('webview', webview, webview._meta);
	    Weex.registerApiModule('timer', timer, timer._meta);
	    Weex.registerApiModule('navigator', navigator, navigator._meta);
	    Weex.registerApiModule('storage', storage, storage._meta);
	  }
	};
	
	module.exports = api;

/***/ },
/* 158 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// const FrameUpdater = require('../frameUpdater')
	// const Component = require('../components/component')
	
	var scroll = __webpack_require__(159);
	// const config = require('../config')
	var logger = __webpack_require__(97);
	
	var dom = {
	
	  /**
	   * createBody: create root component
	   * @param  {object} element
	   *    container|listview|scrollview
	   * @return {[type]}      [description]
	   */
	  createBody: function createBody(element) {
	    var componentManager = this.getComponentManager();
	    element.scale = this.scale;
	    element.instanceId = componentManager.instanceId;
	    return componentManager.createBody(element);
	  },
	
	  addElement: function addElement(parentRef, element, index) {
	    var componentManager = this.getComponentManager();
	    element.scale = this.scale;
	    element.instanceId = componentManager.instanceId;
	    return componentManager.addElement(parentRef, element, index);
	  },
	
	  removeElement: function removeElement(ref) {
	    var componentManager = this.getComponentManager();
	    return componentManager.removeElement(ref);
	  },
	
	  moveElement: function moveElement(ref, parentRef, index) {
	    var componentManager = this.getComponentManager();
	    return componentManager.moveElement(ref, parentRef, index);
	  },
	
	  addEvent: function addEvent(ref, type) {
	    var componentManager = this.getComponentManager();
	    return componentManager.addEvent(ref, type);
	  },
	
	  removeEvent: function removeEvent(ref, type) {
	    var componentManager = this.getComponentManager();
	    return componentManager.removeEvent(ref, type);
	  },
	
	  /**
	   * updateAttrs: update attributes of component
	   * @param  {string} ref
	   * @param  {obj} attr
	   */
	  updateAttrs: function updateAttrs(ref, attr) {
	    var componentManager = this.getComponentManager();
	    return componentManager.updateAttrs(ref, attr);
	  },
	
	  /**
	   * updateStyle: udpate style of component
	   * @param {string} ref
	   * @param {obj} style
	   */
	  updateStyle: function updateStyle(ref, style) {
	    var componentManager = this.getComponentManager();
	    return componentManager.updateStyle(ref, style);
	  },
	
	  createFinish: function createFinish() {
	    // TODO
	    // FrameUpdater.pause()
	  },
	
	  refreshFinish: function refreshFinish() {
	    // TODO
	  },
	
	  /**
	   * scrollToElement
	   * @param  {string} ref
	   * @param  {obj} options {offset:Number}
	   *   ps: scroll-to has 'ease' and 'duration'(ms) as options.
	   */
	  scrollToElement: function scrollToElement(ref, options) {
	    !options && (options = {});
	    var offset = (Number(options.offset) || 0) * this.scale;
	    var componentManager = this.getComponentManager();
	    var elem = componentManager.getElementByRef(ref);
	    if (!elem) {
	      return logger.error('component of ref ' + ref + ' doesn\'t exist.');
	    }
	    var parentScroller = elem.getParentScroller();
	    if (parentScroller) {
	      parentScroller.scroller.scrollToElement(elem.node, true, offset);
	    } else {
	      var offsetTop = elem.node.getBoundingClientRect().top + document.body.scrollTop;
	      var tween = scroll(0, offsetTop + offset, options);
	      tween.on('end', function () {
	        logger.log('scroll end.');
	      });
	    }
	  }
	
	};
	
	dom._meta = {
	  dom: [{
	    name: 'createBody',
	    args: ['object']
	  }, {
	    name: 'addElement',
	    args: ['string', 'object', 'number']
	  }, {
	    name: 'removeElement',
	    args: ['string']
	  }, {
	    name: 'moveElement',
	    args: ['string', 'string', 'number']
	  }, {
	    name: 'addEvent',
	    args: ['string', 'string']
	  }, {
	    name: 'removeEvent',
	    args: ['string', 'string']
	  }, {
	    name: 'updateAttrs',
	    args: ['string', 'object']
	  }, {
	    name: 'updateStyle',
	    args: ['string', 'object']
	  }, {
	    name: 'createFinish',
	    args: []
	  }, {
	    name: 'refreshFinish',
	    args: []
	  }, {
	    name: 'scrollToElement',
	    args: ['string', 'object']
	  }]
	};
	
	module.exports = dom;

/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * Module dependencies.
	 */
	
	var Tween = __webpack_require__(160);
	var raf = __webpack_require__(165);
	
	/**
	 * Expose `scrollTo`.
	 */
	
	module.exports = scrollTo;
	
	/**
	 * Scroll to `(x, y)`.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @api public
	 */
	
	function scrollTo(x, y, options) {
	  options = options || {};
	
	  // start position
	  var start = scroll();
	
	  // setup tween
	  var tween = Tween(start).ease(options.ease || 'out-circ').to({ top: y, left: x }).duration(options.duration || 1000);
	
	  // scroll
	  tween.update(function (o) {
	    window.scrollTo(o.left | 0, o.top | 0);
	  });
	
	  // handle end
	  tween.on('end', function () {
	    animate = function animate() {};
	  });
	
	  // animate
	  function animate() {
	    raf(animate);
	    tween.update();
	  }
	
	  animate();
	
	  return tween;
	}
	
	/**
	 * Return scroll position.
	 *
	 * @return {Object}
	 * @api private
	 */
	
	function scroll() {
	  var y = window.pageYOffset || document.documentElement.scrollTop;
	  var x = window.pageXOffset || document.documentElement.scrollLeft;
	  return { top: y, left: x };
	}

/***/ },
/* 160 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * Module dependencies.
	 */
	
	var Emitter = __webpack_require__(161);
	var clone = __webpack_require__(162);
	var type = __webpack_require__(163);
	var ease = __webpack_require__(164);
	
	/**
	 * Expose `Tween`.
	 */
	
	module.exports = Tween;
	
	/**
	 * Initialize a new `Tween` with `obj`.
	 *
	 * @param {Object|Array} obj
	 * @api public
	 */
	
	function Tween(obj) {
	  if (!(this instanceof Tween)) return new Tween(obj);
	  this._from = obj;
	  this.ease('linear');
	  this.duration(500);
	}
	
	/**
	 * Mixin emitter.
	 */
	
	Emitter(Tween.prototype);
	
	/**
	 * Reset the tween.
	 *
	 * @api public
	 */
	
	Tween.prototype.reset = function () {
	  this.isArray = 'array' === type(this._from);
	  this._curr = clone(this._from);
	  this._done = false;
	  this._start = Date.now();
	  return this;
	};
	
	/**
	 * Tween to `obj` and reset internal state.
	 *
	 *    tween.to({ x: 50, y: 100 })
	 *
	 * @param {Object|Array} obj
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.to = function (obj) {
	  this.reset();
	  this._to = obj;
	  return this;
	};
	
	/**
	 * Set duration to `ms` [500].
	 *
	 * @param {Number} ms
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.duration = function (ms) {
	  this._duration = ms;
	  return this;
	};
	
	/**
	 * Set easing function to `fn`.
	 *
	 *    tween.ease('in-out-sine')
	 *
	 * @param {String|Function} fn
	 * @return {Tween}
	 * @api public
	 */
	
	Tween.prototype.ease = function (fn) {
	  fn = 'function' == typeof fn ? fn : ease[fn];
	  if (!fn) throw new TypeError('invalid easing function');
	  this._ease = fn;
	  return this;
	};
	
	/**
	 * Stop the tween and immediately emit "stop" and "end".
	 *
	 * @return {Tween}
	 * @api public
	 */
	
	Tween.prototype.stop = function () {
	  this.stopped = true;
	  this._done = true;
	  this.emit('stop');
	  this.emit('end');
	  return this;
	};
	
	/**
	 * Perform a step.
	 *
	 * @return {Tween} self
	 * @api private
	 */
	
	Tween.prototype.step = function () {
	  if (this._done) return;
	
	  // duration
	  var duration = this._duration;
	  var now = Date.now();
	  var delta = now - this._start;
	  var done = delta >= duration;
	
	  // complete
	  if (done) {
	    this._from = this._to;
	    this._update(this._to);
	    this._done = true;
	    this.emit('end');
	    return this;
	  }
	
	  // tween
	  var from = this._from;
	  var to = this._to;
	  var curr = this._curr;
	  var fn = this._ease;
	  var p = (now - this._start) / duration;
	  var n = fn(p);
	
	  // array
	  if (this.isArray) {
	    for (var i = 0; i < from.length; ++i) {
	      curr[i] = from[i] + (to[i] - from[i]) * n;
	    }
	
	    this._update(curr);
	    return this;
	  }
	
	  // objech
	  for (var k in from) {
	    curr[k] = from[k] + (to[k] - from[k]) * n;
	  }
	
	  this._update(curr);
	  return this;
	};
	
	/**
	 * Set update function to `fn` or
	 * when no argument is given this performs
	 * a "step".
	 *
	 * @param {Function} fn
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.update = function (fn) {
	  if (0 == arguments.length) return this.step();
	  this._update = fn;
	  return this;
	};

/***/ },
/* 161 */
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * Expose `Emitter`.
	 */
	
	module.exports = Emitter;
	
	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */
	
	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};
	
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
	  return this;
	};
	
	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.once = function (event, fn) {
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }
	
	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};
	
	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
	  this._callbacks = this._callbacks || {};
	
	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }
	
	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;
	
	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }
	
	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};
	
	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */
	
	Emitter.prototype.emit = function (event) {
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1),
	      callbacks = this._callbacks['$' + event];
	
	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */
	
	Emitter.prototype.listeners = function (event) {
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};
	
	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */
	
	Emitter.prototype.hasListeners = function (event) {
	  return !!this.listeners(event).length;
	};

/***/ },
/* 162 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * Module dependencies.
	 */
	
	var type;
	try {
	  type = __webpack_require__(163);
	} catch (_) {
	  type = __webpack_require__(163);
	}
	
	/**
	 * Module exports.
	 */
	
	module.exports = clone;
	
	/**
	 * Clones objects.
	 *
	 * @param {Mixed} any object
	 * @api public
	 */
	
	function clone(obj) {
	  switch (type(obj)) {
	    case 'object':
	      var copy = {};
	      for (var key in obj) {
	        if (obj.hasOwnProperty(key)) {
	          copy[key] = clone(obj[key]);
	        }
	      }
	      return copy;
	
	    case 'array':
	      var copy = new Array(obj.length);
	      for (var i = 0, l = obj.length; i < l; i++) {
	        copy[i] = clone(obj[i]);
	      }
	      return copy;
	
	    case 'regexp':
	      // from millermedeiros/amd-utils - MIT
	      var flags = '';
	      flags += obj.multiline ? 'm' : '';
	      flags += obj.global ? 'g' : '';
	      flags += obj.ignoreCase ? 'i' : '';
	      return new RegExp(obj.source, flags);
	
	    case 'date':
	      return new Date(obj.getTime());
	
	    default:
	      // string, number, boolean, …
	      return obj;
	  }
	}

/***/ },
/* 163 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	/**
	 * toString ref.
	 */
	
	var toString = Object.prototype.toString;
	
	/**
	 * Return the type of `val`.
	 *
	 * @param {Mixed} val
	 * @return {String}
	 * @api public
	 */
	
	module.exports = function (val) {
	  switch (toString.call(val)) {
	    case '[object Date]':
	      return 'date';
	    case '[object RegExp]':
	      return 'regexp';
	    case '[object Arguments]':
	      return 'arguments';
	    case '[object Array]':
	      return 'array';
	    case '[object Error]':
	      return 'error';
	  }
	
	  if (val === null) return 'null';
	  if (val === undefined) return 'undefined';
	  if (val !== val) return 'nan';
	  if (val && val.nodeType === 1) return 'element';
	
	  val = val.valueOf ? val.valueOf() : Object.prototype.valueOf.apply(val);
	
	  return typeof val === 'undefined' ? 'undefined' : _typeof(val);
	};

/***/ },
/* 164 */
/***/ function(module, exports) {

	'use strict';
	
	// easing functions from "Tween.js"
	
	exports.linear = function (n) {
	  return n;
	};
	
	exports.inQuad = function (n) {
	  return n * n;
	};
	
	exports.outQuad = function (n) {
	  return n * (2 - n);
	};
	
	exports.inOutQuad = function (n) {
	  n *= 2;
	  if (n < 1) return 0.5 * n * n;
	  return -0.5 * (--n * (n - 2) - 1);
	};
	
	exports.inCube = function (n) {
	  return n * n * n;
	};
	
	exports.outCube = function (n) {
	  return --n * n * n + 1;
	};
	
	exports.inOutCube = function (n) {
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n;
	  return 0.5 * ((n -= 2) * n * n + 2);
	};
	
	exports.inQuart = function (n) {
	  return n * n * n * n;
	};
	
	exports.outQuart = function (n) {
	  return 1 - --n * n * n * n;
	};
	
	exports.inOutQuart = function (n) {
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n * n;
	  return -0.5 * ((n -= 2) * n * n * n - 2);
	};
	
	exports.inQuint = function (n) {
	  return n * n * n * n * n;
	};
	
	exports.outQuint = function (n) {
	  return --n * n * n * n * n + 1;
	};
	
	exports.inOutQuint = function (n) {
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n * n * n;
	  return 0.5 * ((n -= 2) * n * n * n * n + 2);
	};
	
	exports.inSine = function (n) {
	  return 1 - Math.cos(n * Math.PI / 2);
	};
	
	exports.outSine = function (n) {
	  return Math.sin(n * Math.PI / 2);
	};
	
	exports.inOutSine = function (n) {
	  return .5 * (1 - Math.cos(Math.PI * n));
	};
	
	exports.inExpo = function (n) {
	  return 0 == n ? 0 : Math.pow(1024, n - 1);
	};
	
	exports.outExpo = function (n) {
	  return 1 == n ? n : 1 - Math.pow(2, -10 * n);
	};
	
	exports.inOutExpo = function (n) {
	  if (0 == n) return 0;
	  if (1 == n) return 1;
	  if ((n *= 2) < 1) return .5 * Math.pow(1024, n - 1);
	  return .5 * (-Math.pow(2, -10 * (n - 1)) + 2);
	};
	
	exports.inCirc = function (n) {
	  return 1 - Math.sqrt(1 - n * n);
	};
	
	exports.outCirc = function (n) {
	  return Math.sqrt(1 - --n * n);
	};
	
	exports.inOutCirc = function (n) {
	  n *= 2;
	  if (n < 1) return -0.5 * (Math.sqrt(1 - n * n) - 1);
	  return 0.5 * (Math.sqrt(1 - (n -= 2) * n) + 1);
	};
	
	exports.inBack = function (n) {
	  var s = 1.70158;
	  return n * n * ((s + 1) * n - s);
	};
	
	exports.outBack = function (n) {
	  var s = 1.70158;
	  return --n * n * ((s + 1) * n + s) + 1;
	};
	
	exports.inOutBack = function (n) {
	  var s = 1.70158 * 1.525;
	  if ((n *= 2) < 1) return 0.5 * (n * n * ((s + 1) * n - s));
	  return 0.5 * ((n -= 2) * n * ((s + 1) * n + s) + 2);
	};
	
	exports.inBounce = function (n) {
	  return 1 - exports.outBounce(1 - n);
	};
	
	exports.outBounce = function (n) {
	  if (n < 1 / 2.75) {
	    return 7.5625 * n * n;
	  } else if (n < 2 / 2.75) {
	    return 7.5625 * (n -= 1.5 / 2.75) * n + 0.75;
	  } else if (n < 2.5 / 2.75) {
	    return 7.5625 * (n -= 2.25 / 2.75) * n + 0.9375;
	  } else {
	    return 7.5625 * (n -= 2.625 / 2.75) * n + 0.984375;
	  }
	};
	
	exports.inOutBounce = function (n) {
	  if (n < .5) return exports.inBounce(n * 2) * .5;
	  return exports.outBounce(n * 2 - 1) * .5 + .5;
	};
	
	// aliases
	
	exports['in-quad'] = exports.inQuad;
	exports['out-quad'] = exports.outQuad;
	exports['in-out-quad'] = exports.inOutQuad;
	exports['in-cube'] = exports.inCube;
	exports['out-cube'] = exports.outCube;
	exports['in-out-cube'] = exports.inOutCube;
	exports['in-quart'] = exports.inQuart;
	exports['out-quart'] = exports.outQuart;
	exports['in-out-quart'] = exports.inOutQuart;
	exports['in-quint'] = exports.inQuint;
	exports['out-quint'] = exports.outQuint;
	exports['in-out-quint'] = exports.inOutQuint;
	exports['in-sine'] = exports.inSine;
	exports['out-sine'] = exports.outSine;
	exports['in-out-sine'] = exports.inOutSine;
	exports['in-expo'] = exports.inExpo;
	exports['out-expo'] = exports.outExpo;
	exports['in-out-expo'] = exports.inOutExpo;
	exports['in-circ'] = exports.inCirc;
	exports['out-circ'] = exports.outCirc;
	exports['in-out-circ'] = exports.inOutCirc;
	exports['in-back'] = exports.inBack;
	exports['out-back'] = exports.outBack;
	exports['in-out-back'] = exports.inOutBack;
	exports['in-bounce'] = exports.inBounce;
	exports['out-bounce'] = exports.outBounce;
	exports['in-out-bounce'] = exports.inOutBounce;

/***/ },
/* 165 */
/***/ function(module, exports) {

	"use strict";
	
	/**
	 * Expose `requestAnimationFrame()`.
	 */
	
	exports = module.exports = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || fallback;
	
	/**
	 * Fallback implementation.
	 */
	
	var prev = new Date().getTime();
	function fallback(fn) {
	  var curr = new Date().getTime();
	  var ms = Math.max(0, 16 - (curr - prev));
	  var req = setTimeout(fn, ms);
	  prev = curr;
	  return req;
	}
	
	/**
	 * Cancel.
	 */
	
	var cancel = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.clearTimeout;
	
	exports.cancel = function (id) {
	  cancel.call(window, id);
	};

/***/ },
/* 166 */
/***/ function(module, exports) {

	'use strict';
	
	var event = {
	  /**
	   * openUrl
	   * @param  {string} url
	   */
	  openURL: function openURL(url) {
	    location.href = url;
	  }
	
	};
	
	event._meta = {
	  event: [{
	    name: 'openURL',
	    args: ['string']
	  }]
	};
	
	module.exports = event;

/***/ },
/* 167 */
/***/ function(module, exports) {

	'use strict';
	
	var pageInfo = {
	
	  setTitle: function setTitle(title) {
	    title = title || 'Weex HTML5';
	    try {
	      title = decodeURIComponent(title);
	    } catch (e) {}
	    document.title = title;
	  }
	};
	
	pageInfo._meta = {
	  pageInfo: [{
	    name: 'setTitle',
	    args: ['string']
	  }]
	};
	
	module.exports = pageInfo;

/***/ },
/* 168 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/* global lib, XMLHttpRequest */
	
	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var utils = __webpack_require__(80);
	var logger = __webpack_require__(97);
	
	__webpack_require__(169);
	
	var jsonpCnt = 0;
	var ERROR_STATE = -1;
	
	var TYPE_JSON = 'application/json;charset=UTF-8';
	var TYPE_FORM = 'application/x-www-form-urlencoded';
	
	var REG_FORM = /^(?:[^&=]+=[^&=]+)(?:&[^&=]+=[^&=]+)*$/;
	
	function _jsonp(config, callback, progressCallback) {
	  var cbName = 'jsonp_' + ++jsonpCnt;
	  var url = void 0;
	
	  if (!config.url) {
	    logger.error('config.url should be set in _jsonp for \'fetch\' API.');
	  }
	
	  global[cbName] = function (cb) {
	    return function (response) {
	      callback(response);
	      delete global[cb];
	    };
	  }(cbName);
	
	  var script = document.createElement('script');
	  try {
	    url = lib.httpurl(config.url);
	  } catch (err) {
	    logger.error('invalid config.url in _jsonp for \'fetch\' API: ' + config.url);
	  }
	  url.params.callback = cbName;
	  script.type = 'text/javascript';
	  script.src = url.toString();
	  // script.onerror is not working on IE or safari.
	  // but they are not considered here.
	  script.onerror = function (cb) {
	    return function (err) {
	      logger.error('unexpected error in _jsonp for \'fetch\' API', err);
	      callback(err);
	      delete global[cb];
	    };
	  }(cbName);
	  var head = document.getElementsByTagName('head')[0];
	  head.insertBefore(script, null);
	}
	
	function _xhr(config, callback, progressCallback) {
	  var xhr = new XMLHttpRequest();
	  xhr.responseType = config.type;
	  xhr.open(config.method, config.url, true);
	
	  var headers = config.headers || {};
	  for (var k in headers) {
	    xhr.setRequestHeader(k, headers[k]);
	  }
	
	  xhr.onload = function (res) {
	    callback({
	      status: xhr.status,
	      ok: xhr.status >= 200 && xhr.status < 300,
	      statusText: xhr.statusText,
	      data: xhr.response,
	      headers: xhr.getAllResponseHeaders().split('\n').reduce(function (obj, headerStr) {
	        var headerArr = headerStr.match(/(.+): (.+)/);
	        if (headerArr) {
	          obj[headerArr[1]] = headerArr[2];
	        }
	        return obj;
	      }, {})
	    });
	  };
	
	  if (progressCallback) {
	    xhr.onprogress = function (e) {
	      progressCallback({
	        readyState: xhr.readyState,
	        status: xhr.status,
	        length: e.loaded,
	        total: e.total,
	        statusText: xhr.statusText,
	        headers: xhr.getAllResponseHeaders().split('\n').reduce(function (obj, headerStr) {
	          var headerArr = headerStr.match(/(.+): (.+)/);
	          if (headerArr) {
	            obj[headerArr[1]] = headerArr[2];
	          }
	          return obj;
	        }, {})
	      });
	    };
	  }
	
	  xhr.onerror = function (err) {
	    logger.error('unexpected error in _xhr for \'fetch\' API', err);
	    callback({
	      status: ERROR_STATE,
	      ok: false,
	      statusText: '',
	      data: '',
	      headers: {}
	    });
	  };
	
	  xhr.send(config.body);
	}
	
	var stream = {
	
	  /**
	   * sendHttp
	   * @deprecated
	   * Note: This API is deprecated. Please use stream.fetch instead.
	   * send a http request through XHR.
	   * @param  {obj} params
	   *  - method: 'GET' | 'POST',
	   *  - url: url requested
	   * @param  {string} callbackId
	   */
	  sendHttp: function sendHttp(param, callbackId) {
	    if (typeof param === 'string') {
	      try {
	        param = JSON.parse(param);
	      } catch (e) {
	        return;
	      }
	    }
	    if ((typeof param === 'undefined' ? 'undefined' : _typeof(param)) !== 'object' || !param.url) {
	      return logger.error('invalid config or invalid config.url for sendHttp API');
	    }
	
	    var sender = this.sender;
	    var method = param.method || 'GET';
	    var xhr = new XMLHttpRequest();
	    xhr.open(method, param.url, true);
	    xhr.onload = function () {
	      sender.performCallback(callbackId, this.responseText);
	    };
	    xhr.onerror = function (error) {
	      return logger.error('unexpected error in sendHttp API', error);
	      // sender.performCallback(
	      //   callbackId,
	      //   new Error('unexpected error in sendHttp API')
	      // )
	    };
	    xhr.send();
	  },
	
	  /**
	   * fetch
	   * use stream.fetch to request for a json file, a plain text file or
	   * a arraybuffer for a file stream. (You can use Blob and FileReader
	   * API implemented by most modern browsers to read a arraybuffer.)
	   * @param  {object} options config options
	   *   - method {string} 'GET' | 'POST'
	   *   - headers {obj}
	   *   - url {string}
	   *   - mode {string} 'cors' | 'no-cors' | 'same-origin' | 'navigate'
	   *   - body
	   *   - type {string} 'json' | 'jsonp' | 'text'
	   * @param  {string} callbackId
	   * @param  {string} progressCallbackId
	   */
	  fetch: function fetch(options, callbackId, progressCallbackId) {
	    var DEFAULT_METHOD = 'GET';
	    var DEFAULT_MODE = 'cors';
	    var DEFAULT_TYPE = 'text';
	
	    var methodOptions = ['GET', 'POST'];
	    var modeOptions = ['cors', 'no-cors', 'same-origin', 'navigate'];
	    var typeOptions = ['text', 'json', 'jsonp', 'arraybuffer'];
	
	    // const fallback = false  // fallback from 'fetch' API to XHR.
	    var sender = this.sender;
	
	    var config = utils.extend({}, options);
	
	    // validate options.method
	    if (typeof config.method === 'undefined') {
	      config.method = DEFAULT_METHOD;
	      logger.warn('options.method for \'fetch\' API has been set to ' + 'default value \'' + config.method + '\'');
	    } else if (methodOptions.indexOf((config.method + '').toUpperCase()) === -1) {
	      return logger.error('options.method \'' + config.method + '\' for \'fetch\' API should be one of ' + methodOptions + '.');
	    }
	
	    // validate options.url
	    if (!config.url) {
	      return logger.error('options.url should be set for \'fetch\' API.');
	    }
	
	    // validate options.mode
	    if (typeof config.mode === 'undefined') {
	      config.mode = DEFAULT_MODE;
	    } else if (modeOptions.indexOf((config.mode + '').toLowerCase()) === -1) {
	      return logger.error('options.mode \'' + config.mode + '\' for \'fetch\' API should be one of ' + modeOptions + '.');
	    }
	
	    // validate options.type
	    if (typeof config.type === 'undefined') {
	      config.type = DEFAULT_TYPE;
	      logger.warn('options.type for \'fetch\' API has been set to ' + 'default value \'' + config.type + '\'.');
	    } else if (typeOptions.indexOf((config.type + '').toLowerCase()) === -1) {
	      return logger.error('options.type \'' + config.type + '\' for \'fetch\' API should be one of ' + typeOptions + '.');
	    }
	
	    // validate options.headers
	    config.headers = config.headers || {};
	    if (!utils.isPlainObject(config.headers)) {
	      return logger.error('options.headers should be a plain object');
	    }
	
	    // validate options.body
	    var body = config.body;
	    if (!config.headers['Content-Type'] && body) {
	      if (utils.isPlainObject(body)) {
	        // is a json data
	        try {
	          config.body = JSON.stringify(body);
	          config.headers['Content-Type'] = TYPE_JSON;
	        } catch (e) {}
	      } else if (utils.getType(body) === 'string' && body.match(REG_FORM)) {
	        // is form-data
	        config.body = encodeURI(body);
	        config.headers['Content-Type'] = TYPE_FORM;
	      }
	    }
	
	    var _callArgs = [config, function (res) {
	      sender.performCallback(callbackId, res);
	    }];
	    if (progressCallbackId) {
	      _callArgs.push(function (res) {
	        // Set 'keepAlive' to true for sending continuous callbacks
	        sender.performCallback(progressCallbackId, res, true);
	      });
	    }
	
	    if (config.type === 'jsonp') {
	      _jsonp.apply(this, _callArgs);
	    } else {
	      _xhr.apply(this, _callArgs);
	    }
	  }
	
	};
	
	stream._meta = {
	  stream: [{
	    name: 'sendHttp',
	    args: ['object', 'function']
	  }, {
	    name: 'fetch',
	    args: ['object', 'function', 'function']
	  }]
	};
	
	module.exports = stream;
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 169 */
/***/ function(module, exports) {

	"use strict";
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	typeof window === 'undefined' && (window = { ctrl: {}, lib: {} });!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function (a, b) {
	  function c(a) {
	    var b = {};Object.defineProperty(this, "params", { set: function set(a) {
	        if ("object" == (typeof a === "undefined" ? "undefined" : _typeof(a))) {
	          for (var c in b) {
	            delete b[c];
	          }for (var c in a) {
	            b[c] = a[c];
	          }
	        }
	      }, get: function get() {
	        return b;
	      }, enumerable: !0 }), Object.defineProperty(this, "search", { set: function set(a) {
	        if ("string" == typeof a) {
	          0 === a.indexOf("?") && (a = a.substr(1));var c = a.split("&");for (var d in b) {
	            delete b[d];
	          }for (var e = 0; e < c.length; e++) {
	            var f = c[e].split("=");if (void 0 !== f[1] && (f[1] = f[1].toString()), f[0]) try {
	              b[decodeURIComponent(f[0])] = decodeURIComponent(f[1]);
	            } catch (g) {
	              b[f[0]] = f[1];
	            }
	          }
	        }
	      }, get: function get() {
	        var a = [];for (var c in b) {
	          if (void 0 !== b[c]) if ("" !== b[c]) try {
	            a.push(encodeURIComponent(c) + "=" + encodeURIComponent(b[c]));
	          } catch (d) {
	            a.push(c + "=" + b[c]);
	          } else try {
	            a.push(encodeURIComponent(c));
	          } catch (d) {
	            a.push(c);
	          }
	        }return a.length ? "?" + a.join("&") : "";
	      }, enumerable: !0 });var c;Object.defineProperty(this, "hash", { set: function set(a) {
	        "string" == typeof a && (a && a.indexOf("#") < 0 && (a = "#" + a), c = a || "");
	      }, get: function get() {
	        return c;
	      }, enumerable: !0 }), this.set = function (a) {
	      a = a || "";var b;if (!(b = a.match(new RegExp("^([a-z0-9-]+:)?[/]{2}(?:([^@/:?]+)(?::([^@/:]+))?@)?([^:/?#]+)(?:[:]([0-9]+))?([/][^?#;]*)?(?:[?]([^#]*))?([#][^?]*)?$", "i")))) throw new Error("Wrong uri scheme.");this.protocol = b[1] || ("object" == (typeof location === "undefined" ? "undefined" : _typeof(location)) ? location.protocol : ""), this.username = b[2] || "", this.password = b[3] || "", this.hostname = this.host = b[4], this.port = b[5] || "", this.pathname = b[6] || "/", this.search = b[7] || "", this.hash = b[8] || "", this.origin = this.protocol + "//" + this.hostname;
	    }, this.toString = function () {
	      var a = this.protocol + "//";return this.username && (a += this.username, this.password && (a += ":" + this.password), a += "@"), a += this.host, this.port && "80" !== this.port && (a += ":" + this.port), this.pathname && (a += this.pathname), this.search && (a += this.search), this.hash && (a += this.hash), a;
	    }, a && this.set(a.toString());
	  }b.httpurl = function (a) {
	    return new c(a);
	  };
	}(window, window.lib || (window.lib = {}));;module.exports = window.lib['httpurl'];

/***/ },
/* 170 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var modal = __webpack_require__(171);
	
	var msg = {
	
	  // duration: default is 0.8 seconds.
	  toast: function toast(config) {
	    modal.toast(config.message, config.duration);
	  },
	
	  // config:
	  //  - message: string
	  //  - okTitle: title of ok button
	  //  - callback
	  alert: function alert(config, callbackId) {
	    var sender = this.sender;
	    config.callback = function () {
	      sender.performCallback(callbackId);
	    };
	    modal.alert(config);
	  },
	
	  // config:
	  //  - message: string
	  //  - okTitle: title of ok button
	  //  - cancelTitle: title of cancel button
	  //  - callback
	  confirm: function confirm(config, callbackId) {
	    var sender = this.sender;
	    config.callback = function (val) {
	      sender.performCallback(callbackId, val);
	    };
	    modal.confirm(config);
	  },
	
	  // config:
	  //  - message: string
	  //  - okTitle: title of ok button
	  //  - cancelTitle: title of cancel button
	  //  - callback
	  prompt: function prompt(config, callbackId) {
	    var sender = this.sender;
	    config.callback = function (val) {
	      sender.performCallback(callbackId, val);
	    };
	    modal.prompt(config);
	  }
	
	};
	
	msg._meta = {
	  modal: [{
	    name: 'toast',
	    args: ['object']
	  }, {
	    name: 'alert',
	    args: ['object', 'string']
	  }, {
	    name: 'confirm',
	    args: ['object', 'string']
	  }, {
	    name: 'prompt',
	    args: ['object', 'string']
	  }]
	};
	
	module.exports = msg;

/***/ },
/* 171 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Alert = __webpack_require__(172);
	var Confirm = __webpack_require__(178);
	var Prompt = __webpack_require__(181);
	var _toast = __webpack_require__(184);
	
	var modal = {
	
	  toast: function toast(msg, duration) {
	    _toast.push(msg, duration);
	  },
	
	  alert: function alert(config) {
	    new Alert(config).show();
	  },
	
	  prompt: function prompt(config) {
	    new Prompt(config).show();
	  },
	
	  confirm: function confirm(config) {
	    new Confirm(config).show();
	  }
	
	};
	
	!window.lib && (window.lib = {});
	window.lib.modal = modal;
	
	module.exports = modal;

/***/ },
/* 172 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Modal = __webpack_require__(173);
	__webpack_require__(176);
	
	var CONTENT_CLASS = 'content';
	var MSG_CLASS = 'content-msg';
	var BUTTON_GROUP_CLASS = 'btn-group';
	var BUTTON_CLASS = 'btn';
	
	function Alert(config) {
	  this.msg = config.message || '';
	  this.callback = config.callback;
	  this.okTitle = config.okTitle || 'OK';
	  Modal.call(this);
	  this.node.classList.add('amfe-alert');
	}
	
	Alert.prototype = Object.create(Modal.prototype);
	
	Alert.prototype.createNodeContent = function () {
	  var content = document.createElement('div');
	  content.classList.add(CONTENT_CLASS);
	  this.node.appendChild(content);
	
	  var msg = document.createElement('div');
	  msg.classList.add(MSG_CLASS);
	  msg.appendChild(document.createTextNode(this.msg));
	  content.appendChild(msg);
	
	  var buttonGroup = document.createElement('div');
	  buttonGroup.classList.add(BUTTON_GROUP_CLASS);
	  this.node.appendChild(buttonGroup);
	  var button = document.createElement('div');
	  button.classList.add(BUTTON_CLASS, 'alert-ok');
	  button.appendChild(document.createTextNode(this.okTitle));
	  buttonGroup.appendChild(button);
	};
	
	Alert.prototype.bindEvents = function () {
	  Modal.prototype.bindEvents.call(this);
	  var button = this.node.querySelector('.' + BUTTON_CLASS);
	  button.addEventListener('click', function () {
	    this.destroy();
	    this.callback && this.callback();
	  }.bind(this));
	};
	
	module.exports = Alert;

/***/ },
/* 173 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(174);
	
	// there will be only one instance of modal.
	var MODAL_WRAP_CLASS = 'amfe-modal-wrap';
	var MODAL_NODE_CLASS = 'amfe-modal-node';
	
	function Modal() {
	  this.wrap = document.querySelector(MODAL_WRAP_CLASS);
	  this.node = document.querySelector(MODAL_NODE_CLASS);
	  if (!this.wrap) {
	    this.createWrap();
	  }
	  if (!this.node) {
	    this.createNode();
	  }
	  this.clearNode();
	  this.createNodeContent();
	  this.bindEvents();
	}
	
	Modal.prototype = {
	
	  show: function show() {
	    this.wrap.style.display = 'block';
	    this.node.classList.remove('hide');
	  },
	
	  destroy: function destroy() {
	    document.body.removeChild(this.wrap);
	    document.body.removeChild(this.node);
	    this.wrap = null;
	    this.node = null;
	  },
	
	  createWrap: function createWrap() {
	    this.wrap = document.createElement('div');
	    this.wrap.className = MODAL_WRAP_CLASS;
	    document.body.appendChild(this.wrap);
	  },
	
	  createNode: function createNode() {
	    this.node = document.createElement('div');
	    this.node.classList.add(MODAL_NODE_CLASS, 'hide');
	    document.body.appendChild(this.node);
	  },
	
	  clearNode: function clearNode() {
	    this.node.innerHTML = '';
	  },
	
	  createNodeContent: function createNodeContent() {
	
	    // do nothing.
	    // child classes can override this method.
	  },
	
	  bindEvents: function bindEvents() {
	    this.wrap.addEventListener('click', function (e) {
	      e.preventDefault();
	      e.stopPropagation();
	    });
	  }
	};
	
	module.exports = Modal;

/***/ },
/* 174 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(175);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./modal.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./modal.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 175 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-modal-wrap {\n  display: none;\n  position: fixed;\n  z-index: 999999999;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background-color: #000;\n  opacity: 0.5;\n}\n\n.amfe-modal-node {\n  position: fixed;\n  z-index: 9999999999;\n  top: 50%;\n  left: 50%;\n  width: 6.666667rem;\n  min-height: 2.666667rem;\n  border-radius: 0.066667rem;\n  -webkit-transform: translate(-50%, -50%);\n  transform: translate(-50%, -50%);\n  background-color: #fff;\n}\n.amfe-modal-node.hide {\n  display: none;\n}\n.amfe-modal-node .content {\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  -webkit-justify-content: center;\n  justify-content: center;\n  width: 100%;\n  min-height: 1.866667rem;\n  box-sizing: border-box;\n  font-size: 0.32rem;\n  line-height: 0.426667rem;\n  padding: 0.213333rem;\n  border-bottom: 1px solid #ddd;\n}\n.amfe-modal-node .btn-group {\n  width: 100%;\n  height: 0.8rem;\n  font-size: 0.373333rem;\n  text-align: center;\n  margin: 0;\n  padding: 0;\n  border: none;\n}\n.amfe-modal-node .btn-group .btn {\n  box-sizing: border-box;\n  height: 0.8rem;\n  line-height: 0.8rem;\n  margin: 0;\n  padding: 0;\n  border: none;\n  background: none;\n}\n", ""]);
	
	// exports


/***/ },
/* 176 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(177);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./alert.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./alert.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-alert .amfe-alert-ok {\n  width: 100%;\n}\n", ""]);
	
	// exports


/***/ },
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Modal = __webpack_require__(173);
	__webpack_require__(179);
	
	var CONTENT_CLASS = 'content';
	var MSG_CLASS = 'content-msg';
	var BUTTON_GROUP_CLASS = 'btn-group';
	var BUTTON_CLASS = 'btn';
	
	function Confirm(config) {
	  this.msg = config.message || '';
	  this.callback = config.callback;
	  this.okTitle = config.okTitle || 'OK';
	  this.cancelTitle = config.cancelTitle || 'Cancel';
	  Modal.call(this);
	  this.node.classList.add('amfe-confirm');
	}
	
	Confirm.prototype = Object.create(Modal.prototype);
	
	Confirm.prototype.createNodeContent = function () {
	  var content = document.createElement('div');
	  content.classList.add(CONTENT_CLASS);
	  this.node.appendChild(content);
	
	  var msg = document.createElement('div');
	  msg.classList.add(MSG_CLASS);
	  msg.appendChild(document.createTextNode(this.msg));
	  content.appendChild(msg);
	
	  var buttonGroup = document.createElement('div');
	  buttonGroup.classList.add(BUTTON_GROUP_CLASS);
	  this.node.appendChild(buttonGroup);
	  var btnOk = document.createElement('div');
	  btnOk.appendChild(document.createTextNode(this.okTitle));
	  btnOk.classList.add('btn-ok', BUTTON_CLASS);
	  var btnCancel = document.createElement('div');
	  btnCancel.appendChild(document.createTextNode(this.cancelTitle));
	  btnCancel.classList.add('btn-cancel', BUTTON_CLASS);
	  buttonGroup.appendChild(btnOk);
	  buttonGroup.appendChild(btnCancel);
	  this.node.appendChild(buttonGroup);
	};
	
	Confirm.prototype.bindEvents = function () {
	  Modal.prototype.bindEvents.call(this);
	  var btnOk = this.node.querySelector('.' + BUTTON_CLASS + '.btn-ok');
	  var btnCancel = this.node.querySelector('.' + BUTTON_CLASS + '.btn-cancel');
	  btnOk.addEventListener('click', function () {
	    this.destroy();
	    this.callback && this.callback(this.okTitle);
	  }.bind(this));
	  btnCancel.addEventListener('click', function () {
	    this.destroy();
	    this.callback && this.callback(this.cancelTitle);
	  }.bind(this));
	};
	
	module.exports = Confirm;

/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(180);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./confirm.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./confirm.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 180 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-confirm .btn-group .btn {\n  float: left;\n  width: 50%;\n}\n.amfe-confirm .btn-group .btn.btn-ok {\n  border-right: 1px solid #ddd;\n}\n", ""]);
	
	// exports


/***/ },
/* 181 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Modal = __webpack_require__(173);
	__webpack_require__(182);
	
	var CONTENT_CLASS = 'content';
	var MSG_CLASS = 'content-msg';
	var BUTTON_GROUP_CLASS = 'btn-group';
	var BUTTON_CLASS = 'btn';
	var INPUT_WRAP_CLASS = 'input-wrap';
	var INPUT_CLASS = 'input';
	
	function Prompt(config) {
	  this.msg = config.message || '';
	  this.defaultMsg = config.default || '';
	  this.callback = config.callback;
	  this.okTitle = config.okTitle || 'OK';
	  this.cancelTitle = config.cancelTitle || 'Cancel';
	  Modal.call(this);
	  this.node.classList.add('amfe-prompt');
	}
	
	Prompt.prototype = Object.create(Modal.prototype);
	
	Prompt.prototype.createNodeContent = function () {
	
	  var content = document.createElement('div');
	  content.classList.add(CONTENT_CLASS);
	  this.node.appendChild(content);
	
	  var msg = document.createElement('div');
	  msg.classList.add(MSG_CLASS);
	  msg.appendChild(document.createTextNode(this.msg));
	  content.appendChild(msg);
	
	  var inputWrap = document.createElement('div');
	  inputWrap.classList.add(INPUT_WRAP_CLASS);
	  content.appendChild(inputWrap);
	  var input = document.createElement('input');
	  input.classList.add(INPUT_CLASS);
	  input.type = 'text';
	  input.autofocus = true;
	  input.placeholder = this.defaultMsg;
	  inputWrap.appendChild(input);
	
	  var buttonGroup = document.createElement('div');
	  buttonGroup.classList.add(BUTTON_GROUP_CLASS);
	  var btnOk = document.createElement('div');
	  btnOk.appendChild(document.createTextNode(this.okTitle));
	  btnOk.classList.add('btn-ok', BUTTON_CLASS);
	  var btnCancel = document.createElement('div');
	  btnCancel.appendChild(document.createTextNode(this.cancelTitle));
	  btnCancel.classList.add('btn-cancel', BUTTON_CLASS);
	  buttonGroup.appendChild(btnOk);
	  buttonGroup.appendChild(btnCancel);
	  this.node.appendChild(buttonGroup);
	};
	
	Prompt.prototype.bindEvents = function () {
	  Modal.prototype.bindEvents.call(this);
	  var btnOk = this.node.querySelector('.' + BUTTON_CLASS + '.btn-ok');
	  var btnCancel = this.node.querySelector('.' + BUTTON_CLASS + '.btn-cancel');
	  var that = this;
	  btnOk.addEventListener('click', function () {
	    var val = document.querySelector('input').value;
	    this.destroy();
	    this.callback && this.callback({
	      result: that.okTitle,
	      data: val
	    });
	  }.bind(this));
	  btnCancel.addEventListener('click', function () {
	    var val = document.querySelector('input').value;
	    this.destroy();
	    this.callback && this.callback({
	      result: that.cancelTitle,
	      data: val
	    });
	  }.bind(this));
	};
	
	module.exports = Prompt;

/***/ },
/* 182 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(183);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./prompt.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./prompt.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 183 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-prompt .input-wrap {\n  box-sizing: border-box;\n  width: 100%;\n  margin-top: 0.133333rem;\n  // padding: 0.24rem 0.213333rem 0.213333rem;\n  height: 0.96rem;\n}\n.amfe-prompt .input-wrap .input {\n  box-sizing: border-box;\n  width: 100%;\n  height: 0.56rem;\n  line-height: 0.56rem;\n  font-size: 0.32rem;\n  border: 1px solid #999;\n}\n.amfe-prompt .btn-group .btn {\n  float: left;\n  width: 50%;\n}\n.amfe-prompt .btn-group .btn.btn-ok {\n  border-right: 1px solid #ddd;\n}\n", ""]);
	
	// exports


/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(185);
	
	var queue = [];
	var timer;
	var isProcessing = false;
	var toastWin;
	var TOAST_WIN_CLASS_NAME = 'amfe-toast';
	
	var DEFAULT_DURATION = 0.8;
	
	function showToastWindow(msg, callback) {
	  var handleTransitionEnd = function handleTransitionEnd() {
	    toastWin.removeEventListener('transitionend', handleTransitionEnd);
	    callback && callback();
	  };
	  if (!toastWin) {
	    toastWin = document.createElement('div');
	    toastWin.classList.add(TOAST_WIN_CLASS_NAME, 'hide');
	    document.body.appendChild(toastWin);
	  }
	  toastWin.innerHTML = msg;
	  toastWin.addEventListener('transitionend', handleTransitionEnd);
	  setTimeout(function () {
	    toastWin.classList.remove('hide');
	  }, 0);
	}
	
	function hideToastWindow(callback) {
	  var handleTransitionEnd = function handleTransitionEnd() {
	    toastWin.removeEventListener('transitionend', handleTransitionEnd);
	    callback && callback();
	  };
	  if (!toastWin) {
	    return;
	  }
	  toastWin.addEventListener('transitionend', handleTransitionEnd);
	  toastWin.classList.add('hide');
	}
	
	var toast = {
	
	  push: function push(msg, duration) {
	    queue.push({
	      msg: msg,
	      duration: duration || DEFAULT_DURATION
	    });
	    this.show();
	  },
	
	  show: function show() {
	    var that = this;
	
	    // All messages had been toasted already, so remove the toast window,
	    if (!queue.length) {
	      toastWin && toastWin.parentNode.removeChild(toastWin);
	      toastWin = null;
	      return;
	    }
	
	    // the previous toast is not ended yet.
	    if (isProcessing) {
	      return;
	    }
	    isProcessing = true;
	
	    var toastInfo = queue.shift();
	    showToastWindow(toastInfo.msg, function () {
	      timer = setTimeout(function () {
	        timer = null;
	        hideToastWindow(function () {
	          isProcessing = false;
	          that.show();
	        });
	      }, toastInfo.duration * 1000);
	    });
	  }
	
	};
	
	module.exports = {
	  push: toast.push.bind(toast)
	};

/***/ },
/* 185 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(186);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(74)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./toast.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./toast.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 186 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(73)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-toast {\n  font-size: 0.32rem;\n  line-height: 0.426667rem;\n  position: fixed;\n  box-sizing: border-box;\n  max-width: 80%;\n  bottom: 2.666667rem;\n  left: 50%;\n  padding: 0.213333rem;\n  background-color: #000;\n  color: #fff;\n  text-align: center;\n  opacity: 0.6;\n  transition: all 0.4s ease-in-out;\n  border-radius: 0.066667rem;\n  -webkit-transform: translateX(-50%);\n  transform: translateX(-50%);\n}\n\n.amfe-toast.hide {\n  opacity: 0;\n}\n", ""]);
	
	// exports


/***/ },
/* 187 */
/***/ function(module, exports) {

	'use strict';
	
	var _data = {};
	
	var animation = {
	
	  /**
	   * transition
	   * @param  {string} ref        [description]
	   * @param  {obj} config     [description]
	   * @param  {string} callbackId [description]
	   */
	  transition: function transition(ref, config, callbackId) {
	    var refData = _data[ref];
	    var stylesKey = JSON.stringify(config.styles);
	    var weexInstance = this;
	    // If the same component perform a animation with exactly the same
	    // styles in a sequence with so short interval that the prev animation
	    // is still in playing, then the next animation should be ignored.
	    if (refData && refData[stylesKey]) {
	      return;
	    }
	    if (!refData) {
	      refData = _data[ref] = {};
	    }
	    refData[stylesKey] = true;
	    return this.getComponentManager().transition(ref, config, function () {
	      // Remove the stylesKey in refData so that the same animation
	      // can be played again after current animation is already finished.
	      delete refData[stylesKey];
	      weexInstance.sender.performCallback(callbackId);
	    });
	  }
	
	};
	
	animation._meta = {
	  animation: [{
	    name: 'transition',
	    args: ['string', 'object', 'string']
	  }]
	};
	
	module.exports = animation;

/***/ },
/* 188 */
/***/ function(module, exports) {

	'use strict';
	
	var webview = {
	
	  // ref: ref of the web component.
	  goBack: function goBack(ref) {
	    var webComp = this.getComponentManager().getElementByRef(ref);
	    if (!webComp.goBack) {
	      console.error('error: the specified component has no method of' + ' goBack. Please make sure it is a webview component.');
	      return;
	    }
	    webComp.goBack();
	  },
	
	  // ref: ref of the web component.
	  goForward: function goForward(ref) {
	    var webComp = this.getComponentManager().getElementByRef(ref);
	    if (!webComp.goForward) {
	      console.error('error: the specified component has no method of' + ' goForward. Please make sure it is a webview component.');
	      return;
	    }
	    webComp.goForward();
	  },
	
	  // ref: ref of the web component.
	  reload: function reload(ref) {
	    var webComp = this.getComponentManager().getElementByRef(ref);
	    if (!webComp.reload) {
	      console.error('error: the specified component has no method of' + ' reload. Please make sure it is a webview component.');
	      return;
	    }
	    webComp.reload();
	  }
	
	};
	
	webview._meta = {
	  webview: [{
	    name: 'goBack',
	    args: ['string']
	  }, {
	    name: 'goForward',
	    args: ['string']
	  }, {
	    name: 'reload',
	    args: ['string']
	  }]
	};
	
	module.exports = webview;

/***/ },
/* 189 */
/***/ function(module, exports) {

	'use strict';
	
	var timer = {
	
	  setTimeout: function (_setTimeout) {
	    function setTimeout(_x, _x2) {
	      return _setTimeout.apply(this, arguments);
	    }
	
	    setTimeout.toString = function () {
	      return _setTimeout.toString();
	    };
	
	    return setTimeout;
	  }(function (timeoutCallbackId, delay) {
	    var sender = this.sender;
	    var timerId = setTimeout(function () {
	      sender.performCallback(timeoutCallbackId);
	    }, delay);
	    return timerId;
	  }),
	
	  clearTimeout: function (_clearTimeout) {
	    function clearTimeout(_x3) {
	      return _clearTimeout.apply(this, arguments);
	    }
	
	    clearTimeout.toString = function () {
	      return _clearTimeout.toString();
	    };
	
	    return clearTimeout;
	  }(function (timerId) {
	    clearTimeout(timerId);
	  })
	
	};
	
	timer._meta = {
	  timer: [{
	    name: 'setTimeout',
	    args: ['function', 'number']
	  }, {
	    name: 'clearTimeout',
	    args: ['number']
	  }]
	};
	
	module.exports = timer;

/***/ },
/* 190 */
/***/ function(module, exports) {

	'use strict';
	
	var navigator = {
	
	  // config
	  //  - url: the url to push
	  //  - animated: this configuration item is native only
	  //  callback is not currently supported
	  push: function push(config, callbackId) {
	    window.location.href = "?page="+config.url;
	    this.sender.performCallback(callbackId);
	  },
	
	  // config
	  //  - animated: this configuration item is native only
	  //  callback is note currently supported
	  pop: function pop(config, callbackId) {
	    window.history.back();
	    this.sender.performCallback(callbackId);
	  }
	
	};
	
	navigator._meta = {
	  navigator: [{
	    name: 'push',
	    args: ['object', 'function']
	  }, {
	    name: 'pop',
	    args: ['object', 'function']
	  }]
	};
	
	module.exports = navigator;

/***/ },
/* 191 */
/***/ function(module, exports) {

	"use strict";
	
	typeof window === 'undefined' && (window = { ctrl: {}, lib: {} });!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function (a, b) {
	  function c(a) {
	    Object.defineProperty(this, "val", { value: a.toString(), enumerable: !0 }), this.gt = function (a) {
	      return c.compare(this, a) > 0;
	    }, this.gte = function (a) {
	      return c.compare(this, a) >= 0;
	    }, this.lt = function (a) {
	      return c.compare(this, a) < 0;
	    }, this.lte = function (a) {
	      return c.compare(this, a) <= 0;
	    }, this.eq = function (a) {
	      return 0 === c.compare(this, a);
	    };
	  }b.env = b.env || {}, c.prototype.toString = function () {
	    return this.val;
	  }, c.prototype.valueOf = function () {
	    for (var a = this.val.split("."), b = [], c = 0; c < a.length; c++) {
	      var d = parseInt(a[c], 10);isNaN(d) && (d = 0);var e = d.toString();e.length < 5 && (e = Array(6 - e.length).join("0") + e), b.push(e), 1 === b.length && b.push(".");
	    }return parseFloat(b.join(""));
	  }, c.compare = function (a, b) {
	    a = a.toString().split("."), b = b.toString().split(".");for (var c = 0; c < a.length || c < b.length; c++) {
	      var d = parseInt(a[c], 10),
	          e = parseInt(b[c], 10);if (window.isNaN(d) && (d = 0), window.isNaN(e) && (e = 0), e > d) return -1;if (d > e) return 1;
	    }return 0;
	  }, b.version = function (a) {
	    return new c(a);
	  };
	}(window, window.lib || (window.lib = {})), function (a, b) {
	  b.env = b.env || {};var c = a.location.search.replace(/^\?/, "");if (b.env.params = {}, c) for (var d = c.split("&"), e = 0; e < d.length; e++) {
	    d[e] = d[e].split("=");try {
	      b.env.params[d[e][0]] = decodeURIComponent(d[e][1]);
	    } catch (f) {
	      b.env.params[d[e][0]] = d[e][1];
	    }
	  }
	}(window, window.lib || (window.lib = {})), function (a, b) {
	  b.env = b.env || {};var c,
	      d = a.navigator.userAgent;if (c = d.match(/Windows\sPhone\s(?:OS\s)?([\d\.]+)/)) b.env.os = { name: "Windows Phone", isWindowsPhone: !0, version: c[1] };else if (d.match(/Safari/) && (c = d.match(/Android[\s\/]([\d\.]+)/))) b.env.os = { version: c[1] }, d.match(/Mobile\s+Safari/) ? (b.env.os.name = "Android", b.env.os.isAndroid = !0) : (b.env.os.name = "AndroidPad", b.env.os.isAndroidPad = !0);else if (c = d.match(/(iPhone|iPad|iPod)/)) {
	    var e = c[1];c = d.match(/OS ([\d_\.]+) like Mac OS X/), b.env.os = { name: e, isIPhone: "iPhone" === e || "iPod" === e, isIPad: "iPad" === e, isIOS: !0, version: c[1].split("_").join(".") };
	  } else b.env.os = { name: "unknown", version: "0.0.0" };b.version && (b.env.os.version = b.version(b.env.os.version));
	}(window, window.lib || (window.lib = {})), function (a, b) {
	  b.env = b.env || {};var c,
	      d = a.navigator.userAgent;(c = d.match(/(?:UCWEB|UCBrowser\/)([\d\.]+)/)) ? b.env.browser = { name: "UC", isUC: !0, version: c[1] } : (c = d.match(/MQQBrowser\/([\d\.]+)/)) ? b.env.browser = { name: "QQ", isQQ: !0, version: c[1] } : (c = d.match(/Firefox\/([\d\.]+)/)) ? b.env.browser = { name: "Firefox", isFirefox: !0, version: c[1] } : (c = d.match(/MSIE\s([\d\.]+)/)) || (c = d.match(/IEMobile\/([\d\.]+)/)) ? (b.env.browser = { version: c[1] }, d.match(/IEMobile/) ? (b.env.browser.name = "IEMobile", b.env.browser.isIEMobile = !0) : (b.env.browser.name = "IE", b.env.browser.isIE = !0), d.match(/Android|iPhone/) && (b.env.browser.isIELikeWebkit = !0)) : (c = d.match(/(?:Chrome|CriOS)\/([\d\.]+)/)) ? (b.env.browser = { name: "Chrome", isChrome: !0, version: c[1] }, d.match(/Version\/[\d+\.]+\s*Chrome/) && (b.env.browser.name = "Chrome Webview", b.env.browser.isWebview = !0)) : d.match(/Safari/) && (c = d.match(/Android[\s\/]([\d\.]+)/)) ? b.env.browser = { name: "Android", isAndroid: !0, version: c[1] } : d.match(/iPhone|iPad|iPod/) ? d.match(/Safari/) ? (c = d.match(/Version\/([\d\.]+)/), b.env.browser = { name: "Safari", isSafari: !0, version: c[1] }) : (c = d.match(/OS ([\d_\.]+) like Mac OS X/), b.env.browser = { name: "iOS Webview", isWebview: !0, version: c[1].replace(/\_/g, ".") }) : b.env.browser = { name: "unknown", version: "0.0.0" }, b.version && (b.env.browser.version = b.version(b.env.browser.version));
	}(window, window.lib || (window.lib = {})), function (a, b) {
	  b.env = b.env || {};var c = a.navigator.userAgent;c.match(/Weibo/i) ? b.env.thirdapp = { appname: "Weibo", isWeibo: !0 } : c.match(/MicroMessenger/i) ? b.env.thirdapp = { appname: "Weixin", isWeixin: !0 } : b.env.thirdapp = !1;
	}(window, window.lib || (window.lib = {})), function (a, b) {
	  b.env = b.env || {};var c,
	      d,
	      e = a.navigator.userAgent;(d = e.match(/WindVane[\/\s]([\d\.\_]+)/)) && (c = d[1]);var f = !1,
	      g = "",
	      h = "",
	      i = "";(d = e.match(/AliApp\(([A-Z\-]+)\/([\d\.]+)\)/i)) && (f = !0, g = d[1], i = d[2], h = g.indexOf("-PD") > 0 ? b.env.os.isIOS ? "iPad" : b.env.os.isAndroid ? "AndroidPad" : b.env.os.name : b.env.os.name), !g && e.indexOf("TBIOS") > 0 && (g = "TB"), f ? b.env.aliapp = { windvane: b.version(c || "0.0.0"), appname: g || "unkown", version: b.version(i || "0.0.0"), platform: h || b.env.os.name } : b.env.aliapp = !1, b.env.taobaoApp = b.env.aliapp;
	}(window, window.lib || (window.lib = {}));;module.exports = window.lib['env'];

/***/ },
/* 192 */
/***/ function(module, exports) {

	'use strict';
	
	var storage = {
	
	  // config
	  //  - url: the url to push
	  //  - animated: this configuration item is native only
	  //  callback is not currently supported
	  setItem: function setItem(config, callbackId) {
	  },
	
	  // config
	  //  - animated: this configuration item is native only
	  //  callback is note currently supported
	  getItem: function getItem(config, callbackId) {
	  },
	  getAllKeys:function getAllKeys(obj,callbackId){
		  
	  }
	
	};
	
	storage._meta = {
			storage: [{
	    name: 'setItem',
	    args: ['object', 'function']
	  }, {
	    name: 'getItem',
	    args: ['object', 'function']
	  }, {
		    name: 'getAllKeys',
		    args: ['object', 'function']
		  }]
	};
	
	module.exports = storage;

/***/ }
/******/ ]);