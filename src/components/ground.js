var THREE = require('three');

module.exports = function(game) {
  var obj = new THREE.Object3D();
  var blockModel;
  return {
    size: 32,
    y: 0,
    visible: true,

    start: function() {
      var halfsize = this.size / 2;
      this.object.add(obj);
      blockModel = game.attach(obj, 'blockModel');
      blockModel.receiveShadow = true;
      for (var x = -halfsize; x < halfsize; x++) {
        for (var z = -halfsize; z < halfsize; z++) {
          blockModel.set(x, this.y - 1, z, {
            color: 0xe6e6e6
          });
        }
      }
    },

    setVisible: function(value) {
      this.visible = value;
      obj.visible = this.visible;
    }
  }
};