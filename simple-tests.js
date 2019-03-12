/*
Q&D tests for checking the outcome of `f.caller` and `f.arguments` for various type of functions `f`

Either paste the  code in the web console or adapt the log() function to your needs.
*/

function log(key, result) {
    if (result instanceof Error)
        result = 'thrown '+result.name+': '+result.message
    console.log(key, result)
}

function getCaller() { return getCaller.caller }

var listCallers = {
    strict: '(function () { "use strict"; var r = getCaller(); return r })()' // beware PTC!
  , builtin: '[1,2].reduce(getCaller)'    
  , bound: '(function() { return getCaller() }).bind(null)()'
  , nonsimple: '(function (...args) { return getCaller() })()'
  , arrow: '(_ => getCaller())()'
  , generator: '(function* () { yield getCaller() })().next().value'
  , method: '({ foo() { return getCaller() } }).foo()'
  , getter: '({ get foo() { return getCaller() } }).foo'
  , proxy: '(new Proxy(function () { }, { apply: function() { return getCaller() }}))()'
  , async: '(async function() { return getCaller() })()'
}

for (var key in listCallers) {
    var result
    try {
        result = eval(listCallers[key])
    }
    catch (e) {
        result = e
    }
    if (result instanceof Promise) {
        result.then(function (r) { log('caller is '+key+':', r) }, function (e) { log('caller is '+key+':', e) })
    }
    else {
        log('caller is '+key+':', result)
    }
}

var listSelfProp = {
    strict: '(function f() { "use strict"; })()'
  , builtin: '[].reduce'    
  , bound: '(function() { }).bind(null)'
  , nonsimple: '(function f(...args) { })'
  , arrow: '(_ => _)'
  , generatorFunction: '(function* () { yield 42; })'
  , generatorNext: '(function* () { yield 42; })().next'
  , method: '({ f() {  } }).f'
  , getter: 'Object.getOwnPropertyDescriptor({ get f() { } }, "f").get'
  , proxy: 'new Proxy(function () { }, { })'
  , async: '(async function() { })'
}

;['caller', 'arguments'].forEach(function (prop) {
    for (var key in listSelfProp) {
        var result
        try {
            result = eval(listSelfProp[key])[prop]
        }
        catch (e) {
            result = e
        }
        log('self.'+prop+' on '+key+':', result)
    }
})

