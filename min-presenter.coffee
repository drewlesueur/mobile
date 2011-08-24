# models as keys
# bind [model, "action"]

define "min-presenter", () ->
  eventBus = require "event-bus"
  Min = require "min"
  MinPresenter = {}
  MinPresenter.init = (self={}) ->
    emit = eventBus.selfEmitter self
    bind = eventBus.bind
 
    #initView = () ->
    view = MinView.init()

    bind "minview.addphonenumber", (view, _phoneNumber) ->
      phoneNumber = PhoneNumber.init _phoneNumber
      phoneNumber.save()

    bind "phonenumber.save", (phone) ->
      view.confirmPhoneSaved()

    bind "minview.sendtext", (text) ->
      text = Text.init text
      text.save()






      
      
    


        



