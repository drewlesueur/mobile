define "zepto", () -> Zepto
define "underscore", () -> _
define "nimble", () -> _


$ = require "zepto"
drews = require "drews-mixins"
severus = require("severus2")()
eventer = require "drews-event"

define "app-view", () ->
  days = [
    "sunday", "monday", "tuesday", "wednesday"
    "thursday", "friday", "saturday"
  ]
  daysMonday = [
    "monday", "tuesday", "wednesday"
    "thursday", "friday", "saturday", "sunday"
  ]
  
  timeToMili = (time, date = new Date()) -> #8am to miliseconds
    pm = _.s(time, -2, 2) == "pm"
    am = _.s(time, -2, 2) == "am"
    hours = 0
    minutes = 0

    if am or pm
      time = _.s time, 0, -2

    if time.indexOf(":") >= 0
      time = time.split ":"
      hours = time[0]
      minutes = time[1]
    else
      hours = time
    if pm then hours += 12
    newDate = new Date date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0
    newDate.getTime()
  
  getDayRow = (day, model) ->
    if model[day + "Open"]
      hoursHtml = """
        <td align="right">#{model["#{day}Start"]}</td>
        <td> to </td>
        <td align="right">#{model["#{day}End"]}</td>
      """
    else
      hoursHtml = """
        <td> Closed </td>
      """
    dayHtml = """
      <tr>
        <td>#{_.capitalize(day)}</td>
          #{hoursHtml}
      </tr>
    """
  Router = require "router"
  AppView = {}
  AppView.init = (options) ->
    {model} = options
    self = eventer {}
    {emit} = self
    $("h1").bind "click", () ->
      location.href = "#"

    $(".content").append """<div class="clear"></div>"""
    nav = self.nav = (className) ->
      if className == ""
        className = "home"
      $(".content .tile").hide()
      $(".content .tile.#{className}").show()
     

    initHome = () ->
      navItems = [
        "hours"
        "items"
        "directions"
        "facebook"
        "twitter"
        ""
      ]
      routes = {}
      navHtml = ""
      _.each navItems, (navItem) ->
        routes[navItem] = () -> 
          nav navItem 
        navHtml += """
          <div>
          <a href="##{navItem}">#{_.capitalize navItem}</a>
          </div>
        """

      navHtml = $ """
        <div class="home tile hidden">
          <div class="promo">
            <img src="#{model.promo}" />
            <div class="promo-text">
              #{model.promoText}
            </div>
            <form class="phone-form" action="/" method="POST">
              <div class="clearfix">
                <div class="input">
                  <input id="phone" name="phone" type="text">
                  <input type="submit" value="send">
                </div>
              </div> <!-- /clearfix -->
            </form>
          </div>
          #{navHtml}
        </div>
      """
      $(".content").append navHtml
      navHtml.find("form").bind "submit", (e) ->
        e.preventDefault()
        emit "phone", $("#phone").val()


       
      router = Router.init routes
      router.initHashWatch()

    displayDirections = () ->
      directionsHtml =  """
       <div class="tile directions hidden">
         We are located at #{model.address} 
         <br />
         <a target="blank" href="http://maps.google.com/maps?daddr=#{model.address}">Google Map Directions</a>
         <img src="http://maps.googleapis.com/maps/api/staticmap?center=#{model.address}&zoom=14&size=320x320&markers=color:red|#{model.address}&maptype=roadmap&sensor=false" />
       </div>
      """
      $(".content").append directionsHtml
    displayDirections()
      


    displayHours = () ->
      dayRows = ""
      for day in daysMonday
        dayRows += getDayRow day, model
      hoursTable =  """ 
        <table>
          <tbody>
            #{dayRows}
          </tbody>
        </table>
      """
      $(".content").append """
        <div class="hours tile hidden">#{hoursTable}</hours>
      """
    displayHours()


    displayItems = () ->
      dayRows = ""
      for day in daysMonday
        dayRows += getDayRow day, model
      itemsTable =  """ 
        <div class="items-table">

        </div>
      """
      $(".content").append """
        <div class="items tile hidden">#{itemsTable}</hours>
      """
    displayItems()

    addItems = self.addItems = (items) ->
      _.each items, (item) ->
        $(".content .items").append $ """
          <div class="item">
              <img style="float:left;" src="#{item.url or model.headerUrl}" />
              <div class="title">#{item.title or ""}</div>
              <div class="price">#{item.price or ""}</div>
            <div class="clear"></div>
              <div class="description">#{item.description or ""}</div>
          </div>
        """

    self.doHours = () ->
      date = new Date()
      day = days[date.getDay()]
      isEvenOpen = model["#{day}Open"]
      if not isEvenOpen
        return $(".open").text "Closed on #{_.capitalize(day)}s"
      openText = model["#{day}Start"]
      closeText = model["#{day}End"]
      openTime = timeToMili openText
      closeTime = timeToMili closeText

      time = drews.time()
      console.log new Date closeTime
      console.log new Date openText
      if time >= openTime and time <= closeTime
        $(".open").html """
          Open 'til <a href="#hours">#{closeText}</a>
        """
      else
        $(".open").text "Closed"

    initHome()
    self
  AppView

define "app-presenter", () ->
  model = require "model"
  AppView = require "app-view"
  AppPresenter = {}
  AppPresenter.init = () ->
    severus.db = "mobilemin_#{model.name}"
    view = AppView.init model: model
    view.doHours()

    severus.find "items", (err, items) ->
      console.log "here are the items"
      console.log items
      view.addItems items



    view.on "phone", (phone) ->
      alert phone
      severus.save "phones", {phone}, (err) ->
        alert "Thank you"

  AppPresenter


AppPresenter = require "app-presenter"

$ ->
  AppPresenter.init()
