/**
 * Copyright (c) 2016-2018 Richard Connamacher. Permission is granted to use this code under
 * the terms of the Simplified BSD License, https://opensource.org/licenses/BSD-2-Clause
 *
 * This monkey-patches the native ECMAScript 6 Promise class to add support for
 * the Promise Rejection Events unhandledrejection and rejectionhandled, as defined
 * in ECMAScript 7 and the HTML Living Standard.
 *
 * THIS FILE MUST NOT BE TRANSPILED into ECMAScript 5. Builtins like Promise can only
 * be subclassed using native ES6 classes, not backwards-compatible ES5 constructor
 * functions.
 *
 * Promise Rejection Events allow for the logging of uncaught errors inside promises,
 * similar to window.onerror in non-promise-based code. Without this feature,
 * there's no way to detect or log unhandled errors in promise-based code.
 *
 * Browser Compatibility:
 *
 * As of 4/2018, only Chrome (49+) and Safari (11+) support these events natively.
 *
 * This polyfill supports Safari 10, Firefox 45 (tested on 47), and Edge 13.
 *
 * Supporting any older browsers than these would require a complete replacement of the
 * native Promise object with a compatible ES5-based Promise polyfill.
 *
 * Sample:
 *
 * window.addEventListener("unhandledrejection", event => logger.logError(
 *    "Uncaught error (in promise)", event.reason
 * ));
 *
 * window.onunhandledrejection = event => console.log(
 *     "You can use the 'on' property too", event.reason
 * );
 *
 * More information on Promise Rejection Events:
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent
 * https://googlechrome.github.io/samples/promise-rejection-events/
 */
(function() {
  "use strict";

  if ("onunhandledrejection" in window) {
    // Browser already has this feature, no need to patch it.
    return;
  }

  let global                  = window,
    NativePromise           = global.Promise,
    __PromiseIsHandled__    = Symbol("[[PromiseIsHandled]]"),
    __Rejected__            = Symbol("[[Rejected]]"),
    __PromiseResult__       = Symbol("[[PromiseResult]]");

  class PromiseRejectionEvent extends Event {
    constructor(type, parameters) {
      super(type, {
        cancelable: true
      });
      Object.defineProperties(this, {
        promise: {
          value: parameters.promise,
          enumerable: true
        },
        reason: {
          value: parameters.reason,
          enumerable: true
        }
      });
    }
  }

  function dispatchPromiseEvent(type, promise, reason) {
    let event = new PromiseRejectionEvent(type, {
      promise: promise,
      reason: reason
    });
    let propertyVersion = "on" + type;

    global.dispatchEvent(event);

    if (global[propertyVersion]) {
      // In a timeout to prevent errors from blocking code
      setTimeout( () => {
        if (typeof global[propertyVersion] == "function") {
          global[propertyVersion](event);
        }
      });
    }
  }

  let blockRecursion = false;

  class Promise extends NativePromise {
    constructor(callback) {
      super(callback);

      // The super.then() call below creates a new Promise, making
      // recursion-busting necessary:
      if (blockRecursion) {
        return this;
      }
      blockRecursion = true;

      this[__PromiseIsHandled__] = false;
      this[__Rejected__] = false;

      // This causes a recursive call to this constructor:
      super.then(null, reason => {
        if (!this[__PromiseIsHandled__]) {
          this[__PromiseResult__] = reason;
          this[__Rejected__] = true;
          dispatchPromiseEvent("unhandledrejection", this, reason);
        }
      });

      blockRecursion = false;
      return this;
    }

    then(onResolve, onReject) {
      if (this[__Rejected__] && !this[__PromiseIsHandled__]) {
        // The first time an already-rejected promise is handled
        dispatchPromiseEvent("rejectionhandled", this, this[__PromiseResult__]);
      }
      this[__PromiseIsHandled__] = true;
      return super.then(onResolve, onReject);
    }

    catch(onReject) {
      // Make sure it calls then (which it should)
      return this.then(null, onReject);
    }
  }

  global.addEventListener("unhandledrejection", event => {
    // This mostly matches Chrome's existing console message, except Chrome
    // also retroactively reduces its log level and adds a checkmark if it's
    // later handled.
    console.error("Uncaught (in promise)",event.reason);
  });

  global.Promise = Promise;
  global.PromiseRejectionEvent = PromiseRejectionEvent;
  global.onunhandledrejection = null;
  global.onrejectionhandled = null;
})();