
  dModule.define("mobilemin-server", function() {
    var MobileminServer, MobileminTwilio, config, drews, expressRpc, _;
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    config = dModule.require("config");
    _ = dModule.require("underscore");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = {};
    MobileminServer.init = function() {
      var self, twilio;
      var _this = this;
      self = {};
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
        if ((_ref = self.conversations[text.To]) != null ? _ref[text.From] : void 0) {
          sms = (_ref2 = self.conversations[text.To]) != null ? _ref2[text.From] : void 0;
          sms.emit("response", text.Body, text);
        }
        if (req.body.Body.toLowerCase() === "start") {
          return self.handleNewCustomerWhoTextedStart(res, text.From);
        }
      };
      self.status = function(req, res) {
        var info, sid, sms, status;
        info = req.body;
        sid = info.SmsSid;
        status = info.SmsStatus;
        if (sid && self.smsSidsWaitingStatus[sid]) {
          sms = self.smsSidsWaitingStatus[sid];
          sms.status = status;
          return sms.emit("sent");
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
          sid = res.sid;
          self.smsSidsWaitingStatus[sid] = sms;
          _.extend(sms, res);
          (_base = self.conversations)[from] || (_base[from] = {});
          self.conversations[from][to] = sms;
          return sms.emit("triedtosendsuccess");
        };
        send = function() {
          return twilio.twilioClient.sendSms(from, to, body, "http://mobilemin-server.drewl.us/status", sendSmsSuccess, sendSmsError);
        };
        sendSmsError = function() {
          return drews.wait(3000, function() {
            return send();
          });
        };
        sms = drews.makeEventful({});
        sms.sendSmsSuccess = sendSmsSuccess;
        sms.sendSmsError = sendSmsError;
        send();
        return sms;
      };
      self.handleNewCustomerWhoTextedStart = function(res, from) {
        var areaCode, buyError, buySuccess;
        var _this = this;
        areaCode = drews.s(from, 2, 3);
        buySuccess = function(newNumber) {
          var sendSmsError, sendSmsSuccess;
          sendSmsSuccess = function() {};
          sendSmsError = function() {};
          twilio.twilioClient.sendSms(self.mobileminNumber, newNumber.phone_number, "Your mobilemin text number is " + newNumber.friendly_name + ". Subscribers will receive texts from that number. Text 'help' for more info and to manage your account.", null, sendSmsSuccess, sendSmsError);
          return [sendSmsSuccess, sendSmsError];
        };
        buyError = function(error) {
          return console.log("There was an error");
        };
        twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {
          params: {
            VoiceUrl: "http://mobilemin-server.drewl.us/phone",
            SmsUrl: "http://mobilemin-server.drewl.us/sms",
            AreaCode: areaCode,
            StatusUrl: "http://mobilemin-server.drewl.us/status"
          }
        }, buySuccess, buyError);
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
