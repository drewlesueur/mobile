define "mobile-app-view", () ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  eventer = require "drews-event"
  editableFormMaker = require "editable-form"
  fileDroppable = require "file-droppable"
  mobileAppViewMaker = (self={}) ->
    self = eventer self
    {emit, model} = self
    headerImgHtml = ""
    if model.get("header")
      headerImgHtml = """
        <img src="#{model.get("header")}" />
      """
    html = """
      <div id="mobile-wrapper">
        <div class="header">
          #{headerImgHtml}
        </div>
        <div class="hours-phone">
          <span class="editable" data-prop="hours"></span>
          <span class="editable" data-prop="phone"></span> 
        </div>
        <div class="address editable" data-prop="address"></div>
        
      </div>
    """
    
    form = editableFormMaker html, model
    form.setEmittee self
    el = form.getEl()
    headerEl = el.find ".header" 
    header = fileDroppable el.find headerEl
    header.on "filedroppablefiles", (files) ->
      headerEl.removeClass "header-selected"
      emit "newheaderimage", files
    header.on "filedroppableover", () ->
      headerEl.addClass "header-selected"
    header.on "filedroppableleave", () ->
      headerEl.removeClass "header-selected"

    self.setHeaderUrl = (url) ->
      console.log headerEl
      headerEl.empty()
      headerEl.append """
        <img src="#{url}" />
      """


    self.getEl = -> el





    self
