(function() {
  define("router", function() {
    var Router, _;
    _ = require("underscore");
    Router = {};
    Router.init = function(routes) {
      var addRoute, checkUrl, escapeRegExp, extractParameters, namedParam, oldHash, routeToRegExp, routesList, self, splatParam, testRoutes, watching;
      self = {};
      routes || (routes = {
        test: function(frag) {
          return alert("that was a test " + frag);
        },
        "app/:what": function(what2, what) {
          return alert(what);
        }
      });
      watching = true;
      namedParam = /:([\w\d]+)/g;
      splatParam = /\*([\w\d]+)/g;
      escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;
      routeToRegExp = function(route) {
        route = route.replace(escapeRegExp, "\\$&").replace(namedParam, "([^\/]*)").replace(splatParam, "(.*?)");
        return new RegExp('^' + route + '$');
      };
      extractParameters = function(route, actualFragment) {
        return route.exec(actualFragment).slice();
      };
      routesList = [];
      addRoute = self.addRoute = function(route, callback) {
        var newCallback;
        if (!(_.isRegExp(route))) {
          route = routeToRegExp(route);
        }
        newCallback = function(actualFragment) {
          var args;
          args = extractParameters(route, actualFragment);
          return callback.apply(null, args);
        };
        return routesList.push([route, newCallback]);
      };
      _.each(routes, function(callback, route) {
        return addRoute(route, callback);
      });
      testRoutes = self.testRoutes = function(fragment) {
        return _.any(routesList, function(_arg) {
          var callback, route;
          route = _arg[0], callback = _arg[1];
          if (route.test(fragment)) {
            callback(fragment);
            return true;
          }
        });
      };
      oldHash = "";
      checkUrl = function(callback) {
        var hash;
        hash = location.hash.slice(1);
        if (hash !== oldHash) {
          callback();
        }
        return oldHash = hash;
      };
      self.disable = function() {
        return watching = false;
      };
      self.enable = function() {
        return watching = true;
      };
      self.initHashWatch = function(callback) {
        callback || (callback = function(e) {
          var hash;
          hash = location.hash.slice(1);
          if (watching) {
            return testRoutes(hash);
          }
        });
        callback();
        if ("onhashchange" in window) {
          return $(window).bind("hashchange", callback);
        } else {
          return setInterval((function() {
            return checkUrl(callback);
          }), 50);
        }
      };
      return self;
    };
    return Router;
  });
}).call(this);
