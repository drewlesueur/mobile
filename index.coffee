$ ->
  app = require("mobile-manager-presenter")()
  $(document.body).find(".body-wrapper").append app.getEl()
  $(document.body).append app.getInfoEl()
