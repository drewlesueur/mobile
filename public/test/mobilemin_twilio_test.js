(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  describe("MobileminTwilio", function() {
    var MobileminApp, MobileminTwilio, TwilioRestClient, authToken, mobileminTwilio, sid;
    define("twilio", function() {
      var RestClient;
      RestClient = (function() {

        function RestClient(sid, authToken) {
          this.sid = sid;
          this.authToken = authToken;
          this.updateIncomingNumber = __bind(this.updateIncomingNumber, this);
        }

        RestClient.prototype.updateIncomingNumber = function() {};

        return RestClient;

      })();
      return {
        RestClient: RestClient
      };
    });
    TwilioRestClient = require("twilio").RestClient;
    MobileminApp = require("mobilemin-app");
    MobileminTwilio = require("mobilemin-twilio");
    mobileminTwilio = null;
    sid = "sid";
    authToken = "auth-token";
    beforeEach(function() {
      return mobileminTwilio = new MobileminTwilio(sid, authToken);
    });
    it("should be there", function() {
      return expect(mobileminTwilio).toBeTruthy();
    });
    it("should have access to Twilio!", function() {
      expect(mobileminTwilio.twilioClient.constructor).toBe(TwilioRestClient);
      expect(mobileminTwilio.sid).toBe("sid");
      expect(mobileminTwilio.authToken).toBe("auth-token");
      expect(mobileminTwilio.twilioClient.sid).toBe("sid");
      return expect(mobileminTwilio.twilioClient.authToken).toBe("auth-token");
    });
    it("should have access to mobilemin database", function() {
      return expect(mobileminTwilio.mobileminApp.constructor).toBe(MobileminApp);
    });
    return it("should setup all the phone numbers with twilio", function() {
      var callback, callbackCalled, cbs, gotAppsCallback;
      spyOn(mobileminTwilio.mobileminApp, "find");
      callbackCalled = false;
      callback = function() {
        return callbackCalled = true;
      };
      gotAppsCallback = mobileminTwilio.setupNumbers(callback);
      expect(mobileminTwilio.mobileminApp.find).toHaveBeenCalledWith({}, gotAppsCallback);
      expect(_.isFunction(gotAppsCallback)).toBeTruthy();
      spyOn(mobileminTwilio.twilioClient, "updateIncomingNumber");
      cbs = gotAppsCallback(null, [
        {
          twilioPhone: "4808405406"
        }, {
          twilioPhone: "4808405407"
        }, {
          twilioPhone: ""
        }, {
          twilioPhone: "1"
        }
      ]);
      expect(mobileminTwilio.twilioClient.updateIncomingNumber).toHaveBeenCalledWith(sid, {
        PhoneNumber: "4808405406",
        VoiceUrl: "http://mobilemin-server.com/phone",
        SmsUrl: "http://mobilemin-server.com/sms"
      }, cbs[0]);
      return expect(mobileminTwilio.twilioClient.updateIncomingNumber).toHaveBeenCalledWith(sid, {
        PhoneNumber: "4808405407",
        VoiceUrl: "http://mobilemin-server.com/phone",
        SmsUrl: "http://mobilemin-server.com/sms"
      }, cbs[1]);
    });
  });

}).call(this);
