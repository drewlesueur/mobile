define "min-presenter", () ->
  eventBus = require "event-bus"
  MinPresenter = {}
  MinPresenter.init = (self={}) ->
    emit = eventBus.selfEmitter self
