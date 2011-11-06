(function() {
  describe("presenter", function() {
    var EditorPresenter, app, appFixtures, presenter, view;
    EditorPresenter = require("editor-presenter");
    appFixtures = require("app-fixtures");
    presenter = null;
    app = null;
    view = null;
    beforeEach(function() {
      presenter = new EditorPresenter();
      view = presenter.view;
      return app = presenter.app;
    });
    it("should get apps", function() {
      spyOn(presenter.app, "find");
      presenter.getApps();
      return expect(presenter.app.find).toHaveBeenCalled();
    });
    it("should handle when apps are found", function() {
      spyOn(view, "populateApps");
      presenter.app.trigger("found", appFixtures);
      return expect(view.populateApps).toHaveBeenCalledWith(appFixtures);
    });
    return it("should handle a click on an app", function() {
      spyOn(view, "populateSingleApp");
      view.trigger("appclick", app);
      return expect(view.populateSingleApp).toHaveBeenCalledWith(app);
    });
  });
}).call(this);
