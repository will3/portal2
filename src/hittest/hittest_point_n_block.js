module.exports = function(editor) {
  return {
    shouldResolve: function(a, b) {
      return (a.type === 'point' && b.type === 'block') || (a.type === 'block' && b.type === 'point');
    },

    resolve: function(a, b) {
      var point = a.type === 'point' ? a : b;
      var block = point === a ? b : a;

      var coord = editor.posToCoord(point.point);

      if (block.model.getRaw(coord.x, coord.y + 1, coord.z) !== undefined) {
        return {
          ramp: true,
          coord: new THREE.Vector3(coord.x, coord.y + 1, coord.z)
        }
      }

      if (block.model.getRaw(coord.x, coord.y, coord.z) !== undefined) {
        return {
          coord: coord
        };
      }



      return false;
    }
  }
};