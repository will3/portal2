//attach a first person control on an object/camera
module.exports = function(input) {
  var forward = 0;
  var strife = 0;
  var mousehold = false;
  var lastX = null;
  var lastY = null;
  var yaw = 0;
  var pitch = 0;

  return {
    forwardSpeed: 1,
    backwardSpeed: 0.5,
    strifeSpeed: 1,
    rotateSpeed: 0.01,

    start: function() {

    },

    tick: function() {
      this._updateInput();
      this._updateMovement();
    },

    _updateInput: function() {
      var inputState = input.state;

      forward = 0;
      if (inputState.keyhold('w')) {
        forward++;
      }

      if (inputState.keyhold('s')) {
        forward--;
      }

      strife = 0;
      if (inputState.keyhold('d')) {
        strife++;
      }

      if (inputState.keyhold('a')) {
        strife--;
      }

      if (inputState.mousedown(2)) {
        mousehold = true;
      }

      if (inputState.mouseup(2)) {
        mousehold = false;
        lastX = lastY = null;
      }

      if (inputState.mouseenter || inputState.mouseleave) {
        mousehold = false;
        lastX = lastY = null;
      }

      if (mousehold) {
        if (lastX !== null && lastY !== null) {
          var diffX = inputState.mouseX - lastX;
          var diffY = inputState.mouseY - lastY;

          yaw = diffX * this.rotateSpeed;
          pitch = diffY * this.rotateSpeed;
        }

        lastX = inputState.mouseX;
        lastY = inputState.mouseY;
      }
    },

    _updateMovement: function() {
      if (forward > 0) {
        var forwardVector = new THREE.Vector3(0, 0, -1);
        forwardVector.applyEuler(this.object.rotation).multiplyScalar(this.forwardSpeed);
        this.object.position.add(forwardVector);
      } else if (forward < 0) {
        var backwardVector = new THREE.Vector3(0, 0, 1);
        backwardVector.applyEuler(this.object.rotation).multiplyScalar(this.backwardSpeed);
        this.object.position.add(backwardVector);
      }

      var rightVector = new THREE.Vector3(1, 0, 0);
      rightVector.applyEuler(this.object.rotation).multiplyScalar(strife * this.strifeSpeed);
      this.object.position.add(rightVector);

      this.object.rotation.y -= yaw;

      this.object.rotation.x -= pitch;

      if (this.object.rotation.x > Math.PI / 2) {
        this.object.rotation.x = Math.PI / 2;
      } else if (this.object.rotation.x < -Math.PI / 2) {
        this.object.rotation.x = -Math.PI / 2;
      }
    }
  }
};