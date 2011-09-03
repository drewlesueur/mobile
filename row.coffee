define "row-maker", () -> (type) ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require("severus2")()
  severus.db = type 
  eventer = require "drews-event"
  Row = eventer {}
  Row.init = (attrs={}) ->
    self = {}
    self.attrs = attrs
    self = eventer self
    _emit = self.emit
    emit = (event, args...) ->
      _emit event, args...
      Row.emit event, self, args...
    
    save = (cb=->) ->
      emit "saving"
      severus.save "Rows", attrs, (err, _mobileApp) ->
        _.extend attrs, _mobileApp
        emit "action", "save"
        emit "save"
        cb err, self
    self.save = save

    remove = (cb=->) ->
      emit "removing"
      severus.remove "Rows", attrs._id, (args...) ->
        emit "remove"
        cb args...
    self.remove = remove

    toHtml = self.toHtml = () ->
      days = [
        "sunday", "monday", "tuesday", "wednesday"
        "thursday", "friday", "saturday"
      ]
      daysHtml = {}
      for day in days
        daysHtml = {}
      """
        <!doctype html>
        <html>
        <head>
          <title>#{attrs.title}</title>
          <meta name="viewport" content="width=device-width" />
          <link rel="stylesheet" href="http://drewl.us:8010/styles.css" />
        </head>
        <body>
          <div class="header">
            <h1><img src="#{attrs.headerUrl}" class="header-image"/></h1>
            <div class="phone">
              #{attrs.phone}
            </div>
            <div class="open">
            </div>
          </div> <!-- header div -->
          <div class="content">
          </div>
          <script src="module.js"></script>
          <script src="http://inc.the.tl/underscore.js"></script>
          <script src="http://inc.the.tl/nimble.js"></script>
          <script src="http://inc.the.tl/drews-mixins.js"></script>
          <script src="http://severus.drewl.us/severus2.js"></script>
          <script src="zepto.min.js"></script>
          <script src="http://inc.the.tl/drews-event.js"></script>
          <script>
            define("model", function() {
              return #{JSON.stringify self.attrs};
            });
          </script>
          <!--<script src="index.js"></script>-->
          <script src="http://drewl.us:8010/router.js"></script>
          <script src="http://drewl.us:8010/index.js"></script>
        </body>
      """


    self.export = () ->
      mobileRow.saveSite attrs.name, toHtml()

    self.set = (obj, val) ->
      if _.isString obj
        attrs[obj] = val
      else
        _.extend attrs, obj

    self.get = (prop) -> attrs[prop]
    Row.emit "init", self

    self

  Row.find = (args..., cb) ->
    models = []
    severus.find "Rows", args..., (err, models) ->
      for model in models
        models.push Row.init model
      Row.emit "find", models, Row
      cb err, models
  Row

