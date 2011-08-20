define "mobile-app-presenter-view", () ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  eventer = require "drews-event"
  mobileAppPresenterViewMaker = (self={}) ->
    self = eventer self
    {model, emit} = self
    console.log model
    name = model.get "name"
    el = $ """
      <li>
        <a href="##{name}">#{name}</a> <a class="remove" href="#">[delete]</a>
      </li>
    """
    el.find(".remove").bind "click", () ->
      if confirm "Are you sure you want to delete #{name}?"
        emit "remove"
    self.getEl = -> el
    self.remove = () ->
      el.remove()






    self
