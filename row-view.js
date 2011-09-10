(function() {
  define('row-view', function() {
    var InputUpload, RowView, eventer, nimble, _;
    _ = require("underscore");
    nimble = require("nimble");
    eventer = require("drews-event");
    InputUpload = require("input-upload");
    RowView = eventer({});
    RowView.init = function(self) {
      var doUpdating, el, emit, fields, input, model, tdsHtml;
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
      doUpdating = function(el) {
        var prop, val, values;
        prop = $(el).attr("data-prop");
        val = $(el).val();
        values = {};
        values[prop] = val;
        return emit("update", model, values);
      };
      el.find("input").bind("keydown", function(e) {
        var _ref;
        if ((_ref = e.keyCode) === 9 || _ref === 13) {
          console.log(e.keyCode);
          return doUpdating(this);
        }
      });
      input = InputUpload.init(el.find("input[type=text]"));
      input.on("change", function(el) {
        console.log(el);
        return doUpdating(el);
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
