(function() {
  var addPlus1, andThen, drews, last, like, onEach, onError, prettyPhone, _;
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

  like = function(input, text) {
    input = input.replace(/\W/g, "");
    return input.toLowerCase() === text.toLowerCase();
  };

  prettyPhone = function(phone) {
    var areacode, prefix, suffix;
    if (phone.length === 12) phone = drews.s(phone, 2);
    areacode = drews.s(phone, 0, 3);
    prefix = drews.s(phone, 3, 3);
    suffix = drews.s(phone, 6);
    return "" + areacode + "-" + prefix + "-" + suffix;
  };

  last = drews.eventMaker({});

  andThen = function() {
    var args, fn, whatToDo;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    whatToDo = fn.bind.apply(fn, [null].concat(__slice.call(args)));
    return last.once("done", whatToDo);
  };

  onEach = function() {
    var args, fn, whatToDo;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    whatToDo = fn.bind.apply(fn, [null].concat(__slice.call(args)));
    return last.on("one", whatToDo);
  };

  onError = function() {
    var args, fn, whatToDo;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    whatToDo = fn.bind.apply(fn, [null].concat(__slice.call(args)));
    return last.on("one", whatToDo);
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
          sms.emit("error");
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
    var MobileminApp, MobileminServer, MobileminText, MobileminTwilio, config, expressRpc, mysql, mysqlClient;
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    config = dModule.require("config");
    mysql = require("mysql");
    mysqlClient = mysql.createClient({
      user: config.mysql_user,
      passsword: config.mysql_password
    });
    mysqlClient.query("USE mobilemin");
    _ = dModule.require("underscore");
    MobileminApp = dModule.require("mobilemin-app");
    MobileminText = dModule.require("mobilemin-text");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = {};
    MobileminServer.init = function() {
      var getMetaInfo, getStatus, handleStatus, metaMap, oneDone, server, setMetaInfo, setStatus, somethingNewToWaitFor, status, twilio, waitingIsOver;
      server = {};
      status = null;
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
        var info, sid, text;
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
      handleStatus = function() {
        if (status) {
          return server.actAccordingToStatus(status, text);
        } else if (like(text.body, "admin")) {
          return server.onAdmin(text);
        } else if (like(text.body, "stop")) {
          return server.onStop(text);
        } else {
          return server.onJoin(text);
        }
      };
      server.onText = function(_text) {
        var text;
        text = _text;
        console.log("text!");
        if (text.to === server.mobileminNumber && like(text.body, "start")) {
          console.log("its a start");
          return server.buyPhoneNumberFor(text.from);
        } else {
          getStatus();
          return andThen(handleStatus);
        }
      };
      metaMap = {
        status: "status",
        businessPhone: "business_phone",
        businessName: "business_name",
        special: "special"
      };
      setMetaInfo = function(from, to, key, value) {
        var field, query;
        field = metaMap[key];
        query = mysqlClient.query("update customers set `" + field + "` = ? where\n  customer_phone = ?\n  and mobilemin_phone = ?", [value, from, to]);
        somethingNewToWaitFor();
        return query.on("end", waitingIsOver);
      };
      getMetaInfo = function(from, to, key) {
        var field, query;
        field = metaMap[key];
        query = mysqlClient.query("select `" + field + "` from customers where \n  customer_phone = ?\n  and mobilemin_phone = ?", [from, to]);
        somethingNewToWaitFor();
        return query.on("field", waitingIsOver);
      };
      server.addThisNumberToTheSubscribeList = function(from, to) {
        var query;
        query = mysqlClient.query("insert into subscribers (phone_number, customer_phone) values\n(from, to)");
        somethingNewToWaitFor();
        return query.on("end", waitingIsOver);
      };
      server.removeThisNumberFromTheSubscribeList = function(from, to) {
        var remove;
        remove = drews.makeEventful({});
        server.remove = remove;
        return _.defer(function() {
          return remove.emit("done");
        });
      };
      somethingNewToWaitFor = function() {
        return last = drews.eventMaker({});
      };
      waitingIsOver = function(value) {
        last.emit("done", value);
        return console.log(value);
      };
      server.onAdmin = function(text) {
        server.getMisterAdmin(text.to);
        return andThen(server.askMisterAdminIfNewGuyCanBeAdmin, text.to, text.from);
      };
      server.getMisterAdmin = function() {
        return last = "";
      };
      server.askMisterAdminIfNewGuyCanBeAdmin = function(twilioPhone, wannaBeAdmin, misterAdmin) {
        server.text({
          to: misterAdmin,
          from: wannaBeAdmin,
          body: "Can " + wannaBeAdmin + " send texts to your subscribers on your behalf?"
        });
        andThen(setStatus, misterAdmin, twilioPhone, "waiting to allow admin");
        return andThen(server.setWannaBeAdmin, misterAdmin, twilioPhone, wannaBeAdmin);
      };
      server.onJoin = function(text) {
        server.addThisNumberToTheSubscribeList(text.from, text.to);
        return andThen(server.sayYouWillReceiveSpecials, text);
      };
      server.onStop = function(text) {
        server.removeThisNumberFromTheSubscribeList(text.from, text.to);
        return andThen(server.sayYouWillNoLongerReceiveTextsFromThisBusiness(text.from, businessName));
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
        return andThen(server.forwardCall);
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
        if (like(text.body, "yes")) {
          self.grantAdminAccess(wannaBeAdmin);
          andThen(self.tellWannaBeAdminHeIsAnAdmin, text.to, wannaBeAdmin);
        } else {
          self.tellWannaBeAdminHeGotRejected();
        }
        return setStatus(text.from, text.to, "waiting for special");
      };
      server.onSpecialConfirmation = function(text) {
        var special;
        setStatus(text.from, text.to, "waiting for special");
        if (like(text.body, "yes")) {
          special = server.getSpecial(text.from, text.to);
          return server.sendThisSpecialToAllMySubscribers(text.from, text.to, special);
        } else if (text.body === "no") {
          return server.sayThatTheSpecialWasNotSent(text);
        }
      };
      server.sendThisSpecialToAllMySubscribers = function(customerPhone, twilioPhone, special) {
        var sendInfo;
        server.getAllSubscribers(twilioPhone);
        sendInfo = {
          sent: 0,
          tried: 0,
          gotStatusFor: 0,
          erroredPhones: []
        };
        onEach(server.sendToThisPerson, sendInfo, twilioPhone, special);
        return andThen(server.sendResultsOfSpecial, customerPhone, twilioPhone, sendInfo);
      };
      server.sendResultsOfSpecial = function(customerPhone, twilioPhone, sendInfo) {
        var body;
        body = "Your special was sent to " + sendInfo.tried + " People.";
        return server.text({
          from: twilioPhone,
          to: customerPhone,
          body: body
        });
      };
      server.sendToThisPerson = function(sendInfo, twilioPhone, special, person) {
        var text;
        text = server.text({
          from: twilioPhone,
          to: person,
          body: special
        });
        sendInfo.tried += 1;
        andThen(server.acumulateSent, sendInfo, text);
        return onError(server.acumulateError, sendInfo, text);
      };
      server.acumulateSent = function(sendInfo, text) {
        return sendInfo.sent += 1;
      };
      server.acumulateError = function(sendInfo, text) {
        return sendInfo.erroredPhones.push(text.to);
      };
      server.getAllSubscribers = function(twilioPhone) {
        var query;
        query = mysqlClient.query("select phone_number from subscribers where \n  and mobilemin_phone = ?", [twilioPhone]);
        somethingNewToWaitFor();
        query.on("field", oneDone);
        return query.on("end", waitingIsOver);
      };
      oneDone = function(value) {
        return last.emit("one", value);
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
        return server.setSpecial(text.from, text.to, text.body);
      };
      server.askForSpecialConfirmation = function(text) {
        server.text({
          from: text.to,
          to: text.from,
          body: "You are about to send \"" + text.body + "\" to all your subscribers. Reply with \"yes\" to confirm."
        });
        return andThen(setStatus, text.from, text.to, "waiting for special confirmation");
      };
      server.buyPhoneNumberFor = function(from) {
        console.log("fake buying a number");
        return _.defer(function() {
          return server.onBoughtPhoneNumber(from, "+14804282578");
        });
      };
      server.onBoughtPhoneNumber = function(customerPhone, twilioPhone) {
        var askForName;
        server.createDatabaseRecord(customerPhone, twilioPhone);
        server.sayThatTheyreLive(customerPhone, twilioPhone);
        server.setTwilioPhone(customerPhone, twilioPhone);
        askForName = server.askForBusinessName.bind(null, customerPhone, twilioPhone);
        return drews.wait(1000, askForName);
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
        return andThen(server.askForBusinessPhone, customerPhone);
      };
      getStatus = function(from, to) {
        return getMetaInfo(from, to, status);
      };
      setStatus = function(from, to, status) {
        setMetaInfo(from, to, "status", status);
        if (status === "waiting to allow admin") {
          return server.inOneHour(setStatus, from, to, "waiting for special");
        }
      };
      server.setBusinessName = function(customerPhone, twilioPhone, businessName) {
        return setMetaInfo(customerPhone, twilioPhone, "businessName", businessName);
      };
      server.getBusinessName = function(customerPhone, twilioPhone) {
        return setMetaInfo(customerPhone, twilioPhone, "businessName");
      };
      server.setBusinessPhone = function(customerPhone, twilioPhone, businessPhone) {
        return setMetaInfo(customerPhone, twilioPhone, "businessPhone", businessPhone);
      };
      server.getBusinessPhone = function(customerPhone, twilioPhone) {
        return setMetaInfo(customerPhone, twilioPhone, "businessPhone");
      };
      server.setWannaBeAdmin = function(customerPhone, twilioPhone, wannaBeAdmin) {
        return setMetaInfo(customerPhone, twilioPhone, "wannaBeAdmin", wannaBeAdmin);
      };
      server.getWannaBeAdmin = function(customerPhone, twilioPhone) {
        return setMetaInfo(customerPhone, twilioPhone, "wannaBeAdmin");
      };
      server.setSpecial = function(customerPhone, twilioPhone, special) {
        return setMetaInfo(customerPhone, twilioPhone, "special", special);
      };
      server.getSpecial = function(customerPhone, twilioPhone) {
        return getMetaInfo(customerPhone, twilioPhone, "special");
      };
      server.onGotBusinessPhone = function(customerPhone, businessPhone) {
        var twilioPhone;
        twilioPhone = server.getTwilioPhone(customerPhone);
        server.setBusinessPhone(customerPhone, twilioPhone, businessPhone);
        return andThen(server.sayThatTheyreLiveAgain(customerPhone, twilioPhone));
      };
      server.sayThatTheyreLive = function(customerPhone, twilioPhone) {
        var prettyTwilioPhone;
        prettyTwilioPhone = prettyPhone(twilioPhone);
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "You're live! To send out a text blast, just text a special offer to " + prettyTwilioPhone + " and all of your subscribers will get the text!  "
        });
        return andThen(setStatus, customerPhone, twilioPhone, "waiting for special");
      };
      server.sayThatTheyreLiveAgain = function(customerPhone, twilioPhone) {
        var prettyTwilioPhone;
        prettyTwilioPhone = prettyPhone(twilioPhone);
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "Thanks. Now send out a special to " + (prettyPhone(twilioPhone)) + "."
        });
        return andThen(setStatus, customerPhone, server.mobileminNumber, "done");
      };
      server.askForBusinessPhone = function(customerPhone) {
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "What is your business phone number so we can forward calls?"
        });
        return andThen(setStatus, customerPhone, server.mobileminNumber, "waiting for business phone");
      };
      server.askForBusinessName = function(customerPhone, twilioPhone) {
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "What is your business name?"
        });
        return andThen(setStatus, customerPhone, server.mobileminNumber, "waiting for business name");
      };
      server.text = function(textInfo) {
        var sms, waitForTextResponse;
        sms = MobileminText.init(textInfo, server.twilio.twilioClient);
        sms.send();
        waitForTextResponse = server.waitForTextResponse.bind(null, sms);
        sms.once("triedtosendsuccess", waitForTextResponse);
        server.lastSms = sms;
        last = sms;
        return sms;
      };
      server.waitForTextResponse = function(text) {
        return server.smsSidsWaitingStatus[text.sid] = text;
      };
      return server;
    };
    return MobileminServer;
  });

}).call(this);
