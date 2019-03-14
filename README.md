# Legacy reflection features for functions in JavaScript

Deprecated (as it breaks encapsulation provided by functions), but needed for web compatibility.

Goals:

* Web-compatibility is maintained.
* The functionality is disabled for (at least) all but non-strict functions.    
* Cross-realm leakages are forbidden.
* It is easy to disabled completely the functionality for a given realm.


In annex B.

> NOTE. Implementations have historically provided “caller” and “arguments” magic properties on functions. The following semantics allow them to keep backward compatibility with those deprecated features while limiting the API surface and safely restricting their functionality to some class of legacy functions and avoiding any cross-realm leakages.

Implementations must not define a "caller" or an "arguments" own property on any individual function. Instead, they are permitted to define them as accessor properties on Function.prototype, according to the specification below.

## IsLeakableFunction(_func_ [, _expectedRealm_])

1. Assert: _func_ is an object that has a [[Call]] internal method.
1. If _func_ is not an [ECMAScript function object], return **false**.
1. If _expectedRealm_ was passed, then
    1. If _func_.[[Realm]] is not _expectedRealm_, return **false**.
1. If _func_.[[Strict]] is not **false**, return **false**.
1. If _func_.[[FunctionKind]] is not **"normal"**, return **false**.
1. If _func_ does not have a [[Construct]] internal method, return **false**.
1. Return **true**.


## GetTopMostExecutionContext(_func_) 

1. Assert: _func_ is an object that has a [[Call]] internal method.
1. If there is no [execution context] in the [execution context stack] whose Function component has value _func_, return **undefined**.
1. Return the top-most [execution context](https://tc39.github.io/ecma262/#sec-execution-contexts) in the [execution context stack](https://tc39.github.io/ecma262/#execution-context-stack) whose Function component has value  _func_.


## get Function.prototype.caller

Function.prototype.caller is an accessor property with attributes { [[Set]]: **undefined**, [[Enumerable]]: **false**, [[Configurable]]: **true** }.

The [[Get]] attribute is a built-in function that performs the following steps:

1. If Type(_func_) is not Object or if _func_ does not have a [[Call]] internal method, throw a **TypeError** exception.
1. Let _currentRealm_ be the [current Realm Record].
1. If ! IsLeakableFunction(_func_, _currentRealm_) is **false**, throw a **TypeError** exception.
1. Let _ctx_ be ! GetTopMostExecutionContext(_func_).
1. If _ctx_ is **undefined**, return **null**.
1. If _ctx_ has no parent [execution context] in the [execution context stack], return **null**.
1. Let _ctxParent_ be the parent [execution context] of _ctx_.
1. Let _G_ be the value of the Function component of _ctxParent_.
1. If _G_ is **null**, return **null**.
1. If _G_ is not an [ECMAScript function object], return **null**.
1. If _G_.[[Realm]] is not _currentRealm_, return **null**.
1. If _G_.[[Strict]] is not **false**, throw a **TypeError** exception.
1. If _G_.[[FunctionKind]] is not **"normal"**, throw a **TypeError** exception.
1. Return _G_.


## get Function.prototype.arguments

Function.prototype.arguments is an accessor property with attributes { [[Set]]: **undefined**, [[Enumerable]]: **false**, [[Configurable]]: **true** }.

The following component is added to [ECMAScript Code Execution Contexts](https://tc39.github.io/ecma262/#table-23):

* ArgumentsList: the List of arguments with which the relevant function was called.

The [PrepareForOrdinaryCall](https://tc39.github.io/ecma262/#sec-prepareforordinarycall) abstract operation takes (and is called with) an additional argument, _argumentsList_, and sets it to the ArgumentsList component of the newly created _calleeContext_. (This step is needed only when ! IsLeakableFunction(_F_) is **true**.)

The [CreateUnmappedArgumentsObject] abstract operation takes an optional second argument, _func_. When it is provided, the callee property of the created Arguments object is set as a data property that references _func_, akin to [CreateMappedArgumentsObject].

The [[Get]] attribute of Function.prototype.arguments is a built-in function that performs the following steps:

1. If Type(_func_) is not Object or if _func_ does not have a [[Call]] internal method, throw a **TypeError** exception.
1. Let _currentRealm_ be the [current Realm Record].
1. If ! IsLeakableFunction(_func_, _currentRealm_) is **false**, throw a **TypeError** exception.
1. Let _ctx_ be ! GetTopMostExecutionContext(_func_).
1. If _ctx_ is **undefined**, return **null**.
1. Let _argumentsList_ the value of the ArgumentsList component of _ctx_.
1. Return ! CreateUnmappedArgumentsObject(_argumentsList_, _func_).



# Differences between this spec and current implementations in mainstream browsers

* Function#caller and Function#arguments are specced as deletable accessors on Function.prototype. That matches what Firefox does; at the time of writing other browsers define them as “magic” immutable data properties on individual function objects.
* The spec prevents any cross-realm leakage. It is currently not tested what implementations do.
* The set of functions for which .caller and .arguments is enabled in the spec is the intersection of the sets of such functions in individual mainstream browsers. See [Issue #1] for details.
* The set of functions which may be returned by .caller in the spec is the intersection of the sets of such functions in individual mainstream browsers. See [Issue #1] for details.
* The set of functions for which a TypeError is thrown when it is about to be returned by .caller is the union of the sets of such functions in individual mainstream browsers. See [Issue #1] for details.




[ECMAScript function object]: https://tc39.github.io/ecma262/#sec-ecmascript-function-objects
[current Realm Record]: https://tc39.github.io/ecma262/#current-realm
[execution context]: https://tc39.github.io/ecma262/#sec-execution-contexts
[execution context stack]: https://tc39.github.io/ecma262/#execution-context-stack
[CreateUnmappedArgumentsObject]: https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
[CreateMappedArgumentsObject]: https://tc39.github.io/ecma262/#sec-createmappedargumentsobject
[Issue #1]: https://github.com/claudepache/es-legacy-function-reflection/issues/1
