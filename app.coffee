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
saveSite = (name, attrs, cb) ->
  if name.length < 1 then return cb "bad name"
  #command = "rm -r /home/drew/sites/#{name}"
  
  path = "/home/drew/sites/mobilemin-sites/#{name}"
  mkdir = (cb) ->
    console.log "makeing dir"
    fs.mkdir path, 0777, (err) -> cb()

  doScripts = (cb) ->
    console.log "joining scripts"
    #exec "cd public; cat `scripts.txt` > #{path}/scripts.js", (err, stdout, stderr) ->
    exec "cd public; cat `cat scripts.txt` > #{path}/scripts.js", (err, stdout, stderr) ->
      console.log stdout
      console.log stderr
      console.log "did they join?"
      if err then console.log "There was an error combining files"
      cb err

  
  html = """
    <!doctype html>
    <html>
      <head>
        <script>
          var defs = {};
          var modules = {};
          function define(name, fn) {
            defs[name] = fn;
          }
          function require(name) {
            if (modules.hasOwnProperty(name)) return modules[name];
            if (defs.hasOwnProperty(name)) {
              var fn = defs[name];
              defs[name] = function () { throw new Error("Circular Dependency"); }
              return modules[name] = fn();
            }
            throw new Error("Module not found: " + name);
          } 
          define("model", function(){ return #{JSON.stringify(attrs)}});
        </script>
        <script src="scripts.js"></script> 
        <script src="http://drewl.us:8010/index.js"></script>
        <!--<script src="index.js"></script>--> <!--during development-->
        <meta name="viewport" content="width=device-width,minimum-scale=1.0" />
        <!--<link rel="stylesheet" href="styles.css" />-->
        <link rel="stylesheet" href="http://drewl.us:8010/styles.css" />

      </head>
      <body>
        hello world
      <body>
    </html>
  """

  copyImages = (cb) ->
    cb()
    #todo: find all images and copy them over to the files

  addFile = (cb) ->
    console.log "writing file"
    fs.writeFile "#{path}/index.html", html, cb

  addIndex = (cb) ->
    console.log "adding index"
    exec "cp /home/drew/sites/mobilemin/public/index.js #{path}/index.js", cb

  addCss = (cb) ->
    console.log "adding css"
    exec "cp /home/drew/sites/mobilemin/public/styles.css #{path}/styles.css", cb

  series [
    mkdir
    doScripts
    copyImages
    addFile
    addIndex
    addCss
  ], (err, results) ->
    url = "http://#{name}.mobilemin.com"
    console.log "done: visit #{url}"
    cb err, url

  
  
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

