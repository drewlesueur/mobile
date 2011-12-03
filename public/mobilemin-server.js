(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  dModule.define("mobilemin-server", function() {
    var MobileMinServer, MobileminTwilio;
    MobileminTwilio = dModule.require("mobilemin-twilio");
    return MobileMinServer = (function() {
      var expressRpc;

      expressRpc = dModule.require("express-rpc");

      function MobileMinServer() {
        this.sms = __bind(this.sms, this);
        this.phone = __bind(this.phone, this);        this.expressApp = expressRpc("/rpc", {});
        this.expressApp.post("/phone", this.phone);
        this.expressApp.post("/sms", this.sms);
        this.twilio = new MobileminTwilio();
      }

      MobileMinServer.prototype.phone = function() {};

      MobileMinServer.prototype.sms = function() {};

      return MobileMinServer;

    })();
  });

}).call(this);
