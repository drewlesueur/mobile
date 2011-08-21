(function() {
  define("file-droppable", function() {
    var eventer, fileDroppable;
    eventer = require("drews-event");
    return fileDroppable = function(el) {
      var emit, self;
      self = eventer({});
      emit = self.emit;
      el || (el = $("<div></div>"));
      el.bind("dragover", function(e) {
        emit("filedroppableover");
        e.preventDefault();
        return e.stopPropagation();
      });
      el.bind("dragleave", function(e) {
        emit("filedroppableleave");
        e.preventDefault();
        return e.stopPropagation();
      });
      el.bind("dragenter", function(e) {
        return false;
      });
      el.bind("drop", function(e) {
        var files;
        e.preventDefault();
        e.stopPropagation();
        e = e.originalEvent;
        files = e.dataTransfer.files;
        if (files.length > 0) {
          return emit("filedroppablefiles", files);
        } else {
          return emit("filedroppableurls", e.dataTransfer.getData('text'));
        }
      });
      return self;
    };
  });
}).call(this);
