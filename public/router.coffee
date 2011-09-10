define "router", () ->
  _ = require "underscore"
  Router = {}
  Router.init = (routes) ->
    self = {}
    routes ||=
      test: (frag) ->
        alert "that was a test #{frag}"
      "app/:what": (what2, what) -> alert what

    namedParam    = /:([\w\d]+)/g;
    splatParam    = /\*([\w\d]+)/g;
    escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g; 

    routeToRegExp = (route) ->
      route = route.replace(escapeRegExp, "\\$&").replace(namedParam, "([^\/]*)").replace(splatParam, "(.*?)");
      new RegExp('^' + route + '$'); 

    extractParameters = (route, actualFragment) ->
      route.exec(actualFragment).slice()
      
    
    routesList = []
    addRoute = self.addRoute = (route, callback) ->
      if not(_.isRegExp(route))
        route = routeToRegExp(route)
      newCallback = (actualFragment) ->
        args = extractParameters route, actualFragment
        callback args...
      routesList.push [route, newCallback]

    _.each routes, (callback, route) ->
      addRoute route, callback

    testRoutes = self.testRoutes = (fragment) ->
      _.any routesList, ([route, callback]) ->
        if route.test fragment
          callback fragment
          return true


    oldHash = ""
    checkUrl = (callback) ->
      hash = location.hash.slice 1
      if hash != oldHash
        callback()
      oldHash = hash
      
    self.initHashWatch = (callback) ->
      callback ||= (e) ->
        hash = location.hash.slice 1
        testRoutes hash
      callback()
      if "onhashchange" of window
        $(window).bind "hashchange", callback
      else
        setInterval (() -> checkUrl(callback)), 50

        

    self
  Router
        

