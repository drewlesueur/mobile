
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
