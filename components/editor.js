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

  return {
    grid: null,
    blockModel: null,
    gridSize: 3,
    gridNum: 16,
    color: 0x000000,
    clickTime: 200,

    setColor: function(value) {
      this.color = value;

      this._updateHoverover();
      hoverover.visible = false;
    },

    start: function() {
      this.grid = game.attach(this.object, 'grid');
      this.grid.gridSize = this.gridSize;
      this.grid.num = this.gridNum;

      var offset = -this.gridSize * this.gridNum / 2;
      objBlockModel.position.copy(
        new THREE.Vector3(offset, offset, offset)
      );
      this.object.add(objBlockModel);
      this.blockModel = game.attach(objBlockModel, 'blockModel');
      this.blockModel.gridSize = this.gridSize;

      this._updateHoverover();
    },

    tick: function() {
      if (!this.grid._started) {
        return;
      }

      this._updateCoord();

      if (coord === null) {
        hoverover.visible = false;
        return;
      }

      hoverover.visible = true;
      var halfGridNum = this.gridNum / 2;
      hoverover.position.copy(
        coord.clone()
        .add(new THREE.Vector3(0.5, 0.5, 0.5))
        .sub(new THREE.Vector3(halfGridNum, halfGridNum, halfGridNum))
        .multiplyScalar(this.gridSize)
      );

      var inputState = input.state;

      if (inputState.mousedown(0)) {
        mousehold = true;
      }

      if (inputState.mouseup(0)) {
        mousehold = false;
        lastCoord = null;
      }

      if (inputState.mouseenter || inputState.mouseleave) {
        mousehold = false;
        lastCoord = null;
      }

      if (mousehold) {
        if (!!lastCoord && lastCoord.equals(coord)) {
          return;
        }

        this.blockModel.set(coord.x, coord.y, coord.z, {
          color: this.color
        });

        lastCoord = coord.clone();
      }
    },

    _updateCoord: function() {
      var raycaster = getRaycaster();
      var intersects = raycaster.intersectObject(this.grid.objCollision);
      if (intersects.length === 0) {
        coord = null;
        return;
      }

      var point = intersects[0].point;
      var position = point.clone().sub(camera.position);
      position.setLength(position.length() - 0.01).add(camera.position);
      coord = position.multiplyScalar(1 / this.gridSize);
      var halfGridNum = this.gridNum / 2;
      coord = new THREE.Vector3(
        Math.round(coord.x - 0.5),
        Math.round(coord.y - 0.5),
        Math.round(coord.z - 0.5)
      ).add(new THREE.Vector3(halfGridNum, halfGridNum, halfGridNum));
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