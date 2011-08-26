define "min-manager-presenter", () ->
  eventBus = require "event-bus"
  eventer = require "drews-event"
  Min = require "min"
  MinManagerView = require "min-manager-view"
  SubMinManagerView = require "sub-min-manager-view"
  MinManagerPresenter = {}
  MinManagerPresenter.init = (self={}) ->
    self = eventer self
    {emit} = self
    
    view = MinManagerView.init()
    #infoView = InfoView.init()
    #{info, clear} = infoView
    mins = []

    Min.find null, (err, _mins) ->
      mins = _mins

    Min.on "init", (min) ->
      min.subView = SubMinManagerView.init model: min
      view.addMin min

    SubMinManagerView.on "selectmin", (min) ->
      view.model model

    SubMinManagerView.on "remove", (min) ->
      min.remove()
      
    Min.on "action", (action, min) ->
      #info action
      
    view.on "change", (min, prop, val) ->
      min.set prop, val

    view.on "new", (name) ->
      console.log name



  MinManagerPresenter


