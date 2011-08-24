define "sub-min-manager-presenter", () ->
  eventBus = require "event-bus"
  Min = require "min"
  SubMinManagerView = require "sub-min-manager-view"
  SubMinManagerPresenter = {}
  SubMinManagerPresenter.init = (self={}) ->
    emit = eventBus.selfEmitter self
    bind = eventBus.bind
    
    bind "min.init", (model) ->
      model.view = SubMinManagerView.init
        model: model
        presener: self

        


  SubMinManagerPresenter
