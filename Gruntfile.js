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
            'bower_components/vex/js/*.js'
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
        }]
      }
    },

    watch: {
      main: {
        files: ['bower_components/*', 'css/*', 'Gruntfile.js', 'cpr/*'],
        tasks: ['clean', 'copy']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['clean', 'copy', 'watch']);
};