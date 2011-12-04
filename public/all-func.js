
  dModule.define("all-func", function() {
    var ret, _;
    _ = dModule.require("underscore");
    ret = {};
    ret.object = function(o) {
      if (o == null) o = {};
      return function(key, value) {
        if ((!value) && key) {
          return o[key];
        } else if (key) {
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
