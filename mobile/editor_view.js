(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  define("editor-view", function() {
    var EditorView, ListView, SlateView;
    SlateView = require("slate-view");
    ListView = require("list-view");
    return EditorView = (function() {
      __extends(EditorView, Backbone.View);
      function EditorView() {
        this.populateSingleApp = __bind(this.populateSingleApp, this);
        this.populateApps = __bind(this.populateApps, this);
        this.add = __bind(this.add, this);
        this.setUpDom = __bind(this.setUpDom, this);
        this.addSingleAppSlate = __bind(this.addSingleAppSlate, this);
        this.addAppsSlate = __bind(this.addAppsSlate, this);
        this.applyBindings = __bind(this.applyBindings, this);        this.appsSlate = new SlateView();
        this.singleAppSlate = new SlateView();
        this.appsList = new ListView();
        this.$ = $;
        this.setUpDom();
        this.addAppsSlate();
        this.addSingleAppSlate();
        this.applyBindings();
      }
      EditorView.prototype.applyBindings = function() {
        return this.appsList.bind("click", __bind(function(name, app) {
          return this.trigger("appclick", app);
        }, this));
      };
      EditorView.prototype.addAppsSlate = function() {
        return this.el.append(this.appsSlate.el);
      };
      EditorView.prototype.addSingleAppSlate = function() {
        return this.el.append(this.singleAppSlate.el);
      };
      EditorView.prototype.setUpDom = function() {
        this.el = this.$("<div class=\"editor\"></div>");
        return this.appsSlate.add(this.appsList);
      };
      EditorView.prototype.add = function(otherView) {
        return this.el.append(otherView.el);
      };
      EditorView.prototype.populateApps = function(apps) {
        var titles;
        this.activate(this.appsSlate);
        titles = _.map(apps, function(app) {
          return [app.title, app];
        });
        return this.appsList.fill(titles);
      };
      EditorView.prototype.populateSingleApp = function(app) {};
      EditorView.prototype.activate = function() {};
      return EditorView;
    })();
  });
  define("slate-view", function() {
    var SlateView;
    return SlateView = (function() {
      __extends(SlateView, Backbone.View);
      function SlateView() {
        this.init = __bind(this.init, this);        this.init();
        this.$ = $;
      }
      SlateView.prototype.init = function() {
        return this.el = this.$("<div class=\"slate\"></div>");
      };
      SlateView.prototype.add = function(view) {
        return this.el.append(view.el);
      };
      return SlateView;
    })();
  });
  define("list-view", function() {
    var ListView;
    return ListView = (function() {
      __extends(ListView, Backbone.View);
      function ListView() {
        this.fill = __bind(this.fill, this);
        this.init = __bind(this.init, this);        this.init();
        this.$ = $;
      }
      ListView.prototype.init = function() {
        return this.el = this.$("<div class=\"list\"></div>");
      };
      ListView.prototype.fill = function(data) {
        return _.each(data, __bind(function(item) {
          var itemEl, name;
          name = item[0];
          itemEl = this.$("<div class=\"item\">" + name + "</div> ");
          this.el.append(itemEl);
          return itemEl.click(__bind(function() {
            return this.trigger("click", item);
          }, this));
        }, this));
      };
      return ListView;
    })();
  });
}).call(this);
