(function() {
  var __slice = Array.prototype.slice;
  define("sub-min-manager-view", function() {
    var SubMinManagerView, drews, eventBus, eventer;
    SubMinManagerView = {};
    eventBus = require("event-bus");
    eventer = require("drews-event");
    drews = require("drews-mixins");
    SubMinManagerView = eventer({});
    SubMinManagerView.init = function(self) {
      var el, emit, model, _emit;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = self.model;
      _emit = self.emit;
      emit = function() {
        var args, event;
        event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        _emit.apply(null, [event].concat(__slice.call(args)));
        return SubMinManagerView.emit.apply(SubMinManagerView, [event, model].concat(__slice.call(args)));
      };
      el = $("<div>\n  <a href=\"#\" class=\"load\">" + (model.get("name")) + "</a>\n  <div>\n    <a target=\"_blank\" href=\"http://" + (model.get("name")) + ".mobilemin.com\">http://" + (model.get("name")) + ".mobilemin.com</a>\n  </div>\n  <div>\n  <a href=\"#\" class=\"remove\">Delete</a>\n  <a href=\"#\" class=\"export\">Export</a>\n  </div>\n  <br />\n</div>");
      el.find('.remove').click(function(e) {
        e.preventDefault();
        if (confirm("Are you sure you want to delete?")) {
          return emit("remove");
        }
      });
      el.find('.export').click(function(e) {
        e.preventDefault();
        return emit("export");
      });
      el.find('.load').click(function(e) {
        e.preventDefault();
        return emit("load");
      });
      self.el = el;
      self.remove = function() {
        return el.remove();
      };
      SubMinManagerView.emit("init");
      return self;
    };
    return SubMinManagerView;
  });
}).call(this);
