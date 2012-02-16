;(function () {
 var root = this;
 var Thumbs;
  if (typeof exports !== 'undefined') {
    Thumbs = exports;
  } else {
    Thumbs = root.Thumbs = {};
  }

  var splitText = function (text) {
    text = text.split(" ");
    return text
  }

  var lastIf = false;
  lastIfAns = null;

  var parse = function(configs) {
    var a, b, config, currentObj, currentSpaceLen, final, i, lastIndex, lastThingAdded, match, newCurrentObj, objectStack, ret, spaceLen, text, _i, _len, _ref;
    configs = configs.split("\n");
    final = {};
    currentSpaceLen = -2;
    lastThingAdded = ["do"];
    currentObj = [lastThingAdded];
    lastIndex = 0;
    objectStack = [currentObj];
    for (_i = 0, _len = configs.length; _i < _len; _i++) {
      config = configs[_i];
      match = config.match(/^(\s*)([^\s].*)/);
      if (!match) continue;
      if ((match != null ? match.length : void 0) < 3) continue;
      spaceLen = match[1].length / 2;
      text = match[2];
      text = splitText(text)
      text.unshift(_i) // for line numbers
      if (spaceLen === currentSpaceLen) {
        currentObj.push(text);
        lastThingAdded = text;
        lastIndex = currentObj.length - 1;
      } else if (spaceLen > currentSpaceLen) {
        currentSpaceLen = spaceLen;
        newCurrentObj = [lastThingAdded];
        currentObj[lastIndex] = newCurrentObj;
        currentObj = newCurrentObj;
        currentObj.push(text);
        lastThingAdded = text;
        lastIndex = currentObj.length - 1;
        objectStack.push(currentObj);
      } else if (spaceLen < currentSpaceLen) {
        for (i = 0, _ref = currentSpaceLen - spaceLen; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
          currentObj = objectStack.pop();
        }
        try {
          currentObj.push(text);
        } catch (e) {

        }
        objectStack.push(currentObj);
        currentSpaceLen = spaceLen;
        lastThingAdded = text;
        lastIndex = currentObj.length - 1;
      }
    }
    Thumbs.os = objectStack;
    Thumbs.co = currentObj;
    ret = objectStack[0] || currentObj;
    return ret[0];
  };

  
  var myIf = function () { //theIf, theThen, rest..., last
    var last, rest, theIf, theThen, _i;
    theIf = arguments[0], theThen = arguments[1], rest = 4 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 1) : (_i = 2, []), last = arguments[_i++];
    if (theIf()) {
      return theThen() 
    } else if (rest.length) {
      return myIf.apply(null, __slice.call(rest).concat([last]));
      //myIf rest..., last
    } else if (last) {
      return last()
    }
  }

  var rawScope = {
    "in": function (time, f) {
      setTimeout(f, time)
    },
    "if": myIf,
    "false": false,
    "true": true,
    "is": function (a, b) {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];

      if (args.length == 2) return a == b
      
      var condition = function () {return a == b}
      args = args.slice(2)
      args.unshift(condition)
      return myIf.apply(null, args)

    },
    "say": function (x) {
       console.log(x)
    },
    "sub": function (a, b) {
      return a - b 
    },
    "mult": function (a, b) {
      return a * b 
    },
    div: function (a, b) {
      return a / b 
    },
    "do": function () {},
    "add": function () {
      var sum = 0;
      for (var i = 0; i < arguments.length; i++)
        sum += arguments[i] 
      return sum;
    },
    eq: function (a, b) {
      if (a != b) {
        console.log(a + " isn't " + b + " on line " + lineNumber) 
      }  
    },
    neg: function (a) {
      return -a 
    }
  }  

  var scope = {
    body: rawScope,
    parentScope: null
  }

  Thumbs.scope = scope;
  var currentScope = scope;
  var scopeStack = [];
  Thumbs.scopeStack = scopeStack;
  Thumbs.currentScope = currentScope;

  var ObjProto = Object.prototype
  var toString = ObjProto.toString
  var isFunction = function (obj) {
    return toString.call(obj) == '[object Function]';
  }
  var isObject = function (obj) {
    return obj === Object(obj);
  }

  var __slice = Array.prototype.slice;
  var slice = __slice;
  var __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  var nativeBind = Function.prototype.bind 
  var ctor = function() {}
  __bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };


  var setString = function (rest, nestedArgs, currentScope) {
    for (var i = 0; i < nestedArgs.length; i++) {
      nestedArgs[i] = nestedArgs[i].slice(1).join(" ") //slice to remove line number
    } 
    var value = rest.join(" ") 
    value += nestedArgs.join("\n")
    value = value.replace(/\$([^\s]+)/g, function (whole, word) {
      return get(word, currentScope) 
    })
    return value;
  }
  var setNumber = function (second) {
    var value = second - 0 
    return value
  }

  var setOneLineFunction = function (rest, nestedArgs, currentScope) {
    var fakeLineNumber = lineNumber //not sure this is the right line number
    rest.unshift(fakeLineNumber)
    nestedArgs.unshift(rest)
    return setFunction([], nestedArgs, currentScope)
  }

  var setFunction = function (rest, nestedArgs, currentScope) {
    var value = {
      scope: currentScope,
      type: "fn",
      args: rest,
      body: nestedArgs
    }
    return value
  }


 //   } else if (isStartSymbol(second)) {
 //     var theArg = generateValue(second, rest, nestedArgs)


  //TODO: add a unique id
  var setMap = function (nestedArgs, currentScope) {
    //TODO: hmmmm!!! 
    var fn = setFunction([], nestedArgs, currentScope);
    var opts = {
      onlySetInCurrentScope: true      
    }
    //TODO: call compiledFunction here
    var retScope = {body: {}, parentScope: currentScope}
    var compiled = {
      scope: retScope,
      body: fn.body
    }
    callThumbsFunction(compiled, opts)
    delete retScope.parentScope;
    var value = {
      type: "map",
      body: retScope.body,
      parentScope: "", //TODO: should object
      getters: "", //?
      setters: "", //?
      notFound: "", //?
    }
    return value
  }


  var findScopeWithName = function(name, lookupScope, originalLookupScope) {
    originalLookupScope = originalLookupScope || lookupScope
    if (name in lookupScope.body) {
      return lookupScope
    } else if (lookupScope.parentScope) {
      return findScopeWithName(name, lookupScope.parentScope, originalLookupScope) 
    } else {
      return originalLookupScope 
    }
  }

  
  var generateValue = function (second, rest, nestedArgs, currentScope) {
    if (second == "$") { //todo. do a faster way of converting to string //cache or something
      value = setString(rest, nestedArgs, currentScope)
    } else if (second == "*") {
      value = setFunction(rest, nestedArgs, currentScope)
    } else if (second == ">") {
      value = setOneLineFunction(rest, nestedArgs, currentScope)
    } else if ((second - 0) == second) {
      value = setNumber(second) 
    } else if (second && second.match(/^[A-Z]/)) {
      value = setFuncCall(second, rest, nestedArgs, currentScope); 
    } else if (!second && nestedArgs.length) {
      value = setFunction(rest, nestedArgs, currentScope) 
    } else if (second == "#") {
      value = setMap(nestedArgs, currentScope);
    } else {
      value = get(second, currentScope) 
    }
    return value;
  }

  var setValue = function (first, second, rest, nestedArgs, currentScope, opts) {
    if (!second && !nestedArgs.length) {
      return get(first, currentScope)
    }
    //TODO: pass in first and rest and nested args and stuff
    var value = generateValue(second, rest, nestedArgs, currentScope);
    return set(first, value, currentScope, opts)
  }

  var set = function (name, value, currentScope, opts) {

    var names = name.split(/\.|\:/)

    name = name.toLowerCase()
    if (opts && opts.onlySetInCurrentScope) {
      var settingScope = currentScope;
    } else if (names.length > 1) {
      var symbols = name.match(/\.|\:/g)
      symbols.unshift(".")
      lastSymbol = symbols.pop()
      lastName = names.pop()
      settingScope = chainGet(names, symbols, currentScope, currentScope)
      if (lastSymbol == ":") {
        name = get(lastName, currentScope)  
      } else {
        name = lastName
      }
    } else {
      var settingScope = findScopeWithName(name, currentScope)
    }
    settingScope.body[name] =  value;
    //todo make an option for always setting the current scope
    //like var is in javascript
    return value
  }
  
  var callInRestIfNeeded = function (rest) {
    if (!rest[0]) return;
    if (rest[0].match(/^[A-Z]/)) {
        
    }
  } 
   
  var convertArgs = function (argsIndex, args, newScope, fn, rest, nestedArgs, currentScope, opts ) {
    var foundInnerObject = false;
    //TODO: optimize this because the fn calling this one has already com
    //combined second and rest 
    
    if (rest.length) {
      var second = rest[0]
      var rest = rest.slice(1)
      if (second && second.match && second.match(/^[A-Z]/)) {
        var ret = callFunction(second, rest[0], rest.slice(1), nestedArgs, currentScope)
        var rest = [ret];
      } else {
        var rest = [second].concat(__slice.call(rest))
      }
    }

    for (var i = 0; i < rest.length; i++) {
      var varName = rest[i]
      if (isStartSymbol(varName)) { //should I be doing this?
        var theRest = rest.slice(i+1)
        var argValue = generateValue(varName, theRest, nestedArgs, currentScope)
        foundInnerObject = true;
      }
      if (fn.args) {
        var argVarName = fn.args[i + argsIndex] 
      }
      if (!foundInnerObject) {
        var argValue = get(varName, currentScope)
      }
      args.push(argValue);
      if (argVarName) {
        newScope.body[argVarName] = argValue;
      }
      if (foundInnerObject) {
        argsIndex += 1
        break;
        
      }
      
    } 
    newScope.body.args = args;
    return  {
      foundInnerObject: foundInnerObject,
      argsIndex: argsIndex + i
    }
  }

  var convertJSArgsToThumbsArgs = function (args) {
    
  }

  //TODO: add objects, whats the best way? 
  // should I treat them like functions?
  // or should I just try to convert to js object
  var convertThumbsArgsToJSArgs = function(args, currentScope) {
    var doConverting = function (arg, i, args) {
      if (arg && arg.type == "fn") {
        var rest = []; // for now
        var nestedArgs = []; //
        var compiledFunction = compileFunction(arg, rest, nestedArgs, currentScope) 
        args[i] = function () {
          jsArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          var fnArgs = arg.args
          var fnArg;
          for (var j=0; j < jsArgs.length; j++) {
            fnArg = fnArgs[j]
            if (fnArg) {
              compiledFunction.scope.body[fnArg] = jsArgs[j]   
            }
          }
          compiledFunction.scope.args = jsArgs
          return callThumbsFunction(compiledFunction)  
        }
      }   
    }
    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      doConverting(arg, i, args)
    }  
  } 

  var compileFunction = function (fn, rest, nestedArgs, currentScope, opts) {
    //TODO: some of this compiling could be done when it
    //first parses?
    // or cache some of this stuff here

    var newScope = {
      body: {},
      parentScope: fn.scope //js func wont have scope but oh well
    }

    var args = [];
    var argsIndex = 0;
    convertArgsInfo = convertArgs(argsIndex, args, newScope, fn, rest, nestedArgs, currentScope, opts)

    function isThisTheBestWayToHandleNestedArgs() {
      var argsIndex = convertArgsInfo.argsIndex
      foundInnerObject = convertArgsInfo.foundInnerObject

      if (!foundInnerObject && nestedArgs.length) {
        for (var i = 0; i < nestedArgs.length; i++) {
          var newNestedArg = []
          var nestedArg = nestedArgs[i]
            if (nestedArg[0] - 0 !== nestedArg[0]) {
              var newNestedArg = nestedArg.slice(1) 
              nestedArg = nestedArg[0].slice(1)
            } else {
              nestedArg = nestedArg.slice(1) // see line = line[0] self similar?
            }
          convertArgsInfo = convertArgs(argsIndex, args, newScope, fn, nestedArg, newNestedArg, currentScope, opts)
          argsIndex = convertArgsInfo.argsIndex
          //foundInnerObject = convertArgsInfo.foundInnerObject
        }
      }
    }
    isThisTheBestWayToHandleNestedArgs()

    var args = newScope.body.args
    if (isFunction(fn)) {
      convertThumbsArgsToJSArgs(args, currentScope);
      //TODO: convert args to js equivalents!! helpful for settimeout, callbacks etc
      //var compiled = __bind(fn, null, args);
      var compiled = __bind.apply(null, [fn, null].concat(__slice.call(args)))
      // __bind fn, null, args... 
    } else {
      var compiled = {
        scope: newScope,
        body: fn.body
      }
    }
    return compiled;
  }

  var callThumbsFunction = function (compiled, opts) {
    //console.log("Calling a function")
    //TODO: some of this stuff should be cached per function?
    //maybe solving it now with compileFunction call
    //calljs func should be similar to this
    //todo: maybe get rid of opts
    var ret
    if (isFunction(compiled)) {
      ret = compiled()
    } else {
      ret = runParsed(compiled.body, compiled.scope, opts)
    }
    //console.log("done calling a function")
    return ret;
  }
  
  var setFuncCall = function (second, rest, nestedArgs, currentScope) { //todo: maybe pass arguments here 
    // locally scoped variables
    var name = first  
    var first = second
    var second = rest[0]
    var rest = rest.slice(1)
    var value = callFunction(first, second, rest, nestedArgs, currentScope)
    return value;
  }
  
  var isStartSymbol = function (thing) {
    return thing && thing.match && thing.match(/^[\*|\#|\$|\+|\>]$/) 
  } 
  var callFunction = function (first, second, rest, nestedArgs, currentScope) {
    var fn = get(first.toLowerCase(), currentScope) 
    if (second) { 
      var rest = [second].concat(__slice.call(rest))
    }
    var compiledFunction = compileFunction(fn, rest, nestedArgs, currentScope) 
    return callThumbsFunction(compiledFunction)  
  }
  


  var chainGet = function (names, symbols, lookupScope, originalScope) {
    if (names.length == 0) {
      return lookupScope;
    }
    var name = names[0]
    var symbol = symbols[0];
    var names = names.slice(1)
    var symbols = symbols.slice(1)
    if (symbol == ":") { //either . or :
      name = get(name, originalScope) 
    }
    var value = get(name, lookupScope)
    return chainGet(names, symbols, value, originalScope);
  }


  //TODO: get can be an object! change
  //TODO: also include getter and setter options
  var get = function (name, lookupScope) {
    lookupScope = lookupScope || currentScope;

    if (!name) {
      return name
    }

    if (isObject(name)) {
      var a = 1; 
    }
    
    try {
      if (name.charAt && name.charAt(0) == "$") {
        return name.substring(1) 
      } else if (name - 0 == name) {
        return name - 0
      }
      name = name.toLowerCase()
    } catch (e) {
      var b = 1; 
    }

    var names = name.split(/\.|\:/)
    if (names.length > 1) {
      var symbols = name.match(/\.|\:/g)
      symbols.unshift(".")
      return chainGet(names, symbols, lookupScope, lookupScope)
    }

    if (name in lookupScope.body) {
      return lookupScope.body[name] 
    } else if (lookupScope.parentScope) {
      return get(name, lookupScope.parentScope) 
    } else {
      return null;
    }
  } 
  
  var theCurrentScope;
  var stopSignal = "totally stop this here thing!!!";
  var execLine = function (line, currentScope, opts) {
    theCurrentScope = currentScope;
    var nestedArgs = []
    if (line[0] - 0 === line[0]) {
      //no nested args
    } else {
      nestedArgs = line.slice(1)   
      line = line[0];
    }
    lineNumber = line[0]
    //execingLine(lineNumber)
    var first = line[1];
    var second = line[2];
    var rest = line.slice(3);
    var value; 
    
    originalLine = originalLines[lineNumber]
    if (originalLine == "  Fn b c") {
      var bp = 1;
    }
    if (first == "stop") {
      return stopSignal;
    } if (first == "$") { //todo handle all the rest where it starts with a symbol
      var theRest = [second].concat(__slice.call(rest))
      var value = generateValue(first, theRest, nestedArgs, currentScope);
      return value;
    } else if (first.match(/^[a-z]/)) {
      return setValue(first, second, rest, nestedArgs, currentScope, opts)
    } else if (first.match(/^\d/)) {
      return setValue(first, second, rest, nestedArgs, currentScope, opts)
    //} else if (first.match(/^[a-z]/) && !second) {
    //  return get(first, currentScope)
    } else if (first.match(/^[A-Z]/)) {
      return callFunction(first, second, rest, nestedArgs, currentScope)
    }
  }
  
  var originalLines;
  var parsed;
  
  var queue = []
  var queueIndex = 0;
  var startTimer = function () {
    
    var f
    setInterval(function () {
      f = queue[queueIndex]
      f && f();
      queueIndex += 1
    }, 1000)   
  }
  var loop = function (items, cb) {
    var section = []
    for (var i=0; i < items.length; i++) {
       var item = items[i]
       ret = cb(item, i) 
       if (ret == stopSignal) {
         break;   
       }
       //var f = __bind(cb, null, item, i)
       //section.push(f)
    }
    section.unshift(0)
    section.unshift(queueIndex + 1)
    queue.splice.apply(queue, section)
  }

  var runParsed = function (parsed, theScope, opts) {
     theScope = theScope || currentScope
     var last;
     loop(parsed, function (line, i, cb) {
       last = execLine(line, theScope, opts);
       return last;
     })
     return last
  }
  
  var lastLine = null;
  var execingLine = function (lineNumber) {
    lastLine && lastLine.classList.remove("selected")
    var line = document.querySelector('[data-line="'+lineNumber+'"]') 
    line.classList.add("selected")
    lastLine = line
    scrollTo(0, line.offsetTop - 100)
  }


  var addUI = function () {
    var codeEl = document.createElement("div")
    for (var i = 0; i < originalLines.length; i++) {
      var lineEl = document.createElement('pre')   
      lineEl.setAttribute("class", "line")
      lineEl.setAttribute('data-line', i)
      codeEl.appendChild(lineEl)
      var line = originalLines[i]
      line = line.replace(/^([\s]*)([a-z][\w]+)/, function (all, s, w) {
        return s + "<span class='set'>" + w + '</span>'
      })
      line = line.replace(/^([\s]*)([A-Z][\w]*)/, function (all, s, w) {
        return s + "<span class='call'>" + w + '</span>'
      })
      line = line.replace(/^([\s]*)([A-Z][\w]*)/, function (all, s, w) {
        return s + "<span class='call'>" + w + '</span>'
      })
      line = line.replace(/^([\s]*)([\$].*)/, function (all, s, w) {
        return s + "<span class='text'>" + w + '</span>'
      })
      line = line.replace(/[\$][^\s]+/, function (all, s, w) {
        return "<span class='text'>" + all + '</span>'
      })
      lineEl.innerHTML = line
       
    }
  }

  var run = function (code) {
    parsed = parse(code);
    originalLines = code.split("\n")
    parsed = parsed.slice(1)
    //addUI(originalLines)
    runParsed(parsed);
  }

  var runScriptTags = function () {
    var codes = document.querySelectorAll('[type="text/x-thumbs"]')
    for (var i = 0; i < codes.length; i++) {
      var code = codes[i].innerHTML.slice(1)
      run(code)
    }
    //console.log(parsed)
    //console.log(scope)
  }
  
  var runFile = function (file) {
    var fs = require("fs");
    var code = fs.readFileSync(file).toString();
    var ran = run(code) 
    return ran;
  }    
  
  var addScope = function (obj) {
    for (var i in obj) {
      rawScope[i.toLowerCase()] = obj[i] 
    }  
  }

  Thumbs.runScriptTags = runScriptTags
  Thumbs.run = run //runs raw code
  Thumbs.runFile = runFile
  Thumbs.addScope = addScope
 

})();


