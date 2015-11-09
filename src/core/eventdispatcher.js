var EventDispatcher = function() {
  this._listeners = {};
};

EventDispatcher.prototype = {

  apply: function(prototype) {
    prototype._listeners = {};
    prototype.on = EventDispatcher.prototype.on;
    prototype.emit = EventDispatcher.prototype.emit;
    prototype.removeListener = EventDispatcher.prototype.removeListener;
  },

  on: function(event, callback) {
    var list = this._listeners[event];
    if (list === undefined) {
      list = this._listeners[event] = [];
    }
    list = this._listeners[event].push(callback);
  },

  emit: function(event) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    var list = this._listeners[event];
    if (list === undefined) {
      return;
    }

    list.forEach(function(callback) {
      callback.apply(null, args);
    });
  },

  removeListener: function(event, callback) {
    var list = this._listeners[event];
    if (list === undefined) {
      return;
    }
    _.pull(list, callback);

    if (callback === undefined) {
      delete this._listeners[event];
    }
  }

};

module.exports = EventDispatcher;