(function() {
  define("min-manager-presenter", function() {
    var Min, MinManagerPresenter, MinManagerView, SubMinManagerView, drews, eventer, severus;
    eventer = require("drews-event");
    drews = require("drews-mixins");
    severus = require("severus2")();
    Min = require("min");
    MinManagerView = require("min-manager-view");
    SubMinManagerView = require("sub-min-manager-view");
    MinManagerPresenter = {};
    MinManagerPresenter.init = function(self) {
      var currentMin, emit, loadPhones, menuTablePresenter, mins, phonesTablePresenter, saveTables, setCurrentMin, specialsTablePresenter, view;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit;
      view = MinManagerView.init();
      mins = [];
      currentMin = null;
      SubMinManagerView.on("remove", function(min) {
        return min.remove();
      });
      SubMinManagerView.on("export", function(min) {
        return min["export"]();
      });
      SubMinManagerView.on("load", function(min) {
        return setCurrentMin(min);
      });
      Min.find(null, function(err, _mins) {
        return mins = _mins;
      });
      loadPhones = function() {
        return severus.find("phones", function(err, phones) {
          return view.setPhones(_.map(phones, function(phone) {
            return phone.phone;
          }));
        });
      };
      Min.on("init", function(min) {
        min.subView = SubMinManagerView.init({
          model: min
        });
        return view.addMin(min);
      });
      menuTablePresenter = null;
      specialsTablePresenter = null;
      phonesTablePresenter = null;
      setCurrentMin = function(min) {
        var TablePresenter;
        currentMin = min;
        severus.db = "mobilemin_" + currentMin.get("name");
        severus.db = "mobilemin_" + currentMin.get("name");
        loadPhones();
        view.loadMin(min);
        TablePresenter = require("table-presenter");
        menuTablePresenter = TablePresenter.init({
          type: "items",
          db: "mobilemin_" + (min.get("name")),
          fields: ["order", "image", "title", "price", "description"]
        });
        view.clearItems();
        view.addItemsText("Menu");
        view.addAdditionalItemsTable(menuTablePresenter);
        specialsTablePresenter = TablePresenter.init({
          type: "specials",
          db: "mobilemin_" + (min.get("name")),
          fields: ["order", "image", "title", "price", "description"]
        });
        view.addItemsText("Specials");
        view.addAdditionalItemsTable(specialsTablePresenter);
        phonesTablePresenter = TablePresenter.init({
          type: "phones",
          db: "mobilemin_" + (min.get("name")),
          fields: ["phone"]
        });
        view.addItemsText("Phones");
        return view.addAdditionalItemsTable(phonesTablePresenter);
      };
      Min.on("find", function(mins) {
        var min;
        min = drews.s(mins, -1)[0];
        return setCurrentMin(min);
      });
      Min.on("action", function(action, min) {});
      Min.on("remove", function(min) {
        return view.removeMin(min);
      });
      view.on("change", function(min, prop, val) {
        return min.set(prop, val);
      });
      view.on("new", function(name) {
        var model;
        model = Min.init({
          name: name
        });
        return model.save();
      });
      saveTables = function() {
        console.log(menuTablePresenter.getObjs());
        currentMin.set({
          specials: specialsTablePresenter.getObjs()
        });
        return currentMin.set({
          menu: menuTablePresenter.getObjs()
        });
      };
      return view.on("save", function(hash) {
        currentMin.set(hash);
        saveTables();
        return currentMin.save(function() {
          return currentMin["export"]();
        });
      });
    };
    return MinManagerPresenter;
  });
}).call(this);
