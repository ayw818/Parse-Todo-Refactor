// An example Parse.js Backbone application based on the todo app by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses Parse to persist
// the todo items and provide user authentication and sessions.


// Todo Item View
// --------------

// The DOM element for a todo item...
App.Views.TodoView = Parse.View.extend({

  //... is a list tag.
  tagName:  "li",

  // Cache the template function for a single item.

  template: _.template($('#item-template').html()),

  // The DOM events specific to an item.
  events: {
    "click .toggle"              : "toggleDone",
    "dblclick label.todo-content" : "edit",
    "click .todo-destroy"   : "clear",
    "keypress .edit"      : "updateOnEnter",
    "blur .edit"          : "close"
  },

  // The TodoView listens for changes to its model, re-rendering. Since there's
  // a one-to-one correspondence between a Todo and a TodoView in this
  // app, we set a direct reference on the model for convenience.
  initialize: function() {
    _.bindAll(this, 'render', 'close', 'remove');
    this.model.bind('change', this.render);
    this.model.bind('destroy', this.remove);
  },

  // Re-render the contents of the todo item.
  render: function() {
    $(this.el).html(this.template(this.model.toJSON()));
    this.input = this.$('.edit');
    return this;
  },

  // Toggle the `"done"` state of the model.
  toggleDone: function() {
    this.model.toggle();
  },

  // Switch this view into `"editing"` mode, displaying the input field.
  edit: function() {
    $(this.el).addClass("editing");
    this.input.focus();
  },

  // Close the `"editing"` mode, saving changes to the todo.
  close: function() {
    this.model.save({content: this.input.val()});
    $(this.el).removeClass("editing");
  },

  // If you hit `enter`, we're through editing the item.
  updateOnEnter: function(e) {
    if (e.keyCode == 13) this.close();
  },

  // Remove the item, destroy the model.
  clear: function() {
    this.model.destroy();
  }

});


// The main view that lets a user manage their todo items
App.Views.ManageTodosView = Parse.View.extend({

  // Our template for the line of statistics at the bottom of the app.
  statsTemplate: _.template($('#stats-template').html()),

  // Delegated events for creating new items, and clearing completed ones.
  events: {
    "keypress #new-todo":  "createOnEnter",
    "click #clear-completed": "clearCompleted",
    "click #toggle-all": "toggleAllComplete",
    "click .log-out": "logOut",
    "click ul#filters a": "selectFilter"
  },

  el: ".content",

  // At initialization we bind to the relevant events on the `Todos`
  // collection, when items are added or changed. Kick things off by
  // loading any preexisting todos that might be saved to Parse.
  initialize: function() {
    var self = this;

    _.bindAll(this, 'addOne', 'addAll', 'addSome', 'render', 'toggleAllComplete', 'logOut', 'createOnEnter');

    // Main todo management template
    this.$el.html(_.template($("#manage-todos-template").html()));
    
    this.input = this.$("#new-todo");
    this.allCheckbox = this.$("#toggle-all")[0];

    // Create our collection of Todos
    this.todos = new App.Collections.TodoList;

    // Setup the query for the collection to look for todos from the current user
    this.todos.query = new Parse.Query(App.Models.Todo);
    this.todos.query.equalTo("user", Parse.User.current());
      
    this.todos.bind('add',     this.addOne);
    this.todos.bind('reset',   this.addAll);
    this.todos.bind('all',     this.render);

    // Fetch all the todo items for this user
    this.todos.fetch();

    state.on("change", this.filter, this);
  },

  // Logs out the user and shows the login view
  logOut: function(e) {
    Parse.User.logOut();
    this.undelegateEvents();
    delete this;
    window.location.href = window.location.href.replace("app.html", "index.html");
  },

  // Re-rendering the App just means refreshing the statistics -- the rest
  // of the app doesn't change.
  render: function() {
    var done = this.todos.done().length;
    var remaining = this.todos.remaining().length;

    this.$('#todo-stats').html(this.statsTemplate({
      total:      this.todos.length,
      done:       done,
      remaining:  remaining
    }));

    this.delegateEvents();

    this.allCheckbox.checked = !remaining;
  },

  // Filters the list based on which type of filter is selected
  selectFilter: function(e) {
    var el = $(e.target);
    var filterValue = el.attr("id");
    state.set({filter: filterValue});
    Parse.history.navigate(filterValue);
  },

  filter: function() {
    var filterValue = state.get("filter");
    this.$("ul#filters a").removeClass("selected");
    this.$("ul#filters a#" + filterValue).addClass("selected");
    if (filterValue === "all") {
      this.addAll();
    } else if (filterValue === "completed") {
      this.addSome(function(item) { return item.get('done') });
    } else {
      this.addSome(function(item) { return !item.get('done') });
    }
  },

  // Resets the filters to display all todos
  resetFilters: function() {
    this.$("ul#filters a").removeClass("selected");
    this.$("ul#filters a#all").addClass("selected");
    this.addAll();
  },

  // Add a single todo item to the list by creating a view for it, and
  // appending its element to the `<ul>`.
  addOne: function(todo) {
    var view = new App.Views.TodoView({model: todo});
    this.$("#todo-list").append(view.render().el);
  },

  // Add all items in the Todos collection at once.
  addAll: function(collection, filter) {
    this.$("#todo-list").html("");
    this.todos.each(this.addOne);
  },

  // Only adds some todos, based on a filtering function that is passed in
  addSome: function(filter) {
    var self = this;
    this.$("#todo-list").html("");
    this.todos.chain().filter(filter).each(function(item) { self.addOne(item) });
  },

  // If you hit return in the main input field, create new Todo model
  createOnEnter: function(e) {
    var self = this;
    if (e.keyCode != 13) return;

    this.todos.create({
      content: this.input.val(),
      order:   this.todos.nextOrder(),
      done:    false,
      user:    Parse.User.current(),
      ACL:     new Parse.ACL(Parse.User.current())
    });

    this.input.val('');
    this.resetFilters();
  },

  // Clear all done todo items, destroying their models.
  clearCompleted: function() {
    _.each(this.todos.done(), function(todo){ todo.destroy(); });
    return false;
  },

  toggleAllComplete: function () {
    var done = this.allCheckbox.checked;
    this.todos.each(function (todo) { todo.save({'done': done}); });
  }
});