module.exports = function(grunt) {

  grunt.initConfig({
    copy: {
      main: {
        files: [{
          expand: true,
          flatten: true,
          src: [
            'bower_components/three.js/three.min.js',
            'bower_components/jquery/dist/jquery.min.js',
            'bower_components/lodash/lodash.min.js'
          ],
          dest: 'public/js'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['copy']);

};