var THREE = require('three');
var setCommand = require('./commands/set');
var groupCommand = require('./commands/group');
var EventDispatcher = require('../core/engine').eventDispatcher;

module.exports = function(game, input, camera, light) {

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

  var initDragState = function() {
    return {
      startCoord: null,
      endCoord: null,
      command: null,
      startY: 0,
      button: 0
    };
  };

  //intersect coord for ground object
  var coordGround = null;

  //intersect coord on chunk, used for removing blocks
  var coordChunk = null;

  //intersect coord above chunk, used for adding blocks
  var coordAbove = null;

  //hoverover object
  var hoverover = null;

  //obj for block model
  var objBlockModel = new THREE.Object3D();

  //obj for ground
  var objGround = new THREE.Object3D();

  //commands
  var commands = [];

  //redos
  var redos = [];

  //ground component
  var ground = null;

  //drag state, for commands that uses drag
  var dragState = initDragState();

  var cameraController;

  var editor = {
    blockModel: null,
    gridSize: 2,
    gridNum: 32,
    color: 0x000000,
    clickTime: 200,
    pendingSave: false,
    empty: true,
    showShadows: true,

    setShowShadows: function(value) {
      if (this.showShadows !== value) {
        this.showShadows = value;

        light.shadowDarkness = this.showShadows ? 0.2 : 0;
      }
    },

    get commands() {
      return commands;
    },

    resetBlockModel: function() {
      this.blockModel.reset();
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

      this.emit('commands', commands, redos);
    },

    redo: function() {
      if (redos.length > 0) {
        var last = redos[redos.length - 1];
        last.run();
        redos.pop();
        commands.push(last);
      }

      this.emit('commands', commands, redos);
    },

    start: function() {
      var offset = -this.gridSize * this.gridNum / 2;
      this.object.add(objBlockModel);
      this.blockModel = game.attach(objBlockModel, 'blockModel');
      this.blockModel.gridSize = this.gridSize;
      this.blockModel.castShadow = true;
      this.blockModel.receiveShadow = true;

      this.object.add(objGround);
      ground = game.attach(objGround, 'ground');
      ground.start();
      ground._started = true;

      this._updateHoverover();
      cameraController = game.attach(camera, 'cameraController');
      cameraController.disableKeys = true;
    },

    load: function(data) {
      this.resetBlockModel();
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

      this._updateCoordGround();
      this._updateCoordChunk();
      this._updateHoveroverPosition();
      this._updateInput();
    },

    _updateInput: function() {
      var inputState = input.state;

      if (inputState.keyhold('space')) {
        return;
      }

      // dragState.endCoord = 

      if (inputState.mousehold(0) || inputState.mousehold(2)) {
        var holdButton = inputState.mousehold(0) ? 0 : 2;

        var coordToUse = holdButton === 0 ?
          (coordAbove || coordGround) :
          (coordChunk || coordGround);

        if (!!coordToUse) {
          if (holdButton != dragState.button) {
            dragState = initDragState();
          }

          if (dragState.startCoord === null) {
            dragState.startCoord = coordToUse.clone();
            dragState.endCoord = coordToUse.clone();
            dragState.startY = coordToUse.y;
            dragState.button = holdButton;
          } else {
            var groundCoord = this._getGroundCoord(dragState.startY);
            if (!!groundCoord) {
              dragState.endCoord = groundCoord;
            }
          }

          if (dragState.command !== null) {
            dragState.command.updateCoords(dragState.startCoord, dragState.endCoord);
          } else {
            dragState.command = groupCommand({
              blockModel: this.blockModel,
              startCoord: dragState.startCoord,
              endCoord: dragState.endCoord,
              value: holdButton === 2 ? undefined : {
                color: this.color
              }
            });
            this._runCommand(dragState.command);
          }
        }
      }

      if (inputState.mouseup()) {
        dragState = initDragState();
      }

      if (inputState.keydown('g')) {
        ground.setVisible(!ground.visible);
      }

      if (inputState.keydown('/')) {
        this.setShowShadows(!this.showShadows);
      }

      if (inputState.keydown('l')) {
        cameraController.disableKeys = !cameraController.disableKeys;
      }
    },

    _updateHoveroverPosition: function() {
      hoverover.visible = false;
      return;
      var coordToUse = coordAbove || coordGround;

      if (!coordToUse) {
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

    _getGroundCoord: function(y, size) {
      var raycaster = getRaycaster();
      var intersects;

      intersects = raycaster.intersectObject(this._getGroundPlane(y, ground.size));

      if (intersects.length === 0) {
        coordGround = null;
        return;
      }

      var point = intersects[0].point;
      var position = point.clone().sub(camera.position);
      position.setLength(position.length() - 0.01).add(camera.position);
      return this.posToCoord(position);
    },

    posToCoord: function(pos) {
      pos = pos.clone().multiplyScalar(1 / this.gridSize);
      return new THREE.Vector3(
        Math.round(pos.x - 0.5),
        Math.round(pos.y - 0.5),
        Math.round(pos.z - 0.5));
    },

    coordToPos: function(coord) {
      return coord.clone()
        .add(new THREE.Vector3(0.5, 0.5, 0.5))
        .multiplyScalar(this.gridSize);
    },

    _getGroundPlane: function(y, size) {
      geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(-size, y * this.gridSize, -size),
        new THREE.Vector3(size, y * this.gridSize, -size),
        new THREE.Vector3(size, y * this.gridSize, size),
        new THREE.Vector3(-size, y * this.gridSize, size)
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

    _updateCoordGround: function() {
      var raycaster = getRaycaster();
      var intersects = raycaster.intersectObject(ground.blockModel.obj, true);
      if (intersects.length === 0) {
        coordGround = null;
        return;
      }

      var point = intersects[0].point;
      var diff = point.clone().sub(camera.position);

      var positionAbove = diff.clone().setLength(diff.length() - 0.01).add(camera.position);
      positionAbove.multiplyScalar(1 / this.gridSize);

      coordGround = new THREE.Vector3(
        Math.round(positionAbove.x - 0.5),
        Math.round(positionAbove.y - 0.5),
        Math.round(positionAbove.z - 0.5));
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
      this.emit('commands', commands, redos);
      this.pendingSave = true;
      this.empty = false;
    },

    dispose: function() {
      disposeList.forEach(function(obj) {
        obj.dispose();
      });
    }
  };

  EventDispatcher.prototype.apply(editor);

  return editor;
};