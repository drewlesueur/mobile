define "mobile-app-view", () ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  eventer = require "drews-event"
  mobileAppViewMaker = (self={}) ->
    self = eventer self
    el = $ """
      <div>hi</div>
    """
    self.getEl = -> el





    self
