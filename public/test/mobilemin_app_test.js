
  describe("MobileminApp", function() {
    var MobileminApp, Severus, mobileminApp;
    MobileminApp = require("mobilemin-app");
    mobileminApp = new MobileminApp();
    Severus = require("severus2");
    it("should be there", function() {
      return expect(mobileminApp).toBeTruthy();
    });
    it("should have a severus", function() {
      return expect(mobileminApp.severus.db).toBe("mobilemin_dev");
    });
    return it("should find an app", function() {
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
      expect(mobileminApp.severus.find).toHaveBeenCalledWith("mobilemin", findQuery, mmCallback);
      expect(_.isFunction(mmCallback)).toBeTruthy();
      mmCallback(false, [
        {
          title: "yk",
          name: "test"
        }
      ]);
      expect(myCallBackCalled).toBeTruthy();
      return expect(mobileminApp.app.title).toBe("yk");
    });
  });
