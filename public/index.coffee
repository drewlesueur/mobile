define "zepto", () -> Zepto
define "underscore", () -> _

$ = require "zepto"
drews = require "drews-mixins"

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
    self = {}

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

      navHtml = """
        <div class="home tile">
          #{navHtml}
        </div>
      """
      router = Router.init routes
      router.initHashWatch()
      $(".content").append navHtml
    initHome()

    
    displayDirections = () ->
      directionsHtml =  """

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
      console.log new Date(openTime).getHours()
      console.log new Date(time).getHours()
      if time >= openTime and time <= closeTime
        $(".open").text "We are open until #{closeText}"
      else
        $(".open").text "Closed"

    self
  AppView

define "app-presenter", () ->
  model = require "model"
  AppView = require "app-view"
  AppPresenter = {}
  AppPresenter.init = () ->
    view = AppView.init model: model
    view.doHours()
  AppPresenter


AppPresenter = require "app-presenter"

$ ->
  AppPresenter.init()
