var THREE = require('three');

module.exports = function(game, collision, editor, input) {
  var body, blockModel;
  var ySpeed = 0;
  var gravity = 0.1;
  var objBlockModel = new THREE.Object3D();
  var yawAmount = 0;
  var forwardAmount = 0;
  var forward = new THREE.Vector3(0, 0, 1);
  var invisibleForce = 0;
  var jumpAmount = 0;

  return {
    fowardSpeed: 1,
    yawSpeed: 0.2,
    jumpSpeed: 2,
    start: function() {
      this.object.add(objBlockModel);
      blockModel = game.attach(objBlockModel, 'blockModel');
      blockModel.castShadow = true;
      blockModel.receiveShadow = true;
      blockModel.set(0, 0, 0, {
        color: 0xff0000
      });

      var gridSize = editor.gridSize;
      objBlockModel.position.set(-gridSize / 2, -gridSize / 2, -gridSize / 2);
    },

    tick: function() {
      var originalPosition = this.object.position.clone();
      this._applyMovement();
      this._updateCollision(originalPosition);
      this._updateInput();

      if (this.object.position.y <= -100) {
        this.object.position.copy(0, 10, 0);
        ySpeed = 0;
        invisibleForce = 0;
      }
    },

    _updateInput: function() {
      var inputState = input.state;

      if (inputState.keyhold('w') && !inputState.keyhold('s')) {
        forwardAmount = 1;
      } else if (inputState.keyhold('s') && !inputState.keyhold('w')) {
        forwardAmount = -1;
      } else {
        forwardAmount = invisibleForce;
      }

      // invisibleForce += 0.01;

      if (inputState.keyhold('a') && !inputState.keyhold('d')) {
        yawAmount = 1;
      } else if (inputState.keyhold('d') && !inputState.keyhold('a')) {
        yawAmount = -1;
      } else {
        yawAmount = 0;
      }

      if(inputState.keydown('space')){
        jumpAmount = 1;
      }else{
        jumpAmount = 0;
      }
    },

    //returns position
    _applyMovement: function() {
      var position = this.object.position.clone();
      var rotation = this.object.rotation.clone();

      ySpeed += jumpAmount * this.jumpSpeed;

      ySpeed -= gravity;
      position.y += ySpeed;

      var yaw = yawAmount * this.yawSpeed;
      rotation.y += yaw;

      var vector = forward.clone().applyEuler(this.object.rotation).setLength(forwardAmount * this.fowardSpeed);
      position.add(vector);

      this.object.position.copy(position);
      this.object.rotation.copy(rotation);
    },

    _updateCollision: function(originalPosition) {
      var pointFeet = this.object.position.clone();
      pointFeet.y -= editor.gridSize / 2;

      var body = {
        type: 'point',
        group: 'character',
        masks: ['terrian'],
        point: pointFeet
      };

      var results = collision.resolveInstantly(body);
      var characterCoord = editor.posToCoord(this.object.position);

      if (results.length > 0) {
        for (var i = 0; i < results.length; i++) {
          var result = results[i];
          var coord = result.coord;
          coord.add(new THREE.Vector3(0, 0.5, 0));
          var pos = editor.coordToPos(coord);
          this.object.position.y = pos.y + editor.gridSize / 2;
          ySpeed = 0;
          if(result.ramp === true){
            invisibleForce *= 0.5;
          }
        }
      }
    }
  }
};