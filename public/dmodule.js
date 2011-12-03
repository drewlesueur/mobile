//get global object, either window or global
//if window? then window else if global? then global else this
var root = typeof window !== "undefined" && window !== null ? window : typeof global !== "undefined" && global !== null ? global : this;   
if (!root.dModule) {
  var dModule = root.dModule = {}
  var defs = dModule.defs = {}
  var modules = dModule.modules = {}
  
  var define = dModule.define = function (name, fn) {
    defs[name] = fn;
  }

  var require = dModule.require = function (name) {
    if (modules.hasOwnProperty(name)) return modules[name];
    if (defs.hasOwnProperty(name)) {
      var fn = defs[name];
      defs[name] = function () { throw new Error("Circular Dependency"); }
      return modules[name] = fn();
    }
    throw new Error("Module not found: " + name);
  }
}
