module.exports = function(blockModel, coord, value, valueRaw) {
  var original;

  return {
    run: function() {
      original = blockModel.getRaw(coord.x, coord.y, coord.z);

      if (!value) {
        blockModel.setRaw(coord.x, coord.y, coord.z, valueRaw);
      } else {
        blockModel.set(coord.x, coord.y, coord.z, value);
      }
    },

    undo: function() {
      blockModel.setRaw(coord.x, coord.y, coord.z, original);
    }
  }
};