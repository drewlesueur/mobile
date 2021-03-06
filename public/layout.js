(function() {
  var addPlus1, andThen, config, cron, drews, last, like, onEach, onError, prettyPhone, _,
    __slice = Array.prototype.slice;

  config = dModule.require("config");

  cron = require("cron");

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
        return sms.twilioClient.sendSms(sms.from, sms.to, sms.body, "http://" + config.server.hostName + ":" + config.server.port + "/status", sms.sendSmsSuccess, sms.sendSmsError);
      };
      return sms;
    };
    return Text;
  });

  dModule.define("mobilemin-server", function() {
    var MobileminApp, MobileminServer, MobileminText, MobileminTwilio, checkConnection, clientCredentials, expressRpc, mysql, mysqlClient, onReconnect, tryToReconnect;
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    config = dModule.require("config");
    mysql = require("mysql");
    clientCredentials = {
      user: config.mysql_user,
      password: config.mysql_password,
      host: config.server.hostName
    };
    mysqlClient = mysql.createClient(clientCredentials);
    onReconnect = function(err) {
      console.log("trying got reconnect status");
      if (err && err.errno === 'ECONNREFUSED') {
        console.log("trying to reconnect in 1 sec");
        return drews.wait(1000, tryToReconnect);
      }
    };
    tryToReconnect = function() {
      console.log("trying to reconnect now");
      mysqlClient = mysql.createClient(clientCredentials);
      return mysqlClient.query("use mobilemin", function(err) {
        console.log("first query after");
        return console.log(err);
      });
    };
    checkConnection = function() {
      console.log("checking connection");
      if (!mysqlClient.connected) {
        return tryToReconnect();
      } else {
        return console.log("good");
      }
    };
    drews.wait(1000, function() {
      return setInterval(checkConnection, 5000);
    });
    mysqlClient.on("error", function(err) {
      console.log("mysql error");
      return console.log(err);
    });
    mysqlClient.on("end", function(e) {
      console.log("it ended");
      return console.log(e);
    });
    mysqlClient.query("USE mobilemin");
    mysqlClient.query("select `customer_phone` from statuses limit 1", function(err, results) {
      console.log("done showing tables");
      return console.log(results);
    });
    _ = dModule.require("underscore");
    MobileminApp = dModule.require("mobilemin-app");
    MobileminText = dModule.require("mobilemin-text");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = {};
    MobileminServer.init = function() {
      var Thumbs, Twiml, addSubscriberIfNotExists, afterDbRecordCreated, askThemWhatTheirNewJoinTextShouldSay, checkIfSubscriberExists, continueSpecialProcess, createTextHold, cronJob, customerPhone, doAll, doInOrder, forwardCall, getCustomerInfo, getJoinText, getMetaInfo, getNextCallToAction, getRamStatus, getStatus, getTotalSubscribers, giveStats, handleBusinessName, handleBusinessPhone, handleStatus, incPoolCount, isTextHold, letUserKnowTextsAreBeingSentOut, metaMap, onGotJoinText, onJoinTextChange, oneSubscriberDone, otherOnSpecial, poolCount, poolOfCallsToAction, ramStati, releaseTextHold, removeIncomingTextHold, replyWithTheSpecialToTheUser, respondWithJoinText, sayJoinTextIsTooLong, sayJoinTextWasUpdatedAndWaitForSpecial, sayYourMessageIsTooLong, server, setCustomerInfo, setJoinText, setMetaInfo, setRamStatus, setStatus, somethingNewToWaitFor, status, tellKyleSomeoneFinished, tellKyleSomeoneSignedUp, text, thumbsExtra, twilio, twilioPhone, waitAndAskForBusinessName, waitingIsOver, waitingIsOverWithKey;
      server = {};
      status = null;
      server.statuses = {};
      server.info = {};
      server.twilioPhones = {};
      server.phone = function(req, res) {
        var twilioResponse;
        console.log("got a phone call");
        twilioResponse = new Twiml.Response(res);
        if (req.body.To === server.mobileminNumber) {
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
      otherOnSpecial = null;
      thumbsExtra = {
        setOtherOnSpecial: function(x) {
          return otherOnSpecial = x;
        },
        startsWith: function(x, y) {
          return drews.startsWith(x, y);
        },
        split: function(str, onStr) {
          return str.split(onStr);
        },
        getSpace: function() {
          return " ";
        },
        getPhoneFromAdminText: function(body) {
          var phone, split;
          split = body.split(" ");
          phone = addPlus1(split[1].replace(/-/g, ""));
          return phone;
        },
        addAdmin: function(customerPhone, twilioPhone, cb) {
          server.getBusinessName(twilioPhone);
          return andThen(function(businessName) {
            var customers, statuses;
            customers = function() {
              return server.createDatabaseRecord(customerPhone, twilioPhone);
            };
            statuses = function() {
              return server.createStatusRecord(customerPhone, twilioPhone);
            };
            doAll(customers, statuses);
            return andThen(function() {
              console.log("I thought the businessName was " + businessName);
              server.setBusinessName(twilioPhone, businessName);
              return andThen(function() {
                setStatus(customerPhone, twilioPhone, "waiting for special");
                return andThen(function() {
                  return cb(null, businessName);
                });
              });
            });
          });
        },
        removeAdmin: function(customerPhone, twilioPhone, cb) {
          return cb();
        },
        sendText: function(from, to, body) {
          console.log("trying to send a text from thumbs!");
          return server.text({
            from: from,
            to: to,
            body: body
          });
        }
      };
      Thumbs = require("../thumbs.js");
      Thumbs.addScope(thumbsExtra);
      Thumbs.runFile("./public/layout.thumbs");
      ramStati = {};
      server.sms = function(req, res) {
        var text;
        console.log("Got a text");
        text = req.body;
        text.to = text.To;
        text.from = text.From;
        text.body = text.Body;
        if ((!isTextHold(text.from, text.to)) || like(text.body, "yes") || like(text.body, "no")) {
          console.log("not on hold, releasing");
          createTextHold(text.from, text.to);
          drews.wait(4000, releaseTextHold.bind(null, text.from, text.to));
          server.onText(text);
        } else {
          console.log(" \n\n  on hold, not releasing\n  the text that is on hold is\n  " + (text.body.substring(0, 10)) + "...\n");
        }
        return res.send("");
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
        return res.send("");
      };
      server.mobileminNumber = config.mobileminNumber;
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
      handleStatus = function(text, status) {
        if (status) {
          return server.actAccordingToStatus(status, text);
        } else if (like(text.body, "admin")) {
          return server.onAdmin(text);
        } else if (like(text.body, "stop")) {
          return server.onStop(text);
        } else if (text.body.length <= 6) {
          return server.onJoin(text);
        }
      };
      server.onText = function(_text) {
        text = _text;
        if (text.from === "+14803813855" && text.to === server.mobileminNumber && like(text.body, "remind")) {
          return server.updateUsersWithProgress();
        } else if (text.to === server.mobileminNumber && like(text.body, "start")) {
          return server.onNewCustomer(text.from);
        } else {
          getStatus(text.from, text.to);
          return andThen(handleStatus, text);
        }
      };
      metaMap = {
        status: "status",
        businessPhone: "business_phone",
        businessName: "business_name",
        special: "special",
        twilioPhone: "customer_phone",
        joinText: "join_text"
      };
      setCustomerInfo = function(to, key, value) {
        var field, query, toDo;
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
        query = mysqlClient.query("select `" + field + "` from customers where \n  mobilemin_phone = ?\norder by id asc\nlimit 1", [to], function(err, results) {
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
        exists = checkIfSubscriberExists.bind(null, from, to);
        addIfExists = addSubscriberIfNotExists.bind(null, from, to);
        doInOrder(exists, addIfExists);
        andThen(function(doesntAlreadyExist) {
          return _last.emit("done", doesntAlreadyExist);
        });
        return _last;
      };
      server.removeThisNumberFromTheSubscribeList = function(from, to) {
        var query, _last;
        somethingNewToWaitFor();
        _last = last;
        query = mysqlClient.query("update subscribers set active = 0 where \nphone_number = ? and \ncustomer_phone = ?", [from, to], function(err, results) {
          return _last.emit("done", results);
        });
        return last;
      };
      addSubscriberIfNotExists = function(from, to, doesntExist) {
        var query, toDo, _last;
        somethingNewToWaitFor();
        _last = last;
        if (!doesntExist) {
          query = mysqlClient.query("update subscribers set active = 1 where\n  phone_number = ? and\n  customer_phone = ?", [from, to], function(err, results) {
            return _last.emit("done", results);
          });
        } else {
          toDo = waitingIsOver.bind(null, last);
          query = mysqlClient.query("insert into subscribers (phone_number, customer_phone, active) values\n(?, ?, 1)", [from, to], function(err, results) {
            return _last.emit("done", results);
          });
        }
        return last;
      };
      checkIfSubscriberExists = function(from, to) {
        var query, _last;
        somethingNewToWaitFor();
        _last = last;
        query = mysqlClient.query("select exists(select * from subscribers where\n  phone_number = ?\n  and customer_phone = ?\n) as `exists`", [from, to], function(err, result) {
          return _last.emit("done", result[0]["exists"] === 0);
        });
        return last;
      };
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
        length = waiters.length;
        count = 0;
        results = [];
        last = drews.makeEventful({});
        _last = last;
        _last.test = "***this is a test";
        _.each(waiters, function(waiter, index) {
          return _.defer(function() {
            waiter = waiter();
            return waiter.once("done", function() {
              var flattenedResults, result, resultItem, vals, _i, _j, _len, _len2;
              vals = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              count += 1;
              results[index] = vals;
              if (count === length) {
                flattenedResults = [];
                for (_i = 0, _len = results.length; _i < _len; _i++) {
                  result = results[_i];
                  for (_j = 0, _len2 = result.length; _j < _len2; _j++) {
                    resultItem = result[_j];
                    flattenedResults.push(resultItem);
                  }
                }
                return _last.emit.apply(_last, ["done"].concat(__slice.call(flattenedResults)));
              }
            });
          });
        });
        return _last;
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
      server.onJoin = function(text) {
        var adding, from, gettingBN, gettingJoinText, to;
        from = text.from, to = text.to;
        gettingBN = function() {
          return server.getBusinessName(to);
        };
        adding = function() {
          return server.addThisNumberToTheSubscribeList(from, to);
        };
        gettingJoinText = function() {
          return getJoinText(text.to);
        };
        doAll(gettingBN, adding, gettingJoinText);
        return andThen(server.sayYouWillReceiveSpecials, text);
      };
      server.onStats = function(text) {
        getTotalSubscribers(text);
        last.once("done", function(total) {});
        return andThen(giveStats, text);
      };
      giveStats = function(text, numberOfSubscribers) {
        return server.text({
          to: text.from,
          from: text.to,
          body: "You have " + numberOfSubscribers + " subscribers."
        });
      };
      getTotalSubscribers = function(text) {
        var query, _last;
        somethingNewToWaitFor();
        _last = last;
        _last.offer = "200";
        return query = mysqlClient.query("select count(*) as `count` from subscribers s join customers c on (c.mobilemin_phone = s.customer_phone) where \n  s.customer_phone = ?\n  and c.customer_phone = ?\n  and s.active = 1 ", [text.to, text.from], function(err, results) {
          var _ref;
          return _last.emit("done", results != null ? (_ref = results[0]) != null ? _ref.count : void 0 : void 0);
        });
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
        var fromText;
        businessName || (businessName = "");
        if (!businessName) {
          fromText = "";
        } else {
          fromText = "\n-" + businessName;
        }
        return server.text({
          from: text.to,
          to: text.from,
          body: "We'll stop texting you. Text \"Join\" if you change your mind." + fromText
        });
      };
      server.sayYouWillReceiveSpecials = function(text, businessName, didntAlreadyExist, joinText) {
        var defaultText, fromBusiness;
        if (!businessName) {
          businessName = "";
          fromBusiness = "";
          defaultText = "You've signed up for Text Specials!";
        } else {
          defaultText = "You've joined " + businessName + " Text Specials!";
          fromBusiness = "\n-" + businessName;
        }
        if (didntAlreadyExist) {
          if (!joinText) {
            joinText = "Congrats! " + defaultText + "\nText \"Stop\" anytime to cancel.";
          }
          return server.text({
            from: text.to,
            to: text.from,
            body: joinText
          });
        } else {
          return server.text({
            from: text.to,
            to: text.from,
            body: "Hooray! You're signed up to receive text specials." + fromBusiness
          });
        }
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
        } else if (status === "waiting for join text") {
          return onGotJoinText(text);
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
        sendInfo = {
          sent: 0,
          tried: 0,
          gotStatusFor: 0,
          erroredPhones: []
        };
        getTotalSubscribers({
          from: customerPhone,
          to: twilioPhone
        });
        andThen(function(numberOfSubscribers) {
          return server.sayGoingToSendTo(customerPhone, twilioPhone, numberOfSubscribers);
        });
        server.getAllSubscribers(twilioPhone);
        return onEach(server.sendToThisPerson, sendInfo, twilioPhone, special);
      };
      letUserKnowTextsAreBeingSentOut = function(customerPhone, twilioPhone) {
        return server.text({
          from: twilioPhone,
          to: customerPhone,
          body: "Ok. It's being sent out as we speak."
        });
      };
      server.sayGoingToSendTo = function(customerPhone, twilioPhone, numberOfSubscribers) {
        server.text({
          from: twilioPhone,
          to: customerPhone,
          body: "Ok. Now sending to your " + numberOfSubscribers + " subscribers."
        });
        server.getBusinessName(twilioPhone);
        return andThen(function(businessName) {
          console.log("trying to tell kyle a text was sent");
          return server.text({
            from: twilioPhone,
            to: "+14803813855",
            body: "" + businessName + " sent a text to " + numberOfSubscribers + " people."
          });
        });
      };
      server.sendResultsOfSpecial = function(customerPhone, twilioPhone, sendInfo) {
        var body;
        body = "Your special was sent to " + sendInfo.tried + " People.";
        server.text({
          from: twilioPhone,
          to: customerPhone,
          body: body
        });
        server.getBusinessName(twilioPhone);
        return andThen(function(businessName) {
          console.log("trying to tell kyle a text was sent");
          return server.text({
            from: twilioPhone,
            to: "+14803813855",
            body: "" + businessName + " sent a text to " + sendInfo.tried + " people."
          });
        });
      };
      server.sendToThisPerson = function(sendInfo, twilioPhone, special, person) {
        console.log("trying to send special to " + person);
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
      poolCount = 0;
      incPoolCount = function() {
        poolCount += 1;
        if (poolCount >= poolOfCallsToAction.length) return poolCount = 0;
      };
      getNextCallToAction = function() {
        var ret;
        ret = poolOfCallsToAction[poolCount];
        incPoolCount();
        return ret;
      };
      poolOfCallsToAction = ["Your customers are waiting :)", "Go for it!", "If you send it they will come.", "All it takes is a text.", "Give a little. Get a little.", "The customers are listening", "They will love you", "Isn't it about time?", "So easy, a caveman can do it.", "Just send it.", "Text on.", "Gotta love it.", "Hip hip hooray!", "It won't hurt", "Everybody's doing it", "You are smart", "Get creative!", "It's worth its weight in gold", "If you don't, who will?", "They're counting on you.", "It will be fun.", "On your mark, get set, go!", "May the force be with you."];
      cronJob = cron.CronJob;
      cronJob("00 30 " + (11 + 7) + " * * 6", function() {
        return server.text({
          from: server.mobileminNumber,
          to: "+14803813855",
          body: "reply with \"remind\" to remind everybody to text"
        });
      });
      server.updateUsersWithProgress = function() {
        var businessName, callToAction, query;
        query = mysqlClient.query("select * from customers");
        twilioPhone = null;
        customerPhone = null;
        businessName = null;
        callToAction = getNextCallToAction();
        return query.on("row", function(customer) {
          return (function(twilioPhone, customerPhone, businessName) {
            twilioPhone = customer.mobilemin_phone;
            customerPhone = customer.customer_phone;
            businessName = customer.business_name;
            console.log(" " + twilioPhone + " : " + customerPhone);
            return mysqlClient.query("select count(*) as `subscriber_count` from subscribers\nwhere customer_phone = ? and active = 1 ", [twilioPhone], function(err, result) {
              return (function(twilioPhone, customerPhone, businessName) {
                var body, count, extra, subWord;
                console.log("got a count");
                if (!result.length) return;
                result = result[0];
                count = result.subscriber_count;
                body = null;
                extra = "";
                if (count === 0) {
                  body = "You do not have any subscribers. Your customers subscribe by texting \"join\" to " + twilioPhone + ".\n-Kyle 480-381-3855";
                } else {
                  if (count === 1) {
                    subWord = "subscriber";
                  } else {
                    subWord = "subscribers";
                  }
                  body = "Congrats! You have " + count + " " + subWord + "!\nRespond with a special anytime and it will be sent out to your " + subWord + ".\n" + callToAction + " \n-Kyle 480-381-3855";
                }
                if (customerPhone !== "+14803813855") {
                  return server.text({
                    to: customerPhone,
                    from: twilioPhone,
                    body: body
                  });
                }
              })(twilioPhone, customerPhone, businessName);
            });
          })(twilioPhone, customerPhone, businessName);
        });
      };
      server.getAllSubscribers = function(twilioPhone) {
        var query;
        query = mysqlClient.query("select phone_number from subscribers where \n  customer_phone = ? and active = 1", [twilioPhone]);
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
      setRamStatus = function(from, to, prop, value) {
        var key;
        key = from + to;
        ramStati[key] || (ramStati[key] = {});
        return ramStati[key][prop] = value;
      };
      getRamStatus = function(from, to, prop) {
        var key;
        key = from + to;
        ramStati[key] || (ramStati[key] = {});
        return ramStati[key][prop];
      };
      removeIncomingTextHold = function(from, to) {
        return setRamStatus(from, to, "hold", false);
      };
      createTextHold = function(from, to) {
        return setRamStatus(from, to, "hold", true);
      };
      releaseTextHold = function(from, to) {
        return setRamStatus(from, to, "hold", false);
      };
      isTextHold = function(from, to) {
        return getRamStatus(from, to, "hold");
      };
      server.onSpecial = function(text) {
        if (text.body === "#") return server.onStats(text);
        if (like(text.body, "join")) {
          return onJoinTextChange(text);
        } else if (otherOnSpecial(text.from, text.to, text.body)) {
          return;
        }
        server.getBusinessName(text.to);
        return andThen(continueSpecialProcess.bind(null, text));
      };
      onJoinTextChange = function(text) {
        askThemWhatTheirNewJoinTextShouldSay(text);
        return andThen(setStatus, text.from, text.to, "waiting for join text");
      };
      onGotJoinText = function(text) {
        if (text.body > 160) {
          sayJoinTextIsTooLong(text);
          return;
        }
        setJoinText(text.to, text.body);
        respondWithJoinText(text);
        return andThen(sayJoinTextWasUpdatedAndWaitForSpecial, text);
      };
      respondWithJoinText = function(text) {
        return server.text({
          from: text.to,
          to: text.from,
          body: text.body
        });
      };
      sayJoinTextWasUpdatedAndWaitForSpecial = function(text) {
        server.text({
          to: text.from,
          from: text.to,
          body: "Your join text was updated."
        });
        return setStatus(text.from, text.to, "waiting for special");
      };
      sayJoinTextIsTooLong = function(text) {
        return server.text({
          from: text.to,
          to: text.from,
          body: "That join text is too long. Trim it down a bit."
        });
      };
      askThemWhatTheirNewJoinTextShouldSay = function(text) {
        return server.text({
          from: text.to,
          to: text.from,
          body: "How would you like it to respond when somebody joins?"
        });
      };
      continueSpecialProcess = function(text, businessName) {
        var originalBody, replyingWithSpecial, settingSpecial, signature, truncatedBody;
        originalBody = text.body;
        signature = "\n-" + businessName;
        text.body += signature;
        console.log("\nthe text body to send is\n" + text.body + "\n\n");
        if (text.body.length > 160) {
          truncatedBody = originalBody.substring(0, 160 - signature.length);
          text.body = truncatedBody + signature;
          replyWithTheSpecialToTheUser(text);
          return andThen(sayYourMessageIsTooLong, text);
        } else {
          settingSpecial = function() {
            return server.setSpecial(text.from, text.to, text.body);
          };
          replyingWithSpecial = function() {
            return replyWithTheSpecialToTheUser(text);
          };
          doAll(settingSpecial, replyingWithSpecial);
          return andThen(server.askForSpecialConfirmation, text);
        }
      };
      sayYourMessageIsTooLong = function(text) {
        var over;
        over = text.body.length - 160;
        return server.text({
          from: text.to,
          to: text.from,
          body: "Your message is too long. Trim it down and send it again."
        });
      };
      replyWithTheSpecialToTheUser = function(text) {
        return server.text({
          from: text.to,
          to: text.from,
          body: text.body
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
        var actuallyBuy, areaCode, buyError, buySuccess,
          _this = this;
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
            VoiceUrl: "http://" + config.server.hostName + ":" + config.server.port + "/phone",
            SmsUrl: "http://" + config.server.hostName + ":" + config.server.port + "/sms",
            AreaCode: areaCode,
            StatusUrl: "http://" + config.server.hostName + ":" + config.server.port + "/status"
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
        askForName = server.askForBusinessName.bind(null, customerPhone, twilioPhone);
        return drews.wait(1000, askForName);
      };
      server.onGotBusinessName = function(customerPhone, businessName) {
        server.getTwilioPhone(customerPhone);
        return andThen(handleBusinessName, customerPhone, businessName);
      };
      handleBusinessName = function(customerPhone, businessName, twilioPhone) {
        server.setBusinessName(twilioPhone, businessName);
        return andThen(server.askForBusinessPhone, customerPhone);
      };
      getStatus = function(from, to) {
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
      setJoinText = function(twilioPhone, joinText) {
        return setCustomerInfo(twilioPhone, "joinText", joinText);
      };
      getJoinText = function(twilioPhone) {
        return getCustomerInfo(twilioPhone, "joinText");
      };
      server.getSpecial = function(customerPhone, twilioPhone) {
        return getMetaInfo(customerPhone, twilioPhone, "special");
      };
      server.setBusinessName = function(twilioPhone, businessName) {
        return setCustomerInfo(twilioPhone, "businessName", businessName);
      };
      server.getBusinessName = function(twilioPhone) {
        console.log("getting businessName");
        return getCustomerInfo(twilioPhone, "businessName");
      };
      _.defer(function() {
        return setInterval(server.getBusinessName.bind(null, "4808405406"), 10000);
      });
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
        server.getTwilioPhone(customerPhone);
        return andThen(handleBusinessPhone, customerPhone, businessPhone);
      };
      handleBusinessPhone = function(customerPhone, businessPhone, twilioPhone) {
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
      server.andThen = andThen;
      return server;
    };
    return MobileminServer;
  });

}).call(this);
