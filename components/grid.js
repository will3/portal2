var THREE = require('three');

module.exports = function() {
  var disposeList = [];

  var toDispose = function(obj) {
    disposeList.push(obj)
    return obj;
  };

  return {
    color: 0x333333,
    num: 16,
    gridSize: 2,
    objGrid: null,
    objCollision: null,
    start: function() {
      var minx = 0;
      var maxx = this.num;
      var minz = 0;
      var maxz = this.num;
      var halfx = this.num / 2;
      var halfz = this.num / 2;
      var gridSize = this.gridSize;

      var object = new THREE.Object3D();

      var material = toDispose(new THREE.LineDashedMaterial({
        color: this.color,
        gapSize: this.gridSize * 0.2,
        dashSize: this.gridSize * 0.4,
      }));

      for (var x = 0; x <= this.num; x++) {
        var geometry = toDispose(new THREE.Geometry());
        geometry.vertices.push(
          new THREE.Vector3(x - halfx, 0, minz - halfz),
          new THREE.Vector3(x - halfx, 0, maxz - halfz)
        );
        geometry.vertices.forEach(function(v) {
          v.multiplyScalar(gridSize);
        });
        geometry.computeLineDistances();

        var line = new THREE.Line(geometry, material);
        object.add(line);
      }

      for (var z = 0; z <= this.num; z++) {
        var geometry = toDispose(new THREE.Geometry());
        geometry.vertices.push(
          new THREE.Vector3(minx - halfx, 0, z - halfz),
          new THREE.Vector3(maxx - halfx, 0, z - halfz)
        );
        geometry.vertices.forEach(function(v) {
          v.multiplyScalar(gridSize);
        });
        geometry.computeLineDistances();

        var line = new THREE.Line(geometry, material);
        object.add(line);
      }

      this.object.add(object);

      geometry = toDispose(new THREE.Geometry());
      geometry.vertices.push(
        new THREE.Vector3(minx, 0, minz),
        new THREE.Vector3(maxx, 0, minz),
        new THREE.Vector3(maxx, 0, maxz),
        new THREE.Vector3(minx, 0, maxz)
      );
      geometry.vertices.forEach(function(v) {
        v.sub(new THREE.Vector3(halfx, 0, halfz))
          .multiplyScalar(gridSize);
      });
      geometry.faces.push(
        new THREE.Face3(0, 2, 1),
        new THREE.Face3(2, 0, 3)
      );
      var objCollision = new THREE.Mesh(geometry);

      this.objGrid = object;
      this.objCollision = objCollision;
    },

    dispose: function() {
      disposeList.forEach(function(obj) {
        obj.dispose();
      });
    }
  };
};