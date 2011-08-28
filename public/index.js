(function() {
  var $, AppPresenter, drews;
  define("zepto", function() {
    return Zepto;
  });
  define("underscore", function() {
    return _;
  });
  $ = require("zepto");
  drews = require("drews-mixins");
  define("app-view", function() {
    var AppView, Router, days, daysMonday, getDayRow, timeToMili;
    days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    daysMonday = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    timeToMili = function(time, date) {
      var am, hours, minutes, newDate, pm;
      if (date == null) {
        date = new Date();
      }
      pm = _.s(time, -2, 2) === "pm";
      am = _.s(time, -2, 2) === "am";
      hours = 0;
      minutes = 0;
      if (am || pm) {
        time = _.s(time, 0, -2);
      }
      if (time.indexOf(":") >= 0) {
        time = time.split(":");
        hours = time[0];
        minutes = time[1];
      } else {
        hours = time;
      }
      if (pm) {
        hours += 12;
      }
      newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
      return newDate.getTime();
    };
    getDayRow = function(day, model) {
      var dayHtml, hoursHtml;
      if (model[day + "Open"]) {
        hoursHtml = "<td align=\"right\">" + model["" + day + "Start"] + "</td>\n<td> to </td>\n<td align=\"right\">" + model["" + day + "End"] + "</td>";
      } else {
        hoursHtml = "<td> Closed </td>";
      }
      return dayHtml = "<tr>\n  <td>" + (_.capitalize(day)) + "</td>\n    " + hoursHtml + "\n</tr>";
    };
    Router = require("router");
    AppView = {};
    AppView.init = function(options) {
      var displayHours, initNav, model, nav, self;
      model = options.model;
      self = {};
      nav = self.nav = function(className) {
        console.log("naving {" + className + "}");
        if (className === "") {
          className = "nav";
          console.log("yea");
        }
        $(".content .tile").hide();
        return $(".content .tile." + className).show();
      };
      initNav = function() {
        var navHtml, navItems, router, routes;
        navItems = ["hours", "items", "directions", "facebook", "twitter", ""];
        routes = {};
        navHtml = "";
        _.each(navItems, function(navItem) {
          routes[navItem] = function() {
            return nav(navItem);
          };
          return navHtml += "<div>\n<a href=\"#" + navItem + "\">" + (_.capitalize(navItem)) + "</a>\n</div>";
        });
        navHtml = "<div class=\"nav tile\">\n  " + navHtml + "\n</div>";
        router = Router.init(routes);
        router.initHashWatch();
        return $(".content").append(navHtml);
      };
      initNav();
      displayHours = function() {
        var day, dayRows, hoursTable, _i, _len;
        dayRows = "";
        for (_i = 0, _len = daysMonday.length; _i < _len; _i++) {
          day = daysMonday[_i];
          dayRows += getDayRow(day, model);
        }
        hoursTable = " \n<table>\n  <tbody>\n    " + dayRows + "\n  </tbody>\n</table>";
        return $(".content").append("<div class=\"hours tile hidden\">" + hoursTable + "</hours>");
      };
      displayHours();
      self.doHours = function() {
        var closeText, closeTime, date, day, isEvenOpen, openText, openTime, time;
        date = new Date();
        day = days[date.getDay()];
        isEvenOpen = model["" + day + "Open"];
        if (!isEvenOpen) {
          return $(".open").text("Closed on " + (_.capitalize(day)) + "s");
        }
        openText = model["" + day + "Start"];
        closeText = model["" + day + "End"];
        openTime = timeToMili(openText);
        closeTime = timeToMili(closeText);
        time = drews.time();
        console.log(new Date(openTime).getHours());
        console.log(new Date(time).getHours());
        if (time >= openTime && time <= closeTime) {
          return $(".open").text("We are open until " + closeText);
        } else {
          return $(".open").text("Closed");
        }
      };
      return self;
    };
    return AppView;
  });
  define("app-presenter", function() {
    var AppPresenter, AppView, model;
    model = require("model");
    AppView = require("app-view");
    AppPresenter = {};
    AppPresenter.init = function() {
      var view;
      view = AppView.init({
        model: model
      });
      return view.doHours();
    };
    return AppPresenter;
  });
  AppPresenter = require("app-presenter");
  $(function() {
    return AppPresenter.init();
  });
}).call(this);
