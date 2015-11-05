var ndarray = require('ndarray');
var _ = require('lodash');
var THREE = require('three');

var mesher = require('../voxel/mesher');

module.exports = function() {
  var map = null;
  var colors = [null];
  var dirty = false;
  var mesh = null;

  return {
    size: 16,
    gridSize: 2,

    set: function(x, y, z, block) {
      var color = block.color;
      var index = _.findIndex(colors, color);
      if (index === -1) {
        colors.push(color);
        index = colors.length - 1;
      }

      map.set(x, y, z, index);
      dirty = true;
    },

    serialize: function() {
      var colors = [];
      var data = map.data;
      var shape = map.shape;
      var d = {};
      for (var i in data) {
        d[i] = data[i];
      }
      return {
        colors: colors,
        d: d,
        size: this.size
      };
    },

    deserialize: function(data) {
      colors = data.colors;
      var size = data.size;
      map = ndarray([], [size, size, size]);
      for (var i in data) {
        map.data[i] = data[i];
      }
    },

    start: function() {
      map = ndarray([], [this.size, this.size, this.size]);
      this._updateMesh();
    },

    tick: function() {
      if (dirty) {
        this._updateMesh();
        dirty = false;
      }
    },

    _updateMesh: function() {
      if (mesh !== null) {
        this.object.remove(mesh);
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
      // geometry.computeVertexNormals();

      var material = new THREE.MeshLambertMaterial({
        vertexColors: true
      });

      mesh = new THREE.Mesh(geometry, material);

      this.object.add(mesh);
    }
  };
};