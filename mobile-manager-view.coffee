define "mobile-manager-view", () -> 
  $ = require "jquery"
  eventer = require "drews-event"
  _ = require "underscore"
  mobileManagerView = (self={}) ->
    self = eventer self
    {emit} = self
    el = """ 
     <div class="phone">
       <div class="screen">
        </div>
     </div>
     <div class="apps">
       <ul>
       </ul>
     </div>
    """
    $(document.body).find('.body-wrapper').append el
    self.addAppToList = (app) ->
      name = app.get "name"
      $(".apps ul").append """
        <li>
          <a href="##{name}">name</a>
        </li>
      """
    #initial emitting of hash
    hash = location.hash.slice 1
    emit "nav", hash
    console.log hash
    $(window).bind "hashchange", (e) ->
      hash = location.hash.slice 1
      emit "nav", hash
      console.log hash

      


   

    self
