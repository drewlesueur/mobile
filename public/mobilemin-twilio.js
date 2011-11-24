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
        this.setupNumbers = __bind(this.setupNumbers, this);
        this.twilioClient = new TwilioRestClient(this.sid, this.authToken);
        this.mobileminApp = new MobileminApp;
      }

      MobileMinTwilio.prototype.setupNumbers = function() {
        var gotAppsCallback;
        var _this = this;
        gotAppsCallback = function(err, apps) {
          var cbs;
          console.log("was there an error?");
          console.log(err);
          console.log("got " + apps.length + " apps");
          cbs = [];
          nimble.each(apps, function(app, index, cb) {
            cbs.push(cb);
            return _this.twilioClient.updateIncomingNumber(_this.twilioClient.sid, {
              PhoneNumber: app.twilioPhone,
              VoiceUrl: "http://mobilemin-server.com/phone",
              SmsUrl: "http://mobilemin-server.com/sms"
            }, cb);
          }, function() {});
          return cbs;
        };
        this.mobileminApp.find({}, gotAppsCallback);
        return gotAppsCallback;
      };

      return MobileMinTwilio;

    })();
    return MobileMinTwilio;
  });

}).call(this);
