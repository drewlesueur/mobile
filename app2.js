//Explicit hard coded paths because I am tired of the other way
// this way is kind of like how you use it in a browser

require("./public/dmodule.js")
require("./node_modules/severus2.js")
var twilio = require("twilio")
dModule.define("twilio", function() { return twilio })
require("./public/mobilemin-app.js")
require("./public/mobilemin-twilio.js")
var _ = require("./node_modules/underscore.js")
dModule.define("underscore", function () { return _ });
var nimble = require("./node_modules/nimble.js")
dModule.define("nimble", function () { return nimble });
require("./node_modules/drews-mixins/drews-mixins.js")
require("./config.js")

var config = dModule.require("config")
var MobileMinTwilio = dModule.require("mobilemin-twilio")
var MobileMinApp = dModule.require("mobilemin-app")
var _ = dModule.require("underscore")
mobileMinApp = new MobileMinApp

var mobileMinTwilio = new MobileMinTwilio(
  config.ACCOUNT_SID, config.AUTH_TOKEN
)

express = require('express');

drewsSignIn = function(req, res, next) {
  req.isSignedIn = function() {
    return req.session.email !== null;
  };
  return next();
};

enableCORS = function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-cache");
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
  app.use(express.static(__dirname + '/public'));
  return app.use(drewsSignIn);
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

start = function() {
  if (!module.parent) {
    app.listen(config.server.port || 8001);
    return console.log("Express server listening on port %d", app.address().port);
  }
};

pg("/phone", function (req, res) {
   res.send("good")
})
pg("/sms", function (req, res) {
   res.send("good")
})

start();

mobileMinTwilio.setupNumbers()

