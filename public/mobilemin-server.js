(function() {
  var addPlus1, drews;

  if (typeof process !== "undefined" && process !== null) {
    process.on("uncaughtException", function(err) {
      console.log("there whas a hitch, but we're still up");
      return console.log(err.stack);
    });
  }

  drews = dModule.require("drews-mixins");

  addPlus1 = function(phone) {
    if (drews.s(phone, 0, 2) !== "+1" && phone.length === 10) {
      phone = "+1" + phone;
    } else if (drews.s(phone, 0, 1) === "1" && phone.length === 11) {
      phone = "+" + phone;
    }
    return phone;
  };

  dModule.define("mobilemin-conversation", function() {
    var Conversation;
    Conversation = {};
    Conversation.init = function(from, to) {
      var sms;
      sms = drews.makeEventful({});
      sms.to = addPlus1(to);
      sms.from = addPlus1(from);
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
      sms.send = function(body) {
        sms.body = body;
        return sms.twilioClient.sendSms(sms.from, sms.to, sms.body, "http://mobilemin-server.drewl.us/status", sms.sendSmsSuccess, sms.sendSmsError);
      };
      return sms;
    };
    return Conversation;
  });

  dModule.define("mobilemin-customer", function() {
    var Conversation, Customer, MobileminApp;
    MobileminApp = dModule.require("mobilemin-app");
    Conversation = dModule.require("mobilemin-conversation");
    Customer = {};
    Customer.init = function(from, to) {
      var customer;
      customer = {};
      customer.app = MobileminApp.init();
      customer.convo = Conversation.init(from, to);
      customer._app = customer.app.app;
      customer.createApp = function(info) {
        customer.app.createApp(info);
        return customer.app.once("created", customer.onCreatedApp);
      };
      customer.onCreatedApp = function() {
        customer.convo.send("Congratulations! Your MobileMin number is " + customer._app.prettyPhone + ". Your customers text \"join\" to subscribe. What is your business name?");
        return customer.convo.once("response", customer.onBusinessName);
      };
      customer.onBusinessName = function(businessName) {
        customer.set("businessName", businessName);
        customer.app.save();
        customer.convo.send("What is your business phone number so we can forward calls?  ");
        return customer.convo.once("response", customer.onBusinessPhone);
      };
      customer.onBusinessPhone = function(businessPhone) {
        customer.set("businessPhone", businessPhone);
        customer.app.save();
        customer.convo.send("You're live! To send out a text blast, just text a special offer to " + customer._app.prettyPhone + " and all of your subscribers will get the text! ");
        return customer.convo.on("response", customer.onNormalText);
      };
      customer.get = function(key) {
        return customer.app.app[key];
      };
      customer.set = function(key, val) {
        customer.app.app[key] = val;
      };
      return customer;
    };
    return Customer;
  });

  dModule.define("mobilemin-server", function() {
    var Customer, MobileminApp, MobileminServer, MobileminTwilio, config, expressRpc, _;
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    config = dModule.require("config");
    _ = dModule.require("underscore");
    MobileminApp = dModule.require("mobilemin-app");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    Customer = dModule.require("mobilemin-customer");
    MobileminServer = {};
    MobileminServer.init = function() {
      var self, twilio;
      var _this = this;
      self = {};
      self.phone = function() {};
      self.sms = function(req, res) {
        var customer, text, _ref, _ref2;
        text = req.body;
        res.send("ok");
        if ((_ref = self.conversations[text.To]) != null ? _ref[text.From] : void 0) {
          customer = (_ref2 = self.conversations[text.To]) != null ? _ref2[text.From] : void 0;
          customer.convo.emit("response", text.Body, text);
          return;
        }
        if (req.body.Body.toLowerCase() === "start" && text.To === self.mobileminNumber) {
          console.log("i see we are on start");
          console.logj;
          return self.handleNewCustomerWhoTextedStart(res, text.From);
        }
      };
      self.status = function(req, res) {
        var customer, info, sid, status;
        console.log("got status");
        console.log(req.body);
        info = req.body;
        sid = info.SmsSid;
        status = info.SmsStatus;
        if (sid && self.smsSidsWaitingStatus[sid]) {
          customer = self.smsSidsWaitingStatus[sid];
          delete self.smsSidsWaitingStatus[sid];
          customer.convo.status = status;
          if (status === "sent") {
            customer.convo.emit("sent");
          } else {
            customer.convo.emit("error");
            customer.convo.retry();
          }
        }
        return res.send("ok");
      };
      self.mobileminNumber = "+14804673355";
      self.expressApp = expressRpc("/rpc", {});
      self.expressApp.post("/phone", self.phone);
      self.expressApp.post("/sms", self.sms);
      self.expressApp.post("/status", self.status);
      self.twilio = new MobileminTwilio(config.ACCOUNT_SID, config.AUTH_TOKEN);
      self.smsSidsWaitingStatus = {};
      self.conversations = {};
      twilio = self.twilio;
      self.start = function() {
        return self.expressApp.listen(8010);
      };
      self.createConversation = function(from, to) {};
      self.sendSms = function(from, to, body) {
        var sms;
        sms = self.createConversation(from, to);
        return sms.send(body);
      };
      self.sendFirstResponse = function(conversation) {
        conversation.send("Congratulations! Your MobileMin number is (480) 444-1223. Your customers text \"join\" to subscribe. What is your business name?");
        return conversation.once("response", function(businessName) {
          return smsConversation.createAppCallback = function() {
            return smsConversation.send("Thank you.");
          };
        });
      };
      self.onNewCustomerAppCreated = function() {
        var smsConversation;
        smsConversation = self.createConversation(self.mobileminNumber, from);
        return console.log("you tried to ask for business name");
      };
      self.onTriedToSendSuccess = function(convo) {
        var sid;
        sid = convo.sid;
        return self.smsSidsWaitingStatus[sid] = convo;
      };
      self.setUpConvo = function(convo) {
        var _base, _name;
        convo.on("triedtosendsuccess", _.bind(self.onTriedToSendSuccess, null, customer));
        (_base = self.conversations)[_name = convo.from] || (_base[_name] = {});
        return self.conversations[convo.from][convo.to] = customer;
      };
      self.handleNewCustomerWhoTextedStart = function(res, from) {
        var actuallyBuy, areaCode, buyError, buySuccess;
        var _this = this;
        console.log("we are handling a new start");
        areaCode = drews.s(from, 2, 3);
        buySuccess = function(justBoughtNumber) {
          var customer, newPhone;
          newPhone = justBoughtNumber.phone_number;
          console.log("you just bought a number which was " + newPhone);
          customer = Customer.init(self.mobileminNumber, from);
          self.setUpCustomer(customer);
          customer.createApp({
            adminPhones: [from],
            firstPhone: from,
            twilioPhone: newPhone,
            prettyPhone: justBoughtNumber.friendly_name
          });
          return customer;
        };
        buyError = function(error) {
          return console.log("There was an error");
        };
        actuallyBuy = true;
        actuallyBuy && twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {
          params: {
            VoiceUrl: "http://mobilemin-server.drewl.us/phone",
            SmsUrl: "http://mobilemin-server.drewl.us/sms",
            AreaCode: areaCode,
            StatusUrl: "http://mobilemin-server.drewl.us/status"
          }
        }, buySuccess, buyError);
        actuallyBuy || buySuccess({
          friendly_name: '(480) 428-2578',
          phone_number: '+14804282578'
        });
        return [buySuccess, buyError];
      };
      ({
        __getAvailableNumbers: function() {
          var error, success;
          success = function(response) {
            var firstPhone;
            firstPhone = response.available_phone_numbers[0].phone_number;
            console.log("going to buy " + firstPhone);
            return false && twilio.twilioClient.provisionIncomingNumber(firstPhone, {
              VoiceUrl: "http://mobilemin-server.drewl.us/phone",
              SmsUrl: "http://mobilemin-server.drewl.us/sms"
            });
          };
          error = function() {};
          twilio.twilioClient.getAvailableLocalNumbers("US", {
            AreaCode: drews.s(from, 2, 3)
          }, success, error);
          return [success, error];
        }
      });
      return self;
    };
    return MobileminServer;
  });

}).call(this);
