define "file-droppable", () ->
 eventer = require "drews-event" 
 fileDroppable = (el) -> 
   self = eventer {}
   {emit} = self
   el ||= $ "<div></div>"   
   el.bind "dragover", (e) ->
     emit "filedroppableover"
     e.preventDefault()
     e.stopPropagation()
   el.bind "dragleave", (e) ->
     emit "filedroppableleave"
     e.preventDefault()
     e.stopPropagation()
   el.bind "dragenter", (e) -> #ie?
     return false
   el.bind "drop", (e) ->
     e.preventDefault()
     e.stopPropagation()
     e = e.originalEvent #jQuery stuff
     files = e.dataTransfer.files
     if files.length > 0
       emit "filedroppablefiles", files
     else
       emit "filedroppableurls", e.dataTransfer.getData('text')
   self
