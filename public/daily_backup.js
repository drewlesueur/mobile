(function() {
  var difinir;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    difinir = function() {
      var args, ret, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), ret = arguments[_i++];
      return module.exports = ret();
    };
    define = difinir;
  }

  define('daily-backup', function() {
    var DailyBackup, config, email, severus;
    email = require("mailer");
    config = require("../config");
    severus = require("severus2");
    DailyBackup = (function() {

      function DailyBackup(name) {
        this.name = name;
        this.startBackup = __bind(this.startBackup, this);
        this.findMyself = __bind(this.findMyself, this);
        this.onGotPhones = __bind(this.onGotPhones, this);
        this.getPhones = __bind(this.getPhones, this);
        this.performBackup = __bind(this.performBackup, this);
        this.onFoundSelf = __bind(this.onFoundSelf, this);
        this.mobilemin = severus.init();
        this.mobilemin.db = "mobilemin_dev";
        this.backupInterval = 1000 * 60 * 60 * 24;
        this.email = email;
        this.config = config;
      }

      DailyBackup.prototype.onFoundSelf = function(err, app) {
        app = app[0];
        this.self = app;
        this.mobileminApp = severus.init(app.name);
        this.mobileminApp.db = "mobilemin_" + app.name;
        this.performBackup();
        return setInterval(this.performBackup, this.backupInterval);
      };

      DailyBackup.prototype.performBackup = function() {
        return this.getPhones(this.onGotPhones);
      };

      DailyBackup.prototype.getPhones = function() {
        return this.mobileminApp.find("phones", this.onGotPhones);
      };

      DailyBackup.prototype.onGotPhones = function(err, phones) {
        console.log("going to send an email for " + this.name);
        return this.email.send({
          host: "smtp.gmail.com",
          port: "465",
          ssl: true,
          domain: "smtp.gmail.com",
          to: "drewalex@gmail.com, kylebill@gmail.com",
          from: "drewalex@gmail.com",
          subject: "phone backup for " + this.name + " ",
          body: JSON.stringify(phones),
          authentication: "login",
          username: "drewalex@gmail.com",
          password: this.config.email_pw
        }, this.onSentEmail);
      };

      DailyBackup.prototype.onSentEmail = function(err) {
        if (err) return console.log(err);
      };

      DailyBackup.prototype.findMyself = function() {
        return this.mobilemin.find("mins", {
          name: this.name
        }, this.onFoundSelf);
      };

      DailyBackup.prototype.startBackup = function() {
        return this.findMyself();
      };

      return DailyBackup;

    })();
    return DailyBackup;
  });

}).call(this);
