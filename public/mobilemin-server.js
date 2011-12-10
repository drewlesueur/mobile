
  dModule.define("mobilemin-server", function() {
    var MobileminServer, MobileminTwilio, config, drews, expressRpc;
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    config = dModule.require("config");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = {};
    MobileminServer.init = function() {
      var self, twilio;
      var _this = this;
      self = {};
      self.phone = function() {};
      self.sms = function(req, res) {
        var text;
        text = req.body;
        return self.handleNewCustomerWhoTextedStart(res, text.From);
      };
      self.status = function(req, res) {
        return console.log(req.body);
      };
      self.mobileminNumber = "+14804673355";
      self.expressApp = expressRpc("/rpc", {});
      self.expressApp.post("/phone", self.phone);
      self.expressApp.post("/sms", self.sms);
      self.expressApp.post("/status", self.status);
      self.twilio = new MobileminTwilio(config.ACCOUNT_SID, config.AUTH_TOKEN);
      self.smsSidsWaitingStatus = [];
      twilio = self.twilio;
      self.start = function() {
        self.expressApp.listen(8010);
        return self.twilio.setupNumbers();
      };
      self.sendSms = function(info) {
        var body, responseCallback, sendSmsError, sendSmsSuccess, sentCallback, to, triedToSendCallback;
        to = info.to, body = info.body, triedToSendCallback = info.triedToSendCallback, sentCallback = info.sentCallback, responseCallback = info.responseCallback, sendSmsSuccess = info.sendSmsSuccess;
        sendSmsSuccess = function(res) {
          var sid;
          sid = res.SMSMessage.Sid;
          self.smsSidsWaitingStatus[sid] = res.SMSMessage;
          return triedToSendCallback(null, res);
        };
        sendSmsError = function() {};
        twilio.twilioClient.sendSms(self.mobileminNumber, to, body, null, sendSmsSuccess, sendSmsError);
        return [sendSmsSuccess, sendSmsError];
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
