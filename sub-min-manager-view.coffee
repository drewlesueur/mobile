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
        <a href="#" class="load">#{model.get "name"}</a>
        <div>
          <a target="_blank" href="http://#{model.get "name"}.mobilemin.com">http://#{model.get "name"}.mobilemin.com</a>
        </div>
        <div>
        <a href="#" class="remove">Delete</a>
        <a href="#" class="export">Export</a>
        </div>
        <br />
      </div>
    """
    el.find('.remove').click (e) ->
      e.preventDefault()
      if confirm "Are you sure you want to delete?"
        emit "remove"

    el.find('.export').click (e) ->
      e.preventDefault()
      emit "export"

    el.find('.load').click (e) ->
      e.preventDefault()
      emit "load"

    self.el = el
    self.remove = -> el.remove()

    SubMinManagerView.emit "init"
    self

  SubMinManagerView

    

  
