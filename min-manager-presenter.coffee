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

    #subMinManagerViews = SubMinManagerViewCollection.init()
    #subMinManagerViews.on "remove", (min) ->
      #do something

    #sumMinManagerViews.on "remove", (min) ->
    #  if min in myList
    #    emit "remove"

    SubMinManagerView.on "selectmin", (min) ->
      view.model model

    SubMinManagerView.on "remove", (min) ->
      console.log "goint ot remove"
      min.remove()

    Min.find null, (err, _mins) ->
      mins = _mins

    Min.on "init", (min) ->
      min.subView = SubMinManagerView.init model: min
      view.addMin min
      console.log "added #{min.get("name")}"

      
    Min.on "action", (action, min) ->
      #info action

    Min.on "remove", (min) ->
      view.removeMin min
      
    view.on "change", (min, prop, val) ->
      min.set prop, val

    view.on "new", (name) ->
      model = Min.init name: name
      model.save()
      console.log name



  MinManagerPresenter


