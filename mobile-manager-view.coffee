define "mobile-manager-view", () -> 
  $ = require "jquery"
  eventer = require "drews-event"
  _ = require "underscore"
  mobileManagerView = (self={}) ->
    self = eventer self
    {emit} = self
    el = $ """ 
      <div class="container">
       <div class="row show-grid">
         <div class="apps span4 column">
           <ul class="unstyled zebra-striped">
           </ul>
         </div>
         <div class="phone span6 column">
           <div class="screen">
            </div>
         </div>
         <div class="ctrls span6 column">
          <a class="new" href="#">New app</a>
         </div>
       </div>
     </div>
    """
    el.find(".new").bind "click", () ->
      emit "new"
    app = null
    self.getApp = () -> app
    screen = el.find ".screen"
    self.getEl = () -> el
   
    #this app is the app presenter
    self.addApp = (app) ->
      $(".apps ul").append app.view.getEl()

    #this app is the mobileApp model, not he mobileapp presenter
    showApp = self.showApp = (_app) ->
      app = _app
      screen.empty()
      screen.append app.view.getEl()
      
    self.clearApps = () ->
      $(".apps ul").empty()

    #initial emitting of hash
    self.initNav = () ->
      hash = location.hash.slice 1
      emit "nav", hash
      $(window).bind "hashchange", (e) ->
        hash = location.hash.slice 1
        emit "nav", hash
    navTo = () ->
      window.location.hash = "#"
    self.navTo = navTo
    clearNav = () ->
      navTo ""
    self.clearNav = clearNav
      

      


   

    self
