
  dModule.define("mobilemin-server", function() {
    var MobileminServer, MobileminTwilio, allFunc, config, drews, expressRpc, obj;
    allFunc = dModule.require("all-func");
    obj = allFunc("object");
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    config = dModule.require("config");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = obj();
    MobileminServer("init", function() {
      var self, twilio;
      var _this = this;
      self = obj();
      self("mobileminNumber", "+14804673355");
      self("expressApp", expressRpc("/rpc", {}));
      self("expressApp").post("/phone", this.phone);
      self("expressApp").post("/sms", this.sms);
      self("twilio", new MobileminTwilio(config.ACCOUNT_SID, config.AUTH_TOKEN));
      twilio = self("twilio");
      self("start", function() {
        self("expressApp").listen(8010);
        return self("twilio").setupNumbers();
      });
      self("phone", function() {});
      self("sms", function(req, res) {
        var text;
        text = req.body;
        return self("handleNewCustomerWhoTextedStart")(res, text.From);
      });
      self("handleNewCustomerWhoTextedStart", function(res, from) {
        var areaCode, buyError, buySuccess;
        var _this = this;
        areaCode = drews.s(from, 2, 3);
        buySuccess = function(newNumber) {
          var sendSmsError, sendSmsSuccess;
          sendSmsSuccess = function() {};
          sendSmsError = function() {};
          twilio.twilioClient.sendSms();
          return obj({
            0: sendSmsSuccess,
            1: sendSmsError
          });
        };
        buyError = function(error) {
          return console.log("There was an error");
        };
        twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {
          params: {
            VoiceUrl: "http://mobilemin-server.drewl.us/phone",
            SmsUrl: "http://mobilemin-server.drewl.us/sms",
            AreaCode: areaCode
          }
        }, buySuccess, buyError);
        return obj({
          0: buySuccess,
          1: buyError
        });
      });
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
    });
    return MobileminServer;
  });
