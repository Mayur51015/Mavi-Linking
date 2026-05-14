import { r as __require, t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/cookie-signature/index.js
var require_cookie_signature = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Module dependencies.
	*/
	var crypto = __require("crypto");
	/**
	* Sign the given `val` with `secret`.
	*
	* @param {String} val
	* @param {String|NodeJS.ArrayBufferView|crypto.KeyObject} secret
	* @return {String}
	* @api private
	*/
	exports.sign = function(val, secret) {
		if ("string" !== typeof val) throw new TypeError("Cookie value must be provided as a string.");
		if (null == secret) throw new TypeError("Secret key must be provided.");
		return val + "." + crypto.createHmac("sha256", secret).update(val).digest("base64").replace(/\=+$/, "");
	};
	/**
	* Unsign and decode the given `val` with `secret`,
	* returning `false` if the signature is invalid.
	*
	* @param {String} val
	* @param {String|NodeJS.ArrayBufferView|crypto.KeyObject} secret
	* @return {String|Boolean}
	* @api private
	*/
	exports.unsign = function(val, secret) {
		if ("string" !== typeof val) throw new TypeError("Signed cookie string must be provided.");
		if (null == secret) throw new TypeError("Secret key must be provided.");
		var str = val.slice(0, val.lastIndexOf("."));
		return sha1(exports.sign(str, secret)) == sha1(val) ? str : false;
	};
	/**
	* Private
	*/
	function sha1(str) {
		return crypto.createHash("sha1").update(str).digest("hex");
	}
}));
//#endregion
export { require_cookie_signature as t };
