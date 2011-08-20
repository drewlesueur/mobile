(function() {
  define("file-droppable", function() {
    var fileDroppable;
    return fileDroppable = function(el) {
      el.bind("dragover", function(e) {
        el.trigger("filedroppableover");
        e.preventDefault();
        return e.stopPropagation();
      });
      el.bind("dragleave", function(e) {
        el.trigger("filedroppableleave");
        e.preventDefault();
        return e.stopPropagation();
      });
      el.bind("dragenter", function(e) {
        return false;
      });
      return el.bind("drop", function(e) {
        var files;
        e.preventDefault();
        e.stopPropagation();
        e = e.originalEvent;
        files = e.dataTransfer.files;
        if (files.length > 0) {
          return el.trigger("filedroppablefiles", [files]);
        } else {
          return el.trigger("filedroppableurls", e.dataTransfer.getData('text'));
        }
      });
    };
  });
}).call(this);
