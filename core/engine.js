var _ = require('lodash');
var THREE = require('three');

var Engine = function() {
  var engine = {};
  var map = {};
  var bindings = {};
  var systems = {};
  var values = {};

  var traverse = function(callback) {
    for (var id in map) {
      map[id].forEach(function(c) {
        callback(c);
      })
    }
  };

  var bindComponent = function(type, constructor) {
    var deps = [];
    if (_.isArray(constructor)) {
      deps = constructor;
      constructor = deps.pop();
    }

    bindings[type] = {
      deps: deps,
      constructor: constructor
    };
  };

  var bindSystem = function(type, system) {
    systems[type] = system;
  };

  var bindValue = function(type, value) {
    values[type] = value;
  };

  var createComponent = function(type) {
    var binding = bindings[type];
    if (binding === undefined) {
      throw new Error('binding not found for ' + type);
    }
    var deps = _.map(binding.deps, function(type) {
      return systems[type] || values[type];
    });
    var obj = new(Function.prototype.bind.apply(binding.constructor, [null].concat(deps)));
    return obj;
  };

  var attach = function(object, component) {
    if (object._id === undefined) {
      object._id = THREE.Math.generateUUID();
    };
    var id = object._id;

    if (_.isString(component)) {
      var type = component;
      component = createComponent(type);
      component._type = type;
      component.object = object;
    }

    if (map[id] === undefined) {
      map[id] = [];
    }
    map[id].push(component);
    return component;
  };

  var dettach = function(object, component) {
    var id = object._id;

    if (map[id] === undefined) {
      return;
    }

    if (component === undefined) {
      map[id].forEach(function(c) {
        if (c.dispose !== undefined) c.dispose();
      });
      delete map[id];
      return;
    }

    if (_.isString(component)) {
      component = _.find(map[id], function(c) {
        return c === component;
      });
      if (component === undefined) return;
    }

    _.pull(map[id], component);
    if (component.dispose !== undefined) component.dispose();
    if (map[id].length === 0) {
      delete map[id];
    }
  };

  var pausing = false;
  var pause = function(value) {
    pausing = value === undefined ? true : value;
  };

  var tick = function(dt) {
    if (pausing) {
      return;
    }

    for (var type in systems) {
      var system = systems[type];
      if (system._started !== true) {
        if (system.start !== undefined) system.start();
        system._started = true;
      }
      if (system.tick !== undefined) system.tick();
    }

    traverse(function(c) {
      if (c._started !== true) {
        if (c.start !== undefined) c.start();
        c._started = true;
      }
      if (c.tick !== undefined) c.tick(dt);
    });

    traverse(function(c) {
      if (c.lateTick !== undefined) c.lateTick();
    });

    for (var type in systems) {
      var system = systems[type];
      if (system.lateTick !== undefined) system.lateTick();
    }
  };

  var interval = function() {
    tick();
    setTimeout(interval, 1000 / engine.frameRate);
  };
  interval();

  var engine = {
    get pausing() {
      return pausing;
    },
    frameRate: 48.0,
    component: bindComponent,
    system: bindSystem,
    value: bindValue,
    attach: attach,
    dettach: dettach,
    tick: tick,
    pause: pause
  };

  return engine;
};

Engine.input = require('./systems/input');
module.exports = Engine;