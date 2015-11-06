var THREE = require('three');
var setCommand = require('./commands/set');

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
  var coordChunk = null;
  var coordAbove = null;
  var hoverover = null;
  var objBlockModel = new THREE.Object3D();
  var lastCoord = null;
  var cameraComponent = null;
  var lastMousedown = 0;
  var commands = [];
  var redos = [];
  var commandsListeners = [];

  var notifyCommandsChanged = function() {
    commandsListeners.forEach(function(l) {
      l(commands, redos);
    });
  };

  return {
    embedded: null,
    grid: null,
    blockModel: null,
    gridSize: 2,
    gridNum: 32,
    color: 0x000000,
    clickTime: 200,
    mode: 'grid',
    pendingSave: false,
    empty: true,

    get commands() {
      return commands;
    },

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

    undo: function() {
      if (commands.length > 0) {
        var last = commands[commands.length - 1];
        last.undo();
        commands.pop();
        redos.push(last);
      }

      notifyCommandsChanged();
    },

    redo: function() {
      if (redos.length > 0) {
        var last = redos[redos.length - 1];
        last.run();
        redos.pop();
        commands.push(last);
      }

      notifyCommandsChanged();
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

      if (this.embedded !== null) {
        this.empty = false;
        //try deserialize
        try {
          this.blockModel.deserialize(JSON.parse(this.embedded));
        } catch (err) {
          //show error
          console.log(err);
        }
      }
    },

    tick: function() {
      if (!this.grid._started) {
        return;
      }

      this._updateCoord();
      this._updateCoordChunk();
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

      var space = inputState.keyhold('space');
      // var mousehold = inputState.mousehold(0) && !space;
      // var mousehold2 = inputState.mousehold(2) && !space;

      if (inputState.mouseclick(0)) {
        var coordToUse = coordAbove || coord;
        if (!!coordToUse) {
          var command = setCommand(this.blockModel, coordToUse, {
            color: this.color
          });
          this._runCommand(command);
        }
      } else if (inputState.mouseclick(2)) {
        if (!!coordChunk) {
          var command = setCommand(this.blockModel, coordChunk, null, undefined);
          this._runCommand(command);
        }
      }

      //update add block
      // if (this.mode === 'grid') {
      //   // if (this.tool === 'add') {
      //   if (mousehold && coord !== null) {
      //     //if no last coord, or last coord is different from coord
      //     if (!lastCoord || !lastCoord.equals(coord)) {

      //       lastCoord = coord.clone();
      //     }
      //   }
      //   // } else if (this.tool === 'remove') {
      //   else if (mousehold2 && coordChunk !== null) {

      //   }
      //   // }

      //   if (inputState.keydown('g')) {
      //     //toggle grid
      //     this.grid.setVisible(!this.grid.visible);
      //   }
      // }

      // else if (this.mode === 'firstPerson') {
      //   if (this.tool === 'add') {
      //     if (mouseclick && coord !== null) {
      //       var command = setCommand(this.blockModel, coord, {
      //         color: this.color
      //       });
      //       this._runCommand(command);
      //     }
      //   } else if (this.tool === 'remove') {
      //     if (mouseclick && coordChunk !== null) {
      //       var command = setCommand(this.blockModel, coordChunk, null, undefined);
      //       this._runCommand(command);
      //     }
      //   }
      // }

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
      // var coordToUse = this.tool === 'add' ? coord : coordChunk;
      var coordToUse = coordAbove || coord;

      if (coordToUse === null) {
        hoverover.visible = false;
        return;
      }

      hoverover.visible = true;
      hoverover.position.copy(
        coordToUse.clone()
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
      position.multiplyScalar(1 / this.gridSize);
      coord = new THREE.Vector3(
        Math.round(position.x - 0.5),
        Math.round(position.y - 0.5),
        Math.round(position.z - 0.5));
    },

    _updateCoordChunk: function() {
      var raycaster = getRaycaster();
      var intersects = raycaster.intersectObject(this.blockModel.obj, true);
      if (intersects.length === 0) {
        coordChunk = null;
        coordAbove = null;
        return;
      }

      var point = intersects[0].point;
      var diff = point.clone().sub(camera.position);

      var position = diff.clone().setLength(diff.length() + 0.01).add(camera.position);
      position.multiplyScalar(1 / this.gridSize);
      coordChunk = new THREE.Vector3(
        Math.round(position.x - 0.5),
        Math.round(position.y - 0.5),
        Math.round(position.z - 0.5));

      var positionAbove = diff.clone().setLength(diff.length() - 0.01).add(camera.position);
      positionAbove.multiplyScalar(1 / this.gridSize);

      coordAbove = new THREE.Vector3(
        Math.round(positionAbove.x - 0.5),
        Math.round(positionAbove.y - 0.5),
        Math.round(positionAbove.z - 0.5));
    },

    _updateHoverover: function() {
      if (hoverover !== null) {
        this.object.remove(hoverover);
      }

      var geometry = new THREE.BoxGeometry(this.gridSize, this.gridSize, this.gridSize);
      var cube = new THREE.Mesh(geometry);

      var hoveroverColor = new THREE.Color(this.color).offsetHSL(0, 0, -0.3).getHex();

      var edges = new THREE.EdgesHelper(cube, hoveroverColor);
      toDispose(edges.geometry);
      toDispose(edges.material);
      var object = new THREE.Object3D();
      object.add(edges);
      geometry.dispose();

      hoverover = object;
      this.object.add(hoverover);
    },

    _runCommand: function(command) {
      command.run();
      commands.push(command);
      redos = [];
      notifyCommandsChanged();
      this.pendingSave = true;
      this.empty = false;
    },

    dispose: function() {
      disposeList.forEach(function(obj) {
        obj.dispose();
      });
      commandsListeners = null;
    },

    commandsChanged: function(callback) {
      commandsListeners.push(callback);
    }
  };
};