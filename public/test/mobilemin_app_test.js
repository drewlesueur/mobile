
  describe("MobileminApp", function() {
    var MobileminApp, Severus, app, mobileminApp;
    MobileminApp = require("mobilemin-app");
    Severus = require("severus2");
    mobileminApp = null;
    app = null;
    beforeEach(function() {
      mobileminApp = new MobileminApp();
      return app = mobileminApp;
    });
    it("should be there", function() {
      return expect(mobileminApp).toBeTruthy();
    });
    it("should have a severus", function() {
      return expect(mobileminApp.data.db).toBe("new_mobilemin");
    });
    it("should find an app", function() {
      var callback, findQuery, mmCallback, myCallBackCalled;
      spyOn(mobileminApp.data, "find");
      myCallBackCalled = false;
      callback = function() {
        return myCallBackCalled = true;
      };
      findQuery = {
        title: "yk"
      };
      mmCallback = mobileminApp.find(findQuery, callback);
      expect(mobileminApp.data.find).toHaveBeenCalledWith("apps", findQuery, mmCallback);
      expect(_.isFunction(mmCallback)).toBeTruthy();
      mmCallback(false, [
        {
          title: "yk",
          name: "myappy",
          firstPhone: "+14808505406"
        }
      ]);
      expect(myCallBackCalled).toBeTruthy();
      expect(mobileminApp.app.title).toBe("yk");
      return expect(mobileminApp.data.db).toBe("new_mobilemin");
    });
    describe("after having found an app", function() {
      beforeEach(function() {
        mobileminApp.app.name = "myappy";
        mobileminApp.app.firstPhone = "+14808405406";
        mobileminApp.app.twilioPhone = "+14805554444";
        return app = mobileminApp;
      });
      return it("should be able to get the phones", function() {
        var findPhonesCallback, mmCallback, myCallBackCalled;
        spyOn(mobileminApp.data, "find");
        myCallBackCalled = false;
        findPhonesCallback = function() {
          return myCallBackCalled = true;
        };
        mmCallback = mobileminApp.findPhones({}, findPhonesCallback);
        return expect(mobileminApp.data.find).toHaveBeenCalledWith("app_14808405406_14805554444_phones", {}, findPhonesCallback);
      });
    });
    it("should create an app", function() {
      var rawApp;
      spyOn(mobileminApp.data, "save");
      rawApp = {
        name: "drewsapp",
        test: 1
      };
      mobileminApp.createApp(rawApp);
      expect(app.app).toBe(rawApp);
      return expect(mobileminApp.data.save).toHaveBeenCalledWith("apps", rawApp, app.onCreate);
    });
    it("should handle a create", function() {
      var rawApp;
      rawApp = {
        name: "drewsapp",
        test: 1,
        _id: "xx"
      };
      spyOn(app, "emit");
      app.onCreate(null, rawApp);
      expect(app.emit).toHaveBeenCalledWith("created");
      return expect(mobileminApp.app.name).toBe("drewsapp");
    });
    it("should handle a create error", function() {
      var rawApp;
      rawApp = {
        name: "drewsapp",
        test: 1,
        _id: "xx"
      };
      spyOn(app, "emit");
      app.onCreate("fake error", rawApp);
      return expect(app.emit).toHaveBeenCalledWith("createerror", "fake error");
    });
    it("should save", function() {
      spyOn(app.data, "save");
      app.save();
      return expect(app.data.save).toHaveBeenCalledWith("apps", app.app, app.onSave);
    });
    it("should handle a successful save", function() {
      var rawApp;
      rawApp = {
        name: "drewsapp",
        test: 1,
        _id: "xx"
      };
      spyOn(app, "emit");
      app.onSave(null, rawApp);
      expect(app.emit).toHaveBeenCalledWith("saved");
      return expect(mobileminApp.app.name).toBe("drewsapp");
    });
    return it("should handle a save error", function() {
      var rawApp;
      rawApp = {
        name: "drewsapp",
        test: 1,
        _id: "xx"
      };
      spyOn(app, "emit");
      app.onSave("error!", rawApp);
      return expect(app.emit).toHaveBeenCalledWith("saveerror", "error!");
    });
  });
