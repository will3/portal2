var keycode = require('keycode');
var _ = require('lodash');

module.exports = function() {
  var listeners = {
    mousemove: function(e) {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    },

    mousedown: function(e) {
      state.mousedowns.push(e.button);
    },

    mouseup: function(e) {
      state.mouseups.push(e.button);
    },

    mouseenter: function() {
      state.mouseenter = true;
    },

    mouseleave: function() {
      state.mouseleave = true;
    },

    keydown: function(e) {
      state.keydowns.push(keycode(e));
    },

    keyup: function(e) {
      state.keyups.push(keycode(e));
    }
  };

  var state = {
    keydowns: [],
    keyups: [],
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