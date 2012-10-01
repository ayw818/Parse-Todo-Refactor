// An example Parse.js Backbone application based on the todo app by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses Parse to persist
// the todo items and provide user authentication and sessions.

var App = {
    Views: {},
    Routers: {},
    Models: {},
    Collections: {},    
    init: function() {
        Parse.initialize("0Oq3tTp9JMvd72LOrGN25PiEq9XgVHCxo57MQbpT", "vUFy2o7nFx3eeKVlZneYMPI2MBoxT5LhWNoIWPja");
        new App.Routers.MainView();
        Backbone.history.start();
    },
};
