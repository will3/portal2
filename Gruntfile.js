module.exports = function(grunt) {

  grunt.initConfig({
    clean: ['public'],

    copy: {
      main: {
        files: [{
          expand: true,
          flatten: true,
          src: [
            'bower_components/three.js/three.min.js',
            'bower_components/jquery/dist/jquery.min.js',
            'bower_components/lodash/lodash.min.js',
            'bower_components/vex/js/*.js',
            'src/bundle.js',
            'src/gallery.js',
            'src/terrian.js',
            'vendor/*.js',
          ],
          dest: 'public/js'
        }, {
          expand: true,
          flatten: true,
          src: [
            'css/*',
            'bower_components/font-awesome/css/font-awesome.min.css',
            'bower_components/vex/css/*.css',
            'cpr/cpr.css'
          ],
          dest: 'public/css'
        }, {
          expand: true,
          flatten: true,
          src: ['bower_components/font-awesome/fonts/*'],
          dest: 'public/fonts'
        }, {
          expand: true,
          flatten: true,
          src: ['images/*'],
          dest: 'public/images'
        }, {
          expand: true,
          flatten: true,
          src: ['vox/*'],
          dest: 'public/vox'
        }]
      }
    },

    watch: {
      main: {
        files: ['bower_components/*', 'css/*', 'cpr/*', '*.html', '*.js', 'src/bundle.js', 'src/**/*.js'],
        tasks: ['clean', 'copy']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-execute');

  grunt.registerTask('default', ['clean', 'copy', 'watch']);
};