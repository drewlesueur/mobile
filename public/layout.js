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

  last = drews.makeEventful({});

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
        console.log("tried to send!!");
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
      password: config.mysql_password,
      host: "173.45.232.218"
    });
    mysqlClient.query("USE mobilemin");
    _ = dModule.require("underscore");
    MobileminApp = dModule.require("mobilemin-app");
    MobileminText = dModule.require("mobilemin-text");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = {};
    MobileminServer.init = function() {
      var Twiml, addSubscriberIfNotExists, afterDbRecordCreated, checkIfSubscriberExists, continueSpecialProcess, customerPhone, doAll, doInOrder, forwardCall, getCustomerInfo, getMetaInfo, getStatus, handleBusinessName, handleBusinessPhone, handleStatus, metaMap, oneSubscriberDone, ramStati, sayYourMessageIsTooLong, server, setCustomerInfo, setMetaInfo, setStatus, somethingNewToWaitFor, status, tellKyleSomeoneFinished, tellKyleSomeoneSignedUp, text, twilio, twilioPhone, waitAndAskForBusinessName, waitingIsOver, waitingIsOverWithKey;
      server = {};
      status = null;
      server.statuses = {};
      server.info = {};
      server.twilioPhones = {};
      server.phone = function(req, res) {
        var twilioResponse;
        console.log("got a phone call");
        twilioResponse = new Twiml.Response(res);
        if (req.body.To === "+14804673355") {
          return forwardCall(twilioResponse, "+14803813855");
        } else {
          server.getBusinessPhone(req.body.To);
          return andThen(forwardCall.bind(null, twilioResponse));
        }
      };
      forwardCall = function(twilioResponse, phoneNumber) {
        console.log("it got a phone number for forwarding " + phoneNumber);
        twilioResponse.append(new Twiml.Dial(phoneNumber));
        return twilioResponse.send();
      };
      ramStati = {};
      server.sms = function(req, res) {
        var info, key, release, text;
        console.log("Got a text");
        text = req.body;
        text.to = text.To;
        text.from = text.From;
        text.body = text.Body;
        key = text.from + text.to;
        release = function() {
          console.log("going to release");
          console.log(text);
          text = ramStati[key].text;
          server.onText(text);
          return delete ramStati[key];
        };
        if (ramStati[key]) {
          info = ramStati[key];
          clearTimeout(info.timer);
          info.text.body += text.body;
          info.timer = setTimeout(release, 2000);
        } else {
          ramStati[key] = {
            text: text,
            timer: setTimeout(release, 2000)
          };
        }
        return res.send("ok");
      };
      server.status = function(req, res) {
        var info, sid, text;
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
      Twiml = require("twilio").Twiml;
      customerPhone = "";
      twilioPhone = "";
      text = null;
      status = null;
      server.start = function() {
        return server.expressApp.listen(8010);
      };
      handleStatus = function(status) {
        console.log("status is : " + status);
        if (status) {
          console.log("going to act according to status of " + status);
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
        text = _text;
        console.log("text!");
        if (text.to === server.mobileminNumber && like(text.body, "start")) {
          console.log("its a start");
          return server.onNewCustomer(text.from);
        } else {
          console.log("going to get the status");
          getStatus(text.from, text.to);
          return andThen(handleStatus);
        }
      };
      metaMap = {
        status: "status",
        businessPhone: "business_phone",
        businessName: "business_name",
        special: "special",
        twilioPhone: "customer_phone"
      };
      setCustomerInfo = function(to, key, value) {
        var field, query, toDo;
        console.log("");
        field = metaMap[key];
        somethingNewToWaitFor();
        toDo = waitingIsOver.bind(null, last);
        query = mysqlClient.query("update customers set `" + field + "` = ? where\n  mobilemin_phone = ?", [value, to], function(err, results) {
          return toDo(results);
        });
        return last;
      };
      server.getTwilioPhone = function(customerPhone) {
        var query, toDo;
        console.log("getting twilio phone");
        somethingNewToWaitFor();
        toDo = waitingIsOverWithKey.bind(null, last, "mobilemin_phone");
        query = mysqlClient.query("select mobilemin_phone from customers where \n  customer_phone = ?\norder by id desc\nlimit 1", [customerPhone], function(err, results) {
          return toDo(results);
        });
        return last;
      };
      getCustomerInfo = function(to, key) {
        var field, query, toDo;
        field = metaMap[key];
        somethingNewToWaitFor();
        toDo = waitingIsOverWithKey.bind(null, last, field);
        query = mysqlClient.query("select `" + field + "` from customers where \n  mobilemin_phone = ?\norder by id desc\nlimit 1", [to], function(err, results) {
          console.log("NOT MAAAJOOOR");
          console.log(results);
          return toDo(results);
        });
        false && query.on("end", function(err, results) {
          console.log("MAAAAJJJJOOORRRR");
          console.log(err);
          return console.log(results);
        });
        return last;
      };
      setMetaInfo = function(from, to, key, value) {
        var field, query, toDo;
        console.log("");
        field = metaMap[key];
        somethingNewToWaitFor();
        toDo = waitingIsOver.bind(null, last);
        query = mysqlClient.query("update statuses set `" + field + "` = ? where\n  customer_phone = ?\n  and mobilemin_phone = ?", [value, from, to], function(err, results) {
          return toDo(results);
        });
        return last;
      };
      getMetaInfo = function(from, to, key) {
        var field, query, toDo;
        field = metaMap[key];
        somethingNewToWaitFor();
        toDo = waitingIsOverWithKey.bind(null, last, field);
        query = mysqlClient.query("select `" + field + "` from statuses where \n  customer_phone = ?\n  and mobilemin_phone = ?\norder by id desc\nlimit 1", [from, to], function(err, result) {
          return toDo(result);
        });
        return last;
      };
      server.onNewCustomer = function(customerPhone) {
        server.createInitialDbRecord(customerPhone);
        return andThen(server.buyPhoneNumberFor, customerPhone);
      };
      server.createInitialDbRecord = function(customerPhone) {
        var query;
        query = mysqlClient.query("insert into statuses (customer_phone, mobilemin_phone) values\n(?, ?)", [customerPhone, server.mobileminNumber]);
        somethingNewToWaitFor();
        return query.on("end", waitingIsOver.bind(null, last));
      };
      server.createDatabaseRecord = function(customerPhone, twilioPhone) {
        var query;
        query = mysqlClient.query("insert into customers (customer_phone, mobilemin_phone) values\n(?, ?)", [customerPhone, twilioPhone]);
        somethingNewToWaitFor();
        query.on("end", waitingIsOver.bind(null, last));
        return last;
      };
      server.createStatusRecord = function(customerPhone, twilioPhone) {
        var query;
        query = mysqlClient.query("insert into statuses (customer_phone, mobilemin_phone) values\n(?, ?)", [customerPhone, twilioPhone]);
        somethingNewToWaitFor();
        query.on("end", waitingIsOver.bind(null, last));
        return last;
      };
      server.addThisNumberToTheSubscribeList = function(from, to) {
        var addIfExists, exists, _last;
        somethingNewToWaitFor();
        _last = last;
        console.log("going to add this number if it exists");
        exists = checkIfSubscriberExists.bind(null, from, to);
        addIfExists = addSubscriberIfNotExists.bind(null, from, to);
        console.log;
        doInOrder(exists, addIfExists);
        andThen(function() {
          return _last.emit("done", null);
        });
        return _last;
      };
      false && _.defer(function() {
        return server.onJoin({
          from: "+14808405406",
          to: "+14804282578",
          text: "join"
        });
      });
      server.removeThisNumberFromTheSubscribeList = function(from, to) {
        var query, _last;
        somethingNewToWaitFor();
        _last = last;
        query = mysqlClient.query("delete from subscribers where \nphone_number = ? and \ncustomer_phone = ?", [from, to], function(err, results) {
          return _last.emit("done", results);
        });
        return last;
      };
      addSubscriberIfNotExists = function(from, to, exists) {
        var query, toDo, _last;
        somethingNewToWaitFor();
        if (!exists) {
          console.log("already exists.");
          _.defer(function() {
            return last.emit("done", null);
          });
          return last;
        }
        console.log("now really going to add this nubmer");
        toDo = waitingIsOver.bind(null, last);
        _last = last;
        query = mysqlClient.query("insert into subscribers (phone_number, customer_phone) values\n(?, ?)", [from, to], function(err, results) {
          return _last.emit("done", results);
        });
        return last;
      };
      checkIfSubscriberExists = function(from, to) {
        var query, _last;
        console.log("checking if subscriber exists");
        somethingNewToWaitFor();
        _last = last;
        query = mysqlClient.query("select exists(select * from subscribers where\n  phone_number = ?\n  and customer_phone = ?\n) as `exists`", [from, to], function(err, result) {
          return _last.emit("done", result[0]["exists"] === 0);
        });
        return last;
      };
      mysqlClient.on("error", function(e) {
        console.log("mysql error");
        return console.log(e);
      });
      somethingNewToWaitFor = function() {
        return last = drews.makeEventful({});
      };
      waitingIsOver = function(last, value) {
        return last.emit("done", value);
      };
      waitingIsOverWithKey = function(last, key, value) {
        var ret, _ref;
        ret = value != null ? (_ref = value[0]) != null ? _ref[key] : void 0 : void 0;
        return last.emit("done", ret);
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
      doAll = function() {
        var count, length, results, waiters, _last;
        waiters = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        console.log("doing all");
        length = waiters.length;
        count = 0;
        results = [];
        last = drews.makeEventful({});
        _last = last;
        _last.test = "***this is a test";
        _.each(waiters, function(waiter, index) {
          return _.defer(function() {
            waiter = waiter();
            console.log("doAll called  " + (index + 1) + "/" + length);
            return waiter.once("done", function() {
              var vals;
              vals = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              count += 1;
              console.log("doAll done  " + count + "/" + length);
              results = results.concat(vals);
              if (count === length) {
                console.log("EMITTING");
                console.log(results);
                console.log(_last.test);
                return _last.emit.apply(_last, ["done"].concat(__slice.call(results)));
              }
            });
          });
        });
        return _last;
      };
      doInOrder = function() {
        var count, execWaiter, length, results, waiters, _last;
        waiters = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        console.log("do in order");
        console.log(waiters[0] === waiters[1]);
        console.log(waiters);
        length = waiters.length;
        count = 0;
        results = [];
        last = drews.makeEventful({});
        _last = last;
        execWaiter = function() {
          var waiter;
          waiter = waiters[count];
          waiter = waiter.apply(null, results);
          console.log("called doInOrder " + (count + 1) + "/" + length);
          return waiter.once("done", function() {
            var vals;
            vals = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            results = results.concat(vals);
            console.log("done with a  doInOrder " + (count + 1) + "/" + length);
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
      server.onJoin = function(text) {
        var adding, from, gettingBN, to;
        console.log("going to join");
        from = text.from, to = text.to;
        gettingBN = function() {
          return server.getBusinessName(to);
        };
        adding = function() {
          return server.addThisNumberToTheSubscribeList(from, to);
        };
        doAll(gettingBN, adding);
        last.once("done", function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return console.log("DDOOOOONNNNEEEE");
        });
        return andThen(server.sayYouWillReceiveSpecials, text);
      };
      server.onStop = function(text) {
        var bn, remove;
        bn = function() {
          return server.getBusinessName(text.to);
        };
        remove = function() {
          return server.removeThisNumberFromTheSubscribeList(text.from, text.to);
        };
        doAll(bn, remove);
        return andThen(server.sayYouWillNoLongerReceiveTextsFromThisBusiness, text);
      };
      server.sayYouWillNoLongerReceiveTextsFromThisBusiness = function(text, businessName) {
        return server.text({
          from: text.to,
          to: text.from,
          body: "We'll stop texting you. Text \"Join\" if you change your mind.\n-" + businessName
        });
      };
      server.sayYouWillReceiveSpecials = function(text, businessName) {
        console.log("business name is " + businessName);
        console.log("saying you will recieve specials from " + businessName);
        return server.text({
          from: text.to,
          to: text.from,
          body: "Congrats! You've joined " + businessName + " text specials!\nText \"Stop\" anytime to cancel."
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
        setStatus(text.from, text.to, "waiting for special");
        if (like(text.body, "yes")) {
          server.getSpecial(text.from, text.to);
          return andThen(server.sendThisSpecialToAllMySubscribers, text.from, text.to);
        } else {
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
        query = mysqlClient.query("select phone_number from subscribers where \n  customer_phone = ?", [twilioPhone]);
        somethingNewToWaitFor();
        query.on("row", oneSubscriberDone.bind(null, last));
        return query.on("end", waitingIsOver.bind(null, last));
      };
      oneSubscriberDone = function(last, value) {
        return last.emit("one", value["phone_number"]);
      };
      server.sayThatTheSpecialWasNotSent = function(text) {
        return server.text({
          from: text.to,
          to: text.from,
          body: "Ok. That special was *not* sent. "
        });
      };
      server.onSpecial = function(text) {
        server.getBusinessName(text.to);
        return andThen(continueSpecialProcess.bind(null, text));
      };
      continueSpecialProcess = function(text, businessName) {
        text.body += "\n-" + businessName;
        if (text.body.length > 160) {
          return sayYourMessageIsTooLong(text);
        } else {
          server.askForSpecialConfirmation(text);
          return server.setSpecial(text.from, text.to, text.body);
        }
      };
      sayYourMessageIsTooLong = function(text) {
        var over;
        over = text.body.length - 160;
        return server.text({
          from: text.to,
          to: text.from,
          body: "Your message is " + over + " characters too long. Trim it down and send it again."
        });
      };
      server.askForSpecialConfirmation = function(text) {
        server.text({
          from: text.to,
          to: text.from,
          body: "You are about to send that to all your subscribers. Reply \"yes\" to confirm, \"no\" to cancel."
        });
        return andThen(setStatus, text.from, text.to, "waiting for special confirmation");
      };
      server.buyPhoneNumberFor = function(from) {
        var actuallyBuy, areaCode, buyError, buySuccess;
        var _this = this;
        areaCode = drews.s(from, 2, 3);
        buySuccess = function(justBoughtNumber) {
          var newPhone;
          newPhone = justBoughtNumber.phone_number;
          server.onBoughtPhoneNumber(from, newPhone);
          return console.log("you just bought a number which was " + newPhone);
        };
        buyError = function(error) {
          return console.log("There was an error");
        };
        actuallyBuy = true;
        return actuallyBuy && twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {
          params: {
            VoiceUrl: "http://mobilemin-server.drewl.us/phone",
            SmsUrl: "http://mobilemin-server.drewl.us/sms",
            AreaCode: areaCode,
            StatusUrl: "http://mobilemin-server.drewl.us/status"
          }
        }, buySuccess, buyError);
      };
      server.onBoughtPhoneNumber = function(customerPhone, twilioPhone) {
        var customers, statuses;
        customers = function() {
          return server.createDatabaseRecord(customerPhone, twilioPhone);
        };
        statuses = function() {
          return server.createStatusRecord(customerPhone, twilioPhone);
        };
        doAll(customers, statuses);
        andThen(afterDbRecordCreated, customerPhone, twilioPhone);
        return tellKyleSomeoneSignedUp(customerPhone, twilioPhone);
      };
      tellKyleSomeoneSignedUp = function(customerPhone, twilioPhone) {
        text = {
          from: server.mobileminNumber,
          to: "4803813855",
          body: "Someone new signed up. Their Text Marketing Number is " + (prettyPhone(twilioPhone)) + ".\nTheir cell phone is " + (prettyPhone(customerPhone)) + "."
        };
        return server.text(text);
      };
      tellKyleSomeoneFinished = function(customerPhone, twilioPhone, businessPhone, businessName) {
        return server.text({
          from: server.mobileminNumber,
          to: "4803813855",
          body: "" + businessName + " finished signing up.\nTheir Text Marketing number is " + (prettyPhone(twilioPhone)) + ".\nTheir business phone is " + (prettyPhone(businessPhone)) + ".\nTheir cell phone is " + (prettyPhone(customerPhone)) + ".\n"
        });
      };
      afterDbRecordCreated = function(customerPhone, twilioPhone) {
        server.sayThatTheyreLive(customerPhone, twilioPhone);
        return andThen(waitAndAskForBusinessName, customerPhone, twilioPhone);
      };
      waitAndAskForBusinessName = function(customerPhone, twilioPhone) {
        var askForName;
        console.log("waiting and then asking for business name");
        askForName = server.askForBusinessName.bind(null, customerPhone, twilioPhone);
        return drews.wait(1000, askForName);
      };
      server.onGotBusinessName = function(customerPhone, businessName) {
        console.log("got business name!!!");
        server.getTwilioPhone(customerPhone);
        return andThen(handleBusinessName, customerPhone, businessName);
      };
      handleBusinessName = function(customerPhone, businessName, twilioPhone) {
        console.log("handling business name");
        server.setBusinessName(twilioPhone, businessName);
        return andThen(server.askForBusinessPhone, customerPhone);
      };
      getStatus = function(from, to) {
        console.log("getting status");
        return getMetaInfo(from, to, "status");
      };
      setStatus = function(from, to, status) {
        setMetaInfo(from, to, "status", status);
        if (status === "waiting to allow admin") {
          return server.inOneHour(setStatus, from, to, "waiting for special");
        }
      };
      server.setSpecial = function(customerPhone, twilioPhone, special) {
        return setMetaInfo(customerPhone, twilioPhone, "special", special);
      };
      server.getSpecial = function(customerPhone, twilioPhone) {
        return getMetaInfo(customerPhone, twilioPhone, "special");
      };
      server.setBusinessName = function(twilioPhone, businessName) {
        console.log("setting business name " + twilioPhone + ": " + businessName);
        return setCustomerInfo(twilioPhone, "businessName", businessName);
      };
      server.getBusinessName = function(twilioPhone) {
        console.log("getting business name");
        return getCustomerInfo(twilioPhone, "businessName");
      };
      server.setBusinessPhone = function(twilioPhone, businessPhone) {
        return setCustomerInfo(twilioPhone, "businessPhone", businessPhone);
      };
      server.getBusinessPhone = function(twilioPhone) {
        return getCustomerInfo(twilioPhone, "businessPhone");
      };
      server.setWannaBeAdmin = function(twilioPhone, wannaBeAdmin) {
        return setCustomerInfo(twilioPhone, "wannaBeAdmin", wannaBeAdmin);
      };
      server.getWannaBeAdmin = function(twilioPhone) {
        return getCustomerInfo(twilioPhone, "wannaBeAdmin");
      };
      server.onGotBusinessPhone = function(customerPhone, businessPhone) {
        console.log("ON GOT BUSINESS PHONE");
        console.log(businessPhone);
        console.log("end business phone");
        server.getTwilioPhone(customerPhone);
        return andThen(handleBusinessPhone, customerPhone, businessPhone);
      };
      handleBusinessPhone = function(customerPhone, businessPhone, twilioPhone) {
        console.log("handling business PHONE!!!! " + twilioPhone);
        server.setBusinessPhone(twilioPhone, businessPhone);
        return andThen(server.sayThatTheyreLiveAgain, customerPhone, twilioPhone, businessPhone);
      };
      server.sayThatTheyreLive = function(customerPhone, twilioPhone) {
        var prettyTwilioPhone;
        prettyTwilioPhone = prettyPhone(twilioPhone);
        text = server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "You're live! Your Text Marketing Number is " + prettyTwilioPhone + ". Text it to send your customers a special. They text \"Join\" to subscribe."
        });
        andThen(setStatus, customerPhone, twilioPhone, "waiting for special");
        return text;
      };
      server.sayThatTheyreLiveAgain = function(customerPhone, twilioPhone, businessPhone) {
        var prettyTwilioPhone;
        prettyTwilioPhone = prettyPhone(twilioPhone);
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "All set. Invite your customers to receive text specials by having them text \"Join\" to " + (prettyPhone(twilioPhone)) + ".\nNow, save that number in your phone."
        });
        andThen(setStatus, customerPhone, server.mobileminNumber, "done");
        server.getBusinessName(twilioPhone);
        return andThen(tellKyleSomeoneFinished.bind(null, customerPhone, twilioPhone, businessPhone));
      };
      server.askForBusinessPhone = function(customerPhone) {
        server.text({
          from: server.mobileminNumber,
          to: customerPhone,
          body: "What is your business phone number?"
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
        var itsDone, sms, waitForTextResponse;
        sms = MobileminText.init(textInfo, server.twilio.twilioClient);
        sms.send();
        waitForTextResponse = server.waitForTextResponse.bind(null, sms);
        sms.once("triedtosendsuccess", waitForTextResponse);
        server.lastSms = sms;
        last = sms;
        itsDone = sms.emit.bind(sms, "done");
        sms.once("sent", itsDone);
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
