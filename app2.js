//Explicit hard coded paths because I am tired of the other way
// this way is kind of like how you use it in a browser

require("./public/dmodule.js")
require("./public/severus2.js")
var twilio = require("twilio")
dModule.define("twilio", function() { return twilio })
require("./public/mobilemin-app.js")
require("./public/mobilemin-twilio.js")
var _ = require("./public/underscore.js")
dModule.define("underscore", function () { return _ });
var nimble = require("./public/nimble.js")
dModule.define("nimble", function () { return nimble });
require("./public/drews-mixins.js")
require("./config.js")

var config = dModule.require("config")
var MobileMinTwilio = dModule.require("mobilemin-twilio")
var MobileMinApp = dModule.require("mobilemin-app")
var _ = dModule.require("underscore")
mobileMinApp = new MobileMinApp

var mobileMinTwilio = new MobileMinTwilio(
  config.ACCOUNT_SID, config.AUTH_TOKEN
)

twizzle = require('twilio')
Twiml = twizzle.Twiml

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
  res.setHeader("Cache-Control", "no-cache"); //andraoid
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
   console.log(req)
   twilioResponse = new Twiml.Response(res)
   twilioResponse.append(new Twiml.Dial("4803813855"))
   twilioResponse.send()


})
pg("/sms", function (req, res) {
  console.log(req)
})

start();

mobileMinTwilio.setupNumbers()


