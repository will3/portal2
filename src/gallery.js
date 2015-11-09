var editor = window.portal.editor;

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
  if (!editor._started) {
    editor.start();
    editor._started = true;
  }

  editor.resetBlockModel();

  loadVox(gallery[galleryIndex]);
};

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
  'chr_fox.vox',
  'chr_gumi.vox',
  'chr_jp.vox',
  'chr_knight.vox',
  'chr_man.vox',
  'chr_old.vox',
  'chr_rain.vox',
  'chr_sword.vox',
  'biome.vox',
  'box.vox',
  'church.vox',
  'colors.vox',
  'ephtracy.vox',
  'monu.vox',
  'monu9.vox',
  'teapot.vox'
];

reloadGallery();