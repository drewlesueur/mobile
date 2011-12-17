(function() {
  var drews, fakeBadStatusRequest, fakeGoodStatusRequest, fakeIncomingStartText, fakeIncomingText, fakeIncomingTextRequest, fakeSendSmsResponse, justBoughtNumber, notFakeIncomingStartText, notFakeIncomingStartText2;
  var __slice = Array.prototype.slice;

  drews = dModule.require("drews-mixins");

  fakeSendSmsResponse = {
    sid: "fake sid",
    status: "queued"
  };

  fakeGoodStatusRequest = {
    body: {
      AccountSid: 'fake account sid',
      SmsStatus: 'sent',
      Body: 'testing2',
      SmsSid: 'fake sid',
      To: '+14808405406',
      From: '+14804673355',
      ApiVersion: '2010-04-01'
    }
  };

  fakeBadStatusRequest = {
    body: {
      AccountSid: 'fake account sid',
      SmsStatus: 'error',
      Body: 'testing2',
      SmsSid: 'fake sid',
      To: '+14808405406',
      From: '+14804673355',
      ApiVersion: '2010-04-01'
    }
  };

  fakeIncomingTextRequest = {
    body: fakeIncomingText
  };

  fakeIncomingText = {
    AccountSid: 'fake account sid',
    Body: 'what?',
    ToZip: '85210',
    FromState: 'AZ',
    ToCity: 'PHOENIX',
    SmsSid: 'SMa587315830214927a2375d610ef8d438',
    ToState: 'AZ',
    To: '+14804673355',
    ToCountry: 'US',
    FromCountry: 'US',
    SmsMessageSid: 'SMa587315830214927a2375d610ef8d438',
    ApiVersion: '2010-04-01',
    FromCity: 'PHOENIX',
    SmsStatus: 'received',
    From: '+14808405406',
    FromZip: '85256'
  };

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
    Body: 'not start',
    To: '+14804208755',
    From: '+14808405406'
  };

  notFakeIncomingStartText2 = {
    Body: 'not start',
    To: '+14804208755',
    From: '+14808405406'
  };

  fakeIncomingStartText = {
    Body: 'start',
    To: "+14804673355",
    From: '+14808405406'
  };

  describe("Customer", function() {
    var Conversation, Customer, MobileminApp, customer;
    MobileminApp = dModule.require("mobilemin-app");
    Conversation = dModule.require("mobilemin-conversation");
    Customer = dModule.require("mobilemin-customer");
    customer = null;
    beforeEach(function() {
      return customer = Customer.init("14804673355", "4808405406");
    });
    it("should have a conversation and a mobileminapp", function() {
      spyOn(MobileminApp, "init").andReturn("fake mm app");
      spyOn(Conversation, "init").andReturn("fake convo");
      customer = Customer.init("14804673355", "4808405406");
      expect(customer.app).toBe("fake mm app");
      expect(customer.convo).toBe("fake convo");
      return expect(customer._app).toBe(customer.app.app);
    });
    it("should create an app", function() {
      console.log(customer);
      spyOn(customer.app, "createApp");
      spyOn(customer.app, "once");
      customer.createApp("fake info");
      expect(customer.app.createApp).toHaveBeenCalledWith("fake info");
      return expect(customer.app.once).toHaveBeenCalledWith("created", customer.onCreatedApp);
    });
    it("should set and get", function() {
      customer.set("something", 1);
      customer.app.app.something;
      expect(customer.app.app.something).toBe(1);
      return expect(customer.get("something")).toBe(1);
    });
    it("should know what to do once a new app is created", function() {
      spyOn(customer.convo, "send");
      spyOn(customer.convo, "once");
      customer._app.prettyPhone = ":)";
      customer.onCreatedApp();
      expect(customer.convo.send).toHaveBeenCalledWith("Congratulations! Your MobileMin number is " + customer._app.prettyPhone + ". Your customers text \"join\" to subscribe. What is your business name?");
      return expect(customer.convo.once).toHaveBeenCalledWith("response", customer.onBusinessName);
    });
    return it("should know what to do when it gets a business name", function() {
      spyOn(customer, "set");
      spyOn(customer.app, "save");
      spyOn(customer.convo, "send");
      spyOn(customer.convo, "once");
      customer.onBusinessName("YK");
      expect(customer.set).toHaveBeenCalledWith("businessName", "YK");
      expect(customer.app.save).toHaveBeenCalled();
      expect(customer.convo.send).toHaveBeenCalledWith("What is your business phone number so we can forward calls?  ");
      return expect(customer.convo.once).toHaveBeenCalledWith("response", customer.onBusinessPhone);
    });
  });

  describe("Conversation", function() {
    var Conversation, MobileminApp, apiCallSpy, convo, getAvailableLocalNumbersSpy, provisionIncomingNumberSpy, sendSmsSpy;
    MobileminApp = dModule.require("mobilemin-app");
    Conversation = dModule.require("mobilemin-conversation");
    convo = null;
    getAvailableLocalNumbersSpy = null;
    apiCallSpy = null;
    provisionIncomingNumberSpy = null;
    sendSmsSpy = null;
    beforeEach(function() {
      return convo = Conversation.init("14804673355", "4808405406");
    });
    it("should have a from and to, retires and max retries", function() {
      console.log(convo);
      expect(convo.from).toBe("+14804673355");
      expect(convo.to).toBe("+14808405406");
      expect(convo.retries).toBe(0);
      return expect(convo.maxRetries).toBe(3);
    });
    it("should handle successful sms send", function() {
      spyOn(_, "extend");
      spyOn(convo, "emit");
      convo.sendSmsSuccess(fakeSendSmsResponse);
      expect(_.extend).toHaveBeenCalledWith(convo, fakeSendSmsResponse);
      return expect(convo.emit).toHaveBeenCalledWith("triedtosendsuccess");
    });
    it("should retry", function() {
      convo.body = "testing";
      spyOn(convo, "send");
      spyOn(convo, "emit");
      convo.retry();
      expect(convo.send).toHaveBeenCalledWith("testing");
      expect(convo.emit).toHaveBeenCalledWith("retry");
      return expect(convo.retries).toBe(1);
    });
    it("should not retry when maxed retries are reached", function() {
      convo.body = "testing";
      convo.retries = 3;
      spyOn(convo, "send");
      spyOn(convo, "emit");
      convo.retry();
      expect(convo.send).not.toHaveBeenCalled();
      expect(convo.emit).toHaveBeenCalledWith("maxretriesreached", 3);
      return expect(convo.retries).toBe(3);
    });
    it("should handle sending error", function() {
      spyOn(drews, "wait");
      convo.sendSmsError("fake error");
      return expect(drews.wait).toHaveBeenCalledWith(3000, convo.retry);
    });
    return it("should send a text", function() {
      sendSmsSpy = jasmine.createSpy();
      convo.twilioClient = {
        sendSms: sendSmsSpy
      };
      convo.send("fake text");
      expect(convo.body).toBe("fake text");
      return expect(convo.twilioClient.sendSms).toHaveBeenCalledWith(convo.from, convo.to, convo.body, "http://mobilemin-server.drewl.us/status", convo.sendSmsSuccess, convo.sendSmsError);
    });
  });

  describe("MobileMinServer", function() {
    var FakeMobileminTwilio, FakeTwilioClient, MobileminServer, RealMobileMinTwilio, apiCallSpy, config, expressPost, expressRpcAppListen, expressRpcInit, expressRpcObj, fakeTimer, getAvailableLocalNumbersSpy, provisionIncomingNumberSpy, sendSmsSpy, server, setupNumbersSpy;
    drews = dModule.require("drews-mixins");
    fakeTimer = new jasmine.FakeTimer();
    window.setTimeout = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return fakeTimer.setTimeout.apply(fakeTimer, args);
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
      return expect(server.expressApp.listen).toHaveBeenCalledWith(8010);
    });
    it("should know when to start handling a new customer", function() {
      var expectedArg, fakeReq, fakeRes;
      spyOn(server, "handleNewCustomerWhoTextedStart");
      fakeReq = {
        body: fakeIncomingStartText
      };
      fakeRes = {
        send: function() {}
      };
      server.sms(fakeReq, fakeRes);
      expectedArg = "+14808405406";
      return expect(server.handleNewCustomerWhoTextedStart).toHaveBeenCalledWith(fakeRes, expectedArg);
    });
    it("should know when not to handle a new customer", function() {
      var fakeReq, fakeRes;
      spyOn(server, "handleNewCustomerWhoTextedStart");
      fakeReq = {
        body: notFakeIncomingStartText
      };
      fakeRes = {
        send: function() {}
      };
      server.sms(fakeReq, fakeRes);
      return expect(server.handleNewCustomerWhoTextedStart).not.toHaveBeenCalled();
    });
    it("should know when not to handle a new customer", function() {
      var fakeReq, fakeRes;
      spyOn(server, "handleNewCustomerWhoTextedStart");
      fakeReq = {
        body: notFakeIncomingStartText2
      };
      fakeRes = {
        send: function() {}
      };
      server.sms(fakeReq, fakeRes);
      return expect(server.handleNewCustomerWhoTextedStart).not.toHaveBeenCalled();
    });
    it("should know what to do with a status url", function() {});
    xdescribe("should be able to send a text message from mobilemin", function() {
      var eventEmit, eventOn, eventful, responseCallback, sendSmsError, sendSmsSuccess, sentCallback, sms, triedToSendCallback;
      triedToSendCallback = null;
      sentCallback = null;
      responseCallback = null;
      sendSmsSuccess = null;
      sendSmsError = null;
      sms = null;
      eventOn = null;
      eventEmit = null;
      eventful = null;
      fakeSendSmsResponse = null;
      fakeGoodStatusRequest = null;
      fakeBadStatusRequest = null;
      fakeIncomingTextRequest = null;
      beforeEach(function() {
        var fakeTriedToSendResponse, smsErrored, smsResponse, smsSent, smsTriedToSendError, smsTriedToSendSuccess;
        smsTriedToSendSuccess = jasmine.createSpy();
        smsTriedToSendError = jasmine.createSpy();
        smsSent = jasmine.createSpy();
        smsErrored = jasmine.createSpy();
        smsResponse = jasmine.createSpy();
        eventOn = jasmine.createSpy();
        eventEmit = jasmine.createSpy();
        eventful = {
          on: eventOn,
          emit: eventEmit
        };
        spyOn(drews, "makeEventful").andReturn(eventful);
        fakeTriedToSendResponse = {
          sid: "fake sid"
        };
        sms = server.createConversation(server.mobileminNumber, "4808405406");
        sms.send("testing");
        expect(sms).toBe(eventful);
        sendSmsSuccess = sms.sendSmsSuccess, sendSmsError = sms.sendSmsError;
        fakeSendSmsResponse = {
          sid: "fake sid",
          status: "queued"
        };
        fakeGoodStatusRequest = {
          body: {
            AccountSid: 'fake account sid',
            SmsStatus: 'sent',
            Body: 'testing2',
            SmsSid: 'fake sid',
            To: '+14808405406',
            From: '+14804673355',
            ApiVersion: '2010-04-01'
          }
        };
        fakeBadStatusRequest = {
          body: {
            AccountSid: 'fake account sid',
            SmsStatus: 'error',
            Body: 'testing2',
            SmsSid: 'fake sid',
            To: '+14808405406',
            From: '+14804673355',
            ApiVersion: '2010-04-01'
          }
        };
        return fakeIncomingTextRequest = {
          body: fakeIncomingText
        };
      });
      it("should have called the twilio client sms", function() {
        return expect(sendSmsSpy).toHaveBeenCalledWith(server.mobileminNumber, "+14808405406", "testing", "http://mobilemin-server.drewl.us/status", sendSmsSuccess, sendSmsError);
      });
      it("should handle the sms response", function() {
        sendSmsSuccess(fakeSendSmsResponse);
        expect(sms.emit).toHaveBeenCalledWith("triedtosendsuccess");
        expect(server.conversations[server.mobileminNumber]["+14808405406"]).toBe(sms);
        expect(server.smsSidsWaitingStatus["fake sid"]).toBe(sms);
        server.status(fakeGoodStatusRequest, {});
        expect(server.smsSidsWaitingStatus["fake sid"]).toBeFalsy();
        expect(sms.emit).toHaveBeenCalledWith("sent");
        server.sms(fakeIncomingTextRequest, {
          send: function() {}
        });
        return expect(sms.emit).toHaveBeenCalledWith("response", fakeIncomingText.Body, fakeIncomingText);
      });
      it("should handle the sms response", function() {
        sendSmsSuccess(fakeSendSmsResponse);
        spyOn(sms, "retry");
        expect(sms.emit).toHaveBeenCalledWith("triedtosendsuccess");
        expect(server.conversations[server.mobileminNumber]["+14808405406"]).toBe(sms);
        expect(server.smsSidsWaitingStatus["fake sid"]).toBe(sms);
        server.status(fakeBadStatusRequest, {});
        expect(server.smsSidsWaitingStatus["fake sid"]).toBeFalsy();
        expect(sms.emit).toHaveBeenCalledWith("error");
        expect(sms.emit).not.toHaveBeenCalledWith("sent");
        return expect(sms.retry).toHaveBeenCalled();
      });
      it("should resend in 3 seconds if if failed to try to send", function() {
        spyOn(sms, "retry");
        sendSmsError();
        fakeTimer.tick(3000);
        return expect(sms.retry).toHaveBeenCalled();
      });
      it("should know how to retry", function() {
        var oldCallCount, retry;
        expect(sms.maxRetries).toBe(3);
        sms.maxRetries = 4;
        sms.sid = "a fake sid";
        server.smsSidsWaitingStatus[sms.sid] = sms;
        retry = function() {
          var oldCallCount;
          oldCallCount = sendSmsSpy.callCount;
          sms.retry();
          expect(server.smsSidsWaitingStatus[sms.sid]).toBeFalsy();
          expect(sendSmsSpy.callCount).toBe(oldCallCount + 1);
          return expect(sendSmsSpy.mostRecentCall.args).toEqual([server.mobileminNumber, "+14808405406", "testing", "http://mobilemin-server.drewl.us/status", sms.sendSmsSuccess, sms.sendSmsError]);
        };
        retry();
        retry();
        retry();
        retry();
        oldCallCount = sendSmsSpy.callCount;
        sms.retry();
        expect(sendSmsSpy.callCount).toBe(oldCallCount);
        return expect(sms.emit).toHaveBeenCalledWith("maxretriesreached", 4);
      });
      it("should try to resend if it gets a bad status", function() {});
      return it("should have a send method", function() {
        var oldCallCount;
        oldCallCount = sendSmsSpy.callCount;
        sms.send("howdy");
        expect(sendSmsSpy.callCount).toBe(oldCallCount + 1);
        return expect(sendSmsSpy).toHaveBeenCalledWith(server.mobileminNumber, "+14808405406", "howdy", "http://mobilemin-server.drewl.us/status", sms.sendSmsSuccess, sms.sendSmsError);
      });
    });
    it("should know how to handle a new customer who texted start", function() {
      var buyCallbacks, buyError, buySuccess, fakeFrom, fakeRes, newPhone;
      fakeRes = {
        send: function() {}
      };
      fakeFrom = "+14808405406";
      buyCallbacks = server.handleNewCustomerWhoTextedStart(fakeRes, fakeFrom);
      buySuccess = buyCallbacks[0];
      buyError = buyCallbacks[1];
      expect(apiCallSpy).toHaveBeenCalledWith("POST", "/IncomingPhoneNumbers", {
        params: {
          VoiceUrl: "http://mobilemin-server.drewl.us/phone",
          SmsUrl: "http://mobilemin-server.drewl.us/sms",
          AreaCode: "480",
          StatusUrl: "http://mobilemin-server.drewl.us/status"
        }
      }, buySuccess, buyError);
      return;
      spyOn(server.mobileminApp, "createApp");
      spyOn(server.mobileminApp, "once");
      buySuccess(justBoughtNumber);
      newPhone = justBoughtNumber.phone_number;
      expect(server.mobileminApp.createApp).toHaveBeenCalledWith({
        adminPhones: [fakeFrom],
        firstPhone: fakeFrom,
        twilioPhone: newPhone
      });
      return expect(server.mobileminApp.once).toHaveBeenCalledWith("created", server.onNewCustomerAppCreated);
    });
    xit("should know what to do once a new customer app is created", function() {
      return server.onNewCustomerAppCreated();
    });
    return dModule.define("mobilemin-twilio", RealMobileMinTwilio);
  });

}).call(this);
