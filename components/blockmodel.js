var ndarray = require('ndarray');
var _ = require('lodash');
var THREE = require('three');

var mesher = require('../voxel/mesher');

module.exports = function() {
  var colors = [null];
  var dirty = false;
  var mesh = null;
  var chunks = {};

  return {
    size: 16,
    gridSize: 2,
    obj: null,

    getChunk: function(x, y, z) {
      var origin = new THREE.Vector3(Math.floor(x), Math.floor(y), Math.floor(z));
      var id = [origin.x, origin.y, origin.z].join(',');

      if (chunks[id] === undefined) {
        chunks[id] = {
          origin: origin,
          map: ndarray([], [this.size, this.size, this.size]),
          dirty: false,
          mesh: null
        };
      }
      return chunks[id];
    },

    set: function(x, y, z, block) {
      var color = block.color;
      var index = _.findIndex(colors, color);
      if (index === -1) {
        colors.push(color);
        index = colors.length - 1;
      }

      var chunk = this.getChunk(x, y, z);
      var origin = chunk.origin;
      chunk.map.set(x - origin.x, y - origin.y, z - origin.z, index);
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
      for (var id in chunks) {
        var chunk = chunks[id];
        if (chunk.mesh !== null) {
          chunk.geometry.dispose();
          chunk.material.dispose();
        }
      }
      this.object.remove(this.obj);
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
      chunk.mesh = mesh;

      var origin = chunk.origin.clone();
      origin.multiplyScalar(this.gridSize);
      mesh.position.copy(origin);

      this.obj.add(mesh);
    }
  };
};