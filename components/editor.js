var THREE = require('three');

module.exports = function(game, input, camera) {

  var disposeList = [];

  var toDispose = function(obj) {
    disposeList.push(obj);
    return obj;
  };

  var getRaycaster = function() {
    var inputState = input.state;
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (inputState.mouseX / window.innerWidth) * 2 - 1;
    mouse.y = -(inputState.mouseY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster;
  };

  var coord = null;
  var hoverover = null;
  var objBlockModel = new THREE.Object3D();
  var mousehold = false;
  var lastCoord = null;
  var cameraComponent = null;
  var lastMousedown = 0;

  return {
    grid: null,
    blockModel: null,
    gridSize: 2,
    gridNum: 32,
    color: 0x000000,
    clickTime: 200,
    mode: 'grid',

    setColor: function(value) {
      this.color = value;

      this._updateHoverover();
      hoverover.visible = false;
    },

    setMode: function(mode) {
      if (this.mode !== mode) {
        this.mode = mode;
        if (cameraComponent !== null) {
          game.dettach(camera, cameraComponent);
        }
        this._attachCameraComponent();
      }
    },

    start: function() {
      this.grid = game.attach(this.object, 'grid');
      this.grid.gridSize = this.gridSize;
      this.grid.num = this.gridNum;

      var offset = -this.gridSize * this.gridNum / 2;
      this.object.add(objBlockModel);
      this.blockModel = game.attach(objBlockModel, 'blockModel');
      this.blockModel.gridSize = this.gridSize;

      this._updateHoverover();
      this._attachCameraComponent();
    },

    tick: function() {
      if (!this.grid._started) {
        return;
      }

      this._updateCoord();
      this._updateHoveroverPosition();
      this._updateInput();

    },

    _attachCameraComponent: function() {
      if (this.mode === 'grid') {
        cameraComponent = game.attach(camera, 'cameraController');
      } else if (this.mode === 'firstPerson') {
        cameraComponent = game.attach(camera, 'firstPersonControl');
      }
    },

    _updateInput: function() {
      var inputState = input.state;

      if (inputState.mousedown(0)) {
        mousehold = true;
        lastMousedown = new Date().getTime();
      }

      var mouseclick = false;
      if (inputState.mouseup(0)) {
        mousehold = false;
        lastCoord = null;
        var diff = new Date().getTime() - lastMousedown;
        if (diff < this.clickTime) {
          mouseclick = true;
        }
      }

      if (inputState.mouseenter || inputState.mouseleave) {
        mousehold = false;
        lastCoord = null;
      }

      //update add block
      if (this.mode === 'grid') {
        if (mousehold && coord !== null) {
          //if no last coord, or last coord is different from coord
          if (!lastCoord || !lastCoord.equals(coord)) {
            this.blockModel.set(coord.x, coord.y, coord.z, {
              color: this.color
            });

            lastCoord = coord.clone();
          }
        }

        if (inputState.keydown('g')) {
          //toggle grid
          this.grid.setVisible(!this.grid.visible);
        }
      } else if (this.mode === 'firstPerson') {
        if (mouseclick && coord !== null) {
          this.blockModel.set(coord.x, coord.y, coord.z, {
            color: this.color
          });
        }
      }

      //update mode
      if (inputState.keydown('f')) {
        if (this.mode === 'grid') {
          this.setMode('firstPerson');
          this.grid.setVisible(false);
        } else if (this.mode === 'firstPerson') {
          this.setMode('grid');
          this.grid.setVisible(true);
        }
      }
    },

    _updateHoveroverPosition: function() {
      if (coord === null) {
        hoverover.visible = false;
        return;
      }

      hoverover.visible = true;
      hoverover.position.copy(
        coord.clone()
        .add(new THREE.Vector3(0.5, 0.5, 0.5))
        .multiplyScalar(this.gridSize)
      );
    },

    _updateCoord: function() {
      var raycaster = getRaycaster();
      var intersects;
      if (this.mode === 'grid') {
        intersects = raycaster.intersectObject(this.grid.objCollision);
      } else if (this.mode === 'firstPerson') {
        intersects = raycaster.intersectObject(this.blockModel.obj, true);
      }

      if (intersects.length === 0) {
        coord = null;
        return;
      }

      var point = intersects[0].point;
      var position = point.clone().sub(camera.position);
      position.setLength(position.length() - 0.01).add(camera.position);
      coord = position.multiplyScalar(1 / this.gridSize);
      coord = new THREE.Vector3(
        Math.round(coord.x - 0.5),
        Math.round(coord.y - 0.5),
        Math.round(coord.z - 0.5));
    },

    _updateHoverover: function() {
      if (hoverover !== null) {
        this.object.remove(hoverover);
      }

      var geometry = new THREE.BoxGeometry(this.gridSize, this.gridSize, this.gridSize);
      var cube = new THREE.Mesh(geometry);

      var darkerColor = new THREE.Color(this.color).offsetHSL(0, 0, -0.3).getHex();
      var edges = new THREE.EdgesHelper(cube, darkerColor);
      toDispose(edges.geometry);
      toDispose(edges.material);
      var object = new THREE.Object3D();
      object.add(edges);
      geometry.dispose();

      hoverover = object;
      this.object.add(hoverover);
    },

    dispose: function() {
      disposeList.forEach(function(obj) {
        obj.dispose();
      });
    }
  };
};