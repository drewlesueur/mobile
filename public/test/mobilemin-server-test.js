
  describe("MobileMinServer", function() {
    var FakeMobileminTwilio, MobileMinServer, RealMobileMinTwilio, expressPost, expressRpcAppListen, expressRpcInit, expressRpcObj, server, setupNumbersSpy;
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
    RealMobileMinTwilio = dModule.require("mobilemin-twilio");
    setupNumbersSpy = jasmine.createSpy();
    FakeMobileminTwilio = (function() {

      function FakeMobileminTwilio() {}

      FakeMobileminTwilio.prototype.setupNumbers = setupNumbersSpy;

      return FakeMobileminTwilio;

    })();
    dModule.define("mobilemin-twilio", function() {
      return FakeMobileminTwilio;
    });
    MobileMinServer = dModule.require("mobilemin-server");
    server = null;
    beforeEach(function() {
      return server = new MobileMinServer();
    });
    it("should pass have an express rpc", function() {
      expect(expressRpcInit).toHaveBeenCalledWith("/rpc", {});
      expect(server.expressApp).toBe(expressRpcObj);
      expect(server.expressApp.post).toHaveBeenCalledWith("/phone", server.phone);
      return expect(server.expressApp.post).toHaveBeenCalledWith("/sms", server.sms);
    });
    it("should have a mobileminTwilio", function() {
      return expect(server.twilio.constructor).toBe(FakeMobileminTwilio);
    });
    it("should start", function() {
      server.start();
      expect(server.expressApp.listen).toHaveBeenCalledWith(8010);
      return expect(server.twilio.setupNumbers).toHaveBeenCalled();
    });
    it("should handle a start", function() {});
    it("should know how to handle an sms");
    return dModule.define("mobilemin-twilio", RealMobileMinTwilio);
  });
