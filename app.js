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
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  camera.rotation.order = 'YXZ';

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xf6f6f6);
  renderer.shadowMapType = THREE.PCFSoftShadowMap;
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

engine.component('cameraController', ['input', require('./components/cameracontroller')]);
engine.component('grid', require('./components/grid'));
engine.component('editor', ['game', 'input', 'camera', require('./components/editor')]);
engine.component('blockModel', require('./components/blockmodel'));
engine.component('firstPersonControl', ['input', require('./components/firstpersoncontrol')]);

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
  engine.pause();
  vex.dialog.open({
    message: 'Save your creation',
    input: '<input id="name-input" value="' + name + '" name="name" type="text" pattern="[a-zA-Z0-9 ]+" placeholder="Name" autocomplete="off" required/><div id="dialog-url">' + formatUrl() + '</div>',
    buttons: [
      $.extend({}, vex.dialog.buttons.YES, {
        text: 'Save'
      }), $.extend({}, vex.dialog.buttons.NO, {
        text: 'Cancel'
      })
    ],
    callback: function(data) {
      engine.pause(false);

      if (data === false) return;

      $.ajax({
        type: "POST",
        url: host + '/save',
        data: JSON.stringify({
          user: user,
          name: $("#name-input").val(),
          data: JSON.stringify(editor.blockModel.serialize())
        }),
        contentType: "application/json; charset=utf-8"
          // dataType: "json"
      }).done(function() {
        window.history.pushState('saved', 'Portal', formatUrl());
        editor.pendingSave = false;
      }).fail(function() {

      });
      $("#name-input").unbind();
    }
  });

  $("#name-input").bind("change paste keyup", function() {
    name = $("#name-input").val();
    $("#dialog-url").html(formatUrl);
  });
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

$('#link-new').click(function() {
  //only redirect if not empty
  if (!editor.empty) {
    window.location = "/";
  }
});

$('#link-undo i').addClass('disabled');
$('#link-redo i').addClass('disabled');

window.onbeforeunload = function() {
  if (editor.pendingSave) {
    return "You will lose any unsaved changes. Are you sure to exit?";
  }
};