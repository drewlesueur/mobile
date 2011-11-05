(function() {
  var DailyBackup, severus;
  define("../config.coffee", function() {
    return {
      email_pw: "fake"
    };
  });
  define("mailer", function() {
    return {
      send: function() {}
    };
  });
  DailyBackup = require("daily-backup");
  severus = require("severus2");
  describe("daily_backup", function() {
    var dailyBackup;
    dailyBackup = null;
    beforeEach(function() {
      dailyBackup = new DailyBackup("mobilemin-site");
      return spyOn(dailyBackup.mobilemin, "find");
    });
    it("should instantiate a new daily backup", function() {
      var myDailyBackup;
      spyOn(severus, "init").andCallThrough();
      myDailyBackup = new DailyBackup("mobilemin-site");
      expect(severus.init).toHaveBeenCalled();
      expect(myDailyBackup.name).toBe("mobilemin-site");
      expect(myDailyBackup).toBeTruthy();
      expect(myDailyBackup.mobilemin).toBeTruthy();
      return expect(myDailyBackup.mobilemin.db).toBe("mobilemin_dev");
    });
    it("should find itself", function() {
      dailyBackup.findMyself();
      return expect(dailyBackup.mobilemin.find).toHaveBeenCalledWith("mins", {
        name: "mobilemin-site"
      }, dailyBackup.onFoundSelf);
    });
    it("should know what to do when it finds itself", function() {
      spyOn(window, "setInterval");
      spyOn(dailyBackup, "performBackup");
      dailyBackup.onFoundSelf(null, [
        {
          a: 1,
          name: "my_appy"
        }
      ]);
      expect(dailyBackup.self).toEqual({
        a: 1,
        name: "my_appy"
      });
      expect(dailyBackup.mobileminApp.db).toBe("mobilemin_my_appy");
      expect(dailyBackup.performBackup).toHaveBeenCalled();
      return expect(window.setInterval).toHaveBeenCalledWith(dailyBackup.performBackup, dailyBackup.backupInterval);
    });
    it("should perform a backup", function() {
      spyOn(dailyBackup, "getPhones");
      dailyBackup.performBackup();
      return expect(dailyBackup.getPhones).toHaveBeenCalledWith(dailyBackup.onGotPhones);
    });
    it("should get the phones", function() {
      dailyBackup.onFoundSelf(null, [
        {
          a: 1,
          name: "my_appy"
        }
      ]);
      spyOn(dailyBackup.mobileminApp, "find");
      dailyBackup.getPhones();
      return expect(dailyBackup.mobileminApp.find).toHaveBeenCalledWith("phones", dailyBackup.onGotPhones);
    });
    it("should send the email once it gets the phones", function() {
      var phonesFixture;
      spyOn(dailyBackup.email, "send");
      phonesFixture = [
        {
          phone: "480-381-3855"
        }, {
          phone: "480-840-5406"
        }
      ];
      dailyBackup.onGotPhones(null, phonesFixture);
      return expect(dailyBackup.email.send).toHaveBeenCalledWith({
        host: "smtp.gmail.com",
        port: "465",
        ssl: true,
        domain: "smtp.gmail.com",
        to: "drewalex@gmail.com, kylebill@gmail.com",
        from: "drewalex@gmail.com",
        subject: "phone backup for " + dailyBackup.name + " ",
        body: JSON.stringify(phonesFixture),
        authentication: "login",
        username: "drewalex@gmail.com",
        password: dailyBackup.config.email_pw
      }, dailyBackup.onSentEmail);
    });
    it("should start a backup", function() {
      spyOn(dailyBackup, "findMyself");
      dailyBackup.startBackup();
      return expect(dailyBackup.findMyself).toHaveBeenCalled();
    });
    return it("should log an email error", function() {
      spyOn(console, "log");
      dailyBackup.onSentEmail("error!!");
      return expect(console.log).toHaveBeenCalledWith("error!!");
    });
  });
}).call(this);
