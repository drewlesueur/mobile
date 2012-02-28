//Explicit hard coded paths because I am tired of the other way
// this way is kind of like how you use it in a browser

require("./public/dmodule.js")
require("./config.js")
var _ = require("./public/underscore.js")
dModule.define("underscore", function () { return _ });
require("./public/drews-mixins.js")
var nimble = require("./public/nimble.js")
dModule.define("nimble", function () { return nimble });
require("./public/all-func.js")
express = require("express");
dModule.define("express", function () {return express;});
require("./public/express-rpc.js")
require("./public/severus2.js")
var twilio = require("twilio")
dModule.define("twilio", function() { return twilio })
require("./public/mobilemin-app.js")
require("./public/mobilemin-twilio.js")
//require("./public/mobilemin-server.js")
require("./public/layout.js")

var config = dModule.require("config")
var _ = dModule.require("underscore")

Server = dModule.require("mobilemin-server")
server = Server.init()

server.start()


//server.getBusinessName('+14804282578')
//server.andThen(function (bn) {
//  console.log("business nane is " + bn)    
//})

