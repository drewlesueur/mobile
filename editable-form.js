(function() {
  define("editable-form", function() {
    var $, drews, drewsEventMaker, editableFormMaker, nimble, _;
    $ = require("jquery");
    _ = require("underscore");
    drews = require("drews-mixins");
    nimble = require("nimble");
    drews.bind = drews.on;
    drewsEventMaker = require("drews-event");
    return editableFormMaker = function(html, model, options) {
      var clickToMakeEditable, el, htmlValues, makeEditable, self, trigger, triggeree;
      self = {
        el: $(html),
        model: model
      };
      self = drewsEventMaker(self);
      triggeree = (options != null ? options.triggeree : void 0) || self;
      self.setTriggeree(triggeree);
      trigger = self.trigger;
      el = self.el;
      self.getEl = function() {
        return el;
      };
      htmlValues = el.find("[data-prop]");
      drews.eachArray(htmlValues, function(_el) {
        var key;
        _el = $(_el);
        key = _el.attr("data-prop");
        return _el.text(model.get(key) || ("[" + key + "]"));
      });
      clickToMakeEditable = function(els) {
        return els.bind("click", function(e) {
          var prop;
          prop = $(this).attr("data-prop");
          return self.makeEditable(prop);
        });
      };
      self.clickToMakeEditable = clickToMakeEditable;
      clickToMakeEditable(el.find(".editable"));
      makeEditable = function(prop) {
        var replacer, saveIt, value, _el;
        if (self.editing) {
          return;
        }
        _el = el.find("[data-prop='" + prop + "']");
        value = _el.text();
        replacer = $("<input type=\"text\" data-prop=\"" + prop + "\" value=\"" + value + "\">");
        saveIt = function() {
          var newValue;
          self.editing = false;
          newValue = replacer.val();
          _el.html("");
          _el.text(newValue);
          return trigger("modelviewvalchanged", model, prop, newValue);
        };
        replacer.bind("keyup", function(e) {
          if (e.keyCode === 13) {
            return saveIt();
          }
        });
        replacer.bind("blur", function(e) {
          return saveIt();
        });
        _el.html(replacer);
        self.editing = true;
        replacer[0].focus();
        return replacer[0].select();
      };
      self.makeEditable = makeEditable;
      return self;
    };
  });
}).call(this);
