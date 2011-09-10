InputUpload = {}

InputUpload.init = (els) ->
  fileDroppable = require "file-droppable"
  FileBox = require "filebox" 
  eventer = require "drews-event" 
  self = eventer {}
  {emit} = self

  fileHandler = fileDroppable $(els)
  fileHandler.on "filedroppableover", (el) ->
    $(el).css "background-color": "yellow"
  fileHandler.on "filedroppableleave", (el) ->
    $(el).css "background-color": "white"

  fileHandler.on "filedroppableurls", (urls, el) ->
    el = $(el)
    $(el).css "background-color": "white"
    el.val urls
    emit "change", $(el)
    
    

  fileHandler.on "filedroppablefiles", (files, el) ->
    el = $(el)
    $(el).css "background-color": "white"
    progressBar = $ """
      <div style="background-color: blue; height: 10px; width: 0px; position: absolute; left: #{el.offset().left}px; top: #{el.offset().top}px; " ></div>
    """
    $(document.body).append progressBar
    filebox = FileBox()
    filebox.on "progress", (progress) ->
      progressBar.css
        width: $(el).width() * progress + "px"
    el = $(el)
    filebox.uploadFiles files, (err, urls) ->
      el.val urls[0]
      emit "change", $(el)
      progressBar.remove()
  self

define "input-upload", -> InputUpload
