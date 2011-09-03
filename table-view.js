(function() {
  define('table-view', function() {
    var RowView, TableView, eventer, nimble, _;
    _ = require("underscore");
    nimble = require("nimble");
    eventer = require("drews-event");
    TableView = eventer({});
    RowView = require("row-view");
    TableView.init = function(fields) {
      var emit, emptyRowHtml, headersHtml, model, self, table;
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
      table = $("<div class=\"row show-grid\">\n  <table class=\"zebra-striped\">\n    <thead>\n      <tr>\n        " + headersHtml + "\n      </tr>\n      <tr class=\"new-row\">\n        " + emptyRowHtml + "\n      </tr>\n    </thead>\n    <tbody>\n    </tbody>\n  </table>\n</div>");
      table.find(".new").bind("keydown", function(e) {
        var obj, prop, val, _ref;
        if ((_ref = e.keyCode) === 9 || _ref === 13) {
          console.log(e.keyCode);
          prop = $(this).attr("data-prop");
          val = $(this).val();
          obj = {};
          obj[prop] = val;
          table.find(".new").val("");
          return emit("new", obj);
        }
      });
      self.addObj = function(obj) {
        console.log("adding obj");
        console.log(obj.view.getEl());
        table.find(".new-row").before(obj.view.getEl());
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
