define ?= (args..., name, ret) -> module?.exports = ret()

config = require './config.coffee'
_ = require "underscore"
drews = require("drews-mixins")
nimble = require "nimble"
{wait, trigger, bind, once, log} = _
{series, parallel} = nimble

express = require('express')


enableCORS = (req, res, next) ->
  res.setHeader "Access-Control-Allow-Origin", "*"
  res.setHeader "Access-Control-Allow-Headers", "Content-Type, X-Requested-With"
  next()

getApp = (url, methods) ->
  app = module.exports = express.createServer()
  app.configure () ->
    app.use enableCORS
    app.use(express.bodyParser())
    app.use express.cookieParser()
    app.use express.session secret: "boom shaka laka"
    app.use(express.methodOverride())
    app.use(app.router)
    app.use(express.static(__dirname + '/public'))

  app.configure 'development', () ->
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })) 

  app.configure 'production', () ->
    app.use(express.errorHandler()) 


  pg = (p, f) ->
    app.post p, f
    app.get p, f

# Routes


  rpcMethods = methods



# soon add web socket rpc that goes the other way
# or events from the server or something like that
# credentails won't be needed for sockets huh?
  errorMaker = (error) ->
    (args..., cb) ->
      cb error, null

  url or= "/rpc"
  pg url, (req, res) ->
    body = req.body
    {method, params, id} = body
    fn = rpcMethods[method] or errorMaker("no such method #{method}")
    fn  params..., (err, result) ->
      res.send
        result: result
        error: err
        id: id



define "rpc", -> getApp

  

#if (!module.parent) 
  #app.listen config.server.port || 8001
  #console.log("Express server listening on port %d", app.address().port)

