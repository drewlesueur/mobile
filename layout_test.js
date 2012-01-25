(function() {
  
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
;
  var MobileminText, Server, bill, bob, colors, drews, fakeBoughtNumbers, jamba, jambamm, jim, kylePhone, mcDonalds, mcDonaldsmm, mobileminNumber, prettyPhone, randomPhone, realBuyPhoneNumberFor, realText, sendFakeText, sentTexts, server, shouldHaveSent, startJamba, startMcDonalds, steve, testBusinessNameRequested, testFirstResponse, testJambaFirstResponse, testKyleWasNotifiedOfNewSignup, testMcDonaldsFirstResponse, tests, wait;

  colors = require("colors");

  drews = dModule.require('drews-mixins');

  Server = dModule.require("mobilemin-server");

  server = Server.init();

  randomPhone = function() {
    var phone, randInt, x;
    phone = "+1";
    for (x = 1; x <= 10; x++) {
      randInt = drews.rnd(0, 9);
      phone += randInt.toString();
    }
    return phone;
  };

  realBuyPhoneNumberFor = server.buyPhoneNumberFor;

  realText = server.text;

  MobileminText = dModule.require("mobilemin-text");

  fakeBoughtNumbers = [];

  server.buyPhoneNumberFor = function(from) {
    var fakeBoughtNumber;
    fakeBoughtNumber = randomPhone();
    fakeBoughtNumbers.push(fakeBoughtNumber);
    return _.defer(function() {
      return server.onBoughtPhoneNumber(from, fakeBoughtNumber);
    });
  };

  sentTexts = [];

  server.text = function(info) {
    var last;
    last = drews.makeEventful({});
    sentTexts.push(info);
    _.defer(function() {
      return last.emit("done");
    });
    server.setLast(last);
    return last;
  };

  mcDonalds = randomPhone();

  jamba = randomPhone();

  bob = randomPhone();

  jim = randomPhone();

  bill = randomPhone();

  steve = randomPhone();

  mobileminNumber = server.mobileminNumber;

  sendFakeText = function(info) {
    var req, res;
    req = {
      body: {
        To: info.to,
        From: info.from,
        Body: info.body
      }
    };
    res = {
      send: function() {}
    };
    return server.sms(req, res);
  };

  tests = [];

  shouldHaveSent = function(info) {
    var sentText;
    sentText = sentTexts.pop();
    console.log(info.body === sentText.body);
    if (_.isEqual(info, sentText)) {
      console.log("Passed Test:".green);
      console.log(("  " + info.body).green);
      return console.log(("  " + sentText.body).yellow);
    } else {
      console.log("Failed Test:".red);
      console.log(("  " + info.body).red);
      return console.log(("  " + sentText.body).magenta);
    }
  };

  prettyPhone = server.prettyPhone;

  wait = drews.wait;

  kylePhone = "+14803813855";

  mcDonaldsmm = "";

  jambamm = "";

  startMcDonalds = function() {
    return sendFakeText({
      from: mcDonalds,
      to: mobileminNumber,
      body: "start"
    });
  };

  startJamba = function() {
    return sendFakeText({
      from: jamba,
      to: mobileminNumber,
      body: "start"
    });
  };

  testJambaFirstResponse = function() {
    jambamm = fakeBoughtNumbers.pop();
    return shouldHaveSent({
      to: jamba,
      from: mobileminNumber,
      body: "You're live! Your Text Marketing Number is " + (prettyPhone(jambamm)) + ". Text it to send your customers a special. They text \"Join\" to subscribe."
    });
  };

  testMcDonaldsFirstResponse = function() {
    mcDonaldsmm = fakeBoughtNumbers.pop();
    return shouldHaveSent({
      to: mcDonalds,
      from: mobileminNumber,
      body: "You're live! Your Text Marketing Number is " + (prettyPhone(mcDonaldsmm)) + ". Text it to send your customers a special. They text \"Join\" to subscribe."
    });
  };

  testKyleWasNotifiedOfNewSignup = function(customer, customermm) {
    return shouldHaveSent = {
      to: kylePhone,
      from: mobileminNumber,
      body: "Someone new signed up. Their Text Marketing Number is " + (prettyPhone(customermm)) + ".\nTheir cell phone is " + (prettyPhone(customer)) + "."
    };
  };

  testFirstResponse = function() {
    testJambaFirstResponse();
    testMcDonaldsFirstResponse();
    testKyleWasNotifiedOfNewSignup(jamba, jambamm);
    testKyleWasNotifiedOfNewSignup(mcDonalds, mcDonaldsmm);
    wait(600, function() {
      return testBusinessNameRequested(mcDonalds, mcDonaldsmm);
    });
    return wait(600, function() {
      return testBusinessNameRequested(jamba, jambamm);
    });
  };

  testBusinessNameRequested = function(customer, customermm) {
    return shouldHaveSent({
      to: customer,
      from: mobileminNumber,
      body: "what is your business number?"
    });
  };

  startMcDonalds();

  startJamba();

  wait(500, function() {
    return testFirstResponse();
  });

}).call(this);
