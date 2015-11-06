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
  var hoverover = null;
  var objBlockModel = new THREE.Object3D();
  var mousehold = false;
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
    tool: 'add',
    pendingSave: false,
    empty: true,

    get commands() {
      return commands;
    },

    setTool: function(value) {
      if (this.tool !== value) {
        this.tool = value;
        this._updateHoverover();
      }
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
        if (this.tool === 'add') {
          if (mousehold && coord !== null) {
            //if no last coord, or last coord is different from coord
            if (!lastCoord || !lastCoord.equals(coord)) {
              var command = setCommand(this.blockModel, coord, {
                color: this.color
              });
              this._runCommand(command);
              lastCoord = coord.clone();
            }
          }
        } else if (this.tool === 'remove') {
          if (mousehold && coordChunk !== null) {
            var command = setCommand(this.blockModel, coordChunk, null, undefined);
            this._runCommand(command);
          }
        }

        if (inputState.keydown('g')) {
          //toggle grid
          this.grid.setVisible(!this.grid.visible);
        }
      } else if (this.mode === 'firstPerson') {
        if (this.tool === 'add') {
          if (mouseclick && coord !== null) {
            var command = setCommand(this.blockModel, coord, {
              color: this.color
            });
            this._runCommand(command);
          }
        } else if (this.tool === 'remove') {
          if (mouseclick && coordChunk !== null) {
            var command = setCommand(this.blockModel, coordChunk, null, undefined);
            this._runCommand(command);
          }
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
      var coordToUse = this.tool === 'add' ? coord : coordChunk;

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
        return;
      }

      var point = intersects[0].point;
      var position = point.clone().sub(camera.position);
      position.setLength(position.length() + 0.01).add(camera.position);
      position.multiplyScalar(1 / this.gridSize);
      coordChunk = new THREE.Vector3(
        Math.round(position.x - 0.5),
        Math.round(position.y - 0.5),
        Math.round(position.z - 0.5));
    },

    _updateHoverover: function() {
      if (hoverover !== null) {
        this.object.remove(hoverover);
      }

      var geometry = new THREE.BoxGeometry(this.gridSize, this.gridSize, this.gridSize);
      var cube = new THREE.Mesh(geometry);

      var hoveroverColor;
      if (this.tool === 'add') {
        hoveroverColor = new THREE.Color(this.color).offsetHSL(0, 0, -0.3).getHex();
      } else {
        hoveroverColor = 0x000000;
      }

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