(function() {
  describe("view", function() {
    var EditorView, appFixtures, view;
    EditorView = require("editor-view");
    appFixtures = require("app-fixtures");
    view = null;
    beforeEach(function() {
      return view = new EditorView();
    });
    it("should be initialized", function() {
      spyOn(EditorView.prototype, "setUpDom");
      spyOn(EditorView.prototype, "addAppsSlate");
      view = new EditorView();
      expect(EditorView.prototype.setUpDom).toHaveBeenCalled();
      return expect(EditorView.prototype.addAppsSlate).toHaveBeenCalled();
    });
    it("should add the app slate", function() {
      spyOn(view.el, "append");
      view.addAppsSlate();
      return expect(view.el.append).toHaveBeenCalledWith(view.appsSlate.el);
    });
    it("should set up the dom", function() {
      spyOn(view.appsSlate, "add");
      view.setUpDom();
      expect(view.el.attr("class")).toBe("editor");
      return expect(view.appsSlate.add).toHaveBeenCalledWith(view.appsList);
    });
    return it("should populate the apps", function() {
      var titles;
      spyOn(view, "activate");
      spyOn(view.appsList, "fill");
      view.populateApps(appFixtures);
      expect(view.activate).toHaveBeenCalledWith(view.appsSlate);
      titles = _.map(appFixtures, function(app) {
        return [app.title, app];
      });
      return expect(view.appsList.fill).toHaveBeenCalledWith(titles);
    });
  });
  describe("slate view", function() {
    var SlateView, slate;
    SlateView = require("slate-view");
    slate = null;
    beforeEach(function() {
      return slate = new SlateView();
    });
    it("should call init when constructed", function() {
      spyOn(SlateView.prototype, "init");
      slate = new SlateView();
      return expect(SlateView.prototype.init).toHaveBeenCalled();
    });
    it("should init with dom", function() {
      slate.init();
      return expect(slate.el.attr("class")).toBe("slate");
    });
    return it("should be able to append another view", function() {
      var fakeView;
      spyOn(slate.el, "append");
      fakeView = {
        el: $("<div>hi</div>")
      };
      slate.add(fakeView);
      return expect(slate.el.append).toHaveBeenCalledWith(fakeView.el);
    });
  });
  describe("list view", function() {
    var ListView, list;
    ListView = require("list-view");
    list = null;
    beforeEach(function() {
      return list = new ListView();
    });
    it("should call init when constructed", function() {
      spyOn(ListView.prototype, "init");
      list = new ListView();
      return expect(ListView.prototype.init).toHaveBeenCalled();
    });
    it("should have a dom el ement when inited", function() {
      list = new ListView;
      list.init();
      return expect(list.el.attr("class")).toBe("list");
    });
    return it("should fill and handle click events", function() {
      var fillFixture, obj1, obj2;
      obj1 = {};
      obj2 = {};
      fillFixture = [["name1", obj1], ["name2", obj2]];
      list.fill(fillFixture);
      expect(list.el.find(".item").length).toBe(2);
      expect(list.el.children().eq(0).text()).toBe("name1");
      expect(list.el.children().eq(1).text()).toBe("name2");
      $(document.body).append(list.el);
      console.log(list.el);
      spyOn(list, "trigger");
      list.el.children().eq(0).click();
      expect(list.trigger).toHaveBeenCalledWith("click", ["name1", obj1]);
      return list.el.remove();
    });
  });
}).call(this);
