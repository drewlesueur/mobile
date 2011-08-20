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

    html = """
      <div id="mobile-wrapper">
        <div class="header">
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
    header = el.find ".header" 
    fileDroppable header
    header.bind "filedroppablefiles", (event, files) ->
      console.log "hellow orld"
      console.log files
      emit "newheaderimage", files
    header.bind "filedroppableover", () ->
      header.addClass "header-selected"
    header.bind "filedroppableleave", () ->
      header.removeClass "header-selected"

    self.setHeaderUrl = (url) ->
      header.empty()
      header.append """
        <img src="#{url}" />
      """


    self.getEl = -> el





    self
