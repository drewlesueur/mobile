# use a self or a big closure
# what is space
define "editable-form", () ->
  $ = require "jquery"
  _ = require "underscore"
  drews = require "drews-mixins"
  nimble = require "nimble"
  drews.bind = drews.on
  drewsEventMaker = require "drews-event"
  editableFormMaker = (html, model, options) ->
    self = 
      el : $ html
      model: model
    self = drewsEventMaker self
    triggeree = options?.triggeree or self
    self.setTriggeree triggeree
    {trigger} = self
    el = self.el
    self.getEl = () -> el
    
    htmlValues = el.find("[data-prop]")
    drews.eachArray htmlValues, (_el) ->
      _el = $(_el)
      key = _el.attr "data-prop"
      _el.text model.get(key) or "[#{key}]"

    clickToMakeEditable = (els) ->
      els.bind "click", (e) ->
        prop = $(this).attr "data-prop"
        self.makeEditable(prop)
    self.clickToMakeEditable = clickToMakeEditable

    clickToMakeEditable(el.find(".editable"))

    makeEditable = (prop) ->
      if self.editing
        return
      _el = el.find("[data-prop='#{prop}']")
      value = _el.text()
      replacer = $ "<input type=\"text\" data-prop=\"#{prop}\" value=\"#{value}\">"

      saveIt = () ->
        self.editing = false
        newValue = replacer.val()
        _el.html ""
        _el.text newValue 
        trigger "modelviewvalchanged", model, prop, newValue

      replacer.bind "keyup", (e) ->
        if e.keyCode is 13
          saveIt()

      replacer.bind "blur", (e) -> saveIt()
         
      _el.html replacer 
      self.editing = true
      replacer[0].focus()
      replacer[0].select()
    self.makeEditable = makeEditable
    self
