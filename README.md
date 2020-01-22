# Legacy reflection features for functions in JavaScript

## Status

[ECMAScript proposal](https://github.com/tc39/proposals) at stage 0 of the process.

* Main author: Claude Pache ([@claudepache](https://github.com/claudepache))
* Champion: Mark S. Miller ([@erights](https://github.com/erights))

## Discussion thread on the ECMA-262 repo

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
* Make the feature small and self-contained.
    * The API surface is made as small as possible, and the object internal methods have their default behaviour. 
* Avoid making it possible to discriminate between a strict function and a non-ECMAScript function.
* Don’t break the web.
    * Each proposed behaviour ought to be either currently implemented by one or more mainstream browsers, or carefully justified.
* Avoid work from implementators.
    * It is carefully tested what implementations currently do, so that they need minimal modifications.


## The spec

The formal spec text is given in [spec.md](spec.md). Here is a summary:

* Two deletable getters named "caller" and "arguments" are installed on Function.prototype. They are restricted in order to work only for a subcategory of non-strict functions from matching realm: a TypeError is thrown when attempting to use them with other functions.

* The "caller" getter (when applied to an uncensored function) returns the caller of the last currently active call to the function, based on the execution context stack, but only if the caller is in some subcategory of non-strict functions of matching realm. Otherwise **null** is returned.

* The "arguments" getter (when applied to an uncensored function) returns an Arguments object reflecting the arguments that were passed during the last currently active call to the function, based on the execution context stack. Otherwise **null** is returned.

* The features above goes in [Annex B], which means that they are required only in web browsers.

* Finally, implementations are not allowed to define any "caller" or "arguments" own property on any function object outside to what is defined in this specification.



## Differences between this spec and current implementations in mainstream browsers

Details are found on [analysis.md](analysis.md). Here is a summary:

* Function#caller and Function#arguments are specced as deletable accessors on Function.prototype. That matches what Firefox does; at the time of writing other browsers define them as “magic” immutable data properties on individual function objects.
* The spec prevents cross-realm leakages. Implementations don’t.
* The set of functions which may be returned by .caller in the spec is the intersection of the sets of such functions in individual mainstream browsers.
* The spec does not exhibit distinguishable behaviour when the function which is deemed as “caller” is a non-ECMAScript function or when it is a strict function. Some implementations do.

[Annex B]: https://tc39.es/ecma262/#sec-additional-ecmascript-features-for-web-browsers
[Forbidden Extensions]: https://tc39.es/ecma262/#sec-forbidden-extensions
