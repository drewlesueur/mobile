
  describe("MobileMinServer", function() {
    var FakeMobileminTwilio, FakeTwilioClient, MobileminServer, RealMobileMinTwilio, allFunc, config, expressPost, expressRpcAppListen, expressRpcInit, expressRpcObj, fakeIncomingStartText, fakeIncomingText, getAvailableLocalNumbersSpy, isEqual, notFakeIncomingStartText, obj, server, setupNumbersSpy;
    allFunc = dModule.require("all-func");
    obj = allFunc("object");
    isEqual = allFunc("isEqual");
    notFakeIncomingStartText = {
      Body: 'start',
      To: '+14804208755',
      From: '+14808405406'
    };
    fakeIncomingStartText = {
      Body: 'start',
      To: '+14804208755',
      From: '+14808405406'
    };
    fakeIncomingText = {
      AccountSid: 'ACa7ba1183dd4f2853f8af6043299bf892',
      Body: 'test me',
      ToZip: '85034',
      FromState: 'AZ',
      ToCity: 'PHOENIX',
      SmsSid: 'SMdbbf2ba79040b393c42878d01268e0fe',
      ToState: 'AZ',
      To: '+14804208755',
      ToCountry: 'US',
      FromCountry: 'US',
      SmsMessageSid: 'SMdbbf2ba79040b393c42878d01268e0fe',
      ApiVersion: '2010-04-01',
      FromCity: 'PHOENIX',
      SmsStatus: 'received',
      From: '+14808405406',
      FromZip: '85256'
    };
    expressRpcAppListen = jasmine.createSpy();
    expressPost = jasmine.createSpy();
    expressRpcObj = {
      listen: expressRpcAppListen,
      post: expressPost
    };
    expressRpcInit = jasmine.createSpy().andReturn(expressRpcObj);
    dModule.define("express-rpc", function() {
      return expressRpcInit;
    });
    dModule.define("config", function() {
      return {
        ACCOUNT_SID: 'sid',
        AUTH_TOKEN: 'authToken'
      };
    });
    config = dModule.require("config");
    RealMobileMinTwilio = dModule.require("mobilemin-twilio");
    getAvailableLocalNumbersSpy = jasmine.createSpy();
    FakeTwilioClient = (function() {

      function FakeTwilioClient(sid, authToken) {
        this.sid = sid;
        this.authToken = authToken;
      }

      FakeTwilioClient.prototype.getAvailableLocalNumbers = getAvailableLocalNumbersSpy;

      return FakeTwilioClient;

    })();
    setupNumbersSpy = jasmine.createSpy();
    FakeMobileminTwilio = (function() {

      function FakeMobileminTwilio(sid, authToken) {
        this.sid = sid;
        this.authToken = authToken;
        this.twilioClient = new FakeTwilioClient(this.sid, this.authToken);
      }

      FakeMobileminTwilio.prototype.setupNumbers = setupNumbersSpy;

      return FakeMobileminTwilio;

    })();
    dModule.define("mobilemin-twilio", function() {
      return FakeMobileminTwilio;
    });
    MobileminServer = dModule.require("mobilemin-server");
    server = null;
    beforeEach(function() {
      return server = MobileminServer("init")();
    });
    it("should have an express rpc", function() {
      expect(expressRpcInit).toHaveBeenCalledWith("/rpc", {});
      expect(server("expressApp")).toBe(expressRpcObj);
      expect((server("expressApp")).post).toHaveBeenCalledWith("/phone", server.phone);
      return expect((server("expressApp")).post).toHaveBeenCalledWith("/sms", server.sms);
    });
    it("should have a mobileminTwilio", function() {
      expect(server("twilio").constructor).toBe(FakeMobileminTwilio);
      expect(server("twilio").sid).toBe(config.ACCOUNT_SID);
      return expect(server("twilio").authToken).toBe(config.AUTH_TOKEN);
    });
    it("should start", function() {
      server("start")();
      expect(server("expressApp").listen).toHaveBeenCalledWith(8010);
      return expect(server("twilio").setupNumbers).toHaveBeenCalled();
    });
    it("should know when to start handling a new customer", function() {
      var arg, expectedArg, fakeReq, fakeRes;
      arg = null;
      server("handleNewCustomerWhoTextedStart", function(res, _arg) {
        return arg = _arg;
      });
      fakeReq = {
        body: fakeIncomingStartText
      };
      fakeRes = {
        send: function() {}
      };
      server("sms")(fakeReq, fakeRes);
      expectedArg = "+14808405406";
      return expect(arg).toBe(expectedArg);
    });
    it("should know how to handle a new customer who texted start", function() {
      var cb, fakeRes;
      fakeRes = {
        send: function() {}
      };
      cb = server("handleNewCustomerWhoTextedStart")(fakeRes, "+14808405406");
      return expect(getAvailableLocalNumbersSpy).toHaveBeenCalledWith("US", {
        "AreaCode": "480"
      });
    });
    return dModule.define("mobilemin-twilio", RealMobileMinTwilio);
  });
