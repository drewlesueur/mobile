(function() {
  define("mobile-app-presenter-view", function() {
    var $, drews, eventer, mobileAppPresenterViewMaker, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    eventer = require("drews-event");
    return mobileAppPresenterViewMaker = function(self) {
      var contactEl, dayInput, el, emit, formEl, getHourValues, headerInfoEl, hoursEl, model, name, saveHtml, _makeDayForm;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = self.model, emit = self.emit;
      name = model.get("name");
      dayInput = $(" <div class=\"because_outerhtml_isnt_built_in\">\n <div class=\"clearfix\">\n   <label>Monday</label>\n   <div class=\"input\">\n     <div class=\"inline-inputs\">\n       <input name=\"mondayStart\" class=\"mini\" type=\"text\">\n       to\n       <input name=\"mondayEnd\" class=\"mini\" type=\"text\">\n     </div>\n   </div>\n </div> <!-- /clearfix -->\n</div>\n");
      _makeDayForm = function(day) {
        var cap, dayEl, end, endVal, low, start, startVal, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
        cap = drews.capitalize(day);
        low = day.toLowerCase();
        dayEl = dayInput.clone();
        dayEl.find("label").text(cap);
        start = dayEl.find('[name="mondayStart"]');
        start.attr("name", "" + low + "Start");
        startVal = ((_ref = model.get("hours")) != null ? (_ref2 = _ref[day]) != null ? _ref2.start : void 0 : void 0) || "";
        start.val(startVal);
        console.log((_ref3 = model.get("hours")) != null ? (_ref4 = _ref3[day]) != null ? _ref4.end : void 0 : void 0);
        end = dayEl.find('[name="mondayEnd"]');
        endVal = ((_ref5 = model.get("hours")) != null ? (_ref6 = _ref5[day]) != null ? _ref6.end : void 0 : void 0) || "";
        end.val(endVal);
        end.attr("name", "" + low + "End");
        return dayEl;
      };
      saveHtml = "<div class=\"actions\">\n  <button type=\"submit\" class=\"btn primary\">Save</button>\n</div>";
      hoursEl = $("<div class=\"form-togglee hours\">\n<form>\n  <fieldset>\n   <legend>Hours</legend>\n  </fieldset>\n  " + saveHtml + "\n</form>\n</div>");
      hoursEl.find("fieldset").append(_makeDayForm("monday"));
      hoursEl.find("fieldset").append(_makeDayForm("tuesday"));
      hoursEl.find("fieldset").append(_makeDayForm("wednesday"));
      hoursEl.find("fieldset").append(_makeDayForm("thursday"));
      hoursEl.find("fieldset").append(_makeDayForm("friday"));
      hoursEl.find("fieldset").append(_makeDayForm("saturday"));
      hoursEl.find("fieldset").append(_makeDayForm("sunday"));
      contactEl = $("<div class=\"form-togglee contact\">\n<form>\n  <fieldset>\n    <legend>Contact</legend>\n    <div class=\"clearfix\">\n      <label for=\"phone\">Phone</label>\n      <div class=\"input\">\n        <input id=\"phone\" name=\"phone\" type=\"text\">\n      </div>\n    </div> <!-- /clearfix -->\n    <div class=\"clearfix\">\n      <label for=\"googleMapName\">Google Map Name</label>\n      <div class=\"input\">\n        <input id=\"googleMapName\" name=\"googleMapName\" type=\"text\">\n        <span class=\"help-block\">the name to search for when searching on Google Maps</span>\n      </div>\n    </div> <!-- /clearfix -->\n    <div class=\"clearfix\">\n      <label for=\"address\">Address</label>\n      <div class=\"input\">\n        <input id=\"address\" name=\"address\" type=\"text\">\n        <span class=\"help-block\">Leave blank if multiple addresses</span>\n      </div>\n    </div> <!-- /clearfix -->\n  </fieldset>\n  " + saveHtml + "\n</form>\n</div>");
      headerInfoEl = $("<div class=\"form-togglee header-info\">\n<form>\n  <fieldset>\n    <legend>Header</legend>\n    <div class=\"clearfix\">\n      <label for=\"headerUrl\">Header Url</label>\n      <div class=\"input\">\n        <input id=\"headerUrl\" name=\"headerUrl\" type=\"text\">\n      </div>\n    </div> <!-- /clearfix -->\n  </fieldset>\n  " + saveHtml + "\n</form>\n</div>");
      formEl = $("<div>\n<ul class=\"pills\">\n  <li class=\"active\"><a href=\"#\" class=\"hours\">Hours</a></li>\n  <li><a href=\"#\" class=\"contact\">Contact</a></li>\n  <li><a href=\"#\" class=\"header-info\">Header</a></li>\n</ul>\n<div class=\"form-toggler\">\n</div>\n</div>");
      formEl.find(".form-toggler").append(hoursEl).append(contactEl).append(headerInfoEl);
      formEl.find(".form-togglee").hide();
      formEl.find(".form-togglee.hours").show();
      formEl.find("li a").bind("click", function(e) {
        var klass;
        e.preventDefault();
        klass = $(this).attr("class");
        formEl.find(".form-togglee").hide();
        formEl.find("li").removeClass("active");
        formEl.find("li a." + klass).parents("li").eq(0).addClass("active");
        return formEl.find(".form-togglee." + klass).show();
      });
      getHourValues = function(day) {
        var end, start;
        day = day.toLowerCase();
        start = hoursEl.find("[name=\"" + day + "Start\"]").val();
        end = hoursEl.find("[name=\"" + day + "End\"]").val();
        return [start, end];
      };
      hoursEl.find("form").bind("submit", function(e) {
        var day, days, hours, values, _i, _len;
        e.preventDefault();
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        hours = {};
        for (_i = 0, _len = days.length; _i < _len; _i++) {
          day = days[_i];
          values = getHourValues(day);
          hours[day] = {
            start: values[0],
            end: values[1]
          };
        }
        return emit("modelviewvalchanged", model, "hours", hours);
      });
      el = $("<li>\n  <a href=\"#apps/" + name + "\">" + name + "</a> <a class=\"remove\" href=\"#\">[delete]</a><a class=\"link\" href=\"/apps.html#" + name + "\">preview</a>\n</li>");
      el.find(".remove").bind("click", function(e) {
        e.preventDefault();
        if (confirm("Are you sure you want to delete " + name + "?")) {
          return emit("remove");
        }
      });
      self.getEl = function() {
        return el;
      };
      self.getFormEl = function() {
        return formEl;
      };
      self.remove = function() {
        return el.remove();
      };
      return self;
    };
  });
}).call(this);
