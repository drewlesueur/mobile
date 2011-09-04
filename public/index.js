(function() {
  var $, AppPresenter, drews, eventer, severus;
  define("zepto", function() {
    return Zepto;
  });
  define("underscore", function() {
    return _;
  });
  define("nimble", function() {
    return _;
  });
  $ = require("zepto");
  drews = require("drews-mixins");
  severus = require("severus2")();
  eventer = require("drews-event");
  define("app-view", function() {
    var AppView, Router, days, daysMonday, getDayRow, timeToMili;
    days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    daysMonday = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    timeToMili = function(time, date) {
      var am, hours, minutes, newDate, pm, ret;
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
        hours = hours - 0 + 12;
      }
      console.log(pm);
      console.log(hours);
      newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
      return ret = newDate.getTime();
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
      var addItems, displayDirections, displayHours, displayItems, emit, initHome, model, nav, self;
      model = options.model;
      self = eventer({});
      emit = self.emit;
      $("h1").bind("click", function() {
        return location.href = "#";
      });
      $(".content").append("<div class=\"clear\"></div>");
      nav = self.nav = function(className) {
        if (className === "") {
          className = "home";
        }
        $(".content .tile").hide();
        $(".content .tile." + className).show();
        console.log($(".content .tile." + className));
        return console.log(className);
      };
      initHome = function() {
        var navHtml, navItems, router, routes;
        navItems = {
          menu: model.itemsText.toLowerCase(),
          map: "map",
          hours: "hours",
          call: "call us",
          facebook: "check in",
          twitter: "twitter",
          "": ""
        };
        routes = {};
        navHtml = "";
        _.each(navItems, function(navItemText, navItem) {
          var href;
          console.log(navItemText);
          console.log(navItem);
          routes[navItem] = function() {
            return nav(navItem);
          };
          href = "#" + navItem;
          if (navItem === "call") {
            href = "tel:" + model.phone;
          }
          return navHtml += "<div>\n<a class=\"nav-item\" data-nav=\"" + navItem + "\" href=\"" + href + "\" style=\"background: url('http://drewl.us:8010/icons/" + navItem + ".png')\">" + (_.capitalize(navItemText)) + "</a>\n</div>";
        });
        navHtml = $("<div class=\"home tile hidden\">\n  <div class=\"promo\">\n    <img src=\"" + model.promo + "\" />\n    <div class=\"promo-text paddinglr\">\n      " + model.promoText + "\n    </div>\n    <form class=\"phone-form paddinglr\" action=\"/\" method=\"POST\">\n      <div class=\"clearfix\">\n        <div class=\"input\">\n          <input id=\"phone\" name=\"phone\" type=\"tel\">\n          <input class=\"send\" type=\"submit\" value=\"Send\">\n        </div>\n      </div> <!-- /clearfix -->\n    </form>\n  </div>\n  " + navHtml + "\n</div>");
        $(".content").append(navHtml);
        navHtml.find("form").bind("submit", function(e) {
          e.preventDefault();
          return emit("phone", $("#phone").val());
        });
        router = Router.init(routes);
        return router.initHashWatch();
      };
      displayDirections = function() {
        var directionsHtml, htmlAddress, urlAddress;
        urlAddress = encodeURIComponent(model.address.replace(/\n/g, " "));
        htmlAddress = model.address.replace(/\n/g, "<br />");
        directionsHtml = "<div class=\"tile map hidden\">\n  <div class=\"paddinglr\">" + htmlAddress + "</div>\n\n  <!--<a target=\"blank\" href=\"http://maps.google.com/maps?daddr=" + urlAddress + "\">Google Map Directions</a>-->\n  <a target=\"blank\" href=\"http://maps.google.com/maps?q=" + urlAddress + "\">\n  <img src=\"http://maps.googleapis.com/maps/api/staticmap?center=" + urlAddress + "&zoom=14&size=320x320&markers=color:red|" + urlAddress + "&maptype=roadmap&sensor=false\" />\n  </a>\n</div>";
        return $(".content").append(directionsHtml);
      };
      displayDirections();
      displayHours = function() {
        var day, dayRows, hoursTable, _i, _len;
        dayRows = "";
        for (_i = 0, _len = daysMonday.length; _i < _len; _i++) {
          day = daysMonday[_i];
          dayRows += getDayRow(day, model);
        }
        hoursTable = " \n<table class=\"paddinglr\">\n  <tbody>\n    " + dayRows + "\n  </tbody>\n</table>";
        return $(".content").append("<div class=\"hours tile hidden\">" + hoursTable + "</hours>");
      };
      displayHours();
      displayItems = function() {
        var day, dayRows, itemsTable, _i, _len;
        dayRows = "";
        for (_i = 0, _len = daysMonday.length; _i < _len; _i++) {
          day = daysMonday[_i];
          dayRows += getDayRow(day, model);
        }
        itemsTable = " \n<div class=\"items-table\">\n\n</div>";
        return $(".content").append("<div class=\"items tile hidden\">" + itemsTable + "</hours>");
      };
      displayItems();
      addItems = self.addItems = function(items) {
        return _.each(items, function(item) {
          return $(".content .menu").append($("<div class=\"item\">\n    <img style=\"float:left;\" src=\"" + (item.url || model.headerUrl) + "\" />\n    <div class=\"title\">" + (item.title || "") + "</div>\n    <div class=\"price\">" + (item.price || "") + "</div>\n  <div class=\"clear\"></div>\n    <div class=\"description\">" + (item.description || "") + "</div>\n</div>"));
        });
      };
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
        if (time >= openTime && time <= closeTime) {
          return $(".open").html("Open 'til <a href=\"#hours\">" + closeText + "</a>");
        } else {
          return $(".open").html("<a href=\"#hours\">Hours</a>");
        }
      };
      initHome();
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
      severus.db = "mobilemin_" + model.name;
      view = AppView.init({
        model: model
      });
      view.doHours();
      severus.find("items", function(err, items) {
        return view.addItems(items);
      });
      return view.on("phone", function(phone) {
        alert(phone);
        return severus.save("phones", {
          phone: phone
        }, function(err) {
          return alert("Thank you");
        });
      });
    };
    return AppPresenter;
  });
  AppPresenter = require("app-presenter");
  $(function() {
    return AppPresenter.init();
  });
}).call(this);
