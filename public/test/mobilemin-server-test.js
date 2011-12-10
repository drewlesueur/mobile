
  describe("MobileMinServer", function() {
    var FakeMobileminTwilio, FakeTwilioClient, MobileminServer, RealMobileMinTwilio, allFunc, apiCallSpy, config, expressPost, expressRpcAppListen, expressRpcInit, expressRpcObj, fakeIncomingStartText, fakeIncomingText, getAvailableLocalNumbersSpy, isEqual, justBoughtNumber, notFakeIncomingStartText, obj, provisionIncomingNumberSpy, sendSmsSpy, server, setupNumbersSpy;
    allFunc = dModule.require("all-func");
    obj = allFunc("object");
    isEqual = allFunc("isEqual");
    justBoughtNumber = {
      sid: 'PN139f6f56936749f585ae9ab952682e98',
      account_sid: 'fake sid',
      friendly_name: '(480) 428-2578',
      phone_number: '+14804282578',
      voice_url: 'http://mobilemin-server.drewl.us/phone',
      voice_method: 'POST',
      voice_fallback_url: '',
      voice_fallback_method: 'POST',
      voice_caller_id_lookup: false,
      date_created: 'Tue, 06 Dec 2011 00:03:10 +0000',
      date_updated: 'Tue, 06 Dec 2011 00:03:10 +0000',
      sms_url: 'http://mobilemin-server.drewl.us/sms',
      sms_method: 'POST',
      sms_fallback_url: '',
      sms_fallback_method: 'POST',
      capabilities: {
        voice: true,
        sms: true
      },
      status_callback: '',
      status_callback_method: 'POST',
      api_version: '2010-04-01',
      voice_application_sid: '',
      sms_application_sid: '',
      uri: '/2010-04-01/Accounts/fakesid/IncomingPhoneNumbers/PN139f6f56936749f585ae9ab952682e98.json'
    };
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
    apiCallSpy = jasmine.createSpy();
    provisionIncomingNumberSpy = jasmine.createSpy();
    sendSmsSpy = jasmine.createSpy();
    FakeTwilioClient = (function() {

      function FakeTwilioClient(sid, authToken) {
        this.sid = sid;
        this.authToken = authToken;
      }

      FakeTwilioClient.prototype.getAvailableLocalNumbers = getAvailableLocalNumbersSpy;

      FakeTwilioClient.prototype.apiCall = apiCallSpy;

      FakeTwilioClient.prototype.provisionIncomingNumber = provisionIncomingNumberSpy;

      FakeTwilioClient.prototype.sendSms = sendSmsSpy;

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
      return server = MobileminServer.init();
    });
    it("should have an express rpc", function() {
      expect(expressRpcInit).toHaveBeenCalledWith("/rpc", {});
      expect(server.expressApp).toBe(expressRpcObj);
      expect(server.expressApp.post).toHaveBeenCalledWith("/phone", server.phone);
      expect(server.expressApp.post).toHaveBeenCalledWith("/sms", server.sms);
      return expect(server.expressApp.post).toHaveBeenCalledWith("/status", server.status);
    });
    it("should have a mobileminTwilio", function() {
      expect(server.twilio.constructor).toBe(FakeMobileminTwilio);
      expect(server.twilio.sid).toBe(config.ACCOUNT_SID);
      return expect(server.twilio.authToken).toBe(config.AUTH_TOKEN);
    });
    it("should start", function() {
      server.start();
      expect(server.expressApp.listen).toHaveBeenCalledWith(8010);
      return expect(server.twilio.setupNumbers).toHaveBeenCalled();
    });
    it("should know when to start handling a new customer", function() {
      var arg, expectedArg, fakeReq, fakeRes;
      arg = null;
      server.handleNewCustomerWhoTextedStart = function(res, _arg) {
        return arg = _arg;
      };
      fakeReq = {
        body: fakeIncomingStartText
      };
      fakeRes = {
        send: function() {}
      };
      server.sms(fakeReq, fakeRes);
      expectedArg = "+14808405406";
      return expect(arg).toBe(expectedArg);
    });
    it("should know what to do with a status url", function() {});
    describe("should be able to send a text message from mobilemin", function() {
      var responseCallback, sendSmsError, sendSmsSuccess, sentCallback, triedToSendCallback;
      triedToSendCallback = null;
      sentCallback = null;
      responseCallback = null;
      sendSmsSuccess = null;
      sendSmsError = null;
      beforeEach(function() {
        var fakeTriedToSendResponse, sendSmsCallbacks;
        triedToSendCallback = jasmine.createSpy();
        sentCallback = jasmine.createSpy();
        responseCallback = jasmine.createSpy();
        fakeTriedToSendResponse = {
          sid: "fake sid"
        };
        sendSmsCallbacks = server.sendSms({
          to: "4808405406",
          body: "testing",
          triedToSendCallback: triedToSendCallback,
          sentCallback: sentCallback,
          responseCallback: responseCallback
        });
        return sendSmsSuccess = sendSmsCallbacks[0], sendSmsError = sendSmsCallbacks[1], sendSmsCallbacks;
      });
      it("should have called the twilio clietn sms", function() {
        return expect(sendSmsSpy).toHaveBeenCalledWith(server.mobileminNumber, "4808405406", "testing", "http://mobilemin-server.drewl.us/status", sendSmsSuccess, sendSmsError);
      });
      return it("should handle the sms response", function() {
        var fakeGoodStatusResponse, fakeRequest, fakeResponse, fakeSendSmsResponse;
        fakeSendSmsResponse = {
          sid: "fake sid",
          status: "queued"
        };
        sendSmsSuccess(fakeSendSmsResponse);
        expect(triedToSendCallback).toHaveBeenCalledWith(null, fakeSendSmsResponse);
        expect(server.smsSidsWaitingStatus["fake sid"]).toEqual(fakeSendSmsResponse);
        fakeGoodStatusResponse = {
          SmsStatus: "sent",
          SmsSid: ["fake sid"]
        };
        fakeRequest = {
          body: fakeGoodStatusResponse
        };
        fakeResponse = {};
        server.status(fakeRequest, fakeResponse);
        return expect(server.smsSidsWaitingStatus["fake sid"].status).toEqual("sent");
      });
    });
    it("should know how to handle a new customer who texted start", function() {
      var buyCallbacks, buyError, buySuccess, fakeRes, sendFeedbackCallbacks, sendFeedbackError, sendFeedbackSuccess;
      fakeRes = {
        send: function() {}
      };
      buyCallbacks = server.handleNewCustomerWhoTextedStart(fakeRes, "+14808405406");
      buySuccess = buyCallbacks[0];
      buyError = buyCallbacks[1];
      console.log(buySuccess);
      expect(apiCallSpy).toHaveBeenCalledWith("POST", "/IncomingPhoneNumbers", {
        params: {
          VoiceUrl: "http://mobilemin-server.drewl.us/phone",
          SmsUrl: "http://mobilemin-server.drewl.us/sms",
          AreaCode: "480",
          StatusUrl: "http://mobilemin-server.drewl.us/status"
        }
      }, buySuccess, buyError);
      sendFeedbackCallbacks = buySuccess(justBoughtNumber);
      sendFeedbackSuccess = sendFeedbackCallbacks[0];
      sendFeedbackError = sendFeedbackCallbacks[1];
      return expect(sendSmsSpy).toHaveBeenCalledWith(server.mobileminNumber, justBoughtNumber.phone_number, "Your mobilemin text number is " + justBoughtNumber.friendly_name + ". Subscribers will receive texts from that number. Text 'help' for more info and to manage your account.", null, sendFeedbackSuccess, sendFeedbackError);
    });
    return dModule.define("mobilemin-twilio", RealMobileMinTwilio);
  });
