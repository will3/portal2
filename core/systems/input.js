var keycode = require('keycode');
var _ = require('lodash');

module.exports = function(game) {
  var listeners = {
    mousemove: function(e) {
      if (game.pausing) return;
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    },

    mousedown: function(e) {
      if (game.pausing) return;
      state.mousedowns.push(e.button);
    },

    mouseup: function(e) {
      if (game.pausing) return;
      state.mouseups.push(e.button);
    },

    mouseenter: function() {
      if (game.pausing) return;
      state.mouseenter = true;
      state.keyholds = [];
    },

    mouseleave: function() {
      if (game.pausing) return;
      state.mouseleave = true;
      state.keyholds = [];
    },

    keydown: function(e) {
      if (game.pausing) return;
      var key = keycode(e);
      state.keydowns.push(key);
      if (!_.includes(state.keyholds, key)) {
        state.keyholds.push(key);
      }
    },

    keyup: function(e) {
      if (game.pausing) return;
      var key = keycode(e);
      state.keyups.push(key);
      _.pull(state.keyholds, key);
    }
  };

  var state = {
    keydowns: [],
    keyups: [],
    keyholds: [],
    mouseX: 0,
    mouseY: 0,
    mousedowns: [],
    mouseups: [],
    mouseenter: false,
    mouseleave: false,
    keydown: function(key) {
      return _.includes(this.keydowns, key);
    },
    keyup: function(key) {
      return _.includes(this.keyups, key);
    },
    keyhold: function(key) {
      return _.includes(this.keyholds, key);
    },
    mousedown: function(button) {
      if (button === undefined) {
        return this.mousedowns.length > 0;
      }
      return _.includes(this.mousedowns, button);
    },
    mouseup: function(button) {
      if (button === undefined) {
        return this.mouseups.length > 0;
      }
      return _.includes(this.mouseups, button);
    }
  };

  return {
    start: function() {
      window.addEventListener('mousemove', listeners['mousemove']);
      window.addEventListener('mousedown', listeners['mousedown']);
      window.addEventListener('mouseup', listeners['mouseup']);
      window.addEventListener('mouseenter', listeners['mouseenter']);
      window.addEventListener('mouseleave', listeners['mouseleave']);
      window.addEventListener('keydown', listeners['keydown']);
      window.addEventListener('keyup', listeners['keyup']);
    },

    state: state,

    lateTick: function() {
      state.keydowns = [];
      state.keyups = [];
      state.mousedowns = [];
      state.mouseups = [];
      state.mouseenter = false;
      state.mouseleave = false;
    },

    dispose: function() {
      window.removeEventListener('mousemove', listeners['mousemove']);
      window.removeEventListener('mousedown', listeners['mousedown']);
      window.removeEventListener('mouseup', listeners['mouseup']);
      window.removeEventListener('mouseenter', listeners['mouseenter']);
      window.removeEventListener('mouseleave', listeners['mouseleave']);
      window.removeEventListener('keydown', listeners['keydown']);
      window.removeEventListener('keyup', listeners['keyup']);
    }
  };
};