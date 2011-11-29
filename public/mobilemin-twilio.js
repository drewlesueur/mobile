(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  dModule.define("mobilemin-twilio", function() {
    var MobileMinTwilio, MobileminApp, TwilioRestClient, nimble;
    TwilioRestClient = dModule.require("twilio").RestClient;
    MobileminApp = dModule.require("mobilemin-app");
    nimble = dModule.require("nimble");
    MobileMinTwilio = (function() {

      function MobileMinTwilio(sid, authToken) {
        this.sid = sid;
        this.authToken = authToken;
        this.onGotApps = __bind(this.onGotApps, this);
        this.setupNumbers = __bind(this.setupNumbers, this);
        this.twilioClient = new TwilioRestClient(this.sid, this.authToken);
        this.mobileminApp = new MobileminApp;
      }

      MobileMinTwilio.prototype.setupNumbers = function() {
        this.mobileminApp.find({}, gotAppsCallback);
        return gotAppsCallback;
      };

      MobileMinTwilio.prototype.onGotApps = function(err, apps) {
        var cbs;
        var _this = this;
        console.log("was there an error?");
        console.log(err);
        console.log("got " + apps.length + " apps");
        cbs = [];
        nimble.each(apps, function(app, index, cb) {
          var success;
          _this.updateCallbackNumbers(app.twilioPhone, cb);
          if ((!app.twilioPhone) || (app.twilioPhone.length < 10)) return cb(null);
          success = function(resp) {
            var phoneSid, xErr, xSuccess;
            phoneSid = resp.incoming_phone_numbers[0].sid;
            xSuccess = function(data) {
              return cb(null);
            };
            xErr = function(d) {
              return cb(d);
            };
            return _this.twilioClient.updateIncomingNumber(phoneSid, {
              VoiceUrl: "http://mobilemin-server.com/phone",
              SmsUrl: "http://mobilemin-server.com/sms"
            }, xSuccess, xErr);
          };
          err = function(data) {
            console.log("error with " + app.twilioPhone);
            return cb(data);
          };
          cbs.push(cb);
          return _this.twilioClient.getIncomingNumbers({
            PhoneNumber: "+1" + app.twilioPhone
          }, success, err);
        }, function() {});
        return cbs;
      };

      return MobileMinTwilio;

    })();
    return MobileMinTwilio;
  });

}).call(this);
