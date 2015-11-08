var THREE = require('three');
var $ = require('jquery');
var _ = require('lodash');

var brock = require('./src/core/engine');
var engine = brock();
var cpr = require('./cpr/cpr.js');

init();
animate();

var camera, scene, renderer;
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
  // renderer.shadowMapType = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  var ambientLight = new THREE.AmbientLight(0xCCCCCC);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(0.5, 1.0, 0.8);
  // directionalLight.castShadow = true;
  // directionalLight.shadowDarkness = 0.5;
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

engine.value('scene', scene);
engine.value('camera', camera);
engine.value('game', engine);

engine.system('input', brock.input(engine, renderer.domElement));

engine.component('cameraController', ['input', require('./src/components/cameracontroller')]);
engine.component('grid', require('./src/components/grid'));
engine.component('editor', ['game', 'input', 'camera', require('./src/components/editor')]);
engine.component('blockModel', require('./src/components/blockmodel'));
engine.component('firstPersonControl', ['input', require('./src/components/firstpersoncontrol')]);
engine.component('ground', ['game', require('./src/components/ground')]);

//load data from hidden div
var formdata = JSON.parse($('#data').html() || {});
var embedded = formdata.data || {};

var object = new THREE.Object3D();
var editor = engine.attach(object, 'editor');
if (embedded.length > 0) {
  editor.embedded = embedded;
}
scene.add(object);

var palette = require('./palette');

//default to first palette
editor.setColor(new THREE.Color(palette[0]).getHex());

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

var host = 'http://localhost:3000';
// var host = 'http://172.17.12.114:3000';
var user = formdata.user || 'demo';
var name = formdata.name || '';

var formatUrl = function() {
  return host + '/v/' + escape(user) + '/' + escape(name);
};

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

$("#name-input").bind("change paste keyup", function() {
  name = $("#name-input").val();
  $("#dialog-url").html(formatUrl);
});

editor.commandsChanged(function(commands, redos) {
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

window.onbeforeunload = function() {
  if (editor.pendingSave) {
    return "You will lose any unsaved changes. Are you sure to exit?";
  }
};

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

if (user === 'gallery') {
  var galleryIndex = 0;
  $('#right').click(function() {
    galleryIndex++;
    if (galleryIndex === gallery.length) {
      galleryIndex = 0;
    }
    reloadGallery();
  });

  $('#left').click(function() {
    galleryIndex--;
    if (galleryIndex === -1) {
      galleryIndex = gallery.length - 1;
    }
    reloadGallery();
  });

  var reloadGallery = function() {
    editor.resetBlockModel();
    loadVox(gallery[galleryIndex]);
  };

  var vox = require('vox.js');
  var parser = new vox.Parser();
  var loadVox = function(path) {
    parser.parse('/vox/' + path).then(function(voxelData) {
      var palette = _.map(voxelData.palette, function(c) {

        //todo r
        var color = new THREE.Color(c.r / 256.0, c.g / 256.0, c.b / 256.0).getHex();
        return color;
      });

      var center = voxelData.size;
      center.x = Math.round(center.x / 2);
      center.y = Math.round(center.y / 2);
      center.z = Math.round(center.z / 2);

      voxelData.voxels.forEach(function(b) {
        editor.blockModel.set(b.x - center.x, b.z, b.y - center.y, {
          color: palette[b.colorIndex]
        });
      });
    }).catch(function(err) {
      console.log(err);
    });
  }

  var gallery = [
    'biome.vox',
    'box.vox',
    'chr_fox.vox',
    'chr_gumi.vox',
    'chr_jp.vox',
    'chr_knight.vox',
    'chr_man.vox',
    'chr_old.vox',
    'chr_rain.vox',
    'chr_sword.vox',
    'church.vox',
    'colors.vox',
    'ephtracy.vox',
    'monu.vox',
    'monu9.vox',
    'teapot.vox'
  ];

  reloadGallery();
} else {
  $('#left').hide();
  $('#right').hide();
}