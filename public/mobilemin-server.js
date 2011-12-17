
  process.on("uncaughtException", function(err) {
    console.log("there whas a hitch, but we're still up");
    return console.log(err.stack);
  });

  dModule.define("mobilemin-server", function() {
    var MobileminApp, MobileminServer, MobileminTwilio, config, drews, expressRpc, _;
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    config = dModule.require("config");
    _ = dModule.require("underscore");
    MobileminApp = dModule.require("mobilemin-app");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = {};
    MobileminServer.init = function() {
      var self, twilio;
      var _this = this;
      self = {};
      self.mobileminApp = new MobileminApp();
      self.addPlus1 = function(phone) {
        if (drews.s(phone, 0, 2) !== "+1" && phone.length === 10) {
          phone = "+1" + phone;
        } else if (drews.s(phone, 0, 1) === "1" && phone.length === 11) {
          phone = "+" + phone;
        }
        return phone;
      };
      self.phone = function() {};
      self.sms = function(req, res) {
        var sms, text, _ref, _ref2;
        text = req.body;
        res.send("ok");
        if ((_ref = self.conversations[text.To]) != null ? _ref[text.From] : void 0) {
          sms = (_ref2 = self.conversations[text.To]) != null ? _ref2[text.From] : void 0;
          sms.emit("response", text.Body, text);
        }
        if (req.body.Body.toLowerCase() === "start" && text.To === self.mobileminNumber) {
          console.log("i see we are on start");
          console.logj;
          return self.handleNewCustomerWhoTextedStart(res, text.From);
        }
      };
      self.status = function(req, res) {
        var info, sid, sms, status;
        console.log("got status");
        console.log(req.body);
        info = req.body;
        sid = info.SmsSid;
        status = info.SmsStatus;
        if (sid && self.smsSidsWaitingStatus[sid]) {
          sms = self.smsSidsWaitingStatus[sid];
          delete self.smsSidsWaitingStatus[sid];
          sms.status = status;
          if (status === "sent") {
            return sms.emit("sent");
          } else {
            sms.emit("error");
            return sms.retry();
          }
        }
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
      self.sendSms = function(from, to, body) {
        var send, sendSmsError, sendSmsSuccess, sms;
        sms = null;
        to = self.addPlus1(to);
        from = self.addPlus1(from);
        sendSmsSuccess = function(res) {
          var sid, _base;
          console.log("success sending sms");
          console.log(res);
          sid = res.sid;
          self.smsSidsWaitingStatus[sid] = sms;
          _.extend(sms, res);
          (_base = self.conversations)[from] || (_base[from] = {});
          self.conversations[from][to] = sms;
          return sms.emit("triedtosendsuccess");
        };
        sms = drews.makeEventful({});
        sms.maxRetries = 3;
        sms.retries = 0;
        sms.retry = function() {
          delete self.smsSidsWaitingStatus[sms.sid];
          if (sms.maxRetries === sms.retries) {
            return sms.emit("maxretriesreached", sms.maxRetries);
          }
          sms.retries += 1;
          return send();
        };
        send = function() {
          return twilio.twilioClient.sendSms(from, to, body, "http://mobilemin-server.drewl.us/status", sendSmsSuccess, sendSmsError);
        };
        sendSmsError = function(err) {
          console.log("there was an error sending an sms");
          console.log(err);
          return drews.wait(3000, function() {
            return sms.retry();
          });
        };
        sms.sendSmsSuccess = sendSmsSuccess;
        sms.sendSmsError = sendSmsError;
        send();
        sms.send = function(body) {
          return twilio.twilioClient.sendSms(from, to, body, "http://mobilemin-server.drewl.us/status", sendSmsSuccess, sendSmsError);
        };
        return sms;
      };
      self.handleNewCustomerWhoTextedStart = function(res, from) {
        var areaCode, buyError, buySuccess;
        var _this = this;
        console.log("we are handling a new start");
        areaCode = drews.s(from, 2, 3);
        buySuccess = function(justBoughtNumber) {
          var newPhone, smsConversation;
          newPhone = justBoughtNumber.phone_number;
          console.log("you just bought a number which was " + newPhone);
          smsConversation = self.sendSms(self.mobileminNumber, from, "Your mobilemin text number is " + justBoughtNumber.friendly_name + ". Subscribers will receive texts from that number. What is your business name?");
          console.log("you tried to ask for business name");
          smsConversation.once("response", function(businessName) {
            smsConversation.createAppCallback = function() {
              return smsConversation.send("Thank you.");
            };
            return self.mobileminApp.createApp({
              name: businessName,
              adminPhones: [from],
              firstPhone: from
            }, smsConversation.createAppCallback);
          });
          return smsConversation;
        };
        buyError = function(error) {
          return console.log("There was an error");
        };
        false && twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {
          params: {
            VoiceUrl: "http://mobilemin-server.drewl.us/phone",
            SmsUrl: "http://mobilemin-server.drewl.us/sms",
            AreaCode: areaCode,
            StatusUrl: "http://mobilemin-server.drewl.us/status"
          }
        }, buySuccess, buyError);
        true && buySuccess({
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
