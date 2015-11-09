var EventDispatcher = require('../eventdispatcher');

module.exports = function() {
  var groups = {};
  var bodys = {};
  var hitTests = [];

  var collision = {
    addBody: function(body) {
      if (body.group === undefined) {
        return;
      }

      var group = body.group;
      var map = groups[group];
      if (map === undefined) {
        map = groups[group] = {};
      }

      var id = body._id;
      map[id] = body;

      bodys[body._id] = body;
    },

    removeBody: function(group, id) {
      var map = groups[group];
      if (map === undefined) {
        return;
      }

      delete map[id];
      delete bodys[id];
    },

    //adds a hit test to collision system
    addHitTest: function(hitTest) {
      hitTests.push(hitTest);
    },

    tick: function() {
      var self = this;
      this.traverse(function(a, b) {
        for (var i = 0; i < hitTests.length; i++) {
          var hitTest = hitTests[i];
          if (hitTest.shouldResolve(a, b)) {
            var result = hitTest.resolve(a, b);

            if (result !== undefined && result !== null && result !== false) {
              self.emit('collision', result);
            }

            break;
          }
        }
      });
    },

    resolveInstantly: function(a) {
      var results = [];
      this.visitRelevant(a, function(b) {
        for (var i = 0; i < hitTests.length; i++) {
          var hitTest = hitTests[i];
          if (hitTest.shouldResolve(a, b)) {
            var result = hitTest.resolve(a, b);

            if (result !== undefined && result !== null && result !== false) {
              results.push(result);
            }

            break;
          }
        }
      });

      return results;
    },

    visitRelevant: function(a, callback) {
      var masks = a.masks;

      for (var i = 0; i < masks.length; i++) {
        var mask = masks[i];
        var map = groups[mask];
        if (map === undefined) {
          continue;
        }

        for (var id in map) {
          var b = map[id];

          if (a === b) {
            continue;
          }

          callback(b);
        }
      }
    },

    traverse: function(callback) {
      var visited = {};
      for (var id in bodys) {
        var a = bodys[id];
        var masks = a.masks || [];

        for (var i = 0; i < masks.length; i++) {
          var mask = masks[i];
          var map = groups[mask];
          if (map === undefined) {
            continue;
          }

          for (var id in map) {
            var b = map[id];

            if (a === b) {
              continue;
            }

            if (visited[a._id] !== undefined && visited[a._id][b._id] === true) {
              continue;
            }

            callback(a, b);
            if (visited[b._id] === undefined) {
              visited[b._id] = {};
            }
            visited[b._id][a._id] = true;
          }
        }
      }
    }
  }

  EventDispatcher.prototype.apply(collision);

  return collision;
};