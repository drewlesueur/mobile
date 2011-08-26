(function() {
  define("filebox", function() {
    var $, FileBox, bind, drews, eachArray, log, s, trigger, _;
    _ = require("underscore");
    drews = require("drews-mixins");
    require("nimble");
    $ = require("jquery");
    bind = _["on"], trigger = _.trigger, s = _.s, log = _.log, eachArray = _.eachArray;
    return FileBox = function(options) {
      var bars, form, self;
      if (options == null) {
        options = {};
      }
      _.extend(options, {
        color: "blue",
        backgroundColor: "yellow"
      });
      self = {};
      form = $("<form id=\"file-form\" enctype=\"multipart-form\"  method=\"POST\" action=\"files\">\n<input type=\"file\" id=\"files\" name=\"files\" multiple/>\n</form>");
      form.bind("change", function() {
        var files;
        files = form.find("#files")[0].files;
        return trigger(self, "filesready", files);
      });
      bars = $("<div class=\"progress-bar-wrapper\"></div>");
      self.getEl = function() {
        return form;
      };
      self.getProgressBars = function() {
        return bars;
      };
      bind(self, "filesready", function(files) {
        log("here are the fiels");
        return eachArray(files, function(file) {
          var bar, formData, reader, xhr;
          bar = $("<div style=\"border: 1px solid black; width:50px; height: 10px; margin: 0; padding: 0; background-color: " + options.backgroundColor + "\" class=\"progress-bar\">\n  <div style=\"height: 10px; width: 0px; margin: 0; padding: 0; background-color: " + options.color + ";\" class=\"progress\"></div>\n</div>");
          bar.appendTo(bars);
          log("the file is");
          log(file);
          formData = new FormData;
          formData.append("name", file.name);
          formData.append("size", file.size);
          formData.append("type", file.type);
          formData.append("file", file);
          reader = new FileReader();
          xhr = new XMLHttpRequest();
          xhr.open("POST", "http://filebox.drewl.us/");
          xhr.onload = function(e) {
            var res;
            console.log("done!");
            res = JSON.parse(e.currentTarget.responseText);
            return trigger(self, "uploaded", res);
          };
          xhr.upload.onprogress = function(e) {
            var progress, width;
            console.log(e);
            progress = e.position / e.totalSize;
            width = bar.width();
            console.log("the width is " + width);
            bar.find(".progress").css("width", "" + (width * progress) + "px");
            console.log("there are progress");
            console.log(progress);
            return trigger(self, "progress", progress);
          };
          return xhr.send(formData);
        });
      });
      return self;
    };
  });
}).call(this);
