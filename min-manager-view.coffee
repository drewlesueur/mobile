define 'min-manager-view', () ->
  _ = require "underscore"
  nimble = require "nimble"
  eventer = require "drews-event"
  MinManagerView = eventer {}
  InputUpload = require "input-upload"

  MinManagerView.init = (self={}) ->
    self = eventer self
    {model, emit} = self
   
    InputUpload.init $("input[type=text]")
      

    self.clearItems = (tablePresenter) ->
      $(".items").empty()

    self.addItemsTable = (tablePresenter) ->
      $(".items").empty().append tablePresenter.getEl()

    self.addItemsText = (text) ->
      $(".items").append  "<div style='font-weight: bold;'>#{text}</div>"

    self.addAdditionalItemsTable = (tablePresenter) ->
      $(".items").append tablePresenter.getEl()

      

    self.setPhones = (phones) ->
      $(".phones-textarea").val phones.join "\n"

    

    self.addMin = (min) ->
      $('.apps').append min.subView.el

    self.loadMin = (min) ->
      console.log min
      embedText = """
        <script>
          if (navigator.userAgent.match(/iphone|ipod|webos|android/i)) {
            location.href = "http://#{min.get 'name'}.mobilemin.com"
          }
        </script>
      """
      $(".embed-textarea").val embedText

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
    
    
  
