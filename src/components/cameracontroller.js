var THREE = require('three');

module.exports = function(input) {
  var lastX = 0;
  var lastY = 0;
  var rotation = new THREE.Euler(Math.PI / 4, Math.PI / 4, 0, 'YXZ');

  return {
    xSpeed: 0.01,
    ySpeed: 0.01,
    target: new THREE.Vector3(),
    distance: 100,
    zoomRate: 1.1,
    minZoom: 0.25,
    maxZoom: 16,
    zoomScale: 1,
    moveSpeed: 2,

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

      var up = new THREE.Vector3(0, 1, 0);
      var camera = this.object;
      var front = new THREE.Vector3().subVectors(this.target, camera.position);
      front.y = 0;
      var right = front.clone().cross(up);

      if (inputState.keyhold('a')) {
        this.target.add(right.clone().setLength(-this.moveSpeed));
      }

      if (inputState.keyhold('d')) {
        this.target.add(right.clone().setLength(this.moveSpeed));
      }

      if (inputState.keyhold('w')) {
        this.target.add(front.clone().setLength(this.moveSpeed));
      }

      if (inputState.keyhold('s')) {
        this.target.add(front.clone().setLength(-this.moveSpeed));
      }

      if (inputState.keyhold('q')) {
        this.target.add(up.clone().setLength(-this.moveSpeed));
      }

      if (inputState.keyhold('e')) {
        this.target.add(up.clone().setLength(this.moveSpeed));
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