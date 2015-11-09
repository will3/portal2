var THREE = require('three');
var $ = require('jquery');
var _ = require('lodash');

var brock = require('./core/engine');
var engine = brock();
var cpr = require('../cpr/cpr.js');

init();
animate();

var camera, scene, renderer, directionalLight;
var depthMaterial, depthTarget, composer;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  camera.rotation.order = 'YXZ';

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xf6f6f6);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapCullFace = THREE.CullFaceBack;

  renderer.shadowMapType = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);

  var ambientLight = new THREE.AmbientLight(0xCCCCCC);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(0.5, 1.0, 0.8);

  directionalLight.shadowCameraNear = -100;
  directionalLight.shadowCameraFar = 100;

  directionalLight.shadowMapWidth = 2048;
  directionalLight.shadowMapHeight = 2048;

  directionalLight.shadowCameraLeft = -64;
  directionalLight.shadowCameraRight = 64;
  directionalLight.shadowCameraTop = 64;
  directionalLight.shadowCameraBottom = -64;

  directionalLight.shadowBias = -0.0001;

  directionalLight.castShadow = true;
  directionalLight.shadowDarkness = 0.2;
  scene.add(directionalLight);
};

var getImageData = true;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  if (getImageData == true) {
    imgData = renderer.domElement.toDataURL();
    getImageData = false;
  }
};

window.addEventListener('resize', function() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

engine.value('scene', scene);
engine.value('camera', camera);
engine.value('game', engine);
engine.value('light', directionalLight);
engine.value('renderer', renderer);

engine.system('input', brock.input(engine, renderer.domElement));
var collision = engine.system('collision', brock.collision());

engine.component('cameraController', ['input', require('./components/cameracontroller')]);
engine.component('grid', require('./components/grid'));
engine.component('editor', ['game', 'input', 'camera', 'light', require('./components/editor')]);
engine.component('blockModel', require('./components/blockmodel'));
engine.component('ground', ['game', 'collision', require('./components/ground')]);

engine.component('character', ['game', 'collision', 'editor', 'input', require('./components/character')]);
engine.component('blockBody', require('./components/bodies/block'));

var object = new THREE.Object3D();
var editor = engine.attach(object, 'editor');
engine.value('editor', editor);
scene.add(object);

var object = new THREE.Object3D();
object.position.y = 10;
scene.add(object);
engine.attach(object, 'character');

collision.addHitTest(require('./hittest/hittest_point_n_block')(editor));

var palette = require('./palette');

//default to first palette
editor.setColor(new THREE.Color(palette[0]).getHex());

window.onbeforeunload = function() {
  if (editor.pendingSave) {
    return "You will lose any unsaved changes. Are you sure to exit?";
  }
};

//init color picker
cpr({
  palette: palette,
  click: function(color) {
    editor.setColor(parseInt('0x' + color.toHex()));
  },
  focus: function() {
    engine.pause();
  },
  blur: function() {
    engine.pause(false);
  }
});

//init nav bar
$('#link-share').click(function() {
  var data = JSON.stringify(editor.blockModel.serialize());
  var blob = new Blob([data], {
    type: "text/plain;charset=utf-8"
  });
  saveAs(blob, "blocks.br");
});

$('#link-open').click(function() {
  $('#fileinput').trigger('click');
});

editor.on('commands', function(commands, redos) {
  if (commands.length === 0) {
    $('#link-undo i').addClass('disabled');
  } else {
    $('#link-undo i').removeClass('disabled');
  }

  if (redos.length === 0) {
    $('#link-redo i').addClass('disabled');
  } else {
    $('#link-redo i').removeClass('disabled');
  }
});

$('#link-undo').click(function() {
  editor.undo();
});

$('#link-redo').click(function() {
  editor.redo();
});

$('#link-undo i').addClass('disabled');
$('#link-redo i').addClass('disabled');

if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
  alert('The File APIs are not fully supported in this browser.');
  return;
}

var input = $('#fileinput');

input.on('change', function() {
  var file = document.getElementById("fileinput").files[0];
  if (file === undefined) {
    return;
  }
  var filename = file.name;

  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onload = function(evt) {
    editor.load(evt.target.result);
  }
  reader.onerror = function(evt) {
    console.log("error reading file");
  }
});

//export editor to global
window.portal = {
  editor: editor
};