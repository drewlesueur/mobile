$ ->
  app = require("mobile-manager-presenter")()
  $(document.body).append app.getEl()
  $(document.body).append app.getInfoEl()
