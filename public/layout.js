(function() {
  var addPlus1, drews, prettyPhone, _;
  var __slice = Array.prototype.slice;

  if (typeof process !== "undefined" && process !== null) {
    process.on("uncaughtException", function(err) {
      console.log("there whas a hitch, but we're still up");
      return console.log(err.stack);
    });
  }

  _ = dModule.require("underscore");

  drews = dModule.require("drews-mixins");

  addPlus1 = function(phone) {
    if (drews.s(phone, 0, 2) !== "+1" && phone.length === 10) {
      phone = "+1" + phone;
    } else if (drews.s(phone, 0, 1) === "1" && phone.length === 11) {
      phone = "+" + phone;
    }
    return phone;
  };

  prettyPhone = function(phone) {
    var areacode, prefix, suffix;
    if (phone.length === 12) phone = drews.s(phone, 2);
    areacode = drews.s(phone, 0, 3);
    prefix = drews.s(phone, 3, 3);
    suffix = drews.s(phone, 6);
    return "" + areacode + "-" + prefix + "-" + suffix;
  };

  dModule.define("mobilemin-text", function() {
    var Text;
    Text = {};
    Text.init = function(textInfo, twilioClient) {
      var sms;
      sms = drews.makeEventful({});
      sms.twilioClient = twilioClient;
      sms.to = addPlus1(textInfo.to);
      sms.from = addPlus1(textInfo.from);
      sms.body = textInfo.body;
      sms.sendSmsSuccess = function(res) {
        var sid;
        console.log("success sending sms");
        console.log(res);
        sid = res.sid;
        _.extend(sms, res);
        return sms.emit("triedtosendsuccess");
      };
      sms.maxRetries = 3;
      sms.retries = 0;
      sms.retry = function() {
        if (sms.maxRetries === sms.retries) {
          return sms.emit("maxretriesreached", sms.maxRetries);
        }
        sms.retries += 1;
        sms.send(sms.body);
        return sms.emit("retry");
      };
      sms.sendSmsError = function(err) {
        console.log("there was an error sending an sms");
        console.log(err);
        return drews.wait(3000, sms.retry);
      };
      sms.send = function() {
        return sms.twilioClient.sendSms(sms.from, sms.to, sms.body, "http://mobilemin-server.drewl.us/status", sms.sendSmsSuccess, sms.sendSmsError);
      };
      return sms;
    };
    return Text;
  });

  dModule.define("mobilemin-server", function() {
    var MobileminApp, MobileminServer, MobileminText, MobileminTwilio, config, expressRpc;
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    config = dModule.require("config");
    _ = dModule.require("underscore");
    MobileminApp = dModule.require("mobilemin-app");
    MobileminText = dModule.require("mobilemin-text");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = {};
    MobileminServer.init = function() {
      var server, twilio;
      server = {};
      server.statuses = {};
      server.info = {};
      server.twilioPhones = {};
      server.phone = function() {};
      server.sms = function(req, res) {
        var text;
        text = req.body;
        text.to = text.To;
        text.from = text.From;
        text.body = text.Body;
        server.onText(text);
        return res.send("ok");
      };
      server.status = function(req, res) {
        var info, sid, status, text;
        console.log("got status");
        console.log(req.body);
        info = req.body;
        sid = info.SmsSid;
        status = info.SmsStatus;
        if (sid && server.smsSidsWaitingStatus[sid]) {
          text = server.smsSidsWaitingStatus[sid];
          delete server.smsSidsWaitingStatus[sid];
          if (status === "sent") {
            text.emit("sent");
          } else {
            text.emit("error");
            text.retry();
          }
        }
        return res.send("ok");
      };
      server.mobileminNumber = "+14804673355";
      server.expressApp = expressRpc("/rpc", {});
      server.expressApp.post("/phone", server.phone);
      server.expressApp.post("/sms", server.sms);
      server.expressApp.post("/status", server.status);
      server.twilio = new MobileminTwilio(config.ACCOUNT_SID, config.AUTH_TOKEN);
      server.smsSidsWaitingStatus = {};
      server.conversations = {};
      twilio = server.twilio;
      server.start = function() {
        return server.expressApp.listen(8010);
      };
      server.onText = function(text) {
        var status;
        console.log("text!");
        if (text.to === server.mobileminNumber && text.body === "start") {
          console.log("its a start");
          return server.buyPhoneNumberFor(text.from);
        } else if (server.hasAStatus(text.from, text.to)) {
          status = server.getStatus(text.from, text.to);
          return server.actAccordingToStatus(status, text);
        } else if (text.body === "admin") {
          return server.onAdmin(text);
        } else if (text.body === "stop") {
          return server.onStop(text);
        } else {
          return server.onJoin(text);
        }
      };
      server.hasAStatus = function(from, to) {
        var _ref;
        return (_ref = server.statuses[from]) != null ? _ref[to] : void 0;
      };
      server.getStatus = function(from, to) {
        var _ref;
        return (_ref = server.statuses[from]) != null ? _ref[to] : void 0;
      };
      server.setStatus = function(from, to, status) {
        var _base;
        (_base = server.statuses)[from] || (_base[from] = {});
        server.statuses[from][to] = status;
        if (status === "waiting to allow admin") {
          return server.inOneHour(server.setStatus, from, to, "waiting for special");
        }
      };
      server.onAdmin = function(text) {
        server.getMisterAdmin(text.to);
        return server.whenGotMisterAdmin(server.askMisterAdminIfNewGuyCanBeAdmin, text.to, text.from);
      };
      server.getMisterAdmin = function() {
        server.misterAdminRequest = drews.makeEventful({});
        return _.defer(function() {
          return server.misterAdminRequest.emit("done", "480-840-5406");
        });
      };
      server.whenGotMisterAdmin = function() {
        var args, func, funcToCall;
        func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        funcToCall = func.bind.apply(func, [null].concat(__slice.call(args)));
        return server.misterAdminRequest.once("done", funcToCall);
      };
      server.askMisterAdminIfNewGuyCanBeAdmin = function(twilioPhone, wannaBeAdmin, misterAdmin) {
        server.text({
          to: misterAdmin,
          from: wannaBeAdmin,
          body: "Can " + wannaBeAdmin + " send texts to your subscribers on your behalf?"
        });
        server.whenTextIsSent(server.setStatus, misterAdmin, twilioPhone, "waiting to allow admin");
        return server.whenTextIsSent(server.setWannaBeAdmin, misterAdmin, twilioPhone, wannaBeAdmin);
      };
      server.onJoin = function(text) {
        server.addThisNumberToTheSubscribeList(text.from, text.to);
        server.getBusinessNameFor(text.to);
        return server.whenNumberIsAddedAndGotBusinessName(server.sayYouWillReceiveSpecials, text);
      };
      server.onStop = function(text) {
        server.removeThisNumberFromTheSubscribeList(text.from, text.to);
        server.getBusinessNameFor(text.to);
        return server.whenNumberIsRemovedAndGotBusinessName(server.sayYouWillNoLongerReceiveTextsFromThisBusiness(text.from, businessName));
      };
      server.sayYouWillNoLongerReceiveTextsFromThisBusiness = function(text, businessName) {
        return server.text({
          from: text.to,
          to: text.from,
          body: "You will not get any more texts from this number.\nText \"join\" to start getting texts agian."
        });
      };
      server.sayYouWillReceiveSpecials = function(text, businessName) {
        return server.text({
          from: text.to,
          to: text.from,
          body: "You just signed up for free specials from " + businessName + ".\nText STOP at anytime to not receive any texts,\nand START at anytime to start receiveing them agian."
        });
      };
      server.onCall = function(call) {
        server.findBusinessPhoneFor(call.to);
        return server.whenBusinessPhoneIsFound(server.forwardCall);
      };
      server.actAccordingToStatus = function(status, text) {
        if (status === "waiting for business name") {
          return server.onGotBusinessName(text.from, text.body);
        } else if (status === "waiting for business phone") {
          return server.onGotBusinessPhone(text.from, text.body);
        } else if (status === "waiting for special") {
          return server.onSpecial(text);
        } else if (status === "waiting for special confirmation") {
          return server.onSpecialConfirmation(text);
        } else if (status === "waiting to allow admin") {
          return server.onDetermineAdmin(text);
        }
      };
      server.onDetermineAdmin = function(text) {
        var wannaBeAdmin;
        wannaBeAdmin = server.getWannaBeAdmin(text.from, text.to);
        if (text.body === "yes") {
          self.grantAdminAccess(wannaBeAdmin);
          self.whenAccessIsGranted(self.tellWannaBeAdminHeIsAnAdmin, text.to, wannaBeAdmin);
        } else {
          self.tellWannaBeAdminHeGotRejected();
        }
        return self.setStatus(text.from, text.to, "waiting for special");
      };
      server.onSpecialConfirmation = function(text) {
        var specialText;
        server.setStatus(text.from, text.to, "waiting for special");
        if (text.body === "yes") {
          specialText = server.getSpecialText(text.from, text.to);
          return server.sendThisSpecialToAllMySubscribers(text.from, text.to, special);
        } else if (text.body === "no") {
          return server.sayThatTheSpecialWasNotSent(text);
        }
      };
      server.sendThisSpecialToAllMySubscribers = function(customerPhone, twilioPhone, special) {
        server.getAllSubscribers(twilioPhone);
        return server.whenIGotAllMySubscribers(server.sendToAll, twilioPhone, special);
      };
      server.sayThatTheSpecialWasNotSent = function(text) {
        return server.text({
          from: text.to,
          to: text.from,
          body: "Ok. that special was *not* sent. "
        });
      };
      server.onSpecial = function(text) {
        server.askForSpecialConfirmation(text);
        return server.setSpecialText(text.from, text.to, text.body);
      };
      server.askForSpecialConfirmation = function(text) {
        server.text({
          from: text.to,
          to: text.from,
          body: "You are about to send \"" + text.body + "\" to all your subscribers. Reply with \"yes\" to confirm."
        });
        return server.whenTextIsSent(server.setStatus, text.from, text.to, "waiting for special confirmation");
      };
      server.buyPhoneNumberFor = function(from) {
        console.log("fake buying a number");
        return _.defer(function() {
          return server.onBoughtPhoneNumber(from, "+14804282578");
        });
      };
      server.onBoughtPhoneNumber = function(customerPhone, twilioPhone) {
        server.createDatabaseRecord(customerPhone, twilioPhone);
        server.sayThatTheyreLive(customerPhone, twilioPhone);
        return server.setTwilioPhone(customerPhone, twilioPhone);
      };
      server.setTwilioPhone = function(customerPhone, twilioPhone) {
        return server.twilioPhones[customerPhone] = twilioPhone;
      };
      server.getTwilioPhone = function(customerPhone) {
        return server.twilioPhones[customerPhone];
      };
      server.createDatabaseRecord = function(customerPhone, twilioPhone) {
        server.customers || (server.customers = {});
        return server.customers[twilioPhone] = {
          misterAdmin: customerPhone
        };
      };
      server.onGotBusinessName = function(customerPhone, businessName) {
        var twilioPhone;
        twilioPhone = server.getTwilioPhone(customerPhone);
        server.setBusinessName(customerPhone, twilioPhone, businessName);
        return server.askForBusinessPhone(customerPhone);
      };
      server.setBusinessName = function(customerPhone, twilioPhone, businessName) {
        return server.setMetaInfo(customerPhone, twilioPhone, "businessName", businessName);
      };
      server.setBusinessPhone = function(customerPhone, twilioPhone, businessPhone) {
        return server.setMetaInfo(customerPhone, twilioPhone, "businessPhone", businessPhone);
      };
      server.setWannaBeAdmin = function(customerPhone, twilioPhone, wannaBeAdmin) {
        return server.setMetaInfo(customerPhone, twilioPhone, "wannaBeAdmin", wannaBeAdmin);
      };
      server.setSpecialText = function(customerPhone, twilioPhone, specialText) {
        return server.setMetaInfo(customerPhone, twilioPhone, "specialText", specialText);
      };
      server.setMetaInfo = function(from, to, key, value) {
        var _base, _base2;
        (_base = server.info)[from] || (_base[from] = {});
        (_base2 = server.info[from])[to] || (_base2[to] = {});
        return server.info[from][to][key] = value;
      };
      server.onGotBusinessPhone = function(customerPhone, businessPhone) {
        var twilioPhone;
        twilioPhone = server.getTwilioPhone(customerPhone);
        server.setBusinessPhone(customerPhone, twilioPhone, businessPhone);
        return server.sayThatTheyreLive(customerPhone, twilioPhone);
      };
      server.sayThatTheyreLive = function(customerPhone, twilioPhone) {
        var prettyTwilioPhone;
        prettyTwilioPhone = prettyPhone(twilioPhone);
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "You're live! To send out a text blast, just text a special offer to " + prettyTwilioPhone + " and all of your subscribers will get the text!  "
        });
        server.whenTextIsSent(server.setStatus, customerPhone, server.mobileminNumber, "done");
        return server.whenTextIsSent(server.setStatus, customerPhone, twilioPhone, "waiting for special");
      };
      server.askForBusinessPhone = function(customerPhone) {
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "What is your business phone number so we can forward calls?"
        });
        return server.whenTextIsSent(server.setStatus, customerPhone, server.mobileminNumber, "waiting for business phone");
      };
      server.congradulateAndAskForBuisinessName = function(customerPhone, twilioPhone) {
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "Congratulations! Your MobileMin number is " + twilioPhone + ". Your customers text \"join\" to subscribe. What is your business name?"
        });
        return server.whenTextIsSent(server.setStatus, customerPhone, server.mobileminNumber, "waiting for business name");
      };
      server.text = function(textInfo) {
        var sms, waitForTextResponse;
        sms = MobileminText.init(textInfo, server.twilio.twilioClient);
        sms.send();
        waitForTextResponse = server.waitForTextResponse.bind(null, sms);
        sms.once("triedtosendsuccess", waitForTextResponse);
        return server.lastSms = sms;
      };
      server.whenTextIsSent = function() {
        var args, func, funcToCall;
        func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        funcToCall = func.bind.apply(func, [null].concat(__slice.call(args)));
        return server.lastSms.once("sent", funcToCall);
      };
      server.waitForTextResponse = function(text) {
        return server.smsSidsWaitingStatus[text.sid] = text;
      };
      return server;
    };
    return MobileminServer;
  });

}).call(this);
