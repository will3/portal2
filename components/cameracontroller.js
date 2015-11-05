var THREE = require('three');

module.exports = function(input) {
  var mousehold = false;
  var lastX = 0;
  var lastY = 0;
  var rotation = new THREE.Euler(Math.PI / 4, Math.PI / 4, 0, 'YXZ');

  return {
    xSpeed: 0.01,
    ySpeed: 0.01,
    target: new THREE.Vector3(),
    distance: 50,

    start: function() {
      this.updatePosition();
    },

    tick: function() {
      var inputState = input.state;

      if (inputState.mousedown(2)) {
        mousehold = true;
      }

      if (inputState.mouseup(2)) {
        mousehold = false;
      }

      if (inputState.mouseenter || inputState.mouseleave) {
        mousehold = false;
      }

      if (mousehold) {
        var diffX = inputState.mouseX - lastX;
        var diffY = inputState.mouseY - lastY;

        rotation.y += diffX * this.xSpeed;
        if (rotation.x > Math.PI / 2) {
          rotation.x = Math.PI / 2;
        } else if (rotation.x < -Math.PI / 2) {
          rotation.x = -Math.PI / 2;
        }

        rotation.x -= diffY * this.ySpeed;

        this.updatePosition();
      }

      lastX = inputState.mouseX;
      lastY = inputState.mouseY;
    },

    updatePosition: function() {
      var forward = new THREE.Vector3(0, 0, 1).applyEuler(rotation).multiplyScalar(this.distance);
      var position = this.target.clone().sub(forward);
      var camera = this.object;
      camera.position.copy(position);
      camera.lookAt(this.target);
    }
  };
};