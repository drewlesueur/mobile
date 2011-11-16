(function() {
  var difinir;
  var __slice = Array.prototype.slice;

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    difinir = function() {
      var args, name, ret, _i;
      args = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), name = arguments[_i++], ret = arguments[_i++];
      return typeof module !== "undefined" && module !== null ? module.exports = ret() : void 0;
    };
    define = difinir;
  }

  define("text", function() {
    var drews, nimble, self, server, _;
    _ = require("underscore");
    drews = require("drews-mixins");
    nimble = require("nimble");
    server = drews.jsonRpcMaker("http://text.drewl.us/rpc/");
    self = {};
    self.text = function(from, to, message, callback) {
      return server("text", from, to, message, callback);
    };
    return self;
  });

}).call(this);
