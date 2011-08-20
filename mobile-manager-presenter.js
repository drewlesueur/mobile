(function() {
  var __slice = Array.prototype.slice;
  define("mobile-manager-presenter", function() {
    var infoViewMaker, mobileAppMaker, mobileAppPresenterMaker, mobileAppPresenterViewMaker, mobileAppViewMaker, mobileManagerPresenter, mobileManagerView, routerMaker;
    mobileManagerView = require("mobile-manager-view");
    mobileAppMaker = require("mobile-app");
    mobileAppViewMaker = require("mobile-app-view");
    mobileAppPresenterMaker = require("mobile-app-presenter");
    mobileAppPresenterViewMaker = require("mobile-app-presenter-view");
    infoViewMaker = require("info-view");
    routerMaker = require("router");
    return mobileManagerPresenter = function() {
      var addApp, apps, clear, info, infoView, load, loadApp, loadAppByName, newApp, router, self, view;
      self = {};
      view = mobileManagerView();
      apps = [];
      infoView = infoViewMaker();
      info = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return infoView.info.apply(infoView, args);
      };
      clear = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return infoView.clear.apply(infoView, args);
      };
      load = self.load = function() {
        var loading;
        view.clearApps();
        loading = info("loading mobile sites");
        return mobileAppMaker.find(function(err, _apps) {
          apps = [];
          console.log(_apps);
          _.each(_apps, function(app, index) {
            app = mobileAppMaker(app);
            return addApp(app);
          });
          clear(loading);
          return view.initNav();
        });
      };
      addApp = function(mobileApp) {
        var mobileAppPresenter, saving;
        apps.push(mobileApp);
        mobileAppPresenter = mobileAppPresenterMaker();
        mobileAppPresenter.setApp(mobileApp);
        mobileAppPresenter.view = mobileAppPresenterViewMaker({
          model: mobileAppPresenter
        });
        view.addApp(mobileAppPresenter);
        mobileAppPresenter.view.on("remove", function() {
          var deleting;
          deleting = info("Removing " + (mobileAppPresenter.get("name")));
          return mobileAppPresenter.remove(function(err) {
            return clear(deleting);
          });
        });
        mobileAppPresenter.on("remove", function() {
          return mobileAppPresenter.view.remove();
        });
        saving = null;
        mobileApp.on("saving", function() {
          return saving = info("saving " + (mobileApp.get("name")));
        });
        return mobileApp.on("save", function() {
          return clear(saving);
        });
      };
      newApp = function() {
        var mobileApp, saving;
        mobileApp = mobileAppMaker({
          name: prompt("name")
        });
        saving = info("initiating new app");
        return mobileApp.save(function() {
          addApp(mobileApp);
          return clear(saving);
        });
      };
      loadApp = function(mobileApp) {
        return view.showApp(mobileApp);
      };
      loadAppByName = function(path, name) {
        var found, mobileApp;
        mobileApp = null;
        found = _.any(apps, function(app) {
          console.log("checking " + (app.get("name")) + " == " + name);
          if (app.get("name") === name) {
            mobileApp = app;
            return true;
          }
        });
        if (found) {
          console.log(mobileApp);
          return loadApp(mobileApp);
        }
      };
      load();
      router = routerMaker({
        load: load,
        "apps/:name": loadAppByName
      });
      view.on("nav", function(place) {
        return router.testRoutes(place);
      });
      view.on("new", newApp);
      self.getEl = function() {
        return view.getEl();
      };
      self.getInfoEl = function() {
        return infoView.getEl();
      };
      return self;
    };
  });
}).call(this);
