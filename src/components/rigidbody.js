var THREE = require('three');

module.exports = function() {
  return {
    velocity: new THREE.Vector3(),
    acceleration: new THREE.Vector3(),
    friction: 0.98,
    mass: 1,

    tick: function() {
      this.velocity.add(this.acceleration);
      this.velocity.multiplyScalar(this.friction);
      this.object.position.add(this.velocity);
      this.acceleration.set(0, 0, 0);
    },

    applyForce: function(force) {
      if (this.mass === 0) return;
      this.acceleration.add(force.clone().multiplyScalar(1 / this.mass));
    }
  };
};