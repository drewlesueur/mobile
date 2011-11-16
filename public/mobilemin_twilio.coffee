if module?.exports
  difinir = (args..., ret) -> module.exports = ret()
  `define = difinir`

define "mobilemin-twilio", ->
  class MobileMinTwilio
    constructor: ->

  MobileMinTwilio
