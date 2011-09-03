#TODO: add a special property that only super admin can edit
config = require './config.coffee'
_ = require "underscore"
drews = require("drews-mixins")
nimble = require "nimble"
fs = require "fs"
exec = require("child_process").exec
{wait, trigger, bind, once, log} = _
{series, parallel} = nimble

express = require('express')

drewsSignIn = (req, res, next) ->
  req.isSignedIn = () ->
    req.session.email isnt null
  next()

enableCORS = (req, res, next) ->
  res.setHeader "Access-Control-Allow-Origin", "*"
  res.setHeader "Access-Control-Allow-Headers", "Content-Type"
  next()


app = module.exports = express.createServer()
app.configure () ->
  app.use enableCORS
  app.use(express.bodyParser())
  app.use express.cookieParser()
  app.use express.session secret: "boom shaka laka"
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(__dirname + '/public'))
  app.use drewsSignIn

app.configure 'development', () ->
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })) 

app.configure 'production', () ->
  app.use(express.errorHandler()) 


pg = (p, f) ->
  app.post p, f
  app.get p, f

# Routes
#TODO: make it so it just sends the JSON?, not the html
#would have to change the min.coffee file in the other branch
saveSite = (name, html, cb) ->
  if name.length < 1 then return cb "bad name"
  #command = "rm -r /home/drew/sites/#{name}"
  
  path = "/home/drew/sites/mobilemin-sites/#{name}"
  mkdir = (cb) ->
    console.log "makeing dir"
    fs.mkdir path, 0777, (err) -> cb()

  addFile = (cb) ->
    console.log "writing file"
    fs.writeFile "#{path}/index.html", html, cb

  addModule = (cb) ->
    console.log "adding module"
    exec "cp /home/drew/sites/inc.the.tl/module.js #{path}/module.js", cb


  addZepto = (cb) ->
    console.log "adding zepto"
    exec "cp /home/drew/sites/inc.the.tl/zepto/dist/zepto.min.js #{path}/zepto.min.js", cb

  addCss = (cb) ->
    console.log "adding css"
    exec "cp /home/drew/sites/mobilemin/public/styles.css #{path}/styles.css", cb

  doCoffee = (cb) ->
    console.log "doing coffee"
    exec "cp /home/drew/sites/mobilemin/public/index.coffee #{path}/index.coffee", (err) ->
      console.log err
      cb err

  compileCoffee = (cb) ->
    console.log "compiling coffee"
    exec "coffee -c #{path}/index.coffee", cb

  series [
    mkdir
    addFile
    addModule
    addCss
    addZepto
    doCoffee
    compileCoffee
  ], (err, results) ->
    cb err, "http://#{name}.mobilemin.com"

  
  
rpcMethods = {
  saveSite  
}

# soon add web socket rpc that goes the other way
# or events from the server or something like that
# credentails won't be needed for sockets huh?
errorMaker = (error) ->
  (args..., cb) ->
    cb error, null

pg "/rpc", (req, res) ->
  body = req.body
  {method, params, id} = body
  fn = rpcMethods[method] or errorMaker("no such method #{method}")
  fn  params..., (err, result) ->
    res.send
      result: result
      error: err
      id: id

exports.app = app

if (!module.parent) 
  app.listen config.server.port || 8001
  console.log("Express server listening on port %d", app.address().port)

