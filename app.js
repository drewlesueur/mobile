(function() {
  var ACCOUNT_SID, AUTH_TOKEN, DailyBackup, MY_HOSTNAME, TwilioClient, Twiml, app, bind, config, currentPhoneNumbersListening, drews, drewsSignIn, enableCORS, errorMaker, exec, express, findAllPhones, findAppByAdminPhoneAndTwilioPhone, findPhones, fs, log, mobilemin, mobileminApp, nimble, once, parallel, pg, rpcMethods, saveSite, series, setupPhoneListenerServer, severus, start, sys, texter, trigger, twilioPort, twizzle, wait, _;
  var __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (__hasProp.call(this, i) && this[i] === item) return i; } return -1; }, __slice = Array.prototype.slice;

  config = require('./config.js');

  _ = require("underscore");

  drews = require("drews-mixins");

  nimble = require("nimble");

  fs = require("fs");

  exec = require("child_process").exec;

  wait = _.wait, trigger = _.trigger, bind = _.bind, once = _.once, log = _.log;

  series = nimble.series, parallel = nimble.parallel;

  process.on("uncaughtException", function(err) {
    console.log("there whas a hitch, but we're still up");
    return console.log(err.stack);
  });

  express = require('express');

  drewsSignIn = function(req, res, next) {
    req.isSignedIn = function() {
      return req.session.email !== null;
    };
    return next();
  };

  enableCORS = function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "no-cache");
    return next();
  };

  app = module.exports = express.createServer();

  app.configure(function() {
    app.use(enableCORS);
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: "boom shaka laka"
    }));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    return app.use(drewsSignIn);
  });

  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });

  app.configure('production', function() {
    return app.use(express.errorHandler());
  });

  pg = function(p, f) {
    app.post(p, f);
    return app.get(p, f);
  };

  saveSite = function(name, attrs, cb) {
    var addCss, addFile, addIndex, copyImages, doScripts, html, mkdir, path, setupTwilio;
    if (name.length < 1) return cb("bad name");
    path = "/home/drew/sites/mobilemin-sites/" + name;
    mkdir = function(cb) {
      console.log("makeing dir");
      return fs.mkdir(path, 0777, function(err) {
        return cb();
      });
    };
    doScripts = function(cb) {
      console.log("joining scripts");
      return exec("cd public; cat `cat scripts.txt` > " + path + "/scripts.js", function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        console.log("did they join?");
        if (err) console.log("There was an error combining files");
        return cb(err);
      });
    };
    html = "<!doctype html>\n<html>\n  <head>\n    <meta content='width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no;' name='viewport' />\n\n    <script>\n      var defs = {};\n      var modules = {};\n      function define(name, fn) {\n        defs[name] = fn;\n      }\n      function require(name) {\n        if (modules.hasOwnProperty(name)) return modules[name];\n        if (defs.hasOwnProperty(name)) {\n          var fn = defs[name];\n          defs[name] = function () { throw new Error(\"Circular Dependency\"); }\n          return modules[name] = fn();\n        }\n        throw new Error(\"Module not found: \" + name);\n      } \n      define(\"model\", function(){ return " + (JSON.stringify(attrs)) + "});\n    </script>\n    <script src=\"scripts.js\"></script> \n    <script src=\"http://drewl.us:8010/index.js\"></script>\n    <!--<script src=\"index.js\"></script>--> <!--during development-->\n    <meta name=\"viewport\" content=\"width=device-width,minimum-scale=1.0\" />\n    <!--<link rel=\"stylesheet\" href=\"styles.css\" />-->\n    <link rel=\"stylesheet\" href=\"http://drewl.us:8010/styles.css\" />\n\n  </head>\n  <body>\n  </body>\n</html>";
    copyImages = function(cb) {
      return cb();
    };
    addFile = function(cb) {
      console.log("writing file");
      return fs.writeFile("" + path + "/index.html", html, cb);
    };
    addIndex = function(cb) {
      console.log("adding index");
      return exec("cp /home/drew/sites/mobilemin/public/index.js " + path + "/index.js", cb);
    };
    addCss = function(cb) {
      console.log("adding css");
      return exec("cp /home/drew/sites/mobilemin/public/styles.css " + path + "/styles.css", cb);
    };
    setupTwilio = function(cb) {
      if (attrs.twilioPhone) {
        return setupPhoneListenerServer(attrs.twilioPhone, attrs, cb);
      }
    };
    return series([mkdir, doScripts, copyImages, addFile, addIndex, addCss, setupTwilio], function(err, results) {
      var url;
      url = "http://" + name + ".mobilemin.com";
      console.log("done: visit " + url);
      return cb(err, url);
    });
  };

  rpcMethods = {
    saveSite: saveSite
  };

  severus = require("severus2")();

  severus.db = "mobilemin_dev";

  mobilemin = severus;

  mobileminApp = require("severus2")();

  texter = require("text");

  ACCOUNT_SID = config.ACCOUNT_SID, AUTH_TOKEN = config.AUTH_TOKEN, MY_HOSTNAME = config.MY_HOSTNAME;

  sys = require('sys');

  twizzle = require('twilio');

  TwilioClient = twizzle.Client;

  Twiml = twizzle.Twiml;

  findAllPhones = function(callback) {
    var phoneAppMap;
    phoneAppMap = {};
    return mobilemin.find("mins", {}, function(err, apps) {
      _.each(apps, function(app) {
        if (app.twilioPhone) return phoneAppMap[app.twilioPhone] = app;
      });
      return callback(err, phoneAppMap);
    });
  };

  findAppByAdminPhoneAndTwilioPhone = function(adminPhone, twilioPhone, callback) {
    console.log("findind app with adminPhone " + adminPhone + ", twilioPhone: " + twilioPhone);
    return mobilemin.find("mins", {
      adminPhone: adminPhone,
      twilioPhone: twilioPhone
    }, function(err, apps) {
      console.log("----");
      console.log(err);
      console.log("found " + (apps != null ? apps.length : void 0) + " apps");
      if (apps.length === 0) {
        return callback("no apps");
      } else {
        return callback(err, apps != null ? apps[0] : void 0);
      }
    });
  };

  findPhones = function(app, callback) {
    console.log("finding phones with " + app.name);
    mobileminApp.db = "mobilemin_" + app.name;
    return mobileminApp.find("phones", function(err, phones) {
      return callback(err, _.map(phones, function(phone) {
        return phone.phone;
      }));
    });
  };

  currentPhoneNumbersListening = [];

  twilioPort = 31337;

  setupPhoneListenerServer = function(phone, app, cb) {
    var client, originalApp, phoneClient;
    if (cb == null) cb = function() {};
    if (phone.length < 10) return cb("bad length");
    originalApp = app;
    if (__indexOf.call(currentPhoneNumbersListening, phone) >= 0) {
      console.log("already listening for " + phone + "'s account");
      return cb(null);
    }
    twilioPort += 1;
    client = new TwilioClient(ACCOUNT_SID, AUTH_TOKEN, MY_HOSTNAME, {
      port: twilioPort
    });
    currentPhoneNumbersListening.push(phone);
    phoneClient = client.getPhoneNumber(phone);
    return phoneClient.setup(function() {
      console.log("Listining for " + phone);
      phoneClient.on("incomingCall", function(reqParams, res) {
        console.log("yea!");
        res.append(new Twiml.Dial(app.phone));
        return res.send();
      });
      phoneClient.on('incomingSms', function(reqParams, res) {
        var body, from;
        console.log("received text from " + reqParams.From + " for account " + phone);
        from = reqParams.From;
        if ((drews.s(from, 0, 2)) === "+1") {
          from = reqParams.From = drews.s(from, 2);
        }
        body = reqParams.Body;
        return findAppByAdminPhoneAndTwilioPhone(from, phone, function(err, app) {
          var sendText;
          if (!err) {
            return findPhones(app, function(err, phones) {
              phoneClient.sendSms(from, "Going to send that message to " + phones.length + " people", {}, function() {});
              return _.each(phones, function(toPhone) {
                return phoneClient.sendSms(toPhone, body, {}, function(err) {
                  return console.log("sent " + body + " from " + phone + ", to " + toPhone);
                });
              });
            });
          } else {
            app = originalApp;
            if (!body.match(/stop/i)) {
              sendText = function() {
                return phoneClient.sendSms(from, app.joinText || ("You are signed up to receive special offers from " + app.title + ". Text STOP to unsubscribe"), {}, function() {});
              };
              mobileminApp.db = "mobilemin_" + app.name;
              return mobileminApp.find("phones", {
                phone: from
              }, function(err, phones) {
                if (phones.length) {
                  return sendText();
                } else {
                  return mobileminApp.save("phones", {
                    phone: from
                  }, function(err, phones) {
                    return sendText();
                  });
                }
              });
            } else {
              mobileminApp.db = "mobilemin_" + app.name;
              return mobileminApp.remove("phones", {
                phone: from
              }, function(err, phones) {
                return phoneClient.sendSms(from, app.stopText || ("You were unsubscribed from special offers from " + app.title), {}, function() {});
              });
            }
          }
        });
      });
      return cb(null);
    });
  };

  DailyBackup = require("./public/daily_backup.js");

  findAllPhones(function(err, phoneAppMap) {
    return _.each(phoneAppMap, function(app, phone) {
      var dailyBackup;
      console.log(phone);
      setupPhoneListenerServer(phone, app);
      return dailyBackup = new DailyBackup(app.name);
    });
  });

  errorMaker = function(error) {
    return function() {
      var args, cb, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      return cb(error, null);
    };
  };

  pg("/", function(req, res) {
    return res.send("<a href='http://mobilemin-server.drewl.us/test/index.html'>See tests</a>");
  });

  pg("/restart", function(req, res) {
    return _.wait(500, function() {
      throw new Error("eject!. Supervisor should restart this for you");
    });
  });

  pg("/rpc", function(req, res) {
    var body, fn, id, method, params;
    body = req.body;
    method = body.method, params = body.params, id = body.id;
    fn = rpcMethods[method] || errorMaker("no such method " + method);
    return fn.apply(null, __slice.call(params).concat([function(err, result) {
      return res.send({
        result: result,
        error: err,
        id: id
      });
    }]));
  });

  exports.app = app;

  start = function() {
    if (!module.parent) {
      app.listen(config.server.port || 8001);
      return console.log("Express server listening on port %d", app.address().port);
    }
  };

  start();

}).call(this);
