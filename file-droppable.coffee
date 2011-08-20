# jquery helper
define "file-droppable", () ->
 fileDroppable = (el) -> 
   el.bind "dragover", (e) ->
     el.trigger "filedroppableover"
     e.preventDefault()
     e.stopPropagation()
   el.bind "dragleave", (e) ->
     el.trigger "filedroppableleave"
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
       el.trigger "filedroppablefiles", [files]
     else
       el.trigger "filedroppableurls", e.dataTransfer.getData('text')
