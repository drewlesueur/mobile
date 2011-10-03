(function() {
  var ACCOUNT_SID, AUTH_TOKEN, MY_HOSTNAME, TwilioClient, Twiml, app, client, config, phones, rpc, sys, twizzle;
  config = require("./config");
  ACCOUNT_SID = config.ACCOUNT_SID, AUTH_TOKEN = config.AUTH_TOKEN, MY_HOSTNAME = config.MY_HOSTNAME;
  rpc = require("./rpc");
  sys = require('sys');
  twizzle = require('twilio');
  TwilioClient = twizzle.Client;
  Twiml = twizzle.Twiml;
  client = new TwilioClient(ACCOUNT_SID, AUTH_TOKEN, MY_HOSTNAME);
  phones = {};
  app = rpc("/rpc", {
    text: function(from, to, message, callback) {
      var phone, sendSms;
      phone = null;
      sendSms = function() {
        return phone.sendSms(to, message, {}, function(err) {
          console.log("sent " + message + " from " + from + ", to " + to);
          return callback();
        });
      };
      if (from in phones) {
        phone = phones[from];
        return sendSms();
      } else {
        phone = client.getPhoneNumber(from);
        return phone.setup(function() {
          phones[from] = phone;
          return sendSms();
        });
      }
    }
  });
  app.listen(8011);
  console.log("Express server listening on port %d", app.address().port);
}).call(this);
