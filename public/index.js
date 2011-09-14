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
      var activeTile, addDirectionsPage, addHomePage, addHoursPage, addMenuPage, addSpecialsPage, content, cubed, defaultEasing, doEasing, easingMaker, emit, extraStyles, getXY, lastContentTransform, mapText, menuMaker, model, nav, navItems, pushToTop, self, showPage, squared, testEasing, touch, touchEnd, touchMove, touchStart, touching;
      model = options.model;
      self = eventer({});
      emit = self.emit;
      $(document.body).append("<div class=\"content content-gradient scrollable2 horizontal2 paginated2\"></div>");
      extraStyles = $("<style>\n  \n  .phone-bar a {\n    color: " + model.phoneColor + "  \n  }\n\n  body {\n    color: " + model.bodyTextColor + ";\n    background-image: url('" + model.backgroundImage + "');\n    background-repeat: no-repeat;\n  }\n  \n  .headline {\n    color: " + model.headlineColor + "\n  }\n\n\n  .promo-wrapper {\n    color: " + model.promoTextColor + "\n  }\n\n  .nav-item, .full-site {\n    color: " + model.buttonsTextColor + "\n  }\n\n  .item .title {\n    color: " + (model.menuTitleTextColor || "black") + "\n  }\n\n  .item .price{\n    color: " + (model.menuPriceTextColor || "gray") + "\n  }\n\n  .item .description{\n    color: " + model.menuDescriptionTextColor + "\n  }\n  \n  .menu-gradient {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + (model.menuColor1 || "white") + "), color-stop(1," + (model.menuColor2 || "#EFEFEF") + "));\n  }\n\n\n  .tile {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.bodyColor1 + "), color-stop(1," + model.bodyColor2 + "));\n    \n  }\n\n  .promo-gradient {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.promoColor1 + "), color-stop(1," + model.promoColor2 + "));\n  }\n\n</style>");
      extraStyles.appendTo($("head"));
      $("h1").bind("click", function() {
        return location.href = "#";
      });
      showPage = function(className) {
        var phoneText;
        $(".content .tile." + className).show();
        if (className === "home") {
          className = "";
        }
        if (className !== "") {
          phoneText = model.phone;
        } else {
          phoneText = "";
        }
        return $(".headline").html("<div class=\"left\">" + navItems[className] + "</div>\n\n<div class=\"right phone-bar\"><a href=\"tel:" + phoneText + "\">" + phoneText + "</a></div>");
      };
      if (model.address) {
        mapText = "Map";
      } else {
        mapText = "Locations";
      }
      navItems = {
        specials: "Specials",
        menu: model.itemsText,
        map: mapText,
        hours: "Hours",
        phone: "<span style=\"\">" + model.phone + "</span>",
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
      addHomePage = function() {
        var navHtml, router, routes;
        routes = {};
        navHtml = "";
        _.each(navItems, function(navItemText, navItem) {
          var href, navItemUrl;
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
          navItemUrl = model[navItem + "Icon"] || ("http://drewl.us:8010/icons/" + navItem + ".png");
          return navHtml += "<a class=\"nav-item\" data-nav=\"" + navItem + "\" href=\"" + href + "\" style=\"background-image: url('" + navItemUrl + "')\">\n  <span>" + (_.capitalize(navItemText)) + "</span>\n</a>";
        });
        navHtml = $("<div class=\"home tile page2\" data-page=\"home\">\n  <div class=\"nav\">\n    " + navHtml + "\n  </div>\n  <div class=\"clear\">\n  <br />\n  <br />\n<a class=\"full-site\" href=\"" + model.fullUrl + "\">Full Site</a><a class=\"full-site\" href=\"javascript:delete localStorage.existingPhone;void(0);\">.</a>\n</div>");
        $(".content").append(navHtml);
        navHtml.find("form").bind("submit", function(e) {
          e.preventDefault();
          return emit("phone", $("#phone").val());
        });
        router = Router.init(routes);
        return router.initHashWatch();
      };
      addDirectionsPage = function() {
        var directionsHtml, htmlAddress, urlAddress;
        urlAddress = encodeURIComponent(model.address.replace(/\n/g, " "));
        htmlAddress = model.address.replace(/\n/g, "<br />");
        directionsHtml = "<div class=\"tile map page2\" data-page=\"map\">\n  <div class=\"paddinglr\">" + htmlAddress + "</div>\n\n  <!--<a target=\"blank\" href=\"http://maps.google.com/maps?daddr=" + urlAddress + "\">Google Map Directions</a>-->\n  <a target=\"blank\" href=\"http://maps.google.com/maps?q=" + urlAddress + "\">\n  <img src=\"http://maps.googleapis.com/maps/api/staticmap?center=" + urlAddress + "&zoom=14&size=320x320&markers=color:red|" + urlAddress + "&maptype=roadmap&sensor=false\" />\n  </a>\n</div>";
        return $(".content").append(directionsHtml);
      };
      addHoursPage = function() {
        var day, dayRows, hoursTable, _i, _len;
        dayRows = "";
        for (_i = 0, _len = daysMonday.length; _i < _len; _i++) {
          day = daysMonday[_i];
          dayRows += getDayRow(day, model);
        }
        hoursTable = " \n<table class=\"paddinglr\">\n  <tbody>\n    " + dayRows + "\n  </tbody>\n</table>";
        return $(".content").append("<div class=\"hours tile page2\" data-page=\"hours\">" + hoursTable + "</hours>");
      };
      menuMaker = function(name) {
        var addMenuPage;
        addMenuPage = function() {
          var itemsTable;
          itemsTable = " \n<div class=\"items-table\">\n\n</div>";
          return $(".content").append("<div class=\"" + name + " tile page2 scrollable2 vertical2\" data-page=\"" + name + "\">" + itemsTable + "</hours>");
        };
        self["add" + drews.capitalize(name)] = function(items) {
          return _.each(items, function(item) {
            return $(".content ." + name).append($("<div class=\"item menu-gradient\">\n    <div class=\"left\">\n      <img class=\"\"  src=\"" + (item.image || model.headerUrl) + "\" />\n    </div>\n    <div class=\"right relative\">\n      <div class=\"item-top-bar relative\">\n        <div class=\"title\">" + (item.title || "") + "</div>\n        <div class=\"price\">" + (item.price || "") + "</div>\n      </div>\n      <div class=\"description\">" + (item.description || "") + "</div>\n    </div>\n    <div class=\"clear\"></div>\n</div>"));
          });
        };
        return addMenuPage;
      };
      addSpecialsPage = menuMaker("specials");
      addMenuPage = menuMaker("menu");
      self.calcHours = function() {
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
          openText = "Open til " + (drews.s(closeText, 0, -2));
        } else {
          openText = "<a href=\"#hours\">Hours</a>";
        }
        $(".hours").text(openText);
        return $("[data-nav=hours] > span").html(openText);
      };
      addHomePage();
      addSpecialsPage();
      addMenuPage();
      addDirectionsPage();
      addHoursPage();
      cubed = function(x) {
        return Math.pow(x, 3);
      };
      squared = function(x) {
        return Math.pow(x, 2);
      };
      easingMaker = function(x2, y2, x3, y3) {
        var x1, x4, y1, y4, _ref;
        _ref = [0, 0, 1, 1], x1 = _ref[0], y1 = _ref[1], x4 = _ref[2], y4 = _ref[3];
        return function(t) {
          var newX;
          newX = cubed(1 - t) * x1 + 3 * squared(1 - t) * t * x2 + 3 * (1 - t) * squared(t) * x3 + cubed(t) + x4;
          return newX - 1;
        };
      };
      defaultEasing = easingMaker(0, 1, 1, 0);
      testEasing = function() {
        var ii, _results;
        _results = [];
        for (ii = 0; ii < 10; ii++) {
          _results.push(console.log("easing test " + (defaultEasing(ii / 10))));
        }
        return _results;
      };
      doEasing = function(info, callback, complete) {
        var duration, interval, time1, timer, timerFuncs, values;
        if (complete == null) {
          complete = function() {};
        }
        timerFuncs = {};
        values = info.values;
        duration = info.duration;
        _.each(values, function(_arg, key) {
          var diff, easing, end, start;
          start = _arg[0], end = _arg[1], easing = _arg[2];
          easing || (easing = defaultEasing);
          diff = end - start;
          return timerFuncs[key] = function(time) {
            return diff * easing(time) + start;
          };
        });
        time1 = new Date().getTime();
        interval = function() {
          var time, time2;
          time2 = new Date().getTime();
          values = {};
          time = (time2 - time1) / duration;
          _.each(timerFuncs, function(func, key) {
            return values[key] = func(time);
          });
          callback(null, values);
          if (time >= 1) {
            complete(null);
            clearInterval(timer);
          }
        };
        return timer = setInterval(interval, 0);
      };
      $(document).bind("scroll", function() {
        var x;
        return true;
        x = Math.round(window.pageXOffset / 320) * 320;
        doEasing({
          values: {
            x: [window.pageXOffset, x],
            y: [window.pageYOffset, 0]
          },
          duration: 500
        }, function(err, values) {
          return scrollTo(values.x, window.pageYOffset);
        });
        return $(".tile").each(function() {
          if (this === activeTile) {
            return;
          }
          return this.style.webkitTransform = "translate3d(0, " + window.pageYOffset + "px, 0)";
        });
      });
      pushToTop = function() {
        return $(".tile").each(function() {
          return this.style.webkitTransform = "translate3d(0, 0, 0)";
        });
      };
      getXY = function(el) {
        var matrix, transform;
        if (el == null) {
          el = null;
        }
        if (!el) {
          return [0, 0];
        }
        transform = getComputedStyle(el).webkitTransform;
        matrix = new WebKitCSSMatrix(transform);
        return [matrix.m41, matrix.m42];
      };
      content = $(".content")[0];
      touch = {};
      activeTile = $(".tile.home")[0];
      lastContentTransform = null;
      touchStart = function(e) {
        var activeTileTransform, toTransform, transform;
        activeTileTransform = getComputedStyle(activeTile).webkitTransform;
        activeTile.style.webkitTransform = activeTileTransform;
        activeTile.style.webkitTransition = "";
        transform = getComputedStyle(content).webkitTransform;
        toTransform = content.style.webkitTransform;
        content.style.webkitTransform = transform;
        content.style.webkitTransition = "";
        delete touch.yOnly;
        touch.transitionDone = true;
        touch.x1 = e.touches[0].pageX;
        touch.y1 = e.touches[0].pageY;
        touch.time0 = new Date().getTime();
        touch.time1 = new Date().getTime();
        touch.time2 = new Date().getTime();
        touch.x0 = touch.x1;
        touch.y0 = touch.y1;
        touch.x2 = touch.x1;
        return touch.y2 = touch.y1;
      };
      touchMove = function(e) {
        var contentX, contentY, distance, maxHeight, maxWidth, speed, tileX, tileY, time, x, x1, x2, xLen, y, y1, y2, yLen, _ref, _ref2;
        touch.x1 = touch.x2;
        touch.y1 = touch.y2;
        touch.time1 = touch.time2;
        touch.x2 = e.touches[0].pageX;
        touch.y2 = e.touches[0].pageY;
        _ref = getXY(content), contentX = _ref[0], contentY = _ref[1];
        touch.time2 = new Date().getTime();
        time = touch.time2 - touch.time1;
        x1 = touch.x1, x2 = touch.x2, y1 = touch.y1, y2 = touch.y2;
        xLen = x2 - x1;
        yLen = y2 - y1;
        x = Math.pow(xLen, 2);
        y = Math.pow(yLen, 2);
        distance = Math.pow(x + y, 0.5);
        speed = distance / time;
        e.preventDefault();
        if (!("yOnly" in touch)) {
          if (Math.abs(xLen) > Math.abs(yLen)) {
            touch.yOnly = false;
          } else {
            touch.yOnly = true;
          }
        }
        if (touch.yOnly) {
          _ref2 = getXY(activeTile), tileX = _ref2[0], tileY = _ref2[1];
          tileY = tileY + yLen;
          if (tileY > 0) {
            tileY = tileY - yLen;
            tileY = tileY + ((innerHeight - tileY) / innerHeight) * 0.38 * yLen;
          } else if ($(activeTile).height() <= innerHeight) {
            if (tileY < 0) {
              tileY = tileY - yLen;
              tileY = tileY + ((innerHeight - tileY) / innerHeight) * 0.38 * yLen;
            }
          } else {
            if (tileY < (maxHeight = -$(activeTile).height() + innerHeight)) {
              tileY = tileY - yLen;
              tileY = tileY + ((innerHeight - (tileY - maxHeight)) / innerHeight) * 0.38 * yLen;
            }
          }
          return activeTile.style.webkitTransform = "translate3d(" + 0 + ", " + tileY + "px, 0)";
        } else {
          contentX = contentX + xLen;
          if (contentX > 0) {
            1;
            contentX = contentX - xLen;
            contentX = contentX + ((innerWidth - contentX) / innerWidth) * 0.38 * xLen;
          }
          if (contentX <= (maxWidth = -$(".tile").length * 320 + innerWidth)) {
            contentX = contentX - xLen;
            contentX = contentX + ((innerWidth - (contentX - maxWidth)) / innerWidth) * 0.38 * xLen;
          }
          return content.style.webkitTransform = "translate3d(" + contentX + "px, " + 0 + "px, 0)";
        }
      };
      touchEnd = function(e) {
        var $tile, contentX, contentY, distance, index, minTranslateX, newDistance, newX, newXLen, newXNotRounded, newY, newYLen, speed, swipeAnimationSeconds, tile, tileHeight, tileIndex, tileX, tileY, time, x, x0, x1, x2, xLen, y, y0, y1, y2, yLen, _ref, _ref2, _ref3, _ref4;
        x0 = touch.x0, x1 = touch.x1, x2 = touch.x2, y0 = touch.y0, y1 = touch.y1, y2 = touch.y2;
        time = touch.time2 - touch.time1;
        xLen = x2 - x1;
        yLen = y2 - y1;
        x = Math.pow(xLen, 2);
        y = Math.pow(yLen, 2);
        distance = Math.pow(x + y, 0.5);
        speed = distance / time;
        newDistance = distance + speed * 100;
        if (distance !== 0) {
          newXLen = xLen * newDistance / distance;
          newYLen = yLen * newDistance / distance;
        } else {
          newXLen = 0;
          newYLen = 0;
        }
        _ref = getXY(content), contentX = _ref[0], contentY = _ref[1];
        _ref2 = getXY(activeTile), tileX = _ref2[0], tileY = _ref2[1];
        if (touch.yOnly) {
          newY = newYLen + tileY;
          newX = contentX;
        } else {
          newX = newXLen + contentX;
          newY = tileY;
        }
        swipeAnimationSeconds = 0.25;
        $tile = $(".tile");
        for (tileIndex = 0, _ref3 = $tile.length; 0 <= _ref3 ? tileIndex < _ref3 : tileIndex > _ref3; 0 <= _ref3 ? tileIndex++ : tileIndex--) {
          tile = $tile.get(tileIndex);
          tileHeight = $(tile).height();
          if (tile === activeTile) {
            tileY = newY;
          } else {
            _ref4 = getXY(tile), tileX = _ref4[0], tileY = _ref4[1];
          }
          if (tileHeight <= innerHeight) {
            if (tileY !== 0) {
              tileY = 0;
            }
          } else {
            if (tileY > 0) {
              tileY = 0;
            } else if (tileY <= -$(tile).height() + innerHeight) {
              tileY = -$(tile).height() + innerHeight;
            }
          }
          $(tile).anim({
            translate3d: "0, " + tileY + "px, 0"
          }, swipeAnimationSeconds, 'cubic-bezier(0.000, 0.000, 0.005, 0.9999)', function() {
            return touch.transitionDone = true;
          });
        }
        newXNotRounded = newX;
        index = -Math.round(newX / 320);
        newX = -index * 320;
        if (newX >= 320) {
          newX = 0;
          index = 0;
        } else {
          minTranslateX = -$(".tile").length * 320 + 320;
          if (newX <= minTranslateX) {
            newX = minTranslateX;
          }
          index = -Math.round(newX / 320);
        }
        activeTile = $(".content .tile").get(index);
        document.title = $(activeTile).attr("data-page");
        touch.transitionDone = false;
        return $(content).anim({
          translate3d: "" + newX + "px, " + 0 + "px, 0"
        }, swipeAnimationSeconds, 'cubic-bezier(0.000, 0.000, 0.005, 0.9999)', function() {
          return touch.transitionDone = true;
        });
      };
      touching = function() {
        $(document).bind("touchstart", touchStart);
        $(document).bind("touchmove", touchMove);
        return $(document).bind("touchend", touchEnd);
      };
      touching();
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
      severus.find("items", function(err, items) {
        items = items.sort(function(a, b) {
          return a.order - b.order;
        });
        return view.addMenu(items);
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
