(function() {
  var difinir;
  var __slice = Array.prototype.slice;

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    difinir = function() {
      var args, ret, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), ret = arguments[_i++];
      return module.exports = ret();
    };
    define = difinir;
  }

  define("mobilemin", function() {
    var drews, nimble, self, server, _;
    _ = require("underscore");
    drews = require("drews-mixins");
    nimble = require("nimble");
    server = drews.jsonRpcMaker("http://drewl.us:8010/rpc/");
    self = {};
    self.saveSite = function(name, html, cb) {
      return server("saveSite", name, html, cb);
    };
    return self;
  });

}).call(this);
