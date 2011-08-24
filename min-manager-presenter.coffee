define "min-manager-presenter", () ->
  eventBus = require "event-bus"
  Min = require "min"
  MinManagerPresenter = {}
  MinManagerPresenter.init = (self={}) ->
    emit = eventBus.selfEmitter self
    bind = eventBus.bind
    
    view = MinManagerView.init()
    infoView = InfoView.init()
    {info, clear} = infoView

    SubMinManagerPresenter.init() 
    MinManagerPresenter.init() 

    bind "subminmanagerview.selectmin", (min) ->
      view.model model

    bind "subminmanagerview.remove", (min) ->
      min.remove()
      
    bind "min.action", (action, min) ->
      info action
      
    bind "minmanagerview.change", (min, prop, val) ->
      min.set prop, val

    bind "minmanagerview.header"


