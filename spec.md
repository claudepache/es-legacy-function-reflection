# Spec Text

_Unless otherwise specified, the following text goes in [Annex B] (normative-optional features needed by web browsers)._

> NOTE. Implementations have historically provided “caller” and “arguments” magic properties on functions.
The following semantics allow them to keep backward compatibility with those deprecated features
while limiting the API surface and safely restricting their functionality.

## IsAllowedReceiverFunctionForCallerAndArguments(_func_, _expectedRealm_)

The abstract operation IsAllowedReceiverFunctionForCallerAndArguments accepts as arguments a function object _func_ and a realm _expectedRealm_, and takes the following steps:

1. Assert: [IsCallable]\(_func_) is **true**.
1. If _func_ is not an [ECMAScript function object], return **false**.
1. If _func_.[[Realm]] is not _expectedRealm_, return **false**.
1. If _func_.[[Strict]] is **true**, return **false**.
1. If _func_ does not have a [[Construct]] internal method, return **false**.
1. Return **true**.

> NOTE. The functions for which IsAllowedReceiverFunctionForCallerAndArguments returns true are non-strict functions from the expected realm that were created with _[FunctionDeclaration]_ or _[FunctionExpression]_ syntax or using the [Function constructor].

## Additional component of execution contexts

The following component is added to [ECMAScript code execution context]s:

* ArgumentsList: The List of arguments that has been passed during the function invocation, if this execution context is evaluating the code of a function object. Otherwise, **null**.

The [PrepareForOrdinaryCall] abstract operation is modified in order to take a third parameter:

**PrepareForOrdinaryCall(_F_, _newTarget_, _argumentsList_)**

and takes the following additional step after Step 4:

1. Set the ArgumentsList of _calleeContext_ to _argumentsList_.

(Other algorithms that initialize an ECMAScript code execution context shall set its ArgumentsList component to **null**.)

The two existing uses of PrepareForOrdinaryCall are modified in order to forward their _argumentsList_.

> NOTE: Within ECMA-262, the ArgumentList component is inspected only by Function.prototype.arguments when [IsAllowedReceiverFunctionForCallerAndArguments]\(_F_, current realm) is **true**.

## Modification of the CreateUnmappedArgumentsObject abstract operation

