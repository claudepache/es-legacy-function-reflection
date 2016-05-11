# Legacy reflection features for functions in JavaScript

Deprecated but needed for web compatibility.

In annex B.

## IsLeakableFunction(_func_)

1. Assert: _func_ is an object that has a [[Call]] internal method.
1. If _func_ does not have an [[ECMAScriptCode]] internal slot, return **false**.
1. If the value of _func_’s [[Strict]] internal slot is **true**, return **false**.
    1. ***Issue: Should it also return false for functions for which IsSimpleParameterList of their [[FormalParameters]] internal slot is false?***
1. Return **true**.


## GetTopMostExecutionContextIfLeakable(_func_, _expectedFuncRealm_) 

1. If Type(_func_) is not Object or if _func_ does not have a [[Call]] internal method, throw a **TypeError** exception.
1. If ! IsLeakableFunction(_func_) is **false**, throw a **TypeError** exception.
1. If the value of _func_’s [[Realm]] internal slot is not _expectedFuncRealm_, throw a **TypeError** exception.
1. If there is no [execution context](https://tc39.github.io/ecma262/#sec-execution-contexts) in the [execution context stack](https://tc39.github.io/ecma262/#execution-context-stack) whose Function component has value _func_, return **undefined**.
1. Return the topmost [execution context](https://tc39.github.io/ecma262/#sec-execution-contexts) in the [execution context stack](https://tc39.github.io/ecma262/#execution-context-stack) whose Function component has value  _func_.


## get Function.prototype.caller

Function.prototype.caller is an accessor property with attributes { [[Set]]: **undefined**, [[Enumerable]]: **false**, [[Configurable]]: **true** }.

The [[Get]] attribute is a built-in function that performs the following steps:

1. Let _ctx_ be ? GetTopMostExecutionContextIfLeakable(**this** value, [current Realm Record](https://tc39.github.io/ecma262/#current-realm)).
1. If _ctx_ is **undefined**, return **null**.
1. If _ctx_ has no parent [execution context](https://tc39.github.io/ecma262/#sec-execution-contexts) in the [execution context stack](https://tc39.github.io/ecma262/#execution-context-stack), return **null**.
1. Let _ctxParent_ be the parent [execution context](https://tc39.github.io/ecma262/#sec-execution-contexts) of _ctx_.
1. Let _G_ be the value of the Function component of _ctxParent_.
1. If Type(_G_) is not Null and IsLeakableFunction(_G_) is **false**, throw a **TypeError** exception.
1. Return _G_.


## get Function.prototype.arguments

Function.prototype.arguments is an accessor property with attributes { [[Set]]: **undefined**, [[Enumerable]]: **false**, [[Configurable]]: **true** }.

The following component is added to [ECMAScript Code Execution Contexts](https://tc39.github.io/ecma262/#table-23):

* Arguments: an optional reference to the Arguments object created during [FunctionDeclarationInstantiation](https://tc39.github.io/ecma262/#sec-functiondeclarationinstantiation).

The [FunctionDeclarationInstantiation](https://tc39.github.io/ecma262/#sec-functiondeclarationinstantiation) abstract operation performs the following additional step after Step 22.f:

1. If ! IsLeakableFunction(_func_) is **true**,
    1. Set the value of the Arguments component of _calleeContext_ to _ao_.

The [[Get]] attribute of Function.prototype.arguments is a built-in function that performs the following steps:

1. Let _ctx_ be ? GetTopMostExecutionContextIfLeakable(**this** value, [current Realm Record](https://tc39.github.io/ecma262/#current-realm)).
1. If _ctx_ is **undefined**, return **null**.
1. Assert: The Arguments component of _ctx_ contains an object.
1. Return the value of the Arguments component of _ctx_.


## arguments.callee

Additional steps of the [CreateMappedArgumentsObject](https://tc39.github.io/ecma262/#sec-createmappedargumentsobject) abstract operation.

1. Assert: ! IsLeakableFunction(_func_) is **true**.
1. Perform ! DefinePropertyOrThrow(_func_, "callee", PropertyDescriptor{[[Value]]: _func_, [[Writable]]: **true** [[Enumerable]]: **false**, [[Configurable]]: **true**}).
