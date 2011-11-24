dModule.define "severus2", () -> 
  ret = ->
    _ = dModule.require "underscore"
    drews = dModule.require("drews-mixins")
    nimble = dModule.require "nimble"
    server = drews.jsonRpcMaker("http://severus.drewl.us/rpc/")
    {extend, log} = _
    self = {}
    self.db = "severus_drewl_us"
    credentials = {}
    self.credentials = credentials

    serverCallMaker = (call)  ->
      (args..., cb) ->
        [collection, obj, extra] = args
        extra ||= {}
        args =
          sessionId: self.sessionId
          db: self.db
          collection: collection
          obj: obj 
        extend args, extra
        server call, args, cb

    save = serverCallMaker "save"
    find = serverCallMaker "find"
    remove = serverCallMaker "remove"

    serv = (call, args..., cb) ->
      server call, self.sessionId, self.db, args..., cb

    login = (username, password, cb) ->
      server "login", self.db, username, password, (err, user) ->
        self.sessionId = user.sessionId
        self.user = user
        cb null, user

    setDb = (db) ->
      self.db = db

    _.extend self, {save, find, remove, login, serv, server, setDb}
  ret.init = ret
  ret


  
  
