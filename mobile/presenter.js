Presenter = function() {
  this.initialize();
}
Presenter.extend = Backbone.View.extend
_.extend(Presenter.prototype, Backbone.Events, {
  initialize: function () {}
})