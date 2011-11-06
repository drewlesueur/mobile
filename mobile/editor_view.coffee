define "editor-view", () ->
  SlateView = require "slate-view"
  ListView = require "list-view"
  class EditorView extends Backbone.View
    constructor: ->
      @appsSlate = new SlateView()
      @singleAppsSlate = new SlateView()
      @appsList = new ListView()
      @$ = $
      @setUpDom()
      @addAppsSlate()

    addAppsSlate: () =>
      @el.append @appsSlate.el
      

    setUpDom: () =>
      @el = @$ """
        <div class="editor"></div>
      """
      @appsSlate.add @appsList
      #@add @appSlate

    add: (otherView) =>
      @el.append otherView.el

    populateApps: (apps) =>
      @activate @appsSlate
      titles = _.map apps, (app) -> [app.title, app]
      @appsList.fill  titles

    activate: () ->
      


define "slate-view", () ->
  class SlateView extends Backbone.View
    constructor: ->
      @init()
      @$ = $

    init: =>
      @el = @$ """
        <div class="slate"></div>
      """
    add: (view) ->
      @el.append view.el

define "list-view", () ->
  class ListView extends Backbone.View
    constructor: ->
      @init()
      @$ = $

    init: =>
      @el = @$ """
        <div class="list"></div>
      """
    fill: (data) =>
      _.each data, (item) =>
        name = item[0]
        itemEl= @$ """
          <div class="item">#{name}</div> 
        """
        @el.append itemEl
        itemEl.click =>
          @trigger "click", item

