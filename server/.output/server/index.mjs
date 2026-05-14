globalThis.__nitro_main__ = import.meta.url;
import { i as __toESM } from "./_runtime.mjs";
import { a as NodeResponse, i as toEventHandler, n as HTTPError, o as serve, r as defineHandler, s as toFetchHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import "./_libs/hookable.mjs";
import { t as getContext } from "./_libs/unctx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { a as registerStepFunction, i as resumeWebhook, n as stepEntrypoint, r as start, t as workflowEntrypoint } from "./_libs/@workflow/core+[...].mjs";
import { t as require_express } from "./_libs/express+[...].mjs";
import "./_libs/workflow.mjs";
import "node:async_hooks";
import { dirname, resolve } from "node:path";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
getContext("nitro-app", {
	asyncContext: void 0,
	AsyncLocalStorage: void 0
});
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
const errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
const errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region src/workflows/aiInsight.js
var import_express = /* @__PURE__ */ __toESM(require_express());
async function generateInsightWorkflow(userId) {
	throw new Error("You attempted to execute workflow generateInsightWorkflow function directly. To start a workflow, use start(generateInsightWorkflow) from workflow/api");
}
generateInsightWorkflow.workflowId = "workflow//./src/workflows/aiInsight//generateInsightWorkflow";
//#endregion
//#region src/workflowHandler.js
const app = (0, import_express.default)();
app.use(import_express.json());
app.post("/api/workflows/test", async (req, res) => {
	try {
		const { id } = await start(generateInsightWorkflow, "test-user-id");
		res.json({
			message: "Workflow started successfully!",
			workflowId: id
		});
	} catch (err) {
		console.error("Workflow Start Error:", err);
		res.status(500).json({ error: err.message });
	}
});
//#endregion
//#region node_modules/.nitro/workflow/webhook.mjs
async function handler(request) {
	const pathParts = new URL(request.url).pathname.split("/");
	const token = decodeURIComponent(pathParts[pathParts.length - 1]);
	if (!token) return new Response("Missing token", { status: 400 });
	try {
		return await resumeWebhook(token, request);
	} catch (error) {
		console.error("Error during resumeWebhook", error);
		return new Response(null, { status: 404 });
	}
}
const POST$1 = handler;
//#endregion
//#region #workflow/webhook.mjs
var webhook_default = async ({ req }) => {
	try {
		return await POST$1(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};
//#endregion
//#region node_modules/.nitro/workflow/steps.mjs
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", {
	value,
	configurable: true
});
async function __builtin_response_array_buffer() {
	return this.arrayBuffer();
}
__name(__builtin_response_array_buffer, "__builtin_response_array_buffer");
async function __builtin_response_json() {
	return this.json();
}
__name(__builtin_response_json, "__builtin_response_json");
async function __builtin_response_text() {
	return this.text();
}
__name(__builtin_response_text, "__builtin_response_text");
registerStepFunction("__builtin_response_array_buffer", __builtin_response_array_buffer);
registerStepFunction("__builtin_response_json", __builtin_response_json);
registerStepFunction("__builtin_response_text", __builtin_response_text);
async function fetch(...args) {
	return globalThis.fetch(...args);
}
__name(fetch, "fetch");
registerStepFunction("step//workflow@4.2.4//fetch", fetch);
//#endregion
//#region #workflow/steps.mjs
var steps_default = async ({ req }) => {
	try {
		return await stepEntrypoint(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};
const POST = workflowEntrypoint(`globalThis.__private_workflows = new Map();
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?\$/i.exec(str);
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    __name(parse, "parse");
    function fmtShort(ms2) {
      var msAbs = Math.abs(ms2);
      if (msAbs >= d) {
        return Math.round(ms2 / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms2 / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms2 / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms2 / s) + "s";
      }
      return ms2 + "ms";
    }
    __name(fmtShort, "fmtShort");
    function fmtLong(ms2) {
      var msAbs = Math.abs(ms2);
      if (msAbs >= d) {
        return plural(ms2, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms2, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms2, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms2, msAbs, s, "second");
      }
      return ms2 + " ms";
    }
    __name(fmtLong, "fmtLong");
    function plural(ms2, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
    }
    __name(plural, "plural");
  }
});

// node_modules/@workflow/utils/dist/time.js
var import_ms = __toESM(require_ms(), 1);

// node_modules/@workflow/core/dist/symbols.js
var WORKFLOW_SLEEP = /* @__PURE__ */ Symbol.for("WORKFLOW_SLEEP");

// node_modules/@workflow/core/dist/sleep.js
async function sleep(param) {
  const sleepFn = globalThis[WORKFLOW_SLEEP];
  if (!sleepFn) {
    throw new Error("\`sleep()\` can only be called inside a workflow function");
  }
  return sleepFn(param);
}
__name(sleep, "sleep");

// node_modules/workflow/dist/stdlib.js
var fetch = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//workflow@4.2.4//fetch");

// src/workflows/aiInsight.js
async function generateInsightWorkflow(userId) {
  console.log(\`[Workflow] Starting AI insight generation for user: \${userId}...\`);
  await sleep("5s");
  console.log(\`[Workflow] Finished AI insight generation for user: \${userId}!\`);
  return {
    success: true,
    userId,
    status: "completed"
  };
}
__name(generateInsightWorkflow, "generateInsightWorkflow");
generateInsightWorkflow.workflowId = "workflow//./src/workflows/aiInsight//generateInsightWorkflow";
globalThis.__private_workflows.set("workflow//./src/workflows/aiInsight//generateInsightWorkflow", generateInsightWorkflow);
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwgIm5vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvdXRpbHMvc3JjL3RpbWUudHMiLCAibm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9jb3JlL3NyYy9zeW1ib2xzLnRzIiwgIm5vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvY29yZS9zcmMvc2xlZXAudHMiLCAibm9kZV9tb2R1bGVzL3dvcmtmbG93L3NyYy9zdGRsaWIudHMiLCAic3JjL3dvcmtmbG93cy9haUluc2lnaHQuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogSGVscGVycy5cbiAqLyB2YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgdyA9IGQgKiA3O1xudmFyIHkgPSBkICogMzY1LjI1O1xuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEB0aHJvd3Mge0Vycm9yfSB0aHJvdyBhbiBlcnJvciBpZiB2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIG51bWJlclxuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi8gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIHZhbC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUodmFsKSkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgKyBKU09OLnN0cmluZ2lmeSh2YWwpKTtcbn07XG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqLyBmdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgICBzdHIgPSBTdHJpbmcoc3RyKTtcbiAgICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhzdHIpO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICAgIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gICAgc3dpdGNoKHR5cGUpe1xuICAgICAgICBjYXNlICd5ZWFycyc6XG4gICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICBjYXNlICd5cnMnOlxuICAgICAgICBjYXNlICd5cic6XG4gICAgICAgIGNhc2UgJ3knOlxuICAgICAgICAgICAgcmV0dXJuIG4gKiB5O1xuICAgICAgICBjYXNlICd3ZWVrcyc6XG4gICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICBjYXNlICd3JzpcbiAgICAgICAgICAgIHJldHVybiBuICogdztcbiAgICAgICAgY2FzZSAnZGF5cyc6XG4gICAgICAgIGNhc2UgJ2RheSc6XG4gICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgcmV0dXJuIG4gKiBkO1xuICAgICAgICBjYXNlICdob3Vycyc6XG4gICAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICBjYXNlICdocnMnOlxuICAgICAgICBjYXNlICdocic6XG4gICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICAgICAgcmV0dXJuIG4gKiBoO1xuICAgICAgICBjYXNlICdtaW51dGVzJzpcbiAgICAgICAgY2FzZSAnbWludXRlJzpcbiAgICAgICAgY2FzZSAnbWlucyc6XG4gICAgICAgIGNhc2UgJ21pbic6XG4gICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgcmV0dXJuIG4gKiBtO1xuICAgICAgICBjYXNlICdzZWNvbmRzJzpcbiAgICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgY2FzZSAnc2Vjcyc6XG4gICAgICAgIGNhc2UgJ3NlYyc6XG4gICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgcmV0dXJuIG4gKiBzO1xuICAgICAgICBjYXNlICdtaWxsaXNlY29uZHMnOlxuICAgICAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgICAgIGNhc2UgJ21zZWNzJzpcbiAgICAgICAgY2FzZSAnbXNlYyc6XG4gICAgICAgIGNhc2UgJ21zJzpcbiAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG59XG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovIGZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gICAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICAgIGlmIChtc0FicyA+PSBkKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gICAgfVxuICAgIGlmIChtc0FicyA+PSBoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gICAgfVxuICAgIGlmIChtc0FicyA+PSBtKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyAnbSc7XG4gICAgfVxuICAgIGlmIChtc0FicyA+PSBzKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gICAgfVxuICAgIHJldHVybiBtcyArICdtcyc7XG59XG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi8gZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICAgIHZhciBtc0FicyA9IE1hdGguYWJzKG1zKTtcbiAgICBpZiAobXNBYnMgPj0gZCkge1xuICAgICAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgZCwgJ2RheScpO1xuICAgIH1cbiAgICBpZiAobXNBYnMgPj0gaCkge1xuICAgICAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgICB9XG4gICAgaWYgKG1zQWJzID49IG0pIHtcbiAgICAgICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIG0sICdtaW51dGUnKTtcbiAgICB9XG4gICAgaWYgKG1zQWJzID49IHMpIHtcbiAgICAgICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIHMsICdzZWNvbmQnKTtcbiAgICB9XG4gICAgcmV0dXJuIG1zICsgJyBtcyc7XG59XG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovIGZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgICB2YXIgaXNQbHVyYWwgPSBtc0FicyA+PSBuICogMS41O1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbikgKyAnICcgKyBuYW1lICsgKGlzUGx1cmFsID8gJ3MnIDogJycpO1xufVxuIiwgImltcG9ydCB0eXBlIHsgU3RyaW5nVmFsdWUgfSBmcm9tICdtcyc7XG5pbXBvcnQgbXMgZnJvbSAnbXMnO1xuXG4vKipcbiAqIFBhcnNlcyBhIGR1cmF0aW9uIHBhcmFtZXRlciAoc3RyaW5nLCBudW1iZXIsIG9yIERhdGUpIGFuZCByZXR1cm5zIGEgRGF0ZSBvYmplY3RcbiAqIHJlcHJlc2VudGluZyB3aGVuIHRoZSBkdXJhdGlvbiBzaG91bGQgZWxhcHNlLlxuICpcbiAqIC0gRm9yIHN0cmluZ3M6IFBhcnNlcyBkdXJhdGlvbiBzdHJpbmdzIGxpa2UgXCIxc1wiLCBcIjVtXCIsIFwiMWhcIiwgZXRjLiB1c2luZyB0aGUgYG1zYCBsaWJyYXJ5XG4gKiAtIEZvciBudW1iZXJzOiBUcmVhdHMgYXMgbWlsbGlzZWNvbmRzIGZyb20gbm93XG4gKiAtIEZvciBEYXRlIG9iamVjdHM6IFJldHVybnMgdGhlIGRhdGUgZGlyZWN0bHkgKGhhbmRsZXMgYm90aCBEYXRlIGluc3RhbmNlcyBhbmQgZGF0ZS1saWtlIG9iamVjdHMgZnJvbSBkZXNlcmlhbGl6YXRpb24pXG4gKlxuICogQHBhcmFtIHBhcmFtIC0gVGhlIGR1cmF0aW9uIHBhcmFtZXRlciAoU3RyaW5nVmFsdWUsIERhdGUsIG9yIG51bWJlciBvZiBtaWxsaXNlY29uZHMpXG4gKiBAcmV0dXJucyBBIERhdGUgb2JqZWN0IHJlcHJlc2VudGluZyB3aGVuIHRoZSBkdXJhdGlvbiBzaG91bGQgZWxhcHNlXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIHBhcmFtZXRlciBpcyBpbnZhbGlkIG9yIGNhbm5vdCBiZSBwYXJzZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRHVyYXRpb25Ub0RhdGUocGFyYW06IFN0cmluZ1ZhbHVlIHwgRGF0ZSB8IG51bWJlcik6IERhdGUge1xuICBpZiAodHlwZW9mIHBhcmFtID09PSAnc3RyaW5nJykge1xuICAgIGNvbnN0IGR1cmF0aW9uTXMgPSBtcyhwYXJhbSk7XG4gICAgaWYgKHR5cGVvZiBkdXJhdGlvbk1zICE9PSAnbnVtYmVyJyB8fCBkdXJhdGlvbk1zIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSW52YWxpZCBkdXJhdGlvbjogXCIke3BhcmFtfVwiLiBFeHBlY3RlZCBhIHZhbGlkIGR1cmF0aW9uIHN0cmluZyBsaWtlIFwiMXNcIiwgXCIxbVwiLCBcIjFoXCIsIGV0Yy5gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5ub3coKSArIGR1cmF0aW9uTXMpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAocGFyYW0gPCAwIHx8ICFOdW1iZXIuaXNGaW5pdGUocGFyYW0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBJbnZhbGlkIGR1cmF0aW9uOiAke3BhcmFtfS4gRXhwZWN0ZWQgYSBub24tbmVnYXRpdmUgZmluaXRlIG51bWJlciBvZiBtaWxsaXNlY29uZHMuYFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKERhdGUubm93KCkgKyBwYXJhbSk7XG4gIH0gZWxzZSBpZiAoXG4gICAgcGFyYW0gaW5zdGFuY2VvZiBEYXRlIHx8XG4gICAgKHBhcmFtICYmXG4gICAgICB0eXBlb2YgcGFyYW0gPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2YgKHBhcmFtIGFzIGFueSkuZ2V0VGltZSA9PT0gJ2Z1bmN0aW9uJylcbiAgKSB7XG4gICAgLy8gSGFuZGxlIGJvdGggRGF0ZSBpbnN0YW5jZXMgYW5kIGRhdGUtbGlrZSBvYmplY3RzIChmcm9tIGRlc2VyaWFsaXphdGlvbilcbiAgICByZXR1cm4gcGFyYW0gaW5zdGFuY2VvZiBEYXRlID8gcGFyYW0gOiBuZXcgRGF0ZSgocGFyYW0gYXMgYW55KS5nZXRUaW1lKCkpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBJbnZhbGlkIGR1cmF0aW9uIHBhcmFtZXRlci4gRXhwZWN0ZWQgYSBkdXJhdGlvbiBzdHJpbmcsIG51bWJlciAobWlsbGlzZWNvbmRzKSwgb3IgRGF0ZSBvYmplY3QuYFxuICAgICk7XG4gIH1cbn1cbiIsICJleHBvcnQgY29uc3QgV09SS0ZMT1dfVVNFX1NURVAgPSBTeW1ib2wuZm9yKCdXT1JLRkxPV19VU0VfU1RFUCcpO1xuZXhwb3J0IGNvbnN0IFdPUktGTE9XX0NSRUFURV9IT09LID0gU3ltYm9sLmZvcignV09SS0ZMT1dfQ1JFQVRFX0hPT0snKTtcbmV4cG9ydCBjb25zdCBXT1JLRkxPV19TTEVFUCA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX1NMRUVQJyk7XG5leHBvcnQgY29uc3QgV09SS0ZMT1dfQ09OVEVYVCA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX0NPTlRFWFQnKTtcbmV4cG9ydCBjb25zdCBXT1JLRkxPV19HRVRfU1RSRUFNX0lEID0gU3ltYm9sLmZvcignV09SS0ZMT1dfR0VUX1NUUkVBTV9JRCcpO1xuZXhwb3J0IGNvbnN0IFNUQUJMRV9VTElEID0gU3ltYm9sLmZvcignV09SS0ZMT1dfU1RBQkxFX1VMSUQnKTtcbmV4cG9ydCBjb25zdCBTVFJFQU1fTkFNRV9TWU1CT0wgPSBTeW1ib2wuZm9yKCdXT1JLRkxPV19TVFJFQU1fTkFNRScpO1xuZXhwb3J0IGNvbnN0IFNUUkVBTV9UWVBFX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX1NUUkVBTV9UWVBFJyk7XG5leHBvcnQgY29uc3QgQk9EWV9JTklUX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ0JPRFlfSU5JVCcpO1xuZXhwb3J0IGNvbnN0IFdFQkhPT0tfUkVTUE9OU0VfV1JJVEFCTEUgPSBTeW1ib2wuZm9yKFxuICAnV0VCSE9PS19SRVNQT05TRV9XUklUQUJMRSdcbik7XG5cbi8qKlxuICogU3ltYm9sIHVzZWQgdG8gc3RvcmUgdGhlIGNsYXNzIHJlZ2lzdHJ5IG9uIGdsb2JhbFRoaXMgaW4gd29ya2Zsb3cgbW9kZS5cbiAqIFRoaXMgYWxsb3dzIHRoZSBkZXNlcmlhbGl6ZXIgdG8gZmluZCBjbGFzc2VzIGJ5IGNsYXNzSWQgaW4gdGhlIFZNIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBjb25zdCBXT1JLRkxPV19DTEFTU19SRUdJU1RSWSA9IFN5bWJvbC5mb3IoJ3dvcmtmbG93LWNsYXNzLXJlZ2lzdHJ5Jyk7XG4iLCAiaW1wb3J0IHR5cGUgeyBTdHJpbmdWYWx1ZSB9IGZyb20gJ21zJztcbmltcG9ydCB7IFdPUktGTE9XX1NMRUVQIH0gZnJvbSAnLi9zeW1ib2xzLmpzJztcblxuLyoqXG4gKiBTbGVlcCB3aXRoaW4gYSB3b3JrZmxvdyBmb3IgYSBnaXZlbiBkdXJhdGlvbi5cbiAqXG4gKiBUaGlzIGlzIGEgYnVpbHQtaW4gcnVudGltZSBmdW5jdGlvbiB0aGF0IHVzZXMgdGltZXIgZXZlbnRzIGluIHRoZSBldmVudCBsb2cuXG4gKlxuICogQHBhcmFtIGR1cmF0aW9uIC0gVGhlIGR1cmF0aW9uIHRvIHNsZWVwIGZvciwgdGhpcyBpcyBhIHN0cmluZyBpbiB0aGUgZm9ybWF0XG4gKiBvZiBgXCIxMDAwbXNcImAsIGBcIjFzXCJgLCBgXCIxbVwiYCwgYFwiMWhcImAsIG9yIGBcIjFkXCJgLlxuICogQG92ZXJsb2FkXG4gKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBzbGVlcCBpcyBjb21wbGV0ZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNsZWVwKGR1cmF0aW9uOiBTdHJpbmdWYWx1ZSk6IFByb21pc2U8dm9pZD47XG5cbi8qKlxuICogU2xlZXAgd2l0aGluIGEgd29ya2Zsb3cgdW50aWwgYSBzcGVjaWZpYyBkYXRlLlxuICpcbiAqIFRoaXMgaXMgYSBidWlsdC1pbiBydW50aW1lIGZ1bmN0aW9uIHRoYXQgdXNlcyB0aW1lciBldmVudHMgaW4gdGhlIGV2ZW50IGxvZy5cbiAqXG4gKiBAcGFyYW0gZGF0ZSAtIFRoZSBkYXRlIHRvIHNsZWVwIHVudGlsLCB0aGlzIG11c3QgYmUgYSBmdXR1cmUgZGF0ZS5cbiAqIEBvdmVybG9hZFxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgc2xlZXAgaXMgY29tcGxldGUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzbGVlcChkYXRlOiBEYXRlKTogUHJvbWlzZTx2b2lkPjtcblxuLyoqXG4gKiBTbGVlcCB3aXRoaW4gYSB3b3JrZmxvdyBmb3IgYSBnaXZlbiBkdXJhdGlvbiBpbiBtaWxsaXNlY29uZHMuXG4gKlxuICogVGhpcyBpcyBhIGJ1aWx0LWluIHJ1bnRpbWUgZnVuY3Rpb24gdGhhdCB1c2VzIHRpbWVyIGV2ZW50cyBpbiB0aGUgZXZlbnQgbG9nLlxuICpcbiAqIEBwYXJhbSBkdXJhdGlvbk1zIC0gVGhlIGR1cmF0aW9uIHRvIHNsZWVwIGZvciBpbiBtaWxsaXNlY29uZHMuXG4gKiBAb3ZlcmxvYWRcbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHNsZWVwIGlzIGNvbXBsZXRlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2xlZXAoZHVyYXRpb25NczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNsZWVwKHBhcmFtOiBTdHJpbmdWYWx1ZSB8IERhdGUgfCBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgLy8gSW5zaWRlIHRoZSB3b3JrZmxvdyBWTSwgdGhlIHNsZWVwIGZ1bmN0aW9uIGlzIHN0b3JlZCBpbiB0aGUgZ2xvYmFsVGhpcyBvYmplY3QgYmVoaW5kIGEgc3ltYm9sXG4gIGNvbnN0IHNsZWVwRm4gPSAoZ2xvYmFsVGhpcyBhcyBhbnkpW1dPUktGTE9XX1NMRUVQXTtcbiAgaWYgKCFzbGVlcEZuKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdgc2xlZXAoKWAgY2FuIG9ubHkgYmUgY2FsbGVkIGluc2lkZSBhIHdvcmtmbG93IGZ1bmN0aW9uJyk7XG4gIH1cbiAgcmV0dXJuIHNsZWVwRm4ocGFyYW0pO1xufVxuIiwgIi8qKlxuICogVGhpcyBpcyB0aGUgXCJzdGFuZGFyZCBsaWJyYXJ5XCIgb2Ygc3RlcHMgdGhhdCB3ZSBtYWtlIGF2YWlsYWJsZSB0byBhbGwgd29ya2Zsb3cgdXNlcnMuXG4gKiBUaGUgY2FuIGJlIGltcG9ydGVkIGxpa2Ugc286IGBpbXBvcnQgeyBmZXRjaCB9IGZyb20gJ3dvcmtmbG93J2AuIGFuZCB1c2VkIGluIHdvcmtmbG93LlxuICogVGhlIG5lZWQgdG8gYmUgZXhwb3J0ZWQgZGlyZWN0bHkgaW4gdGhpcyBwYWNrYWdlIGFuZCBjYW5ub3QgbGl2ZSBpbiBgY29yZWAgdG8gcHJldmVudFxuICogY2lyY3VsYXIgZGVwZW5kZW5jaWVzIHBvc3QtY29tcGlsYXRpb24uXG4gKi9cblxuLyoqXG4gKiBBIGhvaXN0ZWQgYGZldGNoKClgIGZ1bmN0aW9uIHRoYXQgaXMgZXhlY3V0ZWQgYXMgYSBcInN0ZXBcIiBmdW5jdGlvbixcbiAqIGZvciB1c2Ugd2l0aGluIHdvcmtmbG93IGZ1bmN0aW9ucy5cbiAqXG4gKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9GZXRjaF9BUElcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoKC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIGdsb2JhbFRoaXMuZmV0Y2g+KSB7XG4gICd1c2Ugc3RlcCc7XG4gIHJldHVybiBnbG9iYWxUaGlzLmZldGNoKC4uLmFyZ3MpO1xufVxuIiwgImltcG9ydCB7IHNsZWVwIH0gZnJvbSBcIndvcmtmbG93XCI7XG4vKipfX2ludGVybmFsX3dvcmtmbG93c3tcIndvcmtmbG93c1wiOntcInNyYy93b3JrZmxvd3MvYWlJbnNpZ2h0LmpzXCI6e1wiZ2VuZXJhdGVJbnNpZ2h0V29ya2Zsb3dcIjp7XCJ3b3JrZmxvd0lkXCI6XCJ3b3JrZmxvdy8vLi9zcmMvd29ya2Zsb3dzL2FpSW5zaWdodC8vZ2VuZXJhdGVJbnNpZ2h0V29ya2Zsb3dcIn19fX0qLztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUluc2lnaHRXb3JrZmxvdyh1c2VySWQpIHtcbiAgICAvLyBTdGVwIDE6IFNpbXVsYXRlZCBBSSBDYWxsXG4gICAgY29uc29sZS5sb2coYFtXb3JrZmxvd10gU3RhcnRpbmcgQUkgaW5zaWdodCBnZW5lcmF0aW9uIGZvciB1c2VyOiAke3VzZXJJZH0uLi5gKTtcbiAgICAvLyBQYXVzZSBmb3IgNSBzZWNvbmRzIHdpdGhvdXQgY29uc3VtaW5nIG1lbW9yeS9yZXNvdXJjZXNcbiAgICBhd2FpdCBzbGVlcChcIjVzXCIpO1xuICAgIGNvbnNvbGUubG9nKGBbV29ya2Zsb3ddIEZpbmlzaGVkIEFJIGluc2lnaHQgZ2VuZXJhdGlvbiBmb3IgdXNlcjogJHt1c2VySWR9IWApO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgc3RhdHVzOiBcImNvbXBsZXRlZFwiXG4gICAgfTtcbn1cbmdlbmVyYXRlSW5zaWdodFdvcmtmbG93LndvcmtmbG93SWQgPSBcIndvcmtmbG93Ly8uL3NyYy93b3JrZmxvd3MvYWlJbnNpZ2h0Ly9nZW5lcmF0ZUluc2lnaHRXb3JrZmxvd1wiO1xuZ2xvYmFsVGhpcy5fX3ByaXZhdGVfd29ya2Zsb3dzLnNldChcIndvcmtmbG93Ly8uL3NyYy93b3JrZmxvd3MvYWlJbnNpZ2h0Ly9nZW5lcmF0ZUluc2lnaHRXb3JrZmxvd1wiLCBnZW5lcmF0ZUluc2lnaHRXb3JrZmxvdyk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsc0NBQUFBLFNBQUE7QUFFSSxRQUFJLElBQUk7QUFDWixRQUFJLElBQUksSUFBSTtBQUNaLFFBQUksSUFBSSxJQUFJO0FBQ1osUUFBSSxJQUFJLElBQUk7QUFDWixR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
`);
//#endregion
//#region #workflow/workflows.mjs
var workflows_default = async ({ req }) => {
	try {
		return await POST(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/qr/qr_Mayur51015_1778340013803.png": {
		"type": "image/png",
		"etag": "\"b3a-TfAXUbvJ9vVa8eqnliOX+WhVoxc\"",
		"mtime": "2026-05-09T15:20:13.806Z",
		"size": 2874,
		"path": "../public/qr/qr_Mayur51015_1778340013803.png"
	},
	"/qr/qr_Mayur51015_1778308067664.png": {
		"type": "image/png",
		"etag": "\"b3a-TfAXUbvJ9vVa8eqnliOX+WhVoxc\"",
		"mtime": "2026-05-09T06:27:47.666Z",
		"size": 2874,
		"path": "../public/qr/qr_Mayur51015_1778308067664.png"
	},
	"/qr/qr_Mayur51015_1778402466252.png": {
		"type": "image/png",
		"etag": "\"b3a-TfAXUbvJ9vVa8eqnliOX+WhVoxc\"",
		"mtime": "2026-05-10T08:41:06.255Z",
		"size": 2874,
		"path": "../public/qr/qr_Mayur51015_1778402466252.png"
	},
	"/qr/qr_Mayur51015_1778590024402.png": {
		"type": "image/png",
		"etag": "\"b3a-TfAXUbvJ9vVa8eqnliOX+WhVoxc\"",
		"mtime": "2026-05-12T12:47:04.406Z",
		"size": 2874,
		"path": "../public/qr/qr_Mayur51015_1778590024402.png"
	},
	"/qr/qr_Mayurk51015_1778413357250.png": {
		"type": "image/png",
		"etag": "\"ba8-U3o101VIM67HO93oMprjPaG/bR0\"",
		"mtime": "2026-05-10T11:42:37.255Z",
		"size": 2984,
		"path": "../public/qr/qr_Mayurk51015_1778413357250.png"
	},
	"/qr/qr_Mayur51015_1778485988108.png": {
		"type": "image/png",
		"etag": "\"b3a-TfAXUbvJ9vVa8eqnliOX+WhVoxc\"",
		"mtime": "2026-05-11T07:53:08.112Z",
		"size": 2874,
		"path": "../public/qr/qr_Mayur51015_1778485988108.png"
	},
	"/reports/report_69f9d2d54d1df300967965d4_1778161830102.pdf": {
		"type": "application/pdf",
		"etag": "\"566-bkupGjabizd4vGlmyKOM6HBu1X4\"",
		"mtime": "2026-05-07T13:50:30.155Z",
		"size": 1382,
		"path": "../public/reports/report_69f9d2d54d1df300967965d4_1778161830102.pdf"
	},
	"/qr/qr_VinayakWankhade_1778589963668.png": {
		"type": "image/png",
		"etag": "\"b53-30OJ2D1ZQMmiJCMT115WlkSVohw\"",
		"mtime": "2026-05-12T12:46:03.673Z",
		"size": 2899,
		"path": "../public/qr/qr_VinayakWankhade_1778589963668.png"
	},
	"/reports/report_69f9d2d54d1df300967965d4_1778163920817.pdf": {
		"type": "application/pdf",
		"etag": "\"899-uKytz+pSsOjqQxrffnY0U5MxYSY\"",
		"mtime": "2026-05-07T14:25:20.856Z",
		"size": 2201,
		"path": "../public/reports/report_69f9d2d54d1df300967965d4_1778163920817.pdf"
	},
	"/reports/report_69f9d2d54d1df300967965d4_1778163106805.pdf": {
		"type": "application/pdf",
		"etag": "\"899-eJohMxNAe81YEMIV4VNJ5KcIqQY\"",
		"mtime": "2026-05-07T14:11:46.840Z",
		"size": 2201,
		"path": "../public/reports/report_69f9d2d54d1df300967965d4_1778163106805.pdf"
	},
	"/reports/report_69f9d2d54d1df300967965d4_1778163017934.pdf": {
		"type": "application/pdf",
		"etag": "\"566-Qmc0sPNYoWq0sD90xIcGXEZDfUM\"",
		"mtime": "2026-05-07T14:10:17.985Z",
		"size": 1382,
		"path": "../public/reports/report_69f9d2d54d1df300967965d4_1778163017934.pdf"
	},
	"/reports/report_69f9d2d54d1df300967965d4_1778300688880.pdf": {
		"type": "application/pdf",
		"etag": "\"83b-Em5erGg8Ty0dLD3RX/JER4UIhuc\"",
		"mtime": "2026-05-09T04:24:48.944Z",
		"size": 2107,
		"path": "../public/reports/report_69f9d2d54d1df300967965d4_1778300688880.pdf"
	},
	"/reports/report_69f9d2d54d1df300967965d4_1778237206301.pdf": {
		"type": "application/pdf",
		"etag": "\"83b-F1qtvAMUrxq7ZdJAaNQMoHCwJbE\"",
		"mtime": "2026-05-08T10:46:46.369Z",
		"size": 2107,
		"path": "../public/reports/report_69f9d2d54d1df300967965d4_1778237206301.pdf"
	},
	"/reports/report_69f9d2d54d1df300967965d4_1778302651300.pdf": {
		"type": "application/pdf",
		"etag": "\"83b-IbX8kPPzIUIhvamk5vgXC+lgBro\"",
		"mtime": "2026-05-09T04:57:31.365Z",
		"size": 2107,
		"path": "../public/reports/report_69f9d2d54d1df300967965d4_1778302651300.pdf"
	},
	"/reports/report_69f9d2d54d1df300967965d4_1778321702789.pdf": {
		"type": "application/pdf",
		"etag": "\"83b-DZJetlHnXd/HXzvH2BqQqbF1x5I\"",
		"mtime": "2026-05-09T10:15:02.867Z",
		"size": 2107,
		"path": "../public/reports/report_69f9d2d54d1df300967965d4_1778321702789.pdf"
	},
	"/reports/report_69fed50ec29c275a1d84beb6_1778338786142.pdf": {
		"type": "application/pdf",
		"etag": "\"947-X4FDwnaL5XxOxTDVsKMqMtxc0Jk\"",
		"mtime": "2026-05-09T14:59:46.209Z",
		"size": 2375,
		"path": "../public/reports/report_69fed50ec29c275a1d84beb6_1778338786142.pdf"
	},
	"/reports/report_6a01a1a9a0a8a6348359501a_1778495516377.pdf": {
		"type": "application/pdf",
		"etag": "\"a61-yX5rXkG6bp0jrm9OKb1TqB/b7Ak\"",
		"mtime": "2026-05-11T10:31:56.456Z",
		"size": 2657,
		"path": "../public/reports/report_6a01a1a9a0a8a6348359501a_1778495516377.pdf"
	},
	"/reports/report_6a01a1a9a0a8a6348359501a_1778589671177.pdf": {
		"type": "application/pdf",
		"etag": "\"a61-/EIRRquomjgT65pdJE2V3oDHXuc\"",
		"mtime": "2026-05-12T12:41:11.260Z",
		"size": 2657,
		"path": "../public/reports/report_6a01a1a9a0a8a6348359501a_1778589671177.pdf"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
const METHODS = new Set(["HEAD", "GET"]);
const EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
const findRoute = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/.well-known/workflow/v1/step",
		handler: toEventHandler(steps_default)
	}, $1 = {
		route: "/.well-known/workflow/v1/flow",
		handler: toEventHandler(workflows_default)
	}, $2 = {
		route: "/api/workflows/**",
		handler: toEventHandler(toFetchHandler(app))
	}, $3 = {
		route: "/.well-known/workflow/v1/webhook/:token",
		handler: toEventHandler(webhook_default)
	};
	return (m, p) => {
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		if (p === "/.well-known/workflow/v1/step") return { data: $0 };
		else if (p === "/.well-known/workflow/v1/flow") return { data: $1 };
		let s = p.split("/"), l = s.length;
		if (l > 1) {
			if (s[1] === "api") {
				if (l > 2) {
					if (s[2] === "workflows") return {
						data: $2,
						params: { "_": s.slice(3).join("/") }
					};
				}
			} else if (s[1] === ".well-known") {
				if (l > 2) {
					if (s[2] === "workflow") {
						if (l > 3) {
							if (s[3] === "v1") {
								if (l > 4) {
									if (s[4] === "webhook") {
										if (l === 6 || l === 5) {
											if (l > 5) return {
												data: $3,
												params: { "token": s[5] }
											};
										}
									}
								}
							}
						}
					}
				}
			}
		}
	};
})();
const globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
const APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function createNitroApp() {
	const hooks = void 0;
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
const tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
const _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
const port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
