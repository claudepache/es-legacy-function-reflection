This documents presents the result of the author’s reverse engineering of Function#caller and Function#arguments
in latest versions of Firefox, Chrome, Safari and Edge.

Many of the results have been obtained through the tests published on
[simple-tests.js](simple-tests.js).
The missing ones (most notably cross-realm interactions and the returned value of `.arguments`) are left as exercise to the reader.
(For cross-realm stuff, the author didn’t dare publish the horrible hack he has resorted to in order to obtain a foreign Realm. 🤪)


## API surface

Function#caller and Function#arguments are implemented as follows:

* Magic immutable (non-writable, non-configurable) own data properties on individual functions: Chrome 79, Safari 13, Edge 18. That violates the essential invariants of internal methods, because the actual value varies. 👎
* Deletable accessors on Function.prototype: Firefox 71, proposed spec. However Firefox 71 has a custom setter that throws on censored functions and does nothing on non-censored functions; the proposed spec has no setter.


## Classification of functions (and non-functions) used in the following sections

* _non-function_: an object that does not have a [[Call]] internal method;
* _non-ECMAScript_: a function whose implementation is not written in ECMAScript. That includes bound functions.
* _strict_: An ECMAScript function whose code is in strict mode.
    That includes everything defined through the `class` construct.
* _generator/async_: A generator function, an async function, or both.
* _non-constructor_: An ECMAScript function which is not a constructor,
  such as arrow functions, methods and accessors in object literals. 
* _legacy_: functions that don’t fall into the previous cases,
    i.e. non-strict functions that are constructed with the `function` keyword (excluding generators and asyncs)
    or the `Function` constructor.
* _cross-realm_: a function that is not of the same Realm as some referenced Realm (depending on context).

Per spec, builtins ought to be either _non-ECMAScript_ or _strict_.


## Behaviour of .caller and .arguments per type of the object it is queried on

The interaction with proxies will differ on whether the property is implemented as accessor or as data property.
All implementations produce the expected result.

“Non-function” and “cross-realm” make sense only when `caller` and `arguments` are implemented as accessors.

✔︎ = returns null when not in the stack frame  
💥 = throws a TypeError  
When the target falls in several categories (e.g. cross-realm legacy), the more severe outcome is chosen.

type of the target| Firefox 71 | Chrome 79 | Safari 13 | Edge 18 | Proposed spec
------------------|------------|-----------|-----------|---------|--------
non-function      | 💥         | N/A       | N/A       | N/A     | 💥
non-ECMAScript    | 💥         | 💥        | 💥        | 💥     | 💥
strict            | 💥         | 💥        | 💥        | 💥     | 💥
generator/async   | 💥         | 💥        | 💥        | 💥     | 💥
non-constructor   | 💥         | 💥        | 💥        | 💥     | 💥
legacy            | ✔︎          | ✔︎         | ✔︎         | ✔︎       | ✔︎
cross-realm       | ✔︎          | N/A       | N/A       | N/A     | 💥


## Value returned by .arguments

When queried on non-censored functions, all implementations return either null (when the function is not in the stack frame),
or an Arguments object reflecting the actual arguments passed during the function call.
This object is distinct from the one available through the `arguments` binding available inside the function, and
modifications made on that `arguments` binding are not reflected on the returned object. Even, every access to the .arguments property yields a distinct object (so that `(function f() { return f.arguments === f.arguments })()` returns `false`).

In all tested implementations, whether the .caller property of the Arguments object produced by .arguments is poisoned or not, matches whether the same condition holds on the object available through the `arguments` binding inside the function. (According to the spec, that should happens when the parameter list is non-simple, but not all implementations observe that.)


## Value returned by .caller per type of the actual caller

The value returned (when one is returned) seems to be determined by the execution context stack; i.e., it will be the function attached to the execution context that is just below the topmost execution context corresponding to the target. This can be tested in the following ways:

* it is not the “last caller” of the target when the corresponding invocation has been completed, see: [ecma262#562-comment](https://github.com/tc39/ecma262/issues/562#issuecomment-218605762) for a test;
* it is not a proxy or a bound function; instead it will be either the object they wrap, or (for proxies) the corresponding handler;
* the true caller will not be returned when the call has occurred at Proper tail call position (in implementations that support this feature).

✔︎ = returns the caller (or the caller of the caller, or... when PTC is at work 🤥)  
⛔ = returns null  
💥 = throws a TypeError  
When the target falls in several categories (e.g. strict non-constructor), the more severe outcome is chosen.

type of the caller | Firefox 71 | Chrome 79 | Safari 13 | Edge 18 | Proposed spec
------------------|------------|-----------|-----------|---------|-----------
non-ECMAScript    | ⛔        | ⛔         | ⛔       | ✔︎ 👎    | ⛔
strict            | 💥        | ⛔         | 💥       | 💥      | ⛔
generator/async   | ✔︎         | ✔︎          | 💥        | ✔︎       | ⛔
non-constructor   | ✔︎         | ✔︎          | ✔︎         | ✔︎       | ✔︎
legacy            | ✔︎         | ✔︎          | ✔︎         | ✔︎       | ✔︎
cross-realm       | ✔︎         | ✔︎          | ✔︎         | ✔︎       | ⛔

In the proposed spec, we purposefully remove any potential way to distinguish between non-ECMAScript functions, strict functions, and cross-realm functions.

## Setting to .caller and .arguments

In all circumstances, the assignments `func.caller = 42` and `func.arguments = 42` have no effect; in some cases, a TypeError is thrown as feedback. The precise behaviour is described by the following table:

uncensored — a function object on which getting .caller or .arguments is permitted  
censored — a function object for which attempting to get .caller or .arguments throws a TypeError

⛔️ = assignment fails silently  
💥 = a TypeError is thrown

operation | “own-property”<br>Chrome 79, Safari 13, Edge 18 | “shared-setter”<br>Firefox 71 | “no-setter”<br>Proposed spec
-------------------------------------|----------------|-----------------|-----------
uncensored.caller = 42               |  ⛔️  |  ⛔️  |  ⛔️  
censored.caller = 42                 |  💥  |  💥  |  ⛔️  
"use strict"; uncensored.caller = 42 |  💥  |  ⛔️  |  💥  
"use strict"; censored.caller = 42   |  💥  |  💥  |  💥  

“own-property” =  a poisoning mechanism is placed on individual functions.  
“shared-setter” =  a setter placed on Function.prototype selectively throws depending on the receiver.  
“no-setter” = an accessor property without setter is placed on Function.prototype.  

The migration from own properties to shared accessor without exotic behaviour implies some trade-off. The proposed spec chooses to rely on the default behaviour of failing assignment in both strict and non-strict mode.


