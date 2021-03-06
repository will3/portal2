var ndarray = require('ndarray');
var _ = require('lodash');
var THREE = require('three');

var mesher = require('../voxel/mesher');

module.exports = function() {
  var colors = [null];
  var chunks = {};

  return {
    //chunk size used for meshing
    chunkSize: 16,

    //size of 1 grid
    gridSize: 2,

    //obj used to contain chunk meshes
    obj: null,

    //if the model casts shadow
    castShadow: false,

    //if the model receives shadow
    receiveShadow: false,

    //clears chunks, palette and scene object
    reset: function() {
      this._disposeChunk();
      this.object.remove(this.obj);
      this.obj = new THREE.Object3D();
      this.object.add(this.obj);
      chunks = {};
      colors = [null];
    },

    //given a coord, return a chunk, create new chunk if doesn't exist
    //query: if true, don't create new chunks when not found, defaults to false
    getChunk: function(x, y, z, query) {
      query = query || false;

      var origin = new THREE.Vector3(
        Math.floor(x / this.chunkSize),
        Math.floor(y / this.chunkSize),
        Math.floor(z / this.chunkSize)
      );
      var id = [origin.x, origin.y, origin.z].join(',');
      origin.multiplyScalar(this.chunkSize);

      if (chunks[id] === undefined) {
        if (query) {
          return undefined;
        }

        chunks[id] = {
          origin: origin,
          map: ndarray([], [this.chunkSize, this.chunkSize, this.chunkSize]),
          dirty: false,
          mesh: null
        };
      }
      return chunks[id];
    },

    //gets the raw value in map
    getRaw: function(x, y, z) {
      var chunk = this.getChunk(x, y, z, true);
      if (chunk === undefined) {
        return undefined;
      }
      var origin = chunk.origin;
      return chunk.map.get(x - origin.x, y - origin.y, z - origin.z);
    },

    //sets block object for a coord
    set: function(x, y, z, block) {
      var color = block.color;
      var index = _.indexOf(colors, color);
      if (index === -1) {
        colors.push(color);
        index = colors.length - 1;
      }

      var chunk = this.getChunk(x, y, z);
      var origin = chunk.origin;
      chunk.map.set(x - origin.x, y - origin.y, z - origin.z, index);
      chunk.dirty = true;
    },

    //sets raw value for a coord
    setRaw: function(x, y, z, raw) {
      var chunk = this.getChunk(x, y, z);
      var origin = chunk.origin;
      chunk.map.set(x - origin.x, y - origin.y, z - origin.z, raw);
      chunk.dirty = true;
    },

    start: function() {
      this.obj = new THREE.Object3D();
      this.object.add(this.obj);
    },

    tick: function() {
      for (var id in chunks) {
        var chunk = chunks[id];
        if (chunk.dirty) {
          this._updateChunk(chunk);
          chunk.dirty = false;
        }
      }
    },

    dispose: function() {
      this._disposeChunk();
      this.object.remove(this.obj);
    },

    serialize: function() {
      var d = {};

      for (var id in chunks) {
        var chunk = chunks[id];
        var data = chunk.map.data;
        var shape = chunk.map.shape;

        for (var i = 0; i < shape[0]; i++) {
          for (var j = 0; j < shape[1]; j++) {
            for (var k = 0; k < shape[2]; k++) {
              var b = chunk.map.get(i, j, k);
              if (b === 0 || b === undefined || b === null) {
                continue;
              }

              var pos = [
                i + chunk.origin.x,
                j + chunk.origin.y,
                k + chunk.origin.z
              ];

              d[pos.join(',')] = b;
            }
          }
        }
      }

      return {
        gridSize: this.gridSize,
        size: this.chunkSize,
        colors: colors,
        data: d
      };
    },

    deserialize: function(json) {
      this._disposeChunk();
      chunks = {};

      if (json.gridSize !== undefined) this.gridSize = json.gridSize;
      if (json.size !== undefined) this.chunkSize = json.size;
      if (json.colors !== undefined) colors = json.colors;

      for (var id in json.data) {
        var pos = id.split(',');
        this.setRaw(parseInt(pos[0]), parseInt(pos[1]), parseInt(pos[2]), json.data[id]);
      }
    },

    _updateChunk: function(chunk) {
      var mesh = chunk.mesh;
      var map = chunk.map;

      if (mesh !== null) {
        this.obj.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }

      var result = mesher(map.data, map.shape);

      var geometry = new THREE.Geometry();
      var gridSize = this.gridSize;

      geometry.vertices = _.map(result.vertices, function(v) {
        var vertice =
          new THREE.Vector3(v[0], v[1], v[2])
          .multiplyScalar(gridSize);
        return vertice;
      });

      geometry.faces = _.map(result.faces, function(f) {
        var face = new THREE.Face3(f[0], f[1], f[2]);
        face.color = new THREE.Color(colors[f[3]]);
        return face;
      });

      geometry.computeFaceNormals();

      var material = new THREE.MeshLambertMaterial({
        vertexColors: true
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = this.castShadow;
      mesh.receiveShadow = this.receiveShadow;
      chunk.mesh = mesh;

      var origin = chunk.origin.clone();
      origin.multiplyScalar(this.gridSize);
      mesh.position.copy(origin);

      this.obj.add(mesh);
    },

    _disposeChunk: function() {
      for (var id in chunks) {
        var chunk = chunks[id];
        if (chunk.mesh !== null) {
          chunk.mesh.geometry.dispose();
          chunk.mesh.material.dispose();
        }
      }
    }
  };
};