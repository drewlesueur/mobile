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
  var MobileminText, Server, andThen, bill, bob, colors, doBusinessPhone, doInOrder, drews, fakeBoughtNumbers, jamba, jambamm, jim, kylePhone, last, mcDonalds, mcDonaldsmm, mobileminNumber, prettyPhone, randomPhone, realBuyPhoneNumberFor, realText, sendFakeText, sentTexts, server, shouldHaveSent, startJamba, startMcDonalds, steve, testBusinessNameRequested, testBusinessPhoneReqested, testFirstResponse, testJambaFirstResponse, testKyleWasNotifiedOfNewSignup, testMcDonaldsFirstResponse, tests, wait, waitFor,
    __slice = Array.prototype.slice;

  last = "";

  andThen = function() {
    var args, fn, whatToDo;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    whatToDo = fn.bind.apply(fn, [null].concat(__slice.call(args)));
    return last.once("done", whatToDo);
  };

  doInOrder = function() {
    var count, execWaiter, length, results, waiters, _last;
    waiters = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    length = waiters.length;
    count = 0;
    results = [];
    last = drews.makeEventful({});
    _last = last;
    execWaiter = function() {
      var waiter;
      waiter = waiters[count];
      waiter = waiter.apply(null, results);
      return waiter.once("done", function() {
        var vals;
        vals = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        results = results.concat(vals);
        count += 1;
        if (count === length) {
          return _last.emit.apply(_last, ["done"].concat(__slice.call(results)));
        } else {
          return execWaiter();
        }
      });
    };
    _.defer(execWaiter);
    return _last;
  };

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
    fakeBoughtNumbers.unshift(fakeBoughtNumber);
    return _.defer(function() {
      return server.onBoughtPhoneNumber(from, fakeBoughtNumber);
    });
  };

  sentTexts = [];

  server.text = function(info) {
    var _last;
    last = drews.makeEventful({});
    _last = last;
    sentTexts.unshift(info);
    _.defer(function() {
      return _last.emit("done");
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

  shouldHaveSent = function(info, message) {
    var sentText;
    sentText = sentTexts.pop();
    if (_.isEqual(info, sentText)) {
      return console.log(message.green);
    } else {
      console.log(message.red);
      console.log(sentText.body.yellow);
      return console.log(info.body.magenta);
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
    return shouldHaveSent({
      to: jamba,
      from: mobileminNumber,
      body: "You're live! Your Text Marketing Number is " + (prettyPhone(jambamm)) + ". Text it to send your customers a special. They text \"Join\" to subscribe."
    }, "First Response from a new sign up");
  };

  testMcDonaldsFirstResponse = function() {
    return shouldHaveSent({
      to: mcDonalds,
      from: mobileminNumber,
      body: "You're live! Your Text Marketing Number is " + (prettyPhone(mcDonaldsmm)) + ". Text it to send your customers a special. They text \"Join\" to subscribe."
    }, "First Response from a new sign up");
  };

  testKyleWasNotifiedOfNewSignup = function(customer, customermm) {
    return shouldHaveSent({
      to: kylePhone,
      from: mobileminNumber,
      body: "Someone new signed up. Their Text Marketing Number is " + (prettyPhone(customermm)) + ".\nTheir cell phone is " + (prettyPhone(customer)) + "."
    }, "Kyle was notified of a new signup");
  };

  testFirstResponse = function() {
    mcDonaldsmm = fakeBoughtNumbers.pop();
    jambamm = fakeBoughtNumbers.pop();
    testKyleWasNotifiedOfNewSignup(mcDonalds, mcDonaldsmm);
    testKyleWasNotifiedOfNewSignup(jamba, jambamm);
    testMcDonaldsFirstResponse();
    testJambaFirstResponse();
    testBusinessNameRequested(mcDonalds, mcDonaldsmm, "McDonalds");
    return testBusinessNameRequested(jamba, jambamm, "Jamba");
  };

  testBusinessPhoneReqested = function(customer) {
    return shouldHaveSent({
      to: customer,
      from: mobileminNumber,
      body: "What is your business phone number?"
    }, "Business phone was requested");
  };

  testBusinessNameRequested = function(customer, customermm, business) {
    return shouldHaveSent({
      to: customer,
      from: mobileminNumber,
      body: "What is your business name?"
    }, "Business name was requested");
  };

  waitFor = function(milis) {
    var _last;
    last = drews.makeEventful({});
    _last = last;
    wait(milis, function() {
      return _last.emit("done");
    });
    return last;
  };

  startMcDonalds();

  startJamba();

  doBusinessPhone = function() {
    console.log("fake sending business phone");
    sendFakeText({
      to: mobileminNumber,
      from: mcDonalds,
      body: "McDonalds"
    });
    return sendFakeText({
      to: mobileminNumber,
      from: jamba,
      body: "Jamba"
    }, wait(10000, function() {
      console.log("testing mcdonalds business phone requested with " + mcDonalds);
      console.log(sentTexts);
      testBusinessPhoneReqested(mcDonalds);
      return testBusinessPhoneReqested(jamba);
    }));
  };

  console.log("wating 10 seconds");

  wait(15000, function() {
    testFirstResponse();
    return wait(4500, function() {
      return doBusinessPhone();
    });
  });

}).call(this);
