(function() {
  describe("model", function() {
    var App, app;
    App = require("app");
    app = null;
    beforeEach(function() {
      return app = new App();
    });
    it("should find apps", function() {
      expect(app.severus.db).toBe("mobilemin_dev");
      spyOn(app.severus, "find");
      app.find({
        name: "yk"
      });
      return expect(app.severus.find).toHaveBeenCalledWith("mins", {
        name: "yk"
      }, app.onFound);
    });
    return it("should trigger a found when stuff is found", function() {
      spyOn(app, "trigger");
      app.onFound.call({}, null, [1, 2]);
      return expect(app.trigger).toHaveBeenCalledWith("found", [1, 2]);
    });
  });
}).call(this);
