define "sub-min-manager-view", () ->
  SubMinManagerView = {}
  eventBus = require "event-bus"
  eventer = require "drews-event"
  drews = require "drews-mixins"
  SubMinManagerView = eventer {}
  
  SubMinManagerView.init = (self={}) ->
    self = eventer self
    {model} = self
    _emit = self.emit
    emit = (event, args...) ->
      _emit event, args...
      SubMinManagerView.emit event, model, args...

    el = $ """
      <div>
        <span>#{model.get "name"}</span>
        <a href="#" class="remove">Delete</a>
      </div>
    """
    el.find('.remove').click (e) ->
      e.preventDefault()
      if confirm "Are you sure you want to delete?"
        emit "remove"
    self.el = el
    self.remove = -> el.remove()

    SubMinManagerView.emit "init"
    self

  SubMinManagerView

    

  