The existing abstract operation [CreateUnmappedArgumentsObject](https://tc39.es/ecma262/#sec-createunmappedargumentsobject) is modified in order to take a second parameter:

**CreateUnmappedArgumentsObject(_argumentsList_, _callee_)**

The existing uses of that abstract operation are modified in order to pass **undefined** as their second argument.

The penultimate step of the algorithm:

1. Perform ! [DefinePropertyOrThrow]\(_obj_, **"callee"**, PropertyDescriptor { [[Get]]: [%ThrowTypeError%], [[Set]]: [%ThrowTypeError%], [[Enumerable]]: **false**, [[Configurable]]: **false** }).

is replaced with:

1. If _callee_ is **undefined**, then
    1. Perform ! [DefinePropertyOrThrow]\(_obj_, **"callee"**, PropertyDescriptor { [[Get]]: [%ThrowTypeError%], [[Set]]: [%ThrowTypeError%], [[Enumerable]]: **false**, [[Configurable]]: **false** }).
1. Else,
    1. Assert: _callee_ is a function object.
    1. Perform ! [DefinePropertyOrThrow]\(_obj_, **"callee"**, PropertyDescriptor { [[Value]]: _callee_, [[Writable]]: **true**, [[Enumerable]]: **false**, [[Configurable]]: **true** }).


## get Function.prototype.caller

Function.prototype.caller is a configurable, non-enumerable accessor property whose set accessor function is **undefined**. Its get accessor function performs the following steps:

1. Let _func_ be the **this** value.
1. If [IsCallable]\(_func_) is **false**, throw a **TypeError** exception.
1. Let _currentRealm_ be the [current Realm Record].
1. If [IsAllowedReceiverFunctionForCallerAndArguments]\(_func_, _currentRealm_) is **false**, throw a **TypeError** exception.
1. If there is no [execution context] in the [execution context stack] whose Function component is _func_, return **null**.
1. Let _funcContext_ be the top-most [execution context] in the [execution context stack] whose Function component is  _func_.
1. If _funcContext_ has no parent [execution context] in the [execution context stack], return **null**.
1. Let _callerContext_ be the parent [execution context] of _funcContext_.
1. Let _caller_ be the Function component of _callerContext_.
1. If _caller_ is **null**, return **null**.
1. If _caller_ is not an [ECMAScript function object], return **null**.
1. If _caller_.[[Realm]] is not _currentRealm_, return **null**.
1. If _caller_.[[Strict]] is **true**, return **null**.
1. If _caller_.[[ECMAScriptCode]] is a _GeneratorBody_, an _AsyncFunctionBody_, an _AsyncGeneratorBody_, or an _AsyncConciseBody_, return **null**.
1. Return _caller_.

> NOTE. The purported caller will not be the real caller if its corresponding [execution context] has been removed from the [execution context stack] as a result of a [tail position call]. In particular, the algorithm will return a false positive when applied to a non-strict function which has been called in tail position by a strict function which has itself been called by a non-strict function. However, the algorithm will give the correct answer when applied to a non-strict function called by another non-strict function, because [tail position call] is not defined in non-strict mode.

> NOTE 2. Proxy functions and bound functions are never considered as “caller” for the purpose of this algorithm, because they never appear in the [execution context stack].


## get Function.prototype.arguments

Function.prototype.arguments is a configurable, non-enumerable accessor property whose set accessor function is **undefined**. Its get accessor function performs the following steps:

1. Let _func_ be the **this** value.
1. If [IsCallable]\(_func_) is **false**, throw a **TypeError** exception.
1. Let _currentRealm_ be the [current Realm Record].
1. If [IsAllowedReceiverFunctionForCallerAndArguments]\(_func_, _currentRealm_) is **false**, throw a **TypeError** exception.
1. If there is no [execution context] in the [execution context stack] whose Function component is _func_, return **null**.
1. Let _funcContext_ be the top-most [execution context] in the [execution context stack] whose Function component is  _func_.
1. Let _argumentsList_ be the ArgumentsList component of _funcContext_.
1. If IsSimpleParameterList of _func_.[[FormalParameters]] is **true**, let _callee_ be _func_.
1. Else, let _callee_ be **undefined**.
1. Return CreateUnmappedArgumentsObject(_argumentsList_, _callee_) — where CreateUnmappedArgumentsObject has been patched [as described above](#modification-of-the-createunmappedargumentsobject-abstract-operation).


## Modifications of the Forbidden Extensions section

The two items in [Forbidden Extensions] related to the properties “caller” and “arguments” of function objects are replaced with the following one:

* An implementation must not extend any function object with own properties named “caller” or “arguments“, except for the corresponding properties on [%Function.prototype%] that are defined in this specification.

## Other adjustments

* [CreateIntrinsics] must no longer perform the [AddRestrictedFunctionProperties] on [%Function.prototype%]. The [AddRestrictedFunctionProperties] abstract operation is now obsolete and should be removed.
* The note in [Section 14.9.1 IsInTailCallPosition](https://tc39.es/ecma262/#sec-isintailposition) shall be updated by replacing the allusion to “a common language extension” with a reference to Function.prototype.caller.


[IsAllowedReceiverFunctionForCallerAndArguments]: #isallowedreceiverfunctionforcallerandargumentsfunc-expectedrealm
[GetTopMostExecutionContext]: #gettopmostexecutioncontextfunc
[CreateUnmappedArgumentsObject]: #modification-of-the-createunmappedargumentsobject-abstract-operation
[current Realm Record]: https://tc39.github.io/ecma262/#current-realm
[ECMAScript function object]: https://tc39.github.io/ecma262/#sec-ecmascript-function-objects
[execution context]: https://tc39.github.io/ecma262/#sec-execution-contexts
[execution context stack]: https://tc39.github.io/ecma262/#execution-context-stack
[ECMAScript code execution context]: https://tc39.es/ecma262/#table-23
[List]: https://tc39.github.io/ecma262/#sec-list-and-record-specification-type
[AddRestrictedFunctionProperties]: https://tc39.es/ecma262/#sec-addrestrictedfunctionproperties
[CreateDataProperty]: https://tc39.github.io/ecma262/#sec-createdataproperty
[CreateIntrinsics]: https://tc39.es/ecma262/#sec-createintrinsics
[DefinePropertyOrThrow]: https://tc39.github.io/ecma262/#sec-definepropertyorthrow
[IsCallable]: https://tc39.es/ecma262/#sec-iscallable
[ObjectCreate]: https://tc39.github.io/ecma262/#sec-objectcreate
[PrepareForOrdinaryCall]: https://tc39.es/ecma262/#sec-prepareforordinarycall
[ToObject]: https://tc39.es/ecma262/#sec-toobject
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
