(function() {
  define('table-view', function() {
    var InputUpload, RowView, TableView, eventer, nimble, _;
    _ = require("underscore");
    nimble = require("nimble");
    eventer = require("drews-event");
    TableView = eventer({});
    RowView = require("row-view");
    InputUpload = require("input-upload");
    TableView.init = function(fields) {
      var emit, emptyRowHtml, headersHtml, model, saveNew, self, table;
      self = {};
      self = eventer(self);
      model = self.model, emit = self.emit;
      headersHtml = "";
      _.each(fields, function(field) {
        return headersHtml += "<th>" + field + "</th>";
      });
      emptyRowHtml = $("");
      _.each(fields, function(field) {
        return emptyRowHtml += "<td><input data-prop=\"" + field + "\" class=\"new\" type=\"text\"></td>";
      });
      table = $("<div class=\"row show-grid\">\n  <table class=\"zebra-striped\">\n    <thead>\n      <tr>\n        " + headersHtml + "\n        <th></th>\n      </tr>\n      <tr class=\"new-row\">\n        " + emptyRowHtml + "\n      </tr>\n    </thead>\n    <tbody>\n    </tbody>\n  </table>\n</div>");
      saveNew = function(el) {
        var obj, prop, val;
        prop = $(el).attr("data-prop");
        val = $(el).val();
        obj = {};
        obj[prop] = val;
        table.find(".new").val("");
        return emit("new", obj);
      };
      table.find(".new").bind("keydown", function(e) {
        var _ref;
        if ((_ref = e.keyCode) === 9 || _ref === 13) {
          return saveNew(this);
        }
      });
      self.addObj = function(obj) {
        var el;
        el = obj.view.getEl();
        table.find(".new-row").before(el);
        return obj.view.getEl().find("input")[0].focus();
      };
      self.getEl = function() {
        return table;
      };
      return self;
    };
    return TableView;
  });
}).call(this);
