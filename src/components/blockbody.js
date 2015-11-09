module.exports = function(editor) {

  return {
    model: model,

    hitTest: function(pos) {
      var coord = editor.posToCoord(pos);
      var block = model.get(coord.x, coord.y, coord.z);

      if (block !== undefined) {
        return {
          coord: coord;
        }
      }

      return false;
    }
  };
};