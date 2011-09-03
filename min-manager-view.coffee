define 'min-manager-view', () ->
  _ = require "underscore"
  nimble = require "nimble"
  eventBus = require "event-bus" 
  eventer = require "drews-event"
  MinManagerView = eventer {}
  MinManagerView.init = (self={}) ->
    self = eventer self
    {model, emit} = self
   
    self.setPhones = (phones) ->
      $(".phones-textarea").val phones.join "\n"
    self.addMin = (min) ->
      $('.apps').append min.subView.el

    self.loadMin = (min) ->
      $(".phones-textarea").val ""

      $('.info-form').each () ->
        this.reset()
      _.each _.keys(min.attrs), (prop) ->
        input = $(".info-form [name=\"#{prop}\"]")
        if input.is('[type="checkbox"]')
          input.prop "checked", min.get prop
        else
          input.val min.get prop

       
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
        if $(this).is('[type="checkbox"]')
          val = $(this).is(":checked")
        else 
          val = $(this).val()

        hash[prop] = val 
        true #coffeescript
      emit "save", hash

    self.removeMin = (min) ->
      min.subView.remove()

    self

  MinManagerView
    
    
  
