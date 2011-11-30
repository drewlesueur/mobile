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
          this.getIncomingNumbers = __bind(this.getIncomingNumbers, this);
          this.updateIncomingNumber = __bind(this.updateIncomingNumber, this);
        }

        RestClient.prototype.updateIncomingNumber = function() {};

        RestClient.prototype.getIncomingNumbers = function() {};

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
    it("should set up all the phone numbers with twilio", function() {
      var callback, callbackCalled;
      spyOn(mobileminTwilio.mobileminApp, "find");
      callbackCalled = false;
      callback = function() {
        return callbackCalled = true;
      };
      mobileminTwilio.setupNumbers(callback);
      return expect(mobileminTwilio.mobileminApp.find).toHaveBeenCalledWith({}, mobileminTwilio.onGotApps);
    });
    return it("should get the twilio phone sids once it finds the apps", function() {
      var cbs, err, success, _ref, _ref2;
      spyOn(mobileminTwilio.twilioClient, "getIncomingNumbers");
      spyOn(mobileminTwilio.twilioClient, "updateIncomingNumber");
      cbs = mobileminTwilio.onGotApps(null, [
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
      expect(cbs[0]).toBeTruthy();
      _ref = cbs[0], success = _ref[0], err = _ref[1];
      expect(mobileminTwilio.twilioClient.getIncomingNumbers).toHaveBeenCalledWith({
        PhoneNumber: "+14808405406"
      }, success, err);
      expect(mobileminTwilio.twilioClient.getIncomingNumbers).toHaveBeenCalledWith({
        PhoneNumber: "+14808405407"
      }, cbs[1][0], cbs[1][1]);
      expect(mobileminTwilio.twilioClient.getIncomingNumbers).not.toHaveBeenCalledWith({
        PhoneNumber: "+1"
      }, cbs[1][0], cbs[1][1]);
      _ref2 = cbs[0][0]({
        incoming_phone_numbers: [
          {
            sid: "a fake sid"
          }
        ]
      }), success = _ref2[0], err = _ref2[1];
      return expect(mobileminTwilio.twilioClient.updateIncomingNumber).toHaveBeenCalledWith("a fake sid", {
        VoiceUrl: "http://mobilemin-server.com/phone",
        SmsUrl: "http://mobilemin-server.com/sms"
      }, success, err);
    });
  });

}).call(this);
