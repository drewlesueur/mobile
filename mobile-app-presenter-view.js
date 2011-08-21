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
      var contactHtml, dayInput, el, emit, formEl, headerHtml, hoursHtml, model, name, saveHtml, _makeDayForm;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = self.model, emit = self.emit;
      name = model.get("name");
      dayInput = $(" <div class=\"because_outerhtml_isnt_built_in\">\n <div class=\"clearfix\">\n   <label>Monday</label>\n   <div class=\"input\">\n     <div class=\"inline-inputs\">\n       <input name=\"monday_start\" class=\"mini\" type=\"text\" value=\"\">\n       to\n       <input name=\"monday_end\" class=\"mini\" type=\"text\" value=\"\">\n     </div>\n   </div>\n </div> <!-- /clearfix -->\n</div>\n");
      _makeDayForm = function(day) {
        var cap, dayEl, low;
        cap = drews.capitalize(day);
        low = day.toLowerCase();
        dayEl = dayInput.clone();
        dayEl.find("label").text(cap);
        dayEl.find('[name="monday_start"]').attr("name", "" + low + "_start");
        dayEl.find('[name="monday_end"]').attr("name", "" + low + "_end");
        return dayEl.html();
      };
      saveHtml = "<div class=\"actions\">\n  <button type=\"submit\" class=\"btn primary\">Save</button>\n</div>";
      hoursHtml = "<form>\n  <fieldset>\n   <legend>Hours</legend>\n     " + (_makeDayForm("monday")) + "\n     " + (_makeDayForm("tuesday")) + "\n     " + (_makeDayForm("wednesday")) + "\n     " + (_makeDayForm("thursday")) + "\n     " + (_makeDayForm("friday")) + "\n     " + (_makeDayForm("saturday")) + "\n     " + (_makeDayForm("sunday")) + "\n  </fieldset>\n  " + saveHtml + "\n</form>";
      contactHtml = "<form>\n  <fieldset>\n    <legend>Contact</legend>\n    <div class=\"clearfix\">\n      <label for=\"phone\">Phone</label>\n      <div class=\"input\">\n        <input id=\"phone\" name=\"phone\" type=\"text\">\n      </div>\n    </div> <!-- /clearfix -->\n    <div class=\"clearfix\">\n      <label for=\"googleMapName\">Google Map Name</label>\n      <div class=\"input\">\n        <input id=\"googleMapName\" name=\"googleMapName\" type=\"text\">\n        <span class=\"help-block\">the name to search for when searching on Google Maps</span>\n      </div>\n    </div> <!-- /clearfix -->\n    <div class=\"clearfix\">\n      <label for=\"address\">Address</label>\n      <div class=\"input\">\n        <input id=\"address\" name=\"address\" type=\"text\">\n        <span class=\"help-block\">Leave blank if multiple addresses</span>\n      </div>\n    </div> <!-- /clearfix -->\n  </fieldset>\n  " + saveHtml + "\n</form>";
      headerHtml = "<form>\n  <fieldset>\n    <legend>Header</legend>\n    <div class=\"clearfix\">\n      <label for=\"headerUrl\">Header Url</label>\n      <div class=\"input\">\n        <input id=\"headerUrl\" name=\"headerUrl\" type=\"text\">\n      </div>\n    </div> <!-- /clearfix -->\n  </fieldset>\n  " + saveHtml + "\n</form>";
      formEl = $("  <ul class=\"pills\">\n    <li class=\"active\"><a href=\"#\" class=\"hours\">Hours</a></li>\n    <li><a href=\"#\" class=\"contact\">Contact</a></li>\n    <li><a href=\"#\" class=\"header-info\">Header</a></li>\n  </ul>\n  <div class=\"form-toggler\">\n    <div class=\"form-togglee hours\">\n     " + hoursHtml + "\n    </div>\n    <div class=\"form-togglee contact\">\n     " + contactHtml + "\n    </div>\n    <div class=\"form-togglee header-info\">\n     " + headerHtml + "\n    </div>\n  </div>\n");
      formEl.find(".form-togglee").hide();
      formEl.find(".form-togglee.hours").show();
      formEl.find("li a").bind("click", function(e) {
        var klass;
        e.preventDefault();
        klass = $(this).attr("class");
        console.log(klass);
        formEl.find(".form-togglee").hide();
        formEl.find("li").removeClass("active");
        formEl.find("li a." + klass).parents("li").eq(0).addClass("active");
        return formEl.find(".form-togglee." + klass).show();
      });
      formEl.find("form").bind("submit", function(e) {
        return e.preventDefault();
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
