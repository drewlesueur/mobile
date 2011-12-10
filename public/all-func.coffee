dModule.define "all-func", ->
  _ = dModule.require "underscore"
  ret = {}
  #TODO: make this recursive
  ret.object = (o = {}) ->
    (args...) ->
      [key, value] = args
      if args.length == 1
        return o[key]
      else if args.length == 2
        return o[key] = value
      else #for javascript to get the original value if needed
        return o

  ret.list = (o = []) ->
    fn = (args...) ->
      [key, value] = args
      if args.length == 1
        return o[key]
      else if args.length == 2
        return o[key] = value
      else #for javascript to get the original value if needed
        return o



  ret.isEqual = (a, b) ->
    _.isEqual a(), b()

    
        
  ret.object ret
