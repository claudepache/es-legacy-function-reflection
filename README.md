# Legacy reflection features for functions in JavaScript

## Status

[ECMAScript proposal](https://github.com/tc39/proposals) at stage 0 of the process.

* Main author: Claude Pache ([@claudepache](https://github.com/claudepache))
* Champion: Mark S. Miller ([@erights](https://github.com/erights))

## Previous discussion

* [tc39/ecma262#562](https://github.com/tc39/ecma262/issues/562)

## Purpose

This is a proposal for standardising Function#caller and Function#arguments.

Those features are deprecated (as it breaks encapsulation provided by functions), but needed for web compatibility. Therefore, it is proposed to add them in [Annex B] (or whatever will follow from [tc39/ecma262#1595](https://github.com/tc39/ecma262/issues/1595)).

## Design principles

* Prevent dangerous or unwise behaviour.
    * Avoid giving access to objects that are not otherwise accessible. Because of other constraints, this is not mandatory for non-strict functions.
    * Avoid cross-realm leakages.
* Deprecate the functionality.
    * Throwing a TypeError is preferred over returning null, which in turn is preferred over just working.
    * The functionality may easily be completely removed for a given realm at runtime.
* Avoid making it possible to discriminate between a strict function and a non-ECMAScript function.
* Don’t break the web.
    * Each proposed behaviour ought to be either currently implemented by one or more mainstream browsers, or carefully justified.
* Avoid work from implementators.
    * It is carefully tested what implementations currently do, so that they need minimal modifications.


# Spec Text

> NOTE. Implementations have historically provided “caller” and “arguments” magic properties on functions. The following semantics allow them to keep backward compatibility with those deprecated features while limiting the API surface and safely restricting their functionality to some class of legacy functions and avoiding any cross-realm leakages.

Implementations must not define a "caller" or an "arguments" own property on any individual function. Instead, they are permitted to define them as accessor properties on [%Function.prototype%], according to the specification below.

## IsLeakableFunction(_func_ [, _expectedRealm_])
1. Assert: _func_ is an object that has a [[Call]] internal method.
1. If _func_ is not an [ECMAScript function object], return **false**.
1. If _expectedRealm_ was passed, then
    1. If _func_.[[Realm]] is not _expectedRealm_, return **false**.
1. If _func_.[[Strict]] is **true**, return **false**.
1. If _func_ does not have a [[Construct]] internal method, return **false**.
1. Return **true**.

> NOTE. The functions for which IsLeakableFunction return true are non-strict functions from the expected Realm that were created with _[FunctionDeclaration]_ or _[FunctionExpression]_ syntax or using the [Function constructor].


## GetTopMostExecutionContext(_func_) 

1. Assert: _func_ is an object that has a [[Call]] internal method.
1. If there is no [execution context] in the [execution context stack] whose Function component has value _func_, return **undefined**.
1. Return the top-most [execution context] in the [execution context stack] whose Function component has value  _func_.

## get Function.prototype.caller

Function.prototype.caller is an accessor property with attributes { [[Set]]: **undefined**, [[Enumerable]]: **false**, [[Configurable]]: **true** }.

The [[Get]] attribute is a built-in function that performs the following steps:

1. If Type(_func_) is not Object or if _func_ does not have a [[Call]] internal method, throw a **TypeError** exception.
1. Let _currentRealm_ be the [current Realm Record].
1. If ! [IsLeakableFunction]\(_func_, _currentRealm_) is **false**, throw a **TypeError** exception.
1. Let _ctx_ be ! [GetTopMostExecutionContext]\(_func_).
1. If _ctx_ is **undefined**, return **null**.
1. If _ctx_ has no parent [execution context] in the [execution context stack], return **null**.
1. Let _ctxParent_ be the parent [execution context] of _ctx_.
1. Let _G_ be the value of the Function component of _ctxParent_.
1. If _G_ is **null**, return **null**.
1. If _G_ is not an [ECMAScript function object], return **null**.
1. If _G_.[[Realm]] is not _currentRealm_, return **null**.
1. If _G_.[[Strict]] is **true**, return **null**
1. If _G_.[[ECMAScriptCode]] is not an instance of _FunctionBody_, return **null**. — NOTE: This condition targets generators and async functions.
1. Return _G_.

> NOTE. The returned value will not be the real caller if its corresponding [execution context] has been removed from the [execution context stack] as a result of a [tail position call].

> NOTE 2. Proxy functions and bound functions are never considered as “caller” for the purpose of this algorithm, because they never appear in the [execution context stack].

## Additional component of execution contexts

The following component is added to [execution context]s:

* ArgumentsList: optionally, the List of arguments with which the relevant function was called.

The [[[Call]] internal method of ECMAScript function objects](https://tc39.github.io/ecma262/#sec-ecmascript-function-objects-call-thisargument-argumentslist) takes the following additional step after Step 4:

1. If ! [IsLeakableFunction]\(_F_) is **true**, then
    1. Set the ArgumentsList of _calleeContext_ to _argumentsList_.

## Modification of the CreateUnmappedArgumentsObject abstract operation

The abstract operation [CreateUnmappedArgumentsObject](https://tc39.es/ecma262/#sec-createunmappedargumentsobject) is modified in order to take a second parameter:

**CreateUnmappedArgumentsObject](_argumentsList_, _callee_)**

The existing uses of that abstract operation are modified in order to pass **undefined** as their second argument.

The penultimate step of the algorithm:

1. Perform ! [DefinePropertyOrThrow]\(_obj_, **"callee"**, PropertyDescriptor { [[Get]]: [%ThrowTypeError%], [[Set]]: [%ThrowTypeError%], [[Enumerable]]: **false**, [[Configurable]]: **false** }).

is replaced with:

1. If _callee_ is **undefined**, then
    1. Perform ! [DefinePropertyOrThrow]\(_obj_, **"callee"**, PropertyDescriptor { [[Get]]: [%ThrowTypeError%], [[Set]]: [%ThrowTypeError%], [[Enumerable]]: **false**, [[Configurable]]: **false** }).
1. Else,
    1. Assert: _callee_ is a function object.
    1. Perform ! [DefinePropertyOrThrow]\(_obj_, **"callee"**, PropertyDescriptor { [[Value]]: _func_, [[Writable]]: **true**, [[Enumerable]]: **false**, [[Configurable]]: **true** }).


## get Function.prototype.arguments

Function.prototype.arguments is an accessor property with attributes { [[Set]]: **undefined**, [[Enumerable]]: **false**, [[Configurable]]: **true** }.


The [[Get]] attribute of Function.prototype.arguments is a built-in function that performs the following steps:

1. If Type(_func_) is not Object or if _func_ does not have a [[Call]] internal method, throw a **TypeError** exception.
1. Let _currentRealm_ be the [current Realm Record].
1. If ! [IsLeakableFunction]\(_func_, _currentRealm_) is **false**, throw a **TypeError** exception.
1. Let _ctx_ be ! [GetTopMostExecutionContext]\(_func_).
1. If _ctx_ is **undefined**, return **null**.
1. Let _func_ be the value of the Function component of _ctx_.
1. Assert: ! [IsLeakableFunction]\(_func_) is **true**.
1. Let _argumentsList_ be the value of the ArgumentsList component of _ctx_.
1. If ! [IsSimpleParameterList] of _func_.[[FormalParameters]] is **true**, let _callee_ be _func_.
1. Else, let _callee_ be **undefined**.
1. Return [CreateUnmappedArgumentsObject]\(_argumentsList_, _callee_) — where CreateUnmappedArgumentsObject has been patched as above.


## Modifications of the Forbidden Extensions section

The two items in [Forbidden Extensions] related to the properties “caller” and “arguments” of function objects are replaced with the following one:

* An implementation must not extend any function object with own properties named “caller” or “arguments“, except for the corresponding properties on [%Function.prototype%] that are defined in this specification.


# Differences between this spec and current implementations in mainstream browsers

Details are found on [analysis.md](analysis.md). Here is a summary:

* Function#caller and Function#arguments are specced as deletable accessors on Function.prototype. That matches what Firefox does; at the time of writing other browsers define them as “magic” immutable data properties on individual function objects.
* The spec prevents cross-realm leakages. Implementations don’t.
* The set of functions which may be returned by .caller in the spec is the intersection of the sets of such functions in individual mainstream browsers.
* The spec does not exhibit distinguishable behaviour when the function which is deemed as “caller” is a non-ECMAScript function or when it is a strict function. Some implementations do.

[IsLeakableFunction]: #isleakablefunctionfunc--expectedrealm
[GetTopMostExecutionContext]: #gettopmostexecutioncontextfunc
[CreateUnmappedArgumentsObject]: #modificationofthecreateunmappedargumentsobjectabstractoperation
[current Realm Record]: https://tc39.github.io/ecma262/#current-realm
[ECMAScript function object]: https://tc39.github.io/ecma262/#sec-ecmascript-function-objects
[execution context]: https://tc39.github.io/ecma262/#sec-execution-contexts
[execution context stack]: https://tc39.github.io/ecma262/#execution-context-stack
[List]: https://tc39.github.io/ecma262/#sec-list-and-record-specification-type
[CreateDataProperty]: https://tc39.github.io/ecma262/#sec-createdataproperty
[DefinePropertyOrThrow]: https://tc39.github.io/ecma262/#sec-definepropertyorthrow
[ObjectCreate]: https://tc39.github.io/ecma262/#sec-objectcreate
[ToString]: https://tc39.github.io/ecma262/#sec-tostring
[%Array.prototype.values%]: https://tc39.github.io/ecma262/#sec-array.prototype.values
[%Function.prototype%]: https://tc39.es/ecma262/#sec-properties-of-the-function-prototype-object
[%Object.prototype%]: https://tc39.github.io/ecma262/#sec-properties-of-the-object-prototype-object
[%ThrowTypeError%]: https://tc39.github.io/ecma262/#sec-%throwtypeerror%
[FunctionDeclaration]: https://tc39.es/ecma262/#prod-FunctionDeclaration
[FunctionExpression]: https://tc39.es/ecma262/#prod-FunctionExpression
[Function constructor]: https://tc39.es/ecma262/#sec-function-constructor
[tail position call]: https://tc39.es/ecma262/#sec-tail-position-calls
[Annex B]: https://tc39.es/ecma262/#sec-additional-ecmascript-features-for-web-browsers
[Forbidden Extensions]: https://tc39.es/ecma262/#sec-forbidden-extensions
