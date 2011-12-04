
  dModule.define("mobilemin-server", function() {
    var MobileminServer, MobileminTwilio, allFunc, drews, expressRpc, obj;
    allFunc = dModule.require("all-func");
    obj = allFunc("object");
    expressRpc = dModule.require("express-rpc");
    drews = dModule.require("drews-mixins");
    MobileminTwilio = dModule.require("mobilemin-twilio");
    MobileminServer = obj();
    MobileminServer("init", function() {
      var self, twilio;
      self = obj();
      self("expressApp", expressRpc("/rpc", {}));
      self("expressApp").post("/phone", this.phone);
      self("expressApp").post("/sms", this.sms);
      self("twilio", new MobileminTwilio());
      twilio = self("twilio");
      self("start", function() {
        self("expressApp").listen(8010);
        return self("twilio").setupNumbers();
      });
      self("phone", function() {});
      self("sms", function(req, res) {
        var text;
        text = req.body;
        return self("handleNewCustomerWhoTextedStart")(res, text.From);
      });
      self("handleNewCustomerWhoTextedStart", function(res, from) {
        return twilio.twilioClient.getAvailableLocalNumbers("US", {
          AreaCode: drews.s(from, 2, 3)
        });
      });
      return self;
    });
    return MobileminServer;
  });
