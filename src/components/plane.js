var THREE = require('three');
var Noise = require('noisejs').Noise;

module.exports = function(game) {
  var obj = new THREE.Object3D();
  var noise = new Noise();
  var featureNoise = new Noise();
  noise.seed(Math.random());
  featureNoise.seed(Math.random());

  return {
    size: 32,
    y: 0,
    visible: true,
    blockModel: null,

    start: function() {
      var halfsize = this.size / 2;
      this.object.add(obj);
      this.blockModel = game.attach(obj, 'blockModel');
      this.blockModel.receiveShadow = true;

      for (var x = -halfsize; x < halfsize; x++) {
        for (var z = -halfsize; z < halfsize; z++) {
          this.blockModel.set(x, 0, z, {
            color: 0xcccccc
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