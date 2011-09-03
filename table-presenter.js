(function() {
  define("table-presenter", function() {
    var RowView, TablePresenter, TableView, drews, eventer, rowMaker;
    eventer = require("drews-event");
    drews = require("drews-mixins");
    TableView = require("table-view");
    RowView = require("row-view");
    TablePresenter = {};
    rowMaker = require("row-maker");
    TablePresenter.init = function(self) {
      var Obj, db, emit, fields, objs, type, view;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit, type = self.type, fields = self.fields, db = self.db;
      Obj = rowMaker({
        db: db,
        type: type
      });
      view = TableView.init(fields);
      objs = [];
      Obj.on("init", function(obj) {
        obj.view = RowView.init({
          model: obj,
          fields: fields,
          emittee: view
        });
        return view.addObj(obj);
      });
      view.on("new", function(obj) {
        obj = Obj.init(obj);
        return obj.save();
      });
      Obj.find(null, function(err, stuff) {
        return console.log(stuff);
      });
      view.on("update", function(obj, values) {
        obj.set(values);
        console.log(obj);
        return obj.save();
      });
      self.getEl = function() {
        return view.getEl();
      };
      return self;
    };
    return TablePresenter;
  });
}).call(this);
