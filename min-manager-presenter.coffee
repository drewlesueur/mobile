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
    currentMin = null

    #subMinManagerViews = SubMinManagerViewCollection.init()
    #subMinManagerViews.on "remove", (min) ->
      #do something

    #sumMinManagerViews.on "remove", (min) ->
    #  if min in myList
    #    emit "remove"


    SubMinManagerView.on "remove", (min) ->
      min.remove()

    SubMinManagerView.on "export", (min) ->
      min.export()

    SubMinManagerView.on "load", (min) ->
      currentMin = min
      view.loadMin min


    Min.find null, (err, _mins) ->
      mins = _mins

    Min.on "init", (min) ->
      min.subView = SubMinManagerView.init model: min
      currentMin = min
      view.addMin min
      view.loadMin min

      
    Min.on "action", (action, min) ->
      #info action

    Min.on "remove", (min) ->
      view.removeMin min
      
    view.on "change", (min, prop, val) ->
      min.set prop, val

    view.on "new", (name) ->
      model = Min.init name: name
      model.save()

    view.on "save", (hash) ->
      currentMin.set hash
      console.log JSON.stringify currentMin.attrs
      currentMin.save () ->
        currentMin.export()



  MinManagerPresenter


