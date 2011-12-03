
  describe("MobileminApp", function() {
    var MobileminApp, Severus, mobileminApp;
    MobileminApp = require("mobilemin-app");
    mobileminApp = new MobileminApp();
    Severus = require("severus2");
    it("should be there", function() {
      return expect(mobileminApp).toBeTruthy();
    });
    it("should have a severus", function() {
      return expect(mobileminApp.severus.db).toBe("new_mobilemin");
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
          name: "myappy"
        }
      ]);
      expect(myCallBackCalled).toBeTruthy();
      expect(mobileminApp.app.title).toBe("yk");
      return expect(mobileminApp.data.db).toBe("new_mobilemin");
    });
    return describe("after having found an app", function() {
      beforeEach(function() {
        return mobileminApp.name = "myappy";
      });
      return it("should be able to get the phones", function() {
        var findPhonesCallback, mmCallback, myCallBackCalled;
        spyOn(mobileminApp.data, "find");
        myCallBackCalled = false;
        findPhonesCallback = function() {
          return myCallBackCalled = true;
        };
        mmCallback = mobileminApp.findPhones({}, findPhonesCallback);
        return expect(mobileminApp.data.find).toHaveBeenCalledWith("app_myappy_phones", {}, findPhonesCallback);
      });
    });
  });
