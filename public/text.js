(function() {
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
