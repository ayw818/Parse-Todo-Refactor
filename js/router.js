App.Routers.MainView = Backbone.Router.extend({
  routes: {
    "all": "all",
    "active": "active",
    "completed": "completed"
  },

  initialize: function(options) {
    var state = new App.Models.AppState;
    new App.Views.ManageTodosView;
  },

  all: function() {
    state.set({ filter: "all" });
  },

  active: function() {
    state.set({ filter: "active" });
  },

  completed: function() {
    state.set({ filter: "completed" });
  }

});