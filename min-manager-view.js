(function() {
  define('min-manager-view', function() {
    var InputUpload, MinManagerView, eventer, nimble, _;
    _ = require("underscore");
    nimble = require("nimble");
    eventer = require("drews-event");
    MinManagerView = eventer({});
    InputUpload = require("input-upload");
    MinManagerView.init = function(self) {
      var emit, model;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = self.model, emit = self.emit;
      InputUpload.init($("input[type=text]"));
      self.clearItems = function(tablePresenter) {
        return $(".items").empty();
      };
      self.addItemsTable = function(tablePresenter) {
        return $(".items").empty().append(tablePresenter.getEl());
      };
      self.addItemsText = function(text) {
        return $(".items").append("<div style='font-weight: bold;'>" + text + "</div>");
      };
      self.addAdditionalItemsTable = function(tablePresenter) {
        return $(".items").append(tablePresenter.getEl());
      };
      self.setPhones = function(phones) {
        return $(".phones-textarea").val(phones.join("\n"));
      };
      self.addMin = function(min) {
        return $('.apps').append(min.subView.el);
      };
      self.loadMin = function(min) {
        var embedText;
        console.log(min);
        embedText = "<script>\n  if (navigator.userAgent.match(/iphone|ipod|webos|android/i)) {\n    location.href = \"http://" + (min.get('name')) + ".mobilemin.com\"\n  }\n</script>";
        $(".embed-textarea").val(embedText);
        $(".phones-textarea").val("");
        $('.info-form').each(function() {
          return this.reset();
        });
        return _.each(_.keys(min.attrs), function(prop) {
          var input;
          input = $(".info-form [name=\"" + prop + "\"]");
          if (input.is('[type="checkbox"]')) {
            return input.prop("checked", min.get(prop));
          } else {
            return input.val(min.get(prop));
          }
        });
      };
      $(".text-form").bind("submit", function(e) {
        return e.preventDefault();
      });
      $('.new').bind("click", function(e) {
        var name;
        e.preventDefault();
        name = prompt("Name?");
        emit("new", name);
        return false;
      });
      $('.info-form').bind("submit", function(e) {
        var hash;
        e.preventDefault();
        hash = {};
        $(".info-form [name]").each(function() {
          var prop, val;
          prop = $(this).attr("name");
          if ($(this).is('[type="checkbox"]')) {
            val = $(this).is(":checked");
          } else {
            val = $(this).val();
          }
          hash[prop] = val;
          return true;
        });
        return emit("save", hash);
      });
      self.removeMin = function(min) {
        return min.subView.remove();
      };
      return self;
    };
    return MinManagerView;
  });
}).call(this);
