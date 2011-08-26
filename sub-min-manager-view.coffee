define "sub-min-manager-view", () ->
  SubMinManagerView = {}
  eventBus = require "event-bus"
  eventer = require "drews-event"
  SubMinManagerView = eventer {}
  
  SubMinManagerView.init = (self={}) ->
    self = eventer self
    {model, emit} = self
    el = $ """
      <div>
        <span>#{model.get "name"}</span>
        <a href="#" class="remove">Delete</a>
      </div>
    """
    self.el = -> el
    SubMinManagerView.emit "init"

  SubMinManagerView

    

  
