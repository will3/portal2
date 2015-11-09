var _ = require('lodash');

module.exports = function(params) {
  params = params || {};

  var blockModel = params.blockModel;
  var startCoord = params.startCoord;
  var endCoord = params.endCoord;
  var value = params.value;
  var valueRaw = params.valueRaw;

  var originals = {};

  var apply = function() {
    var minx = startCoord.x < endCoord.x ? startCoord.x : endCoord.x;
    var miny = startCoord.y < endCoord.y ? startCoord.y : endCoord.y;
    var minz = startCoord.z < endCoord.z ? startCoord.z : endCoord.z;

    var maxx = startCoord.x > endCoord.x ? startCoord.x : endCoord.x;
    var maxy = startCoord.y > endCoord.y ? startCoord.y : endCoord.y;
    var maxz = startCoord.z > endCoord.z ? startCoord.z : endCoord.z;

    for (var x = minx; x <= maxx; x++) {
      for (var y = miny; y <= maxy; y++) {
        for (var z = minz; z <= maxz; z++) {
          var id = [x, y, z].join(',');
          if (originals[id] === undefined) {
            originals[id] = blockModel.getRaw(x, y, z);
          }

          if (!!value) {
            blockModel.set(x, y, z, value);
          } else {
            blockModel.setRaw(x, y, z, valueRaw);
          }

        }
      }
    }
  };

  return {
    run: function() {
      apply();
    },

    updateCoords: function(newStartCoord, newEndCoord) {
      if (startCoord.equals(newStartCoord) && endCoord.equals(newEndCoord)) {
        return;
      }

      this.undo();

      startCoord = newStartCoord;
      endCoord = newEndCoord;
      apply();
    },

    undo: function() {
      for (var id in originals) {
        var valueRaw = originals[id];
        var coord = id.split(',');
        blockModel.setRaw(parseInt(coord[0]), parseInt(coord[1]), parseInt(coord[2]), valueRaw);
      }

      originals = {};
    }
  }
};