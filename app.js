var THREE = require('three');
var $ = require('jquery');

var brock = require('./core/engine');
var engine = brock();
var cpr = require('./cpr/cpr.js');

init();
animate();

var camera, scene, renderer;
var depthMaterial, depthTarget, composer;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xf6f6f6);
  document.body.appendChild(renderer.domElement);

  var ambientLight = new THREE.AmbientLight(0xCCCCCC);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(0.5, 1.0, 0.8);
  scene.add(directionalLight);

  // //depth
  // var depthShader = THREE.ShaderLib["depthRGBA"];
  // var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);
  // depthMaterial = new THREE.ShaderMaterial({
  //   fragmentShader: depthShader.fragmentShader,
  //   vertexShader: depthShader.vertexShader,
  //   uniforms: depthUniforms
  // });
  // depthMaterial.blending = THREE.NoBlending;

  // //post processing

  // composer = new THREE.EffectComposer(renderer);
  // composer.addPass(new THREE.RenderPass(scene, camera));

  // depthTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  //   minFilter: THREE.NearestFilter,
  //   magFilter: THREE.NearestFilter,
  //   format: THREE.RGBAFormat
  // });

  // var effect = new THREE.ShaderPass(THREE.SSAOShader);
  // effect.uniforms['tDepth'].value = depthTarget;
  // effect.uniforms['size'].value.set(window.innerWidth, window.innerHeight);
  // effect.uniforms['cameraNear'].value = camera.near;
  // effect.uniforms['cameraFar'].value = camera.far;
  // effect.renderToScreen = true;
  // composer.addPass(effect);
};

function animate() {
  requestAnimationFrame(animate);

  // scene.overrideMaterial = depthMaterial;
  // renderer.render(scene, camera, depthTarget);

  // scene.overrideMaterial = null;
  // composer.render();
  renderer.render(scene, camera);
};

window.addEventListener('resize', function() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

engine.system('input', brock.input());
engine.value('scene', scene);
engine.value('camera', camera);
engine.value('game', engine);

engine.component('cameraController', ['input', require('./components/cameracontroller')]);
engine.component('grid', require('./components/grid'));
engine.component('editor', ['game', 'input', 'camera', require('./components/editor')]);
engine.component('blockModel', require('./components/blockmodel'));

engine.attach(camera, 'cameraController');

var object = new THREE.Object3D();
var editor = engine.attach(object, 'editor');
scene.add(object);

var palette = require('./palette');

//default to first palette
editor.setColor(new THREE.Color(palette[0]).getHex());

cpr({
  palette: palette,
  click: function(color) {
    editor.setColor(parseInt('0x' + color.toHex()));
  }
});