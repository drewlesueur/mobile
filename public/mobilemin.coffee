define "mobilemin", () ->
  _ = require "underscore"
  drews = require("drews-mixins")
  nimble = require "nimble"
  server = drews.jsonRpcMaker("http://drewl.us:8010/rpc/")
  self = {}
  self.saveSite = (name, html, cb) ->
    server "saveSite", name, html, cb
  self


  
  
