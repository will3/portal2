var THREE = require('three');

module.exports = function(input) {
  var lastX = 0;
  var lastY = 0;
  var rotation = new THREE.Euler(Math.PI / 2 - 0.1, 0, 0, 'YXZ');

  return {
    xSpeed: 0.01,
    ySpeed: 0.01,
    target: new THREE.Vector3(),
    distance: 50,
    zoomRate: 1.1,
    minZoom: 0.25,
    maxZoom: 4,
    zoomScale: 1,

    start: function() {
      this.updatePosition();
    },

    tick: function() {
      this._updateMouse();
      this._updateKeyboard();
      this.updatePosition();
    },

    _updateMouse: function() {
      var inputState = input.state;
      var drag = inputState.mousehold(2);

      if (drag) {
        var diffX = inputState.mouseX - lastX;
        var diffY = inputState.mouseY - lastY;

        rotation.y -= diffX * this.xSpeed;
        rotation.x += diffY * this.ySpeed;
        if (rotation.x > Math.PI / 2 - 0.01) {
          rotation.x = Math.PI / 2 - 0.01;
        } else if (rotation.x < -Math.PI / 2 + 0.01) {
          rotation.x = -Math.PI / 2 + 0.01;
        }

        this.updatePosition();
      }

      lastX = inputState.mouseX;
      lastY = inputState.mouseY;
    },

    _updateKeyboard: function() {
      var inputState = input.state;

      if (inputState.keydown('-')) {
        this.zoomScale *= this.zoomRate;
      }

      if (inputState.keydown('=')) {
        this.zoomScale /= this.zoomRate;
      }

      if (this.zoomScale < this.minZoom) {
        this.zoomScale = this.minZoom;
      } else if (this.zoomScale > this.maxZoom) {
        this.zoomScale = this.maxZoom;
      }
    },

    updatePosition: function() {
      var forward = new THREE.Vector3(0, 0, 1).applyEuler(rotation).multiplyScalar(this.distance * this.zoomScale);
      var position = this.target.clone().sub(forward);
      var camera = this.object;
      camera.position.copy(position);
      camera.lookAt(this.target);
    }
  };
};