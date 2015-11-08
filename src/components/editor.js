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
  var objGround = new THREE.Object3D();
  var lastCoord = null;
  var cameraComponent = null;
  var lastMousedown = 0;
  var commands = [];
  var redos = [];
  var commandsListeners = [];
  // var ground = null;

  var notifyCommandsChanged = function() {
    commandsListeners.forEach(function(l) {
      l(commands, redos);
    });
  };

  return {
    grid: null,
    blockModel: null,
    gridSize: 2,
    gridNum: 32,
    color: 0x000000,
    clickTime: 200,
    pendingSave: false,
    empty: true,
    embedded: null,

    get commands() {
      return commands;
    },

    resetBlockModel: function() {
      game.dettach(objBlockModel, this.blockModel);
      this.blockModel = game.attach(objBlockModel, 'blockModel');
      this.blockModel.gridSize = this.gridSize;
      this.blockModel.castShadow = true;
      this.blockModel.receiveShadow = true;
    },

    setColor: function(value) {
      this.color = value;

      this._updateHoverover();
      hoverover.visible = false;
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
      // this.grid = game.attach(this.object, 'grid');
      // this.grid.gridSize = this.gridSize;
      // this.grid.num = this.gridNum;

      var offset = -this.gridSize * this.gridNum / 2;
      this.object.add(objBlockModel);
      this.blockModel = game.attach(objBlockModel, 'blockModel');
      this.blockModel.gridSize = this.gridSize;
      this.blockModel.castShadow = true;
      this.blockModel.receiveShadow = true;

      this.object.add(objGround);
      ground = game.attach(objGround, 'ground');

      this._updateHoverover();
      cameraComponent = game.attach(camera, 'cameraController');

      if (this.embedded !== null) {
        this.empty = false;
        this.load(this.embedded);
      }
    },

    load: function(data) {
      //try deserialize
      try {
        this.blockModel.deserialize(JSON.parse(data));
      } catch (err) {
        //show error
        console.log(err);
        alert('There was an error parsing the file');
      }
    },

    tick: function() {
      if (!this.blockModel._started) {
        return;
      }

      this._updateCoord();
      this._updateCoordChunk();
      this._updateHoveroverPosition();
      this._updateInput();

    },

    _updateInput: function() {
      var inputState = input.state;

      // var space = inputState.keyhold('space');
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

      if (inputState.keydown('g')) {
        // this.grid.setVisible(!this.grid.visible);
        ground.setVisible(!ground.visible);
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

      intersects = raycaster.intersectObject(this._getGroundPlane(0, 88888));

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

    _getGroundPlane: function(y, size) {
      geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(-size, 0, -size),
        new THREE.Vector3(size, 0, -size),
        new THREE.Vector3(size, 0, size),
        new THREE.Vector3(-size, 0, size)
      );

      geometry.faces.push(
        new THREE.Face3(0, 2, 1),
        new THREE.Face3(2, 0, 3)
      );

      var material = new THREE.MeshBasicMaterial({
        color: 0xff0000
      });

      return new THREE.Mesh(geometry, material);
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