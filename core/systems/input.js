var keycode = require('keycode');
var _ = require('lodash');

module.exports = function(game, element) {
  var clickTime = 150;
  element = element || window;

  var listeners = {
    mousemove: function(e) {
      if (game.pausing) return;
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    },

    mousedown: function(e) {
      if (game.pausing) return;
      state.mousedowns.push(e.button);
      if (!_.includes(state.mouseholds, e.button)) {
        state.mouseholds.push(e.button);
      }
      state.mousedownTimes[e.button] = new Date().getTime();
    },

    mouseup: function(e) {
      if (game.pausing) return;
      state.mouseups.push(e.button);
      _.pull(state.mouseholds, e.button);
      var mousedownTime = state.mousedownTimes[e.button];
      var diff = new Date().getTime() - mousedownTime;
      if (diff < clickTime) {
        state.mouseclicks.push(e.button);
      }
    },

    mouseenter: function() {
      if (game.pausing) return;
      state.mouseenter = true;
      state.keyholds = [];
      state.mouseholds = [];
      state.mouseclicks = [];
    },

    mouseleave: function() {
      if (game.pausing) return;
      state.mouseleave = true;
      state.keyholds = [];
      state.mouseholds = [];
      state.mouseclicks = [];
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

  var createState = function() {
    return {
      keydowns: [],
      keyups: [],
      keyholds: [],
      mouseX: 0,
      mouseY: 0,
      mousedowns: [],
      mouseclicks: [],
      mouseups: [],
      mouseholds: [],
      mouseenter: false,
      mouseleave: false,
      mousedownTimes: {},

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
      },
      mouseclick: function(button) {
        if (button === undefined) {
          return this.mouseclicks.length > 0;
        }
        return _.includes(this.mouseclicks, button);
      },
      mousehold: function(button) {
        if (button === undefined) {
          return this.mouseholds.length > 0;
        }
        return _.includes(this.mouseholds, button);
      }
    };
  };

  var state = createState();

  var clearTemporalStates = function() {
    state.keydowns = [];
    state.keyups = [];
    state.mousedowns = [];
    state.mouseups = [];
    state.mouseenter = false;
    state.mouseleave = false;
    state.mouseclicks = [];
  };

  var resetState = function() {
    state = createState();
  };

  return {
    start: function() {
      element.addEventListener('mousemove', listeners['mousemove']);
      element.addEventListener('mousedown', listeners['mousedown']);
      element.addEventListener('mouseup', listeners['mouseup']);
      element.addEventListener('mouseenter', listeners['mouseenter']);
      element.addEventListener('mouseleave', listeners['mouseleave']);
      element.addEventListener('keydown', listeners['keydown']);
      element.addEventListener('keyup', listeners['keyup']);
      game.on('pause', function() {
        resetState();
      });
    },

    get clickTime() {
      return clickTime;
    },

    setClickTime: function(value) {
      clickTime = value;
    },

    get state() {
      return state;
    },

    lateTick: function() {
      clearTemporalStates();
    },

    dispose: function() {
      element.removeEventListener('mousemove', listeners['mousemove']);
      element.removeEventListener('mousedown', listeners['mousedown']);
      element.removeEventListener('mouseup', listeners['mouseup']);
      element.removeEventListener('mouseenter', listeners['mouseenter']);
      element.removeEventListener('mouseleave', listeners['mouseleave']);
      element.removeEventListener('keydown', listeners['keydown']);
      element.removeEventListener('keyup', listeners['keyup']);
    }
  };
};