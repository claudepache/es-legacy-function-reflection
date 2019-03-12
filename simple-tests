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
    strict: '(function () { "use strict"; return getCaller() })()'
  , builtin: '[1,2].reduce(getCaller)'    
  , bound: '(function() { return getCaller() }).bind(null)()'
  , nonsimple: '(function (...args) { return getCaller() })()'
  , arrow: '(_ => getCaller())()'
  , generator: '(function* () { yield getCaller() })().next().value'
  , method: '({ foo() { return getCaller() } }).foo()'
  , getter: '({ get foo() { return getCaller() } }).foo'
  , proxy: '(new Proxy(function () { }, { apply: function() { return getCaller() }}))()'
}

for (var key in listCallers) {
    var result
    try {
        result = eval(listCallers[key])
    }
    catch (e) {
        result = e
    }
    log('caller is '+key+':', result)
}

var listSelfProp = {
    strict: '(function f() { "use strict"; return f[prop] })()'
  , builtin: '[1,2].reduce(function() { return [].reduce[prop]; })()'    
  , bound: 'var f = function() { return f[prop] }.bind(null); f()'
  , nonsimple: '(function f(...args) { return f[prop] })()'
  , arrow: 'var f = _ => f[prop]; f()'
  , generatorFunction: '(function* f() { yield f[prop] })().next().value'
  , generator: 'var f = (function *() { yield f[prop] })(); f.next().value'
  , method: 'var _ = { f() { return _.f[prop] } }; _.f()'
  , getter: 'var _ = { get f() { return Object.getOwnPropertyDescriptor(_, "f").get[prop] } }; _.f'
  , proxy: 'var f = new Proxy(function () { }, { apply: function() { return f[prop] }}); f()'
}

;['caller', 'arguments'].forEach(function (prop) {
    for (var key in listSelfProp) {
        var result
        var _, f
        try {
            result = eval(listSelfProp[key])
        }
        catch (e) {
            result = e
        }
        log('self.'+prop+' on '+key+':', result)
    }
})

