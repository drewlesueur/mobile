define "zepto", () -> Zepto

$ = require "zepto"

define "app-view", () ->
  AppView = {}
  AppView.init = () ->

  AppView

define "app-presenter", () ->
  AppView = require "app-view"
  AppPresenter = {}
  AppPresenter.init = () ->
    view = AppView.init() 
    


  AppPresenter
  

AppPresenter = require "app-presenter"

$ ->
  AppPresenter.init()
