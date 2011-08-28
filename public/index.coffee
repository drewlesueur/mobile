define "zepto", () -> Zepto
define "underscore", () -> _

$ = require "zepto"
drews = require "drews-mixins"

define "app-view", () ->
  days = [
    "sunday", "monday", "tuesday", "wednesday"
    "thursday", "friday", "saturday"
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

  AppView = {}
  AppView.init = (options) ->
    {model} = options
    self = {}
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
