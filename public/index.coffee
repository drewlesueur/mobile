texter = require("text")
$ = require "jquery"
$ ->
  $(".text-form").submit (e) ->
    to = $(".to").val()
    message = $(".message").val()
    e.preventDefault()
    texter.text "4804208755", to, message, (err, result) ->
      
      alert "you sent a text message"
