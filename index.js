(function() {
  $(function() {
    var app;
    app = require("mobile-manager-presenter")();
    $(document.body).find(".body-wrapper").append(app.getEl());
    return $(document.body).append(app.getInfoEl());
  });
}).call(this);
