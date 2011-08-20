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
     <div class="ctrls">
      <a href="#new">New app</a>
      <a href="#load">load</a>
     </div>
     <div class="apps">
       <ul>
       </ul>
     </div>
    """
    self.getEl = () -> el
    self.addApp = (app) ->
      $(".apps ul").append app.view.getEl()
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
