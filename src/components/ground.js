var THREE = require('three');
var Noise = require('noisejs').Noise;

module.exports = function(game, collision) {
  var obj = new THREE.Object3D();
  var body;
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

      body = game.attach(obj, 'blockBody');
      body.group = 'terrian';
      body.model = this.blockModel;
      collision.addBody(body);

      var amplitude = Math.random() * 2 + 4;

      for (var x = -halfsize; x < halfsize; x++) {
        for (var z = -halfsize; z < halfsize; z++) {
          var n = noise.simplex2(x / 20, z / 20);
          var height = Math.round(n * amplitude - 1);

          for (var y = height; y >= height - 2; y--) {

            var feature = featureNoise.simplex3(x / 25, y / 25, z / 25);
            var color = 0x90C078;
            if (feature < -0.4) {
              color = 0x444444;
            } else if (feature < -0.3) {
              color = 0x555555;
            } else if (feature < -0.2) {
              color = 0x666666;
            } else if (feature < -0.1) {
              color = 0x777777;
            } else if (feature < 0) {
              color = 0x888888;
            }

            this.blockModel.set(x, y, z, {
              color: color
            });
          }
        }
      }
    },

    setVisible: function(value) {
      this.visible = value;
      obj.visible = this.visible;
    }
  }
};