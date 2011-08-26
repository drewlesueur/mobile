define 'min-manager-view', () ->
  eventBus = require "event-bus" 
  eventer = require "drews-event"
  MinManagerView = eventer {}
  MinManagerView.init = (self={}) ->
    self = eventer self
    {model, emit} = self
    
    self.addMin = (min) ->
      $('.apps').append min.subView.el()
       
    $('.new').bind "click", (e) ->
      e.preventDefault()
      name = prompt "Name?"
      emit "new", name
      return false

    self

  MinManagerView
    
    
  
