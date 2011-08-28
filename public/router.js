(function() {
  define("router", function() {
    var Router, _;
    _ = require("underscore");
    Router = {};
    Router.init = function(routes) {
      var addRoute, escapeRegExp, extractParameters, namedParam, routeToRegExp, routesList, self, splatParam, testRoutes;
      self = {};
      routes || (routes = {
        test: function(frag) {
          return alert("that was a test " + frag);
        },
        "app/:what": function(what2, what) {
          return alert(what);
        }
      });
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
      self.initHashWatch = function(callback) {
        callback || (callback = function(e) {
          var hash;
          hash = location.hash.slice(1);
          console.log("hash is ");
          console.log(hash);
          return testRoutes(hash);
        });
        callback();
        return $(window).bind("hashchange", callback);
      };
      return self;
    };
    return Router;
  });
}).call(this);
