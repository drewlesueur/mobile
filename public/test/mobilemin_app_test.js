
  describe("MobileminApp", function() {
    var MobileminApp, Severus, mobileminApp;
    MobileminApp = require("mobilemin-app");
    mobileminApp = new MobileminApp();
    Severus = require("severus2");
    it("should be there", function() {
      return expect(mobileminApp).toBeTruthy();
    });
    it("should have a severus", function() {
      return expect(mobileminApp.data.db).toBe("new_mobilemin");
    });
    it("should find an app", function() {
      var callback, findQuery, mmCallback, myCallBackCalled;
      spyOn(mobileminApp.severus, "find");
      myCallBackCalled = false;
      callback = function() {
        return myCallBackCalled = true;
      };
      findQuery = {
        title: "yk"
      };
      mmCallback = mobileminApp.find(findQuery, callback);
      expect(mobileminApp.severus.find).toHaveBeenCalledWith("apps", findQuery, mmCallback);
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
        return mobileminApp.app.firstPhone = "+14808405406";
      });
      return it("should be able to get the phones", function() {
        var findPhonesCallback, mmCallback, myCallBackCalled;
        spyOn(mobileminApp.data, "find");
        myCallBackCalled = false;
        findPhonesCallback = function() {
          return myCallBackCalled = true;
        };
        mmCallback = mobileminApp.findPhones({}, findPhonesCallback);
        return expect(mobileminApp.data.find).toHaveBeenCalledWith("app_14808405406_phones", {}, findPhonesCallback);
      });
    });
    return it("should create an app", function() {
      var myCallback, rawApp, saveCallback;
      spyOn(mobileminApp.data, "save");
      rawApp = {
        name: "drewsapp",
        test: 1
      };
      myCallback = jasmine.createSpy();
      saveCallback = mobileminApp.createApp(rawApp, myCallback);
      expect(mobileminApp.data.save).toHaveBeenCalledWith("apps", rawApp, saveCallback);
      saveCallback(null, rawApp);
      expect(myCallback).toHaveBeenCalledWith(null, mobileminApp);
      return expect(mobileminApp.app.name).toBe("drewsapp");
    });
  });
