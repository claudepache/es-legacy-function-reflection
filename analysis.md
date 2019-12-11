This documents presents the result of the author’s reverse engineering of Function#caller and Function#arguments
in mainstream browsers.

Most of the results have been obtained through the tests published on
[simple-tests.js](https://github.com/claudepache/es-legacy-function-reflection/blob/master/simple-tests.js).
The missing ones (most notably cross-realm interactions and the returned value of `.arguments`) are left as exercise to the reader.
(For cross-realm stuff, the author didn’t dare publish the horrible hack he has resorted to in order to obtain a foreign Realm. 🤪)


## Implementation strategy of .caller and .arguments

* Magic immutable (non-writable, non-configurable) own data properties on individual functions: Chrome 79, Safari 13, Edge 18.
     That violates the essential invariants of internal methods, because the actual value varies. 👎
* Deletable accessors on Function.prototype: Firefox 71, proposed spec.



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
or an Arguments object reflecting the actual arguments passed to the function call.
This object is distinct from the one available through the `arguments` binding available inside the function, and
modifications made on that `arguments` binding are not reflected on the returned object.


## Value returned by .caller per type of the actual caller

Note that, by nature, proxies and bound functions are never considered “caller”;
instead either the object they wrap or (for proxies) the corresponding handler plays that role.

✔︎ = returns the caller (or the caller of the caller, or... when PTC is at work 🤥)  
⛔ = returns null  
💥 = throws a TypeError  

type of the caller | Firefox 71 | Chrome 79 | Safari 13 | Edge 18 | Proposed spec
------------------|------------|-----------|-----------|---------|-----------
non-ECMAScript    | ⛔        | ⛔         | ⛔       | ✔︎ 👎    | ⛔
strict            | 💥        | ⛔         | 💥       | 💥      | 💥
generator/async   | ✔︎         | ✔︎          | 💥        | ✔︎       | 💥
non-constructor   | ✔︎         | ✔︎          | ✔︎         | ✔︎       | ✔︎
legacy            | ✔︎         | ✔︎          | ✔︎         | ✔︎       | ✔︎
cross-realm       | ✔︎         | ✔︎          | ✔︎         | ✔︎       | ⛔


