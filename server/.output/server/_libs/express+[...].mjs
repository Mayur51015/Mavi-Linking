import { r as __require, t as __commonJSMin } from "../_runtime.mjs";
import { a as require_unpipe, c as require_statuses, d as require_depd, i as require_on_finished, l as require_setprototypeof, n as require_side_channel, o as require_destroy, r as require_type_is, s as require_http_errors, t as require_body_parser, u as require_content_type } from "./body-parser+[...].mjs";
import { c as require_ms, s as require_src } from "./@workflow/core+[...].mjs";
import { t as require_accepts } from "./accepts+[...].mjs";
import { t as require_encodeurl } from "./encodeurl.mjs";
import { t as require_escape_html } from "./escape-html.mjs";
import { t as require_array_flatten } from "./array-flatten.mjs";
import { n as require_safe_buffer, t as require_content_disposition } from "./content-disposition+[...].mjs";
import { t as require_etag } from "./etag.mjs";
import { t as require_cookie_signature } from "./cookie-signature.mjs";
import { t as require_cookie } from "./cookie.mjs";
//#region node_modules/merge-descriptors/index.js
/*!
* merge-descriptors
* Copyright(c) 2014 Jonathan Ong
* Copyright(c) 2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_merge_descriptors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module exports.
	* @public
	*/
	module.exports = merge;
	/**
	* Module variables.
	* @private
	*/
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* Merge the property descriptors of `src` into `dest`
	*
	* @param {object} dest Object to add descriptors to
	* @param {object} src Object to clone descriptors from
	* @param {boolean} [redefine=true] Redefine `dest` properties with `src` properties
	* @returns {object} Reference to dest
	* @public
	*/
	function merge(dest, src, redefine) {
		if (!dest) throw new TypeError("argument dest is required");
		if (!src) throw new TypeError("argument src is required");
		if (redefine === void 0) redefine = true;
		Object.getOwnPropertyNames(src).forEach(function forEachOwnPropertyName(name) {
			if (!redefine && hasOwnProperty.call(dest, name)) return;
			Object.defineProperty(dest, name, Object.getOwnPropertyDescriptor(src, name));
		});
		return dest;
	}
}));
//#endregion
//#region node_modules/parseurl/index.js
/*!
* parseurl
* Copyright(c) 2014 Jonathan Ong
* Copyright(c) 2014-2017 Douglas Christopher Wilson
* MIT Licensed
*/
var require_parseurl = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var url$1 = __require("url");
	var parse = url$1.parse;
	var Url = url$1.Url;
	/**
	* Module exports.
	* @public
	*/
	module.exports = parseurl;
	module.exports.original = originalurl;
	/**
	* Parse the `req` url with memoization.
	*
	* @param {ServerRequest} req
	* @return {Object}
	* @public
	*/
	function parseurl(req) {
		var url = req.url;
		if (url === void 0) return;
		var parsed = req._parsedUrl;
		if (fresh(url, parsed)) return parsed;
		parsed = fastparse(url);
		parsed._raw = url;
		return req._parsedUrl = parsed;
	}
	/**
	* Parse the `req` original url with fallback and memoization.
	*
	* @param {ServerRequest} req
	* @return {Object}
	* @public
	*/
	function originalurl(req) {
		var url = req.originalUrl;
		if (typeof url !== "string") return parseurl(req);
		var parsed = req._parsedOriginalUrl;
		if (fresh(url, parsed)) return parsed;
		parsed = fastparse(url);
		parsed._raw = url;
		return req._parsedOriginalUrl = parsed;
	}
	/**
	* Parse the `str` url with fast-path short-cut.
	*
	* @param {string} str
	* @return {Object}
	* @private
	*/
	function fastparse(str) {
		if (typeof str !== "string" || str.charCodeAt(0) !== 47) return parse(str);
		var pathname = str;
		var query = null;
		var search = null;
		for (var i = 1; i < str.length; i++) switch (str.charCodeAt(i)) {
			case 63:
				if (search === null) {
					pathname = str.substring(0, i);
					query = str.substring(i + 1);
					search = str.substring(i);
				}
				break;
			case 9:
			case 10:
			case 12:
			case 13:
			case 32:
			case 35:
			case 160:
			case 65279: return parse(str);
		}
		var url = Url !== void 0 ? new Url() : {};
		url.path = str;
		url.href = str;
		url.pathname = pathname;
		if (search !== null) {
			url.query = query;
			url.search = search;
		}
		return url;
	}
	/**
	* Determine if parsed is still fresh for url.
	*
	* @param {string} url
	* @param {object} parsedUrl
	* @return {boolean}
	* @private
	*/
	function fresh(url, parsedUrl) {
		return typeof parsedUrl === "object" && parsedUrl !== null && (Url === void 0 || parsedUrl instanceof Url) && parsedUrl._raw === url;
	}
}));
//#endregion
//#region node_modules/finalhandler/index.js
/*!
* finalhandler
* Copyright(c) 2014-2022 Douglas Christopher Wilson
* MIT Licensed
*/
var require_finalhandler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var debug = require_src()("finalhandler");
	var encodeUrl = require_encodeurl();
	var escapeHtml = require_escape_html();
	var onFinished = require_on_finished();
	var parseUrl = require_parseurl();
	var statuses = require_statuses();
	var unpipe = require_unpipe();
	/**
	* Module variables.
	* @private
	*/
	var DOUBLE_SPACE_REGEXP = /\x20{2}/g;
	var NEWLINE_REGEXP = /\n/g;
	/* istanbul ignore next */
	var defer = typeof setImmediate === "function" ? setImmediate : function(fn) {
		process.nextTick(fn.bind.apply(fn, arguments));
	};
	var isFinished = onFinished.isFinished;
	/**
	* Create a minimal HTML document.
	*
	* @param {string} message
	* @private
	*/
	function createHtmlDocument(message) {
		return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>" + escapeHtml(message).replace(NEWLINE_REGEXP, "<br>").replace(DOUBLE_SPACE_REGEXP, " &nbsp;") + "</pre>\n</body>\n</html>\n";
	}
	/**
	* Module exports.
	* @public
	*/
	module.exports = finalhandler;
	/**
	* Create a function to handle the final response.
	*
	* @param {Request} req
	* @param {Response} res
	* @param {Object} [options]
	* @return {Function}
	* @public
	*/
	function finalhandler(req, res, options) {
		var opts = options || {};
		var env = opts.env || process.env.NODE_ENV || "development";
		var onerror = opts.onerror;
		return function(err) {
			var headers;
			var msg;
			var status;
			if (!err && headersSent(res)) {
				debug("cannot 404 after headers sent");
				return;
			}
			if (err) {
				status = getErrorStatusCode(err);
				if (status === void 0) status = getResponseStatusCode(res);
				else headers = getErrorHeaders(err);
				msg = getErrorMessage(err, status, env);
			} else {
				status = 404;
				msg = "Cannot " + req.method + " " + encodeUrl(getResourceName(req));
			}
			debug("default %s", status);
			if (err && onerror) defer(onerror, err, req, res);
			if (headersSent(res)) {
				debug("cannot %d after headers sent", status);
				if (req.socket) req.socket.destroy();
				return;
			}
			send(req, res, status, headers, msg);
		};
	}
	/**
	* Get headers from Error object.
	*
	* @param {Error} err
	* @return {object}
	* @private
	*/
	function getErrorHeaders(err) {
		if (!err.headers || typeof err.headers !== "object") return;
		var headers = Object.create(null);
		var keys = Object.keys(err.headers);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			headers[key] = err.headers[key];
		}
		return headers;
	}
	/**
	* Get message from Error object, fallback to status message.
	*
	* @param {Error} err
	* @param {number} status
	* @param {string} env
	* @return {string}
	* @private
	*/
	function getErrorMessage(err, status, env) {
		var msg;
		if (env !== "production") {
			msg = err.stack;
			if (!msg && typeof err.toString === "function") msg = err.toString();
		}
		return msg || statuses.message[status];
	}
	/**
	* Get status code from Error object.
	*
	* @param {Error} err
	* @return {number}
	* @private
	*/
	function getErrorStatusCode(err) {
		if (typeof err.status === "number" && err.status >= 400 && err.status < 600) return err.status;
		if (typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600) return err.statusCode;
	}
	/**
	* Get resource name for the request.
	*
	* This is typically just the original pathname of the request
	* but will fallback to "resource" is that cannot be determined.
	*
	* @param {IncomingMessage} req
	* @return {string}
	* @private
	*/
	function getResourceName(req) {
		try {
			return parseUrl.original(req).pathname;
		} catch (e) {
			return "resource";
		}
	}
	/**
	* Get status code from response.
	*
	* @param {OutgoingMessage} res
	* @return {number}
	* @private
	*/
	function getResponseStatusCode(res) {
		var status = res.statusCode;
		if (typeof status !== "number" || status < 400 || status > 599) status = 500;
		return status;
	}
	/**
	* Determine if the response headers have been sent.
	*
	* @param {object} res
	* @returns {boolean}
	* @private
	*/
	function headersSent(res) {
		return typeof res.headersSent !== "boolean" ? Boolean(res._header) : res.headersSent;
	}
	/**
	* Send response.
	*
	* @param {IncomingMessage} req
	* @param {OutgoingMessage} res
	* @param {number} status
	* @param {object} headers
	* @param {string} message
	* @private
	*/
	function send(req, res, status, headers, message) {
		function write() {
			var body = createHtmlDocument(message);
			res.statusCode = status;
			if (req.httpVersionMajor < 2) res.statusMessage = statuses.message[status];
			res.removeHeader("Content-Encoding");
			res.removeHeader("Content-Language");
			res.removeHeader("Content-Range");
			setHeaders(res, headers);
			res.setHeader("Content-Security-Policy", "default-src 'none'");
			res.setHeader("X-Content-Type-Options", "nosniff");
			res.setHeader("Content-Type", "text/html; charset=utf-8");
			res.setHeader("Content-Length", Buffer.byteLength(body, "utf8"));
			if (req.method === "HEAD") {
				res.end();
				return;
			}
			res.end(body, "utf8");
		}
		if (isFinished(req)) {
			write();
			return;
		}
		unpipe(req);
		onFinished(req, write);
		req.resume();
	}
	/**
	* Set response headers from an object.
	*
	* @param {OutgoingMessage} res
	* @param {object} headers
	* @private
	*/
	function setHeaders(res, headers) {
		if (!headers) return;
		var keys = Object.keys(headers);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			res.setHeader(key, headers[key]);
		}
	}
}));
//#endregion
//#region node_modules/path-to-regexp/index.js
var require_path_to_regexp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Expose `pathToRegexp`.
	*/
	module.exports = pathToRegexp;
	/**
	* Match matching groups in a regular expression.
	*/
	var MATCHING_GROUP_REGEXP = /\\.|\((?:\?<(.*?)>)?(?!\?)/g;
	/**
	* Normalize the given path string,
	* returning a regular expression.
	*
	* An empty array should be passed,
	* which will contain the placeholder
	* key names. For example "/user/:id" will
	* then contain ["id"].
	*
	* @param  {String|RegExp|Array} path
	* @param  {Array} keys
	* @param  {Object} options
	* @return {RegExp}
	* @api private
	*/
	function pathToRegexp(path, keys, options) {
		options = options || {};
		keys = keys || [];
		var strict = options.strict;
		var end = options.end !== false;
		var flags = options.sensitive ? "" : "i";
		var lookahead = options.lookahead !== false;
		var extraOffset = 0;
		var keysOffset = keys.length;
		var i = 0;
		var name = 0;
		var pos = 0;
		var backtrack = "";
		var m;
		if (path instanceof RegExp) {
			while (m = MATCHING_GROUP_REGEXP.exec(path.source)) {
				if (m[0][0] === "\\") continue;
				keys.push({
					name: m[1] || name++,
					optional: false,
					offset: m.index
				});
			}
			return path;
		}
		if (Array.isArray(path)) {
			path = path.map(function(value) {
				return pathToRegexp(value, keys, options).source;
			});
			return new RegExp(path.join("|"), flags);
		}
		if (typeof path !== "string") throw new TypeError("path must be a string, array of strings, or regular expression");
		path = path.replace(/\\.|(\/)?(\.)?:(\w+)(\(.*?\))?(\*)?(\?)?|[.*]|\/\(/g, function(match, slash, format, key, capture, star, optional, offset) {
			if (match[0] === "\\") {
				backtrack += match;
				pos += 2;
				return match;
			}
			if (match === ".") {
				backtrack += "\\.";
				extraOffset += 1;
				pos += 1;
				return "\\.";
			}
			if (slash || format) backtrack = "";
			else backtrack += path.slice(pos, offset);
			pos = offset + match.length;
			if (match === "*") {
				backtrack = "";
				extraOffset += 3;
				return "(.*)";
			}
			if (match === "/(") {
				backtrack += "/";
				extraOffset += 2;
				return "/(?:";
			}
			slash = slash || "";
			format = format ? "\\." : "";
			optional = optional || "";
			capture = capture ? capture.replace(/\\.|\*/, function(m) {
				return m === "*" ? "(.*)" : m;
			}) : backtrack ? "((?:(?!/|" + backtrack + ").)+?)" : "([^/" + format + "]+?)";
			keys.push({
				name: key,
				optional: !!optional,
				offset: offset + extraOffset
			});
			var result = "(?:" + format + slash + capture + (star ? "((?:[/" + format + "].+?)?)" : "") + ")" + optional;
			backtrack = "";
			extraOffset += result.length - match.length;
			return result;
		});
		while (m = MATCHING_GROUP_REGEXP.exec(path)) {
			if (m[0][0] === "\\") continue;
			if (keysOffset + i === keys.length || keys[keysOffset + i].offset > m.index) keys.splice(keysOffset + i, 0, {
				name: name++,
				optional: false,
				offset: m.index
			});
			i++;
		}
		path += strict ? "" : path[path.length - 1] === "/" ? "?" : "/?";
		if (end) path += "$";
		else if (path[path.length - 1] !== "/") path += lookahead ? "(?=/|$)" : "(?:/|$)";
		return new RegExp("^" + path, flags);
	}
}));
//#endregion
//#region node_modules/express/lib/router/layer.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_layer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var pathRegexp = require_path_to_regexp();
	var debug = require_src()("express:router:layer");
	/**
	* Module variables.
	* @private
	*/
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* Module exports.
	* @public
	*/
	module.exports = Layer;
	function Layer(path, options, fn) {
		if (!(this instanceof Layer)) return new Layer(path, options, fn);
		debug("new %o", path);
		var opts = options || {};
		this.handle = fn;
		this.name = fn.name || "<anonymous>";
		this.params = void 0;
		this.path = void 0;
		this.regexp = pathRegexp(path, this.keys = [], opts);
		this.regexp.fast_star = path === "*";
		this.regexp.fast_slash = path === "/" && opts.end === false;
	}
	/**
	* Handle the error for the layer.
	*
	* @param {Error} error
	* @param {Request} req
	* @param {Response} res
	* @param {function} next
	* @api private
	*/
	Layer.prototype.handle_error = function handle_error(error, req, res, next) {
		var fn = this.handle;
		if (fn.length !== 4) return next(error);
		try {
			fn(error, req, res, next);
		} catch (err) {
			next(err);
		}
	};
	/**
	* Handle the request for the layer.
	*
	* @param {Request} req
	* @param {Response} res
	* @param {function} next
	* @api private
	*/
	Layer.prototype.handle_request = function handle(req, res, next) {
		var fn = this.handle;
		if (fn.length > 3) return next();
		try {
			fn(req, res, next);
		} catch (err) {
			next(err);
		}
	};
	/**
	* Check if this route matches `path`, if so
	* populate `.params`.
	*
	* @param {String} path
	* @return {Boolean}
	* @api private
	*/
	Layer.prototype.match = function match(path) {
		var match;
		if (path != null) {
			if (this.regexp.fast_slash) {
				this.params = {};
				this.path = "";
				return true;
			}
			if (this.regexp.fast_star) {
				this.params = { "0": decode_param(path) };
				this.path = path;
				return true;
			}
			match = this.regexp.exec(path);
		}
		if (!match) {
			this.params = void 0;
			this.path = void 0;
			return false;
		}
		this.params = {};
		this.path = match[0];
		var keys = this.keys;
		var params = this.params;
		for (var i = 1; i < match.length; i++) {
			var prop = keys[i - 1].name;
			var val = decode_param(match[i]);
			if (val !== void 0 || !hasOwnProperty.call(params, prop)) params[prop] = val;
		}
		return true;
	};
	/**
	* Decode param value.
	*
	* @param {string} val
	* @return {string}
	* @private
	*/
	function decode_param(val) {
		if (typeof val !== "string" || val.length === 0) return val;
		try {
			return decodeURIComponent(val);
		} catch (err) {
			if (err instanceof URIError) {
				err.message = "Failed to decode param '" + val + "'";
				err.status = err.statusCode = 400;
			}
			throw err;
		}
	}
}));
//#endregion
//#region node_modules/methods/index.js
/*!
* methods
* Copyright(c) 2013-2014 TJ Holowaychuk
* Copyright(c) 2015-2016 Douglas Christopher Wilson
* MIT Licensed
*/
var require_methods = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var http$3 = __require("http");
	/**
	* Module exports.
	* @public
	*/
	module.exports = getCurrentNodeMethods() || getBasicNodeMethods();
	/**
	* Get the current Node.js methods.
	* @private
	*/
	function getCurrentNodeMethods() {
		return http$3.METHODS && http$3.METHODS.map(function lowerCaseMethod(method) {
			return method.toLowerCase();
		});
	}
	/**
	* Get the "basic" Node.js methods, a snapshot from Node.js 0.10.
	* @private
	*/
	function getBasicNodeMethods() {
		return [
			"get",
			"post",
			"put",
			"head",
			"delete",
			"options",
			"trace",
			"copy",
			"lock",
			"mkcol",
			"move",
			"purge",
			"propfind",
			"proppatch",
			"unlock",
			"report",
			"mkactivity",
			"checkout",
			"merge",
			"m-search",
			"notify",
			"subscribe",
			"unsubscribe",
			"patch",
			"search",
			"connect"
		];
	}
}));
//#endregion
//#region node_modules/express/lib/router/route.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_route = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var debug = require_src()("express:router:route");
	var flatten = require_array_flatten();
	var Layer = require_layer();
	var methods = require_methods();
	/**
	* Module variables.
	* @private
	*/
	var slice = Array.prototype.slice;
	var toString = Object.prototype.toString;
	/**
	* Module exports.
	* @public
	*/
	module.exports = Route;
	/**
	* Initialize `Route` with the given `path`,
	*
	* @param {String} path
	* @public
	*/
	function Route(path) {
		this.path = path;
		this.stack = [];
		debug("new %o", path);
		this.methods = {};
	}
	/**
	* Determine if the route handles a given method.
	* @private
	*/
	Route.prototype._handles_method = function _handles_method(method) {
		if (this.methods._all) return true;
		var name = typeof method === "string" ? method.toLowerCase() : method;
		if (name === "head" && !this.methods["head"]) name = "get";
		return Boolean(this.methods[name]);
	};
	/**
	* @return {Array} supported HTTP methods
	* @private
	*/
	Route.prototype._options = function _options() {
		var methods = Object.keys(this.methods);
		if (this.methods.get && !this.methods.head) methods.push("head");
		for (var i = 0; i < methods.length; i++) methods[i] = methods[i].toUpperCase();
		return methods;
	};
	/**
	* dispatch req, res into this route
	* @private
	*/
	Route.prototype.dispatch = function dispatch(req, res, done) {
		var idx = 0;
		var stack = this.stack;
		var sync = 0;
		if (stack.length === 0) return done();
		var method = typeof req.method === "string" ? req.method.toLowerCase() : req.method;
		if (method === "head" && !this.methods["head"]) method = "get";
		req.route = this;
		next();
		function next(err) {
			if (err && err === "route") return done();
			if (err && err === "router") return done(err);
			if (++sync > 100) return setImmediate(next, err);
			var layer = stack[idx++];
			if (!layer) return done(err);
			if (layer.method && layer.method !== method) next(err);
			else if (err) layer.handle_error(err, req, res, next);
			else layer.handle_request(req, res, next);
			sync = 0;
		}
	};
	/**
	* Add a handler for all HTTP verbs to this route.
	*
	* Behaves just like middleware and can respond or call `next`
	* to continue processing.
	*
	* You can use multiple `.all` call to add multiple handlers.
	*
	*   function check_something(req, res, next){
	*     next();
	*   };
	*
	*   function validate_user(req, res, next){
	*     next();
	*   };
	*
	*   route
	*   .all(validate_user)
	*   .all(check_something)
	*   .get(function(req, res, next){
	*     res.send('hello world');
	*   });
	*
	* @param {function} handler
	* @return {Route} for chaining
	* @api public
	*/
	Route.prototype.all = function all() {
		var handles = flatten(slice.call(arguments));
		for (var i = 0; i < handles.length; i++) {
			var handle = handles[i];
			if (typeof handle !== "function") {
				var msg = "Route.all() requires a callback function but got a " + toString.call(handle);
				throw new TypeError(msg);
			}
			var layer = Layer("/", {}, handle);
			layer.method = void 0;
			this.methods._all = true;
			this.stack.push(layer);
		}
		return this;
	};
	methods.forEach(function(method) {
		Route.prototype[method] = function() {
			var handles = flatten(slice.call(arguments));
			for (var i = 0; i < handles.length; i++) {
				var handle = handles[i];
				if (typeof handle !== "function") {
					var type = toString.call(handle);
					var msg = "Route." + method + "() requires a callback function but got a " + type;
					throw new Error(msg);
				}
				debug("%s %o", method, this.path);
				var layer = Layer("/", {}, handle);
				layer.method = method;
				this.methods[method] = true;
				this.stack.push(layer);
			}
			return this;
		};
	});
}));
//#endregion
//#region node_modules/utils-merge/index.js
var require_utils_merge = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Merge object b with object a.
	*
	*     var a = { foo: 'bar' }
	*       , b = { bar: 'baz' };
	*
	*     merge(a, b);
	*     // => { foo: 'bar', bar: 'baz' }
	*
	* @param {Object} a
	* @param {Object} b
	* @return {Object}
	* @api public
	*/
	exports = module.exports = function(a, b) {
		if (a && b) for (var key in b) a[key] = b[key];
		return a;
	};
}));
//#endregion
//#region node_modules/express/lib/router/index.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_router = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var Route = require_route();
	var Layer = require_layer();
	var methods = require_methods();
	var mixin = require_utils_merge();
	var debug = require_src()("express:router");
	var deprecate = require_depd()("express");
	var flatten = require_array_flatten();
	var parseUrl = require_parseurl();
	var setPrototypeOf = require_setprototypeof();
	/**
	* Module variables.
	* @private
	*/
	var objectRegExp = /^\[object (\S+)\]$/;
	var slice = Array.prototype.slice;
	var toString = Object.prototype.toString;
	/**
	* Initialize a new `Router` with the given `options`.
	*
	* @param {Object} [options]
	* @return {Router} which is a callable function
	* @public
	*/
	var proto = module.exports = function(options) {
		var opts = options || {};
		function router(req, res, next) {
			router.handle(req, res, next);
		}
		setPrototypeOf(router, proto);
		router.params = {};
		router._params = [];
		router.caseSensitive = opts.caseSensitive;
		router.mergeParams = opts.mergeParams;
		router.strict = opts.strict;
		router.stack = [];
		return router;
	};
	/**
	* Map the given param placeholder `name`(s) to the given callback.
	*
	* Parameter mapping is used to provide pre-conditions to routes
	* which use normalized placeholders. For example a _:user_id_ parameter
	* could automatically load a user's information from the database without
	* any additional code,
	*
	* The callback uses the same signature as middleware, the only difference
	* being that the value of the placeholder is passed, in this case the _id_
	* of the user. Once the `next()` function is invoked, just like middleware
	* it will continue on to execute the route, or subsequent parameter functions.
	*
	* Just like in middleware, you must either respond to the request or call next
	* to avoid stalling the request.
	*
	*  app.param('user_id', function(req, res, next, id){
	*    User.find(id, function(err, user){
	*      if (err) {
	*        return next(err);
	*      } else if (!user) {
	*        return next(new Error('failed to load user'));
	*      }
	*      req.user = user;
	*      next();
	*    });
	*  });
	*
	* @param {String} name
	* @param {Function} fn
	* @return {app} for chaining
	* @public
	*/
	proto.param = function param(name, fn) {
		if (typeof name === "function") {
			deprecate("router.param(fn): Refactor to use path params");
			this._params.push(name);
			return;
		}
		var params = this._params;
		var len = params.length;
		var ret;
		if (name[0] === ":") {
			deprecate("router.param(" + JSON.stringify(name) + ", fn): Use router.param(" + JSON.stringify(name.slice(1)) + ", fn) instead");
			name = name.slice(1);
		}
		for (var i = 0; i < len; ++i) if (ret = params[i](name, fn)) fn = ret;
		if ("function" !== typeof fn) throw new Error("invalid param() call for " + name + ", got " + fn);
		(this.params[name] = this.params[name] || []).push(fn);
		return this;
	};
	/**
	* Dispatch a req, res into the router.
	* @private
	*/
	proto.handle = function handle(req, res, out) {
		var self = this;
		debug("dispatching %s %s", req.method, req.url);
		var idx = 0;
		var protohost = getProtohost(req.url) || "";
		var removed = "";
		var slashAdded = false;
		var sync = 0;
		var paramcalled = {};
		var options = [];
		var stack = self.stack;
		var parentParams = req.params;
		var parentUrl = req.baseUrl || "";
		var done = restore(out, req, "baseUrl", "next", "params");
		req.next = next;
		if (req.method === "OPTIONS") done = wrap(done, function(old, err) {
			if (err || options.length === 0) return old(err);
			sendOptionsResponse(res, options, old);
		});
		req.baseUrl = parentUrl;
		req.originalUrl = req.originalUrl || req.url;
		next();
		function next(err) {
			var layerError = err === "route" ? null : err;
			if (slashAdded) {
				req.url = req.url.slice(1);
				slashAdded = false;
			}
			if (removed.length !== 0) {
				req.baseUrl = parentUrl;
				req.url = protohost + removed + req.url.slice(protohost.length);
				removed = "";
			}
			if (layerError === "router") {
				setImmediate(done, null);
				return;
			}
			if (idx >= stack.length) {
				setImmediate(done, layerError);
				return;
			}
			if (++sync > 100) return setImmediate(next, err);
			var path = getPathname(req);
			if (path == null) return done(layerError);
			var layer;
			var match;
			var route;
			while (match !== true && idx < stack.length) {
				layer = stack[idx++];
				match = matchLayer(layer, path);
				route = layer.route;
				if (typeof match !== "boolean") layerError = layerError || match;
				if (match !== true) continue;
				if (!route) continue;
				if (layerError) {
					match = false;
					continue;
				}
				var method = req.method;
				var has_method = route._handles_method(method);
				if (!has_method && method === "OPTIONS") appendMethods(options, route._options());
				if (!has_method && method !== "HEAD") match = false;
			}
			if (match !== true) return done(layerError);
			if (route) req.route = route;
			req.params = self.mergeParams ? mergeParams(layer.params, parentParams) : layer.params;
			var layerPath = layer.path;
			self.process_params(layer, paramcalled, req, res, function(err) {
				if (err) next(layerError || err);
				else if (route) layer.handle_request(req, res, next);
				else trim_prefix(layer, layerError, layerPath, path);
				sync = 0;
			});
		}
		function trim_prefix(layer, layerError, layerPath, path) {
			if (layerPath.length !== 0) {
				if (layerPath !== path.slice(0, layerPath.length)) {
					next(layerError);
					return;
				}
				var c = path[layerPath.length];
				if (c && c !== "/" && c !== ".") return next(layerError);
				debug("trim prefix (%s) from url %s", layerPath, req.url);
				removed = layerPath;
				req.url = protohost + req.url.slice(protohost.length + removed.length);
				if (!protohost && req.url[0] !== "/") {
					req.url = "/" + req.url;
					slashAdded = true;
				}
				req.baseUrl = parentUrl + (removed[removed.length - 1] === "/" ? removed.substring(0, removed.length - 1) : removed);
			}
			debug("%s %s : %s", layer.name, layerPath, req.originalUrl);
			if (layerError) layer.handle_error(layerError, req, res, next);
			else layer.handle_request(req, res, next);
		}
	};
	/**
	* Process any parameters for the layer.
	* @private
	*/
	proto.process_params = function process_params(layer, called, req, res, done) {
		var params = this.params;
		var keys = layer.keys;
		if (!keys || keys.length === 0) return done();
		var i = 0;
		var name;
		var paramIndex = 0;
		var key;
		var paramVal;
		var paramCallbacks;
		var paramCalled;
		function param(err) {
			if (err) return done(err);
			if (i >= keys.length) return done();
			paramIndex = 0;
			key = keys[i++];
			name = key.name;
			paramVal = req.params[name];
			paramCallbacks = params[name];
			paramCalled = called[name];
			if (paramVal === void 0 || !paramCallbacks) return param();
			if (paramCalled && (paramCalled.match === paramVal || paramCalled.error && paramCalled.error !== "route")) {
				req.params[name] = paramCalled.value;
				return param(paramCalled.error);
			}
			called[name] = paramCalled = {
				error: null,
				match: paramVal,
				value: paramVal
			};
			paramCallback();
		}
		function paramCallback(err) {
			var fn = paramCallbacks[paramIndex++];
			paramCalled.value = req.params[key.name];
			if (err) {
				paramCalled.error = err;
				param(err);
				return;
			}
			if (!fn) return param();
			try {
				fn(req, res, paramCallback, paramVal, key.name);
			} catch (e) {
				paramCallback(e);
			}
		}
		param();
	};
	/**
	* Use the given middleware function, with optional path, defaulting to "/".
	*
	* Use (like `.all`) will run for any http METHOD, but it will not add
	* handlers for those methods so OPTIONS requests will not consider `.use`
	* functions even if they could respond.
	*
	* The other difference is that _route_ path is stripped and not visible
	* to the handler function. The main effect of this feature is that mounted
	* handlers can operate without any code changes regardless of the "prefix"
	* pathname.
	*
	* @public
	*/
	proto.use = function use(fn) {
		var offset = 0;
		var path = "/";
		if (typeof fn !== "function") {
			var arg = fn;
			while (Array.isArray(arg) && arg.length !== 0) arg = arg[0];
			if (typeof arg !== "function") {
				offset = 1;
				path = fn;
			}
		}
		var callbacks = flatten(slice.call(arguments, offset));
		if (callbacks.length === 0) throw new TypeError("Router.use() requires a middleware function");
		for (var i = 0; i < callbacks.length; i++) {
			var fn = callbacks[i];
			if (typeof fn !== "function") throw new TypeError("Router.use() requires a middleware function but got a " + gettype(fn));
			debug("use %o %s", path, fn.name || "<anonymous>");
			var layer = new Layer(path, {
				sensitive: this.caseSensitive,
				strict: false,
				end: false
			}, fn);
			layer.route = void 0;
			this.stack.push(layer);
		}
		return this;
	};
	/**
	* Create a new Route for the given path.
	*
	* Each route contains a separate middleware stack and VERB handlers.
	*
	* See the Route api documentation for details on adding handlers
	* and middleware to routes.
	*
	* @param {String} path
	* @return {Route}
	* @public
	*/
	proto.route = function route(path) {
		var route = new Route(path);
		var layer = new Layer(path, {
			sensitive: this.caseSensitive,
			strict: this.strict,
			end: true
		}, route.dispatch.bind(route));
		layer.route = route;
		this.stack.push(layer);
		return route;
	};
	methods.concat("all").forEach(function(method) {
		proto[method] = function(path) {
			var route = this.route(path);
			route[method].apply(route, slice.call(arguments, 1));
			return this;
		};
	});
	function appendMethods(list, addition) {
		for (var i = 0; i < addition.length; i++) {
			var method = addition[i];
			if (list.indexOf(method) === -1) list.push(method);
		}
	}
	function getPathname(req) {
		try {
			return parseUrl(req).pathname;
		} catch (err) {
			return;
		}
	}
	function getProtohost(url) {
		if (typeof url !== "string" || url.length === 0 || url[0] === "/") return;
		var searchIndex = url.indexOf("?");
		var pathLength = searchIndex !== -1 ? searchIndex : url.length;
		var fqdnIndex = url.slice(0, pathLength).indexOf("://");
		return fqdnIndex !== -1 ? url.substring(0, url.indexOf("/", 3 + fqdnIndex)) : void 0;
	}
	function gettype(obj) {
		var type = typeof obj;
		if (type !== "object") return type;
		return toString.call(obj).replace(objectRegExp, "$1");
	}
	/**
	* Match path to a layer.
	*
	* @param {Layer} layer
	* @param {string} path
	* @private
	*/
	function matchLayer(layer, path) {
		try {
			return layer.match(path);
		} catch (err) {
			return err;
		}
	}
	function mergeParams(params, parent) {
		if (typeof parent !== "object" || !parent) return params;
		var obj = mixin({}, parent);
		if (!(0 in params) || !(0 in parent)) return mixin(obj, params);
		var i = 0;
		var o = 0;
		while (i in params) i++;
		while (o in parent) o++;
		for (i--; i >= 0; i--) {
			params[i + o] = params[i];
			if (i < o) delete params[i];
		}
		return mixin(obj, params);
	}
	function restore(fn, obj) {
		var props = new Array(arguments.length - 2);
		var vals = new Array(arguments.length - 2);
		for (var i = 0; i < props.length; i++) {
			props[i] = arguments[i + 2];
			vals[i] = obj[props[i]];
		}
		return function() {
			for (var i = 0; i < props.length; i++) obj[props[i]] = vals[i];
			return fn.apply(this, arguments);
		};
	}
	function sendOptionsResponse(res, options, next) {
		try {
			var body = options.join(",");
			res.set("Allow", body);
			res.send(body);
		} catch (err) {
			next(err);
		}
	}
	function wrap(old, fn) {
		return function proxy() {
			var args = new Array(arguments.length + 1);
			args[0] = old;
			for (var i = 0, len = arguments.length; i < len; i++) args[i + 1] = arguments[i];
			fn.apply(this, args);
		};
	}
}));
//#endregion
//#region node_modules/express/lib/middleware/init.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_init = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Module dependencies.
	* @private
	*/
	var setPrototypeOf = require_setprototypeof();
	/**
	* Initialization middleware, exposing the
	* request and response to each other, as well
	* as defaulting the X-Powered-By header field.
	*
	* @param {Function} app
	* @return {Function}
	* @api private
	*/
	exports.init = function(app) {
		return function expressInit(req, res, next) {
			if (app.enabled("x-powered-by")) res.setHeader("X-Powered-By", "Express");
			req.res = res;
			res.req = req;
			req.next = next;
			setPrototypeOf(req, app.request);
			setPrototypeOf(res, app.response);
			res.locals = res.locals || Object.create(null);
			next();
		};
	};
}));
//#endregion
//#region node_modules/qs/lib/formats.js
var require_formats = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var replace = String.prototype.replace;
	var percentTwenties = /%20/g;
	var Format = {
		RFC1738: "RFC1738",
		RFC3986: "RFC3986"
	};
	module.exports = {
		"default": Format.RFC3986,
		formatters: {
			RFC1738: function(value) {
				return replace.call(value, percentTwenties, "+");
			},
			RFC3986: function(value) {
				return String(value);
			}
		},
		RFC1738: Format.RFC1738,
		RFC3986: Format.RFC3986
	};
}));
//#endregion
//#region node_modules/qs/lib/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var formats = require_formats();
	var getSideChannel = require_side_channel();
	var has = Object.prototype.hasOwnProperty;
	var isArray = Array.isArray;
	var overflowChannel = getSideChannel();
	var markOverflow = function markOverflow(obj, maxIndex) {
		overflowChannel.set(obj, maxIndex);
		return obj;
	};
	var isOverflow = function isOverflow(obj) {
		return overflowChannel.has(obj);
	};
	var getMaxIndex = function getMaxIndex(obj) {
		return overflowChannel.get(obj);
	};
	var setMaxIndex = function setMaxIndex(obj, maxIndex) {
		overflowChannel.set(obj, maxIndex);
	};
	var hexTable = function() {
		var array = [];
		for (var i = 0; i < 256; ++i) array[array.length] = "%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase();
		return array;
	}();
	var compactQueue = function compactQueue(queue) {
		while (queue.length > 1) {
			var item = queue.pop();
			var obj = item.obj[item.prop];
			if (isArray(obj)) {
				var compacted = [];
				for (var j = 0; j < obj.length; ++j) if (typeof obj[j] !== "undefined") compacted[compacted.length] = obj[j];
				item.obj[item.prop] = compacted;
			}
		}
	};
	var arrayToObject = function arrayToObject(source, options) {
		var obj = options && options.plainObjects ? { __proto__: null } : {};
		for (var i = 0; i < source.length; ++i) if (typeof source[i] !== "undefined") obj[i] = source[i];
		return obj;
	};
	var merge = function merge(target, source, options) {
		if (!source) return target;
		if (typeof source !== "object" && typeof source !== "function") {
			if (isArray(target)) {
				var nextIndex = target.length;
				if (options && typeof options.arrayLimit === "number" && nextIndex > options.arrayLimit) return markOverflow(arrayToObject(target.concat(source), options), nextIndex);
				target[nextIndex] = source;
			} else if (target && typeof target === "object") {
				if (isOverflow(target)) {
					var newIndex = getMaxIndex(target) + 1;
					target[newIndex] = source;
					setMaxIndex(target, newIndex);
				} else if (options && (options.plainObjects || options.allowPrototypes) || !has.call(Object.prototype, source)) target[source] = true;
			} else return [target, source];
			return target;
		}
		if (!target || typeof target !== "object") {
			if (isOverflow(source)) {
				var sourceKeys = Object.keys(source);
				var result = options && options.plainObjects ? {
					__proto__: null,
					0: target
				} : { 0: target };
				for (var m = 0; m < sourceKeys.length; m++) {
					var oldKey = parseInt(sourceKeys[m], 10);
					result[oldKey + 1] = source[sourceKeys[m]];
				}
				return markOverflow(result, getMaxIndex(source) + 1);
			}
			var combined = [target].concat(source);
			if (options && typeof options.arrayLimit === "number" && combined.length > options.arrayLimit) return markOverflow(arrayToObject(combined, options), combined.length - 1);
			return combined;
		}
		var mergeTarget = target;
		if (isArray(target) && !isArray(source)) mergeTarget = arrayToObject(target, options);
		if (isArray(target) && isArray(source)) {
			source.forEach(function(item, i) {
				if (has.call(target, i)) {
					var targetItem = target[i];
					if (targetItem && typeof targetItem === "object" && item && typeof item === "object") target[i] = merge(targetItem, item, options);
					else target[target.length] = item;
				} else target[i] = item;
			});
			return target;
		}
		return Object.keys(source).reduce(function(acc, key) {
			var value = source[key];
			if (has.call(acc, key)) acc[key] = merge(acc[key], value, options);
			else acc[key] = value;
			if (isOverflow(source) && !isOverflow(acc)) markOverflow(acc, getMaxIndex(source));
			if (isOverflow(acc)) {
				var keyNum = parseInt(key, 10);
				if (String(keyNum) === key && keyNum >= 0 && keyNum > getMaxIndex(acc)) setMaxIndex(acc, keyNum);
			}
			return acc;
		}, mergeTarget);
	};
	var assign = function assignSingleSource(target, source) {
		return Object.keys(source).reduce(function(acc, key) {
			acc[key] = source[key];
			return acc;
		}, target);
	};
	var decode = function(str, defaultDecoder, charset) {
		var strWithoutPlus = str.replace(/\+/g, " ");
		if (charset === "iso-8859-1") return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
		try {
			return decodeURIComponent(strWithoutPlus);
		} catch (e) {
			return strWithoutPlus;
		}
	};
	var limit = 1024;
	module.exports = {
		arrayToObject,
		assign,
		combine: function combine(a, b, arrayLimit, plainObjects) {
			if (isOverflow(a)) {
				var newIndex = getMaxIndex(a) + 1;
				a[newIndex] = b;
				setMaxIndex(a, newIndex);
				return a;
			}
			var result = [].concat(a, b);
			if (result.length > arrayLimit) return markOverflow(arrayToObject(result, { plainObjects }), result.length - 1);
			return result;
		},
		compact: function compact(value) {
			var queue = [{
				obj: { o: value },
				prop: "o"
			}];
			var refs = [];
			for (var i = 0; i < queue.length; ++i) {
				var item = queue[i];
				var obj = item.obj[item.prop];
				var keys = Object.keys(obj);
				for (var j = 0; j < keys.length; ++j) {
					var key = keys[j];
					var val = obj[key];
					if (typeof val === "object" && val !== null && refs.indexOf(val) === -1) {
						queue[queue.length] = {
							obj,
							prop: key
						};
						refs[refs.length] = val;
					}
				}
			}
			compactQueue(queue);
			return value;
		},
		decode,
		encode: function encode(str, defaultEncoder, charset, kind, format) {
			if (str.length === 0) return str;
			var string = str;
			if (typeof str === "symbol") string = Symbol.prototype.toString.call(str);
			else if (typeof str !== "string") string = String(str);
			if (charset === "iso-8859-1") return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
				return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
			});
			var out = "";
			for (var j = 0; j < string.length; j += limit) {
				var segment = string.length >= limit ? string.slice(j, j + limit) : string;
				var arr = [];
				for (var i = 0; i < segment.length; ++i) {
					var c = segment.charCodeAt(i);
					if (c === 45 || c === 46 || c === 95 || c === 126 || c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122 || format === formats.RFC1738 && (c === 40 || c === 41)) {
						arr[arr.length] = segment.charAt(i);
						continue;
					}
					if (c < 128) {
						arr[arr.length] = hexTable[c];
						continue;
					}
					if (c < 2048) {
						arr[arr.length] = hexTable[192 | c >> 6] + hexTable[128 | c & 63];
						continue;
					}
					if (c < 55296 || c >= 57344) {
						arr[arr.length] = hexTable[224 | c >> 12] + hexTable[128 | c >> 6 & 63] + hexTable[128 | c & 63];
						continue;
					}
					i += 1;
					c = 65536 + ((c & 1023) << 10 | segment.charCodeAt(i) & 1023);
					arr[arr.length] = hexTable[240 | c >> 18] + hexTable[128 | c >> 12 & 63] + hexTable[128 | c >> 6 & 63] + hexTable[128 | c & 63];
				}
				out += arr.join("");
			}
			return out;
		},
		isBuffer: function isBuffer(obj) {
			if (!obj || typeof obj !== "object") return false;
			return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
		},
		isOverflow,
		isRegExp: function isRegExp(obj) {
			return Object.prototype.toString.call(obj) === "[object RegExp]";
		},
		markOverflow,
		maybeMap: function maybeMap(val, fn) {
			if (isArray(val)) {
				var mapped = [];
				for (var i = 0; i < val.length; i += 1) mapped[mapped.length] = fn(val[i]);
				return mapped;
			}
			return fn(val);
		},
		merge
	};
}));
//#endregion
//#region node_modules/qs/lib/stringify.js
var require_stringify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getSideChannel = require_side_channel();
	var utils = require_utils$1();
	var formats = require_formats();
	var has = Object.prototype.hasOwnProperty;
	var arrayPrefixGenerators = {
		brackets: function brackets(prefix) {
			return prefix + "[]";
		},
		comma: "comma",
		indices: function indices(prefix, key) {
			return prefix + "[" + key + "]";
		},
		repeat: function repeat(prefix) {
			return prefix;
		}
	};
	var isArray = Array.isArray;
	var push = Array.prototype.push;
	var pushToArray = function(arr, valueOrArray) {
		push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
	};
	var toISO = Date.prototype.toISOString;
	var defaultFormat = formats["default"];
	var defaults = {
		addQueryPrefix: false,
		allowDots: false,
		allowEmptyArrays: false,
		arrayFormat: "indices",
		charset: "utf-8",
		charsetSentinel: false,
		commaRoundTrip: false,
		delimiter: "&",
		encode: true,
		encodeDotInKeys: false,
		encoder: utils.encode,
		encodeValuesOnly: false,
		filter: void 0,
		format: defaultFormat,
		formatter: formats.formatters[defaultFormat],
		indices: false,
		serializeDate: function serializeDate(date) {
			return toISO.call(date);
		},
		skipNulls: false,
		strictNullHandling: false
	};
	var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
		return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
	};
	var sentinel = {};
	var stringify = function stringify(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
		var obj = object;
		var tmpSc = sideChannel;
		var step = 0;
		var findFlag = false;
		while ((tmpSc = tmpSc.get(sentinel)) !== void 0 && !findFlag) {
			var pos = tmpSc.get(object);
			step += 1;
			if (typeof pos !== "undefined") if (pos === step) throw new RangeError("Cyclic object value");
			else findFlag = true;
			if (typeof tmpSc.get(sentinel) === "undefined") step = 0;
		}
		if (typeof filter === "function") obj = filter(prefix, obj);
		else if (obj instanceof Date) obj = serializeDate(obj);
		else if (generateArrayPrefix === "comma" && isArray(obj)) obj = utils.maybeMap(obj, function(value) {
			if (value instanceof Date) return serializeDate(value);
			return value;
		});
		if (obj === null) {
			if (strictNullHandling) return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, "key", format) : prefix;
			obj = "";
		}
		if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
			if (encoder) return [formatter(encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, "key", format)) + "=" + formatter(encoder(obj, defaults.encoder, charset, "value", format))];
			return [formatter(prefix) + "=" + formatter(String(obj))];
		}
		var values = [];
		if (typeof obj === "undefined") return values;
		var objKeys;
		if (generateArrayPrefix === "comma" && isArray(obj)) {
			if (encodeValuesOnly && encoder) obj = utils.maybeMap(obj, encoder);
			objKeys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
		} else if (isArray(filter)) objKeys = filter;
		else {
			var keys = Object.keys(obj);
			objKeys = sort ? keys.sort(sort) : keys;
		}
		var encodedPrefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
		var adjustedPrefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encodedPrefix + "[]" : encodedPrefix;
		if (allowEmptyArrays && isArray(obj) && obj.length === 0) return adjustedPrefix + "[]";
		for (var j = 0; j < objKeys.length; ++j) {
			var key = objKeys[j];
			var value = typeof key === "object" && key && typeof key.value !== "undefined" ? key.value : obj[key];
			if (skipNulls && value === null) continue;
			var encodedKey = allowDots && encodeDotInKeys ? String(key).replace(/\./g, "%2E") : String(key);
			var keyPrefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjustedPrefix, encodedKey) : adjustedPrefix : adjustedPrefix + (allowDots ? "." + encodedKey : "[" + encodedKey + "]");
			sideChannel.set(object, step);
			var valueSideChannel = getSideChannel();
			valueSideChannel.set(sentinel, sideChannel);
			pushToArray(values, stringify(value, keyPrefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, valueSideChannel));
		}
		return values;
	};
	var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
		if (!opts) return defaults;
		if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
		if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
		if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") throw new TypeError("Encoder has to be a function.");
		var charset = opts.charset || defaults.charset;
		if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
		var format = formats["default"];
		if (typeof opts.format !== "undefined") {
			if (!has.call(formats.formatters, opts.format)) throw new TypeError("Unknown format option provided.");
			format = opts.format;
		}
		var formatter = formats.formatters[format];
		var filter = defaults.filter;
		if (typeof opts.filter === "function" || isArray(opts.filter)) filter = opts.filter;
		var arrayFormat;
		if (opts.arrayFormat in arrayPrefixGenerators) arrayFormat = opts.arrayFormat;
		else if ("indices" in opts) arrayFormat = opts.indices ? "indices" : "repeat";
		else arrayFormat = defaults.arrayFormat;
		if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
		var allowDots = typeof opts.allowDots === "undefined" ? opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
		return {
			addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
			allowDots,
			allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
			arrayFormat,
			charset,
			charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
			commaRoundTrip: !!opts.commaRoundTrip,
			delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
			encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
			encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
			encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
			encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
			filter,
			format,
			formatter,
			serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
			skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
			sort: typeof opts.sort === "function" ? opts.sort : null,
			strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
		};
	};
	module.exports = function(object, opts) {
		var obj = object;
		var options = normalizeStringifyOptions(opts);
		var objKeys;
		var filter;
		if (typeof options.filter === "function") {
			filter = options.filter;
			obj = filter("", obj);
		} else if (isArray(options.filter)) {
			filter = options.filter;
			objKeys = filter;
		}
		var keys = [];
		if (typeof obj !== "object" || obj === null) return "";
		var generateArrayPrefix = arrayPrefixGenerators[options.arrayFormat];
		var commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
		if (!objKeys) objKeys = Object.keys(obj);
		if (options.sort) objKeys.sort(options.sort);
		var sideChannel = getSideChannel();
		for (var i = 0; i < objKeys.length; ++i) {
			var key = objKeys[i];
			var value = obj[key];
			if (options.skipNulls && value === null) continue;
			pushToArray(keys, stringify(value, key, generateArrayPrefix, commaRoundTrip, options.allowEmptyArrays, options.strictNullHandling, options.skipNulls, options.encodeDotInKeys, options.encode ? options.encoder : null, options.filter, options.sort, options.allowDots, options.serializeDate, options.format, options.formatter, options.encodeValuesOnly, options.charset, sideChannel));
		}
		var joined = keys.join(options.delimiter);
		var prefix = options.addQueryPrefix === true ? "?" : "";
		if (options.charsetSentinel) if (options.charset === "iso-8859-1") prefix += "utf8=%26%2310003%3B&";
		else prefix += "utf8=%E2%9C%93&";
		return joined.length > 0 ? prefix + joined : "";
	};
}));
//#endregion
//#region node_modules/qs/lib/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils$1();
	var has = Object.prototype.hasOwnProperty;
	var isArray = Array.isArray;
	var defaults = {
		allowDots: false,
		allowEmptyArrays: false,
		allowPrototypes: false,
		allowSparse: false,
		arrayLimit: 20,
		charset: "utf-8",
		charsetSentinel: false,
		comma: false,
		decodeDotInKeys: false,
		decoder: utils.decode,
		delimiter: "&",
		depth: 5,
		duplicates: "combine",
		ignoreQueryPrefix: false,
		interpretNumericEntities: false,
		parameterLimit: 1e3,
		parseArrays: true,
		plainObjects: false,
		strictDepth: false,
		strictNullHandling: false,
		throwOnLimitExceeded: false
	};
	var interpretNumericEntities = function(str) {
		return str.replace(/&#(\d+);/g, function($0, numberStr) {
			return String.fromCharCode(parseInt(numberStr, 10));
		});
	};
	var parseArrayValue = function(val, options, currentArrayLength) {
		if (val && typeof val === "string" && options.comma && val.indexOf(",") > -1) return val.split(",");
		if (options.throwOnLimitExceeded && currentArrayLength >= options.arrayLimit) throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
		return val;
	};
	var isoSentinel = "utf8=%26%2310003%3B";
	var charsetSentinel = "utf8=%E2%9C%93";
	var parseValues = function parseQueryStringValues(str, options) {
		var obj = { __proto__: null };
		var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, "") : str;
		cleanStr = cleanStr.replace(/%5B/gi, "[").replace(/%5D/gi, "]");
		var limit = options.parameterLimit === Infinity ? void 0 : options.parameterLimit;
		var parts = cleanStr.split(options.delimiter, options.throwOnLimitExceeded ? limit + 1 : limit);
		if (options.throwOnLimitExceeded && parts.length > limit) throw new RangeError("Parameter limit exceeded. Only " + limit + " parameter" + (limit === 1 ? "" : "s") + " allowed.");
		var skipIndex = -1;
		var i;
		var charset = options.charset;
		if (options.charsetSentinel) {
			for (i = 0; i < parts.length; ++i) if (parts[i].indexOf("utf8=") === 0) {
				if (parts[i] === charsetSentinel) charset = "utf-8";
				else if (parts[i] === isoSentinel) charset = "iso-8859-1";
				skipIndex = i;
				i = parts.length;
			}
		}
		for (i = 0; i < parts.length; ++i) {
			if (i === skipIndex) continue;
			var part = parts[i];
			var bracketEqualsPos = part.indexOf("]=");
			var pos = bracketEqualsPos === -1 ? part.indexOf("=") : bracketEqualsPos + 1;
			var key;
			var val;
			if (pos === -1) {
				key = options.decoder(part, defaults.decoder, charset, "key");
				val = options.strictNullHandling ? null : "";
			} else {
				key = options.decoder(part.slice(0, pos), defaults.decoder, charset, "key");
				if (key !== null) val = utils.maybeMap(parseArrayValue(part.slice(pos + 1), options, isArray(obj[key]) ? obj[key].length : 0), function(encodedVal) {
					return options.decoder(encodedVal, defaults.decoder, charset, "value");
				});
			}
			if (val && options.interpretNumericEntities && charset === "iso-8859-1") val = interpretNumericEntities(String(val));
			if (part.indexOf("[]=") > -1) val = isArray(val) ? [val] : val;
			if (options.comma && isArray(val) && val.length > options.arrayLimit) {
				if (options.throwOnLimitExceeded) throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
				val = utils.combine([], val, options.arrayLimit, options.plainObjects);
			}
			if (key !== null) {
				var existing = has.call(obj, key);
				if (existing && options.duplicates === "combine") obj[key] = utils.combine(obj[key], val, options.arrayLimit, options.plainObjects);
				else if (!existing || options.duplicates === "last") obj[key] = val;
			}
		}
		return obj;
	};
	var parseObject = function(chain, val, options, valuesParsed) {
		var currentArrayLength = 0;
		if (chain.length > 0 && chain[chain.length - 1] === "[]") {
			var parentKey = chain.slice(0, -1).join("");
			currentArrayLength = Array.isArray(val) && val[parentKey] ? val[parentKey].length : 0;
		}
		var leaf = valuesParsed ? val : parseArrayValue(val, options, currentArrayLength);
		for (var i = chain.length - 1; i >= 0; --i) {
			var obj;
			var root = chain[i];
			if (root === "[]" && options.parseArrays) if (utils.isOverflow(leaf)) obj = leaf;
			else obj = options.allowEmptyArrays && (leaf === "" || options.strictNullHandling && leaf === null) ? [] : utils.combine([], leaf, options.arrayLimit, options.plainObjects);
			else {
				obj = options.plainObjects ? { __proto__: null } : {};
				var cleanRoot = root.charAt(0) === "[" && root.charAt(root.length - 1) === "]" ? root.slice(1, -1) : root;
				var decodedRoot = options.decodeDotInKeys ? cleanRoot.replace(/%2E/g, ".") : cleanRoot;
				var index = parseInt(decodedRoot, 10);
				var isValidArrayIndex = !isNaN(index) && root !== decodedRoot && String(index) === decodedRoot && index >= 0 && options.parseArrays;
				if (!options.parseArrays && decodedRoot === "") obj = { 0: leaf };
				else if (isValidArrayIndex && index < options.arrayLimit) {
					obj = [];
					obj[index] = leaf;
				} else if (isValidArrayIndex && options.throwOnLimitExceeded) throw new RangeError("Array limit exceeded. Only " + options.arrayLimit + " element" + (options.arrayLimit === 1 ? "" : "s") + " allowed in an array.");
				else if (isValidArrayIndex) {
					obj[index] = leaf;
					utils.markOverflow(obj, index);
				} else if (decodedRoot !== "__proto__") obj[decodedRoot] = leaf;
			}
			leaf = obj;
		}
		return leaf;
	};
	var splitKeyIntoSegments = function splitKeyIntoSegments(givenKey, options) {
		var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, "[$1]") : givenKey;
		if (options.depth <= 0) {
			if (!options.plainObjects && has.call(Object.prototype, key)) {
				if (!options.allowPrototypes) return;
			}
			return [key];
		}
		var brackets = /(\[[^[\]]*])/;
		var child = /(\[[^[\]]*])/g;
		var segment = brackets.exec(key);
		var parent = segment ? key.slice(0, segment.index) : key;
		var keys = [];
		if (parent) {
			if (!options.plainObjects && has.call(Object.prototype, parent)) {
				if (!options.allowPrototypes) return;
			}
			keys[keys.length] = parent;
		}
		var i = 0;
		while ((segment = child.exec(key)) !== null && i < options.depth) {
			i += 1;
			var segmentContent = segment[1].slice(1, -1);
			if (!options.plainObjects && has.call(Object.prototype, segmentContent)) {
				if (!options.allowPrototypes) return;
			}
			keys[keys.length] = segment[1];
		}
		if (segment) {
			if (options.strictDepth === true) throw new RangeError("Input depth exceeded depth option of " + options.depth + " and strictDepth is true");
			keys[keys.length] = "[" + key.slice(segment.index) + "]";
		}
		return keys;
	};
	var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
		if (!givenKey) return;
		var keys = splitKeyIntoSegments(givenKey, options);
		if (!keys) return;
		return parseObject(keys, val, options, valuesParsed);
	};
	var normalizeParseOptions = function normalizeParseOptions(opts) {
		if (!opts) return defaults;
		if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
		if (typeof opts.decodeDotInKeys !== "undefined" && typeof opts.decodeDotInKeys !== "boolean") throw new TypeError("`decodeDotInKeys` option can only be `true` or `false`, when provided");
		if (opts.decoder !== null && typeof opts.decoder !== "undefined" && typeof opts.decoder !== "function") throw new TypeError("Decoder has to be a function.");
		if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
		if (typeof opts.throwOnLimitExceeded !== "undefined" && typeof opts.throwOnLimitExceeded !== "boolean") throw new TypeError("`throwOnLimitExceeded` option must be a boolean");
		var charset = typeof opts.charset === "undefined" ? defaults.charset : opts.charset;
		var duplicates = typeof opts.duplicates === "undefined" ? defaults.duplicates : opts.duplicates;
		if (duplicates !== "combine" && duplicates !== "first" && duplicates !== "last") throw new TypeError("The duplicates option must be either combine, first, or last");
		return {
			allowDots: typeof opts.allowDots === "undefined" ? opts.decodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots,
			allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
			allowPrototypes: typeof opts.allowPrototypes === "boolean" ? opts.allowPrototypes : defaults.allowPrototypes,
			allowSparse: typeof opts.allowSparse === "boolean" ? opts.allowSparse : defaults.allowSparse,
			arrayLimit: typeof opts.arrayLimit === "number" ? opts.arrayLimit : defaults.arrayLimit,
			charset,
			charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
			comma: typeof opts.comma === "boolean" ? opts.comma : defaults.comma,
			decodeDotInKeys: typeof opts.decodeDotInKeys === "boolean" ? opts.decodeDotInKeys : defaults.decodeDotInKeys,
			decoder: typeof opts.decoder === "function" ? opts.decoder : defaults.decoder,
			delimiter: typeof opts.delimiter === "string" || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
			depth: typeof opts.depth === "number" || opts.depth === false ? +opts.depth : defaults.depth,
			duplicates,
			ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
			interpretNumericEntities: typeof opts.interpretNumericEntities === "boolean" ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
			parameterLimit: typeof opts.parameterLimit === "number" ? opts.parameterLimit : defaults.parameterLimit,
			parseArrays: opts.parseArrays !== false,
			plainObjects: typeof opts.plainObjects === "boolean" ? opts.plainObjects : defaults.plainObjects,
			strictDepth: typeof opts.strictDepth === "boolean" ? !!opts.strictDepth : defaults.strictDepth,
			strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling,
			throwOnLimitExceeded: typeof opts.throwOnLimitExceeded === "boolean" ? opts.throwOnLimitExceeded : false
		};
	};
	module.exports = function(str, opts) {
		var options = normalizeParseOptions(opts);
		if (str === "" || str === null || typeof str === "undefined") return options.plainObjects ? { __proto__: null } : {};
		var tempObj = typeof str === "string" ? parseValues(str, options) : str;
		var obj = options.plainObjects ? { __proto__: null } : {};
		var keys = Object.keys(tempObj);
		for (var i = 0; i < keys.length; ++i) {
			var key = keys[i];
			var newObj = parseKeys(key, tempObj[key], options, typeof str === "string");
			obj = utils.merge(obj, newObj, options);
		}
		if (options.allowSparse === true) return obj;
		return utils.compact(obj);
	};
}));
//#endregion
//#region node_modules/qs/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var stringify = require_stringify();
	var parse = require_parse();
	module.exports = {
		formats: require_formats(),
		parse,
		stringify
	};
}));
//#endregion
//#region node_modules/express/lib/middleware/query.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_query = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	var merge = require_utils_merge();
	var parseUrl = require_parseurl();
	var qs = require_lib();
	/**
	* @param {Object} options
	* @return {Function}
	* @api public
	*/
	module.exports = function query(options) {
		var opts = merge({}, options);
		var queryparse = qs.parse;
		if (typeof options === "function") {
			queryparse = options;
			opts = void 0;
		}
		if (opts !== void 0 && opts.allowPrototypes === void 0) opts.allowPrototypes = true;
		return function query(req, res, next) {
			if (!req.query) {
				var val = parseUrl(req).query;
				req.query = queryparse(val, opts);
			}
			next();
		};
	};
}));
//#endregion
//#region node_modules/express/lib/view.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_view = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var debug = require_src()("express:view");
	var path$2 = __require("path");
	var fs$2 = __require("fs");
	/**
	* Module variables.
	* @private
	*/
	var dirname = path$2.dirname;
	var basename = path$2.basename;
	var extname = path$2.extname;
	var join = path$2.join;
	var resolve = path$2.resolve;
	/**
	* Module exports.
	* @public
	*/
	module.exports = View;
	/**
	* Initialize a new `View` with the given `name`.
	*
	* Options:
	*
	*   - `defaultEngine` the default template engine name
	*   - `engines` template engine require() cache
	*   - `root` root path for view lookup
	*
	* @param {string} name
	* @param {object} options
	* @public
	*/
	function View(name, options) {
		var opts = options || {};
		this.defaultEngine = opts.defaultEngine;
		this.ext = extname(name);
		this.name = name;
		this.root = opts.root;
		if (!this.ext && !this.defaultEngine) throw new Error("No default engine was specified and no extension was provided.");
		var fileName = name;
		if (!this.ext) {
			this.ext = this.defaultEngine[0] !== "." ? "." + this.defaultEngine : this.defaultEngine;
			fileName += this.ext;
		}
		if (!opts.engines[this.ext]) {
			var mod = this.ext.slice(1);
			debug("require \"%s\"", mod);
			var fn = __require(mod).__express;
			if (typeof fn !== "function") throw new Error("Module \"" + mod + "\" does not provide a view engine.");
			opts.engines[this.ext] = fn;
		}
		this.engine = opts.engines[this.ext];
		this.path = this.lookup(fileName);
	}
	/**
	* Lookup view by the given `name`
	*
	* @param {string} name
	* @private
	*/
	View.prototype.lookup = function lookup(name) {
		var path;
		var roots = [].concat(this.root);
		debug("lookup \"%s\"", name);
		for (var i = 0; i < roots.length && !path; i++) {
			var root = roots[i];
			var loc = resolve(root, name);
			var dir = dirname(loc);
			var file = basename(loc);
			path = this.resolve(dir, file);
		}
		return path;
	};
	/**
	* Render with the given options.
	*
	* @param {object} options
	* @param {function} callback
	* @private
	*/
	View.prototype.render = function render(options, callback) {
		debug("render \"%s\"", this.path);
		this.engine(this.path, options, callback);
	};
	/**
	* Resolve the file within the given directory.
	*
	* @param {string} dir
	* @param {string} file
	* @private
	*/
	View.prototype.resolve = function resolve(dir, file) {
		var ext = this.ext;
		var path = join(dir, file);
		var stat = tryStat(path);
		if (stat && stat.isFile()) return path;
		path = join(dir, basename(file, ext), "index" + ext);
		stat = tryStat(path);
		if (stat && stat.isFile()) return path;
	};
	/**
	* Return a stat, maybe.
	*
	* @param {string} path
	* @return {fs.Stats}
	* @private
	*/
	function tryStat(path) {
		debug("stat \"%s\"", path);
		try {
			return fs$2.statSync(path);
		} catch (e) {
			return;
		}
	}
}));
//#endregion
//#region node_modules/fresh/index.js
/*!
* fresh
* Copyright(c) 2012 TJ Holowaychuk
* Copyright(c) 2016-2017 Douglas Christopher Wilson
* MIT Licensed
*/
var require_fresh = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* RegExp to check for no-cache token in Cache-Control.
	* @private
	*/
	var CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;
	/**
	* Module exports.
	* @public
	*/
	module.exports = fresh;
	/**
	* Check freshness of the response using request and response headers.
	*
	* @param {Object} reqHeaders
	* @param {Object} resHeaders
	* @return {Boolean}
	* @public
	*/
	function fresh(reqHeaders, resHeaders) {
		var modifiedSince = reqHeaders["if-modified-since"];
		var noneMatch = reqHeaders["if-none-match"];
		if (!modifiedSince && !noneMatch) return false;
		var cacheControl = reqHeaders["cache-control"];
		if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) return false;
		if (noneMatch && noneMatch !== "*") {
			var etag = resHeaders["etag"];
			if (!etag) return false;
			var etagStale = true;
			var matches = parseTokenList(noneMatch);
			for (var i = 0; i < matches.length; i++) {
				var match = matches[i];
				if (match === etag || match === "W/" + etag || "W/" + match === etag) {
					etagStale = false;
					break;
				}
			}
			if (etagStale) return false;
		}
		if (modifiedSince) {
			var lastModified = resHeaders["last-modified"];
			if (!lastModified || !(parseHttpDate(lastModified) <= parseHttpDate(modifiedSince))) return false;
		}
		return true;
	}
	/**
	* Parse an HTTP Date into a number.
	*
	* @param {string} date
	* @private
	*/
	function parseHttpDate(date) {
		var timestamp = date && Date.parse(date);
		// istanbul ignore next: guard against date.js Date.parse patching
		return typeof timestamp === "number" ? timestamp : NaN;
	}
	/**
	* Parse a HTTP token list.
	*
	* @param {string} str
	* @private
	*/
	function parseTokenList(str) {
		var end = 0;
		var list = [];
		var start = 0;
		for (var i = 0, len = str.length; i < len; i++) switch (str.charCodeAt(i)) {
			case 32:
				if (start === end) start = end = i + 1;
				break;
			case 44:
				list.push(str.substring(start, end));
				start = end = i + 1;
				break;
			default:
				end = i + 1;
				break;
		}
		list.push(str.substring(start, end));
		return list;
	}
}));
//#endregion
//#region node_modules/mime/types.json
var require_types = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"application/andrew-inset": ["ez"],
		"application/applixware": ["aw"],
		"application/atom+xml": ["atom"],
		"application/atomcat+xml": ["atomcat"],
		"application/atomsvc+xml": ["atomsvc"],
		"application/bdoc": ["bdoc"],
		"application/ccxml+xml": ["ccxml"],
		"application/cdmi-capability": ["cdmia"],
		"application/cdmi-container": ["cdmic"],
		"application/cdmi-domain": ["cdmid"],
		"application/cdmi-object": ["cdmio"],
		"application/cdmi-queue": ["cdmiq"],
		"application/cu-seeme": ["cu"],
		"application/dash+xml": ["mpd"],
		"application/davmount+xml": ["davmount"],
		"application/docbook+xml": ["dbk"],
		"application/dssc+der": ["dssc"],
		"application/dssc+xml": ["xdssc"],
		"application/ecmascript": ["ecma"],
		"application/emma+xml": ["emma"],
		"application/epub+zip": ["epub"],
		"application/exi": ["exi"],
		"application/font-tdpfr": ["pfr"],
		"application/font-woff": [],
		"application/font-woff2": [],
		"application/geo+json": ["geojson"],
		"application/gml+xml": ["gml"],
		"application/gpx+xml": ["gpx"],
		"application/gxf": ["gxf"],
		"application/gzip": ["gz"],
		"application/hyperstudio": ["stk"],
		"application/inkml+xml": ["ink", "inkml"],
		"application/ipfix": ["ipfix"],
		"application/java-archive": [
			"jar",
			"war",
			"ear"
		],
		"application/java-serialized-object": ["ser"],
		"application/java-vm": ["class"],
		"application/javascript": ["js", "mjs"],
		"application/json": ["json", "map"],
		"application/json5": ["json5"],
		"application/jsonml+json": ["jsonml"],
		"application/ld+json": ["jsonld"],
		"application/lost+xml": ["lostxml"],
		"application/mac-binhex40": ["hqx"],
		"application/mac-compactpro": ["cpt"],
		"application/mads+xml": ["mads"],
		"application/manifest+json": ["webmanifest"],
		"application/marc": ["mrc"],
		"application/marcxml+xml": ["mrcx"],
		"application/mathematica": [
			"ma",
			"nb",
			"mb"
		],
		"application/mathml+xml": ["mathml"],
		"application/mbox": ["mbox"],
		"application/mediaservercontrol+xml": ["mscml"],
		"application/metalink+xml": ["metalink"],
		"application/metalink4+xml": ["meta4"],
		"application/mets+xml": ["mets"],
		"application/mods+xml": ["mods"],
		"application/mp21": ["m21", "mp21"],
		"application/mp4": ["mp4s", "m4p"],
		"application/msword": ["doc", "dot"],
		"application/mxf": ["mxf"],
		"application/octet-stream": [
			"bin",
			"dms",
			"lrf",
			"mar",
			"so",
			"dist",
			"distz",
			"pkg",
			"bpk",
			"dump",
			"elc",
			"deploy",
			"exe",
			"dll",
			"deb",
			"dmg",
			"iso",
			"img",
			"msi",
			"msp",
			"msm",
			"buffer"
		],
		"application/oda": ["oda"],
		"application/oebps-package+xml": ["opf"],
		"application/ogg": ["ogx"],
		"application/omdoc+xml": ["omdoc"],
		"application/onenote": [
			"onetoc",
			"onetoc2",
			"onetmp",
			"onepkg"
		],
		"application/oxps": ["oxps"],
		"application/patch-ops-error+xml": ["xer"],
		"application/pdf": ["pdf"],
		"application/pgp-encrypted": ["pgp"],
		"application/pgp-signature": ["asc", "sig"],
		"application/pics-rules": ["prf"],
		"application/pkcs10": ["p10"],
		"application/pkcs7-mime": ["p7m", "p7c"],
		"application/pkcs7-signature": ["p7s"],
		"application/pkcs8": ["p8"],
		"application/pkix-attr-cert": ["ac"],
		"application/pkix-cert": ["cer"],
		"application/pkix-crl": ["crl"],
		"application/pkix-pkipath": ["pkipath"],
		"application/pkixcmp": ["pki"],
		"application/pls+xml": ["pls"],
		"application/postscript": [
			"ai",
			"eps",
			"ps"
		],
		"application/prs.cww": ["cww"],
		"application/pskc+xml": ["pskcxml"],
		"application/raml+yaml": ["raml"],
		"application/rdf+xml": ["rdf"],
		"application/reginfo+xml": ["rif"],
		"application/relax-ng-compact-syntax": ["rnc"],
		"application/resource-lists+xml": ["rl"],
		"application/resource-lists-diff+xml": ["rld"],
		"application/rls-services+xml": ["rs"],
		"application/rpki-ghostbusters": ["gbr"],
		"application/rpki-manifest": ["mft"],
		"application/rpki-roa": ["roa"],
		"application/rsd+xml": ["rsd"],
		"application/rss+xml": ["rss"],
		"application/rtf": ["rtf"],
		"application/sbml+xml": ["sbml"],
		"application/scvp-cv-request": ["scq"],
		"application/scvp-cv-response": ["scs"],
		"application/scvp-vp-request": ["spq"],
		"application/scvp-vp-response": ["spp"],
		"application/sdp": ["sdp"],
		"application/set-payment-initiation": ["setpay"],
		"application/set-registration-initiation": ["setreg"],
		"application/shf+xml": ["shf"],
		"application/smil+xml": ["smi", "smil"],
		"application/sparql-query": ["rq"],
		"application/sparql-results+xml": ["srx"],
		"application/srgs": ["gram"],
		"application/srgs+xml": ["grxml"],
		"application/sru+xml": ["sru"],
		"application/ssdl+xml": ["ssdl"],
		"application/ssml+xml": ["ssml"],
		"application/tei+xml": ["tei", "teicorpus"],
		"application/thraud+xml": ["tfi"],
		"application/timestamped-data": ["tsd"],
		"application/vnd.3gpp.pic-bw-large": ["plb"],
		"application/vnd.3gpp.pic-bw-small": ["psb"],
		"application/vnd.3gpp.pic-bw-var": ["pvb"],
		"application/vnd.3gpp2.tcap": ["tcap"],
		"application/vnd.3m.post-it-notes": ["pwn"],
		"application/vnd.accpac.simply.aso": ["aso"],
		"application/vnd.accpac.simply.imp": ["imp"],
		"application/vnd.acucobol": ["acu"],
		"application/vnd.acucorp": ["atc", "acutc"],
		"application/vnd.adobe.air-application-installer-package+zip": ["air"],
		"application/vnd.adobe.formscentral.fcdt": ["fcdt"],
		"application/vnd.adobe.fxp": ["fxp", "fxpl"],
		"application/vnd.adobe.xdp+xml": ["xdp"],
		"application/vnd.adobe.xfdf": ["xfdf"],
		"application/vnd.ahead.space": ["ahead"],
		"application/vnd.airzip.filesecure.azf": ["azf"],
		"application/vnd.airzip.filesecure.azs": ["azs"],
		"application/vnd.amazon.ebook": ["azw"],
		"application/vnd.americandynamics.acc": ["acc"],
		"application/vnd.amiga.ami": ["ami"],
		"application/vnd.android.package-archive": ["apk"],
		"application/vnd.anser-web-certificate-issue-initiation": ["cii"],
		"application/vnd.anser-web-funds-transfer-initiation": ["fti"],
		"application/vnd.antix.game-component": ["atx"],
		"application/vnd.apple.installer+xml": ["mpkg"],
		"application/vnd.apple.mpegurl": ["m3u8"],
		"application/vnd.apple.pkpass": ["pkpass"],
		"application/vnd.aristanetworks.swi": ["swi"],
		"application/vnd.astraea-software.iota": ["iota"],
		"application/vnd.audiograph": ["aep"],
		"application/vnd.blueice.multipass": ["mpm"],
		"application/vnd.bmi": ["bmi"],
		"application/vnd.businessobjects": ["rep"],
		"application/vnd.chemdraw+xml": ["cdxml"],
		"application/vnd.chipnuts.karaoke-mmd": ["mmd"],
		"application/vnd.cinderella": ["cdy"],
		"application/vnd.claymore": ["cla"],
		"application/vnd.cloanto.rp9": ["rp9"],
		"application/vnd.clonk.c4group": [
			"c4g",
			"c4d",
			"c4f",
			"c4p",
			"c4u"
		],
		"application/vnd.cluetrust.cartomobile-config": ["c11amc"],
		"application/vnd.cluetrust.cartomobile-config-pkg": ["c11amz"],
		"application/vnd.commonspace": ["csp"],
		"application/vnd.contact.cmsg": ["cdbcmsg"],
		"application/vnd.cosmocaller": ["cmc"],
		"application/vnd.crick.clicker": ["clkx"],
		"application/vnd.crick.clicker.keyboard": ["clkk"],
		"application/vnd.crick.clicker.palette": ["clkp"],
		"application/vnd.crick.clicker.template": ["clkt"],
		"application/vnd.crick.clicker.wordbank": ["clkw"],
		"application/vnd.criticaltools.wbs+xml": ["wbs"],
		"application/vnd.ctc-posml": ["pml"],
		"application/vnd.cups-ppd": ["ppd"],
		"application/vnd.curl.car": ["car"],
		"application/vnd.curl.pcurl": ["pcurl"],
		"application/vnd.dart": ["dart"],
		"application/vnd.data-vision.rdz": ["rdz"],
		"application/vnd.dece.data": [
			"uvf",
			"uvvf",
			"uvd",
			"uvvd"
		],
		"application/vnd.dece.ttml+xml": ["uvt", "uvvt"],
		"application/vnd.dece.unspecified": ["uvx", "uvvx"],
		"application/vnd.dece.zip": ["uvz", "uvvz"],
		"application/vnd.denovo.fcselayout-link": ["fe_launch"],
		"application/vnd.dna": ["dna"],
		"application/vnd.dolby.mlp": ["mlp"],
		"application/vnd.dpgraph": ["dpg"],
		"application/vnd.dreamfactory": ["dfac"],
		"application/vnd.ds-keypoint": ["kpxx"],
		"application/vnd.dvb.ait": ["ait"],
		"application/vnd.dvb.service": ["svc"],
		"application/vnd.dynageo": ["geo"],
		"application/vnd.ecowin.chart": ["mag"],
		"application/vnd.enliven": ["nml"],
		"application/vnd.epson.esf": ["esf"],
		"application/vnd.epson.msf": ["msf"],
		"application/vnd.epson.quickanime": ["qam"],
		"application/vnd.epson.salt": ["slt"],
		"application/vnd.epson.ssf": ["ssf"],
		"application/vnd.eszigno3+xml": ["es3", "et3"],
		"application/vnd.ezpix-album": ["ez2"],
		"application/vnd.ezpix-package": ["ez3"],
		"application/vnd.fdf": ["fdf"],
		"application/vnd.fdsn.mseed": ["mseed"],
		"application/vnd.fdsn.seed": ["seed", "dataless"],
		"application/vnd.flographit": ["gph"],
		"application/vnd.fluxtime.clip": ["ftc"],
		"application/vnd.framemaker": [
			"fm",
			"frame",
			"maker",
			"book"
		],
		"application/vnd.frogans.fnc": ["fnc"],
		"application/vnd.frogans.ltf": ["ltf"],
		"application/vnd.fsc.weblaunch": ["fsc"],
		"application/vnd.fujitsu.oasys": ["oas"],
		"application/vnd.fujitsu.oasys2": ["oa2"],
		"application/vnd.fujitsu.oasys3": ["oa3"],
		"application/vnd.fujitsu.oasysgp": ["fg5"],
		"application/vnd.fujitsu.oasysprs": ["bh2"],
		"application/vnd.fujixerox.ddd": ["ddd"],
		"application/vnd.fujixerox.docuworks": ["xdw"],
		"application/vnd.fujixerox.docuworks.binder": ["xbd"],
		"application/vnd.fuzzysheet": ["fzs"],
		"application/vnd.genomatix.tuxedo": ["txd"],
		"application/vnd.geogebra.file": ["ggb"],
		"application/vnd.geogebra.tool": ["ggt"],
		"application/vnd.geometry-explorer": ["gex", "gre"],
		"application/vnd.geonext": ["gxt"],
		"application/vnd.geoplan": ["g2w"],
		"application/vnd.geospace": ["g3w"],
		"application/vnd.gmx": ["gmx"],
		"application/vnd.google-apps.document": ["gdoc"],
		"application/vnd.google-apps.presentation": ["gslides"],
		"application/vnd.google-apps.spreadsheet": ["gsheet"],
		"application/vnd.google-earth.kml+xml": ["kml"],
		"application/vnd.google-earth.kmz": ["kmz"],
		"application/vnd.grafeq": ["gqf", "gqs"],
		"application/vnd.groove-account": ["gac"],
		"application/vnd.groove-help": ["ghf"],
		"application/vnd.groove-identity-message": ["gim"],
		"application/vnd.groove-injector": ["grv"],
		"application/vnd.groove-tool-message": ["gtm"],
		"application/vnd.groove-tool-template": ["tpl"],
		"application/vnd.groove-vcard": ["vcg"],
		"application/vnd.hal+xml": ["hal"],
		"application/vnd.handheld-entertainment+xml": ["zmm"],
		"application/vnd.hbci": ["hbci"],
		"application/vnd.hhe.lesson-player": ["les"],
		"application/vnd.hp-hpgl": ["hpgl"],
		"application/vnd.hp-hpid": ["hpid"],
		"application/vnd.hp-hps": ["hps"],
		"application/vnd.hp-jlyt": ["jlt"],
		"application/vnd.hp-pcl": ["pcl"],
		"application/vnd.hp-pclxl": ["pclxl"],
		"application/vnd.hydrostatix.sof-data": ["sfd-hdstx"],
		"application/vnd.ibm.minipay": ["mpy"],
		"application/vnd.ibm.modcap": [
			"afp",
			"listafp",
			"list3820"
		],
		"application/vnd.ibm.rights-management": ["irm"],
		"application/vnd.ibm.secure-container": ["sc"],
		"application/vnd.iccprofile": ["icc", "icm"],
		"application/vnd.igloader": ["igl"],
		"application/vnd.immervision-ivp": ["ivp"],
		"application/vnd.immervision-ivu": ["ivu"],
		"application/vnd.insors.igm": ["igm"],
		"application/vnd.intercon.formnet": ["xpw", "xpx"],
		"application/vnd.intergeo": ["i2g"],
		"application/vnd.intu.qbo": ["qbo"],
		"application/vnd.intu.qfx": ["qfx"],
		"application/vnd.ipunplugged.rcprofile": ["rcprofile"],
		"application/vnd.irepository.package+xml": ["irp"],
		"application/vnd.is-xpr": ["xpr"],
		"application/vnd.isac.fcs": ["fcs"],
		"application/vnd.jam": ["jam"],
		"application/vnd.jcp.javame.midlet-rms": ["rms"],
		"application/vnd.jisp": ["jisp"],
		"application/vnd.joost.joda-archive": ["joda"],
		"application/vnd.kahootz": ["ktz", "ktr"],
		"application/vnd.kde.karbon": ["karbon"],
		"application/vnd.kde.kchart": ["chrt"],
		"application/vnd.kde.kformula": ["kfo"],
		"application/vnd.kde.kivio": ["flw"],
		"application/vnd.kde.kontour": ["kon"],
		"application/vnd.kde.kpresenter": ["kpr", "kpt"],
		"application/vnd.kde.kspread": ["ksp"],
		"application/vnd.kde.kword": ["kwd", "kwt"],
		"application/vnd.kenameaapp": ["htke"],
		"application/vnd.kidspiration": ["kia"],
		"application/vnd.kinar": ["kne", "knp"],
		"application/vnd.koan": [
			"skp",
			"skd",
			"skt",
			"skm"
		],
		"application/vnd.kodak-descriptor": ["sse"],
		"application/vnd.las.las+xml": ["lasxml"],
		"application/vnd.llamagraphics.life-balance.desktop": ["lbd"],
		"application/vnd.llamagraphics.life-balance.exchange+xml": ["lbe"],
		"application/vnd.lotus-1-2-3": ["123"],
		"application/vnd.lotus-approach": ["apr"],
		"application/vnd.lotus-freelance": ["pre"],
		"application/vnd.lotus-notes": ["nsf"],
		"application/vnd.lotus-organizer": ["org"],
		"application/vnd.lotus-screencam": ["scm"],
		"application/vnd.lotus-wordpro": ["lwp"],
		"application/vnd.macports.portpkg": ["portpkg"],
		"application/vnd.mcd": ["mcd"],
		"application/vnd.medcalcdata": ["mc1"],
		"application/vnd.mediastation.cdkey": ["cdkey"],
		"application/vnd.mfer": ["mwf"],
		"application/vnd.mfmp": ["mfm"],
		"application/vnd.micrografx.flo": ["flo"],
		"application/vnd.micrografx.igx": ["igx"],
		"application/vnd.mif": ["mif"],
		"application/vnd.mobius.daf": ["daf"],
		"application/vnd.mobius.dis": ["dis"],
		"application/vnd.mobius.mbk": ["mbk"],
		"application/vnd.mobius.mqy": ["mqy"],
		"application/vnd.mobius.msl": ["msl"],
		"application/vnd.mobius.plc": ["plc"],
		"application/vnd.mobius.txf": ["txf"],
		"application/vnd.mophun.application": ["mpn"],
		"application/vnd.mophun.certificate": ["mpc"],
		"application/vnd.mozilla.xul+xml": ["xul"],
		"application/vnd.ms-artgalry": ["cil"],
		"application/vnd.ms-cab-compressed": ["cab"],
		"application/vnd.ms-excel": [
			"xls",
			"xlm",
			"xla",
			"xlc",
			"xlt",
			"xlw"
		],
		"application/vnd.ms-excel.addin.macroenabled.12": ["xlam"],
		"application/vnd.ms-excel.sheet.binary.macroenabled.12": ["xlsb"],
		"application/vnd.ms-excel.sheet.macroenabled.12": ["xlsm"],
		"application/vnd.ms-excel.template.macroenabled.12": ["xltm"],
		"application/vnd.ms-fontobject": ["eot"],
		"application/vnd.ms-htmlhelp": ["chm"],
		"application/vnd.ms-ims": ["ims"],
		"application/vnd.ms-lrm": ["lrm"],
		"application/vnd.ms-officetheme": ["thmx"],
		"application/vnd.ms-outlook": ["msg"],
		"application/vnd.ms-pki.seccat": ["cat"],
		"application/vnd.ms-pki.stl": ["stl"],
		"application/vnd.ms-powerpoint": [
			"ppt",
			"pps",
			"pot"
		],
		"application/vnd.ms-powerpoint.addin.macroenabled.12": ["ppam"],
		"application/vnd.ms-powerpoint.presentation.macroenabled.12": ["pptm"],
		"application/vnd.ms-powerpoint.slide.macroenabled.12": ["sldm"],
		"application/vnd.ms-powerpoint.slideshow.macroenabled.12": ["ppsm"],
		"application/vnd.ms-powerpoint.template.macroenabled.12": ["potm"],
		"application/vnd.ms-project": ["mpp", "mpt"],
		"application/vnd.ms-word.document.macroenabled.12": ["docm"],
		"application/vnd.ms-word.template.macroenabled.12": ["dotm"],
		"application/vnd.ms-works": [
			"wps",
			"wks",
			"wcm",
			"wdb"
		],
		"application/vnd.ms-wpl": ["wpl"],
		"application/vnd.ms-xpsdocument": ["xps"],
		"application/vnd.mseq": ["mseq"],
		"application/vnd.musician": ["mus"],
		"application/vnd.muvee.style": ["msty"],
		"application/vnd.mynfc": ["taglet"],
		"application/vnd.neurolanguage.nlu": ["nlu"],
		"application/vnd.nitf": ["ntf", "nitf"],
		"application/vnd.noblenet-directory": ["nnd"],
		"application/vnd.noblenet-sealer": ["nns"],
		"application/vnd.noblenet-web": ["nnw"],
		"application/vnd.nokia.n-gage.data": ["ngdat"],
		"application/vnd.nokia.n-gage.symbian.install": ["n-gage"],
		"application/vnd.nokia.radio-preset": ["rpst"],
		"application/vnd.nokia.radio-presets": ["rpss"],
		"application/vnd.novadigm.edm": ["edm"],
		"application/vnd.novadigm.edx": ["edx"],
		"application/vnd.novadigm.ext": ["ext"],
		"application/vnd.oasis.opendocument.chart": ["odc"],
		"application/vnd.oasis.opendocument.chart-template": ["otc"],
		"application/vnd.oasis.opendocument.database": ["odb"],
		"application/vnd.oasis.opendocument.formula": ["odf"],
		"application/vnd.oasis.opendocument.formula-template": ["odft"],
		"application/vnd.oasis.opendocument.graphics": ["odg"],
		"application/vnd.oasis.opendocument.graphics-template": ["otg"],
		"application/vnd.oasis.opendocument.image": ["odi"],
		"application/vnd.oasis.opendocument.image-template": ["oti"],
		"application/vnd.oasis.opendocument.presentation": ["odp"],
		"application/vnd.oasis.opendocument.presentation-template": ["otp"],
		"application/vnd.oasis.opendocument.spreadsheet": ["ods"],
		"application/vnd.oasis.opendocument.spreadsheet-template": ["ots"],
		"application/vnd.oasis.opendocument.text": ["odt"],
		"application/vnd.oasis.opendocument.text-master": ["odm"],
		"application/vnd.oasis.opendocument.text-template": ["ott"],
		"application/vnd.oasis.opendocument.text-web": ["oth"],
		"application/vnd.olpc-sugar": ["xo"],
		"application/vnd.oma.dd2+xml": ["dd2"],
		"application/vnd.openofficeorg.extension": ["oxt"],
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
		"application/vnd.openxmlformats-officedocument.presentationml.slide": ["sldx"],
		"application/vnd.openxmlformats-officedocument.presentationml.slideshow": ["ppsx"],
		"application/vnd.openxmlformats-officedocument.presentationml.template": ["potx"],
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
		"application/vnd.openxmlformats-officedocument.spreadsheetml.template": ["xltx"],
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
		"application/vnd.openxmlformats-officedocument.wordprocessingml.template": ["dotx"],
		"application/vnd.osgeo.mapguide.package": ["mgp"],
		"application/vnd.osgi.dp": ["dp"],
		"application/vnd.osgi.subsystem": ["esa"],
		"application/vnd.palm": [
			"pdb",
			"pqa",
			"oprc"
		],
		"application/vnd.pawaafile": ["paw"],
		"application/vnd.pg.format": ["str"],
		"application/vnd.pg.osasli": ["ei6"],
		"application/vnd.picsel": ["efif"],
		"application/vnd.pmi.widget": ["wg"],
		"application/vnd.pocketlearn": ["plf"],
		"application/vnd.powerbuilder6": ["pbd"],
		"application/vnd.previewsystems.box": ["box"],
		"application/vnd.proteus.magazine": ["mgz"],
		"application/vnd.publishare-delta-tree": ["qps"],
		"application/vnd.pvi.ptid1": ["ptid"],
		"application/vnd.quark.quarkxpress": [
			"qxd",
			"qxt",
			"qwd",
			"qwt",
			"qxl",
			"qxb"
		],
		"application/vnd.realvnc.bed": ["bed"],
		"application/vnd.recordare.musicxml": ["mxl"],
		"application/vnd.recordare.musicxml+xml": ["musicxml"],
		"application/vnd.rig.cryptonote": ["cryptonote"],
		"application/vnd.rim.cod": ["cod"],
		"application/vnd.rn-realmedia": ["rm"],
		"application/vnd.rn-realmedia-vbr": ["rmvb"],
		"application/vnd.route66.link66+xml": ["link66"],
		"application/vnd.sailingtracker.track": ["st"],
		"application/vnd.seemail": ["see"],
		"application/vnd.sema": ["sema"],
		"application/vnd.semd": ["semd"],
		"application/vnd.semf": ["semf"],
		"application/vnd.shana.informed.formdata": ["ifm"],
		"application/vnd.shana.informed.formtemplate": ["itp"],
		"application/vnd.shana.informed.interchange": ["iif"],
		"application/vnd.shana.informed.package": ["ipk"],
		"application/vnd.simtech-mindmapper": ["twd", "twds"],
		"application/vnd.smaf": ["mmf"],
		"application/vnd.smart.teacher": ["teacher"],
		"application/vnd.solent.sdkm+xml": ["sdkm", "sdkd"],
		"application/vnd.spotfire.dxp": ["dxp"],
		"application/vnd.spotfire.sfs": ["sfs"],
		"application/vnd.stardivision.calc": ["sdc"],
		"application/vnd.stardivision.draw": ["sda"],
		"application/vnd.stardivision.impress": ["sdd"],
		"application/vnd.stardivision.math": ["smf"],
		"application/vnd.stardivision.writer": ["sdw", "vor"],
		"application/vnd.stardivision.writer-global": ["sgl"],
		"application/vnd.stepmania.package": ["smzip"],
		"application/vnd.stepmania.stepchart": ["sm"],
		"application/vnd.sun.wadl+xml": ["wadl"],
		"application/vnd.sun.xml.calc": ["sxc"],
		"application/vnd.sun.xml.calc.template": ["stc"],
		"application/vnd.sun.xml.draw": ["sxd"],
		"application/vnd.sun.xml.draw.template": ["std"],
		"application/vnd.sun.xml.impress": ["sxi"],
		"application/vnd.sun.xml.impress.template": ["sti"],
		"application/vnd.sun.xml.math": ["sxm"],
		"application/vnd.sun.xml.writer": ["sxw"],
		"application/vnd.sun.xml.writer.global": ["sxg"],
		"application/vnd.sun.xml.writer.template": ["stw"],
		"application/vnd.sus-calendar": ["sus", "susp"],
		"application/vnd.svd": ["svd"],
		"application/vnd.symbian.install": ["sis", "sisx"],
		"application/vnd.syncml+xml": ["xsm"],
		"application/vnd.syncml.dm+wbxml": ["bdm"],
		"application/vnd.syncml.dm+xml": ["xdm"],
		"application/vnd.tao.intent-module-archive": ["tao"],
		"application/vnd.tcpdump.pcap": [
			"pcap",
			"cap",
			"dmp"
		],
		"application/vnd.tmobile-livetv": ["tmo"],
		"application/vnd.trid.tpt": ["tpt"],
		"application/vnd.triscape.mxs": ["mxs"],
		"application/vnd.trueapp": ["tra"],
		"application/vnd.ufdl": ["ufd", "ufdl"],
		"application/vnd.uiq.theme": ["utz"],
		"application/vnd.umajin": ["umj"],
		"application/vnd.unity": ["unityweb"],
		"application/vnd.uoml+xml": ["uoml"],
		"application/vnd.vcx": ["vcx"],
		"application/vnd.visio": [
			"vsd",
			"vst",
			"vss",
			"vsw"
		],
		"application/vnd.visionary": ["vis"],
		"application/vnd.vsf": ["vsf"],
		"application/vnd.wap.wbxml": ["wbxml"],
		"application/vnd.wap.wmlc": ["wmlc"],
		"application/vnd.wap.wmlscriptc": ["wmlsc"],
		"application/vnd.webturbo": ["wtb"],
		"application/vnd.wolfram.player": ["nbp"],
		"application/vnd.wordperfect": ["wpd"],
		"application/vnd.wqd": ["wqd"],
		"application/vnd.wt.stf": ["stf"],
		"application/vnd.xara": ["xar"],
		"application/vnd.xfdl": ["xfdl"],
		"application/vnd.yamaha.hv-dic": ["hvd"],
		"application/vnd.yamaha.hv-script": ["hvs"],
		"application/vnd.yamaha.hv-voice": ["hvp"],
		"application/vnd.yamaha.openscoreformat": ["osf"],
		"application/vnd.yamaha.openscoreformat.osfpvg+xml": ["osfpvg"],
		"application/vnd.yamaha.smaf-audio": ["saf"],
		"application/vnd.yamaha.smaf-phrase": ["spf"],
		"application/vnd.yellowriver-custom-menu": ["cmp"],
		"application/vnd.zul": ["zir", "zirz"],
		"application/vnd.zzazz.deck+xml": ["zaz"],
		"application/voicexml+xml": ["vxml"],
		"application/wasm": ["wasm"],
		"application/widget": ["wgt"],
		"application/winhlp": ["hlp"],
		"application/wsdl+xml": ["wsdl"],
		"application/wspolicy+xml": ["wspolicy"],
		"application/x-7z-compressed": ["7z"],
		"application/x-abiword": ["abw"],
		"application/x-ace-compressed": ["ace"],
		"application/x-apple-diskimage": [],
		"application/x-arj": ["arj"],
		"application/x-authorware-bin": [
			"aab",
			"x32",
			"u32",
			"vox"
		],
		"application/x-authorware-map": ["aam"],
		"application/x-authorware-seg": ["aas"],
		"application/x-bcpio": ["bcpio"],
		"application/x-bdoc": [],
		"application/x-bittorrent": ["torrent"],
		"application/x-blorb": ["blb", "blorb"],
		"application/x-bzip": ["bz"],
		"application/x-bzip2": ["bz2", "boz"],
		"application/x-cbr": [
			"cbr",
			"cba",
			"cbt",
			"cbz",
			"cb7"
		],
		"application/x-cdlink": ["vcd"],
		"application/x-cfs-compressed": ["cfs"],
		"application/x-chat": ["chat"],
		"application/x-chess-pgn": ["pgn"],
		"application/x-chrome-extension": ["crx"],
		"application/x-cocoa": ["cco"],
		"application/x-conference": ["nsc"],
		"application/x-cpio": ["cpio"],
		"application/x-csh": ["csh"],
		"application/x-debian-package": ["udeb"],
		"application/x-dgc-compressed": ["dgc"],
		"application/x-director": [
			"dir",
			"dcr",
			"dxr",
			"cst",
			"cct",
			"cxt",
			"w3d",
			"fgd",
			"swa"
		],
		"application/x-doom": ["wad"],
		"application/x-dtbncx+xml": ["ncx"],
		"application/x-dtbook+xml": ["dtb"],
		"application/x-dtbresource+xml": ["res"],
		"application/x-dvi": ["dvi"],
		"application/x-envoy": ["evy"],
		"application/x-eva": ["eva"],
		"application/x-font-bdf": ["bdf"],
		"application/x-font-ghostscript": ["gsf"],
		"application/x-font-linux-psf": ["psf"],
		"application/x-font-pcf": ["pcf"],
		"application/x-font-snf": ["snf"],
		"application/x-font-type1": [
			"pfa",
			"pfb",
			"pfm",
			"afm"
		],
		"application/x-freearc": ["arc"],
		"application/x-futuresplash": ["spl"],
		"application/x-gca-compressed": ["gca"],
		"application/x-glulx": ["ulx"],
		"application/x-gnumeric": ["gnumeric"],
		"application/x-gramps-xml": ["gramps"],
		"application/x-gtar": ["gtar"],
		"application/x-hdf": ["hdf"],
		"application/x-httpd-php": ["php"],
		"application/x-install-instructions": ["install"],
		"application/x-iso9660-image": [],
		"application/x-java-archive-diff": ["jardiff"],
		"application/x-java-jnlp-file": ["jnlp"],
		"application/x-latex": ["latex"],
		"application/x-lua-bytecode": ["luac"],
		"application/x-lzh-compressed": ["lzh", "lha"],
		"application/x-makeself": ["run"],
		"application/x-mie": ["mie"],
		"application/x-mobipocket-ebook": ["prc", "mobi"],
		"application/x-ms-application": ["application"],
		"application/x-ms-shortcut": ["lnk"],
		"application/x-ms-wmd": ["wmd"],
		"application/x-ms-wmz": ["wmz"],
		"application/x-ms-xbap": ["xbap"],
		"application/x-msaccess": ["mdb"],
		"application/x-msbinder": ["obd"],
		"application/x-mscardfile": ["crd"],
		"application/x-msclip": ["clp"],
		"application/x-msdos-program": [],
		"application/x-msdownload": ["com", "bat"],
		"application/x-msmediaview": [
			"mvb",
			"m13",
			"m14"
		],
		"application/x-msmetafile": [
			"wmf",
			"emf",
			"emz"
		],
		"application/x-msmoney": ["mny"],
		"application/x-mspublisher": ["pub"],
		"application/x-msschedule": ["scd"],
		"application/x-msterminal": ["trm"],
		"application/x-mswrite": ["wri"],
		"application/x-netcdf": ["nc", "cdf"],
		"application/x-ns-proxy-autoconfig": ["pac"],
		"application/x-nzb": ["nzb"],
		"application/x-perl": ["pl", "pm"],
		"application/x-pilot": [],
		"application/x-pkcs12": ["p12", "pfx"],
		"application/x-pkcs7-certificates": ["p7b", "spc"],
		"application/x-pkcs7-certreqresp": ["p7r"],
		"application/x-rar-compressed": ["rar"],
		"application/x-redhat-package-manager": ["rpm"],
		"application/x-research-info-systems": ["ris"],
		"application/x-sea": ["sea"],
		"application/x-sh": ["sh"],
		"application/x-shar": ["shar"],
		"application/x-shockwave-flash": ["swf"],
		"application/x-silverlight-app": ["xap"],
		"application/x-sql": ["sql"],
		"application/x-stuffit": ["sit"],
		"application/x-stuffitx": ["sitx"],
		"application/x-subrip": ["srt"],
		"application/x-sv4cpio": ["sv4cpio"],
		"application/x-sv4crc": ["sv4crc"],
		"application/x-t3vm-image": ["t3"],
		"application/x-tads": ["gam"],
		"application/x-tar": ["tar"],
		"application/x-tcl": ["tcl", "tk"],
		"application/x-tex": ["tex"],
		"application/x-tex-tfm": ["tfm"],
		"application/x-texinfo": ["texinfo", "texi"],
		"application/x-tgif": ["obj"],
		"application/x-ustar": ["ustar"],
		"application/x-virtualbox-hdd": ["hdd"],
		"application/x-virtualbox-ova": ["ova"],
		"application/x-virtualbox-ovf": ["ovf"],
		"application/x-virtualbox-vbox": ["vbox"],
		"application/x-virtualbox-vbox-extpack": ["vbox-extpack"],
		"application/x-virtualbox-vdi": ["vdi"],
		"application/x-virtualbox-vhd": ["vhd"],
		"application/x-virtualbox-vmdk": ["vmdk"],
		"application/x-wais-source": ["src"],
		"application/x-web-app-manifest+json": ["webapp"],
		"application/x-x509-ca-cert": [
			"der",
			"crt",
			"pem"
		],
		"application/x-xfig": ["fig"],
		"application/x-xliff+xml": ["xlf"],
		"application/x-xpinstall": ["xpi"],
		"application/x-xz": ["xz"],
		"application/x-zmachine": [
			"z1",
			"z2",
			"z3",
			"z4",
			"z5",
			"z6",
			"z7",
			"z8"
		],
		"application/xaml+xml": ["xaml"],
		"application/xcap-diff+xml": ["xdf"],
		"application/xenc+xml": ["xenc"],
		"application/xhtml+xml": ["xhtml", "xht"],
		"application/xml": [
			"xml",
			"xsl",
			"xsd",
			"rng"
		],
		"application/xml-dtd": ["dtd"],
		"application/xop+xml": ["xop"],
		"application/xproc+xml": ["xpl"],
		"application/xslt+xml": ["xslt"],
		"application/xspf+xml": ["xspf"],
		"application/xv+xml": [
			"mxml",
			"xhvml",
			"xvml",
			"xvm"
		],
		"application/yang": ["yang"],
		"application/yin+xml": ["yin"],
		"application/zip": ["zip"],
		"audio/3gpp": [],
		"audio/adpcm": ["adp"],
		"audio/basic": ["au", "snd"],
		"audio/midi": [
			"mid",
			"midi",
			"kar",
			"rmi"
		],
		"audio/mp3": [],
		"audio/mp4": ["m4a", "mp4a"],
		"audio/mpeg": [
			"mpga",
			"mp2",
			"mp2a",
			"mp3",
			"m2a",
			"m3a"
		],
		"audio/ogg": [
			"oga",
			"ogg",
			"spx"
		],
		"audio/s3m": ["s3m"],
		"audio/silk": ["sil"],
		"audio/vnd.dece.audio": ["uva", "uvva"],
		"audio/vnd.digital-winds": ["eol"],
		"audio/vnd.dra": ["dra"],
		"audio/vnd.dts": ["dts"],
		"audio/vnd.dts.hd": ["dtshd"],
		"audio/vnd.lucent.voice": ["lvp"],
		"audio/vnd.ms-playready.media.pya": ["pya"],
		"audio/vnd.nuera.ecelp4800": ["ecelp4800"],
		"audio/vnd.nuera.ecelp7470": ["ecelp7470"],
		"audio/vnd.nuera.ecelp9600": ["ecelp9600"],
		"audio/vnd.rip": ["rip"],
		"audio/wav": ["wav"],
		"audio/wave": [],
		"audio/webm": ["weba"],
		"audio/x-aac": ["aac"],
		"audio/x-aiff": [
			"aif",
			"aiff",
			"aifc"
		],
		"audio/x-caf": ["caf"],
		"audio/x-flac": ["flac"],
		"audio/x-m4a": [],
		"audio/x-matroska": ["mka"],
		"audio/x-mpegurl": ["m3u"],
		"audio/x-ms-wax": ["wax"],
		"audio/x-ms-wma": ["wma"],
		"audio/x-pn-realaudio": ["ram", "ra"],
		"audio/x-pn-realaudio-plugin": ["rmp"],
		"audio/x-realaudio": [],
		"audio/x-wav": [],
		"audio/xm": ["xm"],
		"chemical/x-cdx": ["cdx"],
		"chemical/x-cif": ["cif"],
		"chemical/x-cmdf": ["cmdf"],
		"chemical/x-cml": ["cml"],
		"chemical/x-csml": ["csml"],
		"chemical/x-xyz": ["xyz"],
		"font/collection": ["ttc"],
		"font/otf": ["otf"],
		"font/ttf": ["ttf"],
		"font/woff": ["woff"],
		"font/woff2": ["woff2"],
		"image/apng": ["apng"],
		"image/bmp": ["bmp"],
		"image/cgm": ["cgm"],
		"image/g3fax": ["g3"],
		"image/gif": ["gif"],
		"image/ief": ["ief"],
		"image/jp2": ["jp2", "jpg2"],
		"image/jpeg": [
			"jpeg",
			"jpg",
			"jpe"
		],
		"image/jpm": ["jpm"],
		"image/jpx": ["jpx", "jpf"],
		"image/ktx": ["ktx"],
		"image/png": ["png"],
		"image/prs.btif": ["btif"],
		"image/sgi": ["sgi"],
		"image/svg+xml": ["svg", "svgz"],
		"image/tiff": ["tiff", "tif"],
		"image/vnd.adobe.photoshop": ["psd"],
		"image/vnd.dece.graphic": [
			"uvi",
			"uvvi",
			"uvg",
			"uvvg"
		],
		"image/vnd.djvu": ["djvu", "djv"],
		"image/vnd.dvb.subtitle": [],
		"image/vnd.dwg": ["dwg"],
		"image/vnd.dxf": ["dxf"],
		"image/vnd.fastbidsheet": ["fbs"],
		"image/vnd.fpx": ["fpx"],
		"image/vnd.fst": ["fst"],
		"image/vnd.fujixerox.edmics-mmr": ["mmr"],
		"image/vnd.fujixerox.edmics-rlc": ["rlc"],
		"image/vnd.ms-modi": ["mdi"],
		"image/vnd.ms-photo": ["wdp"],
		"image/vnd.net-fpx": ["npx"],
		"image/vnd.wap.wbmp": ["wbmp"],
		"image/vnd.xiff": ["xif"],
		"image/webp": ["webp"],
		"image/x-3ds": ["3ds"],
		"image/x-cmu-raster": ["ras"],
		"image/x-cmx": ["cmx"],
		"image/x-freehand": [
			"fh",
			"fhc",
			"fh4",
			"fh5",
			"fh7"
		],
		"image/x-icon": ["ico"],
		"image/x-jng": ["jng"],
		"image/x-mrsid-image": ["sid"],
		"image/x-ms-bmp": [],
		"image/x-pcx": ["pcx"],
		"image/x-pict": ["pic", "pct"],
		"image/x-portable-anymap": ["pnm"],
		"image/x-portable-bitmap": ["pbm"],
		"image/x-portable-graymap": ["pgm"],
		"image/x-portable-pixmap": ["ppm"],
		"image/x-rgb": ["rgb"],
		"image/x-tga": ["tga"],
		"image/x-xbitmap": ["xbm"],
		"image/x-xpixmap": ["xpm"],
		"image/x-xwindowdump": ["xwd"],
		"message/rfc822": ["eml", "mime"],
		"model/gltf+json": ["gltf"],
		"model/gltf-binary": ["glb"],
		"model/iges": ["igs", "iges"],
		"model/mesh": [
			"msh",
			"mesh",
			"silo"
		],
		"model/vnd.collada+xml": ["dae"],
		"model/vnd.dwf": ["dwf"],
		"model/vnd.gdl": ["gdl"],
		"model/vnd.gtw": ["gtw"],
		"model/vnd.mts": ["mts"],
		"model/vnd.vtu": ["vtu"],
		"model/vrml": ["wrl", "vrml"],
		"model/x3d+binary": ["x3db", "x3dbz"],
		"model/x3d+vrml": ["x3dv", "x3dvz"],
		"model/x3d+xml": ["x3d", "x3dz"],
		"text/cache-manifest": ["appcache", "manifest"],
		"text/calendar": ["ics", "ifb"],
		"text/coffeescript": ["coffee", "litcoffee"],
		"text/css": ["css"],
		"text/csv": ["csv"],
		"text/hjson": ["hjson"],
		"text/html": [
			"html",
			"htm",
			"shtml"
		],
		"text/jade": ["jade"],
		"text/jsx": ["jsx"],
		"text/less": ["less"],
		"text/markdown": ["markdown", "md"],
		"text/mathml": ["mml"],
		"text/n3": ["n3"],
		"text/plain": [
			"txt",
			"text",
			"conf",
			"def",
			"list",
			"log",
			"in",
			"ini"
		],
		"text/prs.lines.tag": ["dsc"],
		"text/richtext": ["rtx"],
		"text/rtf": [],
		"text/sgml": ["sgml", "sgm"],
		"text/slim": ["slim", "slm"],
		"text/stylus": ["stylus", "styl"],
		"text/tab-separated-values": ["tsv"],
		"text/troff": [
			"t",
			"tr",
			"roff",
			"man",
			"me",
			"ms"
		],
		"text/turtle": ["ttl"],
		"text/uri-list": [
			"uri",
			"uris",
			"urls"
		],
		"text/vcard": ["vcard"],
		"text/vnd.curl": ["curl"],
		"text/vnd.curl.dcurl": ["dcurl"],
		"text/vnd.curl.mcurl": ["mcurl"],
		"text/vnd.curl.scurl": ["scurl"],
		"text/vnd.dvb.subtitle": ["sub"],
		"text/vnd.fly": ["fly"],
		"text/vnd.fmi.flexstor": ["flx"],
		"text/vnd.graphviz": ["gv"],
		"text/vnd.in3d.3dml": ["3dml"],
		"text/vnd.in3d.spot": ["spot"],
		"text/vnd.sun.j2me.app-descriptor": ["jad"],
		"text/vnd.wap.wml": ["wml"],
		"text/vnd.wap.wmlscript": ["wmls"],
		"text/vtt": ["vtt"],
		"text/x-asm": ["s", "asm"],
		"text/x-c": [
			"c",
			"cc",
			"cxx",
			"cpp",
			"h",
			"hh",
			"dic"
		],
		"text/x-component": ["htc"],
		"text/x-fortran": [
			"f",
			"for",
			"f77",
			"f90"
		],
		"text/x-handlebars-template": ["hbs"],
		"text/x-java-source": ["java"],
		"text/x-lua": ["lua"],
		"text/x-markdown": ["mkd"],
		"text/x-nfo": ["nfo"],
		"text/x-opml": ["opml"],
		"text/x-org": [],
		"text/x-pascal": ["p", "pas"],
		"text/x-processing": ["pde"],
		"text/x-sass": ["sass"],
		"text/x-scss": ["scss"],
		"text/x-setext": ["etx"],
		"text/x-sfv": ["sfv"],
		"text/x-suse-ymp": ["ymp"],
		"text/x-uuencode": ["uu"],
		"text/x-vcalendar": ["vcs"],
		"text/x-vcard": ["vcf"],
		"text/xml": [],
		"text/yaml": ["yaml", "yml"],
		"video/3gpp": ["3gp", "3gpp"],
		"video/3gpp2": ["3g2"],
		"video/h261": ["h261"],
		"video/h263": ["h263"],
		"video/h264": ["h264"],
		"video/jpeg": ["jpgv"],
		"video/jpm": ["jpgm"],
		"video/mj2": ["mj2", "mjp2"],
		"video/mp2t": ["ts"],
		"video/mp4": [
			"mp4",
			"mp4v",
			"mpg4"
		],
		"video/mpeg": [
			"mpeg",
			"mpg",
			"mpe",
			"m1v",
			"m2v"
		],
		"video/ogg": ["ogv"],
		"video/quicktime": ["qt", "mov"],
		"video/vnd.dece.hd": ["uvh", "uvvh"],
		"video/vnd.dece.mobile": ["uvm", "uvvm"],
		"video/vnd.dece.pd": ["uvp", "uvvp"],
		"video/vnd.dece.sd": ["uvs", "uvvs"],
		"video/vnd.dece.video": ["uvv", "uvvv"],
		"video/vnd.dvb.file": ["dvb"],
		"video/vnd.fvt": ["fvt"],
		"video/vnd.mpegurl": ["mxu", "m4u"],
		"video/vnd.ms-playready.media.pyv": ["pyv"],
		"video/vnd.uvvu.mp4": ["uvu", "uvvu"],
		"video/vnd.vivo": ["viv"],
		"video/webm": ["webm"],
		"video/x-f4v": ["f4v"],
		"video/x-fli": ["fli"],
		"video/x-flv": ["flv"],
		"video/x-m4v": ["m4v"],
		"video/x-matroska": [
			"mkv",
			"mk3d",
			"mks"
		],
		"video/x-mng": ["mng"],
		"video/x-ms-asf": ["asf", "asx"],
		"video/x-ms-vob": ["vob"],
		"video/x-ms-wm": ["wm"],
		"video/x-ms-wmv": ["wmv"],
		"video/x-ms-wmx": ["wmx"],
		"video/x-ms-wvx": ["wvx"],
		"video/x-msvideo": ["avi"],
		"video/x-sgi-movie": ["movie"],
		"video/x-smv": ["smv"],
		"x-conference/x-cooltalk": ["ice"]
	};
}));
//#endregion
//#region node_modules/mime/mime.js
var require_mime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	__require("path");
	var fs$1 = __require("fs");
	function Mime() {
		this.types = Object.create(null);
		this.extensions = Object.create(null);
	}
	/**
	* Define mimetype -> extension mappings.  Each key is a mime-type that maps
	* to an array of extensions associated with the type.  The first extension is
	* used as the default extension for the type.
	*
	* e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
	*
	* @param map (Object) type definitions
	*/
	Mime.prototype.define = function(map) {
		for (var type in map) {
			var exts = map[type];
			for (var i = 0; i < exts.length; i++) {
				if (process.env.DEBUG_MIME && this.types[exts[i]]) console.warn((this._loading || "define()").replace(/.*\//, ""), "changes \"" + exts[i] + "\" extension type from " + this.types[exts[i]] + " to " + type);
				this.types[exts[i]] = type;
			}
			if (!this.extensions[type]) this.extensions[type] = exts[0];
		}
	};
	/**
	* Load an Apache2-style ".types" file
	*
	* This may be called multiple times (it's expected).  Where files declare
	* overlapping types/extensions, the last file wins.
	*
	* @param file (String) path of file to load.
	*/
	Mime.prototype.load = function(file) {
		this._loading = file;
		var map = {};
		fs$1.readFileSync(file, "ascii").split(/[\r\n]+/).forEach(function(line) {
			var fields = line.replace(/\s*#.*|^\s*|\s*$/g, "").split(/\s+/);
			map[fields.shift()] = fields;
		});
		this.define(map);
		this._loading = null;
	};
	/**
	* Lookup a mime type based on extension
	*/
	Mime.prototype.lookup = function(path, fallback) {
		var ext = path.replace(/^.*[\.\/\\]/, "").toLowerCase();
		return this.types[ext] || fallback || this.default_type;
	};
	/**
	* Return file extension associated with a mime type
	*/
	Mime.prototype.extension = function(mimeType) {
		var type = mimeType.match(/^\s*([^;\s]*)(?:;|\s|$)/)[1].toLowerCase();
		return this.extensions[type];
	};
	var mime = new Mime();
	mime.define(require_types());
	mime.default_type = mime.lookup("bin");
	mime.Mime = Mime;
	/**
	* Lookup a charset based on mime type.
	*/
	mime.charsets = { lookup: function(mimeType, fallback) {
		return /^text\/|^application\/(javascript|json)/.test(mimeType) ? "UTF-8" : fallback;
	} };
	module.exports = mime;
}));
//#endregion
//#region node_modules/range-parser/index.js
/*!
* range-parser
* Copyright(c) 2012-2014 TJ Holowaychuk
* Copyright(c) 2015-2016 Douglas Christopher Wilson
* MIT Licensed
*/
var require_range_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module exports.
	* @public
	*/
	module.exports = rangeParser;
	/**
	* Parse "Range" header `str` relative to the given file `size`.
	*
	* @param {Number} size
	* @param {String} str
	* @param {Object} [options]
	* @return {Array}
	* @public
	*/
	function rangeParser(size, str, options) {
		if (typeof str !== "string") throw new TypeError("argument str must be a string");
		var index = str.indexOf("=");
		if (index === -1) return -2;
		var arr = str.slice(index + 1).split(",");
		var ranges = [];
		ranges.type = str.slice(0, index);
		for (var i = 0; i < arr.length; i++) {
			var range = arr[i].split("-");
			var start = parseInt(range[0], 10);
			var end = parseInt(range[1], 10);
			if (isNaN(start)) {
				start = size - end;
				end = size - 1;
			} else if (isNaN(end)) end = size - 1;
			if (end > size - 1) end = size - 1;
			if (isNaN(start) || isNaN(end) || start > end || start < 0) continue;
			ranges.push({
				start,
				end
			});
		}
		if (ranges.length < 1) return -1;
		return options && options.combine ? combineRanges(ranges) : ranges;
	}
	/**
	* Combine overlapping & adjacent ranges.
	* @private
	*/
	function combineRanges(ranges) {
		var ordered = ranges.map(mapWithIndex).sort(sortByRangeStart);
		for (var j = 0, i = 1; i < ordered.length; i++) {
			var range = ordered[i];
			var current = ordered[j];
			if (range.start > current.end + 1) ordered[++j] = range;
			else if (range.end > current.end) {
				current.end = range.end;
				current.index = Math.min(current.index, range.index);
			}
		}
		ordered.length = j + 1;
		var combined = ordered.sort(sortByRangeIndex).map(mapWithoutIndex);
		combined.type = ranges.type;
		return combined;
	}
	/**
	* Map function to add index value to ranges.
	* @private
	*/
	function mapWithIndex(range, index) {
		return {
			start: range.start,
			end: range.end,
			index
		};
	}
	/**
	* Map function to remove index value from ranges.
	* @private
	*/
	function mapWithoutIndex(range) {
		return {
			start: range.start,
			end: range.end
		};
	}
	/**
	* Sort function to sort ranges by index.
	* @private
	*/
	function sortByRangeIndex(a, b) {
		return a.index - b.index;
	}
	/**
	* Sort function to sort ranges by start position.
	* @private
	*/
	function sortByRangeStart(a, b) {
		return a.start - b.start;
	}
}));
//#endregion
//#region node_modules/send/index.js
/*!
* send
* Copyright(c) 2012 TJ Holowaychuk
* Copyright(c) 2014-2022 Douglas Christopher Wilson
* MIT Licensed
*/
var require_send = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var createError = require_http_errors();
	var debug = require_src()("send");
	var deprecate = require_depd()("send");
	var destroy = require_destroy();
	var encodeUrl = require_encodeurl();
	var escapeHtml = require_escape_html();
	var etag = require_etag();
	var fresh = require_fresh();
	var fs = __require("fs");
	var mime = require_mime();
	var ms = require_ms();
	var onFinished = require_on_finished();
	var parseRange = require_range_parser();
	var path$1 = __require("path");
	var statuses = require_statuses();
	var Stream = __require("stream");
	var util = __require("util");
	/**
	* Path function references.
	* @private
	*/
	var extname = path$1.extname;
	var join = path$1.join;
	var normalize = path$1.normalize;
	var resolve = path$1.resolve;
	var sep = path$1.sep;
	/**
	* Regular expression for identifying a bytes Range header.
	* @private
	*/
	var BYTES_RANGE_REGEXP = /^ *bytes=/;
	/**
	* Maximum value allowed for the max age.
	* @private
	*/
	var MAX_MAXAGE = 3600 * 24 * 365 * 1e3;
	/**
	* Regular expression to match a path with a directory up component.
	* @private
	*/
	var UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;
	/**
	* Module exports.
	* @public
	*/
	module.exports = send;
	module.exports.mime = mime;
	/**
	* Return a `SendStream` for `req` and `path`.
	*
	* @param {object} req
	* @param {string} path
	* @param {object} [options]
	* @return {SendStream}
	* @public
	*/
	function send(req, path, options) {
		return new SendStream(req, path, options);
	}
	/**
	* Initialize a `SendStream` with the given `path`.
	*
	* @param {Request} req
	* @param {String} path
	* @param {object} [options]
	* @private
	*/
	function SendStream(req, path, options) {
		Stream.call(this);
		var opts = options || {};
		this.options = opts;
		this.path = path;
		this.req = req;
		this._acceptRanges = opts.acceptRanges !== void 0 ? Boolean(opts.acceptRanges) : true;
		this._cacheControl = opts.cacheControl !== void 0 ? Boolean(opts.cacheControl) : true;
		this._etag = opts.etag !== void 0 ? Boolean(opts.etag) : true;
		this._dotfiles = opts.dotfiles !== void 0 ? opts.dotfiles : "ignore";
		if (this._dotfiles !== "ignore" && this._dotfiles !== "allow" && this._dotfiles !== "deny") throw new TypeError("dotfiles option must be \"allow\", \"deny\", or \"ignore\"");
		this._hidden = Boolean(opts.hidden);
		if (opts.hidden !== void 0) deprecate("hidden: use dotfiles: '" + (this._hidden ? "allow" : "ignore") + "' instead");
		if (opts.dotfiles === void 0) this._dotfiles = void 0;
		this._extensions = opts.extensions !== void 0 ? normalizeList(opts.extensions, "extensions option") : [];
		this._immutable = opts.immutable !== void 0 ? Boolean(opts.immutable) : false;
		this._index = opts.index !== void 0 ? normalizeList(opts.index, "index option") : ["index.html"];
		this._lastModified = opts.lastModified !== void 0 ? Boolean(opts.lastModified) : true;
		this._maxage = opts.maxAge || opts.maxage;
		this._maxage = typeof this._maxage === "string" ? ms(this._maxage) : Number(this._maxage);
		this._maxage = !isNaN(this._maxage) ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE) : 0;
		this._root = opts.root ? resolve(opts.root) : null;
		if (!this._root && opts.from) this.from(opts.from);
	}
	/**
	* Inherits from `Stream`.
	*/
	util.inherits(SendStream, Stream);
	/**
	* Enable or disable etag generation.
	*
	* @param {Boolean} val
	* @return {SendStream}
	* @api public
	*/
	SendStream.prototype.etag = deprecate.function(function etag(val) {
		this._etag = Boolean(val);
		debug("etag %s", this._etag);
		return this;
	}, "send.etag: pass etag as option");
	/**
	* Enable or disable "hidden" (dot) files.
	*
	* @param {Boolean} path
	* @return {SendStream}
	* @api public
	*/
	SendStream.prototype.hidden = deprecate.function(function hidden(val) {
		this._hidden = Boolean(val);
		this._dotfiles = void 0;
		debug("hidden %s", this._hidden);
		return this;
	}, "send.hidden: use dotfiles option");
	/**
	* Set index `paths`, set to a falsy
	* value to disable index support.
	*
	* @param {String|Boolean|Array} paths
	* @return {SendStream}
	* @api public
	*/
	SendStream.prototype.index = deprecate.function(function index(paths) {
		var index = !paths ? [] : normalizeList(paths, "paths argument");
		debug("index %o", paths);
		this._index = index;
		return this;
	}, "send.index: pass index as option");
	/**
	* Set root `path`.
	*
	* @param {String} path
	* @return {SendStream}
	* @api public
	*/
	SendStream.prototype.root = function root(path) {
		this._root = resolve(String(path));
		debug("root %s", this._root);
		return this;
	};
	SendStream.prototype.from = deprecate.function(SendStream.prototype.root, "send.from: pass root as option");
	SendStream.prototype.root = deprecate.function(SendStream.prototype.root, "send.root: pass root as option");
	/**
	* Set max-age to `maxAge`.
	*
	* @param {Number} maxAge
	* @return {SendStream}
	* @api public
	*/
	SendStream.prototype.maxage = deprecate.function(function maxage(maxAge) {
		this._maxage = typeof maxAge === "string" ? ms(maxAge) : Number(maxAge);
		this._maxage = !isNaN(this._maxage) ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE) : 0;
		debug("max-age %d", this._maxage);
		return this;
	}, "send.maxage: pass maxAge as option");
	/**
	* Emit error with `status`.
	*
	* @param {number} status
	* @param {Error} [err]
	* @private
	*/
	SendStream.prototype.error = function error(status, err) {
		if (hasListeners(this, "error")) return this.emit("error", createHttpError(status, err));
		var res = this.res;
		var doc = createHtmlDocument("Error", escapeHtml(statuses.message[status] || String(status)));
		clearHeaders(res);
		if (err && err.headers) setHeaders(res, err.headers);
		res.statusCode = status;
		res.setHeader("Content-Type", "text/html; charset=UTF-8");
		res.setHeader("Content-Length", Buffer.byteLength(doc));
		res.setHeader("Content-Security-Policy", "default-src 'none'");
		res.setHeader("X-Content-Type-Options", "nosniff");
		res.end(doc);
	};
	/**
	* Check if the pathname ends with "/".
	*
	* @return {boolean}
	* @private
	*/
	SendStream.prototype.hasTrailingSlash = function hasTrailingSlash() {
		return this.path[this.path.length - 1] === "/";
	};
	/**
	* Check if this is a conditional GET request.
	*
	* @return {Boolean}
	* @api private
	*/
	SendStream.prototype.isConditionalGET = function isConditionalGET() {
		return this.req.headers["if-match"] || this.req.headers["if-unmodified-since"] || this.req.headers["if-none-match"] || this.req.headers["if-modified-since"];
	};
	/**
	* Check if the request preconditions failed.
	*
	* @return {boolean}
	* @private
	*/
	SendStream.prototype.isPreconditionFailure = function isPreconditionFailure() {
		var req = this.req;
		var res = this.res;
		var match = req.headers["if-match"];
		if (match) {
			var etag = res.getHeader("ETag");
			return !etag || match !== "*" && parseTokenList(match).every(function(match) {
				return match !== etag && match !== "W/" + etag && "W/" + match !== etag;
			});
		}
		var unmodifiedSince = parseHttpDate(req.headers["if-unmodified-since"]);
		if (!isNaN(unmodifiedSince)) {
			var lastModified = parseHttpDate(res.getHeader("Last-Modified"));
			return isNaN(lastModified) || lastModified > unmodifiedSince;
		}
		return false;
	};
	/**
	* Strip various content header fields for a change in entity.
	*
	* @private
	*/
	SendStream.prototype.removeContentHeaderFields = function removeContentHeaderFields() {
		var res = this.res;
		res.removeHeader("Content-Encoding");
		res.removeHeader("Content-Language");
		res.removeHeader("Content-Length");
		res.removeHeader("Content-Range");
		res.removeHeader("Content-Type");
	};
	/**
	* Respond with 304 not modified.
	*
	* @api private
	*/
	SendStream.prototype.notModified = function notModified() {
		var res = this.res;
		debug("not modified");
		this.removeContentHeaderFields();
		res.statusCode = 304;
		res.end();
	};
	/**
	* Raise error that headers already sent.
	*
	* @api private
	*/
	SendStream.prototype.headersAlreadySent = function headersAlreadySent() {
		var err = /* @__PURE__ */ new Error("Can't set headers after they are sent.");
		debug("headers already sent");
		this.error(500, err);
	};
	/**
	* Check if the request is cacheable, aka
	* responded with 2xx or 304 (see RFC 2616 section 14.2{5,6}).
	*
	* @return {Boolean}
	* @api private
	*/
	SendStream.prototype.isCachable = function isCachable() {
		var statusCode = this.res.statusCode;
		return statusCode >= 200 && statusCode < 300 || statusCode === 304;
	};
	/**
	* Handle stat() error.
	*
	* @param {Error} error
	* @private
	*/
	SendStream.prototype.onStatError = function onStatError(error) {
		switch (error.code) {
			case "ENAMETOOLONG":
			case "ENOENT":
			case "ENOTDIR":
				this.error(404, error);
				break;
			default:
				this.error(500, error);
				break;
		}
	};
	/**
	* Check if the cache is fresh.
	*
	* @return {Boolean}
	* @api private
	*/
	SendStream.prototype.isFresh = function isFresh() {
		return fresh(this.req.headers, {
			etag: this.res.getHeader("ETag"),
			"last-modified": this.res.getHeader("Last-Modified")
		});
	};
	/**
	* Check if the range is fresh.
	*
	* @return {Boolean}
	* @api private
	*/
	SendStream.prototype.isRangeFresh = function isRangeFresh() {
		var ifRange = this.req.headers["if-range"];
		if (!ifRange) return true;
		if (ifRange.indexOf("\"") !== -1) {
			var etag = this.res.getHeader("ETag");
			return Boolean(etag && ifRange.indexOf(etag) !== -1);
		}
		return parseHttpDate(this.res.getHeader("Last-Modified")) <= parseHttpDate(ifRange);
	};
	/**
	* Redirect to path.
	*
	* @param {string} path
	* @private
	*/
	SendStream.prototype.redirect = function redirect(path) {
		var res = this.res;
		if (hasListeners(this, "directory")) {
			this.emit("directory", res, path);
			return;
		}
		if (this.hasTrailingSlash()) {
			this.error(403);
			return;
		}
		var loc = encodeUrl(collapseLeadingSlashes(this.path + "/"));
		var doc = createHtmlDocument("Redirecting", "Redirecting to " + escapeHtml(loc));
		res.statusCode = 301;
		res.setHeader("Content-Type", "text/html; charset=UTF-8");
		res.setHeader("Content-Length", Buffer.byteLength(doc));
		res.setHeader("Content-Security-Policy", "default-src 'none'");
		res.setHeader("X-Content-Type-Options", "nosniff");
		res.setHeader("Location", loc);
		res.end(doc);
	};
	/**
	* Pipe to `res.
	*
	* @param {Stream} res
	* @return {Stream} res
	* @api public
	*/
	SendStream.prototype.pipe = function pipe(res) {
		var root = this._root;
		this.res = res;
		var path = decode(this.path);
		if (path === -1) {
			this.error(400);
			return res;
		}
		if (~path.indexOf("\0")) {
			this.error(400);
			return res;
		}
		var parts;
		if (root !== null) {
			if (path) path = normalize("." + sep + path);
			if (UP_PATH_REGEXP.test(path)) {
				debug("malicious path \"%s\"", path);
				this.error(403);
				return res;
			}
			parts = path.split(sep);
			path = normalize(join(root, path));
		} else {
			if (UP_PATH_REGEXP.test(path)) {
				debug("malicious path \"%s\"", path);
				this.error(403);
				return res;
			}
			parts = normalize(path).split(sep);
			path = resolve(path);
		}
		if (containsDotFile(parts)) {
			var access = this._dotfiles;
			if (access === void 0) access = parts[parts.length - 1][0] === "." ? this._hidden ? "allow" : "ignore" : "allow";
			debug("%s dotfile \"%s\"", access, path);
			switch (access) {
				case "allow": break;
				case "deny":
					this.error(403);
					return res;
				default:
					this.error(404);
					return res;
			}
		}
		if (this._index.length && this.hasTrailingSlash()) {
			this.sendIndex(path);
			return res;
		}
		this.sendFile(path);
		return res;
	};
	/**
	* Transfer `path`.
	*
	* @param {String} path
	* @api public
	*/
	SendStream.prototype.send = function send(path, stat) {
		var len = stat.size;
		var options = this.options;
		var opts = {};
		var res = this.res;
		var req = this.req;
		var ranges = req.headers.range;
		var offset = options.start || 0;
		if (headersSent(res)) {
			this.headersAlreadySent();
			return;
		}
		debug("pipe \"%s\"", path);
		this.setHeader(path, stat);
		this.type(path);
		if (this.isConditionalGET()) {
			if (this.isPreconditionFailure()) {
				this.error(412);
				return;
			}
			if (this.isCachable() && this.isFresh()) {
				this.notModified();
				return;
			}
		}
		len = Math.max(0, len - offset);
		if (options.end !== void 0) {
			var bytes = options.end - offset + 1;
			if (len > bytes) len = bytes;
		}
		if (this._acceptRanges && BYTES_RANGE_REGEXP.test(ranges)) {
			ranges = parseRange(len, ranges, { combine: true });
			if (!this.isRangeFresh()) {
				debug("range stale");
				ranges = -2;
			}
			if (ranges === -1) {
				debug("range unsatisfiable");
				res.setHeader("Content-Range", contentRange("bytes", len));
				return this.error(416, { headers: { "Content-Range": res.getHeader("Content-Range") } });
			}
			if (ranges !== -2 && ranges.length === 1) {
				debug("range %j", ranges);
				res.statusCode = 206;
				res.setHeader("Content-Range", contentRange("bytes", len, ranges[0]));
				offset += ranges[0].start;
				len = ranges[0].end - ranges[0].start + 1;
			}
		}
		for (var prop in options) opts[prop] = options[prop];
		opts.start = offset;
		opts.end = Math.max(offset, offset + len - 1);
		res.setHeader("Content-Length", len);
		if (req.method === "HEAD") {
			res.end();
			return;
		}
		this.stream(path, opts);
	};
	/**
	* Transfer file for `path`.
	*
	* @param {String} path
	* @api private
	*/
	SendStream.prototype.sendFile = function sendFile(path) {
		var i = 0;
		var self = this;
		debug("stat \"%s\"", path);
		fs.stat(path, function onstat(err, stat) {
			if (err && err.code === "ENOENT" && !extname(path) && path[path.length - 1] !== sep) return next(err);
			if (err) return self.onStatError(err);
			if (stat.isDirectory()) return self.redirect(path);
			self.emit("file", path, stat);
			self.send(path, stat);
		});
		function next(err) {
			if (self._extensions.length <= i) return err ? self.onStatError(err) : self.error(404);
			var p = path + "." + self._extensions[i++];
			debug("stat \"%s\"", p);
			fs.stat(p, function(err, stat) {
				if (err) return next(err);
				if (stat.isDirectory()) return next();
				self.emit("file", p, stat);
				self.send(p, stat);
			});
		}
	};
	/**
	* Transfer index for `path`.
	*
	* @param {String} path
	* @api private
	*/
	SendStream.prototype.sendIndex = function sendIndex(path) {
		var i = -1;
		var self = this;
		function next(err) {
			if (++i >= self._index.length) {
				if (err) return self.onStatError(err);
				return self.error(404);
			}
			var p = join(path, self._index[i]);
			debug("stat \"%s\"", p);
			fs.stat(p, function(err, stat) {
				if (err) return next(err);
				if (stat.isDirectory()) return next();
				self.emit("file", p, stat);
				self.send(p, stat);
			});
		}
		next();
	};
	/**
	* Stream `path` to the response.
	*
	* @param {String} path
	* @param {Object} options
	* @api private
	*/
	SendStream.prototype.stream = function stream(path, options) {
		var self = this;
		var res = this.res;
		var stream = fs.createReadStream(path, options);
		this.emit("stream", stream);
		stream.pipe(res);
		function cleanup() {
			destroy(stream, true);
		}
		onFinished(res, cleanup);
		stream.on("error", function onerror(err) {
			cleanup();
			self.onStatError(err);
		});
		stream.on("end", function onend() {
			self.emit("end");
		});
	};
	/**
	* Set content-type based on `path`
	* if it hasn't been explicitly set.
	*
	* @param {String} path
	* @api private
	*/
	SendStream.prototype.type = function type(path) {
		var res = this.res;
		if (res.getHeader("Content-Type")) return;
		var type = mime.lookup(path);
		if (!type) {
			debug("no content-type");
			return;
		}
		var charset = mime.charsets.lookup(type);
		debug("content-type %s", type);
		res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
	};
	/**
	* Set response header fields, most
	* fields may be pre-defined.
	*
	* @param {String} path
	* @param {Object} stat
	* @api private
	*/
	SendStream.prototype.setHeader = function setHeader(path, stat) {
		var res = this.res;
		this.emit("headers", res, path, stat);
		if (this._acceptRanges && !res.getHeader("Accept-Ranges")) {
			debug("accept ranges");
			res.setHeader("Accept-Ranges", "bytes");
		}
		if (this._cacheControl && !res.getHeader("Cache-Control")) {
			var cacheControl = "public, max-age=" + Math.floor(this._maxage / 1e3);
			if (this._immutable) cacheControl += ", immutable";
			debug("cache-control %s", cacheControl);
			res.setHeader("Cache-Control", cacheControl);
		}
		if (this._lastModified && !res.getHeader("Last-Modified")) {
			var modified = stat.mtime.toUTCString();
			debug("modified %s", modified);
			res.setHeader("Last-Modified", modified);
		}
		if (this._etag && !res.getHeader("ETag")) {
			var val = etag(stat);
			debug("etag %s", val);
			res.setHeader("ETag", val);
		}
	};
	/**
	* Clear all headers from a response.
	*
	* @param {object} res
	* @private
	*/
	function clearHeaders(res) {
		var headers = getHeaderNames(res);
		for (var i = 0; i < headers.length; i++) res.removeHeader(headers[i]);
	}
	/**
	* Collapse all leading slashes into a single slash
	*
	* @param {string} str
	* @private
	*/
	function collapseLeadingSlashes(str) {
		for (var i = 0; i < str.length; i++) if (str[i] !== "/") break;
		return i > 1 ? "/" + str.substr(i) : str;
	}
	/**
	* Determine if path parts contain a dotfile.
	*
	* @api private
	*/
	function containsDotFile(parts) {
		for (var i = 0; i < parts.length; i++) {
			var part = parts[i];
			if (part.length > 1 && part[0] === ".") return true;
		}
		return false;
	}
	/**
	* Create a Content-Range header.
	*
	* @param {string} type
	* @param {number} size
	* @param {array} [range]
	*/
	function contentRange(type, size, range) {
		return type + " " + (range ? range.start + "-" + range.end : "*") + "/" + size;
	}
	/**
	* Create a minimal HTML document.
	*
	* @param {string} title
	* @param {string} body
	* @private
	*/
	function createHtmlDocument(title, body) {
		return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>" + title + "</title>\n</head>\n<body>\n<pre>" + body + "</pre>\n</body>\n</html>\n";
	}
	/**
	* Create a HttpError object from simple arguments.
	*
	* @param {number} status
	* @param {Error|object} err
	* @private
	*/
	function createHttpError(status, err) {
		if (!err) return createError(status);
		return err instanceof Error ? createError(status, err, { expose: false }) : createError(status, err);
	}
	/**
	* decodeURIComponent.
	*
	* Allows V8 to only deoptimize this fn instead of all
	* of send().
	*
	* @param {String} path
	* @api private
	*/
	function decode(path) {
		try {
			return decodeURIComponent(path);
		} catch (err) {
			return -1;
		}
	}
	/**
	* Get the header names on a respnse.
	*
	* @param {object} res
	* @returns {array[string]}
	* @private
	*/
	function getHeaderNames(res) {
		return typeof res.getHeaderNames !== "function" ? Object.keys(res._headers || {}) : res.getHeaderNames();
	}
	/**
	* Determine if emitter has listeners of a given type.
	*
	* The way to do this check is done three different ways in Node.js >= 0.8
	* so this consolidates them into a minimal set using instance methods.
	*
	* @param {EventEmitter} emitter
	* @param {string} type
	* @returns {boolean}
	* @private
	*/
	function hasListeners(emitter, type) {
		return (typeof emitter.listenerCount !== "function" ? emitter.listeners(type).length : emitter.listenerCount(type)) > 0;
	}
	/**
	* Determine if the response headers have been sent.
	*
	* @param {object} res
	* @returns {boolean}
	* @private
	*/
	function headersSent(res) {
		return typeof res.headersSent !== "boolean" ? Boolean(res._header) : res.headersSent;
	}
	/**
	* Normalize the index option into an array.
	*
	* @param {boolean|string|array} val
	* @param {string} name
	* @private
	*/
	function normalizeList(val, name) {
		var list = [].concat(val || []);
		for (var i = 0; i < list.length; i++) if (typeof list[i] !== "string") throw new TypeError(name + " must be array of strings or false");
		return list;
	}
	/**
	* Parse an HTTP Date into a number.
	*
	* @param {string} date
	* @private
	*/
	function parseHttpDate(date) {
		var timestamp = date && Date.parse(date);
		return typeof timestamp === "number" ? timestamp : NaN;
	}
	/**
	* Parse a HTTP token list.
	*
	* @param {string} str
	* @private
	*/
	function parseTokenList(str) {
		var end = 0;
		var list = [];
		var start = 0;
		for (var i = 0, len = str.length; i < len; i++) switch (str.charCodeAt(i)) {
			case 32:
				if (start === end) start = end = i + 1;
				break;
			case 44:
				if (start !== end) list.push(str.substring(start, end));
				start = end = i + 1;
				break;
			default:
				end = i + 1;
				break;
		}
		if (start !== end) list.push(str.substring(start, end));
		return list;
	}
	/**
	* Set an object of headers on a response.
	*
	* @param {object} res
	* @param {object} headers
	* @private
	*/
	function setHeaders(res, headers) {
		var keys = Object.keys(headers);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			res.setHeader(key, headers[key]);
		}
	}
}));
//#endregion
//#region node_modules/forwarded/index.js
/*!
* forwarded
* Copyright(c) 2014-2017 Douglas Christopher Wilson
* MIT Licensed
*/
var require_forwarded = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module exports.
	* @public
	*/
	module.exports = forwarded;
	/**
	* Get all addresses in the request, using the `X-Forwarded-For` header.
	*
	* @param {object} req
	* @return {array}
	* @public
	*/
	function forwarded(req) {
		if (!req) throw new TypeError("argument req is required");
		var proxyAddrs = parse(req.headers["x-forwarded-for"] || "");
		return [getSocketAddr(req)].concat(proxyAddrs);
	}
	/**
	* Get the socket address for a request.
	*
	* @param {object} req
	* @return {string}
	* @private
	*/
	function getSocketAddr(req) {
		return req.socket ? req.socket.remoteAddress : req.connection.remoteAddress;
	}
	/**
	* Parse the X-Forwarded-For header.
	*
	* @param {string} header
	* @private
	*/
	function parse(header) {
		var end = header.length;
		var list = [];
		var start = header.length;
		for (var i = header.length - 1; i >= 0; i--) switch (header.charCodeAt(i)) {
			case 32:
				if (start === end) start = end = i;
				break;
			case 44:
				if (start !== end) list.push(header.substring(start, end));
				start = end = i;
				break;
			default:
				start = i;
				break;
		}
		if (start !== end) list.push(header.substring(start, end));
		return list;
	}
}));
//#endregion
//#region node_modules/ipaddr.js/lib/ipaddr.js
var require_ipaddr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var expandIPv6, ipaddr = {}, ipv4Part, ipv4Regexes, ipv6Part, ipv6Regexes, matchCIDR, root = this, zoneIndex;
		if (typeof module !== "undefined" && module !== null && module.exports) module.exports = ipaddr;
		else root["ipaddr"] = ipaddr;
		matchCIDR = function(first, second, partSize, cidrBits) {
			var part, shift;
			if (first.length !== second.length) throw new Error("ipaddr: cannot match CIDR for objects with different lengths");
			part = 0;
			while (cidrBits > 0) {
				shift = partSize - cidrBits;
				if (shift < 0) shift = 0;
				if (first[part] >> shift !== second[part] >> shift) return false;
				cidrBits -= partSize;
				part += 1;
			}
			return true;
		};
		ipaddr.subnetMatch = function(address, rangeList, defaultName) {
			var k, len, rangeName, rangeSubnets, subnet;
			if (defaultName == null) defaultName = "unicast";
			for (rangeName in rangeList) {
				rangeSubnets = rangeList[rangeName];
				if (rangeSubnets[0] && !(rangeSubnets[0] instanceof Array)) rangeSubnets = [rangeSubnets];
				for (k = 0, len = rangeSubnets.length; k < len; k++) {
					subnet = rangeSubnets[k];
					if (address.kind() === subnet[0].kind()) {
						if (address.match.apply(address, subnet)) return rangeName;
					}
				}
			}
			return defaultName;
		};
		ipaddr.IPv4 = (function() {
			function IPv4(octets) {
				var k, len, octet;
				if (octets.length !== 4) throw new Error("ipaddr: ipv4 octet count should be 4");
				for (k = 0, len = octets.length; k < len; k++) {
					octet = octets[k];
					if (!(0 <= octet && octet <= 255)) throw new Error("ipaddr: ipv4 octet should fit in 8 bits");
				}
				this.octets = octets;
			}
			IPv4.prototype.kind = function() {
				return "ipv4";
			};
			IPv4.prototype.toString = function() {
				return this.octets.join(".");
			};
			IPv4.prototype.toNormalizedString = function() {
				return this.toString();
			};
			IPv4.prototype.toByteArray = function() {
				return this.octets.slice(0);
			};
			IPv4.prototype.match = function(other, cidrRange) {
				var ref;
				if (cidrRange === void 0) ref = other, other = ref[0], cidrRange = ref[1];
				if (other.kind() !== "ipv4") throw new Error("ipaddr: cannot match ipv4 address with non-ipv4 one");
				return matchCIDR(this.octets, other.octets, 8, cidrRange);
			};
			IPv4.prototype.SpecialRanges = {
				unspecified: [[new IPv4([
					0,
					0,
					0,
					0
				]), 8]],
				broadcast: [[new IPv4([
					255,
					255,
					255,
					255
				]), 32]],
				multicast: [[new IPv4([
					224,
					0,
					0,
					0
				]), 4]],
				linkLocal: [[new IPv4([
					169,
					254,
					0,
					0
				]), 16]],
				loopback: [[new IPv4([
					127,
					0,
					0,
					0
				]), 8]],
				carrierGradeNat: [[new IPv4([
					100,
					64,
					0,
					0
				]), 10]],
				"private": [
					[new IPv4([
						10,
						0,
						0,
						0
					]), 8],
					[new IPv4([
						172,
						16,
						0,
						0
					]), 12],
					[new IPv4([
						192,
						168,
						0,
						0
					]), 16]
				],
				reserved: [
					[new IPv4([
						192,
						0,
						0,
						0
					]), 24],
					[new IPv4([
						192,
						0,
						2,
						0
					]), 24],
					[new IPv4([
						192,
						88,
						99,
						0
					]), 24],
					[new IPv4([
						198,
						51,
						100,
						0
					]), 24],
					[new IPv4([
						203,
						0,
						113,
						0
					]), 24],
					[new IPv4([
						240,
						0,
						0,
						0
					]), 4]
				]
			};
			IPv4.prototype.range = function() {
				return ipaddr.subnetMatch(this, this.SpecialRanges);
			};
			IPv4.prototype.toIPv4MappedAddress = function() {
				return ipaddr.IPv6.parse("::ffff:" + this.toString());
			};
			IPv4.prototype.prefixLengthFromSubnetMask = function() {
				var cidr, i, k, octet, stop, zeros, zerotable = {
					0: 8,
					128: 7,
					192: 6,
					224: 5,
					240: 4,
					248: 3,
					252: 2,
					254: 1,
					255: 0
				};
				cidr = 0;
				stop = false;
				for (i = k = 3; k >= 0; i = k += -1) {
					octet = this.octets[i];
					if (octet in zerotable) {
						zeros = zerotable[octet];
						if (stop && zeros !== 0) return null;
						if (zeros !== 8) stop = true;
						cidr += zeros;
					} else return null;
				}
				return 32 - cidr;
			};
			return IPv4;
		})();
		ipv4Part = "(0?\\d+|0x[a-f0-9]+)";
		ipv4Regexes = {
			fourOctet: new RegExp("^" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$", "i"),
			longValue: new RegExp("^" + ipv4Part + "$", "i")
		};
		ipaddr.IPv4.parser = function(string) {
			var match, parseIntAuto = function(string) {
				if (string[0] === "0" && string[1] !== "x") return parseInt(string, 8);
				else return parseInt(string);
			}, part, shift, value;
			if (match = string.match(ipv4Regexes.fourOctet)) return (function() {
				var k, len, ref = match.slice(1, 6), results = [];
				for (k = 0, len = ref.length; k < len; k++) {
					part = ref[k];
					results.push(parseIntAuto(part));
				}
				return results;
			})();
			else if (match = string.match(ipv4Regexes.longValue)) {
				value = parseIntAuto(match[1]);
				if (value > 4294967295 || value < 0) throw new Error("ipaddr: address outside defined range");
				return (function() {
					var k, results = [];
					for (shift = k = 0; k <= 24; shift = k += 8) results.push(value >> shift & 255);
					return results;
				})().reverse();
			} else return null;
		};
		ipaddr.IPv6 = (function() {
			function IPv6(parts, zoneId) {
				var i, k, l, len, part, ref;
				if (parts.length === 16) {
					this.parts = [];
					for (i = k = 0; k <= 14; i = k += 2) this.parts.push(parts[i] << 8 | parts[i + 1]);
				} else if (parts.length === 8) this.parts = parts;
				else throw new Error("ipaddr: ipv6 part count should be 8 or 16");
				ref = this.parts;
				for (l = 0, len = ref.length; l < len; l++) {
					part = ref[l];
					if (!(0 <= part && part <= 65535)) throw new Error("ipaddr: ipv6 part should fit in 16 bits");
				}
				if (zoneId) this.zoneId = zoneId;
			}
			IPv6.prototype.kind = function() {
				return "ipv6";
			};
			IPv6.prototype.toString = function() {
				return this.toNormalizedString().replace(/((^|:)(0(:|$))+)/, "::");
			};
			IPv6.prototype.toRFC5952String = function() {
				var bestMatchIndex, bestMatchLength, match, regex = /((^|:)(0(:|$)){2,})/g, string = this.toNormalizedString();
				bestMatchIndex = 0;
				bestMatchLength = -1;
				while (match = regex.exec(string)) if (match[0].length > bestMatchLength) {
					bestMatchIndex = match.index;
					bestMatchLength = match[0].length;
				}
				if (bestMatchLength < 0) return string;
				return string.substring(0, bestMatchIndex) + "::" + string.substring(bestMatchIndex + bestMatchLength);
			};
			IPv6.prototype.toByteArray = function() {
				var bytes = [], k, len, part, ref = this.parts;
				for (k = 0, len = ref.length; k < len; k++) {
					part = ref[k];
					bytes.push(part >> 8);
					bytes.push(part & 255);
				}
				return bytes;
			};
			IPv6.prototype.toNormalizedString = function() {
				var addr = (function() {
					var k, len, ref = this.parts, results = [];
					for (k = 0, len = ref.length; k < len; k++) {
						part = ref[k];
						results.push(part.toString(16));
					}
					return results;
				}).call(this).join(":"), part, suffix = "";
				if (this.zoneId) suffix = "%" + this.zoneId;
				return addr + suffix;
			};
			IPv6.prototype.toFixedLengthString = function() {
				var addr = (function() {
					var k, len, ref = this.parts, results = [];
					for (k = 0, len = ref.length; k < len; k++) {
						part = ref[k];
						results.push(part.toString(16).padStart(4, "0"));
					}
					return results;
				}).call(this).join(":"), part, suffix = "";
				if (this.zoneId) suffix = "%" + this.zoneId;
				return addr + suffix;
			};
			IPv6.prototype.match = function(other, cidrRange) {
				var ref;
				if (cidrRange === void 0) ref = other, other = ref[0], cidrRange = ref[1];
				if (other.kind() !== "ipv6") throw new Error("ipaddr: cannot match ipv6 address with non-ipv6 one");
				return matchCIDR(this.parts, other.parts, 16, cidrRange);
			};
			IPv6.prototype.SpecialRanges = {
				unspecified: [new IPv6([
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 128],
				linkLocal: [new IPv6([
					65152,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 10],
				multicast: [new IPv6([
					65280,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 8],
				loopback: [new IPv6([
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					1
				]), 128],
				uniqueLocal: [new IPv6([
					64512,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 7],
				ipv4Mapped: [new IPv6([
					0,
					0,
					0,
					0,
					0,
					65535,
					0,
					0
				]), 96],
				rfc6145: [new IPv6([
					0,
					0,
					0,
					0,
					65535,
					0,
					0,
					0
				]), 96],
				rfc6052: [new IPv6([
					100,
					65435,
					0,
					0,
					0,
					0,
					0,
					0
				]), 96],
				"6to4": [new IPv6([
					8194,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 16],
				teredo: [new IPv6([
					8193,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 32],
				reserved: [[new IPv6([
					8193,
					3512,
					0,
					0,
					0,
					0,
					0,
					0
				]), 32]]
			};
			IPv6.prototype.range = function() {
				return ipaddr.subnetMatch(this, this.SpecialRanges);
			};
			IPv6.prototype.isIPv4MappedAddress = function() {
				return this.range() === "ipv4Mapped";
			};
			IPv6.prototype.toIPv4Address = function() {
				var high, low, ref;
				if (!this.isIPv4MappedAddress()) throw new Error("ipaddr: trying to convert a generic ipv6 address to ipv4");
				ref = this.parts.slice(-2), high = ref[0], low = ref[1];
				return new ipaddr.IPv4([
					high >> 8,
					high & 255,
					low >> 8,
					low & 255
				]);
			};
			IPv6.prototype.prefixLengthFromSubnetMask = function() {
				var cidr, i, k, part, stop, zeros, zerotable = {
					0: 16,
					32768: 15,
					49152: 14,
					57344: 13,
					61440: 12,
					63488: 11,
					64512: 10,
					65024: 9,
					65280: 8,
					65408: 7,
					65472: 6,
					65504: 5,
					65520: 4,
					65528: 3,
					65532: 2,
					65534: 1,
					65535: 0
				};
				cidr = 0;
				stop = false;
				for (i = k = 7; k >= 0; i = k += -1) {
					part = this.parts[i];
					if (part in zerotable) {
						zeros = zerotable[part];
						if (stop && zeros !== 0) return null;
						if (zeros !== 16) stop = true;
						cidr += zeros;
					} else return null;
				}
				return 128 - cidr;
			};
			return IPv6;
		})();
		ipv6Part = "(?:[0-9a-f]+::?)+";
		zoneIndex = "%[0-9a-z]{1,}";
		ipv6Regexes = {
			zoneIndex: new RegExp(zoneIndex, "i"),
			"native": new RegExp("^(::)?(" + ipv6Part + ")?([0-9a-f]+)?(::)?(" + zoneIndex + ")?$", "i"),
			transitional: new RegExp("^((?:" + ipv6Part + ")|(?:::)(?:" + ipv6Part + ")?)" + (ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part) + ("(" + zoneIndex + ")?$"), "i")
		};
		expandIPv6 = function(string, parts) {
			var colonCount, lastColon, part, replacement, replacementCount, zoneId;
			if (string.indexOf("::") !== string.lastIndexOf("::")) return null;
			zoneId = (string.match(ipv6Regexes["zoneIndex"]) || [])[0];
			if (zoneId) {
				zoneId = zoneId.substring(1);
				string = string.replace(/%.+$/, "");
			}
			colonCount = 0;
			lastColon = -1;
			while ((lastColon = string.indexOf(":", lastColon + 1)) >= 0) colonCount++;
			if (string.substr(0, 2) === "::") colonCount--;
			if (string.substr(-2, 2) === "::") colonCount--;
			if (colonCount > parts) return null;
			replacementCount = parts - colonCount;
			replacement = ":";
			while (replacementCount--) replacement += "0:";
			string = string.replace("::", replacement);
			if (string[0] === ":") string = string.slice(1);
			if (string[string.length - 1] === ":") string = string.slice(0, -1);
			parts = (function() {
				var k, len, ref = string.split(":"), results = [];
				for (k = 0, len = ref.length; k < len; k++) {
					part = ref[k];
					results.push(parseInt(part, 16));
				}
				return results;
			})();
			return {
				parts,
				zoneId
			};
		};
		ipaddr.IPv6.parser = function(string) {
			var addr, k, len, match, octet, octets, zoneId;
			if (ipv6Regexes["native"].test(string)) return expandIPv6(string, 8);
			else if (match = string.match(ipv6Regexes["transitional"])) {
				zoneId = match[6] || "";
				addr = expandIPv6(match[1].slice(0, -1) + zoneId, 6);
				if (addr.parts) {
					octets = [
						parseInt(match[2]),
						parseInt(match[3]),
						parseInt(match[4]),
						parseInt(match[5])
					];
					for (k = 0, len = octets.length; k < len; k++) {
						octet = octets[k];
						if (!(0 <= octet && octet <= 255)) return null;
					}
					addr.parts.push(octets[0] << 8 | octets[1]);
					addr.parts.push(octets[2] << 8 | octets[3]);
					return {
						parts: addr.parts,
						zoneId: addr.zoneId
					};
				}
			}
			return null;
		};
		ipaddr.IPv4.isIPv4 = ipaddr.IPv6.isIPv6 = function(string) {
			return this.parser(string) !== null;
		};
		ipaddr.IPv4.isValid = function(string) {
			try {
				new this(this.parser(string));
				return true;
			} catch (error1) {
				return false;
			}
		};
		ipaddr.IPv4.isValidFourPartDecimal = function(string) {
			if (ipaddr.IPv4.isValid(string) && string.match(/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){3}$/)) return true;
			else return false;
		};
		ipaddr.IPv6.isValid = function(string) {
			var addr;
			if (typeof string === "string" && string.indexOf(":") === -1) return false;
			try {
				addr = this.parser(string);
				new this(addr.parts, addr.zoneId);
				return true;
			} catch (error1) {
				return false;
			}
		};
		ipaddr.IPv4.parse = function(string) {
			var parts = this.parser(string);
			if (parts === null) throw new Error("ipaddr: string is not formatted like ip address");
			return new this(parts);
		};
		ipaddr.IPv6.parse = function(string) {
			var addr = this.parser(string);
			if (addr.parts === null) throw new Error("ipaddr: string is not formatted like ip address");
			return new this(addr.parts, addr.zoneId);
		};
		ipaddr.IPv4.parseCIDR = function(string) {
			var maskLength, match, parsed;
			if (match = string.match(/^(.+)\/(\d+)$/)) {
				maskLength = parseInt(match[2]);
				if (maskLength >= 0 && maskLength <= 32) {
					parsed = [this.parse(match[1]), maskLength];
					Object.defineProperty(parsed, "toString", { value: function() {
						return this.join("/");
					} });
					return parsed;
				}
			}
			throw new Error("ipaddr: string is not formatted like an IPv4 CIDR range");
		};
		ipaddr.IPv4.subnetMaskFromPrefixLength = function(prefix) {
			var filledOctetCount, j, octets;
			prefix = parseInt(prefix);
			if (prefix < 0 || prefix > 32) throw new Error("ipaddr: invalid IPv4 prefix length");
			octets = [
				0,
				0,
				0,
				0
			];
			j = 0;
			filledOctetCount = Math.floor(prefix / 8);
			while (j < filledOctetCount) {
				octets[j] = 255;
				j++;
			}
			if (filledOctetCount < 4) octets[filledOctetCount] = Math.pow(2, prefix % 8) - 1 << 8 - prefix % 8;
			return new this(octets);
		};
		ipaddr.IPv4.broadcastAddressFromCIDR = function(string) {
			var cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;
			try {
				cidr = this.parseCIDR(string);
				ipInterfaceOctets = cidr[0].toByteArray();
				subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
				octets = [];
				i = 0;
				while (i < 4) {
					octets.push(parseInt(ipInterfaceOctets[i], 10) | parseInt(subnetMaskOctets[i], 10) ^ 255);
					i++;
				}
				return new this(octets);
			} catch (error1) {
				throw new Error("ipaddr: the address does not have IPv4 CIDR format");
			}
		};
		ipaddr.IPv4.networkAddressFromCIDR = function(string) {
			var cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;
			try {
				cidr = this.parseCIDR(string);
				ipInterfaceOctets = cidr[0].toByteArray();
				subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
				octets = [];
				i = 0;
				while (i < 4) {
					octets.push(parseInt(ipInterfaceOctets[i], 10) & parseInt(subnetMaskOctets[i], 10));
					i++;
				}
				return new this(octets);
			} catch (error1) {
				throw new Error("ipaddr: the address does not have IPv4 CIDR format");
			}
		};
		ipaddr.IPv6.parseCIDR = function(string) {
			var maskLength, match, parsed;
			if (match = string.match(/^(.+)\/(\d+)$/)) {
				maskLength = parseInt(match[2]);
				if (maskLength >= 0 && maskLength <= 128) {
					parsed = [this.parse(match[1]), maskLength];
					Object.defineProperty(parsed, "toString", { value: function() {
						return this.join("/");
					} });
					return parsed;
				}
			}
			throw new Error("ipaddr: string is not formatted like an IPv6 CIDR range");
		};
		ipaddr.isValid = function(string) {
			return ipaddr.IPv6.isValid(string) || ipaddr.IPv4.isValid(string);
		};
		ipaddr.parse = function(string) {
			if (ipaddr.IPv6.isValid(string)) return ipaddr.IPv6.parse(string);
			else if (ipaddr.IPv4.isValid(string)) return ipaddr.IPv4.parse(string);
			else throw new Error("ipaddr: the address has neither IPv6 nor IPv4 format");
		};
		ipaddr.parseCIDR = function(string) {
			try {
				return ipaddr.IPv6.parseCIDR(string);
			} catch (error1) {
				try {
					return ipaddr.IPv4.parseCIDR(string);
				} catch (error1) {
					throw new Error("ipaddr: the address has neither IPv6 nor IPv4 CIDR format");
				}
			}
		};
		ipaddr.fromByteArray = function(bytes) {
			var length = bytes.length;
			if (length === 4) return new ipaddr.IPv4(bytes);
			else if (length === 16) return new ipaddr.IPv6(bytes);
			else throw new Error("ipaddr: the binary input is neither an IPv6 nor IPv4 address");
		};
		ipaddr.process = function(string) {
			var addr = this.parse(string);
			if (addr.kind() === "ipv6" && addr.isIPv4MappedAddress()) return addr.toIPv4Address();
			else return addr;
		};
	}).call(exports);
}));
//#endregion
//#region node_modules/proxy-addr/index.js
/*!
* proxy-addr
* Copyright(c) 2014-2016 Douglas Christopher Wilson
* MIT Licensed
*/
var require_proxy_addr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module exports.
	* @public
	*/
	module.exports = proxyaddr;
	module.exports.all = alladdrs;
	module.exports.compile = compile;
	/**
	* Module dependencies.
	* @private
	*/
	var forwarded = require_forwarded();
	var ipaddr = require_ipaddr();
	/**
	* Variables.
	* @private
	*/
	var DIGIT_REGEXP = /^[0-9]+$/;
	var isip = ipaddr.isValid;
	var parseip = ipaddr.parse;
	/**
	* Pre-defined IP ranges.
	* @private
	*/
	var IP_RANGES = {
		linklocal: ["169.254.0.0/16", "fe80::/10"],
		loopback: ["127.0.0.1/8", "::1/128"],
		uniquelocal: [
			"10.0.0.0/8",
			"172.16.0.0/12",
			"192.168.0.0/16",
			"fc00::/7"
		]
	};
	/**
	* Get all addresses in the request, optionally stopping
	* at the first untrusted.
	*
	* @param {Object} request
	* @param {Function|Array|String} [trust]
	* @public
	*/
	function alladdrs(req, trust) {
		var addrs = forwarded(req);
		if (!trust) return addrs;
		if (typeof trust !== "function") trust = compile(trust);
		for (var i = 0; i < addrs.length - 1; i++) {
			if (trust(addrs[i], i)) continue;
			addrs.length = i + 1;
		}
		return addrs;
	}
	/**
	* Compile argument into trust function.
	*
	* @param {Array|String} val
	* @private
	*/
	function compile(val) {
		if (!val) throw new TypeError("argument is required");
		var trust;
		if (typeof val === "string") trust = [val];
		else if (Array.isArray(val)) trust = val.slice();
		else throw new TypeError("unsupported trust argument");
		for (var i = 0; i < trust.length; i++) {
			val = trust[i];
			if (!Object.prototype.hasOwnProperty.call(IP_RANGES, val)) continue;
			val = IP_RANGES[val];
			trust.splice.apply(trust, [i, 1].concat(val));
			i += val.length - 1;
		}
		return compileTrust(compileRangeSubnets(trust));
	}
	/**
	* Compile `arr` elements into range subnets.
	*
	* @param {Array} arr
	* @private
	*/
	function compileRangeSubnets(arr) {
		var rangeSubnets = new Array(arr.length);
		for (var i = 0; i < arr.length; i++) rangeSubnets[i] = parseipNotation(arr[i]);
		return rangeSubnets;
	}
	/**
	* Compile range subnet array into trust function.
	*
	* @param {Array} rangeSubnets
	* @private
	*/
	function compileTrust(rangeSubnets) {
		var len = rangeSubnets.length;
		return len === 0 ? trustNone : len === 1 ? trustSingle(rangeSubnets[0]) : trustMulti(rangeSubnets);
	}
	/**
	* Parse IP notation string into range subnet.
	*
	* @param {String} note
	* @private
	*/
	function parseipNotation(note) {
		var pos = note.lastIndexOf("/");
		var str = pos !== -1 ? note.substring(0, pos) : note;
		if (!isip(str)) throw new TypeError("invalid IP address: " + str);
		var ip = parseip(str);
		if (pos === -1 && ip.kind() === "ipv6" && ip.isIPv4MappedAddress()) ip = ip.toIPv4Address();
		var max = ip.kind() === "ipv6" ? 128 : 32;
		var range = pos !== -1 ? note.substring(pos + 1, note.length) : null;
		if (range === null) range = max;
		else if (DIGIT_REGEXP.test(range)) range = parseInt(range, 10);
		else if (ip.kind() === "ipv4" && isip(range)) range = parseNetmask(range);
		else range = null;
		if (range <= 0 || range > max) throw new TypeError("invalid range on address: " + note);
		return [ip, range];
	}
	/**
	* Parse netmask string into CIDR range.
	*
	* @param {String} netmask
	* @private
	*/
	function parseNetmask(netmask) {
		var ip = parseip(netmask);
		return ip.kind() === "ipv4" ? ip.prefixLengthFromSubnetMask() : null;
	}
	/**
	* Determine address of proxied request.
	*
	* @param {Object} request
	* @param {Function|Array|String} trust
	* @public
	*/
	function proxyaddr(req, trust) {
		if (!req) throw new TypeError("req argument is required");
		if (!trust) throw new TypeError("trust argument is required");
		var addrs = alladdrs(req, trust);
		return addrs[addrs.length - 1];
	}
	/**
	* Static trust function to trust nothing.
	*
	* @private
	*/
	function trustNone() {
		return false;
	}
	/**
	* Compile trust function for multiple subnets.
	*
	* @param {Array} subnets
	* @private
	*/
	function trustMulti(subnets) {
		return function trust(addr) {
			if (!isip(addr)) return false;
			var ip = parseip(addr);
			var ipconv;
			var kind = ip.kind();
			for (var i = 0; i < subnets.length; i++) {
				var subnet = subnets[i];
				var subnetip = subnet[0];
				var subnetkind = subnetip.kind();
				var subnetrange = subnet[1];
				var trusted = ip;
				if (kind !== subnetkind) {
					if (subnetkind === "ipv4" && !ip.isIPv4MappedAddress()) continue;
					if (!ipconv) ipconv = subnetkind === "ipv4" ? ip.toIPv4Address() : ip.toIPv4MappedAddress();
					trusted = ipconv;
				}
				if (trusted.match(subnetip, subnetrange)) return true;
			}
			return false;
		};
	}
	/**
	* Compile trust function for single subnet.
	*
	* @param {Object} subnet
	* @private
	*/
	function trustSingle(subnet) {
		var subnetip = subnet[0];
		var subnetkind = subnetip.kind();
		var subnetisipv4 = subnetkind === "ipv4";
		var subnetrange = subnet[1];
		return function trust(addr) {
			if (!isip(addr)) return false;
			var ip = parseip(addr);
			if (ip.kind() !== subnetkind) {
				if (subnetisipv4 && !ip.isIPv4MappedAddress()) return false;
				ip = subnetisipv4 ? ip.toIPv4Address() : ip.toIPv4MappedAddress();
			}
			return ip.match(subnetip, subnetrange);
		};
	}
}));
//#endregion
//#region node_modules/express/lib/utils.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Module dependencies.
	* @api private
	*/
	var Buffer = require_safe_buffer().Buffer;
	var contentDisposition = require_content_disposition();
	var contentType = require_content_type();
	var deprecate = require_depd()("express");
	var flatten = require_array_flatten();
	var mime = require_send().mime;
	var etag = require_etag();
	var proxyaddr = require_proxy_addr();
	var qs = require_lib();
	var querystring = __require("querystring");
	/**
	* Return strong ETag for `body`.
	*
	* @param {String|Buffer} body
	* @param {String} [encoding]
	* @return {String}
	* @api private
	*/
	exports.etag = createETagGenerator({ weak: false });
	/**
	* Return weak ETag for `body`.
	*
	* @param {String|Buffer} body
	* @param {String} [encoding]
	* @return {String}
	* @api private
	*/
	exports.wetag = createETagGenerator({ weak: true });
	/**
	* Check if `path` looks absolute.
	*
	* @param {String} path
	* @return {Boolean}
	* @api private
	*/
	exports.isAbsolute = function(path) {
		if ("/" === path[0]) return true;
		if (":" === path[1] && ("\\" === path[2] || "/" === path[2])) return true;
		if ("\\\\" === path.substring(0, 2)) return true;
	};
	/**
	* Flatten the given `arr`.
	*
	* @param {Array} arr
	* @return {Array}
	* @api private
	*/
	exports.flatten = deprecate.function(flatten, "utils.flatten: use array-flatten npm module instead");
	/**
	* Normalize the given `type`, for example "html" becomes "text/html".
	*
	* @param {String} type
	* @return {Object}
	* @api private
	*/
	exports.normalizeType = function(type) {
		return ~type.indexOf("/") ? acceptParams(type) : {
			value: mime.lookup(type),
			params: {}
		};
	};
	/**
	* Normalize `types`, for example "html" becomes "text/html".
	*
	* @param {Array} types
	* @return {Array}
	* @api private
	*/
	exports.normalizeTypes = function(types) {
		var ret = [];
		for (var i = 0; i < types.length; ++i) ret.push(exports.normalizeType(types[i]));
		return ret;
	};
	/**
	* Generate Content-Disposition header appropriate for the filename.
	* non-ascii filenames are urlencoded and a filename* parameter is added
	*
	* @param {String} filename
	* @return {String}
	* @api private
	*/
	exports.contentDisposition = deprecate.function(contentDisposition, "utils.contentDisposition: use content-disposition npm module instead");
	/**
	* Parse accept params `str` returning an
	* object with `.value`, `.quality` and `.params`.
	*
	* @param {String} str
	* @return {Object}
	* @api private
	*/
	function acceptParams(str) {
		var parts = str.split(/ *; */);
		var ret = {
			value: parts[0],
			quality: 1,
			params: {}
		};
		for (var i = 1; i < parts.length; ++i) {
			var pms = parts[i].split(/ *= */);
			if ("q" === pms[0]) ret.quality = parseFloat(pms[1]);
			else ret.params[pms[0]] = pms[1];
		}
		return ret;
	}
	/**
	* Compile "etag" value to function.
	*
	* @param  {Boolean|String|Function} val
	* @return {Function}
	* @api private
	*/
	exports.compileETag = function(val) {
		var fn;
		if (typeof val === "function") return val;
		switch (val) {
			case true:
			case "weak":
				fn = exports.wetag;
				break;
			case false: break;
			case "strong":
				fn = exports.etag;
				break;
			default: throw new TypeError("unknown value for etag function: " + val);
		}
		return fn;
	};
	/**
	* Compile "query parser" value to function.
	*
	* @param  {String|Function} val
	* @return {Function}
	* @api private
	*/
	exports.compileQueryParser = function compileQueryParser(val) {
		var fn;
		if (typeof val === "function") return val;
		switch (val) {
			case true:
			case "simple":
				fn = querystring.parse;
				break;
			case false:
				fn = newObject;
				break;
			case "extended":
				fn = parseExtendedQueryString;
				break;
			default: throw new TypeError("unknown value for query parser function: " + val);
		}
		return fn;
	};
	/**
	* Compile "proxy trust" value to function.
	*
	* @param  {Boolean|String|Number|Array|Function} val
	* @return {Function}
	* @api private
	*/
	exports.compileTrust = function(val) {
		if (typeof val === "function") return val;
		if (val === true) return function() {
			return true;
		};
		if (typeof val === "number") return function(a, i) {
			return i < val;
		};
		if (typeof val === "string") val = val.split(",").map(function(v) {
			return v.trim();
		});
		return proxyaddr.compile(val || []);
	};
	/**
	* Set the charset in a given Content-Type string.
	*
	* @param {String} type
	* @param {String} charset
	* @return {String}
	* @api private
	*/
	exports.setCharset = function setCharset(type, charset) {
		if (!type || !charset) return type;
		var parsed = contentType.parse(type);
		parsed.parameters.charset = charset;
		return contentType.format(parsed);
	};
	/**
	* Create an ETag generator function, generating ETags with
	* the given options.
	*
	* @param {object} options
	* @return {function}
	* @private
	*/
	function createETagGenerator(options) {
		return function generateETag(body, encoding) {
			return etag(!Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body, options);
		};
	}
	/**
	* Parse an extended query string with qs.
	*
	* @param {String} str
	* @return {Object}
	* @private
	*/
	function parseExtendedQueryString(str) {
		return qs.parse(str, { allowPrototypes: true });
	}
	/**
	* Return new empty object.
	*
	* @return {Object}
	* @api private
	*/
	function newObject() {
		return {};
	}
}));
//#endregion
//#region node_modules/express/lib/application.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_application = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var finalhandler = require_finalhandler();
	var Router = require_router();
	var methods = require_methods();
	var middleware = require_init();
	var query = require_query();
	var debug = require_src()("express:application");
	var View = require_view();
	var http$2 = __require("http");
	var compileETag = require_utils().compileETag;
	var compileQueryParser = require_utils().compileQueryParser;
	var compileTrust = require_utils().compileTrust;
	var deprecate = require_depd()("express");
	var flatten = require_array_flatten();
	var merge = require_utils_merge();
	var resolve$1 = __require("path").resolve;
	var setPrototypeOf = require_setprototypeof();
	/**
	* Module variables.
	* @private
	*/
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var slice = Array.prototype.slice;
	/**
	* Application prototype.
	*/
	var app = exports = module.exports = {};
	/**
	* Variable for trust proxy inheritance back-compat
	* @private
	*/
	var trustProxyDefaultSymbol = "@@symbol:trust_proxy_default";
	/**
	* Initialize the server.
	*
	*   - setup default configuration
	*   - setup default middleware
	*   - setup route reflection methods
	*
	* @private
	*/
	app.init = function init() {
		this.cache = {};
		this.engines = {};
		this.settings = {};
		this.defaultConfiguration();
	};
	/**
	* Initialize application configuration.
	* @private
	*/
	app.defaultConfiguration = function defaultConfiguration() {
		var env = process.env.NODE_ENV || "development";
		this.enable("x-powered-by");
		this.set("etag", "weak");
		this.set("env", env);
		this.set("query parser", "extended");
		this.set("subdomain offset", 2);
		this.set("trust proxy", false);
		Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
			configurable: true,
			value: true
		});
		debug("booting in %s mode", env);
		this.on("mount", function onmount(parent) {
			if (this.settings[trustProxyDefaultSymbol] === true && typeof parent.settings["trust proxy fn"] === "function") {
				delete this.settings["trust proxy"];
				delete this.settings["trust proxy fn"];
			}
			setPrototypeOf(this.request, parent.request);
			setPrototypeOf(this.response, parent.response);
			setPrototypeOf(this.engines, parent.engines);
			setPrototypeOf(this.settings, parent.settings);
		});
		this.locals = Object.create(null);
		this.mountpath = "/";
		this.locals.settings = this.settings;
		this.set("view", View);
		this.set("views", resolve$1("views"));
		this.set("jsonp callback name", "callback");
		if (env === "production") this.enable("view cache");
		Object.defineProperty(this, "router", { get: function() {
			throw new Error("'app.router' is deprecated!\nPlease see the 3.x to 4.x migration guide for details on how to update your app.");
		} });
	};
	/**
	* lazily adds the base router if it has not yet been added.
	*
	* We cannot add the base router in the defaultConfiguration because
	* it reads app settings which might be set after that has run.
	*
	* @private
	*/
	app.lazyrouter = function lazyrouter() {
		if (!this._router) {
			this._router = new Router({
				caseSensitive: this.enabled("case sensitive routing"),
				strict: this.enabled("strict routing")
			});
			this._router.use(query(this.get("query parser fn")));
			this._router.use(middleware.init(this));
		}
	};
	/**
	* Dispatch a req, res pair into the application. Starts pipeline processing.
	*
	* If no callback is provided, then default error handlers will respond
	* in the event of an error bubbling through the stack.
	*
	* @private
	*/
	app.handle = function handle(req, res, callback) {
		var router = this._router;
		var done = callback || finalhandler(req, res, {
			env: this.get("env"),
			onerror: logerror.bind(this)
		});
		if (!router) {
			debug("no routes defined on app");
			done();
			return;
		}
		router.handle(req, res, done);
	};
	/**
	* Proxy `Router#use()` to add middleware to the app router.
	* See Router#use() documentation for details.
	*
	* If the _fn_ parameter is an express app, then it will be
	* mounted at the _route_ specified.
	*
	* @public
	*/
	app.use = function use(fn) {
		var offset = 0;
		var path = "/";
		if (typeof fn !== "function") {
			var arg = fn;
			while (Array.isArray(arg) && arg.length !== 0) arg = arg[0];
			if (typeof arg !== "function") {
				offset = 1;
				path = fn;
			}
		}
		var fns = flatten(slice.call(arguments, offset));
		if (fns.length === 0) throw new TypeError("app.use() requires a middleware function");
		this.lazyrouter();
		var router = this._router;
		fns.forEach(function(fn) {
			if (!fn || !fn.handle || !fn.set) return router.use(path, fn);
			debug(".use app under %s", path);
			fn.mountpath = path;
			fn.parent = this;
			router.use(path, function mounted_app(req, res, next) {
				var orig = req.app;
				fn.handle(req, res, function(err) {
					setPrototypeOf(req, orig.request);
					setPrototypeOf(res, orig.response);
					next(err);
				});
			});
			fn.emit("mount", this);
		}, this);
		return this;
	};
	/**
	* Proxy to the app `Router#route()`
	* Returns a new `Route` instance for the _path_.
	*
	* Routes are isolated middleware stacks for specific paths.
	* See the Route api docs for details.
	*
	* @public
	*/
	app.route = function route(path) {
		this.lazyrouter();
		return this._router.route(path);
	};
	/**
	* Register the given template engine callback `fn`
	* as `ext`.
	*
	* By default will `require()` the engine based on the
	* file extension. For example if you try to render
	* a "foo.ejs" file Express will invoke the following internally:
	*
	*     app.engine('ejs', require('ejs').__express);
	*
	* For engines that do not provide `.__express` out of the box,
	* or if you wish to "map" a different extension to the template engine
	* you may use this method. For example mapping the EJS template engine to
	* ".html" files:
	*
	*     app.engine('html', require('ejs').renderFile);
	*
	* In this case EJS provides a `.renderFile()` method with
	* the same signature that Express expects: `(path, options, callback)`,
	* though note that it aliases this method as `ejs.__express` internally
	* so if you're using ".ejs" extensions you don't need to do anything.
	*
	* Some template engines do not follow this convention, the
	* [Consolidate.js](https://github.com/tj/consolidate.js)
	* library was created to map all of node's popular template
	* engines to follow this convention, thus allowing them to
	* work seamlessly within Express.
	*
	* @param {String} ext
	* @param {Function} fn
	* @return {app} for chaining
	* @public
	*/
	app.engine = function engine(ext, fn) {
		if (typeof fn !== "function") throw new Error("callback function required");
		var extension = ext[0] !== "." ? "." + ext : ext;
		this.engines[extension] = fn;
		return this;
	};
	/**
	* Proxy to `Router#param()` with one added api feature. The _name_ parameter
	* can be an array of names.
	*
	* See the Router#param() docs for more details.
	*
	* @param {String|Array} name
	* @param {Function} fn
	* @return {app} for chaining
	* @public
	*/
	app.param = function param(name, fn) {
		this.lazyrouter();
		if (Array.isArray(name)) {
			for (var i = 0; i < name.length; i++) this.param(name[i], fn);
			return this;
		}
		this._router.param(name, fn);
		return this;
	};
	/**
	* Assign `setting` to `val`, or return `setting`'s value.
	*
	*    app.set('foo', 'bar');
	*    app.set('foo');
	*    // => "bar"
	*
	* Mounted servers inherit their parent server's settings.
	*
	* @param {String} setting
	* @param {*} [val]
	* @return {Server} for chaining
	* @public
	*/
	app.set = function set(setting, val) {
		if (arguments.length === 1) {
			var settings = this.settings;
			while (settings && settings !== Object.prototype) {
				if (hasOwnProperty.call(settings, setting)) return settings[setting];
				settings = Object.getPrototypeOf(settings);
			}
			return;
		}
		debug("set \"%s\" to %o", setting, val);
		this.settings[setting] = val;
		switch (setting) {
			case "etag":
				this.set("etag fn", compileETag(val));
				break;
			case "query parser":
				this.set("query parser fn", compileQueryParser(val));
				break;
			case "trust proxy":
				this.set("trust proxy fn", compileTrust(val));
				Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
					configurable: true,
					value: false
				});
				break;
		}
		return this;
	};
	/**
	* Return the app's absolute pathname
	* based on the parent(s) that have
	* mounted it.
	*
	* For example if the application was
	* mounted as "/admin", which itself
	* was mounted as "/blog" then the
	* return value would be "/blog/admin".
	*
	* @return {String}
	* @private
	*/
	app.path = function path() {
		return this.parent ? this.parent.path() + this.mountpath : "";
	};
	/**
	* Check if `setting` is enabled (truthy).
	*
	*    app.enabled('foo')
	*    // => false
	*
	*    app.enable('foo')
	*    app.enabled('foo')
	*    // => true
	*
	* @param {String} setting
	* @return {Boolean}
	* @public
	*/
	app.enabled = function enabled(setting) {
		return Boolean(this.set(setting));
	};
	/**
	* Check if `setting` is disabled.
	*
	*    app.disabled('foo')
	*    // => true
	*
	*    app.enable('foo')
	*    app.disabled('foo')
	*    // => false
	*
	* @param {String} setting
	* @return {Boolean}
	* @public
	*/
	app.disabled = function disabled(setting) {
		return !this.set(setting);
	};
	/**
	* Enable `setting`.
	*
	* @param {String} setting
	* @return {app} for chaining
	* @public
	*/
	app.enable = function enable(setting) {
		return this.set(setting, true);
	};
	/**
	* Disable `setting`.
	*
	* @param {String} setting
	* @return {app} for chaining
	* @public
	*/
	app.disable = function disable(setting) {
		return this.set(setting, false);
	};
	/**
	* Delegate `.VERB(...)` calls to `router.VERB(...)`.
	*/
	methods.forEach(function(method) {
		app[method] = function(path) {
			if (method === "get" && arguments.length === 1) return this.set(path);
			this.lazyrouter();
			var route = this._router.route(path);
			route[method].apply(route, slice.call(arguments, 1));
			return this;
		};
	});
	/**
	* Special-cased "all" method, applying the given route `path`,
	* middleware, and callback to _every_ HTTP method.
	*
	* @param {String} path
	* @param {Function} ...
	* @return {app} for chaining
	* @public
	*/
	app.all = function all(path) {
		this.lazyrouter();
		var route = this._router.route(path);
		var args = slice.call(arguments, 1);
		for (var i = 0; i < methods.length; i++) route[methods[i]].apply(route, args);
		return this;
	};
	app.del = deprecate.function(app.delete, "app.del: Use app.delete instead");
	/**
	* Render the given view `name` name with `options`
	* and a callback accepting an error and the
	* rendered template string.
	*
	* Example:
	*
	*    app.render('email', { name: 'Tobi' }, function(err, html){
	*      // ...
	*    })
	*
	* @param {String} name
	* @param {Object|Function} options or fn
	* @param {Function} callback
	* @public
	*/
	app.render = function render(name, options, callback) {
		var cache = this.cache;
		var done = callback;
		var engines = this.engines;
		var opts = options;
		var renderOptions = {};
		var view;
		if (typeof options === "function") {
			done = options;
			opts = {};
		}
		merge(renderOptions, this.locals);
		if (opts._locals) merge(renderOptions, opts._locals);
		merge(renderOptions, opts);
		if (renderOptions.cache == null) renderOptions.cache = this.enabled("view cache");
		if (renderOptions.cache) view = cache[name];
		if (!view) {
			view = new (this.get("view"))(name, {
				defaultEngine: this.get("view engine"),
				root: this.get("views"),
				engines
			});
			if (!view.path) {
				var dirs = Array.isArray(view.root) && view.root.length > 1 ? "directories \"" + view.root.slice(0, -1).join("\", \"") + "\" or \"" + view.root[view.root.length - 1] + "\"" : "directory \"" + view.root + "\"";
				var err = /* @__PURE__ */ new Error("Failed to lookup view \"" + name + "\" in views " + dirs);
				err.view = view;
				return done(err);
			}
			if (renderOptions.cache) cache[name] = view;
		}
		tryRender(view, renderOptions, done);
	};
	/**
	* Listen for connections.
	*
	* A node `http.Server` is returned, with this
	* application (which is a `Function`) as its
	* callback. If you wish to create both an HTTP
	* and HTTPS server you may do so with the "http"
	* and "https" modules as shown here:
	*
	*    var http = require('http')
	*      , https = require('https')
	*      , express = require('express')
	*      , app = express();
	*
	*    http.createServer(app).listen(80);
	*    https.createServer({ ... }, app).listen(443);
	*
	* @return {http.Server}
	* @public
	*/
	app.listen = function listen() {
		var server = http$2.createServer(this);
		return server.listen.apply(server, arguments);
	};
	/**
	* Log error using console.error.
	*
	* @param {Error} err
	* @private
	*/
	function logerror(err) {
		/* istanbul ignore next */
		if (this.get("env") !== "test") console.error(err.stack || err.toString());
	}
	/**
	* Try rendering a view.
	* @private
	*/
	function tryRender(view, options, callback) {
		try {
			view.render(options, callback);
		} catch (err) {
			callback(err);
		}
	}
}));
//#endregion
//#region node_modules/express/lib/request.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_request = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var accepts = require_accepts();
	var deprecate = require_depd()("express");
	var isIP = __require("net").isIP;
	var typeis = require_type_is();
	var http$1 = __require("http");
	var fresh = require_fresh();
	var parseRange = require_range_parser();
	var parse = require_parseurl();
	var proxyaddr = require_proxy_addr();
	/**
	* Request prototype.
	* @public
	*/
	var req = Object.create(http$1.IncomingMessage.prototype);
	/**
	* Module exports.
	* @public
	*/
	module.exports = req;
	/**
	* Return request header.
	*
	* The `Referrer` header field is special-cased,
	* both `Referrer` and `Referer` are interchangeable.
	*
	* Examples:
	*
	*     req.get('Content-Type');
	*     // => "text/plain"
	*
	*     req.get('content-type');
	*     // => "text/plain"
	*
	*     req.get('Something');
	*     // => undefined
	*
	* Aliased as `req.header()`.
	*
	* @param {String} name
	* @return {String}
	* @public
	*/
	req.get = req.header = function header(name) {
		if (!name) throw new TypeError("name argument is required to req.get");
		if (typeof name !== "string") throw new TypeError("name must be a string to req.get");
		var lc = name.toLowerCase();
		switch (lc) {
			case "referer":
			case "referrer": return this.headers.referrer || this.headers.referer;
			default: return this.headers[lc];
		}
	};
	/**
	* To do: update docs.
	*
	* Check if the given `type(s)` is acceptable, returning
	* the best match when true, otherwise `undefined`, in which
	* case you should respond with 406 "Not Acceptable".
	*
	* The `type` value may be a single MIME type string
	* such as "application/json", an extension name
	* such as "json", a comma-delimited list such as "json, html, text/plain",
	* an argument list such as `"json", "html", "text/plain"`,
	* or an array `["json", "html", "text/plain"]`. When a list
	* or array is given, the _best_ match, if any is returned.
	*
	* Examples:
	*
	*     // Accept: text/html
	*     req.accepts('html');
	*     // => "html"
	*
	*     // Accept: text/*, application/json
	*     req.accepts('html');
	*     // => "html"
	*     req.accepts('text/html');
	*     // => "text/html"
	*     req.accepts('json, text');
	*     // => "json"
	*     req.accepts('application/json');
	*     // => "application/json"
	*
	*     // Accept: text/*, application/json
	*     req.accepts('image/png');
	*     req.accepts('png');
	*     // => undefined
	*
	*     // Accept: text/*;q=.5, application/json
	*     req.accepts(['html', 'json']);
	*     req.accepts('html', 'json');
	*     req.accepts('html, json');
	*     // => "json"
	*
	* @param {String|Array} type(s)
	* @return {String|Array|Boolean}
	* @public
	*/
	req.accepts = function() {
		var accept = accepts(this);
		return accept.types.apply(accept, arguments);
	};
	/**
	* Check if the given `encoding`s are accepted.
	*
	* @param {String} ...encoding
	* @return {String|Array}
	* @public
	*/
	req.acceptsEncodings = function() {
		var accept = accepts(this);
		return accept.encodings.apply(accept, arguments);
	};
	req.acceptsEncoding = deprecate.function(req.acceptsEncodings, "req.acceptsEncoding: Use acceptsEncodings instead");
	/**
	* Check if the given `charset`s are acceptable,
	* otherwise you should respond with 406 "Not Acceptable".
	*
	* @param {String} ...charset
	* @return {String|Array}
	* @public
	*/
	req.acceptsCharsets = function() {
		var accept = accepts(this);
		return accept.charsets.apply(accept, arguments);
	};
	req.acceptsCharset = deprecate.function(req.acceptsCharsets, "req.acceptsCharset: Use acceptsCharsets instead");
	/**
	* Check if the given `lang`s are acceptable,
	* otherwise you should respond with 406 "Not Acceptable".
	*
	* @param {String} ...lang
	* @return {String|Array}
	* @public
	*/
	req.acceptsLanguages = function() {
		var accept = accepts(this);
		return accept.languages.apply(accept, arguments);
	};
	req.acceptsLanguage = deprecate.function(req.acceptsLanguages, "req.acceptsLanguage: Use acceptsLanguages instead");
	/**
	* Parse Range header field, capping to the given `size`.
	*
	* Unspecified ranges such as "0-" require knowledge of your resource length. In
	* the case of a byte range this is of course the total number of bytes. If the
	* Range header field is not given `undefined` is returned, `-1` when unsatisfiable,
	* and `-2` when syntactically invalid.
	*
	* When ranges are returned, the array has a "type" property which is the type of
	* range that is required (most commonly, "bytes"). Each array element is an object
	* with a "start" and "end" property for the portion of the range.
	*
	* The "combine" option can be set to `true` and overlapping & adjacent ranges
	* will be combined into a single range.
	*
	* NOTE: remember that ranges are inclusive, so for example "Range: users=0-3"
	* should respond with 4 users when available, not 3.
	*
	* @param {number} size
	* @param {object} [options]
	* @param {boolean} [options.combine=false]
	* @return {number|array}
	* @public
	*/
	req.range = function range(size, options) {
		var range = this.get("Range");
		if (!range) return;
		return parseRange(size, range, options);
	};
	/**
	* Return the value of param `name` when present or `defaultValue`.
	*
	*  - Checks route placeholders, ex: _/user/:id_
	*  - Checks body params, ex: id=12, {"id":12}
	*  - Checks query string params, ex: ?id=12
	*
	* To utilize request bodies, `req.body`
	* should be an object. This can be done by using
	* the `bodyParser()` middleware.
	*
	* @param {String} name
	* @param {Mixed} [defaultValue]
	* @return {String}
	* @public
	*/
	req.param = function param(name, defaultValue) {
		var params = this.params || {};
		var body = this.body || {};
		var query = this.query || {};
		deprecate("req.param(" + (arguments.length === 1 ? "name" : "name, default") + "): Use req.params, req.body, or req.query instead");
		if (null != params[name] && params.hasOwnProperty(name)) return params[name];
		if (null != body[name]) return body[name];
		if (null != query[name]) return query[name];
		return defaultValue;
	};
	/**
	* Check if the incoming request contains the "Content-Type"
	* header field, and it contains the given mime `type`.
	*
	* Examples:
	*
	*      // With Content-Type: text/html; charset=utf-8
	*      req.is('html');
	*      req.is('text/html');
	*      req.is('text/*');
	*      // => true
	*
	*      // When Content-Type is application/json
	*      req.is('json');
	*      req.is('application/json');
	*      req.is('application/*');
	*      // => true
	*
	*      req.is('html');
	*      // => false
	*
	* @param {String|Array} types...
	* @return {String|false|null}
	* @public
	*/
	req.is = function is(types) {
		var arr = types;
		if (!Array.isArray(types)) {
			arr = new Array(arguments.length);
			for (var i = 0; i < arr.length; i++) arr[i] = arguments[i];
		}
		return typeis(this, arr);
	};
	/**
	* Return the protocol string "http" or "https"
	* when requested with TLS. When the "trust proxy"
	* setting trusts the socket address, the
	* "X-Forwarded-Proto" header field will be trusted
	* and used if present.
	*
	* If you're running behind a reverse proxy that
	* supplies https for you this may be enabled.
	*
	* @return {String}
	* @public
	*/
	defineGetter(req, "protocol", function protocol() {
		var proto = this.connection.encrypted ? "https" : "http";
		if (!this.app.get("trust proxy fn")(this.connection.remoteAddress, 0)) return proto;
		var header = this.get("X-Forwarded-Proto") || proto;
		var index = header.indexOf(",");
		return index !== -1 ? header.substring(0, index).trim() : header.trim();
	});
	/**
	* Short-hand for:
	*
	*    req.protocol === 'https'
	*
	* @return {Boolean}
	* @public
	*/
	defineGetter(req, "secure", function secure() {
		return this.protocol === "https";
	});
	/**
	* Return the remote address from the trusted proxy.
	*
	* The is the remote address on the socket unless
	* "trust proxy" is set.
	*
	* @return {String}
	* @public
	*/
	defineGetter(req, "ip", function ip() {
		var trust = this.app.get("trust proxy fn");
		return proxyaddr(this, trust);
	});
	/**
	* When "trust proxy" is set, trusted proxy addresses + client.
	*
	* For example if the value were "client, proxy1, proxy2"
	* you would receive the array `["client", "proxy1", "proxy2"]`
	* where "proxy2" is the furthest down-stream and "proxy1" and
	* "proxy2" were trusted.
	*
	* @return {Array}
	* @public
	*/
	defineGetter(req, "ips", function ips() {
		var trust = this.app.get("trust proxy fn");
		var addrs = proxyaddr.all(this, trust);
		addrs.reverse().pop();
		return addrs;
	});
	/**
	* Return subdomains as an array.
	*
	* Subdomains are the dot-separated parts of the host before the main domain of
	* the app. By default, the domain of the app is assumed to be the last two
	* parts of the host. This can be changed by setting "subdomain offset".
	*
	* For example, if the domain is "tobi.ferrets.example.com":
	* If "subdomain offset" is not set, req.subdomains is `["ferrets", "tobi"]`.
	* If "subdomain offset" is 3, req.subdomains is `["tobi"]`.
	*
	* @return {Array}
	* @public
	*/
	defineGetter(req, "subdomains", function subdomains() {
		var hostname = this.hostname;
		if (!hostname) return [];
		var offset = this.app.get("subdomain offset");
		return (!isIP(hostname) ? hostname.split(".").reverse() : [hostname]).slice(offset);
	});
	/**
	* Short-hand for `url.parse(req.url).pathname`.
	*
	* @return {String}
	* @public
	*/
	defineGetter(req, "path", function path() {
		return parse(this).pathname;
	});
	/**
	* Parse the "Host" header field to a hostname.
	*
	* When the "trust proxy" setting trusts the socket
	* address, the "X-Forwarded-Host" header field will
	* be trusted.
	*
	* @return {String}
	* @public
	*/
	defineGetter(req, "hostname", function hostname() {
		var trust = this.app.get("trust proxy fn");
		var host = this.get("X-Forwarded-Host");
		if (!host || !trust(this.connection.remoteAddress, 0)) host = this.get("Host");
		else if (host.indexOf(",") !== -1) host = host.substring(0, host.indexOf(",")).trimRight();
		if (!host) return;
		var offset = host[0] === "[" ? host.indexOf("]") + 1 : 0;
		var index = host.indexOf(":", offset);
		return index !== -1 ? host.substring(0, index) : host;
	});
	defineGetter(req, "host", deprecate.function(function host() {
		return this.hostname;
	}, "req.host: Use req.hostname instead"));
	/**
	* Check if the request is fresh, aka
	* Last-Modified and/or the ETag
	* still match.
	*
	* @return {Boolean}
	* @public
	*/
	defineGetter(req, "fresh", function() {
		var method = this.method;
		var res = this.res;
		var status = res.statusCode;
		if ("GET" !== method && "HEAD" !== method) return false;
		if (status >= 200 && status < 300 || 304 === status) return fresh(this.headers, {
			"etag": res.get("ETag"),
			"last-modified": res.get("Last-Modified")
		});
		return false;
	});
	/**
	* Check if the request is stale, aka
	* "Last-Modified" and / or the "ETag" for the
	* resource has changed.
	*
	* @return {Boolean}
	* @public
	*/
	defineGetter(req, "stale", function stale() {
		return !this.fresh;
	});
	/**
	* Check if the request was an _XMLHttpRequest_.
	*
	* @return {Boolean}
	* @public
	*/
	defineGetter(req, "xhr", function xhr() {
		return (this.get("X-Requested-With") || "").toLowerCase() === "xmlhttprequest";
	});
	/**
	* Helper function for creating a getter on an object.
	*
	* @param {Object} obj
	* @param {String} name
	* @param {Function} getter
	* @private
	*/
	function defineGetter(obj, name, getter) {
		Object.defineProperty(obj, name, {
			configurable: true,
			enumerable: true,
			get: getter
		});
	}
}));
//#endregion
//#region node_modules/vary/index.js
/*!
* vary
* Copyright(c) 2014-2017 Douglas Christopher Wilson
* MIT Licensed
*/
var require_vary = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module exports.
	*/
	module.exports = vary;
	module.exports.append = append;
	/**
	* RegExp to match field-name in RFC 7230 sec 3.2
	*
	* field-name    = token
	* token         = 1*tchar
	* tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
	*               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
	*               / DIGIT / ALPHA
	*               ; any VCHAR, except delimiters
	*/
	var FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
	/**
	* Append a field to a vary header.
	*
	* @param {String} header
	* @param {String|Array} field
	* @return {String}
	* @public
	*/
	function append(header, field) {
		if (typeof header !== "string") throw new TypeError("header argument is required");
		if (!field) throw new TypeError("field argument is required");
		var fields = !Array.isArray(field) ? parse(String(field)) : field;
		for (var j = 0; j < fields.length; j++) if (!FIELD_NAME_REGEXP.test(fields[j])) throw new TypeError("field argument contains an invalid header name");
		if (header === "*") return header;
		var val = header;
		var vals = parse(header.toLowerCase());
		if (fields.indexOf("*") !== -1 || vals.indexOf("*") !== -1) return "*";
		for (var i = 0; i < fields.length; i++) {
			var fld = fields[i].toLowerCase();
			if (vals.indexOf(fld) === -1) {
				vals.push(fld);
				val = val ? val + ", " + fields[i] : fields[i];
			}
		}
		return val;
	}
	/**
	* Parse a vary header into an array.
	*
	* @param {String} header
	* @return {Array}
	* @private
	*/
	function parse(header) {
		var end = 0;
		var list = [];
		var start = 0;
		for (var i = 0, len = header.length; i < len; i++) switch (header.charCodeAt(i)) {
			case 32:
				if (start === end) start = end = i + 1;
				break;
			case 44:
				list.push(header.substring(start, end));
				start = end = i + 1;
				break;
			default:
				end = i + 1;
				break;
		}
		list.push(header.substring(start, end));
		return list;
	}
	/**
	* Mark that a request is varied on a header field.
	*
	* @param {Object} res
	* @param {String|Array} field
	* @public
	*/
	function vary(res, field) {
		if (!res || !res.getHeader || !res.setHeader) throw new TypeError("res argument is required");
		var val = res.getHeader("Vary") || "";
		if (val = append(Array.isArray(val) ? val.join(", ") : String(val), field)) res.setHeader("Vary", val);
	}
}));
//#endregion
//#region node_modules/express/lib/response.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_response = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var Buffer = require_safe_buffer().Buffer;
	var contentDisposition = require_content_disposition();
	var createError = require_http_errors();
	var deprecate = require_depd()("express");
	var encodeUrl = require_encodeurl();
	var escapeHtml = require_escape_html();
	var http = __require("http");
	var isAbsolute = require_utils().isAbsolute;
	var onFinished = require_on_finished();
	var path = __require("path");
	var statuses = require_statuses();
	var merge = require_utils_merge();
	var sign = require_cookie_signature().sign;
	var normalizeType = require_utils().normalizeType;
	var normalizeTypes = require_utils().normalizeTypes;
	var setCharset = require_utils().setCharset;
	var cookie = require_cookie();
	var send = require_send();
	var extname = path.extname;
	var mime = send.mime;
	var resolve = path.resolve;
	var vary = require_vary();
	/**
	* Response prototype.
	* @public
	*/
	var res = Object.create(http.ServerResponse.prototype);
	/**
	* Module exports.
	* @public
	*/
	module.exports = res;
	/**
	* Module variables.
	* @private
	*/
	var charsetRegExp = /;\s*charset\s*=/;
	/**
	* Set status `code`.
	*
	* @param {Number} code
	* @return {ServerResponse}
	* @public
	*/
	res.status = function status(code) {
		if ((typeof code === "string" || Math.floor(code) !== code) && code > 99 && code < 1e3) deprecate("res.status(" + JSON.stringify(code) + "): use res.status(" + Math.floor(code) + ") instead");
		this.statusCode = code;
		return this;
	};
	/**
	* Set Link header field with the given `links`.
	*
	* Examples:
	*
	*    res.links({
	*      next: 'http://api.example.com/users?page=2',
	*      last: 'http://api.example.com/users?page=5'
	*    });
	*
	* @param {Object} links
	* @return {ServerResponse}
	* @public
	*/
	res.links = function(links) {
		var link = this.get("Link") || "";
		if (link) link += ", ";
		return this.set("Link", link + Object.keys(links).map(function(rel) {
			return "<" + links[rel] + ">; rel=\"" + rel + "\"";
		}).join(", "));
	};
	/**
	* Send a response.
	*
	* Examples:
	*
	*     res.send(Buffer.from('wahoo'));
	*     res.send({ some: 'json' });
	*     res.send('<p>some html</p>');
	*
	* @param {string|number|boolean|object|Buffer} body
	* @public
	*/
	res.send = function send(body) {
		var chunk = body;
		var encoding;
		var req = this.req;
		var type;
		var app = this.app;
		if (arguments.length === 2) if (typeof arguments[0] !== "number" && typeof arguments[1] === "number") {
			deprecate("res.send(body, status): Use res.status(status).send(body) instead");
			this.statusCode = arguments[1];
		} else {
			deprecate("res.send(status, body): Use res.status(status).send(body) instead");
			this.statusCode = arguments[0];
			chunk = arguments[1];
		}
		if (typeof chunk === "number" && arguments.length === 1) {
			if (!this.get("Content-Type")) this.type("txt");
			deprecate("res.send(status): Use res.sendStatus(status) instead");
			this.statusCode = chunk;
			chunk = statuses.message[chunk];
		}
		switch (typeof chunk) {
			case "string":
				if (!this.get("Content-Type")) this.type("html");
				break;
			case "boolean":
			case "number":
			case "object":
				if (chunk === null) chunk = "";
				else if (Buffer.isBuffer(chunk)) {
					if (!this.get("Content-Type")) this.type("bin");
				} else return this.json(chunk);
				break;
		}
		if (typeof chunk === "string") {
			encoding = "utf8";
			type = this.get("Content-Type");
			if (typeof type === "string") this.set("Content-Type", setCharset(type, "utf-8"));
		}
		var etagFn = app.get("etag fn");
		var generateETag = !this.get("ETag") && typeof etagFn === "function";
		var len;
		if (chunk !== void 0) {
			if (Buffer.isBuffer(chunk)) len = chunk.length;
			else if (!generateETag && chunk.length < 1e3) len = Buffer.byteLength(chunk, encoding);
			else {
				chunk = Buffer.from(chunk, encoding);
				encoding = void 0;
				len = chunk.length;
			}
			this.set("Content-Length", len);
		}
		var etag;
		if (generateETag && len !== void 0) {
			if (etag = etagFn(chunk, encoding)) this.set("ETag", etag);
		}
		if (req.fresh) this.statusCode = 304;
		if (204 === this.statusCode || 304 === this.statusCode) {
			this.removeHeader("Content-Type");
			this.removeHeader("Content-Length");
			this.removeHeader("Transfer-Encoding");
			chunk = "";
		}
		if (this.statusCode === 205) {
			this.set("Content-Length", "0");
			this.removeHeader("Transfer-Encoding");
			chunk = "";
		}
		if (req.method === "HEAD") this.end();
		else this.end(chunk, encoding);
		return this;
	};
	/**
	* Send JSON response.
	*
	* Examples:
	*
	*     res.json(null);
	*     res.json({ user: 'tj' });
	*
	* @param {string|number|boolean|object} obj
	* @public
	*/
	res.json = function json(obj) {
		var val = obj;
		if (arguments.length === 2) if (typeof arguments[1] === "number") {
			deprecate("res.json(obj, status): Use res.status(status).json(obj) instead");
			this.statusCode = arguments[1];
		} else {
			deprecate("res.json(status, obj): Use res.status(status).json(obj) instead");
			this.statusCode = arguments[0];
			val = arguments[1];
		}
		var app = this.app;
		var escape = app.get("json escape");
		var replacer = app.get("json replacer");
		var spaces = app.get("json spaces");
		var body = stringify(val, replacer, spaces, escape);
		if (!this.get("Content-Type")) this.set("Content-Type", "application/json");
		return this.send(body);
	};
	/**
	* Send JSON response with JSONP callback support.
	*
	* Examples:
	*
	*     res.jsonp(null);
	*     res.jsonp({ user: 'tj' });
	*
	* @param {string|number|boolean|object} obj
	* @public
	*/
	res.jsonp = function jsonp(obj) {
		var val = obj;
		if (arguments.length === 2) if (typeof arguments[1] === "number") {
			deprecate("res.jsonp(obj, status): Use res.status(status).jsonp(obj) instead");
			this.statusCode = arguments[1];
		} else {
			deprecate("res.jsonp(status, obj): Use res.status(status).jsonp(obj) instead");
			this.statusCode = arguments[0];
			val = arguments[1];
		}
		var app = this.app;
		var escape = app.get("json escape");
		var replacer = app.get("json replacer");
		var spaces = app.get("json spaces");
		var body = stringify(val, replacer, spaces, escape);
		var callback = this.req.query[app.get("jsonp callback name")];
		if (!this.get("Content-Type")) {
			this.set("X-Content-Type-Options", "nosniff");
			this.set("Content-Type", "application/json");
		}
		if (Array.isArray(callback)) callback = callback[0];
		if (typeof callback === "string" && callback.length !== 0) {
			this.set("X-Content-Type-Options", "nosniff");
			this.set("Content-Type", "text/javascript");
			callback = callback.replace(/[^\[\]\w$.]/g, "");
			if (body === void 0) body = "";
			else if (typeof body === "string") body = body.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
			body = "/**/ typeof " + callback + " === 'function' && " + callback + "(" + body + ");";
		}
		return this.send(body);
	};
	/**
	* Send given HTTP status code.
	*
	* Sets the response status to `statusCode` and the body of the
	* response to the standard description from node's http.STATUS_CODES
	* or the statusCode number if no description.
	*
	* Examples:
	*
	*     res.sendStatus(200);
	*
	* @param {number} statusCode
	* @public
	*/
	res.sendStatus = function sendStatus(statusCode) {
		var body = statuses.message[statusCode] || String(statusCode);
		this.statusCode = statusCode;
		this.type("txt");
		return this.send(body);
	};
	/**
	* Transfer the file at the given `path`.
	*
	* Automatically sets the _Content-Type_ response header field.
	* The callback `callback(err)` is invoked when the transfer is complete
	* or when an error occurs. Be sure to check `res.headersSent`
	* if you wish to attempt responding, as the header and some data
	* may have already been transferred.
	*
	* Options:
	*
	*   - `maxAge`   defaulting to 0 (can be string converted by `ms`)
	*   - `root`     root directory for relative filenames
	*   - `headers`  object of headers to serve with file
	*   - `dotfiles` serve dotfiles, defaulting to false; can be `"allow"` to send them
	*
	* Other options are passed along to `send`.
	*
	* Examples:
	*
	*  The following example illustrates how `res.sendFile()` may
	*  be used as an alternative for the `static()` middleware for
	*  dynamic situations. The code backing `res.sendFile()` is actually
	*  the same code, so HTTP cache support etc is identical.
	*
	*     app.get('/user/:uid/photos/:file', function(req, res){
	*       var uid = req.params.uid
	*         , file = req.params.file;
	*
	*       req.user.mayViewFilesFrom(uid, function(yes){
	*         if (yes) {
	*           res.sendFile('/uploads/' + uid + '/' + file);
	*         } else {
	*           res.send(403, 'Sorry! you cant see that.');
	*         }
	*       });
	*     });
	*
	* @public
	*/
	res.sendFile = function sendFile(path, options, callback) {
		var done = callback;
		var req = this.req;
		var res = this;
		var next = req.next;
		var opts = options || {};
		if (!path) throw new TypeError("path argument is required to res.sendFile");
		if (typeof path !== "string") throw new TypeError("path must be a string to res.sendFile");
		if (typeof options === "function") {
			done = options;
			opts = {};
		}
		if (!opts.root && !isAbsolute(path)) throw new TypeError("path must be absolute or specify root to res.sendFile");
		sendfile(res, send(req, encodeURI(path), opts), opts, function(err) {
			if (done) return done(err);
			if (err && err.code === "EISDIR") return next();
			if (err && err.code !== "ECONNABORTED" && err.syscall !== "write") next(err);
		});
	};
	/**
	* Transfer the file at the given `path`.
	*
	* Automatically sets the _Content-Type_ response header field.
	* The callback `callback(err)` is invoked when the transfer is complete
	* or when an error occurs. Be sure to check `res.headersSent`
	* if you wish to attempt responding, as the header and some data
	* may have already been transferred.
	*
	* Options:
	*
	*   - `maxAge`   defaulting to 0 (can be string converted by `ms`)
	*   - `root`     root directory for relative filenames
	*   - `headers`  object of headers to serve with file
	*   - `dotfiles` serve dotfiles, defaulting to false; can be `"allow"` to send them
	*
	* Other options are passed along to `send`.
	*
	* Examples:
	*
	*  The following example illustrates how `res.sendfile()` may
	*  be used as an alternative for the `static()` middleware for
	*  dynamic situations. The code backing `res.sendfile()` is actually
	*  the same code, so HTTP cache support etc is identical.
	*
	*     app.get('/user/:uid/photos/:file', function(req, res){
	*       var uid = req.params.uid
	*         , file = req.params.file;
	*
	*       req.user.mayViewFilesFrom(uid, function(yes){
	*         if (yes) {
	*           res.sendfile('/uploads/' + uid + '/' + file);
	*         } else {
	*           res.send(403, 'Sorry! you cant see that.');
	*         }
	*       });
	*     });
	*
	* @public
	*/
	res.sendfile = function(path, options, callback) {
		var done = callback;
		var req = this.req;
		var res = this;
		var next = req.next;
		var opts = options || {};
		if (typeof options === "function") {
			done = options;
			opts = {};
		}
		sendfile(res, send(req, path, opts), opts, function(err) {
			if (done) return done(err);
			if (err && err.code === "EISDIR") return next();
			if (err && err.code !== "ECONNABORTED" && err.syscall !== "write") next(err);
		});
	};
	res.sendfile = deprecate.function(res.sendfile, "res.sendfile: Use res.sendFile instead");
	/**
	* Transfer the file at the given `path` as an attachment.
	*
	* Optionally providing an alternate attachment `filename`,
	* and optional callback `callback(err)`. The callback is invoked
	* when the data transfer is complete, or when an error has
	* occurred. Be sure to check `res.headersSent` if you plan to respond.
	*
	* Optionally providing an `options` object to use with `res.sendFile()`.
	* This function will set the `Content-Disposition` header, overriding
	* any `Content-Disposition` header passed as header options in order
	* to set the attachment and filename.
	*
	* This method uses `res.sendFile()`.
	*
	* @public
	*/
	res.download = function download(path, filename, options, callback) {
		var done = callback;
		var name = filename;
		var opts = options || null;
		if (typeof filename === "function") {
			done = filename;
			name = null;
			opts = null;
		} else if (typeof options === "function") {
			done = options;
			opts = null;
		}
		if (typeof filename === "object" && (typeof options === "function" || options === void 0)) {
			name = null;
			opts = filename;
		}
		var headers = { "Content-Disposition": contentDisposition(name || path) };
		if (opts && opts.headers) {
			var keys = Object.keys(opts.headers);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				if (key.toLowerCase() !== "content-disposition") headers[key] = opts.headers[key];
			}
		}
		opts = Object.create(opts);
		opts.headers = headers;
		var fullPath = !opts.root ? resolve(path) : path;
		return this.sendFile(fullPath, opts, done);
	};
	/**
	* Set _Content-Type_ response header with `type` through `mime.lookup()`
	* when it does not contain "/", or set the Content-Type to `type` otherwise.
	*
	* Examples:
	*
	*     res.type('.html');
	*     res.type('html');
	*     res.type('json');
	*     res.type('application/json');
	*     res.type('png');
	*
	* @param {String} type
	* @return {ServerResponse} for chaining
	* @public
	*/
	res.contentType = res.type = function contentType(type) {
		var ct = type.indexOf("/") === -1 ? mime.lookup(type) : type;
		return this.set("Content-Type", ct);
	};
	/**
	* Respond to the Acceptable formats using an `obj`
	* of mime-type callbacks.
	*
	* This method uses `req.accepted`, an array of
	* acceptable types ordered by their quality values.
	* When "Accept" is not present the _first_ callback
	* is invoked, otherwise the first match is used. When
	* no match is performed the server responds with
	* 406 "Not Acceptable".
	*
	* Content-Type is set for you, however if you choose
	* you may alter this within the callback using `res.type()`
	* or `res.set('Content-Type', ...)`.
	*
	*    res.format({
	*      'text/plain': function(){
	*        res.send('hey');
	*      },
	*
	*      'text/html': function(){
	*        res.send('<p>hey</p>');
	*      },
	*
	*      'application/json': function () {
	*        res.send({ message: 'hey' });
	*      }
	*    });
	*
	* In addition to canonicalized MIME types you may
	* also use extnames mapped to these types:
	*
	*    res.format({
	*      text: function(){
	*        res.send('hey');
	*      },
	*
	*      html: function(){
	*        res.send('<p>hey</p>');
	*      },
	*
	*      json: function(){
	*        res.send({ message: 'hey' });
	*      }
	*    });
	*
	* By default Express passes an `Error`
	* with a `.status` of 406 to `next(err)`
	* if a match is not made. If you provide
	* a `.default` callback it will be invoked
	* instead.
	*
	* @param {Object} obj
	* @return {ServerResponse} for chaining
	* @public
	*/
	res.format = function(obj) {
		var req = this.req;
		var next = req.next;
		var keys = Object.keys(obj).filter(function(v) {
			return v !== "default";
		});
		var key = keys.length > 0 ? req.accepts(keys) : false;
		this.vary("Accept");
		if (key) {
			this.set("Content-Type", normalizeType(key).value);
			obj[key](req, this, next);
		} else if (obj.default) obj.default(req, this, next);
		else next(createError(406, { types: normalizeTypes(keys).map(function(o) {
			return o.value;
		}) }));
		return this;
	};
	/**
	* Set _Content-Disposition_ header to _attachment_ with optional `filename`.
	*
	* @param {String} filename
	* @return {ServerResponse}
	* @public
	*/
	res.attachment = function attachment(filename) {
		if (filename) this.type(extname(filename));
		this.set("Content-Disposition", contentDisposition(filename));
		return this;
	};
	/**
	* Append additional header `field` with value `val`.
	*
	* Example:
	*
	*    res.append('Link', ['<http://localhost/>', '<http://localhost:3000/>']);
	*    res.append('Set-Cookie', 'foo=bar; Path=/; HttpOnly');
	*    res.append('Warning', '199 Miscellaneous warning');
	*
	* @param {String} field
	* @param {String|Array} val
	* @return {ServerResponse} for chaining
	* @public
	*/
	res.append = function append(field, val) {
		var prev = this.get(field);
		var value = val;
		if (prev) value = Array.isArray(prev) ? prev.concat(val) : Array.isArray(val) ? [prev].concat(val) : [prev, val];
		return this.set(field, value);
	};
	/**
	* Set header `field` to `val`, or pass
	* an object of header fields.
	*
	* Examples:
	*
	*    res.set('Foo', ['bar', 'baz']);
	*    res.set('Accept', 'application/json');
	*    res.set({ Accept: 'text/plain', 'X-API-Key': 'tobi' });
	*
	* Aliased as `res.header()`.
	*
	* @param {String|Object} field
	* @param {String|Array} val
	* @return {ServerResponse} for chaining
	* @public
	*/
	res.set = res.header = function header(field, val) {
		if (arguments.length === 2) {
			var value = Array.isArray(val) ? val.map(String) : String(val);
			if (field.toLowerCase() === "content-type") {
				if (Array.isArray(value)) throw new TypeError("Content-Type cannot be set to an Array");
				if (!charsetRegExp.test(value)) {
					var charset = mime.charsets.lookup(value.split(";")[0]);
					if (charset) value += "; charset=" + charset.toLowerCase();
				}
			}
			this.setHeader(field, value);
		} else for (var key in field) this.set(key, field[key]);
		return this;
	};
	/**
	* Get value for header `field`.
	*
	* @param {String} field
	* @return {String}
	* @public
	*/
	res.get = function(field) {
		return this.getHeader(field);
	};
	/**
	* Clear cookie `name`.
	*
	* @param {String} name
	* @param {Object} [options]
	* @return {ServerResponse} for chaining
	* @public
	*/
	res.clearCookie = function clearCookie(name, options) {
		if (options) {
			if (options.maxAge) deprecate("res.clearCookie: Passing \"options.maxAge\" is deprecated. In v5.0.0 of Express, this option will be ignored, as res.clearCookie will automatically set cookies to expire immediately. Please update your code to omit this option.");
			if (options.expires) deprecate("res.clearCookie: Passing \"options.expires\" is deprecated. In v5.0.0 of Express, this option will be ignored, as res.clearCookie will automatically set cookies to expire immediately. Please update your code to omit this option.");
		}
		var opts = merge({
			expires: /* @__PURE__ */ new Date(1),
			path: "/"
		}, options);
		return this.cookie(name, "", opts);
	};
	/**
	* Set cookie `name` to `value`, with the given `options`.
	*
	* Options:
	*
	*    - `maxAge`   max-age in milliseconds, converted to `expires`
	*    - `signed`   sign the cookie
	*    - `path`     defaults to "/"
	*
	* Examples:
	*
	*    // "Remember Me" for 15 minutes
	*    res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true });
	*
	*    // same as above
	*    res.cookie('rememberme', '1', { maxAge: 900000, httpOnly: true })
	*
	* @param {String} name
	* @param {String|Object} value
	* @param {Object} [options]
	* @return {ServerResponse} for chaining
	* @public
	*/
	res.cookie = function(name, value, options) {
		var opts = merge({}, options);
		var secret = this.req.secret;
		var signed = opts.signed;
		if (signed && !secret) throw new Error("cookieParser(\"secret\") required for signed cookies");
		var val = typeof value === "object" ? "j:" + JSON.stringify(value) : String(value);
		if (signed) val = "s:" + sign(val, secret);
		if (opts.maxAge != null) {
			var maxAge = opts.maxAge - 0;
			if (!isNaN(maxAge)) {
				opts.expires = new Date(Date.now() + maxAge);
				opts.maxAge = Math.floor(maxAge / 1e3);
			}
		}
		if (opts.path == null) opts.path = "/";
		this.append("Set-Cookie", cookie.serialize(name, String(val), opts));
		return this;
	};
	/**
	* Set the location header to `url`.
	*
	* The given `url` can also be "back", which redirects
	* to the _Referrer_ or _Referer_ headers or "/".
	*
	* Examples:
	*
	*    res.location('/foo/bar').;
	*    res.location('http://example.com');
	*    res.location('../login');
	*
	* @param {String} url
	* @return {ServerResponse} for chaining
	* @public
	*/
	res.location = function location(url) {
		var loc;
		if (url === "back") {
			deprecate("res.location(\"back\"): use res.location(req.get(\"Referrer\") || \"/\") and refer to https://dub.sh/security-redirect for best practices");
			loc = this.req.get("Referrer") || "/";
		} else loc = String(url);
		return this.set("Location", encodeUrl(loc));
	};
	/**
	* Redirect to the given `url` with optional response `status`
	* defaulting to 302.
	*
	* The resulting `url` is determined by `res.location()`, so
	* it will play nicely with mounted apps, relative paths,
	* `"back"` etc.
	*
	* Examples:
	*
	*    res.redirect('/foo/bar');
	*    res.redirect('http://example.com');
	*    res.redirect(301, 'http://example.com');
	*    res.redirect('../login'); // /blog/post/1 -> /blog/login
	*
	* @public
	*/
	res.redirect = function redirect(url) {
		var address = url;
		var body;
		var status = 302;
		if (arguments.length === 2) if (typeof arguments[0] === "number") {
			status = arguments[0];
			address = arguments[1];
		} else {
			deprecate("res.redirect(url, status): Use res.redirect(status, url) instead");
			status = arguments[1];
		}
		address = this.location(address).get("Location");
		this.format({
			text: function() {
				body = statuses.message[status] + ". Redirecting to " + address;
			},
			html: function() {
				var u = escapeHtml(address);
				body = "<p>" + statuses.message[status] + ". Redirecting to " + u + "</p>";
			},
			default: function() {
				body = "";
			}
		});
		this.statusCode = status;
		this.set("Content-Length", Buffer.byteLength(body));
		if (this.req.method === "HEAD") this.end();
		else this.end(body);
	};
	/**
	* Add `field` to Vary. If already present in the Vary set, then
	* this call is simply ignored.
	*
	* @param {Array|String} field
	* @return {ServerResponse} for chaining
	* @public
	*/
	res.vary = function(field) {
		if (!field || Array.isArray(field) && !field.length) {
			deprecate("res.vary(): Provide a field name");
			return this;
		}
		vary(this, field);
		return this;
	};
	/**
	* Render `view` with the given `options` and optional callback `fn`.
	* When a callback function is given a response will _not_ be made
	* automatically, otherwise a response of _200_ and _text/html_ is given.
	*
	* Options:
	*
	*  - `cache`     boolean hinting to the engine it should cache
	*  - `filename`  filename of the view being rendered
	*
	* @public
	*/
	res.render = function render(view, options, callback) {
		var app = this.req.app;
		var done = callback;
		var opts = options || {};
		var req = this.req;
		var self = this;
		if (typeof options === "function") {
			done = options;
			opts = {};
		}
		opts._locals = self.locals;
		done = done || function(err, str) {
			if (err) return req.next(err);
			self.send(str);
		};
		app.render(view, opts, done);
	};
	function sendfile(res, file, options, callback) {
		var done = false;
		var streaming;
		function onaborted() {
			if (done) return;
			done = true;
			var err = /* @__PURE__ */ new Error("Request aborted");
			err.code = "ECONNABORTED";
			callback(err);
		}
		function ondirectory() {
			if (done) return;
			done = true;
			var err = /* @__PURE__ */ new Error("EISDIR, read");
			err.code = "EISDIR";
			callback(err);
		}
		function onerror(err) {
			if (done) return;
			done = true;
			callback(err);
		}
		function onend() {
			if (done) return;
			done = true;
			callback();
		}
		function onfile() {
			streaming = false;
		}
		function onfinish(err) {
			if (err && err.code === "ECONNRESET") return onaborted();
			if (err) return onerror(err);
			if (done) return;
			setImmediate(function() {
				if (streaming !== false && !done) {
					onaborted();
					return;
				}
				if (done) return;
				done = true;
				callback();
			});
		}
		function onstream() {
			streaming = true;
		}
		file.on("directory", ondirectory);
		file.on("end", onend);
		file.on("error", onerror);
		file.on("file", onfile);
		file.on("stream", onstream);
		onFinished(res, onfinish);
		if (options.headers) file.on("headers", function headers(res) {
			var obj = options.headers;
			var keys = Object.keys(obj);
			for (var i = 0; i < keys.length; i++) {
				var k = keys[i];
				res.setHeader(k, obj[k]);
			}
		});
		file.pipe(res);
	}
	/**
	* Stringify JSON, like JSON.stringify, but v8 optimized, with the
	* ability to escape characters that can trigger HTML sniffing.
	*
	* @param {*} value
	* @param {function} replacer
	* @param {number} spaces
	* @param {boolean} escape
	* @returns {string}
	* @private
	*/
	function stringify(value, replacer, spaces, escape) {
		var json = replacer || spaces ? JSON.stringify(value, replacer, spaces) : JSON.stringify(value);
		if (escape && typeof json === "string") json = json.replace(/[<>&]/g, function(c) {
			switch (c.charCodeAt(0)) {
				case 60: return "\\u003c";
				case 62: return "\\u003e";
				case 38: return "\\u0026";
				/* istanbul ignore next: unreachable default */
				default: return c;
			}
		});
		return json;
	}
}));
//#endregion
//#region node_modules/serve-static/index.js
/*!
* serve-static
* Copyright(c) 2010 Sencha Inc.
* Copyright(c) 2011 TJ Holowaychuk
* Copyright(c) 2014-2016 Douglas Christopher Wilson
* MIT Licensed
*/
var require_serve_static = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	* @private
	*/
	var encodeUrl = require_encodeurl();
	var escapeHtml = require_escape_html();
	var parseUrl = require_parseurl();
	var resolve = __require("path").resolve;
	var send = require_send();
	var url = __require("url");
	/**
	* Module exports.
	* @public
	*/
	module.exports = serveStatic;
	module.exports.mime = send.mime;
	/**
	* @param {string} root
	* @param {object} [options]
	* @return {function}
	* @public
	*/
	function serveStatic(root, options) {
		if (!root) throw new TypeError("root path required");
		if (typeof root !== "string") throw new TypeError("root path must be a string");
		var opts = Object.create(options || null);
		var fallthrough = opts.fallthrough !== false;
		var redirect = opts.redirect !== false;
		var setHeaders = opts.setHeaders;
		if (setHeaders && typeof setHeaders !== "function") throw new TypeError("option setHeaders must be function");
		opts.maxage = opts.maxage || opts.maxAge || 0;
		opts.root = resolve(root);
		var onDirectory = redirect ? createRedirectDirectoryListener() : createNotFoundDirectoryListener();
		return function serveStatic(req, res, next) {
			if (req.method !== "GET" && req.method !== "HEAD") {
				if (fallthrough) return next();
				res.statusCode = 405;
				res.setHeader("Allow", "GET, HEAD");
				res.setHeader("Content-Length", "0");
				res.end();
				return;
			}
			var forwardError = !fallthrough;
			var originalUrl = parseUrl.original(req);
			var path = parseUrl(req).pathname;
			if (path === "/" && originalUrl.pathname.substr(-1) !== "/") path = "";
			var stream = send(req, path, opts);
			stream.on("directory", onDirectory);
			if (setHeaders) stream.on("headers", setHeaders);
			if (fallthrough) stream.on("file", function onFile() {
				forwardError = true;
			});
			stream.on("error", function error(err) {
				if (forwardError || !(err.statusCode < 500)) {
					next(err);
					return;
				}
				next();
			});
			stream.pipe(res);
		};
	}
	/**
	* Collapse all leading slashes into a single slash
	* @private
	*/
	function collapseLeadingSlashes(str) {
		for (var i = 0; i < str.length; i++) if (str.charCodeAt(i) !== 47) break;
		return i > 1 ? "/" + str.substr(i) : str;
	}
	/**
	* Create a minimal HTML document.
	*
	* @param {string} title
	* @param {string} body
	* @private
	*/
	function createHtmlDocument(title, body) {
		return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>" + title + "</title>\n</head>\n<body>\n<pre>" + body + "</pre>\n</body>\n</html>\n";
	}
	/**
	* Create a directory listener that just 404s.
	* @private
	*/
	function createNotFoundDirectoryListener() {
		return function notFound() {
			this.error(404);
		};
	}
	/**
	* Create a directory listener that performs a redirect.
	* @private
	*/
	function createRedirectDirectoryListener() {
		return function redirect(res) {
			if (this.hasTrailingSlash()) {
				this.error(404);
				return;
			}
			var originalUrl = parseUrl.original(this.req);
			originalUrl.path = null;
			originalUrl.pathname = collapseLeadingSlashes(originalUrl.pathname + "/");
			var loc = encodeUrl(url.format(originalUrl));
			var doc = createHtmlDocument("Redirecting", "Redirecting to " + escapeHtml(loc));
			res.statusCode = 301;
			res.setHeader("Content-Type", "text/html; charset=UTF-8");
			res.setHeader("Content-Length", Buffer.byteLength(doc));
			res.setHeader("Content-Security-Policy", "default-src 'none'");
			res.setHeader("X-Content-Type-Options", "nosniff");
			res.setHeader("Location", loc);
			res.end(doc);
		};
	}
}));
//#endregion
//#region node_modules/express/lib/express.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_express$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	var bodyParser = require_body_parser();
	var EventEmitter = __require("events").EventEmitter;
	var mixin = require_merge_descriptors();
	var proto = require_application();
	var Route = require_route();
	var Router = require_router();
	var req = require_request();
	var res = require_response();
	/**
	* Expose `createApplication()`.
	*/
	exports = module.exports = createApplication;
	/**
	* Create an express application.
	*
	* @return {Function}
	* @api public
	*/
	function createApplication() {
		var app = function(req, res, next) {
			app.handle(req, res, next);
		};
		mixin(app, EventEmitter.prototype, false);
		mixin(app, proto, false);
		app.request = Object.create(req, { app: {
			configurable: true,
			enumerable: true,
			writable: true,
			value: app
		} });
		app.response = Object.create(res, { app: {
			configurable: true,
			enumerable: true,
			writable: true,
			value: app
		} });
		app.init();
		return app;
	}
	/**
	* Expose the prototypes.
	*/
	exports.application = proto;
	exports.request = req;
	exports.response = res;
	/**
	* Expose constructors.
	*/
	exports.Route = Route;
	exports.Router = Router;
	/**
	* Expose middleware
	*/
	exports.json = bodyParser.json;
	exports.query = require_query();
	exports.raw = bodyParser.raw;
	exports.static = require_serve_static();
	exports.text = bodyParser.text;
	exports.urlencoded = bodyParser.urlencoded;
	[
		"bodyParser",
		"compress",
		"cookieSession",
		"session",
		"logger",
		"cookieParser",
		"favicon",
		"responseTime",
		"errorHandler",
		"timeout",
		"methodOverride",
		"vhost",
		"csrf",
		"directory",
		"limit",
		"multipart",
		"staticCache"
	].forEach(function(name) {
		Object.defineProperty(exports, name, {
			get: function() {
				throw new Error("Most middleware (like " + name + ") is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.");
			},
			configurable: true
		});
	});
}));
//#endregion
//#region node_modules/express/index.js
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_express = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_express$1();
}));
//#endregion
export { require_express as t };
