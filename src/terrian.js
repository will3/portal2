var portal = window.portal;
var engine = portal.engine;
var scene = portal.scene;
var ground = portal.components.ground;
var editor = portal.editor;

engine.component('ground', ['game', 'collision', ground]);

var object = new THREE.Object3D();
object.position.y = 10;
scene.add(object);
engine.attach(object, 'character');

editor.setDisableCameraKeys(true);