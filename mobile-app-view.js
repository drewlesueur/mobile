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
      var el, emit, form, header, headerEl, headerImgHtml, html, model;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit, model = self.model;
      headerImgHtml = "";
      if (model.get("header")) {
        headerImgHtml = "<img src=\"" + (model.get("header")) + "\" />";
      }
      html = "<div id=\"mobile-wrapper\">\n  <div class=\"header\">\n    " + headerImgHtml + "\n  </div>\n  <div class=\"hours-phone\">\n    <span class=\"editable\" data-prop=\"hours\"></span>\n    <span class=\"editable\" data-prop=\"phone\"></span> \n  </div>\n  <div class=\"address editable\" data-prop=\"address\"></div>\n  \n</div>";
      form = editableFormMaker(html, model);
      form.setEmittee(self);
      el = form.getEl();
      headerEl = el.find(".header");
      header = fileDroppable(el.find(headerEl));
      header.on("filedroppablefiles", function(files) {
        headerEl.removeClass("header-selected");
        return emit("newheaderimage", files);
      });
      header.on("filedroppableover", function() {
        return headerEl.addClass("header-selected");
      });
      header.on("filedroppableleave", function() {
        return headerEl.removeClass("header-selected");
      });
      self.setHeaderUrl = function(url) {
        console.log(headerEl);
        headerEl.empty();
        return headerEl.append("<img src=\"" + url + "\" />");
      };
      self.getEl = function() {
        return el;
      };
      return self;
    };
  });
}).call(this);
