define 'min-manager-view', () ->
  _ = require "underscore"
  nimble = require "nimble"
  eventBus = require "event-bus" 
  eventer = require "drews-event"
  MinManagerView = eventer {}
  MinManagerView.init = (self={}) ->
    self = eventer self
    {model, emit} = self
    
    self.addMin = (min) ->
      $('.apps').append min.subView.el

    self.loadMin = (min) ->
      
      _.each _.keys(min.attrs), (prop) ->
        $(".info-form [name=\"#{prop}\"]").val min.get prop

       
    $('.new').bind "click", (e) ->
      e.preventDefault( )
      name = prompt "Name?"
      emit "new", name
      return false

    $('.info-form').bind "submit", (e) ->
      e.preventDefault()
      hash = {}
      $(".info-form [name]").each () ->
        prop = $(this).attr("name")
        val = $(this).val()
        hash[prop] = val 
      emit "save", hash

    self.removeMin = (min) ->
      min.subView.remove()

    self

  MinManagerView
    
    
  
