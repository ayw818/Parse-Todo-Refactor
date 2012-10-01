// An example Parse.js Backbone application based on the todo app by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses Parse to persist
// the todo items and provide user authentication and sessions.


// This is the transient application state, not persisted on Parse
App.Models.AppState = Parse.Object.extend("AppState", {                      // was var AppState
  defaults: {
    filter: "all"
  }
});

// Our basic Todo model has `content`, `order`, and `done` attributes.
App.Models.Todo = Parse.Object.extend("Todo", {                              // was var Todo
  // Default attributes for the todo.
  defaults: {
    content: "empty todo...",
    done: false
  },

  // Ensure that each todo created has `content`.
  initialize: function() {
    if (!this.get("content")) {
      this.set({"content": this.defaults.content});
    }
  },

  // Toggle the `done` state of this todo item.
  toggle: function() {
    this.save({done: !this.get("done")});
  }
});

App.Collections.TodoList = Backbone.Collection.extend({                           // was var TodoList 

  // Reference to this collection's model.
  model: App.Models.Todo,

  // Filter down the list of all todo items that are finished.
  done: function() {
    return this.filter(function(todo){ return todo.get('done'); });
  },

  // Filter down the list to only todo items that are still not finished.
  remaining: function() {
    return this.without.apply(this, this.done());
  },

  // We keep the Todos in sequential order, despite being saved by unordered
  // GUID in the database. This generates the next order number for new items.
  nextOrder: function() {
    if (!this.length) return 1;
    return this.last().get('order') + 1;
  },

  // Todos are sorted by their original insertion order.
  comparator: function(todo) {
    return todo.get('order');
  }
});
