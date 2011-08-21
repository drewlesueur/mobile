(function() {
  $(function() {
    var app;
    app = require("mobile-app-presenter")();
    return app.loadApp(location.hash.slice(1), function() {
      return $(document.body).append(app.getEl());
    });
  });
}).call(this);
