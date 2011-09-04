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
      el = $("<tr>\n  " + tdsHtml + "\n  <td><input class=\"delete\" type=\"button\" value=\"delete\"></td>\n\n</tr>");
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
      el.find(".delete").bind("click", function() {
        emit("delete", model);
        return el.remove();
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
