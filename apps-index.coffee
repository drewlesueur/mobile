$ ->
  app = require("mobile-app-presenter")()
  app.loadApp location.hash.slice(1), () ->
    $(document.body).append app.getEl()
