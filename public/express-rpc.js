(function() {
  var __slice = Array.prototype.slice;

  dModule.define("express-rpc", function() {
    var getApp;
    return getApp = function(url, methods) {
      var app, config, enableCORS, errorMaker, express, pg, rpcMethods;
      config = dModule.require("config");
      express = dModule.require("express");
      enableCORS = function(req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
        return next();
      };
      app = module.exports = express.createServer();
      app.configure(function() {
        app.use(enableCORS);
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.session({
          secret: "boom shaka laka"
        }));
        app.use(express.methodOverride());
        app.use(app.router);
        return app.use(express.static(__dirname + '/public'));
      });
      app.configure('development', function() {
        return app.use(express.errorHandler({
          dumpExceptions: true,
          showStack: true
        }));
      });
      app.configure('production', function() {
        return app.use(express.errorHandler());
      });
      pg = function(p, f) {
        app.post(p, f);
        return app.get(p, f);
      };
      rpcMethods = methods;
      errorMaker = function(error) {
        return function() {
          var args, cb, _i;
          args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
          return cb(error, null);
        };
      };
      url || (url = "/rpc");
      pg("/ping", function(req, res) {
        return res.send(Date.now().toString());
      });
      pg(url, function(req, res) {
        var body, fn, id, method, params;
        body = req.body;
        method = body.method, params = body.params, id = body.id;
        fn = rpcMethods[method] || errorMaker("no such method " + method);
        return fn.apply(null, __slice.call(params).concat([function(err, result) {
          return res.send({
            result: result,
            error: err,
            id: id
          });
        }]));
      });
      return app;
    };
  });

  if (!module.parent) {
    app.listen(config.server.port || 8001);
    console.log("Express server listening on port %d", app.address().port);
  }

}).call(this);
