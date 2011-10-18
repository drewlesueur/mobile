define "text", () ->
  _ = require "underscore"
  drews = require("drews-mixins")
  nimble = require "nimble"
  server = drews.jsonRpcMaker("http://text.drewl.us/rpc/")
  self = {}
  self.text = (from, to, message, callback) ->
    server "text", from, to, message, callback
  self


  
  
