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
      var addItems, addSpecials, displayDirections, displayHours, displayItems, displaySpecials, emit, extraStyles, initHome, model, nav, navItems, self, showPage;
      model = options.model;
      self = eventer({});
      emit = self.emit;
      extraStyles = $("<style>\n  .top-bar, .top-bar a {\n    color: " + model.headerTextColor + " \n  }\n  body {\n    color: " + model.bodyTextColor + " \n  }\n  .second-bar, .second-bar a {\n    color: " + model.secondBarTextColor + "\n  }\n\n  .promo-wrapper {\n    color: " + model.promoTextColor + "\n  }\n\n  .nav-item {\n    color: " + model.buttonsTextColor + "\n  }\n\n  .item .title {\n    color: " + model.menuTitleTextColor + "\n  }\n\n  .item .price{\n    color: " + model.menuPriceTextColor + "\n  }\n\n  .item .description{\n    color: " + model.menuDescriptionTextColor + "\n  }\n  \n  .menu-gradient {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.menuColor1 + "), color-stop(1," + model.menuColor2 + "));\n  }\n\n  .header-gradient {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.headerColor1 + "), color-stop(1," + model.headerColor2 + "));\n    \n  }\n\n  .second-bar-gradient {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.secondBarColor1 + "), color-stop(1," + model.secondBarColor2 + "));\n    \n  }\n\n  .tile {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.bodyColor1 + "), color-stop(1," + model.bodyColor2 + "));\n    \n  }\n\n  .promo-gradient {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.promoColor1 + "), color-stop(1," + model.promoColor2 + "));\n  }\n\n</style>");
      extraStyles.appendTo($("head"));
      $("h1").bind("click", function() {
        return location.href = "#";
      });
      showPage = function(className) {
        $(".content .tile").hide();
        $(".content .tile." + className).show();
        if (className === "home") {
          className = "";
        }
        return $(".headline").text(navItems[className]);
      };
      $(".content").append("<div class=\"clear\"></div>");
      navItems = {
        specials: "Specials",
        menu: model.itemsText,
        map: "Map",
        hours: "Hours",
        call: "Call Us",
        facebook: "facebook",
        twitter: "Twitter",
        "": model.headline
      };
      nav = self.nav = function(className) {
        var existingPhone, phone;
        scrollTo(0, 0, 1);
        if (className === "") {
          className = "home";
        }
        if (className === "specials") {
          existingPhone = localStorage.existingPhone;
          if (existingPhone != null ? existingPhone.match(/[\d]{10}/) : void 0) {
            showPage("specials");
            return;
          }
          phone = prompt("Enter your 10 digit phone number to view the Specials!");
          if (phone) {
            phone = phone.replace(/[^\d]/g, "");
            if (!phone.match(/[\d]{10}/)) {
              alert("Phone number must be 10 digits.");
              nav("specials");
              return;
            }
            emit("phone", phone);
            localStorage.existingPhone = phone;
            return showPage("specials");
          } else {
            return location.href = "#";
          }
        } else {
          return showPage(className);
        }
      };
      initHome = function() {
        var navHtml, promoImage, router, routes;
        routes = {};
        navHtml = "";
        _.each(navItems, function(navItemText, navItem) {
          var href;
          console.log(navItemText);
          console.log(navItem);
          routes[navItem] = function() {
            return nav(navItem);
          };
          if (navItem === "") {
            return;
          }
          href = "#" + navItem;
          if (navItem === "call") {
            href = "tel:" + model.phone;
          }
          if (navItem === "twitter") {
            if (model.twitterUrl) {
              href = model.twitterUrl;
            } else {
              return;
            }
          }
          if (navItem === "facebook") {
            if (model.facebookUrl) {
              href = model.facebookUrl;
            } else {
              return;
            }
          }
          return navHtml += "<div>\n<a class=\"nav-item\" data-nav=\"" + navItem + "\" href=\"" + href + "\" style=\"background-image: url('http://drewl.us:8010/icons/" + navItem + ".png')\">\n  <span>" + (_.capitalize(navItemText)) + "</span>\n</a>\n</div>";
        });
        if (model.promo) {
          promoImage = "<img src=\"" + model.promo + "\" />";
        } else {
          promoImage = "";
        }
        navHtml = $("<div class=\"home tile hidden\">\n  <div class=\"promo\" style=\"position:absolute;\">\n    " + promoImage + "\n    <div class=\"promo-wrapper promo-gradient\" style=\"display:none;\">\n      <div class=\"promo-text paddinglr\">\n        " + model.promoText + "\n      </div>\n      <form class=\"phone-form paddinglr\" action=\"/\" method=\"POST\">\n        <div class=\"clearfix\">\n          <div class=\"input\">\n            <input id=\"phone\" name=\"phone\" type=\"tel\">\n            <input class=\"send\" type=\"submit\" value=\"Send\">\n          </div>\n        </div> <!-- /clearfix -->\n      </form>\n    </div>\n  </div>\n  <div class=\"nav\">\n    " + navHtml + "\n  </div>\n  <div class=\"clear\">\n  <br />\n  <br />\n<a class=\"full-site\" href=\"" + model.fullUrl + "\">Full Site</a><a href=\"javascript:delete localStorage.existingPhone;void(0);\">.</a>\n</div>");
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
        var itemsTable;
        itemsTable = " \n<div class=\"items-table\">\n\n</div>";
        return $(".content").append("<div class=\"menu tile hidden\">" + itemsTable + "</hours>");
      };
      displayItems();
      addItems = self.addItems = function(items) {
        return _.each(items, function(item) {
          return $(".content .menu").append($("<div class=\"item menu-gradient\">\n    <img class=\"left paddingr\"  src=\"" + (item.image || model.headerUrl) + "\" />\n    <div class=\"title\">" + (item.title || "") + "</div>\n    <div class=\"price\">" + (item.price || "") + "</div>\n  <div class=\"clear\"></div>\n    <div class=\"description\">" + (item.description || "") + "</div>\n</div>"));
        });
      };
      displaySpecials = function() {
        var itemsTable;
        itemsTable = " \n<div class=\"items-table\">\n\n</div>";
        return $(".content").append("<div class=\"specials tile hidden\">" + itemsTable + "</hours>");
      };
      displaySpecials();
      addSpecials = self.addSpecials = function(items) {
        return _.each(items, function(item) {
          return $(".content .specials").append($("<div class=\"item menu-gradient\">\n    <img class=\"left paddingr\"  src=\"" + (item.image || model.headerUrl) + "\" />\n    <div class=\"title\">" + (item.title || "") + "</div>\n    <div class=\"price\">" + (item.price || "") + "</div>\n  <div class=\"clear\"></div>\n    <div class=\"description\">" + (item.description || "") + "</div>\n</div>"));
        });
      };
      self.doHours = function() {
        var closeText, closeTime, date, day, isEvenOpen, openText, openTime, time;
        date = new Date();
        day = days[date.getDay()];
        isEvenOpen = model["" + day + "Open"];
        if (!isEvenOpen) {
          return $(".open").html("<a href=\"#hours\">Hours</a>");
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
        items = items.sort(function(a, b) {
          return a.order - b.order;
        });
        return view.addItems(items);
      });
      severus.find("specials", function(err, items) {
        items = items.sort(function(a, b) {
          return a.order - b.order;
        });
        return view.addSpecials(items);
      });
      return view.on("phone", function(phone) {
        return severus.save("phones", {
          phone: phone
        }, function(err) {});
      });
    };
    return AppPresenter;
  });
  AppPresenter = require("app-presenter");
  $(function() {
    AppPresenter.init();
    return drews.wait(1000, function() {
      return scrollTo(0, 0, 1);
    });
  });
}).call(this);
