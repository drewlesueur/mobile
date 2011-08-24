define 'min-manager-view', () ->
  eventBus = require "event-bus" 
  MinManagerView = {}
  MinManagerView.init = (self={}) ->
    {model} = self.model
    self.model = (_model) -> 
      if not _model
        return model
      model = _model
    
    
  
