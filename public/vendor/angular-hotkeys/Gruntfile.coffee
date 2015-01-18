module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-contrib-uglify'

  grunt.initConfig
    package: grunt.file.readJSON('package.json')

    uglify:
      hotkeys:
        options:
          banner: '/*! <%= package.name %> v<%= package.version %> */'
          sourceMap: true 
          sourceMapName: 'angular-hotkeys.js.map' 
        files:
          'angular-hotkeys.min.js': 'angular-hotkeys.js'

  grunt.registerTask 'default', [
    'uglify:hotkeys'
  ]