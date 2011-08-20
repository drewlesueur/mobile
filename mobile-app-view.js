(function() {
  define("mobile-app-view", function() {
    var $, drews, editableFormMaker, eventer, fileDroppable, mobileAppViewMaker, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    eventer = require("drews-event");
    editableFormMaker = require("editable-form");
    fileDroppable = require("file-droppable");
    return mobileAppViewMaker = function(self) {
      var el, emit, form, header, html, model;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit, model = self.model;
      html = "<div id=\"mobile-wrapper\">\n  <div class=\"header\">\n  </div>\n  <div class=\"hours-phone\">\n    <span class=\"editable\" data-prop=\"hours\"></span>\n    <span class=\"editable\" data-prop=\"phone\"></span> \n  </div>\n  <div class=\"address editable\" data-prop=\"address\"></div>\n  \n</div>";
      form = editableFormMaker(html, model);
      form.setEmittee(self);
      el = form.getEl();
      header = el.find(".header");
      fileDroppable(header);
      header.bind("filedroppablefiles", function(event, files) {
        console.log("hellow orld");
        console.log(files);
        return emit("newheaderimage", files);
      });
      header.bind("filedroppableover", function() {
        return header.addClass("header-selected");
      });
      header.bind("filedroppableleave", function() {
        return header.removeClass("header-selected");
      });
      self.setHeaderUrl = function(url) {
        header.empty();
        return header.append("<img src=\"" + url + "\" />");
      };
      self.getEl = function() {
        return el;
      };
      return self;
    };
  });
}).call(this);
