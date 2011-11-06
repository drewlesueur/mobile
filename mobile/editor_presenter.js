(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  define("editor-presenter", function() {
    var App, EditorPresenter, EditorView;
    App = require("app");
    EditorView = require("editor-view");
    return EditorPresenter = (function() {
      __extends(EditorPresenter, Presenter);
      function EditorPresenter() {
        this.applyBindings = __bind(this.applyBindings, this);        this.app = new App();
        this.view = new EditorView();
        this.applyBindings();
      }
      EditorPresenter.prototype.getApps = function() {
        return this.app.find();
      };
      EditorPresenter.prototype.applyBindings = function() {
        this.app.bind("found", __bind(function(apps) {
          return this.view.populateApps(apps);
        }, this));
        return this.view.bind("appclick", __bind(function(app) {
          return this.view.populateSingleApp(app);
        }, this));
      };
      return EditorPresenter;
    })();
  });
}).call(this);
