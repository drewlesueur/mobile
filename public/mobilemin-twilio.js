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
        this.getPhoneNumberSidsForUpdating = __bind(this.getPhoneNumberSidsForUpdating, this);
        this.updateCallbackNumbers = __bind(this.updateCallbackNumbers, this);
        this.onGotApps = __bind(this.onGotApps, this);
        this.setupNumbers = __bind(this.setupNumbers, this);
        this.twilioClient = new TwilioRestClient(this.sid, this.authToken);
        this.mobileminApp = new MobileminApp;
      }

      MobileMinTwilio.prototype.setupNumbers = function() {
        this.mobileminApp.find({}, this.onGotApps);
        return this.onGotApps;
      };

      MobileMinTwilio.prototype.onGotApps = function(err, apps) {
        var cbs;
        var _this = this;
        cbs = [];
        nimble.each(apps, function(app, index, arr, cb) {
          return cbs.push(_this.getPhoneNumberSidsForUpdating(app.twilioPhone, cb));
        });
        return cbs;
      };

      MobileMinTwilio.prototype.updateCallbackNumbers = function(cb) {};

      MobileMinTwilio.prototype.getPhoneNumberSidsForUpdating = function(twilioPhone, cb) {
        var err, success;
        var _this = this;
        if (cb == null) cb = function() {};
        if ((!twilioPhone) || (twilioPhone.length < 10)) return cb(null);
        success = function(resp) {
          var phoneSid, xErr, xSuccess;
          phoneSid = resp.incoming_phone_numbers[0].sid;
          xSuccess = function(data) {
            console.log("updated " + twilioPhone);
            return cb(null);
          };
          xErr = function(d) {
            return cb(d);
          };
          _this.twilioClient.updateIncomingNumber(phoneSid, {
            VoiceUrl: "http://mobilemin-server.drewl.us/phone",
            SmsUrl: "http://mobilemin-server.drewl.us/sms"
          }, xSuccess, xErr);
          return [xSuccess, xErr];
        };
        err = function(data) {
          return cb(data);
        };
        this.twilioClient.getIncomingNumbers({
          PhoneNumber: "+1" + twilioPhone
        }, success, err);
        return [success, err];
      };

      return MobileMinTwilio;

    })();
    return MobileMinTwilio;
  });

}).call(this);
