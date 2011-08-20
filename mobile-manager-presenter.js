(function() {
  define("mobile-manager-presenter", function() {
    var mobileManagerPresenter;
    return mobileManagerPresenter = function() {
      var apps, mobileAppMaker, mobileManagerView, self, view;
      mobileManagerView = require("mobile-manager-view");
      mobileAppMaker = require("mobile-app");
      self = {};
      view = mobileManagerView();
      apps = [];
      mobileAppMaker.find(function(err, _apps) {
        apps = [];
        return _.each(_apps, function(app, index) {
          apps.push(app);
          return view.addAppToList(app);
        });
      });
      return self;
    };
  });
}).call(this);
