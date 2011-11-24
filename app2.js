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

mobileMinTwilio.setupNumbers()

