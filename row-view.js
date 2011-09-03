(function() {
  define('row-view', function() {
    var RowView, eventer, nimble, _;
    _ = require("underscore");
    nimble = require("nimble");
    eventer = require("drews-event");
    RowView = eventer({});
    RowView.init = function(self) {
      var el, emit, fields, model, tdsHtml;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = self.model, emit = self.emit, fields = self.fields;
      self.setEmittee(self.emittee);
      tdsHtml = "";
      _.each(fields, function(field) {
        return tdsHtml += "<td><input data-prop=\"" + field + "\" type=\"text\" value=\"" + (model.get(field) || "") + "\" /></td>";
      });
      el = $("<tr>" + tdsHtml + "</tr>");
      el.find("input").bind("keydown", function(e) {
        var prop, val, values, _ref;
        if ((_ref = e.keyCode) === 9 || _ref === 13) {
          console.log(e.keyCode);
          prop = $(this).attr("data-prop");
          val = $(this).val();
          values = {};
          values[prop] = val;
          return emit("update", model, values);
        }
      });
      self.el = el;
      self.getEl = function() {
        return el;
      };
      return self;
    };
    return RowView;
  });
}).call(this);
