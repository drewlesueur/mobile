(function() {
  var __slice = Array.prototype.slice;

  dModule.define("all-func", function() {
    var ret, _;
    _ = dModule.require("underscore");
    ret = {};
    ret.object = function(o) {
      if (o == null) o = {};
      return function() {
        var args, key, value;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        key = args[0], value = args[1];
        if (args.length === 1) {
          return o[key];
        } else if (args.length === 2) {
          return o[key] = value;
        } else {
          return o;
        }
      };
    };
    ret.list = function(o) {
      var fn;
      if (o == null) o = [];
      return fn = function() {
        var args, key, value;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        key = args[0], value = args[1];
        if (args.length === 1) {
          return o[key];
        } else if (args.length === 2) {
          return o[key] = value;
        } else {
          return o;
        }
      };
    };
    ret.isEqual = function(a, b) {
      return _.isEqual(a(), b());
    };
    return ret.object(ret);
  });

}).call(this);
