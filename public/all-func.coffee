dModule.define "all-func", ->
  _ = dModule.require "underscore"
  ret = {}
  ret.object = (o = {}) ->
    (key, value) ->
      if (not value) and (key)
        return o[key]
      else if (key)
        return o[key] = value
      else #for javascript to get the original value if needed
        return o


  ret.isEqual = (a, b) ->
    _.isEqual a(), b()

    
        
  ret.object ret
