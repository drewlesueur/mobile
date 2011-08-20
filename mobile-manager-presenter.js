(function() {
  var __slice = Array.prototype.slice;
  define("mobile-manager-presenter", function() {
    var infoViewMaker, mobileAppMaker, mobileAppPresenterMaker, mobileAppPresenterViewMaker, mobileAppViewMaker, mobileManagerPresenter, mobileManagerView;
    mobileManagerView = require("mobile-manager-view");
    mobileAppMaker = require("mobile-app");
    mobileAppViewMaker = require("mobile-app-view");
    mobileAppPresenterMaker = require("mobile-app-presenter");
    mobileAppPresenterViewMaker = require("mobile-app-presenter-view");
    infoViewMaker = require("info-view");
    return mobileManagerPresenter = function() {
      var addApp, apps, clear, info, infoView, load, navMap, newApp, self, view;
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
        view.clearNav();
        view.clearApps();
        loading = info("loading mobile sites");
        return mobileAppMaker.find(function(err, _apps) {
          apps = [];
          console.log(_apps);
          _.each(_apps, function(app, index) {
            app = mobileAppMaker(app);
            return addApp(app);
          });
          return clear(loading);
        });
      };
      addApp = function(mobileApp) {
        var mobileAppPresenter;
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
        return mobileAppPresenter.on("remove", function() {
          return mobileAppPresenter.view.remove();
        });
      };
      newApp = function() {
        var mobileApp, saving;
        view.clearNav();
        mobileApp = mobileAppMaker({
          name: prompt("name")
        });
        saving = info("initiating new app");
        return mobileApp.save(function() {
          addApp(mobileApp);
          return clear(saving);
        });
      };
      load();
      navMap = {
        "new": newApp,
        load: load
      };
      view.on("nav", function(place) {
        var fn;
        fn = navMap[place];
        return typeof fn === "function" ? fn() : void 0;
      });
      view.initNav();
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
